import * as XLSX from "xlsx";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Check, CheckCircle2, ClipboardPaste, Database, ExternalLink, FileSpreadsheet, HardDriveUpload, ImagePlus, Link2, LoaderCircle, Music2, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { projectApi } from "@/lib/server-project-client";

type ParcelRow = {
  pickup_date: string;
  tracking_number: string;
  consignee: string;
  phone_number: string;
  address: string;
  cod_amount: string;
};
type UploadedImage = { name: string; path: string; publicUrl: string };
type ImportMessage = { tone: "success" | "error" | "info"; text: string };

function text(value: unknown) { return String(value ?? "").trim(); }
function cleanHeader(value: unknown) { return text(value).toLowerCase().replace(/[\s_\-().（）:：/\\]+/g, ""); }
function valueFrom(row: Record<string, unknown>, names: string[]) {
  const wanted = names.map(cleanHeader);
  const key = Object.keys(row).find(name => wanted.includes(cleanHeader(name)));
  return key == null ? "" : row[key];
}
function normalizePhone(value: unknown) {
  const digits = text(value).replace(/\D/g, "");
  return digits.startsWith("66") && digits.length === 11 ? `0${digits.slice(2)}` : digits;
}
function mapParcel(row: Record<string, unknown>): ParcelRow {
  const date = valueFrom(row, ["Pickup Date", "pickup_date", "เวลาสร้าง", "วันเวลาสร้าง", "created_at", "create time", "วันที่รับพัสดุ", "วันที่รับ", "วันที่ส่ง", "วันที่"]);
  return {
    pickup_date: date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : text(date),
    tracking_number: text(valueFrom(row, ["Tracking number", "Tracking Number", "tracking_number", "เลขพัสดุ", "เลขที่พัสดุ", "เลขแทรค", "เลข Tracking"])),
    consignee: text(valueFrom(row, ["Consignee", "consignee", "ชื่อผู้รับ", "ชื่อผู้รับพัสดุ", "ชื่อลูกค้า", "ผู้รับ"])),
    phone_number: normalizePhone(valueFrom(row, ["Phone number", "Phone Number", "phone_number", "phone", "เบอร์โทร", "เบอร์โทรศัพท์", "เบอร์ผู้รับ", "โทรศัพท์"])),
    address: text(valueFrom(row, ["Address", "address", "ที่อยู่", "ที่อยู่จัดส่ง", "ที่อยู่ผู้รับ", "ที่อยู่ที่รับ"])),
    cod_amount: text(valueFrom(row, ["COD Amount(THB)", "COD Amount (THB)", "COD Amount", "cod_amount", "ยอด COD", "ยอดCOD", "ยอดเก็บปลายทาง", "COD"])) || "0",
  };
}
function safeFileName(name: string) {
  return text(name).normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "image";
}
async function fileToBase64(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

const acceptedFiles = ".csv,.xlsx,.xls,image/jpeg,image/png,image/webp,image/gif";

export default function ParcelImport() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<ImportMessage | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [copiedPath, setCopiedPath] = useState("");

  const uploadImage = async (file: File) => {
    if (file.size > 18 * 1024 * 1024) throw new Error(`${file.name}: ภาพใหญ่เกิน 18 MB`);
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) throw new Error(`${file.name}: รองรับภาพ JPG, PNG, WEBP และ GIF`);
    const id = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    const path = `warp/${Date.now()}-${id}-${safeFileName(file.name)}`;
    const uploaded = await projectApi.projects.storage.mutate({ operation: "upload", bucket: "warp-images", path, contentBase64: await fileToBase64(file), contentType: file.type, upsert: false });
    setImages(current => [{ name: file.name, path: uploaded.path, publicUrl: uploaded.publicUrl }, ...current]);
    setMessage({ tone: "success", text: `อัปโหลดภาพ ${file.name} เข้า Room 4 สำเร็จ` });
  };

  const importSpreadsheet = async (file: File) => {
    const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array", cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw new Error(`${file.name}: ไม่พบชีตในไฟล์`);
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
    if (!rawRows.length) throw new Error(`${file.name}: ไฟล์ว่างหรืออ่านแถวข้อมูลไม่ได้`);
    const mapped = rawRows.map(mapParcel).filter(row => row.tracking_number && row.consignee && row.phone_number && row.address);
    const unique = Array.from(new Map(mapped.map(row => [row.tracking_number, row])).values());
    const skipped = rawRows.length - mapped.length + (mapped.length - unique.length);
    if (!unique.length) throw new Error(`${file.name}: ไม่พบแถวที่มีเลขพัสดุ ชื่อ เบอร์โทร และที่อยู่ครบ`);
    for (let offset = 0; offset < unique.length; offset += 50) {
      const chunk = unique.slice(offset, offset + 50);
      setMessage({ tone: "info", text: `กำลังส่ง ${file.name} เข้า Room 3 · ${Math.min(offset + chunk.length, unique.length)} / ${unique.length} แถว` });
      await projectApi.projects.execute.mutate({ project: "parcel", table: "parcels", method: "POST", body: chunk, prefer: "resolution=merge-duplicates,return=minimal" });
    }
    setMessage({ tone: "success", text: `${file.name}: นำเข้า Room 3 สำเร็จ ${unique.length} แถว · ตัดแถวซ้ำ/ไม่ครบ ${skipped} แถว` });
  };

  const processFiles = async (files: File[]) => {
    if (!files.length || busy) return;
    setBusy(true);
    setMessage(null);
    for (const file of files) {
      try {
        if (file.type.startsWith("image/")) await uploadImage(file);
        else if (/\.(csv|xlsx|xls)$/i.test(file.name)) await importSpreadsheet(file);
        else throw new Error(`${file.name}: เลือกเฉพาะรูปภาพหรือไฟล์ CSV/XLS/XLSX`);
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : `นำเข้า ${file.name} ไม่สำเร็จ` });
        break;
      }
    }
    setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (busy) return;
      const image = Array.from(event.clipboardData?.items ?? []).find(item => item.type.startsWith("image/"))?.getAsFile();
      if (image) { event.preventDefault(); void processFiles([new File([image], `clipboard-${Date.now()}.png`, { type: image.type || "image/png" })]); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [busy]);

  const removeImage = async (image: UploadedImage) => {
    if (!window.confirm(`ต้องการลบภาพ ${image.name} ออกจาก Room 4 ใช่ไหม?`)) return;
    try {
      await projectApi.projects.storage.mutate({ operation: "remove", bucket: "warp-images", paths: [image.path] });
      setImages(current => current.filter(item => item.path !== image.path));
      setMessage({ tone: "success", text: `ลบภาพ ${image.name} จาก Room 4 แล้ว` });
    } catch (error) { setMessage({ tone: "error", text: error instanceof Error ? error.message : "ลบภาพไม่สำเร็จ" }); }
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#060a12] text-slate-300"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" />กำลังตรวจสอบสิทธิ์…</main>;
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#060a12] text-slate-300">กำลังไปยังหน้าเข้าสู่ระบบ…</main>;
  if (user.role !== "admin") return <main className="grid min-h-screen place-items-center bg-[#060a12] p-6 text-center text-rose-100"><div><ShieldCheck className="mx-auto mb-3 h-8 w-8" /><p className="font-semibold">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p><p className="mt-2 text-sm text-slate-400">การอัปโหลดถูกตรวจสิทธิ์ซ้ำที่ฝั่งเซิร์ฟเวอร์</p></div></main>;

  return (
    <main className="relative min-h-full overflow-hidden bg-[#060a12] px-4 py-5 text-slate-100 sm:px-7 sm:py-7">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80 [background-image:radial-gradient(circle_at_12%_8%,rgba(34,211,238,.13),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(168,85,247,.12),transparent_25%),radial-gradient(circle_at_55%_100%,rgba(14,116,144,.10),transparent_32%)]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-cyan-100/10 pb-5">
          <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[.28em] text-cyan-200/70">✦ WARP DRIVE / OPS</p><p className="mt-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[.2em] text-emerald-200/75"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />SHIPMENT UPLINK READY</p></div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200/15 bg-emerald-200/[.04] px-3 py-2 text-[10px] font-mono uppercase tracking-[.14em] text-emerald-100/80"><ShieldCheck className="h-3.5 w-3.5" /> ADMIN · SERVER ROUTED</div>
        </header>

        <section className="grid gap-7 py-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div><p className="font-mono text-[10px] uppercase tracking-[.3em] text-cyan-200/45">INTERSTELLAR PARCEL CONTROL</p><h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-[-.04em] text-white sm:text-6xl">PARCEL <span className="text-cyan-200">DROP</span></h1><p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">แผงควบคุมรับข้อมูลขนส่งจากวงโคจร ส่งตรงสู่ <span className="font-mono text-cyan-100/80">public.parcels</span> และภาพไปยัง <span className="font-mono text-pink-100/80">warp-images</span></p></div>
          <div className="rounded-2xl border border-cyan-100/10 bg-[#0b111b]/75 p-4 backdrop-blur"><div className="flex items-center gap-2 text-xs font-semibold text-white"><Database className="h-4 w-4 text-cyan-200" />เชื่อมต่อฐานข้อมูล</div><p className="mt-2 font-mono text-[10px] uppercase tracking-[.16em] text-cyan-100/40">SERVER ENVIRONMENT · NO BROWSER SECRETS</p><div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[.07] pt-3"><span className="text-xs text-slate-400">Parcel uplink</span><span className="inline-flex items-center gap-1.5 text-xs text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />ONLINE</span></div><p className="mt-3 text-[11px] leading-5 text-slate-500">ระบบใช้ server route ที่ตรวจสิทธิ์ admin แล้ว จึงไม่ต้องวาง service_role key ในหน้าเว็บ</p></div>
        </section>

        <input ref={fileInput} type="file" multiple accept={acceptedFiles} className="hidden" onChange={event => void processFiles(Array.from(event.target.files ?? []))} />
        <section role="button" tabIndex={0} aria-label="เลือกหรือลากไฟล์ขนส่งและรูปภาพ" onClick={() => !busy && fileInput.current?.click()} onKeyDown={event => { if (!busy && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); fileInput.current?.click(); } }} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); void processFiles(Array.from(event.dataTransfer.files)); }} className={`group cursor-pointer rounded-2xl border border-dashed p-7 text-center transition sm:p-12 ${dragging ? "border-cyan-200 bg-cyan-200/[.08] shadow-[0_0_55px_rgba(34,211,238,.14)]" : "border-cyan-100/20 bg-[#0a111b]/80 hover:border-cyan-200/45 hover:bg-[#0d1723]"} ${busy ? "cursor-wait opacity-70" : ""}`}>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-cyan-200/25 bg-cyan-200/[.06] text-cyan-100 transition group-hover:scale-105 group-hover:border-cyan-200/55">{busy ? <LoaderCircle className="h-7 w-7 animate-spin" /> : <HardDriveUpload className="h-7 w-7" />}</div>
          <p className="mt-5 font-mono text-[10px] uppercase tracking-[.28em] text-cyan-200/55">{busy ? "TRANSMISSION IN PROGRESS" : "DROP YOUR CARGO"}</p><h2 className="mt-2 text-xl font-semibold text-white">{busy ? "กำลังส่งข้อมูล…" : "ลากไฟล์มาวาง หรือคลิกเลือก"}</h2><p className="mt-2 text-sm text-slate-500">รองรับ XLSX, XLS, CSV, JPG, PNG, WEBP, GIF · กด Ctrl+V เพื่อส่งภาพแคปหน้าจอ · ไม่เกิน 18 MB ต่อไฟล์</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[10px] font-mono uppercase tracking-[.12em]"><span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/20 bg-violet-200/[.05] px-3 py-2 text-violet-100/80"><FileSpreadsheet className="h-3.5 w-3.5" />Room 3 · public.parcels</span><span className="inline-flex items-center gap-1.5 rounded-full border border-pink-200/20 bg-pink-200/[.05] px-3 py-2 text-pink-100/80"><ImagePlus className="h-3.5 w-3.5" />Room 4 · warp-images</span><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/15 bg-cyan-200/[.04] px-3 py-2 text-cyan-100/65"><ClipboardPaste className="h-3.5 w-3.5" />PASTE READY</span></div>
        </section>

        {message ? <div role={message.tone === "error" ? "alert" : "status"} className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${message.tone === "success" ? "border-emerald-200/20 bg-emerald-200/[.06] text-emerald-100" : message.tone === "error" ? "border-rose-200/20 bg-rose-200/[.06] text-rose-100" : "border-cyan-200/20 bg-cyan-200/[.06] text-cyan-100"}`}>{message.tone === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : message.tone === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}<span>{message.text}</span></div> : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-cyan-100/10 bg-[#0a111b]/75 p-5"><div className="flex items-start gap-3"><FileSpreadsheet className="h-5 w-5 text-violet-200" /><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-violet-100/60">01 · ROOM 3</p><h2 className="mt-1 font-semibold text-white">Parcel uplink</h2><p className="mt-2 text-xs leading-5 text-slate-500">อ่านชีตแรก แปลงเลขพัสดุ ชื่อ เบอร์ ที่อยู่ COD และวันที่เป็นชุดละ 50 แถว</p></div></div></section>
          <section className="rounded-2xl border border-cyan-100/10 bg-[#0a111b]/75 p-5"><div className="flex items-start gap-3"><ImagePlus className="h-5 w-5 text-pink-200" /><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-pink-100/60">02 · ROOM 4</p><h2 className="mt-1 font-semibold text-white">Image uplink</h2><p className="mt-2 text-xs leading-5 text-slate-500">ภาพถูกส่งผ่าน server และคืน public URL ให้คัดลอก โดยไม่เปิดเผย service key</p></div></div></section>
          <section className="rounded-2xl border border-cyan-100/10 bg-[#0a111b]/75 p-5"><div className="flex items-start gap-3"><Music2 className="h-5 w-5 text-amber-200" /><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-amber-100/60">03 · SOUND VAULT</p><h2 className="mt-1 font-semibold text-white">Audio uplink</h2><p className="mt-2 text-xs leading-5 text-slate-500">จัดการเสียงแจ้งเตือนในห้อง Sound Lab เดิมของระบบ</p><a href="/secret-gallery?tab=sound" className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-100 hover:text-white"><Link2 className="h-3.5 w-3.5" />เปิด Sound Vault <ExternalLink className="h-3 w-3" /></a></div></div></section>
        </div>

        {images.length ? <section className="mt-6 rounded-2xl border border-cyan-100/10 bg-[#0a111b]/75 p-5"><div className="mb-4 flex items-center justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-pink-100/55">TRANSMISSION LOG · ROOM 4</p><h2 className="mt-1 font-semibold text-white">ภาพที่อัปโหลด</h2></div><span className="rounded-full border border-pink-200/15 px-2.5 py-1 text-xs text-pink-100/70">{images.length} ภาพ</span></div><div className="grid gap-3 sm:grid-cols-2">{images.map(image => <article key={image.path} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[.08] bg-black/20 p-3"><img src={image.publicUrl} alt={image.name} className="h-14 w-14 shrink-0 rounded-lg bg-black object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-200">{image.name}</p><p className="truncate font-mono text-[10px] text-cyan-200/60">{image.publicUrl}</p></div><button type="button" title="คัดลอก URL" aria-label={`คัดลอก URL ของ ${image.name}`} className="rounded-lg p-2 text-cyan-100 hover:bg-cyan-100/10" onClick={async () => { try { await navigator.clipboard.writeText(image.publicUrl); setCopiedPath(image.path); window.setTimeout(() => setCopiedPath(""), 1400); } catch { setMessage({ tone: "error", text: "คัดลอก URL ไม่สำเร็จ" }); } }}>{copiedPath === image.path ? <Check className="h-4 w-4" /> : <ClipboardPaste className="h-4 w-4" />}</button><button type="button" title="ลบภาพจาก Room 4" aria-label={`ลบภาพ ${image.name}`} className="rounded-lg p-2 text-rose-200 hover:bg-rose-100/10" onClick={() => void removeImage(image)}><Trash2 className="h-4 w-4" /></button></article>)}</div></section> : null}
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-100/10 pt-4 text-[10px] font-mono uppercase tracking-[.16em] text-slate-600"><span>WARP DRIVE // PARCEL DATA TRANSMISSION</span><span className="inline-flex items-center gap-1.5"><X className="h-3 w-3" />SECURE UPLINK · NEBULA SECTOR 07</span></footer>
      </div>
    </main>
  );
}
