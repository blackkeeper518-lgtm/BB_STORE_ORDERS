import * as XLSX from "xlsx";
import { useRef, useState } from "react";
import { AlertCircle, Check, Clipboard, FileSpreadsheet, ImagePlus, LoaderCircle, ShieldCheck, Trash2, Upload } from "lucide-react";
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
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export default function ParcelImport() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<ImportMessage | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [copiedPath, setCopiedPath] = useState("");

  const uploadImage = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) throw new Error(`${file.name}: ภาพใหญ่เกิน 15 MB`);
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) throw new Error(`${file.name}: รองรับภาพ JPG, PNG, WEBP และ GIF`);
    const id = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    const path = `warp/${Date.now()}-${id}-${safeFileName(file.name)}`;
    const uploaded = await projectApi.projects.storage.mutate({
      operation: "upload",
      bucket: "warp-images",
      path,
      contentBase64: await fileToBase64(file),
      contentType: file.type,
      upsert: false,
    });
    setImages(current => [{ name: file.name, path: uploaded.path, publicUrl: uploaded.publicUrl }, ...current]);
    setMessage({ tone: "success", text: `อัปโหลดภาพ ${file.name} เข้า Room 4 สำเร็จ` });
  };

  const importSpreadsheet = async (file: File) => {
    const workbook = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array", cellDates: true });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw new Error(`${file.name}: ไม่พบชีตในไฟล์`);
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
    if (!rawRows.length) throw new Error(`${file.name}: ไฟล์ว่างหรืออ่านแถวข้อมูลไม่ได้`);
    const mapped = rawRows.map(mapParcel);
    const rows = mapped.filter(row => row.tracking_number && row.consignee && row.phone_number && row.address);
    const skipped = mapped.length - rows.length;
    if (!rows.length) throw new Error(`${file.name}: ไม่พบแถวที่มีเลขพัสดุ ชื่อ เบอร์โทร และที่อยู่ครบ`);
    for (let offset = 0; offset < rows.length; offset += 50) {
      const chunk = rows.slice(offset, offset + 50);
      setMessage({ tone: "info", text: `กำลังนำเข้า ${file.name} เข้า Room 3 · ${Math.min(offset + chunk.length, rows.length)} / ${rows.length} แถว` });
      await projectApi.projects.execute.mutate({
        project: "parcel",
        table: "parcels",
        method: "POST",
        body: chunk,
        prefer: "return=minimal",
      });
    }
    setMessage({ tone: "success", text: `${file.name}: นำเข้า Room 3 สำเร็จ ${rows.length} แถว · ข้าม ${skipped} แถว` });
  };

  const processFiles = async (files: File[]) => {
    if (!files.length || busy) return;
    setBusy(true);
    setMessage(null);
    for (const file of files) {
      try {
        if (file.type.startsWith("image/")) {
          await uploadImage(file);
        } else if (/\.(csv|xlsx|xls)$/i.test(file.name)) {
          await importSpreadsheet(file);
        } else {
          throw new Error(`${file.name}: เลือกเฉพาะรูปภาพหรือไฟล์ CSV/XLS/XLSX`);
        }
      } catch (error) {
        setMessage({ tone: "error", text: error instanceof Error ? error.message : `นำเข้า ${file.name} ไม่สำเร็จ` });
        break;
      }
    }
    setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const removeImage = async (image: UploadedImage) => {
    if (!window.confirm(`ต้องการลบภาพ ${image.name} ออกจาก Room 4 ใช่ไหม?`)) return;
    try {
      await projectApi.projects.storage.mutate({ operation: "remove", bucket: "warp-images", paths: [image.path] });
      setImages(current => current.filter(item => item.path !== image.path));
      setMessage({ tone: "success", text: `ลบภาพ ${image.name} จาก Room 4 แล้ว` });
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "ลบภาพไม่สำเร็จ" });
    }
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#070911] text-slate-300"><span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />กำลังตรวจสอบสิทธิ์…</span></main>;
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#070911] text-slate-300">กำลังไปยังหน้าเข้าสู่ระบบ…</main>;
  if (user.role !== "admin") return <main className="grid min-h-screen place-items-center bg-[#070911] p-6 text-center text-rose-100"><div><ShieldCheck className="mx-auto mb-3 h-8 w-8" /><p className="font-semibold">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p><p className="mt-2 text-sm text-slate-400">การอัปโหลดถูกตรวจสิทธิ์ซ้ำที่ฝั่งเซิร์ฟเวอร์</p></div></main>;

  return (
    <main className="min-h-full bg-[#080911] px-4 py-6 text-slate-100 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] tracking-[.2em] text-cyan-200/60">LANE 02 · PARCEL RETURN</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">นำเข้าไฟล์ขนส่ง</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">จุดรับข้อมูลแยกปลายทางให้อัตโนมัติ: ไฟล์ขนส่งลง Room 3 · ภาพลง Room 4</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-emerald-200/[.06] px-3 py-2 text-xs text-emerald-100"><ShieldCheck className="h-4 w-4" /> ADMIN · SERVER ROUTED</div>
        </header>

        <input ref={fileInput} type="file" multiple accept=".csv,.xlsx,.xls,image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={event => void processFiles(Array.from(event.target.files ?? []))} />
        <section
          role="button"
          tabIndex={0}
          aria-label="เลือกหรือลากไฟล์ขนส่งและรูปภาพ"
          onClick={() => !busy && fileInput.current?.click()}
          onKeyDown={event => { if (!busy && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); fileInput.current?.click(); } }}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); void processFiles(Array.from(event.dataTransfer.files)); }}
          className={`cursor-pointer rounded-2xl border border-dashed p-8 text-center transition sm:p-12 ${dragging ? "border-cyan-200 bg-cyan-200/[.08] shadow-[0_0_40px_rgba(34,211,238,.12)]" : "border-cyan-200/25 bg-[#111521]/80 hover:border-cyan-200/50 hover:bg-[#141a28]"} ${busy ? "cursor-wait opacity-70" : ""}`}
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-200/[.07] text-cyan-100">{busy ? <LoaderCircle className="h-7 w-7 animate-spin" /> : <Upload className="h-7 w-7" />}</div>
          <h2 className="mt-4 text-lg font-semibold text-white">{busy ? "กำลังส่งข้อมูล…" : "วางไฟล์ที่นี่ หรือคลิกเพื่อเลือก"}</h2>
          <p className="mt-2 text-sm text-slate-400">รับไฟล์ CSV, XLS, XLSX และภาพ JPG, PNG, WEBP, GIF · อัปโหลดภาพได้ไม่เกิน 15 MB ต่อไฟล์</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200/20 bg-violet-200/[.06] px-3 py-2 text-violet-100"><FileSpreadsheet className="h-4 w-4" /> Room 3 · public.parcels</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-pink-200/20 bg-pink-200/[.06] px-3 py-2 text-pink-100"><ImagePlus className="h-4 w-4" /> Room 4 · warp-images</span>
          </div>
        </section>

        {message ? (
          <div role={message.tone === "error" ? "alert" : "status"} className={`mt-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${message.tone === "success" ? "border-emerald-200/20 bg-emerald-200/[.06] text-emerald-100" : message.tone === "error" ? "border-rose-200/20 bg-rose-200/[.06] text-rose-100" : "border-cyan-200/20 bg-cyan-200/[.06] text-cyan-100"}`}>
            {message.tone === "success" ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : message.tone === "error" ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />}
            <span>{message.text}</span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-[#10131d]/80 p-5">
            <div className="flex items-start gap-3"><FileSpreadsheet className="mt-0.5 h-5 w-5 text-violet-200" /><div><h2 className="font-semibold text-white">ไฟล์เลขขนส่ง · Room 3</h2><p className="mt-1 text-sm leading-6 text-slate-400">อ่านชีตแรก แล้วนำเข้าเลขพัสดุ ชื่อ เบอร์ ที่อยู่ COD และวันที่เป็นชุดละ 50 แถว ข้อมูลที่ขาดเลขพัสดุ ชื่อ เบอร์ หรือที่อยู่จะถูกข้าม</p></div></div>
          </section>
          <section className="rounded-2xl border border-white/10 bg-[#10131d]/80 p-5">
            <div className="flex items-start gap-3"><ImagePlus className="mt-0.5 h-5 w-5 text-pink-200" /><div><h2 className="font-semibold text-white">ภาพ · Room 4</h2><p className="mt-1 text-sm leading-6 text-slate-400">ภาพจะถูกอัปโหลดไปยัง bucket <code className="text-pink-100">warp-images</code> ผ่าน server และแสดง URL ให้คัดลอก โดยไม่ใส่ Supabase key ใน browser</p></div></div>
          </section>
        </div>

        {images.length ? (
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#10131d]/80 p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold text-white">ภาพที่อัปโหลดใน Room 4</h2><span className="text-xs text-slate-500">{images.length} ภาพ</span></div>
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map(image => (
                <article key={image.path} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[.08] bg-black/20 p-3">
                  <img src={image.publicUrl} alt={image.name} className="h-14 w-14 shrink-0 rounded-lg bg-black object-cover" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm text-slate-200">{image.name}</p><p className="truncate font-mono text-[10px] text-cyan-200/70">{image.publicUrl}</p></div>
                  <button type="button" title="คัดลอก URL" aria-label={`คัดลอก URL ของ ${image.name}`} className="rounded-lg p-2 text-cyan-100 hover:bg-cyan-100/10" onClick={async () => { try { await navigator.clipboard.writeText(image.publicUrl); setCopiedPath(image.path); window.setTimeout(() => setCopiedPath(""), 1400); } catch { setMessage({ tone: "error", text: "คัดลอก URL ไม่สำเร็จ" }); } }}>{copiedPath === image.path ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}</button>
                  <button type="button" title="ลบภาพจาก Room 4" aria-label={`ลบภาพ ${image.name}`} className="rounded-lg p-2 text-rose-200 hover:bg-rose-100/10" onClick={() => void removeImage(image)}><Trash2 className="h-4 w-4" /></button>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-600"><ShieldCheck className="h-3.5 w-3.5" />การเขียนข้อมูลพัสดุและ Storage ทำผ่าน API ที่ตรวจสิทธิ์ผู้ดูแลแล้ว</p>
      </div>
    </main>
  );
}
