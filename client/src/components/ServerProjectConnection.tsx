import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Database, LoaderCircle, XCircle } from "lucide-react";

type Project = "main" | "tracking" | "parcel" | "vault" | "chat";

export function ServerProjectConnection({ project, title, description }: { project: Project; title: string; description: string }) {
  const query = trpc.projects.check.useQuery({ project }, { retry: false, refetchOnWindowFocus: true });
  const results = query.data?.results ?? [];
  const okCount = results.filter(item => item.status === "ready").length;
  const isError = query.isError || results.some(item => item.status === "error");
  return <Card className="border-white/10 bg-black/20 text-white">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-sm"><Database className="h-4 w-4 text-cyan-300" />{title}</CardTitle>
      <p className="text-xs leading-5 text-white/55">{description}</p>
      <p className="text-[10px] text-cyan-100/55">ข้อมูลเชื่อมต่อและ service-role key ที่ใช้งานจริงอยู่บน Server · ค่าบราว์เซอร์เดิมไม่ถูกโหลด ไม่ถูกใช้ และไม่ถูกส่ง</p>
    </CardHeader>
    <CardContent className="space-y-3">
      {project !== "chat" ? <div className="grid gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 sm:grid-cols-2">
        <label className="grid gap-1 text-[10px] text-white/45">ช่องสำรอง URL เดิม<Input disabled value="" placeholder="ค่าเดิมคงอยู่ใน browser storage แต่ไม่โหลดในหน้านี้" className="h-8 border-white/10 bg-black/20 text-[10px] disabled:opacity-70" /></label>
        <label className="grid gap-1 text-[10px] text-white/45">ช่องสำรอง Anon / Publishable Key<Input disabled type="password" value="" placeholder="ไม่อ่าน ไม่ใช้ ไม่ส่ง" className="h-8 border-white/10 bg-black/20 text-[10px] disabled:opacity-70" /></label>
      </div> : <p className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-[10px] text-white/45">ไม่มีช่อง Chat credential ใน browser · ใช้ server-side credentials เท่านั้น</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching} className="border-cyan-300/25 text-cyan-100">
          {query.isFetching ? <LoaderCircle className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Database className="mr-2 h-3.5 w-3.5" />}
          {query.isFetching ? "กำลังตรวจจาก Server…" : "ตรวจการเชื่อมต่อจาก Server"}
        </Button>
        {query.data ? <span className={`inline-flex items-center gap-1 text-xs ${isError ? "text-amber-200" : "text-emerald-200"}`}>
          {isError ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          ผ่าน {okCount}/{results.length} จุด
        </span> : null}
        {query.isError ? <span className="text-xs text-red-200">{query.error.message}</span> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {results.map(item => <div key={item.table} className="flex items-start justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.025] p-2.5">
          <div className="min-w-0"><p className="truncate font-mono text-[11px] text-white/85">{item.table}</p><p className="mt-1 text-[10px] text-white/45">{item.label}</p>
            {item.status === "error" && item.detail ? <p className="mt-1 break-words text-[10px] text-amber-200/80">{item.detail}</p> : null}
          </div>
          <span className={`shrink-0 text-[10px] font-semibold ${item.status === "ready" ? "text-emerald-300" : "text-red-300"}`}>{item.status === "ready" ? `พร้อม${item.count == null ? "" : ` · ${item.count} แถว`}` : "ตรวจไม่ผ่าน"}</span>
        </div>)}
        {!query.isLoading && !query.isError && !results.length ? <p className="text-xs text-white/45">ยังไม่มีผลตรวจ · กดปุ่มเพื่อตรวจ config ฝั่ง Server</p> : null}
      </div>
    </CardContent>
  </Card>;
}
