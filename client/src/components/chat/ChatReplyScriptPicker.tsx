import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/canonical";
import { FileText, LoaderCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";

type ReplyScriptCard = {
  id: string;
  title: string | null;
  script_text: string | null;
  stage: string | null;
  situation: string | null;
  situation_tags: string[] | null;
  product_sku: string | null;
  status: string | null;
  updated_at: string | null;
};

type ChatReplyScriptPickerProps = {
  disabled?: boolean;
  onSelect: (text: string, title: string) => void;
};

export function ChatReplyScriptPicker({
  disabled = false,
  onSelect,
}: ChatReplyScriptPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [scripts, setScripts] = useState<ReplyScriptCard[]>([]);

  const loadScripts = async () => {
    setLoading(true);
    setError("");
    try {
      const api = getSupabase("vault");
      const { data, error: queryError } = await api
        .from("order_deck_customer_scripts")
        .select("id,title,script_text,stage,situation,situation_tags,product_sku,status,updated_at")
        .eq("app_key", "BB_STORE_ORDERS")
        .eq("status", "ACTIVE")
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false })
        .limit(200);
      if (queryError) throw queryError;
      setScripts((data ?? []) as ReplyScriptCard[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  const visibleScripts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const usable = scripts.filter((script) => Boolean(script.script_text?.trim()));
    if (!query) return usable;
    return usable.filter((script) =>
      `${script.title ?? ""}\n${script.stage ?? ""}\n${script.situation ?? ""}\n${(script.situation_tags ?? []).join(" ")}\n${script.product_sku ?? ""}\n${script.script_text ?? ""}`
        .toLocaleLowerCase()
        .includes(query),
    );
  }, [scripts, search]);

  const openPicker = () => {
    setOpen(true);
    setSearch("");
    void loadScripts();
  };

  return (
    <>
      <button
        type="button"
        data-chat-script-picker
        aria-label="เลือกสคริปต์"
        title="เลือกสคริปต์"
        disabled={disabled}
        onClick={openPicker}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-fuchsia-300/25 bg-fuchsia-400/[0.07] p-0 text-fuchsia-100 transition hover:border-fuchsia-200/50 hover:bg-fuchsia-300/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[82dvh] overflow-hidden border-fuchsia-400/25 bg-[#100b18] p-4 text-fuchsia-50 shadow-[0_20px_80px_rgba(0,0,0,.7)] sm:max-w-xl">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle className="text-fuchsia-50">เลือกสคริปต์ตอบแชท</DialogTitle>
            <DialogDescription className="text-fuchsia-100/55">
              แตะสคริปต์เพื่อใส่ในช่องพิมพ์ แล้วตรวจหรือแก้ก่อนกดส่งเอง
            </DialogDescription>
          </DialogHeader>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fuchsia-100/40" />
            <Input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาชื่อหรือข้อความสคริปต์…"
              className="border-fuchsia-300/20 bg-black/25 pl-9 text-fuchsia-50 placeholder:text-fuchsia-100/35 focus-visible:ring-fuchsia-300/25"
            />
          </label>
          <div className="max-h-[55dvh] space-y-2 overflow-y-auto overscroll-contain pr-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-fuchsia-100/60">
                <LoaderCircle className="h-4 w-4 animate-spin" /> กำลังโหลดสคริปต์…
              </div>
            ) : error ? (
              <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-500/[0.07] p-3 text-xs leading-5 text-rose-100">
                โหลดคลังสคริปต์ไม่สำเร็จ: {error}
              </p>
            ) : visibleScripts.length ? (
              visibleScripts.map((script) => {
                const title = script.title?.trim() || "ไม่มีชื่อสคริปต์";
                const text = script.script_text?.trim() ?? "";
                const subtitle = [script.situation?.trim(), script.stage?.trim(), script.product_sku?.trim()]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <button
                    key={script.id}
                    type="button"
                    onClick={() => {
                      onSelect(text, title);
                      setOpen(false);
                    }}
                    className="block w-full rounded-xl border border-fuchsia-300/15 bg-white/[0.025] p-3 text-left transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.06]"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">{title}</span>
                        {subtitle ? (
                          <span className="mt-1 block truncate text-xs text-fuchsia-100/55">{subtitle}</span>
                        ) : null}
                      </span>
                      <span className="shrink-0 rounded-full border border-emerald-300/20 px-2 py-0.5 text-[9px] text-emerald-200/80">ACTIVE</span>
                    </span>
                    <span className="mt-2 block whitespace-pre-wrap break-words text-xs leading-5 text-fuchsia-50/75">{text}</span>
                  </button>
                );
              })
            ) : (
              <p className="rounded-xl border border-fuchsia-300/10 bg-black/15 p-4 text-center text-sm text-fuchsia-100/50">
                {search.trim() ? "ไม่พบสคริปต์ที่ตรงกัน" : "ยังไม่มีสคริปต์ ACTIVE ที่เลือกได้"}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
