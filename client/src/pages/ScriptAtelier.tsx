import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  FilePlus2,
  ImagePlus,
  Loader2,
  PanelRight,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getSupabase } from "@/lib/canonical";

type ScriptBlock = {
  type: "image";
  url: string;
  path?: string;
  caption?: string;
  localPreview?: boolean;
};

type ScriptCard = {
  id: string;
  title: string;
  subtitle: string;
  script_text: string;
  ai_context: string;
  ai_instruction: string;
  blocks_json: ScriptBlock[];
  status: string;
  version: number;
  updated_at: string;
  created_at: string;
};

type ImageSelection = {
  title: string;
  images: ScriptBlock[];
  index: number;
};

const SCRIPT_TABLE = "sales_script_cards";
const IMAGE_BUCKET = "sales-script-images";
const SCRIPT_COLUMNS = "id,title,subtitle,script_text,ai_context,ai_instruction,blocks_json,status,version,updated_at,created_at";
const SCRIPT_ATELIER_SUPABASE_URL = "https://efieodrwkmpcxftnlaqx.supabase.co";

const emptyDraft = (): ScriptCard => ({
  id: "",
  title: "",
  subtitle: "",
  script_text: "",
  ai_context: "",
  ai_instruction: "",
  blocks_json: [],
  status: "DRAFT",
  version: 1,
  updated_at: "",
  created_at: "",
});

