import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readStockProducts, setInventoryAvailability, type StockProduct } from "@/lib/canonical";
import { classifyStockAvailability } from "@/lib/stock-availability";
import { Boxes, Check, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="text-right">
      <div className="font-mono text-3xl font-bold tracking-[0.18em] text-amber-200 drop-shadow-[0_0_14px_rgba(34,211,238,0.75)] sm:text-4xl">
        {new Intl.DateTimeFormat("th-TH", {
          timeZone: "Asia/Bangkok",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now)}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.28em] text-orange-300/80">
        {new Intl.DateTimeFormat("th-TH", {
          timeZone: "Asia/Bangkok",
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now)}
      </div>
    </div>
  );
}

export default function StockRoom() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({
    queryKey: ["canonical-stock"],
    queryFn: readStockProducts,
    refetchInterval: 60_000,
  });
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "out" | "in">("all");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["canonical-stock"] });
  };

  const availability = useMutation({
    mutationFn: async ({ item, available }: { item: StockProduct; available: boolean | null }) =>
      setInventoryAvailability({
        productId: item.id,
        sku: item.sku,
        available,
      }),
    onSuccess: refresh,
  });

  const products = useMemo(() => {
    const queryText = search.trim().toLowerCase();

    return (productsQuery.data ?? []).filter((item) => {
      const matchesSearch = `${item.sku} ${item.label} ${item.thName}`
        .toLowerCase()
        .includes(queryText);
      const status = classifyStockAvailability(item.stockStatus, item.stockQty, item.adminAvailability);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "out" && status === "out") ||
        (stockFilter === "in" && status === "in");

      return matchesSearch && matchesStock;
    });
  }, [productsQuery.data, search, stockFilter]);

  const allProducts = productsQuery.data ?? [];
  const inStock = allProducts.filter((item) => classifyStockAvailability(item.stockStatus, item.stockQty, item.adminAvailability) === "in").length;
  const outOfStock = allProducts.filter((item) => classifyStockAvailability(item.stockStatus, item.stockQty, item.adminAvailability) === "out").length;

  return (
    <div className="min-h-[calc(100vh-2rem)] space-y-5 bg-[#09070d] p-2 text-white sm:p-4 lg:p-6">
      <header className="rounded-3xl border border-orange-500/20 bg-[#100c19] p-6 shadow-2xl shadow-orange-950/20">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
              <Boxes className="h-4 w-4" /> NIGHTOPS · STOCK ROOM
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-white">คลังสินค้าจริง / สต๊อกกลาง</h1>
            <p className="mt-2 text-sm leading-6 text-orange-100/55">
              ROOM 04 · ปุ่มมี/หมดแก้เฉพาะสถานะผู้ดูแล · จำนวนจริง stock_qty ยังคุม trigger และหัวบิลไดนามิก
            </p>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
            <Button
              variant="outline"
              onClick={() => void productsQuery.refetch()}
              className="border-orange-400/20 bg-orange-400/5 text-orange-100"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${productsQuery.isFetching ? "animate-spin" : ""}`} />
              รีเฟรช
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl border-orange-500/15 bg-[#100d15]">
          <CardContent className="p-4"><p className="text-2xl font-semibold text-white">{allProducts.length}</p><p className="text-xs text-orange-100/45">สินค้าทั้งหมด</p></CardContent>
        </Card>
        <Card className="rounded-2xl border-orange-500/15 bg-[#100d15]">
          <CardContent className="p-4"><p className="text-2xl font-semibold text-emerald-300">{inStock}</p><p className="text-xs text-orange-100/45">มีของ</p></CardContent>
        </Card>
        <Card className="rounded-2xl border-amber-400/15 bg-[#100d15]">
          <CardContent className="p-4"><p className="text-2xl font-semibold text-rose-300">{outOfStock}</p><p className="text-xs text-orange-100/45">หมด</p></CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-orange-500/15 bg-[#100d15]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base text-white">คลังสินค้า · ROOM 04</CardTitle>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-orange-100/30" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหา SKU หรือสินค้า" className="border-orange-500/15 bg-black/20 pl-9 text-white placeholder:text-orange-100/25" />
              </div>
              <div className="flex rounded-xl border border-orange-500/15 bg-black/20 p-1">
                {([["all", "ทั้งหมด"], ["in", "มีของ"], ["out", "หมด"]] as const).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setStockFilter(value)} className={`rounded-lg px-2.5 py-1.5 text-[11px] transition ${stockFilter === value ? "bg-orange-500/20 text-orange-200" : "text-orange-100/45 hover:text-orange-100"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs">
              <thead className="border-b border-orange-500/10 text-orange-100/35">
                <tr>
                  <th className="p-3">สินค้า</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Display Master</th>
                  <th className="p-3">ราคากลาง</th>
                  <th className="p-3">จำนวนจริง</th>
                  <th className="p-3">สถานะคลัง</th>
                  <th className="p-3">สถานะผู้ดูแล</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item) => {
                  const stockAvailability = classifyStockAvailability(item.stockStatus, item.stockQty, item.adminAvailability);
                  const available = stockAvailability === "in";
                  return (
                    <tr key={item.id} className="border-b border-orange-500/[0.06] text-orange-50/75">
                      <td className="p-3 font-medium text-white">{item.thName || item.label}</td>
                      <td className="p-3 font-mono text-orange-200">{item.sku}</td>
                      <td className="p-3 text-orange-100/70">{item.label}</td>
                      <td className="p-3 text-amber-200">{item.price == null ? "—" : `${item.price.toLocaleString("th-TH")} บาท`}</td>
                      <td className="p-3 font-mono text-cyan-100">{item.stockQty.toLocaleString("th-TH")}</td>
                      <td className="p-3"><Badge className={stockAvailability === "out" ? "border-red-400/20 bg-red-400/10 text-red-300" : stockAvailability === "in" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-200"}>{stockAvailability === "in" ? "มีของ" : stockAvailability === "out" ? "หมด" : "ยังไม่กำหนด"}</Badge></td>
                      <td className="p-3"><div className="flex flex-wrap gap-1.5"><Button size="sm" onClick={() => availability.mutate({ item, available: true })} disabled={availability.isPending} className="bg-emerald-600/80 text-white hover:bg-emerald-500"><Check className="mr-1 h-3.5 w-3.5" />มีของ</Button><Button size="sm" variant="outline" onClick={() => availability.mutate({ item, available: false })} disabled={availability.isPending} className="border-red-400/20 bg-red-400/5 text-red-200"><X className="mr-1 h-3.5 w-3.5" />หมด</Button>{item.adminAvailability && <Button size="sm" variant="ghost" onClick={() => availability.mutate({ item, available: null })} disabled={availability.isPending} className="text-cyan-200/80 hover:bg-cyan-300/10 hover:text-cyan-100">ใช้จำนวนจริง</Button>}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {productsQuery.isError && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-200">โหลดคลังจาก ROOM 04 ไม่สำเร็จ: {productsQuery.error instanceof Error ? productsQuery.error.message : "ตรวจ connection และคอลัมน์ admin_availability"} · หากเพิ่งย้ายคลัง ให้รัน migration ก่อน</p>}
          {productsQuery.isLoading && <p className="p-8 text-center text-sm text-orange-100/40">กำลังโหลดคลังสินค้า…</p>}
          {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 && <p className="p-8 text-center text-sm text-orange-100/40">ไม่พบสินค้า</p>}
        </CardContent>
      </Card>
    </div>
  );
}
