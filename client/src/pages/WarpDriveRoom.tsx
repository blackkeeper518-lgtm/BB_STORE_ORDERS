import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createServerSupabaseClient } from "@/lib/server-project-client";
import { Clipboard, Copy, FileSpreadsheet, FileUp, ImagePlus, Link2, LoaderCircle, Music2, Radar, Trash2, UploadCloud } from "lucide-react";
import * as XLSX from "xlsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ImageResult = { id: string; name: string; url: string; path: string };
type ParcelRow = {
  pickup_date: string;
  tracking_number: string;
  consignee: string;
  phone_number: string;
  address: string;
  cod_amount: string;
};
type StatusTone = "idle" | "working" | "success" | "error";

const parcelClient = createServerSupabaseClient("parcel");
const vaultClient = createServerSupabaseClient("vault");
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_SOUND_BYTES = 20 * 1024 * 1024;

function clean(value: unknown) { return String(value ?? "").trim(); }
function cleanHeader(value: unknown) { return clean(value).toLowerCase().replace(/[\s_\-().（）:：/\\]+/g, ""); }
function valueFrom(row: Record<string, unknown>, names: string[]) {
  const wanted = names.map(cleanHeader);
  const key = Object.keys(row).find(item => wanted.includes(cleanHeader(item)));
  return key == null ? "" : row[key];
}
function normalizePhone(value: unknown) {
  const digits = clean(value).replace(/\D/g, "");
  return digits.startsWith("66") && digits.length === 11 ? `0${digits.slice(2)}` : digits;
}
function normalizePickupDate(value: unknown) {
  return value instanceof Date && !Number.isNaN(value.getTime()) ? value.toISOString() : clean(value);
}
function mapParcel(row: Record<string, unknown>): ParcelRow {
  return {
    pickup_date: normalizePickupDate(valueFrom(row, ["Pickup Date", "pickup_date", "เวลาสร้าง", "วันเวลาสร้าง", "created_at", "create time", "วันที่รับพัสดุ", "วันที่รับ", "วันที่ส่ง", "วันที่"])),
    tracking_number: clean(valueFrom(row, ["Tracking number", "Tracking Number", "tracking_number", "เลขพัสดุ", "เลขที่พัสดุ", "เลขแทรค", "เลข Tracking"])),
    consignee: clean(valueFrom(row, ["Consignee", "consignee", "ชื่อผู้รับ", "ชื่อผู้รับพัสดุ", "ชื่อลูกค้า", "ผู้รับ"])),
    phone_number: normalizePhone(valueFrom(row, ["Phone number", "Phone Number", "phone_number", "phone", "เบอร์โทร", "เบอร์โทรศัพท์", "เบอร์ผู้รับ", "โทรศัพท์"])),
    address: clean(valueFrom(row, ["Address", "address", "ที่อยู่", "ที่อยู่จัดส่ง", "ที่อยู่ผู้รับ", "ที่อยู่ที่รับ"])),
    cod_amount: clean(valueFrom(row, ["COD Amount(THB)", "COD Amount (THB)", "COD Amount", "cod_amount", "ยอด COD", "ยอดCOD", "ยอดเก็บปลายทาง", "COD"])) || "0",
  };
}
function validParcel(row: ParcelRow) { return Boolean(row.tracking_number && row.consignee && row.phone_number && row.address); }
function safeName(value: string, fallback: string) { return value.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || fallback; }
function errorText(error: unknown) { return error instanceof Error ? error.message : String(error ?? "เกิดข้อผิดพลาด"); }

