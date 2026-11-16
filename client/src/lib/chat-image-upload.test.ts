import { describe, expect, it, vi } from "vitest";
import { CHAT_IMAGE_BUCKET, uploadChatImageToVault } from "./chat-image-upload";

describe("uploadChatImageToVault", () => {
  it("uploads through the ROOM 04 vault client into the policy-allowed path", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const getPublicUrl = vi.fn((path: string) => ({ data: { publicUrl: `https://vault.supabase.co/storage/v1/object/public/${CHAT_IMAGE_BUCKET}/${path}` } }));
    const from = vi.fn(() => ({ upload, getPublicUrl }));
    const api = { storage: { from } } as any;
    const image = new File(["image"], "ภาพลูกค้า.jpg", { type: "image/jpeg" });

    const result = await uploadChatImageToVault(api, image);

    expect(from).toHaveBeenCalledWith("sales-script-images");
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^script-art\/chat\/[^/]+\.jpg$/), image, {
      upsert: false,
      contentType: "image/jpeg",
    });
    expect(result.path).toMatch(/^script-art\/chat\//);
    expect(result.url).toContain("/storage/v1/object/public/sales-script-images/script-art/chat/");
  });
});
