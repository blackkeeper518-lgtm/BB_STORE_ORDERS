import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, CircleX, LoaderCircle, MessageCircle, RefreshCw, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function timeLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

export default function LineChat() {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const conversations = trpc.line.conversations.useQuery(undefined, { refetchInterval: 5000, retry: false });
  const visible = useMemo(() => (conversations.data ?? []).filter(item => `${item.displayName} ${item.lineUserId} ${item.preview}`.toLowerCase().includes(search.toLowerCase())), [conversations.data, search]);
  const selected = visible.find(item => item.key === selectedKey) ?? visible[0] ?? null;
  const lineStatus = trpc.line.status.useQuery({ oaId: selected?.oaId || undefined }, { refetchInterval: 60000, retry: false });
  const messages = trpc.line.messages.useQuery({ conversationId: selected?.conversationId ?? "", oaId: selected?.oaId || undefined }, { enabled: Boolean(selected), refetchInterval: selected ? 3000 : false, retry: false });
  const send = trpc.line.send.useMutation({
    onSuccess: () => { setText(""); setNotice("ส่ง LINE แล้ว"); void messages.refetch(); void conversations.refetch(); },
    onError: error => setNotice(error.message),
  });
  useEffect(() => { if (!selectedKey && visible[0]) setSelectedKey(visible[0].key); }, [selectedKey, visible]);
  return <main className="flex h-full min-h-0 flex-col gap-3 bg-[#090611] p-3 text-white sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300/20 bg-gradient-to-r from-[#071c1c] to-[#160d24] p-4">
      <div><p className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">LINE OA · DIRECT API</p><h1 className="text-2xl font-semibold">ห้องแชท LINE</h1><p className="text-xs text-white/55">รับจาก line_messages · ตอบผ่าน Render → LINE Messaging API</p></div>
      <div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${lineStatus.data?.connected ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : "border-red-300/30 bg-red-400/10 text-red-200"}`}>{lineStatus.isLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : lineStatus.data?.connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}{lineStatus.data?.connected ? `เชื่อมต่อแล้ว${lineStatus.data.botName ? ` · ${lineStatus.data.botName}` : ""}` : (lineStatus.data?.error || "กำลังตรวจสอบ LINE")}</span><Button variant="outline" onClick={() => void Promise.all([lineStatus.refetch(), conversations.refetch()])} className="border-emerald-300/30 bg-transparent text-emerald-200"><RefreshCw className="mr-2 h-4 w-4" />ตรวจ/รีเฟรช</Button></div>
    </header>
    {conversations.isError ? <div className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">โหลด LINE ไม่สำเร็จ: {conversations.error.message}</div> : null}
    <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto rounded-2xl border border-emerald-300/15 bg-black/25 p-2"><div className="mb-2"><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาห้อง LINE…" className="border-emerald-300/20 bg-black/25 text-white" /></div>{visible.length === 0 ? <div className="p-8 text-center text-sm text-white/45"><MessageCircle className="mx-auto mb-2" />ยังไม่มีข้อความ LINE</div> : visible.map(item => <button key={item.key} type="button" onClick={() => setSelectedKey(item.key)} className={`mb-1 w-full rounded-xl p-3 text-left transition ${selected?.key === item.key ? "bg-emerald-400/15 ring-1 ring-emerald-300/40" : "hover:bg-white/5"}`}><div className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{item.displayName}</strong><time className="shrink-0 text-[10px] text-white/45">{timeLabel(item.latestAt)}</time></div><p className="mt-1 truncate text-xs text-white/50">{item.preview || "ยังไม่มีข้อความ"}</p><span className="mt-2 inline-block rounded bg-emerald-400/10 px-1.5 py-0.5 text-[10px] text-emerald-200">LINE</span></button>)}</aside>
      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-emerald-300/15 bg-[#0d0b18]">{selected ? <><header className="border-b border-white/10 p-4"><p className="text-sm font-semibold">{selected.displayName}</p><p className="text-[11px] text-white/40">{selected.lineUserId} · OA {selected.oaId || "ไม่ระบุ"} · {selected.messageCount} ข้อความ</p></header><div className="flex-1 space-y-2 overflow-y-auto p-4">{messages.isLoading ? <LoaderCircle className="mx-auto animate-spin text-emerald-300" /> : (messages.data ?? []).map(message => <div key={message.id} className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.direction === "outbound" ? "bg-emerald-500/25 text-emerald-50" : "bg-white/8 text-white/85"}`}><p className="whitespace-pre-wrap">{message.text || `[${message.messageType}]`}</p><time className="mt-1 block text-[10px] opacity-45">{timeLabel(message.occurredAt)}</time></div></div>)}</div><form className="border-t border-white/10 p-3" onSubmit={event => { event.preventDefault(); if (selected && lineStatus.data?.connected && text.trim()) send.mutate({ lineUserId: selected.lineUserId, oaId: selected.oaId || undefined, text: text.trim() }); }}><div className="flex gap-2"><Textarea value={text} onChange={event => setText(event.target.value)} placeholder={lineStatus.data?.connected ? "พิมพ์ตอบลูกค้า LINE…" : "ต้องเชื่อมต่อ LINE OA ก่อนตอบ"} disabled={!lineStatus.data?.connected} className="min-h-12 border-emerald-300/20 bg-black/25 text-white" /><Button type="submit" disabled={send.isPending || !lineStatus.data?.connected || !text.trim()} className="self-end bg-emerald-600 hover:bg-emerald-500"><Send className="h-4 w-4" /></Button></div><p className="mt-2 min-h-4 text-xs text-emerald-200/70">{send.isPending ? "กำลังส่ง…" : notice || (!lineStatus.data?.connected ? "ปุ่มตอบถูกล็อกจนกว่า LINE OA จะเชื่อมต่อสำเร็จ" : "")}</p></form></> : <div className="m-auto text-center text-white/45"><MessageCircle className="mx-auto mb-2" />เลือกห้อง LINE</div>}</section>
    </section>
  </main>;
}
