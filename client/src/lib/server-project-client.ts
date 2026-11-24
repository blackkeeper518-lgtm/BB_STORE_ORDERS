import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";

const DEVICE_KEY = "bb-admin-device-id";
function requestHeaders() {
  const headers: Record<string, string> = {};
  try {
    let device = localStorage.getItem(DEVICE_KEY);
    if (!device) {
      device = globalThis.crypto?.randomUUID?.() ?? `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, device);
    }
    headers["x-admin-device-id"] = device;
  } catch { /* browser storage is optional */ }
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    const pair = raw?.split(";").find(value => value.trim().startsWith("manus_session="));
    const token = pair?.trim().slice("manus_session=".length);
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch { /* cookies remain the normal authentication path */ }
  return headers;
}

export const projectApi = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({
    url: "/api/trpc",
    transformer: superjson as any,
    headers: requestHeaders,
    fetch(input, init) {
      return globalThis.fetch(input, { ...init, credentials: "include" });
    },
  })],
});

export type ServerSupabaseProject = "main" | "tracking" | "parcel" | "vault" | "chat";
type QueryMethod = "GET" | "HEAD" | "POST" | "PATCH" | "DELETE";
type QueryResult<T = any> = { data: T; error: null | { message: string; code?: string }; count: number | null };

function errorResult(error: unknown) {
  return { message: error instanceof Error ? error.message : String(error ?? "Supabase request failed") };
}

class ServerQueryBuilder implements PromiseLike<QueryResult<any>> {
  private method: QueryMethod = "GET";
  private params: Record<string, string> = { select: "*" };
  private body: unknown;
  private prefer?: string;
  private objectMode: "many" | "single" | "maybeSingle" = "many";
  private returning = false;
  private project: ServerSupabaseProject;
  private table: string;

  constructor(project: ServerSupabaseProject, table: string) {
    this.project = project;
    this.table = table;
  }

  select(columns = "*", options: { count?: "exact" | "planned" | "estimated"; head?: boolean } = {}) {
    this.params.select = columns;
    if (options.head) this.method = "HEAD";
    if (options.count === "exact") this.prefer = this.prefer?.includes("count=exact") ? this.prefer : this.prefer ? `count=exact,${this.prefer}` : "count=exact";
    if (this.method !== "GET" && this.method !== "HEAD") this.returning = true;
    return this;
  }

  insert(values: unknown, options?: { count?: "exact" | "planned" | "estimated"; defaultToNull?: boolean }) {
    this.method = "POST"; this.body = values; this.params = { ...this.params }; this.returning = false;
    if (options?.count === "exact") this.prefer = "count=exact";
    return this;
  }

  upsert(values: unknown, options: { onConflict?: string; ignoreDuplicates?: boolean; count?: "exact" | "planned" | "estimated" } = {}) {
    this.method = "POST"; this.body = values; this.params = { ...this.params };
    if (options.onConflict) this.params.on_conflict = options.onConflict;
    const resolution = options.ignoreDuplicates ? "resolution=ignore-duplicates" : "resolution=merge-duplicates";
    this.prefer = `${resolution},return=representation${options.count === "exact" ? ",count=exact" : ""}`;
    this.returning = true;
    return this;
  }

  update(values: unknown, options?: { count?: "exact" | "planned" | "estimated" }) {
    this.method = "PATCH"; this.body = values; this.returning = false;
    if (options?.count === "exact") this.prefer = "count=exact";
    return this;
  }

  delete(options?: { count?: "exact" | "planned" | "estimated" }) {
    this.method = "DELETE"; this.returning = false;
    if (options?.count === "exact") this.prefer = "count=exact";
    return this;
  }

  private setFilter(column: string, operator: string, value: unknown) {
    this.params[column] = `${operator}.${formatValue(value)}`;
    return this;
  }
  eq(column: string, value: unknown) { return this.setFilter(column, "eq", value); }
  neq(column: string, value: unknown) { return this.setFilter(column, "neq", value); }
  gt(column: string, value: unknown) { return this.setFilter(column, "gt", value); }
  gte(column: string, value: unknown) { return this.setFilter(column, "gte", value); }
  lt(column: string, value: unknown) { return this.setFilter(column, "lt", value); }
  lte(column: string, value: unknown) { return this.setFilter(column, "lte", value); }
  like(column: string, value: string) { return this.setFilter(column, "like", value); }
  ilike(column: string, value: string) { return this.setFilter(column, "ilike", value); }
  is(column: string, value: boolean | null) { return this.setFilter(column, "is", value === null ? "null" : value); }
  in(column: string, values: unknown[]) { return this.setFilter(column, "in", `(${values.map(formatInValue).join(",")})`); }
  not(column: string, operator: string, value: unknown) { return this.setFilter(column, `not.${operator}`, value); }
  match(values: Record<string, unknown>) { for (const [column, value] of Object.entries(values)) this.eq(column, value); return this; }
  contains(column: string, value: unknown) { return this.setFilter(column, "cs", JSON.stringify(value)); }
  overlaps(column: string, value: unknown) { return this.setFilter(column, "ov", JSON.stringify(value)); }
  filter(column: string, operator: string, value: unknown) { return this.setFilter(column, operator, value); }
  or(filters: string, options?: { foreignTable?: string }) {
    const key = options?.foreignTable ? `${options.foreignTable}.or` : "or";
    const value = filters.trim();
    this.params[key] = value.startsWith("(") && value.endsWith(")") ? value : `(${value})`;
    return this;
  }
  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string } = {}) {
    const key = options.foreignTable ? `${options.foreignTable}.order` : "order";
    const term = `${column}.${options.ascending === false ? "desc" : "asc"}${options.nullsFirst == null ? "" : options.nullsFirst ? ".nullsfirst" : ".nullslast"}`;
    this.params[key] = this.params[key] ? `${this.params[key]},${term}` : term;
    return this;
  }
  limit(value: number, options?: { foreignTable?: string }) { this.params[options?.foreignTable ? `${options.foreignTable}.limit` : "limit"] = String(Math.max(0, Math.floor(value))); return this; }
  range(from: number, to: number, options?: { foreignTable?: string }) {
    this.params[options?.foreignTable ? `${options.foreignTable}.offset` : "offset"] = String(Math.max(0, Math.floor(from)));
    this.params[options?.foreignTable ? `${options.foreignTable}.limit` : "limit"] = String(Math.max(0, Math.floor(to - from + 1)));
    return this;
  }
  single() { this.objectMode = "single"; return this; }
  maybeSingle() { this.objectMode = "maybeSingle"; return this; }

  then<TResult1 = QueryResult<any>, TResult2 = never>(onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResult<any>> {
    if (this.returning && !this.prefer?.includes("return=")) {
      const resolution = this.prefer?.startsWith("resolution=") ? this.prefer.split(",")[0] : "";
      this.prefer = [resolution, this.prefer?.includes("count=exact") ? "count=exact" : "", "return=representation"].filter(Boolean).join(",");
    }
    try {
      const result = await projectApi.projects.execute.mutate({
        project: this.project,
        table: this.table,
        method: this.method,
        params: this.params,
        body: this.body,
        prefer: this.prefer as any,
      });
      let data = result.data;
      let error: QueryResult["error"] = null;
      if (this.objectMode !== "many" && Array.isArray(data)) {
        if (data.length > 1 || (this.objectMode === "single" && data.length !== 1)) {
          error = { message: data.length ? "JSON object requested, multiple rows returned" : "JSON object requested, no rows returned", code: "PGRST116" };
          data = null;
        } else data = data[0] ?? null;
      }
      return { data, error, count: result.count ?? null };
    } catch (error) {
      return { data: null, error: errorResult(error), count: null };
    }
  }
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function formatInValue(value: unknown): string {
  const text = formatValue(value);
  return /[(),\s"]/.test(text) ? `"${text.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"` : text;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunk) binary += String.fromCharCode(...bytes.subarray(offset, offset + chunk));
  return btoa(binary);
}
function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

class ServerStorageBucket {
  constructor(private readonly bucket: string) {}
  async upload(path: string, file: Blob, options: { contentType?: string; upsert?: boolean } = {}) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await projectApi.projects.storage.mutate({ operation: "upload", bucket: this.bucket, path, contentBase64: toBase64(bytes), contentType: options.contentType || (file as File).type || "application/octet-stream", upsert: options.upsert });
      return { data: { path: result.path, fullPath: `${this.bucket}/${result.path}`, publicUrl: result.publicUrl }, error: null };
    } catch (error) { return { data: null, error: errorResult(error) }; }
  }
  async remove(paths: string[]) {
    try { await projectApi.projects.storage.mutate({ operation: "remove", bucket: this.bucket, paths }); return { data: paths.map(name => ({ name })), error: null }; }
    catch (error) { return { data: null, error: errorResult(error) }; }
  }
  async createSignedUrl(path: string, expiresIn = 300) {
    try { const result = await projectApi.projects.storage.mutate({ operation: "signed", bucket: this.bucket, path, expiresIn }); return { data: { signedUrl: result.signedUrl }, error: null }; }
    catch (error) { return { data: null, error: errorResult(error) }; }
  }
  async download(path: string) {
    try {
      const result = await projectApi.projects.storage.mutate({ operation: "download", bucket: this.bucket, path });
      return { data: new Blob([fromBase64(result.contentBase64)], { type: result.contentType || "application/octet-stream" }), error: null };
    } catch (error) { return { data: null, error: errorResult(error) }; }
  }
  getPublicUrl(path: string) { return { data: { publicUrl: "", path } }; }
}

export function createServerSupabaseClient(project: ServerSupabaseProject) {
  return {
    from(table: string) { return new ServerQueryBuilder(project, table); },
    storage: { from(bucket: string) { return new ServerStorageBucket(bucket); } },
    auth: { async getSession() { return { data: { session: null }, error: null }; } },
  };
}

export type ServerProjectStatus = { order: boolean; trackingParcel: boolean; vault: boolean; chat: boolean };
let projectStatusCache: ServerProjectStatus | null = null;
export function cacheServerProjectStatus(status: ServerProjectStatus) { projectStatusCache = status; }
export function getCachedServerProjectStatus() { return projectStatusCache; }
export async function refreshServerProjectStatus() {
  const status = await projectApi.projects.status.query();
  cacheServerProjectStatus(status);
  return status;
}

// Legacy browser settings remain untouched as a user-held backup and are never used for requests.
export function clearLegacyBrowserSupabaseSettings() {
  // Legacy values remain untouched as a user-held backup; they are never read or sent.
}
