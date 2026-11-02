import { describe, expect, it } from "vitest";

const hasLiveConfig = Boolean((process.env.ORDER_SUPABASE_URL || process.env.SUPABASE_URL) && (process.env.ORDER_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
describe.skipIf(!hasLiveConfig)("live Supabase main-order connection", () => {
  it("can read lightweight rows from the three current room sources without exposing secrets", async () => {
    const baseUrl = (process.env.ORDER_SUPABASE_URL || process.env.SUPABASE_URL)?.replace(/\/$/, "");
    const serviceKey = process.env.ORDER_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!baseUrl || !serviceKey) return;

    for (const relation of ["🗝️HERMES_ARCHIVE", "🌌MULTIVERSE_xXx_NEXUS", "🌀SINGULARITY_xXx_EXCHANGE"]) {
      const response = await fetch(`${baseUrl}/rest/v1/${encodeURIComponent(relation)}?select=*&limit=1`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      });

      expect(response.ok, `${relation} returned HTTP ${response.status}`).toBe(true);
      const payload = await response.json();
      expect(Array.isArray(payload)).toBe(true);
    }
  }, 20_000);
});
