import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabase, mapChatRowsToMessages, mapChatRowsToThreads, reconcileOptimisticMessages } from "@/lib/canonical";
import { uploadChatImageToVault } from "@/lib/chat-image-upload";
import { CHAT_BROWSER_CONFIG_EVENT, readBrowserChatConfig } from "@/lib/chat-config";
import { CYBER_THEME_PRESETS, readCyberTheme, saveCyberTheme, type CyberTheme } from "@/lib/theme-lab";
import { trpc } from "@/lib/trpc";
import { Check, Download, LoaderCircle, MessageCircle, MessagesSquare, Palette, Paperclip, Search, Send, Smile, X } from "lucide-react";
import { type ClipboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

const SELECTED_ROOM_KEY = "bb-orders-mobile-inbox-selected-v1";

type Thread = ReturnType<typeof mapChatRowsToThreads>[number];
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

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
function profileAvatar(thread: Thread) { return thread.profilePictureUrl ? <img src={thread.profilePictureUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /> : (thread.customerName || "").slice(0, 1); }

export default function MobileInbox() {
  const [, setLocation] = useLocation();
  const [browserChatConfig, setBrowserChatConfig] = useState(() => readBrowserChatConfig());
  const hasConfig = Boolean(browserChatConfig?.url && browserChatConfig.serviceRoleKey);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(() => typeof window === "undefined" ? null : localStorage.getItem(SELECTED_ROOM_KEY));
  const [pageFilter, setPageFilter] = useState("all");
  const [filter, setFilter] = useState<"all" | "ordered" | "tracking">("all");
  const [openRoom, setOpenRoom] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyImages, setReplyImages] = useState<Array<{ url: string; sendUrl: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [cyberTheme, setCyberTheme] = useState<CyberTheme>(() => readCyberTheme());
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const refresh = () => setBrowserChatConfig(readBrowserChatConfig());
    window.addEventListener("storage", refresh);
    window.addEventListener(CHAT_BROWSER_CONFIG_EVENT, refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener(CHAT_BROWSER_CONFIG_EVENT, refresh); };
  }, []);
  useEffect(() => {
    const refreshTheme = (event: StorageEvent) => { if (event.key === "bb-cyber-theme-v1" || event.key === null) setCyberTheme(readCyberTheme()); };
    window.addEventListener("storage", refreshTheme);
    return () => window.removeEventListener("storage", refreshTheme);
  }, []);
  useEffect(() => {
    void navigator.serviceWorker?.register("/mobile-inbox-sw.js", { scope: "/mobile-inbox" }).catch(() => undefined);
    const captureInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", captureInstall);
    return () => window.removeEventListener("beforeinstallprompt", captureInstall);
  }, []);
  const threadsQuery = trpc.chat.threads.useQuery(undefined, { enabled: hasConfig, staleTime: 0, refetchInterval: hasConfig ? 8_000 : false, refetchOnWindowFocus: true, select: mapChatRowsToThreads });
  const threads = threadsQuery.data ?? [];
  const availablePages = useMemo(() => Array.from(new Map(threads.filter(thread => thread.pageId && thread.pageName && thread.pageName !== "ไม่ระบุเพจ").map(thread => [thread.pageId, thread.pageName])).entries()), [threads]);
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads.filter(thread => {
      const text = [thread.customerName, thread.pageName, thread.preview, thread.searchText, thread.latestOrderNumber].join(" ").toLowerCase();
      const isOrdered = Boolean(thread.timeSlotLabel || thread.orderTodayActive);
      const hasTracking = Boolean(String(thread.tracking_number ?? "").trim());
      return (pageFilter === "all" || thread.pageId === pageFilter) && (!query || text.includes(query)) && (filter === "all" || (filter === "ordered" ? isOrdered : hasTracking));
    });
  }, [threads, search, filter, pageFilter]);
  const selected = filteredThreads.find(thread => thread.key === selectedKey) ?? filteredThreads[0];
  const selectedPageId = selected?.pageId ?? "";
  const selectedThreadId = selected?.threadId ?? "";
  const selectedCustomerId = selected?.customerId ?? "";
  const messagesQuery = trpc.chat.messages.useQuery({ pageId: selectedPageId, threadId: selectedThreadId }, { enabled: hasConfig && Boolean(selectedPageId && selectedThreadId), staleTime: 0, refetchInterval: hasConfig ? 2_000 : false, select: mapChatRowsToMessages });
  const optimisticMessageIdRef = useRef<string | null>(null);
  const sendReply = trpc.chat.sendReply.useMutation({
    onMutate: () => setNotice("กำลังส่งไปยัง Facebook…"),
    onSuccess: result => {
      setOptimisticMessages(current => current.map(message => message.id === optimisticMessageIdRef.current ? { ...message, messageId: result.message_id } : message));
      setReplyText("");
      setReplyImages([]);
      setNotice("ส่งแล้ว");
      void Promise.all([messagesQuery.refetch(), threadsQuery.refetch()]);
    },
    onError: error => {
      const failedId = optimisticMessageIdRef.current;
      if (failedId) setOptimisticMessages(current => current.filter(message => message.id !== failedId));
      optimisticMessageIdRef.current = null;
      setNotice(error.message || "ส่งไม่สำเร็จ");
      void Promise.all([messagesQuery.refetch(), threadsQuery.refetch()]);
    },
  });
  useEffect(() => { if (!selectedKey && filteredThreads[0]) setSelectedKey(filteredThreads[0].key); }, [filteredThreads, selectedKey]);
  useEffect(() => { if (selectedKey) localStorage.setItem(SELECTED_ROOM_KEY, selectedKey); }, [selectedKey]);
  useEffect(() => { setOptimisticMessages([]); optimisticMessageIdRef.current = null; }, [selectedPageId, selectedThreadId]);
  useEffect(() => { setOptimisticMessages(current => reconcileOptimisticMessages(current, messagesQuery.data ?? [])); }, [messagesQuery.data, optimisticMessages]);
  useEffect(() => { if (!openRoom || !timelineRef.current) return; timelineRef.current.scrollTop = timelineRef.current.scrollHeight; }, [openRoom, selectedKey, messagesQuery.data?.length]);
  const selectRoom = (thread: Thread) => { setSelectedKey(thread.key); setOpenRoom(true); setNotice(""); };
  const handleComposerPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.items)
      .filter(item => item.kind === "file" && item.type.startsWith("image/"))
      .map(item => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (!files.length) return;
    event.preventDefault();
    void handleUpload(files);
  };
  const addEmoji = (emoji: string) => setReplyText(value => `${value}${value ? " " : ""}${emoji}`);
  const handleUpload = async (input?: File | File[]) => {
    const files = (Array.isArray(input) ? input : input ? [input] : []).slice(0, 4 - replyImages.length);
    if (!files.length) { setNotice("แนบภาพได้สูงสุด 4 ภาพต่อข้อความ"); return; }
    const vault = getSupabase("vault");
    if (!vault) { setNotice("ยังไม่ได้ตั้งค่า PRIVATE VAULT สำหรับอัปโหลดภาพ"); return; }
    setUploading(true); setNotice(`กำลังอัปโหลด ${files.length} ภาพ…`);
    const uploaded: Array<{ url: string; sendUrl: string; name: string }> = [];
    try {
      for (const file of files) {
        const extension = file.type.split("/")[1] || "png";
        const normalizedFile = file.name ? file : new File([file], `pasted-image-${Date.now()}-${uploaded.length + 1}.${extension}`, { type: file.type });
        if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(normalizedFile.type) || normalizedFile.size > 6_000_000) continue;
        const result = await uploadChatImageToVault(vault, normalizedFile);
        uploaded.push({ url: result.url, sendUrl: result.url, name: normalizedFile.name });
      }
      setReplyImages(current => [...current, ...uploaded].slice(0, 4));
      if (uploaded.length) setNotice(`${uploaded.length} ภาพพร้อมส่ง · สูงสุด 4 ภาพต่อข้อความ`);
      else setNotice("รองรับ JPG, PNG, GIF หรือ WebP ขนาดไม่เกิน 6 MB ต่อภาพ");
    } catch (error) { setNotice(`อัปโหลดไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`); } finally { setUploading(false); }
  };
  const send = () => {
    const text = replyText.trim();
    if (sendReply.isPending || !selectedPageId || !selectedThreadId || (!text && replyImages.length === 0)) return;
    if (!selectedCustomerId) { setNotice("ห้องนี้ยังไม่มี Customer PSID"); return; }
    const optimisticId = `optimistic-${Date.now()}`;
    optimisticMessageIdRef.current = optimisticId;
    setOptimisticMessages(current => [...current, { id: optimisticId, text: text || "ส่งรูปภาพ", message_text: text, direction: "outbound", senderType: "page", side: "right", occurredAt: new Date().toISOString(), attachmentsJson: replyImages.length ? JSON.stringify(replyImages.map(image => ({ url: image.url }))) : "[]" }]);
    sendReply.mutate({ pageId: selectedPageId, pageName: selected?.pageName ?? undefined, portalKey: selected?.portalKey ?? undefined, chatLinkKey: selected?.chatLinkKey ?? undefined, threadId: selectedThreadId, recipientId: selectedCustomerId, text: text || undefined, imageUrls: replyImages.map(image => image.sendUrl || image.url) });
  };
  const chooseTheme = (preset: CyberTheme) => {
    const next = { ...cyberTheme, ...preset, preset: preset.preset };
    setCyberTheme(next);
    saveCyberTheme(next);
  };
  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };
  const messages = [...(messagesQuery.data ?? []), ...optimisticMessages].filter(message => messageText(message).trim());

  return <main className="mobile-inbox-page mobile-inbox-themed" style={{ "--mobile-bg": cyberTheme.bg, "--mobile-surface": cyberTheme.surface, "--mobile-primary": cyberTheme.primary, "--mobile-accent": cyberTheme.accent, "--mobile-radius": `${cyberTheme.radius}px`, "--mobile-glow": `${cyberTheme.glow}px` } as React.CSSProperties}>
    <header className="mobile-inbox-header"><div><p className="mobile-inbox-kicker">BB STORE</p><h1>กล่องข้อความ</h1><small className="mobile-inbox-theme-name">ธีม · {cyberTheme.name}</small></div><div className="mobile-inbox-header-actions">{installPrompt ? <button type="button" aria-label="ติดตั้งแอป BB Store Inbox" onClick={() => void installApp()} className="mobile-inbox-install-button"><Download /><span>ติดตั้งแอป</span></button> : null}<button type="button" aria-label="เปลี่ยนธีม" onClick={() => setThemeOpen(value => !value)} className="mobile-inbox-theme-button"><Palette /></button><button type="button" aria-label="รีเฟรช" onClick={() => void threadsQuery.refetch()} className="mobile-inbox-refresh"><LoaderCircle className={threadsQuery.isFetching ? "animate-spin" : ""} /></button></div></header>
    {themeOpen ? <section className="mobile-inbox-theme-panel"><div className="mobile-inbox-theme-panel-head"><div><strong>เปลี่ยนธีม</strong><small>ใช้ธีมเดียวกับ Appearance Theme Studio</small></div><button type="button" aria-label="ปิดตัวเลือกธีม" onClick={() => setThemeOpen(false)}><X /></button></div><div className="mobile-inbox-theme-grid">{CYBER_THEME_PRESETS.map(preset => <button type="button" key={preset.name} aria-label={`เลือกธีม ${preset.name}`} className={`mobile-inbox-theme-swatch ${cyberTheme.name === preset.name ? "is-active" : ""}`} style={{ "--swatch-bg": preset.bg, "--swatch-primary": preset.primary, "--swatch-accent": preset.accent } as React.CSSProperties} onClick={() => chooseTheme(preset)}><span className="mobile-inbox-theme-swatch-light" /><span>{preset.name}</span>{cyberTheme.name === preset.name ? <Check /> : null}</button>)}</div></section> : null}
    <div className="mobile-inbox-tabs"><button type="button" className="is-active"><MessagesSquare /> ข้อความ</button><span className="mobile-inbox-tab-count">{filteredThreads.length}</span></div>
    <section className="mobile-inbox-list-panel">
      <div className="mobile-inbox-search"><Search /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อลูกค้าหรือข้อความ…" /></div>
      <div className="mobile-inbox-filters"><select aria-label="เลือกเพจ" value={pageFilter} onChange={event => setPageFilter(event.target.value)}><option value="all">ทุกเพจ</option>{availablePages.map(([pageId, pageName]) => <option key={pageId} value={pageId}>{pageName}</option>)}</select>{([ ["all", "ทั้งหมด"], ["ordered", "ออเดอร์"], ["tracking", "เลขพัสดุ"] ] as const).map(([value, label]) => <button key={value} type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
      {!hasConfig ? <div className="mobile-inbox-empty"><MessageCircle /><p>ยังไม่ได้ตั้งค่า Chat ใน ROOM 02</p><button type="button" onClick={() => setLocation("/secret-gallery")}>ไปตั้งค่า</button></div> : threadsQuery.isLoading ? <div className="mobile-inbox-empty"><LoaderCircle className="animate-spin" /><p>กำลังโหลดข้อความ…</p></div> : filteredThreads.length === 0 ? <div className="mobile-inbox-empty"><MessageCircle /><p>ไม่พบห้องแชท</p></div> : <div className="mobile-inbox-threads">{filteredThreads.map(thread => <button type="button" key={thread.key} onClick={() => selectRoom(thread)} className={`mobile-inbox-thread ${selected?.key === thread.key ? "is-selected" : ""}`}><span className="mobile-inbox-avatar">{profileAvatar(thread)}</span><span className="mobile-inbox-thread-body"><span className="mobile-inbox-thread-top"><strong>{thread.customerName || ""}</strong><time>{timeLabel(thread.latestAt)}</time></span><span className="mobile-inbox-thread-preview">{thread.preview || "ยังไม่มีข้อความ"}</span><span className="mobile-inbox-thread-tags"><span>{thread.pageName || "ไม่ระบุเพจ"}</span>{thread.unread ? <b>ใหม่</b> : null}{thread.orderCount > 0 ? <b>ออเดอร์</b> : null}</span></span></button>)}</div>}
    </section>
    <nav className="mobile-inbox-bottom-nav"><button type="button" className="is-active"><MessagesSquare /><span>ข้อความ</span></button><button type="button" onClick={() => document.querySelector<HTMLInputElement>(".mobile-inbox-search input")?.focus()}><Search /><span>ค้นหา</span></button></nav>
    {openRoom && selected ? <div className="mobile-inbox-conversation"><div className="mobile-inbox-conversation-shell"><header className="mobile-inbox-conversation-header"><button type="button" aria-label="กลับหน้ารวมเพจและรายการแชท" onClick={() => setOpenRoom(false)} ><X /></button><span className="mobile-inbox-avatar">{profileAvatar(selected)}</span><div><strong>{selected.customerName || ""}</strong><small>{selected.pageName || "ไม่ระบุเพจ"}</small></div></header><div ref={timelineRef} className="mobile-inbox-timeline">{messages.length ? messages.map(message => { const outgoing = message.direction === "outbound" || message.senderType === "page"; const text = messageText(message); const images = imageUrls(message.attachmentsJson); const mediaOnly = images.length > 0 && (!text.trim() || /^\[รูปภาพ\]$|^ส่งรูปภาพ$/i.test(text.trim())); return <div key={message.id} className={`mobile-inbox-message-row ${outgoing ? "is-outgoing" : ""}`}><div className={`mobile-inbox-message ${mediaOnly ? "is-media-only" : ""}`}>{!mediaOnly && text ? <p>{text}</p> : null}{images.map(url => <img key={url} src={url} alt="รูปภาพจากแชท" />)}<time>{timeLabel(message.occurredAt)}</time></div></div>; }) : <div className="mobile-inbox-empty"><MessageCircle /><p>{selected.preview || "ยังไม่มีข้อความ"}</p></div>}</div><div className="mobile-inbox-composer">{emojiOpen ? <div className="mobile-inbox-emoji">{["😊", "👍", "🙏", "❤️", "📦"].map(emoji => <button type="button" key={emoji} onClick={() => { addEmoji(emoji); setEmojiOpen(false); }}>{emoji}</button>)}</div> : null}{replyImages.length ? <div className="mobile-inbox-attachment">{replyImages.map((image, index) => <span key={image.url} className="relative inline-flex items-center gap-1"><img src={image.url} alt={`ภาพแนบ ${index + 1}`} className="h-10 w-10 rounded-md object-cover" /><button type="button" aria-label={`เอาภาพที่ ${index + 1} ออก`} onClick={() => setReplyImages(current => current.filter((_, imageIndex) => imageIndex !== index))}><X /></button></span>)}<small>{replyImages.length}/4</small></div> : null}{notice ? <div className="mobile-inbox-notice">{notice}</div> : null}<div className="mobile-inbox-compose-row"><input ref={fileRef} hidden multiple type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={event => { void handleUpload(Array.from(event.target.files ?? [])); event.currentTarget.value = ""; }} /><button type="button" aria-label="แนบภาพ" onClick={() => fileRef.current?.click()} disabled={uploading || replyImages.length >= 4}><Paperclip /></button><Textarea value={replyText} onChange={event => setReplyText(event.target.value)} placeholder="พิมพ์ข้อความ…" disabled={!selectedCustomerId} onPaste={handleComposerPaste} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} /><button type="button" aria-label="อีโมจิ" onClick={() => setEmojiOpen(value => !value)}><Smile /></button><Button type="button" aria-label="ส่งข้อความ" onClick={send} disabled={sendReply.isPending || uploading || !selectedCustomerId || (!replyText.trim() && replyImages.length === 0)}>{sendReply.isPending ? <LoaderCircle className="animate-spin" /> : <Send />}</Button></div></div></div></div> : null}
  </main>;
}
