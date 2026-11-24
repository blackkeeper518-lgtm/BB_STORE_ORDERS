import type { SupabaseClient } from "@supabase/supabase-js";
import { projectApi } from "@/lib/server-project-client";

export const SUPHABASS_SUPABASE_URL_KEY = "suphabass:supabase-url";
export const SUPHABASS_SUPABASE_ANON_KEY = "suphabass:supabase-anon-key";
export const SUPHABASS_SUPABASE_TABLE_KEY = "suphabass:supabase-order-table";
export type SupabaseBrowserSettings = { url: string; anonKey: string; orderTable: string };

/** Compatibility shape only. Server credentials are never read from browser storage. */
export function readSupabaseSettings(): SupabaseBrowserSettings {
  return { url: "", anonKey: "", orderTable: "🧿BB_xXx_ORDERCONTROL" };
}
export function saveSupabaseSettings(_settings: SupabaseBrowserSettings): never {
  throw new Error("Supabase credentials must be configured on the server, not in browser storage");
}
export function clearSupabaseSettings() {
  // Legacy browser settings are preserved for the user's backup; they are never read or sent.
}
/** Browser Supabase clients are intentionally disabled; all database work uses server routes. */
export function createBrowserSupabase(_settings = readSupabaseSettings()): SupabaseClient | null { return null; }

export async function readCanonicalOrderPreview(limit = 5) {
  try {
    const result = await projectApi.projects.execute.mutate({
      project: "main", table: "🧿BB_xXx_ORDERCONTROL", method: "GET",
      params: { select: "*", limit: String(Math.max(0, Math.min(100, Math.floor(limit)))) },
    });
    return { rows: Array.isArray(result.data) ? result.data : [], error: null };
  } catch (error) {
    return { rows: [], error: error instanceof Error ? error.message : String(error) };
  }
}
