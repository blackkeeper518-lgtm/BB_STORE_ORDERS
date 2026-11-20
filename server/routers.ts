import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { COOKIE_NAME } from "../shared/const";
import { sendMetaMessage } from "./meta";
import { assertChatPageEnabled, checkChatConnection, deleteChatPage, fetchChatMessageRows, fetchChatNotificationRows, fetchChatPages, fetchChatThreadRows, fetchParcelMappingQueue, purgeOldParcels, recordOutgoingChatMessage, saveChatPage, setChatPageAppStatus, setChatPageWebStatus, supabaseDelete, supabaseGet, supabasePatch, supabasePost } from "./supabase";
import { checkLineConnection, fetchLineConversations, fetchLineMessages, sendLineText } from "./line";
import * as db from "./db";
import { generateOrderSummary } from "./order-summary";

const ownerId = (ctx: { user: { id: number } | null }) => ctx.user?.id ?? 0;
const kind = z.enum(["code", "sql", "workflow", "document", "config", "other"]);
function requireBrowserChatConfig(ctx: { chatSupabaseCredentials?: { url: string; serviceRoleKey: string } }) {
  const credentials = ctx.chatSupabaseCredentials ?? {
    url: process.env.CHAT_SUPABASE_URL?.trim() ?? "",
    serviceRoleKey: process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
  };
  if (!credentials?.url || !credentials.serviceRoleKey) {
    throw new Error("กรอก Chat Supabase URL และ service-role key ใน ROOM 02 ก่อนใช้งานแชท");
  }
  return credentials;
}
function requireServerChatConfig() {
  const credentials = {
    url: process.env.CHAT_SUPABASE_URL?.trim() ?? "",
    serviceRoleKey: process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
  };
  if (!credentials.url || !credentials.serviceRoleKey) throw new Error("ยังไม่ได้ตั้งค่า CHAT_SUPABASE_URL และ CHAT_SUPABASE_SERVICE_ROLE_KEY บน Render");
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
  if (!process.env.DATABASE_URL?.trim()) return;
  try { await db.saveChatMessage(input); }
  catch (error) { console.error("[chat] local audit write skipped after Meta accepted message", error); }
}

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, service: "drakside-system", time: new Date().toISOString() })),

  orders: router({
    generateSummary: protectedProcedure.input(z.object({ rawText: z.string().trim().min(1).max(12000), customerName: z.string().optional(), product: z.string().optional(), cod: z.string().optional() })).mutation(({ input }) => generateOrderSummary(input)),
  }),

  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { (ctx.res as any).clearCookie(COOKIE_NAME, { maxAge: -1, httpOnly: true, secure: true, sameSite: "none", path: "/" }); return { success: true }; }),
  }),

  chat: router({
    configured: publicProcedure.query(({ ctx }) => ({ configured: Boolean(ctx.chatSupabaseCredentials?.url && ctx.chatSupabaseCredentials.serviceRoleKey) })),
    // Connection test only verifies the configured Supabase objects. Reading rooms
    // and sending replies remain protected below, but saving/testing config must not
    // redirect an admin away when an auth session has expired.
    connection: publicProcedure.query(({ ctx }) => checkChatConnection(requireBrowserChatConfig(ctx))),
    pages: protectedProcedure.query(({ ctx }) => fetchChatPages(requireBrowserChatConfig(ctx))),
    savePage: adminProcedure.input(z.object({ pageId: z.string().trim().min(1), pageName: z.string().trim().min(1), accessToken: z.string().optional(), enabledMobile: z.boolean().default(true), enabledWeb: z.boolean().default(true) })).mutation(({ input }) => saveChatPage(input, requireServerChatConfig())),
    deletePage: adminProcedure.input(z.object({ pageId: z.string().trim().min(1) })).mutation(({ input }) => deleteChatPage(input.pageId, requireServerChatConfig())),
    setPageAppStatus: protectedProcedure.input(z.object({ pageId: z.string().min(1), enabled: z.boolean() })).mutation(({ input, ctx }) => setChatPageAppStatus(input.pageId, input.enabled, requireBrowserChatConfig(ctx))),
    setPageWebStatus: protectedProcedure.input(z.object({ pageId: z.string().min(1), enabled: z.boolean() })).mutation(({ input, ctx }) => setChatPageWebStatus(input.pageId, input.enabled, requireBrowserChatConfig(ctx))),
    threads: protectedProcedure.input(z.object({ surface: z.enum(["web", "mobile"]).default("web") }).optional()).query(({ input, ctx }) => fetchChatThreadRows(requireBrowserChatConfig(ctx), input?.surface ?? "web")),
    pollNotifications: protectedProcedure.input(z.object({ afterRowId: z.string().regex(/^\d+$/).nullable() })).mutation(({ input, ctx }) => fetchChatNotificationRows(input.afterRowId, requireBrowserChatConfig(ctx))),
    messages: protectedProcedure.input(z.object({ pageId: z.string().min(1), threadId: z.string().min(1), surface: z.enum(["web", "mobile"]).default("web") })).query(({ input, ctx }) => fetchChatMessageRows(input, requireBrowserChatConfig(ctx), input.surface)),
    sendReply: protectedProcedure.input(z.object({ pageId: z.string(), pageName: z.string().optional(), portalKey: z.string().optional(), chatLinkKey: z.string().optional(), threadId: z.string(), recipientId: z.string(), text: z.string().optional(), imageUrl: z.string().optional(), imageSendUrl: z.string().optional(), imageUrls: z.array(z.string().url()).max(4).optional(), stickerId: z.string().optional(), surface: z.enum(["web", "mobile"]).default("web") })).mutation(async ({ input, ctx }) => {
      const credentials = requireBrowserChatConfig(ctx);
      await assertChatPageEnabled(input.pageId, credentials, input.surface ?? "web");
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
          const result = await sendMetaMessage({ pageId: input.pageId, recipientId: input.recipientId, text: item.text, imageUrl: item.imageUrl, stickerId: item.stickerId, surface: input.surface ?? "web" }, credentials);
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
        await persistOutgoingChatBestEffort({ portalKey: input.portalKey, chatLinkKey: input.chatLinkKey, pageId: input.pageId, pageName: input.pageName, threadId: input.threadId, recipientId: input.recipientId, messageId: result.message_id, text: item.text || (item.imageUrl ? "📷 ส่งรูปภาพ" : undefined), imageUrl: item.imageUrl }, credentials);
        void persistLocalChatBestEffort({ pageId: input.pageId, threadId: input.threadId, senderId: input.pageId, senderType: "page", direction: "outbound", text: item.text, attachments: item.imageUrl ? [{ url: item.imageUrl }] : undefined, adminUserId: ctx.user?.id, providerMessageId: result.message_id });
        void db.createAuditLog({ actorUserId: ctx.user.id, actorName: ctx.user.name, action: "CHAT_REPLY_SENT", entityType: "chat_message", entityId: result.message_id, pageId: input.pageId, threadId: input.threadId, metadata: { deviceId: ctx.adminDeviceId || null, userAgent: ctx.userAgent || null, hasText: Boolean(item.text), hasImage: Boolean(item.imageUrl) } });
      }
      if (!finalResult) throw new Error("ไม่มีข้อความหรือรูปภาพสำหรับส่ง");
      return finalResult;
    }),
  }),

  line: router({
    channels: adminProcedure.query(async () => {
      const rows = await supabaseGet<Array<Record<string, unknown>>>("line_channels?select=id,channel_id,channel_name,oa_id,is_active,status,status_web,created_at,updated_at&order=created_at.desc", "chat", requireServerChatConfig());
      return rows.map(row => ({ ...row, hasToken: Boolean(row.channel_access_token) }));
    }),
    saveChannel: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), channelId: z.string().trim().min(1).max(100), channelName: z.string().trim().min(1).max(160), oaId: z.string().trim().min(1).max(160), accessToken: z.string().trim().max(1000).optional(), channelSecret: z.string().trim().max(500).optional(), isActive: z.boolean().default(true), isWebActive: z.boolean().default(true) })).mutation(async ({ input }) => {
      const body: Record<string, unknown> = { channel_id: input.channelId, channel_name: input.channelName, oa_id: input.oaId, is_active: input.isActive, status: input.isActive ? "ON" : "OFF", status_web: input.isWebActive ? "ON" : "OFF", updated_at: new Date().toISOString() };
      if (input.accessToken) body.channel_access_token = input.accessToken;
      if (input.channelSecret) body.channel_secret = input.channelSecret;
      const credentials = requireServerChatConfig();
      if (input.id) return (await supabasePatch<Array<Record<string, unknown>>>(`line_channels?id=eq.${input.id}`, body, "chat", credentials))[0] ?? null;
      if (!input.accessToken) throw new Error("เพิ่ม LINE ใหม่ต้องใส่ Channel Access Token");
      if (!input.channelSecret) throw new Error("เพิ่ม LINE ใหม่ต้องใส่ Channel Secret");
      return (await supabasePost<Array<Record<string, unknown>>>("line_channels", { ...body, channel_access_token: input.accessToken, channel_secret: input.channelSecret }, "chat", "return=representation", credentials))[0] ?? null;
    }),
    testChannel: adminProcedure.input(z.object({ oaId: z.string().trim().min(1) })).query(({ input }) => checkLineConnection(input.oaId, requireServerChatConfig())),
    toggleChannel: adminProcedure.input(z.object({ id: z.number().int().positive(), isActive: z.boolean(), scope: z.enum(["app", "web"]).default("app") })).mutation(({ input }) => supabasePatch(`line_channels?id=eq.${input.id}`, input.scope === "web" ? { status_web: input.isActive ? "ON" : "OFF", updated_at: new Date().toISOString() } : { is_active: input.isActive, status: input.isActive ? "ON" : "OFF", updated_at: new Date().toISOString() }, "chat", requireServerChatConfig())),
    deleteChannel: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => supabaseDelete(`line_channels?id=eq.${input.id}`, "chat", requireServerChatConfig())),
    status: protectedProcedure.input(z.object({ oaId: z.string().optional(), surface: z.enum(["web", "mobile"]).default("web") }).optional()).query(({ input, ctx }) => checkLineConnection(input?.oaId, requireBrowserChatConfig(ctx))),
    conversations: protectedProcedure.input(z.object({ surface: z.enum(["web", "mobile"]).default("web") }).optional()).query(({ input, ctx }) => fetchLineConversations(requireBrowserChatConfig(ctx), input?.surface ?? "web")),
    messages: protectedProcedure.input(z.object({ conversationId: z.string().min(1), lineUserId: z.string().min(1), oaId: z.string().optional(), surface: z.enum(["web", "mobile"]).default("web") })).query(({ input, ctx }) => fetchLineMessages(input.conversationId, input.lineUserId, input.oaId ?? "", requireBrowserChatConfig(ctx))),
    send: protectedProcedure.input(z.object({ lineUserId: z.string().min(1), oaId: z.string().optional(), text: z.string().trim().min(1).max(5000), surface: z.enum(["web", "mobile"]).default("web") })).mutation(({ input, ctx }) => sendLineText(input.lineUserId, input.text, input.oaId, requireBrowserChatConfig(ctx))),
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
