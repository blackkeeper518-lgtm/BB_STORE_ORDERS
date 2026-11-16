import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabase, mapChatRowsToMessages, mapChatRowsToThreads } from "@/lib/canonical";
import { uploadChatImageToVault } from "@/lib/chat-image-upload";
import { CHAT_BROWSER_CONFIG_EVENT, readBrowserChatConfig } from "@/lib/chat-config";
import { trpc } from "@/lib/trpc";
import { Check, LoaderCircle, MessageCircle, MessagesSquare, Paperclip, Search, Send, Smile, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

const SELECTED_ROOM_KEY = "bb-orders-mobile-inbox-selected-v1";

type Thread = ReturnType<typeof mapChatRowsToThreads>[number];

function timeLabel(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}
function imageUrls(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    const urls: string[] = [];
    const walk = (item: unknown) => {
      if (!item || typeof item !== "object") return;
      const record = item as Record<string, unknown>;
      [record.url, record.file_url, (record.payload as Record<string, unknown> | undefined)?.url].forEach(url => { if (typeof url === "string" && /^https?:\/\//i.test(url) && !urls.includes(url)) urls.push(url); });
      Object.values(record).forEach(child => Array.isArray(child) && child.forEach(walk));
    };
    if (Array.isArray(parsed)) parsed.forEach(walk); else walk(parsed);
    return urls;
  } catch { return []; }
}
function messageText(message: Record<string, any>) { return String(message.text ?? message.message_text ?? (imageUrls(message.attachmentsJson).length ? "ส่งรูปภาพ" : "")); }

export default function MobileInbox() {
  const [, setLocation] = useLocation();
  const [browserChatConfig, setBrowserChatConfig] = useState(() => readBrowserChatConfig());
  const hasConfig = Boolean(browserChatConfig?.url && browserChatConfig.serviceRoleKey);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(() => typeof window === "undefined" ? null : localStorage.getItem(SELECTED_ROOM_KEY));
  const [filter, setFilter] = useState<"all" | "ordered" | "tracking">("all");
  const [openRoom, setOpenRoom] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyImageUrl, setReplyImageUrl] = useState("");
  const [replyImageSendUrl, setReplyImageSendUrl] = useState("");
  const [replyImageName, setReplyImageName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const refresh = () => setBrowserChatConfig(readBrowserChatConfig());
    window.addEventListener("storage", refresh);
    window.addEventListener(CHAT_BROWSER_CONFIG_EVENT, refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener(CHAT_BROWSER_CONFIG_EVENT, refresh); };
  }, []);
  const threadsQuery = trpc.chat.threads.useQuery(undefined, { enabled: hasConfig, staleTime: 0, refetchInterval: hasConfig ? 8_000 : false, refetchOnWindowFocus: true, select: mapChatRowsToThreads });
  const threads = threadsQuery.data ?? [];
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads.filter(thread => {
      const text = [thread.customerName, thread.pageName, thread.preview, thread.searchText, thread.latestOrderNumber].join(" ").toLowerCase();
      const isOrdered = Boolean(thread.timeSlotLabel || thread.orderTodayActive);
      const hasTracking = Boolean(String(thread.tracking_number ?? "").trim());
      return (!query || text.includes(query)) && (filter === "all" || (filter === "ordered" ? isOrdered : hasTracking));
    });
  }, [threads, search, filter]);
  const selected = filteredThreads.find(thread => thread.key === selectedKey) ?? filteredThreads[0];
  const selectedPageId = selected?.pageId ?? "";
  const selectedThreadId = selected?.threadId ?? "";
  const selectedCustomerId = selected?.customerId ?? "";
  const messagesQuery = trpc.chat.messages.useQuery({ pageId: selectedPageId, threadId: selectedThreadId }, { enabled: hasConfig && Boolean(selectedPageId && selectedThreadId), staleTime: 0, refetchInterval: hasConfig ? 2_000 : false, select: mapChatRowsToMessages });
  const sendReply = trpc.chat.sendReply.useMutation({ onSuccess: () => { setReplyText(""); setReplyImageUrl(""); setReplyImageSendUrl(""); setReplyImageName(""); setNotice("ส่งแล้ว"); void Promise.all([messagesQuery.refetch(), threadsQuery.refetch()]); }, onError: error => setNotice(error.message || "ส่งไม่สำเร็จ") });
  useEffect(() => { if (!selectedKey && filteredThreads[0]) setSelectedKey(filteredThreads[0].key); }, [filteredThreads, selectedKey]);
  useEffect(() => { if (selectedKey) localStorage.setItem(SELECTED_ROOM_KEY, selectedKey); }, [selectedKey]);
  useEffect(() => { if (!openRoom || !timelineRef.current) return; timelineRef.current.scrollTop = timelineRef.current.scrollHeight; }, [openRoom, selectedKey, messagesQuery.data?.length]);
  const selectRoom = (thread: Thread) => { setSelectedKey(thread.key); setOpenRoom(true); setNotice(""); };
  const addEmoji = (emoji: string) => setReplyText(value => `${value}${value ? " " : ""}${emoji}`);
  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type) || file.size > 6_000_000) { setNotice("รองรับ JPG, PNG, GIF หรือ WebP ไม่เกิน 6 MB"); return; }
    const vault = getSupabase("vault");
    if (!vault) { setNotice("ยังไม่ได้ตั้งค่า PRIVATE VAULT สำหรับอัปโหลดภาพ"); return; }
    setUploading(true); setNotice("กำลังอัปโหลดภาพ…");
    try { const result = await uploadChatImageToVault(vault, file); setReplyImageUrl(result.url); setReplyImageSendUrl(result.url); setReplyImageName(file.name); setNotice("ภาพพร้อมส่ง"); } catch (error) { setNotice(`อัปโหลดไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`); } finally { setUploading(false); }
  };
  const send = () => {
    const text = replyText.trim();
    if (sendReply.isPending || !selectedPageId || !selectedThreadId || (!text && !replyImageUrl)) return;
    if (!selectedCustomerId) { setNotice("ห้องนี้ยังไม่มี Customer PSID"); return; }
    sendReply.mutate({ pageId: selectedPageId, pageName: selected?.pageName ?? undefined, portalKey: selected?.portalKey ?? undefined, chatLinkKey: selected?.chatLinkKey ?? undefined, threadId: selectedThreadId, recipientId: selectedCustomerId, text: text || undefined, imageUrl: replyImageUrl || undefined, imageSendUrl: replyImageSendUrl || undefined });
  };
  const messages = (messagesQuery.data ?? []).filter(message => messageText(message).trim());

  return <main className="mobile-inbox-page">
    <header className="mobile-inbox-header"><div><p className="mobile-inbox-kicker">BB STORE</p><h1>กล่องข้อความ</h1></div><button type="button" aria-label="รีเฟรช" onClick={() => void threadsQuery.refetch()} className="mobile-inbox-refresh"><LoaderCircle className={threadsQuery.isFetching ? "animate-spin" : ""} /></button></header>
    <div className="mobile-inbox-tabs"><button type="button" className="is-active"><MessagesSquare /> ข้อความ</button><span className="mobile-inbox-tab-count">{filteredThreads.length}</span></div>
    <section className="mobile-inbox-list-panel">
      <div className="mobile-inbox-search"><Search /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อลูกค้าหรือข้อความ…" /></div>
      <div className="mobile-inbox-filters">{([ ["all", "ทั้งหมด"], ["ordered", "ออเดอร์"], ["tracking", "เลขพัสดุ"] ] as const).map(([value, label]) => <button key={value} type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
      {!hasConfig ? <div className="mobile-inbox-empty"><MessageCircle /><p>ยังไม่ได้ตั้งค่า Chat ใน ROOM 02</p><button type="button" onClick={() => setLocation("/secret-gallery")}>ไปตั้งค่า</button></div> : threadsQuery.isLoading ? <div className="mobile-inbox-empty"><LoaderCircle className="animate-spin" /><p>กำลังโหลดข้อความ…</p></div> : filteredThreads.length === 0 ? <div className="mobile-inbox-empty"><MessageCircle /><p>ไม่พบห้องแชท</p></div> : <div className="mobile-inbox-threads">{filteredThreads.map(thread => <button type="button" key={thread.key} onClick={() => selectRoom(thread)} className={`mobile-inbox-thread ${selected?.key === thread.key ? "is-selected" : ""}`}><span className="mobile-inbox-avatar">{(thread.customerName || "ลูกค้า").slice(0, 1)}</span><span className="mobile-inbox-thread-body"><span className="mobile-inbox-thread-top"><strong>{thread.customerName || "ลูกค้าใหม่"}</strong><time>{timeLabel(thread.latestAt)}</time></span><span className="mobile-inbox-thread-preview">{thread.preview || "ยังไม่มีข้อความ"}</span><span className="mobile-inbox-thread-tags"><span>{thread.pageName || "ไม่ระบุเพจ"}</span>{thread.unread ? <b>ใหม่</b> : null}{thread.orderCount > 0 ? <b>ออเดอร์</b> : null}</span></span></button>)}</div>}
    </section>
    <nav className="mobile-inbox-bottom-nav"><button type="button" className="is-active"><MessagesSquare /><span>ข้อความ</span></button><button type="button" onClick={() => document.querySelector<HTMLInputElement>(".mobile-inbox-search input")?.focus()}><Search /><span>ค้นหา</span></button><button type="button" onClick={() => setLocation("/secret-gallery")}><UserRound /><span>เมนู</span></button></nav>
    {openRoom && selected ? <div className="mobile-inbox-conversation"><div className="mobile-inbox-conversation-shell"><header className="mobile-inbox-conversation-header"><button type="button" aria-label="กลับไปรายการข้อความ" onClick={() => setOpenRoom(false)}><X /></button><span className="mobile-inbox-avatar">{(selected.customerName || "ลูกค้า").slice(0, 1)}</span><div><strong>{selected.customerName || "ลูกค้าใหม่"}</strong><small>{selected.pageName || "ไม่ระบุเพจ"}</small></div></header><div ref={timelineRef} className="mobile-inbox-timeline">{messages.length ? messages.map(message => { const outgoing = message.direction === "outbound" || message.senderType === "page"; return <div key={message.id} className={`mobile-inbox-message-row ${outgoing ? "is-outgoing" : ""}`}><div className="mobile-inbox-message"><p>{messageText(message)}</p>{imageUrls(message.attachmentsJson).map(url => <img key={url} src={url} alt="รูปภาพจากแชท" />)}<time>{timeLabel(message.occurredAt)}</time></div></div>; }) : <div className="mobile-inbox-empty"><MessageCircle /><p>{selected.preview || "ยังไม่มีข้อความ"}</p></div>}</div><div className="mobile-inbox-composer">{emojiOpen ? <div className="mobile-inbox-emoji">{["😊", "👍", "🙏", "❤️", "📦"].map(emoji => <button type="button" key={emoji} onClick={() => { addEmoji(emoji); setEmojiOpen(false); }}>{emoji}</button>)}</div> : null}{replyImageUrl ? <div className="mobile-inbox-attachment"><Paperclip />{replyImageName}<button type="button" onClick={() => { setReplyImageUrl(""); setReplyImageSendUrl(""); setReplyImageName(""); }}><X /></button></div> : null}{notice ? <div className="mobile-inbox-notice">{notice}</div> : null}<div className="mobile-inbox-compose-row"><input ref={fileRef} hidden type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={event => { void handleUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} /><button type="button" aria-label="แนบภาพ" onClick={() => fileRef.current?.click()} disabled={uploading}><Paperclip /></button><Textarea value={replyText} onChange={event => setReplyText(event.target.value)} placeholder="พิมพ์ข้อความ…" disabled={!selectedCustomerId} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} /><button type="button" aria-label="อีโมจิ" onClick={() => setEmojiOpen(value => !value)}><Smile /></button><Button type="button" aria-label="ส่งข้อความ" onClick={send} disabled={sendReply.isPending || uploading || !selectedCustomerId || (!replyText.trim() && !replyImageUrl)}>{sendReply.isPending ? <LoaderCircle className="animate-spin" /> : <Send />}</Button></div></div></div></div> : null}
  </main>;
}
