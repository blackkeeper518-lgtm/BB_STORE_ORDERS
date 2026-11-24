import { beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  calls: [] as Array<Record<string, unknown>>,
  rows: [] as any[],
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
        order(column: string, options: { ascending?: boolean; nullsFirst?: boolean }) {
          testState.calls.push({ order: { column, options } });
          return builder;
        },
        limit(value: number) {
          testState.calls.push({ limit: value });
          return Promise.resolve({ data: testState.rows, error: null });
        },
      };
      return builder;
    },
  })),
  getCachedServerProjectStatus: vi.fn(() => null),
  projectApi: {},
}));

import { readCanonicalOrders } from "./canonical";

beforeEach(() => {
  testState.calls = [];
  testState.rows = [];
});

describe("canonical order reads", () => {
  it("orders the capped HERMES read by the ISO timestamp derived from display time, then sorts by display time", async () => {
    testState.rows = [
      {
        upsert_key: "older",
        order_number: "ORD-OLD",
        order_time_display: "21/11/69 23:43:15",
        order_time_bkk_iso: "2026-11-22T06:43:15.000Z",
      },
      {
        upsert_key: "newer",
        order_number: "ORD-NEW",
        order_time_display: "23/11/69 03:07:37",
        order_time_bkk_iso: "2026-11-23T10:07:37.000Z",
      },
    ];

    const result = await readCanonicalOrders();

    expect(result.orders.map((row) => row.upsert_key)).toEqual(["newer", "older"]);
    expect(testState.calls).toEqual([
      { table: "🗝️HERMES_ARCHIVE" },
      { select: "*" },
      { order: { column: "order_time_bkk_iso", options: { ascending: false, nullsFirst: false } } },
      { limit: 1000 },
    ]);
  });
});
