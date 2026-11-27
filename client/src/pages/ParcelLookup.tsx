import { useState } from "react";
import { CalendarDays, PackageCheck, PackageSearch, Search, UserRound, Wallet } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ParcelResult = {
  pickup_date?: string | null;
  tracking_number?: string | null;
  consignee?: string | null;
  cod_amount?: string | number | null;
};

type ParcelLookupResult = {
  success: boolean;
  reason?: string;
  data?: ParcelResult[];
};

const money = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });

function displayDate(value?: string | null) {
  if (!value) return "ไม่ระบุวันรับพัสดุ";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function displayCod(value?: string | number | null) {
  if (value == null || value === "") return "ไม่ระบุ";
  const amount = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? `${money.format(amount)} บาท` : `${String(value)} บาท`;
}

export default function ParcelLookup() {
  const [phone, setPhone] = useState("");
  const lookup = trpc.parcels.publicLookup.useMutation();
  const result = lookup.data as ParcelLookupResult | undefined;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = phone.replace(/\D/g, "");
    if (!/^0\d{9}$/.test(normalized)) return;
    await lookup.mutateAsync({ phone: normalized });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070911] px-4 py-10 text-slate-100 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(34,211,238,.15),transparent_38%),radial-gradient(ellipse_at_90%_25%,rgba(168,85,247,.11),transparent_32%)]" />
      <div className="relative mx-auto w-full max-w-2xl">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/[.08] text-cyan-200 shadow-[0_0_35px_rgba(34,211,238,.12)]">
            <PackageSearch className="h-7 w-7" />
          </div>
          <p className="font-mono text-[10px] tracking-[.28em] text-cyan-200/65">BB STORE · PARCEL RETURN</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">เช็กสถานะพัสดุ</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">กรอกเบอร์โทรศัพท์ 10 หลักที่ใช้สั่งซื้อ เพื่อค้นหารายการพัสดุของคุณ</p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-[#10131d]/90 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-7" aria-label="ค้นหาพัสดุ">
          <form onSubmit={submit}>
            <label htmlFor="parcel-phone" className="mb-2 block text-sm font-medium text-slate-200">เบอร์โทรศัพท์</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="parcel-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={phone}
                onChange={event => {
                  setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));
                  lookup.reset();
                }}
                placeholder="08XXXXXXXX"
                className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#080b12] px-4 font-mono text-base tracking-wider text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
                aria-describedby="parcel-phone-hint"
              />
              <button
                type="submit"
                disabled={phone.length !== 10 || lookup.isPending}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-cyan-200/30 bg-cyan-300 px-5 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Search className="h-4 w-4" />
                {lookup.isPending ? "กำลังค้นหา…" : "ค้นหาพัสดุ"}
              </button>
            </div>
            <p id="parcel-phone-hint" className="mt-2 text-xs text-slate-500">กรอกตัวเลขให้ครบ 10 หลัก และขึ้นต้นด้วย 0</p>
          </form>

          {lookup.error ? (
            <div role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-400/[.07] p-4 text-sm text-rose-100">{lookup.error.message || "ค้นหาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"}</div>
          ) : null}
          {result && !result.success ? (
            <div role="status" className="mt-5 rounded-xl border border-amber-200/20 bg-amber-200/[.06] p-4 text-sm text-amber-100">{result.reason || "ไม่พบข้อมูลพัสดุ"}</div>
          ) : null}
          {result?.success && result.data?.length ? (
            <div className="mt-6" aria-live="polite">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">พบรายการพัสดุ</h2>
                <span className="rounded-full border border-cyan-200/20 bg-cyan-200/[.06] px-2.5 py-1 text-xs text-cyan-100">{result.data.length} รายการ · เบอร์ลงท้าย {phone.slice(-4)}</span>
              </div>
              <div className="space-y-3">
                {result.data.map((parcel, index) => (
                  <article key={`${parcel.tracking_number || "parcel"}-${index}`} className="rounded-xl border border-white/10 bg-[#090c13] p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cyan-200/20 bg-cyan-200/[.07] text-cyan-100"><PackageCheck className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-slate-500">เลขพัสดุ</p>
                        <p className="mt-1 break-all font-mono text-lg font-semibold tracking-wide text-cyan-100">{parcel.tracking_number || "ยังไม่มีเลขพัสดุ"}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 border-t border-white/[.07] pt-4 sm:grid-cols-3">
                      <div className="flex gap-2 text-sm"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span className="min-w-0"><span className="block text-[11px] text-slate-500">วันที่รับพัสดุ</span><span className="mt-1 block text-slate-200">{displayDate(parcel.pickup_date)}</span></span></div>
                      <div className="flex gap-2 text-sm"><UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span className="min-w-0"><span className="block text-[11px] text-slate-500">ชื่อผู้รับ</span><span className="mt-1 block break-words text-slate-200">{parcel.consignee || "ไม่ระบุ"}</span></span></div>
                      <div className="flex gap-2 text-sm"><Wallet className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span className="min-w-0"><span className="block text-[11px] text-slate-500">ยอดเก็บปลายทาง</span><span className="mt-1 block text-slate-200">{displayCod(parcel.cod_amount)}</span></span></div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
        <footer className="mt-6 text-center text-xs leading-5 text-slate-600">ระบบจะแสดงเฉพาะข้อมูลพัสดุที่ค้นพบ · หากข้อมูลไม่ตรง กรุณาติดต่อร้านค้า</footer>
      </div>
    </main>
  );
}
