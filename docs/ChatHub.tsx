import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/useMobile";
import { readChatMessages, readChatThreads, subscribeToChatMessages } from "@/lib/canonical";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { ChevronDown, CircleUserRound, ImagePlus, LoaderCircle, MapPin, MessageCircle, RefreshCw, Search, Send, Truck, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ChatThread = Record<string, any> & {
  key: string;
  pageId: string;
  threadId: string;
  customerId?: string;
  pageName: string;
  customerName: string;
  preview: string;
  latestAt?: string;
  messageCount: number;
};

function timeLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

function imageUrls(value: string | null | undefined) {
  if (!value) return [];
  try {
    const attachments = JSON.parse(value) as unknown;
    const urls: string[] = [];
    const walk = (item: unknown) => {
      if (!item || typeof item !== "object") return;
      const record = item as Record<string, unknown>;
      for (const candidate of [record.url, record.file_url, (record.payload as Record<string, unknown> | undefined)?.url]) {
        if (typeof candidate === "string" && /^https?:\/\//i.test(candidate) && !urls.includes(candidate)) urls.push(candidate);
      }
      Object.values(record).forEach(child => Array.isArray(child) && child.forEach(walk));
    };
    if (Array.isArray(attachments)) attachments.forEach(walk); else walk(attachments);
    return urls;
  } catch { return []; }
}

function stripSpeakerPrefix(value: string) { return value.replace(/^\s*\[(?:เพจ|ลูกค้า)\]\s*/i, "").trim(); }

const quickReplies = [
  "สวัสดีค่ะ สนใจรับกี่คอตดีคะ?",
  "มีบริการเก็บเงินปลายทางค่ะ",
  "ขอชื่อ ที่อยู่ และเบอร์โทรสำหรับจัดส่งด้วยค่ะ",
  "ขอบคุณค่ะ เดี๋ยวแอดมินรีบเช็กให้ค่ะ",
];

export default function ChatHub() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [pageFilterOpen, setPageFilterOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "inbound" | "outbound">("all");
  const [replyText, setReplyText] = useState("");
  const [replyImageUrl, setReplyImageUrl] = useState("");
  const [composerOpen, setComposerOpen] = useState(true);
  const [deliveryStatus, setDeliveryStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const threadsQuery = useQuery({ queryKey: ["canonical-chat-threads"], queryFn: readChatThreads, refetchInterval: 15_000 });
  const threads = (threadsQuery.data ?? []) as ChatThread[];
  const availablePages = useMemo<Array<[string, string]>>(() => Array.from(new Map(
    threads.filter(thread => thread.pageId && thread.pageName && thread.pageName !== "ไม่ระบุเพจ").map(thread => [thread.pageId, thread.pageName] as [string, string]),
  ).entries()).sort((a, b) => a[1].localeCompare(b[1], "th")), [threads]);
  const filteredThreads = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return threads.filter(thread => {
      if (selectedPages.length && !selectedPages.includes(thread.pageId)) return false;
      if (unreadOnly && !thread.unread) return false;
      if (!needle) return true;
      return [thread.customerName, thread.pageName, thread.preview, ...(thread.chatTimeline ?? [])].some(value => String(value ?? "").toLocaleLowerCase().includes(needle));
    });
  }, [threads, selectedPages, unreadOnly, search]);
  const selected = filteredThreads.find(thread => thread.key === selectedKey) ?? filteredThreads[0] ?? null;
  const selectedPageId = selected?.pageId ?? "";
  const selectedThreadId = selected?.threadId ?? "";
  const selectedCustomerId = selected?.customerId ?? "";
  const messagesQuery = useQuery({
    queryKey: ["canonical-chat-messages", selectedPageId, selectedThreadId],
    queryFn: () => readChatMessages(selectedPageId, selectedThreadId),
    enabled: Boolean(selectedPageId && selectedThreadId),
    refetchInterval: 5_000,
  });
  const messages = messagesQuery.data ?? [];
  const visibleMessages = messages.filter(message => messageFilter === "all" || (messageFilter === "outbound" ? message.direction === "outbound" : message.direction === "inbound"));

  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(() => {
      void threadsQuery.refetch();
      if (selectedPageId && selectedThreadId) void messagesQuery.refetch();
    });
    return unsubscribe;
  }, [selectedPageId, selectedThreadId]);

  useEffect(() => {
    if (!selectedKey && filteredThreads[0]) setSelectedKey(filteredThreads[0].key);
    if (selectedKey && !filteredThreads.some(thread => thread.key === selectedKey)) setSelectedKey(filteredThreads[0]?.key ?? null);
  }, [filteredThreads, selectedKey]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get("page_id");
    const threadId = params.get("thread_id");
    if (!pageId || !threadId) return;
    const target = threads.find(thread => thread.pageId === pageId && thread.threadId === threadId);
    if (target) setSelectedKey(target.key);
  }, [threads]);

  useEffect(() => {
    if (!timelineRef.current) return;
    timelineRef.current.scrollTo({ top: timelineRef.current.scrollHeight, behavior: "auto" });
  }, [selectedKey, messages.length]);

  const uploadImage = trpc.chat.uploadImage.useMutation({ onSuccess: result => setReplyImageUrl(new URL(result.url, window.location.origin).toString()) });
  const sendReply = trpc.chat.sendReply.useMutation({
    onMutate: () => setDeliveryStatus("sending"),
    onSuccess: () => {
      setDeliveryStatus("sent");
      setReplyText("");
      setReplyImageUrl("");
      void Promise.all([messagesQuery.refetch(), threadsQuery.refetch()]);
    },
    onError: () => setDeliveryStatus("failed"),
  });

  function sendCurrentReply() {
    const text = replyText.trim();
    const imageUrl = replyImageUrl.trim();
    if (sendReply.isPending || !selectedPageId || !selectedThreadId || !selectedCustomerId || (!text && !imageUrl)) return;
    sendReply.mutate({ pageId: selectedPageId, threadId: selectedThreadId, recipientId: selectedCustomerId, text: text || undefined, imageUrl: imageUrl || undefined });
  }

  function handleImageUpload(file?: File) {
    if (!file || !file.type.startsWith("image/") || file.size > 6_000_000) return;
    const reader = new FileReader();
    reader.onload = () => uploadImage.mutate({ fileName: file.name, contentType: file.type as "image/jpeg", base64: String(reader.result) });
    reader.readAsDataURL(file);
  }

  const trackingMessage = selected?.facebook_tracking_message;
  const draksideMessage = selected?.drakside_tracking_message;

  return <div className="flex h-full min-h-0 flex-col gap-4 bg-[#080b12] p-3 text-white sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/20 bg-[#0d1420] p-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-300">CHAT · SUPABASE</p><h1 className="mt-1 text-2xl font-semibold">กล่องข้อความรวม</h1><p className="mt-1 text-xs text-slate-500">อ่านข้อความจาก Supabase และตอบกลับ Messenger · ไม่มีการวิเคราะห์หรือสร้างออเดอร์ในเว็บ</p></div>
      <Button variant="outline" onClick={() => void threadsQuery.refetch()} disabled={threadsQuery.isFetching} className="border-cyan-300/20 bg-cyan-400/5 text-cyan-100"><RefreshCw className={`mr-2 h-4 w-4 ${threadsQuery.isFetching ? "animate-spin" : ""}`} />รีเฟรช</Button>
    </header>

    {threadsQuery.error ? <p className="rounded-xl border border-rose-300/20 bg-rose-500/5 p-3 text-sm text-rose-100">อ่านห้องแชทไม่สำเร็จ: {threadsQuery.error instanceof Error ? threadsQuery.error.message : String(threadsQuery.error)}</p> : null}

    <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
      <Card className="flex min-h-0 flex-col overflow-hidden border-white/10 bg-[#101116]">
        <CardHeader className="space-y-3 border-b border-white/10 p-4">
          <div className="flex items-center justify-between"><CardTitle className="text-base">ห้องแชท <span className="ml-2 text-xs font-normal text-slate-500">{filteredThreads.length}</span></CardTitle><button type="button" onClick={() => setPageFilterOpen(value => !value)} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-400">เพจ {selectedPages.length || "ทั้งหมด"}</button></div>
          {pageFilterOpen ? <div className="max-h-32 space-y-1 overflow-auto rounded-lg border border-white/10 bg-black/20 p-2"><button type="button" onClick={() => setSelectedPages([])} className="text-xs text-cyan-200">ทุกเพจ</button>{availablePages.map(([id, name]) => <label key={id} className="flex items-center gap-2 py-1 text-xs text-slate-300"><input type="checkbox" checked={selectedPages.includes(id)} onChange={event => setSelectedPages(current => event.target.checked ? [...current, id] : current.filter(item => item !== id))} />{name}</label>)}</div> : null}
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อลูกค้าหรือข้อความ" className="border-white/10 bg-black/20 pl-9 text-white" /></div>
          <button type="button" onClick={() => setUnreadOnly(value => !value)} className={`self-start rounded-lg px-2.5 py-1.5 text-xs ${unreadOnly ? "bg-cyan-400/15 text-cyan-100" : "text-slate-500 hover:bg-white/5"}`}>{unreadOnly ? "เฉพาะยังไม่อ่าน" : "ทุกห้อง"}</button>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 overflow-auto p-2">
          {threadsQuery.isLoading ? <p className="p-8 text-center text-sm text-slate-500">กำลังโหลดห้อง…</p> : null}
          {!threadsQuery.isLoading && filteredThreads.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">ไม่พบห้องแชท</p> : null}
          {filteredThreads.map(thread => <button key={thread.key} onClick={() => setSelectedKey(thread.key)} className={`mb-1 w-full rounded-xl p-3 text-left transition ${selected?.key === thread.key ? "border border-cyan-300/25 bg-cyan-400/[.08]" : "border border-transparent hover:bg-white/[.04]"}`}>
            <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{thread.customerName || "ลูกค้า"}</span><span className="shrink-0 text-[10px] text-slate-500">{timeLabel(thread.latestAt)}</span></div>
            <p className="mt-1 truncate text-xs text-cyan-100/50">{thread.pageName}</p><p className="mt-1 truncate text-xs text-slate-400">{thread.preview}</p>
          </button>)}
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-col overflow-hidden border-white/10 bg-[#101116]">
        {!selected ? <div className="flex flex-1 items-center justify-center text-sm text-slate-500">เลือกห้องแชทเพื่อดูข้อความ</div> : <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4"><div className="flex min-w-0 items-center gap-3"><CircleUserRound className="h-8 w-8 shrink-0 text-cyan-300" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{selected.customerName}</p><p className="truncate text-xs text-slate-500">{selected.pageName} · {timeLabel(selected.latestAt)}</p></div></div><div className="flex gap-1">{([ ["all", "ทั้งหมด"], ["inbound", "ลูกค้า"], ["outbound", "เพจ"] ] as const).map(([value, label]) => <button key={value} onClick={() => setMessageFilter(value)} className={`rounded-lg px-2 py-1 text-[10px] ${messageFilter === value ? "bg-cyan-400/15 text-cyan-100" : "text-slate-500 hover:bg-white/5"}`}>{label}</button>)}</div></div>
          <div ref={timelineRef} className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
            {messagesQuery.isLoading ? <p className="p-8 text-center text-sm text-slate-500"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />กำลังโหลดข้อความ…</p> : null}
            {visibleMessages.map(message => { const outgoing = message.direction === "outbound"; return <div key={message.id} className={`flex ${outgoing ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl p-3 text-sm ${outgoing ? "border border-violet-300/20 bg-violet-500/10 text-violet-50" : "border border-emerald-300/20 bg-emerald-500/[.07] text-emerald-50"}`}><p className="whitespace-pre-wrap break-words">{stripSpeakerPrefix(message.text || "ส่งรูปภาพ")}</p>{imageUrls(message.attachmentsJson).map(url => <button key={url} type="button" onClick={() => setLightboxUrl(url)} className="mt-2 block"><img src={url} alt="ไฟล์แนบในแชท" className="max-h-56 rounded-xl object-cover" /></button>)}<p className="mt-1 text-[10px] opacity-50">{outgoing ? selected.pageName : selected.customerName} · {timeLabel(String(message.occurredAt))}</p></div></div>; })}
            {!messagesQuery.isLoading && visibleMessages.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">ไม่มีข้อความในตัวกรองนี้</p> : null}
          </div>
          <div className={`shrink-0 border-t border-white/10 p-3 ${composerOpen ? "" : "pb-2"}`}>
            <div className="mb-2 flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-slate-500">ตอบกลับ Messenger</span><button type="button" onClick={() => setComposerOpen(value => !value)} aria-label="ยุบ/ขยายกล่องตอบกลับ"><ChevronDown className={`h-4 w-4 transition ${composerOpen ? "" : "rotate-180"}`} /></button></div>
            {composerOpen ? <>
              <div className="mb-2 flex flex-wrap gap-1.5">{quickReplies.map(reply => <button key={reply} type="button" onClick={() => setReplyText(reply)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-slate-300 hover:bg-white/5">{reply}</button>)}</div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={event => { handleImageUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              <div className="flex items-end gap-2"><Textarea value={replyText} onChange={event => setReplyText(event.target.value)} placeholder={selectedCustomerId ? "พิมพ์ข้อความ…" : "ไม่พบ Customer PSID"} disabled={!selectedCustomerId} className="min-h-16 border-white/10 bg-black/20 text-white" /><div className="flex flex-col gap-2"><Button type="button" size="icon" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadImage.isPending} className="border-white/10"><ImagePlus className="h-4 w-4" /></Button><Button type="button" size="icon" onClick={sendCurrentReply} disabled={sendReply.isPending || !selectedCustomerId || (!replyText.trim() && !replyImageUrl.trim())} className="bg-cyan-600 text-white"><Send className="h-4 w-4" /></Button></div></div>
              {replyImageUrl ? <p className="mt-1 text-xs text-emerald-300">รูปพร้อมส่ง <button type="button" className="ml-2 text-rose-300" onClick={() => setReplyImageUrl("")}>ลบ</button></p> : null}
              {deliveryStatus !== "idle" ? <p className={`mt-1 text-xs ${deliveryStatus === "failed" ? "text-rose-300" : deliveryStatus === "sent" ? "text-emerald-300" : "text-slate-500"}`}>{deliveryStatus === "sending" ? "กำลังส่ง…" : deliveryStatus === "sent" ? "ส่งแล้ว" : "ส่งไม่สำเร็จ"}</p> : null}
            </> : null}
          </div>
        </>}
      </Card>

      <Card className="hidden min-h-0 flex-col overflow-hidden border-white/10 bg-[#101116] xl:flex">
        <CardHeader className="border-b border-white/10"><CardTitle className="flex items-center gap-2 text-sm"><Truck className="h-4 w-4 text-cyan-300" />ข้อมูลขนส่งจากแชท</CardTitle></CardHeader>
        <CardContent className="space-y-3 overflow-auto p-4">{selected ? <>
          <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="text-sm font-semibold">{selected.customerName}</p><p className="mt-1 text-xs text-slate-500">{selected.pageName}</p></div>
          <Info label="tracking_number" value={selected.tracking_number} />
          <Info label="order_number · ข้อมูลต้นทาง" value={selected.order_number} />
          <Info label="shipping_carrier" value={selected.shipping_carrier} />
          <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />ข้อความขนส่งที่มีอยู่</p><p className="mt-2 whitespace-pre-wrap text-xs text-slate-300">{trackingMessage || "—"}</p>{trackingMessage ? <Button size="sm" variant="outline" onClick={() => setReplyText(String(trackingMessage))} className="mt-2 border-white/10 text-xs">ใส่ในช่องตอบกลับ</Button> : null}</div>
          <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="text-xs text-slate-500">ข้อความสำรอง</p><p className="mt-2 whitespace-pre-wrap text-xs text-slate-300">{draksideMessage || "—"}</p>{draksideMessage ? <Button size="sm" variant="outline" onClick={() => setReplyText(String(draksideMessage))} className="mt-2 border-white/10 text-xs">ใส่ในช่องตอบกลับ</Button> : null}</div>
        </> : <p className="text-sm text-slate-500">เลือกห้องแชทก่อน</p>}</CardContent>
      </Card>
    </div>
    {lightboxUrl ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxUrl(null)}><img src={lightboxUrl} alt="รูปภาพขนาดเต็ม" className="max-h-[92vh] max-w-[94vw] rounded-2xl object-contain" /></div> : null}
  </div>;
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-xl border border-white/5 bg-black/15 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-200">{value == null || value === "" ? "—" : String(value)}</p></div>;
}
