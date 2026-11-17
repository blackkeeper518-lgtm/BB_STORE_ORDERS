import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";
import { sendMetaMessage } from "./meta";
import { checkChatConnection, fetchChatMessageRows, fetchChatNotificationRows, fetchChatThreadRows, fetchParcelMappingQueue, purgeOldParcels, recordOutgoingChatMessage, supabaseGet, supabasePost } from "./supabase";
import * as db from "./db";

const ownerId = (ctx: { user: { id: number } | null }) => ctx.user?.id ?? 0;
const kind = z.enum(["code", "sql", "workflow", "document", "config", "other"]);
function requireBrowserChatConfig(ctx: { chatSupabaseCredentials?: { url: string; serviceRoleKey: string } }) {
  const credentials = ctx.chatSupabaseCredentials;
  if (!credentials?.url || !credentials.serviceRoleKey) {
    throw new Error("กรอก Chat Supabase URL และ service-role key ใน ROOM 02 ก่อนใช้งานแชท");
  }
  return credentials;
}
async function persistOutgoingChatBestEffort(
  input: Parameters<typeof recordOutgoingChatMessage>[0],
  credentials?: Parameters<typeof recordOutgoingChatMessage>[1],
) {
  try { await recordOutgoingChatMessage(input, credentials); }
  catch (error) { console.error("[chat] outgoing write-back failed after Meta accepted message", error); }
}
async function persistLocalChatBestEffort(input: Parameters<typeof db.saveChatMessage>[0]) {
  try { await db.saveChatMessage(input); }
  catch (error) { console.error("[chat] local audit write skipped after Meta accepted message", error); }
}

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "drakside-system", time: new Date().toISOString() })),

  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { (ctx.res as any).clearCookie(COOKIE_NAME, { maxAge: -1, httpOnly: true, secure: true, sameSite: "none", path: "/" }); return { success: true }; }),
  }),

  chat: router({
    connection: protectedProcedure.query(({ ctx }) => checkChatConnection(requireBrowserChatConfig(ctx))),
    threads: protectedProcedure.query(({ ctx }) => fetchChatThreadRows(requireBrowserChatConfig(ctx))),
    pollNotifications: protectedProcedure.input(z.object({ afterRowId: z.string().regex(/^\d+$/).nullable() })).mutation(({ input, ctx }) => fetchChatNotificationRows(input.afterRowId, requireBrowserChatConfig(ctx))),
    messages: protectedProcedure.input(z.object({ pageId: z.string().min(1), threadId: z.string().min(1) })).query(({ input, ctx }) => fetchChatMessageRows(input, requireBrowserChatConfig(ctx))),
    sendReply: publicProcedure.input(z.object({ pageId: z.string(), pageName: z.string().optional(), portalKey: z.string().optional(), chatLinkKey: z.string().optional(), threadId: z.string(), recipientId: z.string(), text: z.string().optional(), imageUrl: z.string().optional(), imageSendUrl: z.string().optional(), imageUrls: z.array(z.string().url()).max(4).optional(), stickerId: z.string().optional() })).mutation(async ({ input, ctx }) => {
      const credentials = requireBrowserChatConfig(ctx);
      const text = input.text?.trim() || "";
      const imageUrl = input.imageUrl?.trim() || "";
      const imageSendUrl = input.imageSendUrl?.trim() || imageUrl;
      const imageUrls = (input.imageUrls ?? []).map(url => url.trim()).filter(Boolean).slice(0, 4);
      const imagesToSend = imageUrls.length ? imageUrls : (imageSendUrl ? [imageSendUrl] : []);
      const outgoing: Array<{ text?: string; imageUrl?: string; stickerId?: string; result?: Awaited<ReturnType<typeof sendMetaMessage>> }> = [];
      if (text) outgoing.push({ text });
      imagesToSend.forEach(url => outgoing.push({ imageUrl: url }));
      if (!outgoing.length) outgoing.push({ stickerId: input.stickerId });
      let finalResult: Awaited<ReturnType<typeof sendMetaMessage>> | undefined;
      for (const item of outgoing) {
        try {
          const result = await sendMetaMessage({ pageId: input.pageId, recipientId: input.recipientId, text: item.text, imageUrl: item.imageUrl, stickerId: item.stickerId }, credentials);
          item.result = result;
          finalResult = result;
        } catch (error) {
          if (outgoing.some(sent => sent.result)) {
            throw new Error(`ส่งข้อความแล้ว แต่ส่งรูปไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
          }
          throw error;
        }
        const result = finalResult;
        if (!result) throw new Error("Meta did not return a message result");
        void persistOutgoingChatBestEffort({ portalKey: input.portalKey, chatLinkKey: input.chatLinkKey, pageId: input.pageId, pageName: input.pageName, threadId: input.threadId, recipientId: input.recipientId, messageId: result.message_id, text: item.text || (item.imageUrl ? "📷 ส่งรูปภาพ" : undefined) }, credentials);
        void persistLocalChatBestEffort({ pageId: input.pageId, threadId: input.threadId, senderId: input.pageId, senderType: "page", direction: "outbound", text: item.text, attachments: item.imageUrl ? [{ url: item.imageUrl }] : undefined, adminUserId: ctx.user?.id, providerMessageId: result.message_id });
      }
      if (!finalResult) throw new Error("ไม่มีข้อความหรือรูปภาพสำหรับส่ง");
      return finalResult;
    }),
  }),

  parcels: router({
    mappingQueue: adminProcedure.input(z.object({ status: z.enum(["all", "ready", "over24", "over48", "sent"]).default("all"), limit: z.number().int().min(1).max(500).default(300) })).query(({ input }) => fetchParcelMappingQueue({ status: input.status === "sent" ? "sent" : "all", limit: input.limit })),
    purgeExpired: adminProcedure.input(z.object({ confirmation: z.literal("DELETE_PARCELS_OLDER_THAN_3_DAYS") })).mutation(() => purgeOldParcels()),
    sendTracking: adminProcedure.input(z.object({
      pageId: z.string().min(1),
      threadId: z.string().min(1),
      recipientId: z.string().min(1),
      text: z.string().trim().min(1).max(2000),
    })).mutation(async ({ input, ctx }) => {
      const result = await sendMetaMessage(input, requireBrowserChatConfig(ctx));
      await db.saveChatMessage({
        pageId: input.pageId,
        threadId: input.threadId,
        senderId: input.recipientId,
        senderType: "admin",
        direction: "outbound",
        text: input.text,
        adminUserId: ctx.user.id,
      });
      return result;
    }),
  }),

  vault: router({
    verifyAccessCode: publicProcedure.input(z.object({ code: z.string() })).mutation(({ input }) => ({ ok: Boolean(process.env.VAULT_ACCESS_CODE && input.code === process.env.VAULT_ACCESS_CODE) })),
    projects: adminProcedure.query(({ ctx }) => db.listVaultProjects(ownerId(ctx))),
    stats: adminProcedure.query(({ ctx }) => db.getVaultStats(ownerId(ctx))),
    files: adminProcedure.input(z.object({ projectId: z.number(), search: z.string().optional() })).query(({ ctx, input }) => db.listVaultFiles(ownerId(ctx), input.projectId, input.search)),
    file: adminProcedure.input(z.object({ fileId: z.number() })).query(({ ctx, input }) => db.getVaultFile(ownerId(ctx), input.fileId)),
    createProject: adminProcedure.input(z.object({ name: z.string(), description: z.string().optional(), category: z.string().optional() })).mutation(({ ctx, input }) => db.createVaultProject(ownerId(ctx), input)),
    createFile: adminProcedure.input(z.object({ projectId: z.number(), path: z.string(), title: z.string(), language: z.string(), kind, content: z.string() })).mutation(({ ctx, input }) => db.createVaultFile(ownerId(ctx), input)),
    updateFile: adminProcedure.input(z.object({ fileId: z.number(), projectId: z.number(), path: z.string(), title: z.string(), language: z.string(), kind, content: z.string(), isFavorite: z.boolean().optional() })).mutation(({ ctx, input: { fileId, ...input } }) => db.updateVaultFile(ownerId(ctx), fileId, input)),
  }),

  ai: router({ chat: publicProcedure.input(z.object({ messages: z.array(z.unknown()) })).mutation(() => ({ text: "AI endpoint is not configured" })) }),
  delivery: router({
    pending: publicProcedure.input(z.object({ roomKey: z.string().optional() }).optional()).query(async ({ input }) => {
      const filter = input?.roomKey ? `&room_key=eq.${encodeURIComponent(input.roomKey)}` : "";
      return supabaseGet<unknown[]>(`vw_trial_label_delivery_queue?select=*${filter}&order=created_at.asc&limit=100`);
    }),
    claim: publicProcedure.input(z.object({ roomKey: z.string(), worker: z.string().default("vercel") })).mutation(({ input }) => supabasePost<unknown>("rpc/claim_view_order", { p_order_id: Number(input.roomKey) })),
  }),
});

export type AppRouter = typeof appRouter;
