import { afterEach, describe, expect, it, vi } from "vitest";
import { canStaffExecuteProjectQuery, canStaffUploadVaultStorage, executeProjectQuery, executeVaultStorage, getServerProjectStatus, lookupParcelByPhone } from "./supabase";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function configureProjects() {
  vi.stubEnv("ORDER_SUPABASE_URL", "https://order-project.supabase.co");
  vi.stubEnv("ORDER_SUPABASE_SERVICE_ROLE_KEY", "order-server-key");
  vi.stubEnv("TRACKING_SUPABASE_URL", "https://parcel-project.supabase.co");
  vi.stubEnv("TRACKING_SUPABASE_SERVICE_ROLE_KEY", "parcel-server-key");
  vi.stubEnv("VAULT_SUPABASE_URL", "https://vault-project.supabase.co");
  vi.stubEnv("VAULT_SUPABASE_SERVICE_ROLE_KEY", "vault-server-key");
  vi.stubEnv("CHAT_SUPABASE_URL", "https://chat-project.supabase.co");
  vi.stubEnv("CHAT_SUPABASE_SERVICE_ROLE_KEY", "chat-server-key");
}

describe("server-side Supabase project routing", () => {
  it("limits authenticated staff to explicit safe Order Deck reads", () => {
    expect(canStaffExecuteProjectQuery({ project: "main", table: "🛒product_master", method: "GET", params: { select: "emoji,master_sku,th_name,name_standard,brand,variant,unit_price,alias,status", limit: "500" } })).toBe(true);
    expect(canStaffExecuteProjectQuery({ project: "tracking", table: "thailand_address_master", method: "GET", params: { select: "district,amphoe,province,zipcode", limit: "100" } })).toBe(true);
    expect(canStaffExecuteProjectQuery({ project: "vault", table: "sales_script_cards", method: "GET", params: { select: "id,title,script_text,blocks_json", limit: "500" } })).toBe(true);
    expect(canStaffExecuteProjectQuery({ project: "main", table: "🌍GALACTIC_GATEWAY_TOKEN", method: "GET", params: { select: "*", limit: "500" } })).toBe(false);
    expect(canStaffExecuteProjectQuery({ project: "vault", table: "sales_script_cards", method: "PATCH", params: { select: "id,title", limit: "1" } })).toBe(false);
    expect(canStaffExecuteProjectQuery({ project: "main", table: "🛒product_master", method: "GET", params: { select: "*", limit: "500" } })).toBe(false);
  });

  it("limits authenticated staff uploads to non-overwriting chat and Order Deck images", () => {
    expect(canStaffUploadVaultStorage({ operation: "upload", bucket: "sales-script-images", path: "script-art/chat/id-image.png", contentType: "image/png", contentBase64: "aGVsbG8=", upsert: false })).toBe(true);
    expect(canStaffUploadVaultStorage({ operation: "upload", bucket: "warp-images", path: "warp/order-deck/id.webp", contentType: "image/webp", contentBase64: "aGVsbG8=", upsert: false })).toBe(true);
    expect(canStaffUploadVaultStorage({ operation: "remove", bucket: "sales-script-images", path: "script-art/chat/id-image.png" })).toBe(false);
    expect(canStaffUploadVaultStorage({ operation: "upload", bucket: "theme-graphics", path: "themes/id.svg", contentType: "image/svg+xml", contentBase64: "aGVsbG8=" })).toBe(false);
    expect(canStaffUploadVaultStorage({ operation: "upload", bucket: "warp-images", path: "warp/order-deck/../secret.png", contentType: "image/png", contentBase64: "aGVsbG8=" })).toBe(false);
  });

  it("reports readiness only from server environment configuration", () => {
    configureProjects();
    expect(getServerProjectStatus()).toEqual({ order: true, trackingParcel: true, vault: true, chat: true });
  });

  it("routes ORDER, TRACKING/PARCEL, VAULT and CHAT to their mapped project servers", async () => {
    configureProjects();
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      requests.push({ url: String(input), init });
      return new Response("[]", { status: 200, headers: { "content-range": "0-0/0", "content-type": "application/json" } });
    });

    await executeProjectQuery({ project: "main", table: "🗝️HERMES_ARCHIVE", method: "GET", params: { select: "*" } });
    await executeProjectQuery({ project: "tracking", table: "thailand_address_master", method: "GET", params: { select: "*" } });
    await executeProjectQuery({ project: "parcel", table: "parcels", method: "GET", params: { select: "*" } });
    await executeProjectQuery({ project: "vault", table: "sales_script_cards", method: "GET", params: { select: "*" } });
    await executeProjectQuery({ project: "chat", table: "Cust_Chat⭐BINARY_xXx_STAR", method: "GET", params: { select: "*" } });

    expect(requests.map(({ url }) => new URL(url).origin)).toEqual([
      "https://order-project.supabase.co",
      "https://parcel-project.supabase.co",
      "https://parcel-project.supabase.co",
      "https://vault-project.supabase.co",
      "https://chat-project.supabase.co",
    ]);
    expect(requests.map(({ init }) => (init?.headers as Record<string, string>).Authorization)).toEqual([
      "Bearer order-server-key",
      "Bearer parcel-server-key",
      "Bearer parcel-server-key",
      "Bearer vault-server-key",
      "Bearer chat-server-key",
    ]);
    await expect(executeProjectQuery({ project: "main", table: "Cust_Chat⭐BINARY_xXx_STAR", method: "GET" }))
      .rejects.toThrow("not enabled for main");
  });

  it("rejects embedded PostgREST relations even when the top-level table is allowed", async () => {
    configureProjects();
    await expect(executeProjectQuery({
      project: "main", table: "🗝️HERMES_ARCHIVE", method: "GET", params: { select: "*,private_table(*)" },
    })).rejects.toThrow("Embedded relation selects are not enabled");
  });

  it("looks up parcel phone numbers using the same TRACKING/PARCEL server account", async () => {
    configureProjects();
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    });

    await lookupParcelByPhone("0812345678");
    expect(requestUrl).toBe("https://parcel-project.supabase.co/rest/v1/rpc/get_parcel_by_phone_v2");
    expect((requestInit?.headers as Record<string, string>).Authorization).toBe("Bearer parcel-server-key");
    expect(requestInit?.body).toBe(JSON.stringify({ search_phone: "0812345678" }));
  });
});

