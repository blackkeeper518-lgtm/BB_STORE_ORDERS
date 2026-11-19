import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { PRESENTATION_MODE, PRESENTATION_USER } from "../../shared/presentation";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  chatSupabaseCredentials?: { url: string; serviceRoleKey: string };
  adminDeviceId: string;
  userAgent: string;
};

function headerValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  const chatUrl = headerValue(opts.req.headers["x-chat-supabase-url"]);
  const chatServiceRoleKey = headerValue(opts.req.headers["x-chat-supabase-service-role-key"]);
  // Render is the shared source of truth; browser values are only a legacy
  // fallback for deployments that have not configured the server yet.
  const configuredChatUrl = process.env.CHAT_SUPABASE_URL?.trim() || chatUrl || "";
  const configuredChatServiceRoleKey = process.env.CHAT_SUPABASE_SERVICE_ROLE_KEY?.trim() || chatServiceRoleKey || "";
  const adminDeviceId = headerValue(opts.req.headers["x-admin-device-id"]).slice(0, 160);
  const userAgent = headerValue(opts.req.headers["user-agent"]).slice(0, 500);

  return {
    req: opts.req,
    res: opts.res,
    user: user ?? (PRESENTATION_MODE ? (PRESENTATION_USER as User) : null),
    adminDeviceId,
    userAgent,
    chatSupabaseCredentials: configuredChatUrl || configuredChatServiceRoleKey
      ? { url: configuredChatUrl, serviceRoleKey: configuredChatServiceRoleKey }
      : undefined,
  };
}
