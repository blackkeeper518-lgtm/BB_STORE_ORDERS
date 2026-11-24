export const CHAT_IMAGE_BUCKET = "sales-script-images";

type VaultStorageApi = {
  storage: {
    from(bucket: string): {
      upload(path: string, file: File, options: { upsert: boolean; contentType: string }): Promise<{
        data: { publicUrl?: string } | null;
        error: unknown;
      }>;
    };
  };
};

export async function uploadChatImageToVault(api: VaultStorageApi, file: File) {
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "image";
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  // ROOM 04 policy permits writes under script-art/ only.
  const path = `script-art/chat/${id}-${safeName}`;
  const bucket = api.storage.from(CHAT_IMAGE_BUCKET);
  const { data, error } = await bucket.upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  if (!data?.publicUrl) throw new Error("ROOM 04 ไม่คืน URL ของภาพที่อัปโหลด");
  return { path, url: data.publicUrl };
}
