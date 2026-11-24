import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { PRESENTATION_MODE, PRESENTATION_USER } from "../../shared/presentation";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  adminDeviceId?: string;
  userAgent?: string;
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

  const adminDeviceId = headerValue(opts.req.headers["x-admin-device-id"]).slice(0, 160);
  const userAgent = headerValue(opts.req.headers["user-agent"]).slice(0, 500);

  return {
    req: opts.req,
    res: opts.res,
    user: user ?? (PRESENTATION_MODE ? (PRESENTATION_USER as User) : null),
    adminDeviceId,
    userAgent,
  };
}