function errorText(error: unknown) {
  const message = String((error as any)?.message ?? error ?? "เกิดข้อผิดพลาด");
  if (/PGRST205|42P01|sales_script_cards.*(schema cache|does not exist|not found)|(schema cache|does not exist|not found).*sales_script_cards/i.test(message)) {
    return "ไม่พบตาราง sales_script_cards ใน Supabase efieodrwkmpcxftnlaqx ตรวจว่าได้รัน sql/20261106_script_atelier.sql ในโปรเจกต์นี้แล้ว";
  }
  if (/bucket.*sales-script-images|sales-script-images.*(not found|does not exist)/i.test(message)) {
    return "ไม่พบคลังภาพ sales-script-images ใน Supabase efieodrwkmpcxftnlaqx ตรวจ migration ของ Script Atelier";
  }
  return message;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function normalizeBlocks(value: unknown): ScriptBlock[] {
  if (!Array.isArray(value)) return [];
  return value.filter((block): block is ScriptBlock => Boolean(
    block && typeof block === "object" && (block as ScriptBlock).type === "image" && typeof (block as ScriptBlock).url === "string",
  ));
}

export default function ScriptAtelier() {
  const [cards, setCards] = useState<ScriptCard[]>([]);
  const [draft, setDraft] = useState<ScriptCard>(emptyDraft());
  const [editorOpen, setEditorOpen] = useState(false);
  const [imageSelection, setImageSelection] = useState<ImageSelection | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [draggingImage, setDraggingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uncommittedImagePaths, setUncommittedImagePaths] = useState<string[]>([]);
  const [pendingDeletePaths, setPendingDeletePaths] = useState<string[]>([]);
  const api = getSupabase("tracking", SCRIPT_ATELIER_SUPABASE_URL);

  const load = async () => {
    if (!api) {
      setError("ยังไม่พบ Anon/Publishable Key ของ Supabase efieodrwkmpcxftnlaqx: ตั้งค่า VITE_TRACKING_SUPABASE_ANON_KEY ใน Render ด้วย public anon/publishable key ของโปรเจกต์นี้ (ห้ามใช้ service_role)");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await api.from(SCRIPT_TABLE).select(SCRIPT_COLUMNS).order("updated_at", { ascending: false });
      if (result.error) throw result.error;
      setCards((result.data ?? []).map((row: any) => ({
        ...row,
        blocks_json: normalizeBlocks(row.blocks_json),
      })) as ScriptCard[]);
    } catch (loadError) {
      setError(errorText(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cards.filter((card) => {
      const imageText = card.blocks_json.map((block) => block.caption ?? "").join(" ");
      const haystack = `${card.title} ${card.subtitle} ${card.script_text} ${card.ai_context} ${card.ai_instruction} ${imageText}`.toLowerCase();
      return (!term || haystack.includes(term)) && (filter === "ALL" || card.status === filter);
    });
  }, [cards, filter, search]);

  const totalImages = useMemo(
    () => cards.reduce((total, card) => total + card.blocks_json.length, 0),
    [cards],
  );

  const cleanupStorageFiles = async (paths: string[]) => {
    const uniquePaths = [...new Set(paths.filter(Boolean))];
    if (!api || !uniquePaths.length) return true;
    const result = await api.storage.from(IMAGE_BUCKET).remove(uniquePaths);
    if (result.error) {
      setError(errorText(result.error));
      return false;
    }
    return true;
  };

  const openEditor = (card?: ScriptCard) => {
    const next = card
      ? { ...card, blocks_json: [...card.blocks_json] }
      : emptyDraft();
    setDraft(next);
    setUncommittedImagePaths([]);
    setPendingDeletePaths([]);
    setImageSelection(null);
    setMessage("");
    setError("");
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (saving) return;
    const orphanedPaths = uncommittedImagePaths;
    setUncommittedImagePaths([]);
    setPendingDeletePaths([]);
    setDraft(emptyDraft());
    setImageSelection(null);
    setEditorOpen(false);
    if (orphanedPaths.length) {
      void cleanupStorageFiles(orphanedPaths).then((removed) => {
        if (!removed) setMessage("ปิดร่างแล้ว แต่ลบไฟล์ภาพที่ยังไม่ได้บันทึกไม่สำเร็จ");
      });
    }
  };

  const save = async () => {
    if (!api) {
      setError("ยังไม่ได้ตั้งค่า Supabase โปรเจกต์ Tracking");
      return;
    }
    if (!draft.title.trim() || !draft.script_text.trim()) {
      setError("ใส่ชื่อและเนื้อหาสคริปต์ก่อนบันทึก");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        title: draft.title.trim(),
        subtitle: draft.subtitle.trim(),
        script_text: draft.script_text,
        ai_context: draft.ai_context,
        ai_instruction: draft.ai_instruction,
        blocks_json: draft.blocks_json,
        status: draft.status || "DRAFT",
        version: draft.version || 1,
        updated_at: new Date().toISOString(),
      };
      // The existing table has a required legacy `sku` column. Keep it blank for new records;
      // it is not shown, searched, or linked to the stock/product tables in this room.
      const result = draft.id
        ? await api.from(SCRIPT_TABLE).update(payload).eq("id", draft.id).select(SCRIPT_COLUMNS).single()
        : await api.from(SCRIPT_TABLE).insert({ sku: "", ...payload }).select(SCRIPT_COLUMNS).single();

      if (result.error) throw result.error;
      const saved = {
        ...result.data,
        blocks_json: normalizeBlocks(result.data.blocks_json),
      } as ScriptCard;
      const savedPaths = new Set(saved.blocks_json.map((block) => block.path).filter((path): path is string => Boolean(path)));
      const cleanupPaths = [
        ...pendingDeletePaths,
        ...uncommittedImagePaths.filter((path) => !savedPaths.has(path)),
      ];
      setCards((current) => draft.id
        ? current.map((card) => card.id === saved.id ? saved : card)
        : [saved, ...current]);
      setDraft(saved);
      setUncommittedImagePaths([]);
      setPendingDeletePaths([]);
      const cleaned = await cleanupStorageFiles(cleanupPaths);
      setMessage(cleaned ? "บันทึกแล้ว" : "บันทึกแล้ว แต่ไฟล์ภาพที่เอาออกบางส่วนยังอยู่ในคลัง");
    } catch (saveError) {
      setError(errorText(saveError));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!api || !draft.id || !window.confirm("ลบสคริปต์รายการนี้หรือไม่?")) return;
    setSaving(true);
    setError("");
    try {
      const result = await api.from(SCRIPT_TABLE).delete().eq("id", draft.id);
      if (result.error) throw result.error;
      const imagePaths = [
        ...draft.blocks_json.map((block) => block.path ?? ""),
        ...pendingDeletePaths,
        ...uncommittedImagePaths,
      ];
      setCards((current) => current.filter((card) => card.id !== draft.id));
      setEditorOpen(false);
      setDraft(emptyDraft());
      setUncommittedImagePaths([]);
      setPendingDeletePaths([]);
      const cleaned = await cleanupStorageFiles(imagePaths);
      setMessage(cleaned ? "ลบสคริปต์และภาพประกอบแล้ว" : "ลบสคริปต์แล้ว แต่ไฟล์ภาพบางส่วนยังอยู่ในคลัง");
    } catch (deleteError) {
      setError(errorText(deleteError));
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!api || !imageFiles.length) return;
    const pending = imageFiles.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setDraft((current) => ({
      ...current,
      blocks_json: [...current.blocks_json, ...pending.map(({ file, previewUrl }) => ({ type: "image" as const, url: previewUrl, caption: file.name, localPreview: true }))],
    }));
    setSaving(true);
    setError("");
    setMessage("");
    const failures: string[] = [];
    let uploadedCount = 0;
    try {
      await Promise.all(pending.map(async ({ file, previewUrl }) => {
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
        const path = `script-art/${draft.id || "draft"}/${crypto.randomUUID()}-${safeName}`;
        try {
          const upload = await api.storage.from(IMAGE_BUCKET).upload(path, file, {
            upsert: false,
            contentType: file.type,
          });
          if (upload.error) throw upload.error;
          const url = api.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
          setUncommittedImagePaths((current) => [...current, path]);
          setDraft((current) => ({
            ...current,
            blocks_json: current.blocks_json.map((block) => block.localPreview && block.url === previewUrl
              ? { type: "image", url, path, caption: file.name }
              : block),
          }));
          uploadedCount += 1;
        } catch (uploadError) {
          failures.push(`${file.name}: ${errorText(uploadError)}`);
          setDraft((current) => ({ ...current, blocks_json: current.blocks_json.filter((block) => block.url !== previewUrl) }));
        } finally {
          URL.revokeObjectURL(previewUrl);
        }
      }));
      if (uploadedCount) setMessage(`แสดงภาพตัวอย่างทันทีแล้ว ${uploadedCount} ภาพ · กดบันทึกการ์ดเพื่อเก็บภาพไว้กับสคริปต์`);
      if (failures.length) setError(`อัปโหลดบางภาพไม่สำเร็จ: ${failures.join(" · ")}`);
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingImage(false);
    const files = Array.from(event.dataTransfer.files).filter((file) => file.type.startsWith("image/"));
    void uploadImages(files);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    void uploadImages(files);
  };

  const openImageDrawer = (title: string, images: ScriptBlock[], index = 0) => {
    if (!images.length) return;
    setMessage("");
    setImageSelection({ title, images, index: Math.min(Math.max(index, 0), images.length - 1) });
  };

  const currentImage = imageSelection?.images[imageSelection.index];

  const downloadCurrentImage = async () => {
    if (!currentImage) return;
    if (!api || !currentImage.path) {
      window.open(currentImage.url, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      const result = await api.storage.from(IMAGE_BUCKET).download(currentImage.path);
      if (result.error || !result.data) throw result.error || new Error("ดาวน์โหลดภาพไม่สำเร็จ");
      const objectUrl = URL.createObjectURL(result.data);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = currentImage.caption?.trim() || "script-image";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (downloadError) {
      setError(errorText(downloadError));
    }
  };

  const copyScript = async () => {
    if (await copyText(draft.script_text)) setMessage("คัดลอกสคริปต์แล้ว");
    else setError("คัดลอกไม่ได้ โปรดตรวจสิทธิ์ Clipboard ของเบราว์เซอร์");
  };

  const copyImageLink = async () => {
    if (!currentImage) return;
    if (await copyText(currentImage.url)) setMessage("คัดลอกลิงก์ภาพแล้ว");
    else setError("คัดลอกลิงก์ไม่ได้ โปรดตรวจสิทธิ์ Clipboard ของเบราว์เซอร์");
  };

  const copyAiPayload = async () => {
    const payload = `สคริปต์ต้นฉบับ:\n${draft.script_text}\n\nบริบทสำหรับ AI:\n${draft.ai_context}\n\nกติกาการตอบ:\n${draft.ai_instruction}`;
    if (await copyText(payload)) setMessage("คัดลอกข้อความสำหรับ AI แล้ว");
    else setError("คัดลอกไม่ได้ โปรดตรวจสิทธิ์ Clipboard ของเบราว์เซอร์");
  };

  return (
    <div className="script-atelier min-h-full rounded-[2rem] p-4 text-white sm:p-6">
      <header className="script-atelier-hero mb-5 overflow-hidden rounded-[2rem] border p-5 sm:p-7">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="script-kicker"><Sparkles className="h-3.5 w-3.5" /> BB SCRIPT ATELIER</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">คลังสคริปต์และภาพสำหรับแชต</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-fuchsia-100/65">
              เก็บงานเขียนกับภาพการตลาดไว้หยิบใช้ตอบแชต แยกจากออเดอร์และโต๊ะสินค้า
            </p>
          </div>
          <Button onClick={() => openEditor()} className="script-primary">
            <Plus className="h-4 w-4" /> สร้างสคริปต์
          </Button>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-fuchsia-300/15 bg-[#12091c]/80 p-3">
        <label className="script-search">
          <Search className="h-4 w-4" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาชื่อ สคริปต์ หรือคำอธิบายภาพ..."
          />
        </label>
        <select className="script-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="ALL">ทุกสถานะ</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>
        <span className="ml-auto text-xs text-fuchsia-100/45">
          {visible.length} สคริปต์ · {totalImages} ภาพ
        </span>
      </div>

      {message && !editorOpen && !imageSelection && <div role="status" className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-400/[.06] p-3 text-sm text-emerald-200">{message}</div>}
      {error && <div className="mb-4 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div>}

      {loading ? (
        <div className="script-empty"><Loader2 className="h-6 w-6 animate-spin" />กำลังเปิดคลังสคริปต์และภาพ...</div>
      ) : visible.length ? (
        <div className="script-card-grid">
          {visible.map((card) => {
            const coverIndex = card.blocks_json.findIndex((block) => block.type === "image");
            const cover = coverIndex >= 0 ? card.blocks_json[coverIndex] : null;
            return (
              <article key={card.id} className="script-card">
                <div className="script-card-cover">
                  {cover ? (
                    <button
                      type="button"
                      className="script-card-cover-action"
                      aria-label={`เปิดภาพของ ${card.title}`}
                      onClick={() => openImageDrawer(card.title, card.blocks_json, coverIndex)}
                    >
                      <img src={cover.url} alt={cover.caption || card.title} />
                      <span className="script-cover-hint"><PanelRight className="h-3.5 w-3.5" /> เปิดภาพ</span>
                    </button>
                  ) : (
                    <button type="button" className="script-card-cover-action" onClick={() => openEditor(card)} aria-label={`เพิ่มภาพให้ ${card.title}`}>
                      <span className="script-card-orbit"><Sparkles /></span>
                      <span className="script-cover-hint"><ImagePlus className="h-3.5 w-3.5" /> เพิ่มภาพ</span>
                    </button>
                  )}
                  <span className={`script-status script-status-${card.status.toLowerCase()}`}>{card.status}</span>
                </div>
                <button type="button" className="script-card-open" onClick={() => openEditor(card)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 text-left">
                      <h2 className="text-xl font-semibold text-white">{card.title || "ไม่มีชื่อสคริปต์"}</h2>
                      <p className="mt-1 text-sm text-fuchsia-100/60">{card.subtitle || "ยังไม่มีคำโปรย"}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-fuchsia-300/15 px-2 py-1 text-[10px] text-fuchsia-100/55">v{card.version}</span>
                  </div>
                  <p className="mt-4 line-clamp-5 whitespace-pre-wrap text-left text-sm leading-6 text-slate-200/75">
                    {card.script_text || "ยังไม่มีเนื้อหาสคริปต์"}
                  </p>
                </button>
                <div className="flex items-center justify-between gap-2 px-4 pb-4 text-[11px] text-fuchsia-100/45">
                  <span>{card.blocks_json.length} ภาพ</span>
                  <button type="button" className="script-card-copy" onClick={async () => {
                    if (await copyText(card.script_text)) setMessage(`คัดลอก “${card.title}” แล้ว`);
                    else setError("คัดลอกไม่ได้ โปรดตรวจสิทธิ์ Clipboard ของเบราว์เซอร์");
                  }}>
                    <Copy className="h-3.5 w-3.5" /> คัดลอกสคริปต์
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="script-empty">
          <FilePlus2 className="h-8 w-8 text-fuchsia-300" />
          <p>{search.trim() ? "ไม่พบรายการที่ค้นหา" : "ยังไม่มีสคริปต์หรือภาพในคลัง"}</p>
          <Button onClick={() => openEditor()} variant="outline" className="border-fuchsia-300/25 text-fuchsia-100">สร้างรายการแรก</Button>
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={(open) => { if (!open) closeEditor(); }}>
        <DialogContent
          showCloseButton={false}
          className="script-editor-dialog max-h-[92dvh] w-[min(980px,calc(100vw-1.5rem))] max-w-none gap-0 overflow-hidden border-fuchsia-300/20 bg-[#100819] p-0 text-white shadow-[0_0_60px_rgba(201,60,230,.2)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-fuchsia-300/15 px-5 py-4 sm:px-7">
            <DialogHeader className="text-left">
              <p className="script-kicker">SCRIPT · EDITOR</p>
              <DialogTitle className="mt-1 text-xl text-white sm:text-2xl">
                {draft.id ? "แก้ไขสคริปต์" : "สร้างสคริปต์ใหม่"}
              </DialogTitle>
              <DialogDescription className="text-fuchsia-100/50">
                เก็บข้อความและภาพไว้ในคลังเดียวกัน แล้วคัดลอกไปใช้ตอบแชตได้
              </DialogDescription>
            </DialogHeader>
            <button type="button" className="script-icon-button shrink-0" onClick={closeEditor} aria-label="ปิดหน้าต่างแก้ไข">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[calc(92dvh-150px)] overflow-y-auto px-5 py-5 sm:px-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="script-field sm:col-span-2">
                ชื่อสคริปต์
                <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="ตั้งชื่อให้ค้นหาเจอง่าย" autoFocus />
              </label>
              <label className="script-field">
                คำโปรยสั้น
                <input value={draft.subtitle} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} placeholder="ข้อความสั้นบนการ์ด (ไม่บังคับ)" />
              </label>
              <label className="script-field">
                สถานะ
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </label>
              <label className="script-field sm:col-span-2">
                สคริปต์ต้นฉบับ
                <textarea className="script-editor" value={draft.script_text} onChange={(event) => setDraft({ ...draft, script_text: event.target.value })} placeholder="วางข้อความที่ใช้ตอบแชตตรงนี้..." />
              </label>
              <label className="script-field">
                บริบทสำหรับ AI (ไม่บังคับ)
                <textarea value={draft.ai_context} onChange={(event) => setDraft({ ...draft, ai_context: event.target.value })} placeholder="บันทึกบริบทที่ต้องการให้ AI เข้าใจ" />
              </label>
              <label className="script-field">
                กติกาการตอบ (ไม่บังคับ)
                <textarea value={draft.ai_instruction} onChange={(event) => setDraft({ ...draft, ai_instruction: event.target.value })} placeholder="บันทึกวิธีใช้หรือข้อควรระวัง" />
              </label>
            </div>

            <section className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="script-kicker">IMAGE LIBRARY</p>
                  <p className="mt-1 text-xs text-fuchsia-100/45">ภาพตัวอย่างขึ้นทันทีเมื่อเลือก · อัปโหลดเสร็จแล้วกดบันทึกการ์ดเพื่อผูกภาพไว้กับสคริปต์</p>
                </div>
                <span className="text-xs text-fuchsia-100/45">{draft.blocks_json.length} ภาพ</span>
              </div>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFileChange} />
              <div
                className={`script-dropzone ${draggingImage ? "is-dragging" : ""}`}
                onDragEnter={(event) => { event.preventDefault(); setDraggingImage(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => { if (event.currentTarget === event.target) setDraggingImage(false); }}
                onDrop={handleImageDrop}
              >
                <ImagePlus className="h-5 w-5 shrink-0" />
                <div><b>เพิ่มภาพประกอบ</b><small>ลากรูปมาวาง หรือเลือกหลายภาพจากเครื่อง</small></div>
                <Button type="button" variant="outline" disabled={saving} onClick={() => fileRef.current?.click()} className="border-cyan-300/25 text-cyan-100">
                  <ImagePlus className="h-4 w-4" /> เลือกภาพ
                </Button>
              </div>
              {draft.blocks_json.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {draft.blocks_json.map((block, index) => (
                    <div key={`${block.path ?? block.url}-${index}`} className="relative overflow-hidden rounded-xl border border-fuchsia-300/15 bg-black/25">
                      <button type="button" className="script-editor-image" disabled={block.localPreview} onClick={() => openImageDrawer(draft.title, draft.blocks_json, index)} aria-label={`ดูภาพ ${block.caption || index + 1}`}>
                        <img src={block.url} alt={block.caption || "ภาพในคลัง"} className="aspect-square w-full object-cover" />
                      </button>
                      <p className="truncate px-2 py-1.5 text-[10px] text-fuchsia-100/60">{block.caption || `ภาพ ${index + 1}`}</p>
                      <button
                        type="button"
                        onClick={() => {
                          if (block.path && !uncommittedImagePaths.includes(block.path)) {
                            setPendingDeletePaths((current) => [...current, block.path!]);
                          }
                          setDraft((current) => ({ ...current, blocks_json: current.blocks_json.filter((_, imageIndex) => imageIndex !== index) }));
                        }}
                        className="absolute right-1 top-1 rounded-full bg-black/75 p-1.5 text-white hover:bg-rose-600"
                        aria-label={`นำภาพ ${block.caption || index + 1} ออกจากรายการ`}
                      ><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-fuchsia-300/15 px-5 py-4 sm:px-7">
            <Button onClick={() => void save()} disabled={saving} className="script-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "กำลังบันทึก" : "บันทึกสคริปต์"}
            </Button>
            <Button onClick={() => void copyScript()} disabled={!draft.script_text} variant="outline" className="border-fuchsia-300/20 text-fuchsia-100">
              <Copy className="h-4 w-4" /> คัดลอกสคริปต์
            </Button>
            <Button onClick={() => void copyAiPayload()} disabled={!draft.script_text} variant="outline" className="border-cyan-300/20 text-cyan-100">
              <Sparkles className="h-4 w-4" /> คัดลอกให้ AI
            </Button>
            {draft.id && <Button onClick={() => void remove()} disabled={saving} variant="ghost" className="ml-auto text-rose-300 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /> ลบ</Button>}
            {message && <p className="w-full text-xs text-emerald-300">{message}</p>}
            {error && <p className="w-full text-xs text-rose-200">{error}</p>}
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={Boolean(imageSelection)} onOpenChange={(open) => { if (!open) setImageSelection(null); }}>
        <SheetContent side="right" className="w-[min(680px,100vw)] gap-0 border-fuchsia-300/20 bg-[#0c0713] p-0 text-white sm:max-w-[680px]">
          {imageSelection && currentImage && (
            <>
              <SheetHeader className="border-b border-fuchsia-300/15 pr-14 text-left">
                <p className="script-kicker">IMAGE · CHAT LIBRARY</p>
                <SheetTitle className="text-white">{imageSelection.title || "ภาพในคลัง"}</SheetTitle>
                <SheetDescription className="text-fuchsia-100/50">
                  {imageSelection.index + 1} / {imageSelection.images.length} · {currentImage.caption || "ภาพประกอบ"}
                </SheetDescription>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
                <div className="flex min-h-[45vh] items-center justify-center overflow-hidden rounded-2xl border border-fuchsia-300/15 bg-black/35 p-2">
                  <img src={currentImage.url} alt={currentImage.caption || imageSelection.title} className="max-h-[68vh] max-w-full object-contain" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={imageSelection.index <= 0}
                    onClick={() => setImageSelection((current) => current ? { ...current, index: current.index - 1 } : current)}
                    className="border-fuchsia-300/20 text-fuchsia-100"
                  >ก่อนหน้า</Button>
                  <span className="text-xs text-fuchsia-100/45">{currentImage.caption || "ภาพประกอบ"}</span>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={imageSelection.index >= imageSelection.images.length - 1}
                    onClick={() => setImageSelection((current) => current ? { ...current, index: current.index + 1 } : current)}
                    className="border-fuchsia-300/20 text-fuchsia-100"
                  >ถัดไป</Button>
                </div>
                {message && <p role="status" className="rounded-lg border border-emerald-300/20 bg-emerald-400/[.06] p-3 text-xs text-emerald-200">{message}</p>}
                <div className="flex flex-wrap gap-2 border-t border-fuchsia-300/10 pt-4">
                  <Button type="button" onClick={() => void downloadCurrentImage()} className="script-primary"><Download className="h-4 w-4" /> ดาวน์โหลดภาพ</Button>
                  <Button type="button" onClick={() => void copyImageLink()} variant="outline" className="border-cyan-300/20 text-cyan-100"><Copy className="h-4 w-4" /> คัดลอกลิงก์ภาพ</Button>
                  <a href={currentImage.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md border border-fuchsia-300/20 px-3 text-sm text-fuchsia-100 hover:bg-fuchsia-400/10">
                    <ExternalLink className="h-4 w-4" /> เปิดภาพต้นฉบับ
                  </a>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