export default function WarpDriveRoom() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [soundName, setSoundName] = useState("");
  const [soundEvent, setSoundEvent] = useState("custom");
  const [soundFile, setSoundFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("SERVER UPLINK READY · ROOM 04");
  const [statusTone, setStatusTone] = useState<StatusTone>("idle");
  const [parcelSummary, setParcelSummary] = useState<{ file: string; imported: number; skipped: number } | null>(null);

  const setMessage = useCallback((message: string, tone: StatusTone = "idle") => {
    setStatus(message);
    setStatusTone(tone);
  }, []);

  const appendImage = useCallback((file: File, url: string, path: string) => {
    setImages(current => [{ id: `${Date.now()}-${Math.random()}`, name: file.name, url, path }, ...current]);
  }, []);

  const uploadImage = useCallback(async (file: File) => {
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) throw new Error(`${file.name}: รองรับ JPG, PNG, WEBP หรือ GIF เท่านั้น`);
    if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name}: ภาพใหญ่เกิน 15 MB`);
    setMessage(`กำลังส่งภาพ ${file.name} เข้า WARP IMAGE VAULT…`, "working");
    const path = `warp/${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}-${safeName(file.name, "image")}`;
    const upload = await vaultClient.storage.from("warp-images").upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error || !upload.data?.publicUrl) throw new Error(upload.error?.message || "สร้าง Public URL ของภาพไม่สำเร็จ");
    appendImage(file, upload.data.publicUrl, path);
    setMessage(`✓ ส่งภาพเข้า warp-images สำเร็จ · ${upload.data.publicUrl}`, "success");
  }, [appendImage, setMessage]);

  const importParcels = useCallback(async (file: File) => {
    setMessage(`กำลังอ่าน ${file.name}…`, "working");
    const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("ไม่พบชีตข้อมูลในไฟล์");
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const mapped = rawRows.map(mapParcel);
    const payload = mapped.filter(validParcel);
    const skipped = mapped.length - payload.length;
    if (!payload.length) throw new Error("ไม่พบแถวที่มีเลขพัสดุ ชื่อ เบอร์โทร และที่อยู่ครบ");
    for (let index = 0; index < payload.length; index += 50) {
      const chunk = payload.slice(index, index + 50);
      setMessage(`กำลังส่งข้อมูลขึ้น public.parcels · ${Math.min(index + chunk.length, payload.length)} / ${payload.length}…`, "working");
      const result = await parcelClient.from("parcels").insert(chunk);
      if (result.error) throw new Error(result.error.message);
    }
    setParcelSummary({ file: file.name, imported: payload.length, skipped });
    setMessage(`✓ นำเข้า public.parcels สำเร็จ · ${payload.length} records · ข้าม ${skipped}`, "success");
  }, [setMessage]);

  const handleFile = useCallback(async (file: File) => {
    if (!file) return;
    setBusy(true);
    try {
      if (/^image\//i.test(file.type)) await uploadImage(file);
      else if (/\.(csv|xlsx|xls)$/i.test(file.name)) await importParcels(file);
      else throw new Error("ไฟล์นี้ไม่ใช่ภาพหรือไฟล์พัสดุที่รองรับ");
    } catch (error) {
      setMessage(`✕ ${errorText(error)}`, "error");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [importParcels, setMessage, uploadImage]);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    void list.reduce((chain, file) => chain.then(() => handleFile(file)), Promise.resolve());
  }, [handleFile]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable=true]")) return;
      const files = Array.from(event.clipboardData?.items ?? [])
        .filter(item => item.kind === "file" && /^image\//i.test(item.type))
        .map(item => item.getAsFile())
        .filter((file): file is File => Boolean(file));
      if (!files.length) return;
      event.preventDefault();
      handleFiles(files);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  const showImageUrl = () => {
    const url = imageUrl.trim();
    if (!/^https:\/\//i.test(url)) { setMessage("กรุณาใส่ Public Image URL ที่ขึ้นต้นด้วย https://", "error"); return; }
    setImages(current => [{ id: `${Date.now()}-${Math.random()}`, name: "ภาพจาก Public URL", url, path: "" }, ...current]);
    setImageUrl("");
    setMessage("✓ แสดงภาพพร้อม Public URL แล้ว", "success");
  };

  const removeImage = async (item: ImageResult) => {
    if (!item.path) { setImages(current => current.filter(image => image.id !== item.id)); return; }
    try {
      await vaultClient.storage.from("warp-images").remove([item.path]);
      setImages(current => current.filter(image => image.id !== item.id));
      setMessage("✓ ลบภาพออกจากคลังแล้ว", "success");
    } catch (error) { setMessage(`✕ ลบภาพไม่สำเร็จ: ${errorText(error)}`, "error"); }
  };

  const uploadSound = async () => {
    if (!soundFile) { setMessage("กรุณาเลือกไฟล์เสียงก่อนบันทึก", "error"); return; }
    if (!soundFile.type.startsWith("audio/")) { setMessage("ไฟล์นี้ไม่ใช่ไฟล์เสียง", "error"); return; }
    if (soundFile.size > MAX_SOUND_BYTES) { setMessage("ไฟล์เสียงใหญ่เกิน 20 MB", "error"); return; }
    setBusy(true);
    const name = soundName.trim() || soundFile.name.replace(/\.[^.]+$/, "");
    const path = `sounds/${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}-${safeName(soundFile.name, "sound")}`;
    try {
      setMessage(`กำลังอัปโหลดเสียง ${soundFile.name}…`, "working");
      const upload = await vaultClient.storage.from("chat-sounds").upload(path, soundFile, { contentType: soundFile.type, upsert: false });
      if (upload.error || !upload.data?.publicUrl) throw new Error(upload.error?.message || "สร้าง Public URL เสียงไม่สำเร็จ");
      const soundKey = `warp-${safeName(name.toLowerCase(), "sound").replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
      const insert = await vaultClient.from("app_sounds").insert({ sound_key: soundKey, name, event_type: soundEvent, storage_bucket: "chat-sounds", storage_path: path, public_url: upload.data.publicUrl, mime_type: soundFile.type, is_enabled: true, sort_order: 100 });
      if (insert.error) { await vaultClient.storage.from("chat-sounds").remove([path]); throw new Error(insert.error.message); }
      setSoundFile(null);
      if (soundInputRef.current) soundInputRef.current.value = "";
      setMessage(`✓ บันทึก ${name} ลง app_sounds สำเร็จ`, "success");
    } catch (error) { setMessage(`✕ บันทึกเสียงไม่สำเร็จ: ${errorText(error)}`, "error"); }
    finally { setBusy(false); }
  };

  const statusClass = useMemo(() => statusTone === "error" ? "text-rose-300" : statusTone === "success" ? "text-lime-300" : statusTone === "working" ? "text-amber-200" : "text-cyan-200", [statusTone]);

  return <div className="warp-drive-room min-h-full overflow-y-auto p-3 text-white sm:p-5 lg:p-8">
    <main className="mx-auto w-full max-w-[1080px] pb-10">
      <header className="warp-drive-topbar flex items-center justify-between gap-4 border-b border-cyan-300/15 pb-5">
        <div className="flex items-center gap-3 font-mono text-sm tracking-[.13em] text-cyan-300"><span className="grid h-8 w-8 place-items-center rounded-full border border-cyan-300 shadow-[0_0_18px_rgba(73,244,255,.35)]">✦</span><span>WARP DRIVE / OPS</span></div>
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[.1em] text-slate-400"><span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_12px_#c5ff5a]" /> SERVER UPLINK READY</div>
      </header>
      <section className="relative px-2 py-12 text-center sm:py-16"><p className="font-mono text-[10px] tracking-[.35em] text-fuchsia-300">INTERSTELLAR PARCEL CONTROL</p><h1 className="mt-3 font-mono text-6xl font-normal leading-[.9] tracking-[-.05em] sm:text-8xl"><span className="text-cyan-50 [text-shadow:0_0_10px_rgba(73,244,255,.9),0_0_32px_rgba(73,244,255,.4)]">PARCEL</span><br /><span className="text-fuchsia-300 [text-shadow:0_0_12px_rgba(255,66,208,.85),0_0_38px_rgba(255,66,208,.35)]">DROP</span></h1><p className="mx-auto mt-5 max-w-2xl text-sm text-slate-400">แผงควบคุมรับข้อมูลขนส่งจากวงโคจร ส่งตรงสู่ <strong className="font-mono font-normal text-cyan-300">public.parcels</strong></p></section>
      <section className="warp-drive-panel p-4 sm:p-7"><div className="mb-5 flex items-start justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-300/[.07] text-cyan-300"><Radar className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold">เชื่อมต่อฐานข้อมูล</h2><p className="font-mono text-[10px] text-slate-500">SERVER API LINK // NO TOKEN IN BROWSER</p></div></div><span className="rounded-full border border-lime-300/25 px-3 py-1 font-mono text-[10px] text-lime-300">ROOM 04 · VAULT</span></div><p className="text-xs leading-5 text-slate-400">ระบบใช้ credentials ฝั่ง server ของ BB STORE โดยอัตโนมัติ ไม่ต้องกรอกหรือเก็บ Supabase key ในเบราว์เซอร์</p><p className={`mt-3 min-h-5 font-mono text-xs ${statusClass}`} aria-live="polite">{status}</p></section>
      <section className="warp-drive-panel mt-5 p-3 sm:p-4"><div className={`warp-drop-zone ${dragging ? "is-dragging" : ""}`} onClick={() => !busy && fileInputRef.current?.click()} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); handleFiles(event.dataTransfer.files); }} role="button" tabIndex={0} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click(); }}><div className="relative z-10 grid place-items-center"><span className="mb-4 grid h-20 w-20 place-items-center rounded-full border border-cyan-300/45 bg-cyan-300/10 text-cyan-300 shadow-[0_0_28px_rgba(73,244,255,.2)]"><UploadCloud className="h-9 w-9" /></span><h2 className="font-mono text-xl tracking-[.07em] text-white">DROP YOUR CARGO</h2><p className="mt-2 text-sm text-slate-400">ลากไฟล์พัสดุหรือภาพมาวาง · <span className="text-cyan-300">คลิกเลือกไฟล์ หรือ Ctrl+V ภาพแคปหน้าจอ</span></p><div className="mt-4 flex flex-wrap justify-center gap-2 font-mono text-[10px] text-slate-400"><span className="rounded-full border border-white/15 px-2 py-1">.XLSX</span><span className="rounded-full border border-white/15 px-2 py-1">.XLS</span><span className="rounded-full border border-white/15 px-2 py-1">.CSV</span><span className="rounded-full border border-white/15 px-2 py-1">JPG / PNG / WEBP</span><span className="rounded-full border border-white/15 px-2 py-1">FLASH EXPORT</span></div></div><input ref={fileInputRef} hidden type="file" multiple accept=".csv,.xlsx,.xls,image/jpeg,image/png,image/webp,image/gif" onChange={event => handleFiles(event.target.files ?? [])} /></div><div className="mt-3 flex gap-2 rounded-xl border border-fuchsia-300/15 bg-fuchsia-300/[.035] p-2"><Input value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="วาง Public Image URL เพื่อแสดงภาพ เช่น https://.../warp-images/warp/..." className="min-w-0 border-white/10 bg-black/20 font-mono text-xs" /><Button type="button" variant="outline" onClick={showImageUrl} className="shrink-0 border-cyan-300/30 text-cyan-200"><Link2 className="mr-2 h-4 w-4" />แสดงภาพ</Button></div></section>
      {parcelSummary ? <section className="warp-drive-panel mt-5 p-4"><div className="flex items-center gap-3"><FileSpreadsheet className="h-5 w-5 text-lime-300" /><div><p className="font-semibold text-lime-200">นำเข้า public.parcels สำเร็จ</p><p className="text-xs text-slate-400">{parcelSummary.file} · {parcelSummary.imported} records · ข้าม {parcelSummary.skipped} records</p></div></div></section> : null}
      {images.length ? <section className="warp-drive-panel mt-5 p-4"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-cyan-100"><ImagePlus className="h-4 w-4 text-cyan-300" />ภาพและ Public URL</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{images.map(item => <article key={item.id} className="overflow-hidden rounded-xl border border-fuchsia-300/25 bg-black/35"><div className="relative"><img src={item.url} alt={item.name} className="aspect-[4/3] w-full object-cover" /><button type="button" onClick={() => void removeImage(item)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full border border-rose-300/60 bg-rose-950/85 text-white" aria-label={`ลบ ${item.name}`}><Trash2 className="h-4 w-4" /></button></div><div className="p-3"><p className="truncate font-mono text-[11px] text-slate-200">{item.name}</p><p className="mt-1 truncate font-mono text-[10px] text-cyan-300">{item.url}</p><Button type="button" variant="outline" onClick={() => void navigator.clipboard.writeText(item.url)} className="mt-2 h-8 w-full border-cyan-300/30 text-xs text-cyan-200"><Copy className="mr-2 h-3.5 w-3.5" />คัดลอก Public URL</Button></div></article>)}</div></section> : null}
      <section className="warp-drive-panel mt-5 p-4 sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-fuchsia-300/30 bg-fuchsia-300/[.07] text-fuchsia-300"><Music2 className="h-5 w-5" /></span><div><h2 className="text-lg font-semibold">โยนเสียงเข้า SOUND VAULT</h2><p className="font-mono text-[10px] text-slate-500">FIXED TABLE // app_sounds · FIXED STORAGE // chat-sounds</p></div></div><span className="rounded-full border border-lime-300/25 px-3 py-1 font-mono text-[10px] text-lime-300">AUDIO DROP</span></div><div className="grid gap-3 md:grid-cols-[1.1fr_1fr_1.2fr]"><label className="grid gap-1 text-xs text-slate-300">ชื่อเสียง<Input value={soundName} onChange={event => setSoundName(event.target.value)} placeholder="เช่น Ragnarok · ปิดยอดสำเร็จ" className="border-white/10 bg-black/20" /></label><label className="grid gap-1 text-xs text-slate-300">เหตุการณ์<select value={soundEvent} onChange={event => setSoundEvent(event.target.value)} className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white"><option value="custom">กำหนดเอง</option><option value="new_message">ข้อความใหม่</option><option value="message_sent">ส่งสำเร็จ</option><option value="message_failed">ส่งไม่สำเร็จ</option><option value="new_order">ออเดอร์ใหม่</option></select></label><label className="grid gap-1 text-xs text-slate-300">ไฟล์เสียง<input ref={soundInputRef} type="file" accept="audio/*" onChange={event => setSoundFile(event.target.files?.[0] ?? null)} className="h-10 w-full rounded-md border border-dashed border-cyan-300/30 bg-black/20 p-2 text-xs text-slate-400" /></label></div><div className="mt-4 flex flex-wrap gap-2"><Button type="button" onClick={() => void uploadSound()} disabled={busy || !soundFile} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><Music2 className="mr-2 h-4 w-4" />บันทึกเสียงลงโต๊ะ</Button><Button type="button" variant="outline" onClick={() => { setSoundFile(null); if (soundInputRef.current) soundInputRef.current.value = ""; }} className="border-white/15 text-slate-300">ล้างไฟล์</Button>{busy ? <LoaderCircle className="h-5 w-5 animate-spin self-center text-cyan-300" /> : null}</div><p className="mt-3 text-xs text-slate-500">{soundFile ? `ไฟล์ที่เลือก: ${soundFile.name}` : "เลือกไฟล์เสียงไม่เกิน 20 MB แล้วกดบันทึก"}</p></section>
      <footer className="flex flex-col justify-between gap-2 px-1 pt-5 font-mono text-[10px] tracking-[.08em] text-slate-600 sm:flex-row"><span>WARP DRIVE // PARCEL DATA TRANSMISSION</span><span className="text-fuchsia-300/70">SECURE SERVER UPLINK · ROOM 04</span></footer>
    </main>
  </div>;
}
