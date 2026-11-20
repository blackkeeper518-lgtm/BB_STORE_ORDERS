import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readStockProducts, setInventoryAvailability } from "@/lib/canonical";
import { classifyStockAvailability } from "@/lib/stock-availability";
import { Boxes, Check, LoaderCircle, RefreshCw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type MobileStockPanelProps = { onClose: () => void };
type StockFilter = "all" | "in" | "out";
type StockFamily = "hot" | "cold" | "fruit" | "standard";

function getStockFamily(item: { category: string; sku: string; thName: string; label: string; emoji: string }): StockFamily {
  const category = item.category.toLocaleLowerCase("th-TH");
  const text = `${item.sku} ${item.thName} ${item.label}`.toLocaleLowerCase("th-TH");
  if (/(สายร้อน|ร้อน|hot|warm|fire|flame|sun)/i.test(`${category} ${text}`)) return "hot";
  if (/(สายเย็น|เย็น|cold|ice|frost|snow|cool)/i.test(`${category} ${text}`)) return "cold";
  if (/(สายผลไม้|ผลไม้|fruit|grape|strawberry|watermelon|apple|mango|pineapple)/i.test(`${category} ${text}`) || /[🍇🍓🍉🍏🍎🥭🍍]/u.test(item.emoji)) return "fruit";
  return "standard";
}

function getStockPattern(item: { thName: string; label: string; emoji: string }): string {
  if (/[🍇🍓🍉🍏🍎🥭🍍]/u.test(item.emoji)) return item.emoji;
  const text = `${item.thName} ${item.label}`.toLocaleLowerCase("th-TH");
  if (/องุ่น|grape/u.test(text)) return "🍇";
  if (/สตรอเบอร์รี|สตรอว์เบอร์รี|strawberry/u.test(text)) return "🍓";
  if (/แตงโม|watermelon/u.test(text)) return "🍉";
  if (/แอปเปิล|แอปเปิ้ล|apple/u.test(text)) return "🍏";
  if (/มะม่วง|mango/u.test(text)) return "🥭";
  if (/สับปะรด|pineapple/u.test(text)) return "🍍";
  return "🍇";
}

export default function MobileStockPanel({ onClose }: MobileStockPanelProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [notice, setNotice] = useState("");
  const productsQuery = useQuery({
    queryKey: ["canonical-stock"],
    queryFn: readStockProducts,
    refetchInterval: 60_000,
  });
  const availability = useMutation({
    mutationFn: ({ item, available }: { item: NonNullable<typeof productsQuery.data>[number]; available: boolean | null }) =>
      setInventoryAvailability({ productId: item.id, sku: item.sku, available }),
    onSuccess: async (_result, variables) => {
      setNotice(variables.available == null ? `กลับไปใช้สถานะจากจำนวนจริงของ ${variables.item.sku} แล้ว` : `บันทึกสถานะผู้ดูแลของ ${variables.item.sku} แล้ว · จำนวนจริงไม่เปลี่ยน`);
      await queryClient.invalidateQueries({ queryKey: ["canonical-stock"] });
    },
    onError: error => setNotice(error instanceof Error ? `บันทึกไม่สำเร็จ: ${error.message}` : "บันทึกสถานะไม่สำเร็จ"),
  });

  const allProducts = productsQuery.data ?? [];
  const inStockCount = allProducts.filter(item => classifyStockAvailability(item.stockStatus, item.stockQty, item.adminAvailability) === "in").length;
  const outOfStockCount = allProducts.filter(item => classifyStockAvailability(item.stockStatus, item.stockQty, item.adminAvailability) === "out").length;
  const products = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("th-TH");
    return allProducts.filter(item => {
      const availability = classifyStockAvailability(item.stockStatus, item.stockQty, item.adminAvailability);
      const matchesFilter = filter === "all" || availability === filter;
      const matchesSearch = `${item.sku} ${item.thName} ${item.label}`.toLocaleLowerCase("th-TH").includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [allProducts, filter, search]);

  return (
    <section className="mobile-inbox-custom-panel mobile-inbox-stock-panel" role="dialog" aria-modal="true" aria-label="คลังสินค้า" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <header className="mobile-inbox-theme-panel-head mobile-stock-panel-head">
        <div className="min-w-0">
          <strong className="flex items-center gap-2"><Boxes className="h-4 w-4" />คลังสินค้า</strong>
          <small>ROOM 04 · 🛒product_master · สถานะผู้ดูแลแยกจากจำนวนจริง</small>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="รีเฟรชคลังสินค้า" onClick={() => void productsQuery.refetch()} disabled={productsQuery.isFetching} className="h-9 w-9 border-white/10 bg-white/[0.04] text-white">
            <RefreshCw className={`h-4 w-4 ${productsQuery.isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button type="button" variant="outline" size="icon" aria-label="ปิดคลังสินค้า" onClick={onClose} className="h-9 w-9 border-white/10 bg-white/[0.04] text-white"><X className="h-4 w-4" /></Button>
        </div>
      </header>

      <div className="mobile-stock-controls">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-2"><small className="block text-[10px] text-emerald-100/60">มีของ</small><strong className="text-lg text-emerald-200">{inStockCount}</strong></div>
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.08] px-3 py-2"><small className="block text-[10px] text-rose-100/60">หมด</small><strong className="text-lg text-rose-200">{outOfStockCount}</strong></div>
        </div>
        <label className="mobile-stock-search"><Search className="h-4 w-4 shrink-0" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อสินค้า หรือ SKU" aria-label="ค้นหาสินค้าในคลัง" /></label>
        <div className="mobile-stock-filters" role="group" aria-label="กรองสถานะสินค้า">
          {([["all", "ทั้งหมด"], ["in", "มีของ"], ["out", "หมด"]] as const).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? "is-active" : ""}>{label}</button>
          ))}
        </div>
        <p className="mobile-stock-source-note">ปุ่มมี/หมดเปลี่ยนเฉพาะสถานะผู้ดูแล · จำนวนจริงยังใช้กับ trigger และหัวบิล</p>
      </div>

      {notice ? <p className={`mobile-stock-notice ${notice.startsWith("บันทึกไม่สำเร็จ") ? "is-error" : ""}`} role="status">{notice}</p> : null}
      <div className="mobile-stock-list">
        {productsQuery.isLoading ? <div className="mobile-stock-state"><LoaderCircle className="h-5 w-5 animate-spin" />กำลังโหลดคลังสินค้า…</div> : null}
        {productsQuery.isError ? <div className="mobile-stock-state is-error">โหลดคลังไม่สำเร็จ: {productsQuery.error instanceof Error ? productsQuery.error.message : "ตรวจการเชื่อมต่อ ROOM 04 และคอลัมน์ admin_availability"}</div> : null}
        {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? <div className="mobile-stock-state">ไม่พบสินค้าในรายการนี้</div> : null}
        {products.map(item => {
          const state = classifyStockAvailability(item.stockStatus, item.stockQty, item.adminAvailability);
          const family = getStockFamily(item);
          const isInStock = state === "in";
          const label = state === "in" ? "มีสินค้า" : state === "out" ? "หมด" : "ยังไม่กำหนด";
          return (
            <article key={`${item.id}-${item.sku}`} className="mobile-stock-card" data-stock-family={family} data-stock-pattern={family === "fruit" ? getStockPattern(item) : item.emoji}>
              <div className="mobile-stock-card-main">
                <span className="mobile-stock-emoji" aria-hidden="true">{item.emoji || "📦"}</span>
                <div className="min-w-0 flex-1">
                  <strong>{item.thName || item.label || item.sku}</strong>
                  <small>{item.sku} · คงเหลือจริง {item.stockQty}</small>
                </div>
                <span className={`mobile-stock-status ${state === "in" ? "is-in" : state === "out" ? "is-out" : "is-unknown"}`}>{label}</span>
              </div>
              <div className="mobile-stock-toggle" role="group" aria-label={`เปลี่ยนสถานะ ${item.sku}`}>
                <button type="button" aria-pressed={isInStock} disabled={availability.isPending} onClick={() => { setNotice(""); availability.mutate({ item, available: true }); }} className={isInStock ? "is-in" : ""}><Check className="h-4 w-4" />มีของ</button>
                <button type="button" aria-pressed={state === "out"} disabled={availability.isPending} onClick={() => { setNotice(""); availability.mutate({ item, available: false }); }} className={state === "out" ? "is-out" : ""}><X className="h-4 w-4" />หมด</button>
              </div>
              {item.adminAvailability ? <button type="button" disabled={availability.isPending} onClick={() => { setNotice(""); availability.mutate({ item, available: null }); }} className="mt-2 text-xs text-cyan-200/80 underline decoration-cyan-200/30 underline-offset-2">ใช้สถานะจากจำนวนจริง</button> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