describe("server-side VAULT storage routing", () => {
  it("uploads, signs, downloads and removes files using VAULT credentials", async () => {
    configureProjects();
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.includes("/sign/")) return new Response(JSON.stringify({ signedURL: "/object/sign/chat-sounds/sounds/test.mp3?token=signed" }), { status: 200 });
      if (url.includes("/chat-sounds/sounds/test.mp3")) return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "audio/mpeg" } });
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    });

    const uploaded = await executeVaultStorage({ operation: "upload", bucket: "warp-images", path: "warp/test.webp", contentBase64: "aW1hZ2U=", contentType: "image/webp" });
    const signed = await executeVaultStorage({ operation: "signed", bucket: "chat-sounds", path: "sounds/test.mp3", expiresIn: 300 });
    const downloaded = await executeVaultStorage({ operation: "download", bucket: "chat-sounds", path: "sounds/test.mp3" });
    const removed = await executeVaultStorage({ operation: "remove", bucket: "chat-sounds", paths: ["sounds/test.mp3"] });

    expect(uploaded.publicUrl).toBe("https://vault-project.supabase.co/storage/v1/object/public/warp-images/warp/test.webp");
    expect(signed.signedUrl).toContain("https://vault-project.supabase.co/storage/v1/object/sign/chat-sounds/sounds/test.mp3?token=signed");
    expect(downloaded.contentType).toBe("audio/mpeg");
    expect(Buffer.from(downloaded.contentBase64, "base64")).toEqual(Buffer.from([1, 2, 3]));
    expect(removed).toEqual({ ok: true });
    const publicUrls = await Promise.all([
      executeVaultStorage({ operation: "public", bucket: "sales-script-images", path: "script-art/chat/test.png" }),
      executeVaultStorage({ operation: "public", bucket: "theme-graphics", path: "themes/test.png" }),
      executeVaultStorage({ operation: "public", bucket: "warp-images", path: "warp/order-deck/test.webp" }),
      executeVaultStorage({ operation: "public", bucket: "chat-sounds", path: "sounds/test.mp3" }),
    ]);
    expect(publicUrls.map(result => result.publicUrl)).toEqual([
      "https://vault-project.supabase.co/storage/v1/object/public/sales-script-images/script-art/chat/test.png",
      "https://vault-project.supabase.co/storage/v1/object/public/theme-graphics/themes/test.png",
      "https://vault-project.supabase.co/storage/v1/object/public/warp-images/warp/order-deck/test.webp",
      "https://vault-project.supabase.co/storage/v1/object/public/chat-sounds/sounds/test.mp3",
    ]);
    await expect(executeVaultStorage({ operation: "public", bucket: "theme-graphics", path: "warp/wrong.png" }))
      .rejects.toThrow("Storage path must start with themes/");
    expect(requests).toHaveLength(4);
    expect(requests.every(({ url, init }) => url.startsWith("https://vault-project.supabase.co/storage/v1/") && (init?.headers as Record<string, string>).Authorization === "Bearer vault-server-key")).toBe(true);
  });
});
