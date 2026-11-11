import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { PRESENTATION_MODE, PRESENTATION_USER } from "../../shared/presentation";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  chatSupabaseCredentials?: { url: string; serviceRoleKey: string };
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

  return {
    req: opts.req,
    res: opts.res,
    user: user ?? (PRESENTATION_MODE ? (PRESENTATION_USER as User) : null),
    chatSupabaseCredentials: chatUrl || chatServiceRoleKey
      ? { url: chatUrl, serviceRoleKey: chatServiceRoleKey }
      : undefined,
  };
}
