import { afterEach, describe, expect, it, vi } from "vitest";
import { storagePutSupabaseImage } from "../../../server/storage";

afterEach(() => vi.unstubAllGlobals());

describe("storagePutSupabaseImage", () => {
  it("uploads to warp-images and returns a stable URL plus a signed Meta URL", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });
      if (url.includes("/storage/v1/object/sign/")) {
        return new Response(JSON.stringify({ signedURL: "/object/sign/warp-images/chat/photo.jpg?token=temporary" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(null, { status: 200 });
    });

    const result = await storagePutSupabaseImage("chat/photo.jpg", Buffer.from("image-bytes"), "image/jpeg", {
      url: "https://chat-project.supabase.co",
      serviceRoleKey: "test-service-role-key",
    });

    expect(requests).toHaveLength(2);
    expect(requests[0].url).toBe("https://chat-project.supabase.co/storage/v1/object/warp-images/chat/photo.jpg");
    expect(requests[0].init?.method).toBe("POST");
    expect((requests[0].init?.headers as Record<string, string>).Authorization).toBe("Bearer test-service-role-key");
    expect(requests[1].url).toBe("https://chat-project.supabase.co/storage/v1/object/sign/warp-images/chat/photo.jpg");
    expect(JSON.parse(String(requests[1].init?.body))).toEqual({ expiresIn: 3600 });
    expect(result).toEqual({
      key: "chat/photo.jpg",
      url: "https://chat-project.supabase.co/storage/v1/object/public/warp-images/chat/photo.jpg",
      sendUrl: "https://chat-project.supabase.co/storage/v1/object/sign/warp-images/chat/photo.jpg?token=temporary",
    });
  });
});
