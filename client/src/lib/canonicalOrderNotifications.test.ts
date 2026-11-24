import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  calls: [] as Array<{ table?: string; select?: string; limit?: number }>,
  responses: [] as Array<{ data?: any[]; error?: any }>,
}));

vi.mock("./server-project-client", () => ({
  cacheServerProjectStatus: vi.fn(),
  clearLegacyBrowserSupabaseSettings: vi.fn(),
  createServerSupabaseClient: vi.fn(() => ({
    from(table: string) {
      testState.calls.push({ table });
      const builder: any = {
        select(columns: string) {
          testState.calls.push({ select: columns });
          return builder;
        },
        limit(value: number) {
          testState.calls.push({ limit: value });
          return Promise.resolve(testState.responses.shift());
        },
      };
      return builder;
    },
  })),
  getCachedServerProjectStatus: vi.fn(() => null),
  projectApi: {},
}));

import { readCanonicalOrderNotifications } from "./canonical";

afterEach(() => vi.clearAllMocks());

beforeEach(() => {
  testState.calls = [];
  testState.responses = [];
});

describe("canonical order notification reads", () => {
  it("requests only notification fields while keeping the previous 1,000-row coverage and latest-first display order", async () => {
    testState.responses.push({
      data: [
        { upsert_key: "older", order_number: "ORD-OLD", order_time_display: "22/11/2026 17:00:00" },
        { upsert_key: "newer", order_number: "ORD-NEW", order_time_display: "23/11/2026 16:00:00" },
      ],
    });

    const result = await readCanonicalOrderNotifications();

    expect(result.orders.map((row) => row.upsert_key)).toEqual(["newer", "older"]);
    expect(testState.calls).toEqual([
      { table: "🗝️HERMES_ARCHIVE" },
      { select: "upsert_key,order_number_display,order_number,final_display_for_packer,final_product,order_fibo_product,telegram_product_display,order_time_display,order_time,order_time_bkk_iso" },
      { limit: 1000 },
    ]);
  });

  it("falls back to the previous wildcard read when HERMES schema pruning removes a projected column", async () => {
    testState.responses.push(
      { data: null, error: { message: "Could not find the 'order_number_display' column in the schema cache" } },
      { data: [{ upsert_key: "row-1", order_number: "ORD-1", order_time_display: "23/11/2026 16:00:00" }] },
    );

    const result = await readCanonicalOrderNotifications();

    expect(result.orders).toHaveLength(1);
    expect(testState.calls.filter((call) => call.select).map((call) => call.select)).toEqual([
      "upsert_key,order_number_display,order_number,final_display_for_packer,final_product,order_fibo_product,telegram_product_display,order_time_display,order_time,order_time_bkk_iso",
      "*",
    ]);
    expect(testState.calls.filter((call) => call.limit).map((call) => call.limit)).toEqual([1000, 1000]);
  });
});
