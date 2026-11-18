import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { playChatNotificationSound, unlockChatNotificationAudio } from "@/lib/chat-notifications";
import { CYBER_FRAME_EVENT, CYBER_FRAME_OPTIONS, readCyberFrame, readCyberFrameRooms, saveCyberFrameRoom } from "@/lib/cyber-frame";
import { getSupabase } from "@/lib/canonical";
import "@/styles/cyber-frames.css";
import { CheckCircle2, CircleX, ChevronLeft, LoaderCircle, MessageCircle, RefreshCw, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function timeLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

type FrameOption = { id: string; name: string };
const fallbackFrameOptions: FrameOption[] = CYBER_FRAME_OPTIONS.map(option => ({ id: option.id, name: option.name }));

export default function LineChat({ compact = false }: { compact?: boolean }) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [cyberFrame, setCyberFrame] = useState(() => readCyberFrame());
  const [cyberFrameRooms, setCyberFrameRooms] = useState(() => readCyberFrameRooms());
  const [framePickerRoom, setFramePickerRoom] = useState<string | null>(null);
  const [frameOptions, setFrameOptions] = useState<FrameOption[]>(fallbackFrameOptions);
  const [mobileRoomOpen, setMobileRoomOpen] = useState(false);
  const previousRoomsRef = useRef<Map<string, string>>(new Map());
  const initializedRoomsRef = useRef(false);
  const conversations = trpc.line.conversations.useQuery(undefined, { refetchInterval: 5000, retry: false });
  const visible = useMemo(() => (conversations.data ?? []).filter(item => `${item.displayName} ${item.lineUserId} ${item.preview}`.toLowerCase().includes(search.toLowerCase())), [conversations.data, search]);
  const selected = visible.find(item => item.key === selectedKey) ?? visible[0] ?? null;
  const lineStatus = trpc.line.status.useQuery({ oaId: selected?.oaId || undefined }, { refetchInterval: 60000, retry: false });
  const messages = trpc.line.messages.useQuery({ conversationId: selected?.conversationId ?? "", lineUserId: selected?.lineUserId ?? "", oaId: selected?.oaId || undefined }, { enabled: Boolean(selected), refetchInterval: selected ? 3000 : false, retry: false });
  const send = trpc.line.send.useMutation({
    onSuccess: () => { setText(""); setNotice("ส่ง LINE แล้ว"); void messages.refetch(); void conversations.refetch(); },
    onError: error => setNotice(error.message),
  });
  useEffect(() => {
    const next = new Map<string, string>();
    let shouldPlay = false;
    for (const room of conversations.data ?? []) {
      const fingerprint = `${room.latestAt ?? ""}|${room.messageCount}|${room.preview}`;
      next.set(room.key, fingerprint);
      if (initializedRoomsRef.current && room.latestDirection === "inbound" && previousRoomsRef.current.get(room.key) !== fingerprint) shouldPlay = true;
    }
    if (shouldPlay) playChatNotificationSound();
    previousRoomsRef.current = next;
    initializedRoomsRef.current = true;
  }, [conversations.data]);
  useEffect(() => { if (!selectedKey && visible[0]) setSelectedKey(visible[0].key); }, [selectedKey, visible]);
  useEffect(() => {
    const refreshFrames = () => { setCyberFrame(readCyberFrame()); setCyberFrameRooms(readCyberFrameRooms()); };
    window.addEventListener(CYBER_FRAME_EVENT, refreshFrames);
    return () => window.removeEventListener(CYBER_FRAME_EVENT, refreshFrames);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const loadFrames = async () => {
      const api = getSupabase("vault");
      if (!api) return;
      const result = await api.from("app_chat_frames").select("frame_key,name,is_enabled,sort_order").eq("is_enabled", true).order("sort_order", { ascending: true });
      if (cancelled || result.error || !Array.isArray(result.data) || result.data.length === 0) return;
      const next = result.data.map(row => {
        const raw = String(row.frame_key ?? "").trim().toLowerCase();
        const match = raw.match(/^f(\d+)$/);
        return { id: match ? `f${match[1].padStart(2, "0")}` : raw, name: String(row.name ?? raw) };
      }).filter(option => option.id);
      if (next.length) setFrameOptions(next);
    };
    void loadFrames();
    return () => { cancelled = true; };
  }, []);
  if (compact) return <main onPointerDown={() => void unlockChatNotificationAudio()} className="line-mobile-shell">
    {!mobileRoomOpen ? <section className="line-mobile-list"><div className="line-mobile-search"><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อลูกค้าหรือข้อความ LINE…" /></div>{visible.length === 0 ? <div className="line-mobile-empty"><MessageCircle /><p>ยังไม่มีข้อความ LINE</p></div> : visible.map(item => <button type="button" key={item.key} onClick={() => { setSelectedKey(item.key); setMobileRoomOpen(true); }} className="line-mobile-thread"><span className="line-mobile-avatar">{item.profilePictureUrl ? <img src={item.profilePictureUrl} alt="" /> : item.displayName.slice(0, 1)}</span><span className="line-mobile-thread-body"><span className="line-mobile-thread-top"><strong>{item.displayName}</strong><time>{timeLabel(item.latestAt)}</time></span><span className="line-mobile-thread-preview">{item.preview || "ยังไม่มีข้อความ"}</span><span className="line-mobile-thread-tag">LINE OA · {item.oaId || "ไม่ระบุ"}</span></span></button>)}</section> : <section className="line-mobile-room"><header className="line-mobile-room-header"><button type="button" aria-label="กลับรายการ LINE" onClick={() => setMobileRoomOpen(false)}><ChevronLeft /></button><span className="line-mobile-avatar">{selected?.profilePictureUrl ? <img src={selected.profilePictureUrl} alt="" /> : (selected?.displayName || "L").slice(0, 1)}</span><div><strong>{selected?.displayName || "LINE"}</strong><small>{selected?.oaId || "LINE OA"}</small></div></header><div className="line-mobile-timeline">{messages.isLoading ? <LoaderCircle className="mx-auto animate-spin" /> : (messages.data ?? []).map(message => <div key={message.id} className={`line-mobile-message-row ${message.direction === "outbound" ? "is-outgoing" : ""}`}><div className="line-mobile-message"><p>{message.text || `[${message.messageType}]`}</p><time>{timeLabel(message.occurredAt)}</time></div></div>)}</div><form className="line-mobile-composer" onSubmit={event => { event.preventDefault(); if (selected && lineStatus.data?.connected && text.trim()) send.mutate({ lineUserId: selected.lineUserId, oaId: selected.oaId || undefined, text: text.trim() }); }}><Textarea value={text} onChange={event => setText(event.target.value)} placeholder="พิมพ์ข้อความ LINE…" disabled={!lineStatus.data?.connected} /><Button type="submit" disabled={send.isPending || !lineStatus.data?.connected || !text.trim()}><Send /></Button></form></section>}
  </main>;
  return <main onPointerDown={() => void unlockChatNotificationAudio()} className="flex h-full min-h-0 flex-col gap-3 bg-[#090611] p-3 text-white sm:p-5">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300/20 bg-gradient-to-r from-[#071c1c] to-[#160d24] p-4">
      <div className="flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-300/30 bg-emerald-400/15 text-lg text-emerald-100">{lineStatus.data?.pictureUrl ? <img src={lineStatus.data.pictureUrl} alt="" className="h-full w-full object-cover" /> : (lineStatus.data?.botName || "L").slice(0, 1)}</span><div><p className="text-[10px] uppercase tracking-[0.25em] text-emerald-300">LINE OA · DIRECT API</p><h1 className="text-2xl font-semibold">{lineStatus.data?.botName || "ห้องแชท LINE"}</h1><p className="text-xs text-white/55">รับจาก line_messages · ตอบผ่าน Render → LINE Messaging API</p></div></div>
      <div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${lineStatus.data?.connected ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200" : "border-red-300/30 bg-red-400/10 text-red-200"}`}>{lineStatus.isLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : lineStatus.data?.connected ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleX className="h-3.5 w-3.5" />}{lineStatus.data?.connected ? `เชื่อมต่อแล้ว${lineStatus.data.botName ? ` · ${lineStatus.data.botName}` : ""}` : (lineStatus.data?.error || "กำลังตรวจสอบ LINE")}</span><Button variant="outline" disabled={refreshing} onClick={() => { setRefreshing(true); void Promise.all([lineStatus.refetch(), conversations.refetch(), messages.refetch()]).finally(() => setRefreshing(false)); }} className="border-emerald-300/30 bg-transparent text-emerald-200"><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "กำลังโหลด…" : "ตรวจ/รีเฟรช"}</Button></div>
    </header>
    {conversations.isError ? <div className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-sm text-red-200">โหลด LINE ไม่สำเร็จ: {conversations.error.message}</div> : null}
    <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto rounded-2xl border border-emerald-300/15 bg-black/25 p-2"><div className="mb-2"><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อหรือตัวข้อความ LINE…" className="border-emerald-300/20 bg-black/25 text-white" /></div>{visible.length === 0 ? <div className="p-8 text-center text-sm text-white/45"><MessageCircle className="mx-auto mb-2" />ยังไม่มีข้อความ LINE</div> : visible.map(item => { const roomFrame = cyberFrameRooms[item.key] || cyberFrame; return <div key={item.key} onClick={() => setSelectedKey(item.key)} className={`room-list-card ${roomFrame ? `cyber-frame-card cyber-frame-${roomFrame}` : ""} ${selected?.key === item.key ? "room-list-card--selected cyber-frame-active" : ""} relative mb-1 w-full cursor-pointer rounded-xl p-3 text-left transition hover:bg-white/5`}><div className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2"><span className="cyber-frame-avatar-wrap relative flex h-8 w-8 shrink-0 items-center justify-center"><span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-emerald-400/20 text-xs text-emerald-100">{item.profilePictureUrl ? <img src={item.profilePictureUrl} alt="" className="h-full w-full object-cover" /> : item.displayName.slice(0, 1)}</span></span><strong className="truncate text-sm">{item.displayName}</strong></span><time className="shrink-0 text-[10px] text-white/45">{timeLabel(item.latestAt)}</time></div><p className="mt-1 truncate text-xs text-white/50">{item.preview || "ยังไม่มีข้อความ"}</p><div className="mt-2 flex items-center gap-1.5">{framePickerRoom === item.key ? <select autoFocus onClick={event => event.stopPropagation()} onChange={event => { saveCyberFrameRoom(item.key, event.target.value); setCyberFrameRooms(readCyberFrameRooms()); setFramePickerRoom(null); }} onBlur={() => setFramePickerRoom(null)} value={roomFrame || ""} className="cyber-frame-inline-picker"><option value="">ปกติ</option>{frameOptions.map(option => <option key={option.id} value={option.id}>{option.id.toUpperCase()} · {option.name}</option>)}</select> : <button type="button" onClick={event => { event.stopPropagation(); setFramePickerRoom(item.key); }} className="rounded border border-emerald-300/20 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-200" title="เลือกกรอบจาก ROOM 04">LINE</button>}</div></div>; })}</aside>
      <section className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-emerald-300/15 bg-[#0d0b18] ${selected && (cyberFrameRooms[selected.key] || cyberFrame) ? `cyber-frame-card cyber-frame-${cyberFrameRooms[selected.key] || cyberFrame}` : ""}`}>{selected ? <><header className="flex items-center gap-3 border-b border-white/10 p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-400/20 text-emerald-100">{selected.profilePictureUrl ? <img src={selected.profilePictureUrl} alt="" className="h-full w-full object-cover" /> : selected.displayName.slice(0, 1)}</span><div><p className="text-sm font-semibold">{selected.displayName}</p><p className="text-[11px] text-white/40">{selected.lineUserId} · OA {selected.oaId || "ไม่ระบุ"} · {selected.messageCount} ข้อความ</p></div></header><div className="flex-1 space-y-2 overflow-y-auto p-4">{messages.isLoading ? <LoaderCircle className="mx-auto animate-spin text-emerald-300" /> : messages.isError ? <div className="rounded-xl border border-red-300/25 bg-red-400/10 p-3 text-sm text-red-200">โหลดประวัติไม่สำเร็จ: {messages.error.message}</div> : (messages.data ?? []).map(message => <div key={message.id} className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.direction === "outbound" ? "bg-emerald-500/25 text-emerald-50" : "bg-white/8 text-white/85"}`}><p className="whitespace-pre-wrap">{message.text || `[${message.messageType}]`}</p><time className="mt-1 block text-[10px] opacity-45">{timeLabel(message.occurredAt)}</time></div></div>)}</div><form className="border-t border-white/10 p-3" onSubmit={event => { event.preventDefault(); if (selected && lineStatus.data?.connected && text.trim()) send.mutate({ lineUserId: selected.lineUserId, oaId: selected.oaId || undefined, text: text.trim() }); }}><div className="flex gap-2"><Textarea value={text} onChange={event => setText(event.target.value)} placeholder={lineStatus.data?.connected ? "พิมพ์ตอบลูกค้า LINE…" : "ต้องเชื่อมต่อ LINE OA ก่อนตอบ"} disabled={!lineStatus.data?.connected} className="min-h-12 border-emerald-300/20 bg-black/25 text-white" /><Button type="submit" disabled={send.isPending || !lineStatus.data?.connected || !text.trim()} className="self-end bg-emerald-600 hover:bg-emerald-500"><Send className="h-4 w-4" /></Button></div><p className="mt-2 min-h-4 text-xs text-emerald-200/70">{send.isPending ? "กำลังส่ง…" : notice || (!lineStatus.data?.connected ? "ปุ่มตอบถูกล็อกจนกว่า LINE OA จะเชื่อมต่อสำเร็จ" : "")}</p></form></> : <div className="m-auto text-center text-white/45"><MessageCircle className="mx-auto mb-2" />เลือกห้อง LINE</div>}</section>
    </section>
  </main>;
}
