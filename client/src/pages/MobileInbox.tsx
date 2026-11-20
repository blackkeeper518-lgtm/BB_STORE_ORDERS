import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getActiveCamp, getSupabase, mapChatRowsToMessages, mapChatRowsToThreads, readCanonicalOrders, reconcileOptimisticMessages } from "@/lib/canonical";
import { uploadChatImageToVault } from "@/lib/chat-image-upload";
import { getLatestBBChatCustomerMessage, getSelectedOrderMessageText, isImportableLatestCustomerMessage } from "@/lib/order-deck-context";
import { CHAT_BROWSER_CONFIG_EVENT, readBrowserChatConfig } from "@/lib/chat-config";
import { CYBER_FRAME_EVENT, CYBER_FRAME_OPTIONS, readCyberFrame, readCyberFrameRooms, saveCyberFrameRoom } from "@/lib/cyber-frame";
import { CYBER_THEME_PRESETS, readCyberTheme, saveCyberTheme, type CyberTheme } from "@/lib/theme-lab";
import { CHAT_NOTIFICATION_EVENT, countUnreadChatMessages, isChatNotificationSoundEnabled, markChatNotificationsRead, playChatNotificationSound, readChatNotificationState, reconcileChatNotificationRows, setChatNotificationSound, setChatNotificationSoundEnabled, unlockChatNotificationAudio, writeChatNotificationState, type ChatNotification } from "@/lib/chat-notifications";
import { metaTransientSendNotice } from "@/lib/meta-send-notice";
import { trpc } from "@/lib/trpc";
import { OrderDeckFrame } from "@/components/chat/OrderDeckFrame";
import MobileStockPanel from "@/components/chat/MobileStockPanel";
import { ArrowLeft, Bell, Boxes, Check, Clipboard, Download, ExternalLink, Facebook, LoaderCircle, Menu, MessageCircle, MessagesSquare, Palette, Paperclip, Search, Send, Smile, Volume2, VolumeX, X } from "lucide-react";
import { type ClipboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import "@/styles/cyber-frames.css";
import LineChat from "@/pages/LineChat";

const SELECTED_ROOM_KEY = "bb-orders-mobile-inbox-selected-v1";

type Thread = ReturnType<typeof mapChatRowsToThreads>[number];
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type SelectedOrderMessage = { id: string; threadKey: string; text: string };

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
function messageText(message: Record<string, any> | null | undefined) {
  if (!message || typeof message !== "object") return "";
  return String(message.text ?? message.message_text ?? (imageUrls(message.attachmentsJson).length ? "ส่งรูปภาพ" : ""));
}
function profileAvatar(thread: Thread) { return thread.profilePictureUrl ? <img src={thread.profilePictureUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /> : (thread.customerName || "").slice(0, 1); }

export default function MobileInbox() {
  const [, setLocation] = useLocation();
  const [browserChatConfig, setBrowserChatConfig] = useState(() => readBrowserChatConfig());
  const hasBrowserConfig = Boolean(browserChatConfig?.url && browserChatConfig.serviceRoleKey);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(() => typeof window === "undefined" ? null : localStorage.getItem(SELECTED_ROOM_KEY));
  const [pageFilter, setPageFilter] = useState("all");
  const [platform, setPlatform] = useState<"facebook" | "line">("facebook");
  const [filter, setFilter] = useState<"all" | "ordered" | "tracking" | "unread">("all");
  const [openRoom, setOpenRoom] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyImages, setReplyImages] = useState<Array<{ url: string; sendUrl: string; name: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customPanel, setCustomPanel] = useState<"theme" | "frame" | "sound" | "stock" | null>(null);
  const [cyberTheme, setCyberTheme] = useState<CyberTheme>(() => readCyberTheme());
  const [themeOptions, setThemeOptions] = useState<CyberTheme[]>(CYBER_THEME_PRESETS);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [cyberFrame, setCyberFrame] = useState(() => readCyberFrame());
  const [cyberFrameRooms, setCyberFrameRooms] = useState(() => readCyberFrameRooms());
  const [frameOptions, setFrameOptions] = useState<Array<{ id: string; name: string }>>(CYBER_FRAME_OPTIONS.map(option => ({ id: option.id, name: option.name })));
  const [soundOptions, setSoundOptions] = useState<Array<{ key: string; name: string; volume: number }>>([]);
  const [selectedSoundKey, setSelectedSoundKey] = useState(() => { try { return typeof window === "undefined" ? "" : JSON.parse(window.localStorage.getItem("nightops-chat-sound-v1") || "{}").soundKey || ""; } catch { return ""; } });
  const [framePickerOpen, setFramePickerOpen] = useState(false);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [orderUnreadCount, setOrderUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(() => isChatNotificationSoundEnabled());
  const [chatNotificationItems, setChatNotificationItems] = useState<ChatNotification[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryProduct, setSummaryProduct] = useState("");
  const [orderSummary, setOrderSummary] = useState<{ orderNumber: string; customerName: string; phone: string; address: string; product: string; cod: string; copyText: string } | null>(null);
  const [orderDeckOpen, setOrderDeckOpen] = useState(false);
  const [selectedOrderMessage, setSelectedOrderMessage] = useState<SelectedOrderMessage | null>(null);
  const [orderDeckMessageRequest, setOrderDeckMessageRequest] = useState<{ id: number } | null>(null);
  const orderDeckMessageRequestIdRef = useRef(0);
  const orderDeckDialogRef = useRef<HTMLDivElement>(null);
  const orderDeckFocusReturnRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!orderDeckOpen) return;
    const previousOverflow = document.body.style.overflow;
    const dialog = orderDeckDialogRef.current;
    if (!dialog) return;
    document.body.style.overflow = "hidden";
    const focusableSelector = "button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),iframe,[tabindex]:not([tabindex='-1'])";
    const getFocusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    const focusFirst = () => (getFocusable()[0] ?? dialog).focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setOrderDeckOpen(false); return; }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) { event.preventDefault(); dialog.focus(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (active === last || !dialog.contains(active))) { event.preventDefault(); first.focus(); }
    };
    focusFirst();
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown, true);
      const focusReturn = orderDeckFocusReturnRef.current;
      if (focusReturn?.isConnected) focusReturn.focus();
      orderDeckFocusReturnRef.current = null;
    };
  }, [orderDeckOpen]);
  const fileRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const stickTimelineToBottomRef = useRef(true);
  const previousTimelineLengthRef = useRef(0);
  const menuTouchStartXRef = useRef<number | null>(null);
  const roomHistoryRef = useRef(false);
  useEffect(() => {
    const refresh = () => setBrowserChatConfig(readBrowserChatConfig());
    window.addEventListener("storage", refresh);
    window.addEventListener(CHAT_BROWSER_CONFIG_EVENT, refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener(CHAT_BROWSER_CONFIG_EVENT, refresh); };
  }, []);
  useEffect(() => {
    const sync = () => {
      const state = readChatNotificationState(readBrowserChatConfig()?.url);
      setChatUnreadCount(countUnreadChatMessages(state));
      setChatNotificationItems(state.pending);
    };
    sync();
    window.addEventListener(CHAT_NOTIFICATION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(CHAT_NOTIFICATION_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  useEffect(() => {
    const refreshTheme = (event: StorageEvent) => { if (event.key === "bb-cyber-theme-v1" || event.key === null) setCyberTheme(readCyberTheme()); };
    window.addEventListener("storage", refreshTheme);
    return () => window.removeEventListener("storage", refreshTheme);
  }, []);
  useEffect(() => {
    const refreshFrames = () => { setCyberFrame(readCyberFrame()); setCyberFrameRooms(readCyberFrameRooms()); };
    window.addEventListener("storage", refreshFrames);
    window.addEventListener(CYBER_FRAME_EVENT, refreshFrames);
    return () => { window.removeEventListener("storage", refreshFrames); window.removeEventListener(CYBER_FRAME_EVENT, refreshFrames); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const loadThemes = async () => {
      const api = getSupabase("vault");
      if (!api) return;
      const result = await api.from("app_themes").select("theme_key,name,description,background_color,surface_color,primary_color,accent_color,border_style,button_style,radius,glow,motion_enabled,is_enabled,sort_order,version").eq("is_enabled", true).order("sort_order", { ascending: true });
      if (cancelled || result.error || !Array.isArray(result.data) || !result.data.length) return;
      const validHex = (value: unknown) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
      const themes = result.data.map((row, index) => {
        const item = row as Record<string, unknown>;
        if (![item.background_color, item.surface_color, item.primary_color, item.accent_color].every(validHex)) return null;
        const border = ["gradient", "neon", "rail", "hud", "minimal"].includes(String(item.border_style)) ? String(item.border_style) : "gradient";
        const button = ["solid", "outline", "gradient"].includes(String(item.button_style)) ? String(item.button_style) : "solid";
        return {
          version: Number(item.version) || 1,
          preset: index,
          name: String(item.name || item.theme_key || `Theme ${index + 1}`),
          bg: String(item.background_color),
          surface: String(item.surface_color),
          primary: String(item.primary_color),
          accent: String(item.accent_color),
          border: border as CyberTheme["border"],
          button: button as CyberTheme["button"],
          radius: Number(item.radius) || 16,
          glow: Number(item.glow) || 12,
          motion: item.motion_enabled !== false,
        } satisfies CyberTheme;
      }).filter((theme): theme is CyberTheme => Boolean(theme));
      if (themes.length) setThemeOptions(themes);
    };
    void loadThemes();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const loadFrames = async () => {
      const api = getSupabase("vault");
      if (!api) return;
      const result = await api.from("app_chat_frames").select("frame_key,name,is_enabled,sort_order").eq("is_enabled", true).order("sort_order", { ascending: true });
      if (cancelled || result.error || !Array.isArray(result.data) || !result.data.length) return;
      const databaseFrames = result.data.map(row => { const raw = String(row.frame_key ?? "").trim().toLowerCase(); const match = raw.match(/^f(\d+)$/); return { id: match ? `f${match[1].padStart(2, "0")}` : raw, name: String(row.name ?? raw) }; }).filter(option => option.id);
      const databaseKeys = new Set(databaseFrames.map(option => option.id));
      const missingFrames = CYBER_FRAME_OPTIONS.filter(option => !databaseKeys.has(option.id)).map(option => ({ frame_key: option.id, name: option.name, description: option.description, base_frame_key: option.id, is_enabled: true, sort_order: option.number }));
      if (missingFrames.length) await api.from("app_chat_frames").upsert(missingFrames, { onConflict: "frame_key" });
      const merged = new Map<string, { id: string; name: string }>(databaseFrames.map(option => [option.id, option]));
      missingFrames.forEach(option => merged.set(option.frame_key, { id: option.frame_key, name: option.name }));
      setFrameOptions(Array.from(merged.values()));
    };
    void loadFrames();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const loadSounds = async () => {
      const api = getSupabase("vault");
      if (!api) return;
      const result = await api.from("app_sounds").select("sound_key,name,volume,is_enabled").eq("is_enabled", true).order("sort_order", { ascending: true });
      if (cancelled || result.error || !Array.isArray(result.data)) return;
      setSoundOptions(result.data.map(row => ({ key: String(row.sound_key ?? ""), name: String(row.name ?? row.sound_key ?? "เสียงแจ้งเตือน"), volume: Number(row.volume) || 0.35 })).filter(row => row.key));
    };
    void loadSounds();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!navigator.serviceWorker) return;
    const hadController = Boolean(navigator.serviceWorker.controller);
    const registrationPromise = navigator.serviceWorker.register("/mobile-inbox-sw.js", { scope: "/mobile-inbox" });
    const refreshAfterUpdate = () => { if (hadController) window.location.reload(); };
    navigator.serviceWorker.addEventListener("controllerchange", refreshAfterUpdate);
    void registrationPromise.then(registration => registration.update()).catch(() => undefined);
    const captureInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", captureInstall);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstall);
      navigator.serviceWorker.removeEventListener("controllerchange", refreshAfterUpdate);
    };
  }, []);
  useEffect(() => {
    const handlePopState = () => {
      if (!roomHistoryRef.current) return;
      roomHistoryRef.current = false;
      setOpenRoom(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const chatConfiguredQuery = trpc.chat.configured.useQuery(undefined, { enabled: !hasBrowserConfig, staleTime: 60_000, retry: false });
  const hasConfig = hasBrowserConfig || Boolean(chatConfiguredQuery.data?.configured);
  const threadsQuery = trpc.chat.threads.useQuery({ surface: "mobile" }, { enabled: hasConfig && platform === "facebook", staleTime: 0, refetchInterval: 30_000, refetchIntervalInBackground: false, refetchOnWindowFocus: true, refetchOnReconnect: true, select: mapChatRowsToThreads });
  const pageCatalogQuery = trpc.chat.pages.useQuery(undefined, { enabled: hasConfig, staleTime: 0, refetchInterval: false, refetchOnWindowFocus: false, retry: false });
  const lineConversationsQuery = trpc.line.conversations.useQuery({ surface: "mobile" }, { staleTime: 0, refetchInterval: false, refetchOnWindowFocus: false, refetchOnReconnect: false, retry: false });
  const threads = threadsQuery.data ?? [];
  const pollNotificationsMutation = trpc.chat.pollNotifications.useMutation();
  const pollNotifications = pollNotificationsMutation.mutateAsync;
  useEffect(() => {
    if (!hasConfig) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const current = readChatNotificationState(browserChatConfig?.url);
        const response = await pollNotifications({ afterRowId: current.cursorRowId });
        if (cancelled) return;
        const result = reconcileChatNotificationRows(current, response.rows, Date.now(), response.cursorRowId);
        writeChatNotificationState(result.state, browserChatConfig?.url);
        setChatNotificationItems(result.state.pending);
        const changedForPage = pageFilter === "all" ? result.changed : result.changed.filter(item => item.pageId === pageFilter);
        if (changedForPage.length) { playChatNotificationSound(); void showChatNotifications(changedForPage); }
      } catch { /* the inbox remains usable if notification polling is unavailable */ }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 8000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [hasConfig, browserChatConfig?.url, pageFilter, pollNotifications]);
  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      try {
        const result = await readCanonicalOrders("");
        const rows = (result.orders ?? []) as Array<Record<string, unknown>>;
        const key = `drakside-last-order-${getActiveCamp()}`;
        const lastSeen = localStorage.getItem(key) || "";
        const keys = rows.map(row => String(row.upsert_key || row.order_number || row.id || "")).filter(Boolean);
        const index = lastSeen ? keys.indexOf(lastSeen) : -1;
        if (!cancelled) setOrderUnreadCount(!lastSeen || index < 0 ? 0 : index);
        // A deleted/rotated legacy key must become the new baseline, not a fake unread order.
        if ((!lastSeen || index < 0) && keys[0]) localStorage.setItem(key, keys[0]);
      } catch { /* order badge is best effort */ }
    };
    void loadOrders();
    const timer = window.setInterval(() => void loadOrders(), 30000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);
  const availablePages = useMemo(() => {
    const catalog = pageCatalogQuery.data ?? [];
    if (catalog.length) return catalog.filter(page => page.enabledMobile).map(page => [page.pageId, page.pageName] as [string, string]);
    return Array.from(new Map(threads.filter(thread => thread.pageId && thread.pageName && thread.pageName !== "ไม่ระบุเพจ").map(thread => [thread.pageId, thread.pageName])).entries());
  }, [pageCatalogQuery.data, threads]);
  const unreadThreadKeys = useMemo(() => new Set(chatNotificationItems.map(item => item.threadKey)), [chatNotificationItems]);
  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads.filter(thread => {
      const text = [thread.customerName, thread.pageName, thread.preview, thread.searchText, thread.latestOrderNumber].join(" ").toLowerCase();
      const isOrdered = Boolean(thread.timeSlotLabel || thread.orderTodayActive);
      const hasTracking = Boolean(String(thread.tracking_number ?? "").trim());
      const isUnread = unreadThreadKeys.has(thread.key);
      return (pageFilter === "all" || thread.pageId === pageFilter) && (!query || text.includes(query)) && (filter === "all" || (filter === "ordered" ? isOrdered : filter === "tracking" ? hasTracking : isUnread));
    });
  }, [threads, search, filter, pageFilter, unreadThreadKeys]);
  const visibleChatNotifications = useMemo(
    () => pageFilter === "all" ? chatNotificationItems : chatNotificationItems.filter(item => item.pageId === pageFilter),
    [chatNotificationItems, pageFilter],
  );
  const visibleChatUnreadCount = useMemo(() => visibleChatNotifications.reduce((total, item) => total + Math.max(0, Number(item.count) || 0), 0), [visibleChatNotifications]);
  const visibleUnreadRoomCount = useMemo(() => new Set(visibleChatNotifications.map(item => item.threadKey)).size, [visibleChatNotifications]);
  const selected = (openRoom ? threads : filteredThreads).find(thread => thread.key === selectedKey) ?? filteredThreads[0];
  const selectedPageId = selected?.pageId ?? "";
  const selectedThreadId = selected?.threadId ?? "";
  const selectedCustomerId = selected?.customerId ?? "";
  const messagesQuery = trpc.chat.messages.useQuery({ pageId: selectedPageId, threadId: selectedThreadId, surface: "mobile" }, { enabled: hasConfig && platform === "facebook" && openRoom && Boolean(selectedPageId && selectedThreadId), staleTime: 0, refetchInterval: 15_000, refetchIntervalInBackground: false, refetchOnWindowFocus: true, refetchOnReconnect: true, select: mapChatRowsToMessages });
  const refreshInbox = () => { void Promise.all([threadsQuery.refetch(), lineConversationsQuery.refetch(), messagesQuery.refetch()]); };
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
      const message = error.message || "ส่งไม่สำเร็จ";
      setNotice(metaTransientSendNotice(message) ?? message);
      void Promise.all([messagesQuery.refetch(), threadsQuery.refetch()]);
    },
  });
  const generateSummary = trpc.orders.generateSummary.useMutation({
    onSuccess: result => setOrderSummary(result),
    onError: error => setNotice(error.message || "สรุปออเดอร์ไม่สำเร็จ"),
  });
  useEffect(() => { if (!selectedKey && filteredThreads[0]) setSelectedKey(filteredThreads[0].key); }, [filteredThreads, selectedKey]);
  useEffect(() => { if (selectedKey) localStorage.setItem(SELECTED_ROOM_KEY, selectedKey); }, [selectedKey]);
  useEffect(() => { setOptimisticMessages([]); optimisticMessageIdRef.current = null; setSelectedOrderMessage(null); setOrderDeckOpen(false); setOrderDeckMessageRequest(null); }, [selectedPageId, selectedThreadId]);
  useEffect(() => { setOptimisticMessages(current => reconcileOptimisticMessages(current, messagesQuery.data ?? [])); }, [messagesQuery.data, optimisticMessages]);
  useEffect(() => {
    if (!openRoom || !timelineRef.current) return;
    stickTimelineToBottomRef.current = true;
    previousTimelineLengthRef.current = 0;
    requestAnimationFrame(() => {
      if (timelineRef.current) timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    });
  }, [openRoom, selectedKey]);
  useEffect(() => {
    const length = (messagesQuery.data?.length ?? 0) + optimisticMessages.length;
    if (!openRoom || !timelineRef.current || length === previousTimelineLengthRef.current) return;
    previousTimelineLengthRef.current = length;
    if (!stickTimelineToBottomRef.current) return;
    requestAnimationFrame(() => {
      if (timelineRef.current) timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
    });
  }, [openRoom, messagesQuery.data?.length, optimisticMessages.length]);
  const markThreadNotificationsRead = (threadKey: string) => {
    const state = readChatNotificationState(browserChatConfig?.url);
    const next = markChatNotificationsRead(state, threadKey);
    writeChatNotificationState(next, browserChatConfig?.url);
    setChatNotificationItems(next.pending);
  };
  const selectRoom = (thread: Thread) => {
    markThreadNotificationsRead(thread.key);
    setSelectedKey(thread.key);
    setSelectedOrderMessage(null);
    setOrderDeckMessageRequest(null);
    const roomFrame = cyberFrameRooms[thread.key];
    if (roomFrame) setCyberFrame(roomFrame);
    setOpenRoom(true);
    setNotice("");
    if (!roomHistoryRef.current) {
      window.history.pushState({ mobileInboxRoom: true }, "", window.location.href);
      roomHistoryRef.current = true;
    }
  };
  const closeRoom = () => {
    if (roomHistoryRef.current) window.history.back();
    else setOpenRoom(false);
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get("page");
    const threadId = params.get("thread");
    if (!pageId || !threadId) return;
    const room = threads.find(thread => thread.pageId === pageId && thread.threadId === threadId);
    if (!room) return;
    setPlatform("facebook");
    setPageFilter(pageId);
    selectRoom(room);
    window.history.replaceState(window.history.state, "", "/mobile-inbox");
  }, [threads]);
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
    sendReply.mutate({ pageId: selectedPageId, pageName: selected?.pageName ?? undefined, portalKey: selected?.portalKey ?? undefined, chatLinkKey: selected?.chatLinkKey ?? undefined, threadId: selectedThreadId, recipientId: selectedCustomerId, text: text || undefined, imageUrls: replyImages.map(image => image.sendUrl || image.url), surface: "mobile" });
  };
  const chooseTheme = (preset: CyberTheme) => {
    const next = { ...cyberTheme, ...preset, preset: preset.preset };
    setCyberTheme(next);
    saveCyberTheme(next);
    returnToInbox();
  };
  const returnToInbox = () => {
    setDrawerOpen(false);
    setCustomPanel(null);
    setNotificationOpen(false);
    setOpenRoom(false);
    roomHistoryRef.current = false;
  };
  const openDrawer = () => { setCustomPanel(null); setDrawerOpen(true); };
  const openCustomizer = (panel: "theme" | "frame" | "sound" | "stock") => { setCustomPanel(panel); setDrawerOpen(false); };
  const installApp = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  };
  const enableBrowserNotifications = async () => {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    try { await Notification.requestPermission(); } catch { /* browser may require a separate settings action */ }
  };
  const showChatNotifications = async (items: ChatNotification[]) => {
    if (!items.length || !("Notification" in window) || Notification.permission !== "granted" || !navigator.serviceWorker) return;
    const registration = await navigator.serviceWorker.ready.catch(() => null);
    if (!registration) return;
    const item = items[0];
    await registration.showNotification(`ข้อความใหม่ · ${item.pageName || "Facebook"}`, { body: `${item.customerName || "ลูกค้า"}: ${item.message}`, tag: `bb-chat-${item.threadKey}`, icon: "/icons/icon-192.png", data: { url: `/mobile-inbox?page=${encodeURIComponent(item.pageId)}&thread=${encodeURIComponent(item.threadId)}` } });
  };
  const markAllNotificationsRead = () => {
    const state = readChatNotificationState(browserChatConfig?.url);
    const next = markChatNotificationsRead(state);
    writeChatNotificationState(next, browserChatConfig?.url);
    setChatNotificationItems([]);
    setNotificationOpen(false);
  };
  const toggleNotificationSound = () => {
    const next = !notificationSoundEnabled;
    setChatNotificationSoundEnabled(next);
    setNotificationSoundEnabled(next);
  };
  const messages = [...(messagesQuery.data ?? []), ...optimisticMessages].filter(message => messageText(message).trim());
  const selectedOrderMessageText = getSelectedOrderMessageText(selectedOrderMessage, selected?.key);
  const openOrderDeck = () => {
    if (!selected) return;
    const latestCustomerMessage = getLatestBBChatCustomerMessage(messagesQuery.data ?? []);
    const requestId = ++orderDeckMessageRequestIdRef.current;
    if (isImportableLatestCustomerMessage(latestCustomerMessage)) {
      const text = latestCustomerMessage.customer_message_text.trim();
      const id = String(latestCustomerMessage.id ?? latestCustomerMessage.messageId ?? `${latestCustomerMessage.occurredAt ?? ""}:${text}`);
      setSelectedOrderMessage({ id, threadKey: selected.key, text });
      setOrderDeckMessageRequest({ id: requestId });
      setNotice("");
    } else {
      setSelectedOrderMessage(null);
      setOrderDeckMessageRequest(null);
      setNotice("ข้อความลูกค้าล่าสุดไม่มีข้อความตัวอักษรที่ใช้ทำบิลได้ · ระบบไม่ดึงข้อความเก่ามาแทน");
    }
    orderDeckFocusReturnRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSummaryOpen(false);
    setOrderSummary(null);
    setOrderDeckOpen(true);
  };
  const receiveProductImages = async (urls: string[], productName?: string) => {
    const isAllowedProductImage = (url: string) => /^https?:\/\//i.test(url) || (url.length <= 8_100_000 && /^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(url));
    const existing = new Set(replyImages.map(image => image.sendUrl || image.url));
    const candidates = [...new Set(urls.filter(isAllowedProductImage).filter(url => !existing.has(url)))].slice(0, Math.max(0, 4 - replyImages.length));
    if (!candidates.length) {
      setNotice(replyImages.length >= 4 ? "แนบภาพสินค้าได้สูงสุด 4 ภาพต่อข้อความ · เอาภาพเก่าออกก่อน" : "ไม่พบภาพสินค้าที่แนบได้");
      return;
    }

    setOrderDeckOpen(false);
    setUploading(true);
    setNotice(`กำลังเตรียมภาพ${productName ? ` ${productName}` : "สินค้า"}…`);
    const additions: Array<{ url: string; sendUrl: string; name: string }> = [];
    try {
      const vault = getSupabase("vault");
      for (const [index, url] of candidates.entries()) {
        const name = productName ? `${productName}${candidates.length > 1 ? `-${index + 1}` : ""}` : `ภาพสินค้า ${replyImages.length + index + 1}`;
        if (/^https?:\/\//i.test(url)) {
          additions.push({ url, sendUrl: url, name });
          continue;
        }
        if (!vault) throw new Error("ยังไม่ได้ตั้งค่า Vault สำหรับเตรียมภาพสินค้า");
        const response = await fetch(url);
        if (!response.ok) throw new Error("อ่านภาพสินค้าไม่สำเร็จ");
        const blob = await response.blob();
        if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(blob.type) || blob.size > 6_000_000) {
          throw new Error("ภาพสินค้าต้องเป็น JPG, PNG, GIF หรือ WebP และไม่เกิน 6 MB");
        }
        const extension = blob.type.split("/")[1] === "jpeg" ? "jpg" : blob.type.split("/")[1];
        const file = new File([blob], `${name}.${extension}`, { type: blob.type });
        const uploadedImage = await uploadChatImageToVault(vault, file);
        additions.push({ url: uploadedImage.url, sendUrl: uploadedImage.url, name: file.name });
      }
      setReplyImages(current => {
        const next = [...current];
        const currentUrls = new Set(current.map(image => image.sendUrl || image.url));
        for (const image of additions) {
          if (next.length >= 4 || currentUrls.has(image.sendUrl)) continue;
          currentUrls.add(image.sendUrl);
          next.push(image);
        }
        return next;
      });
      setNotice(`เพิ่มภาพสินค้า ${additions.length} ภาพในกล่องข้อความแล้ว · ตรวจสอบก่อนกดส่ง`);
    } catch (error) {
      setNotice(`เตรียมภาพสินค้าไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(false);
    }
  };
  const openOrderSummary = () => {
    setSummaryText(selectedOrderMessageText);
    setSummaryProduct("");
    setOrderSummary(null);
    setSummaryOpen(true);
  };

  const handlePagePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (notificationOpen && !(event.target as HTMLElement).closest(".mobile-inbox-notification-panel,.mobile-inbox-bell-button")) setNotificationOpen(false);
    void unlockChatNotificationAudio();
  };
  if (platform === "line") return <main onPointerDown={event => { handlePagePointerDown(event); void enableBrowserNotifications(); }} onTouchStart={event => { const touch = event.touches[0]; menuTouchStartXRef.current = touch && touch.clientX <= 28 ? touch.clientX : null; }} onTouchEnd={event => { const start = menuTouchStartXRef.current; const touch = event.changedTouches[0]; menuTouchStartXRef.current = null; if (start !== null && touch && touch.clientX - start > 72) openDrawer(); }} className="mobile-inbox-page mobile-inbox-themed" style={{ "--mobile-bg": cyberTheme.bg, "--mobile-surface": cyberTheme.surface, "--mobile-primary": cyberTheme.primary, "--mobile-accent": cyberTheme.accent, "--mobile-radius": `${cyberTheme.radius}px`, "--mobile-glow": `${cyberTheme.glow}px` } as React.CSSProperties}><header className="mobile-inbox-header"><div><p className="mobile-inbox-kicker">BB STORE</p><button type="button" onClick={() => void lineConversationsQuery.refetch()} className="mobile-inbox-title-button"><h1>กล่องข้อความ</h1></button><small className="mobile-inbox-theme-name">กดชื่อเพื่อรีเฟรช · LINE OA</small></div><div className="mobile-inbox-header-actions"><button type="button" aria-label="การแจ้งเตือน" className="mobile-inbox-bell-button" onClick={() => setNotificationOpen(value => !value)}><Bell /><span>{visibleChatUnreadCount + orderUnreadCount > 99 ? "99+" : visibleChatUnreadCount + orderUnreadCount}</span></button></div></header><div className="mobile-inbox-tabs"><button type="button" className="platform-facebook" onClick={() => setPlatform("facebook")}><Facebook /><span>Facebook</span><b className="mobile-inbox-tab-count">{filteredThreads.length}</b></button><button type="button" className="platform-line is-active"><MessageCircle /><span>LINE</span><b className="mobile-inbox-tab-count">{lineConversationsQuery.data?.length ?? 0}</b></button></div><div className="mobile-line-embedded"><LineChat compact surface="mobile" /></div>
    {drawerOpen && !customPanel ? <><button type="button" aria-label="ปิดเมนู" className="mobile-inbox-drawer-scrim" onClick={() => setDrawerOpen(false)} /><aside className="mobile-inbox-drawer"><div className="mobile-inbox-drawer-head"><strong>เมนูจัดการแชท</strong><button type="button" onClick={() => setDrawerOpen(false)}><X /></button></div><button type="button" onClick={() => openCustomizer("theme")}><Palette /><span>ธีม</span></button><button type="button" onClick={() => openCustomizer("stock")}><Boxes /><span>คลังสินค้า · Product Master</span></button></aside></> : null}
    {customPanel === "theme" ? <section className="mobile-inbox-custom-panel"><div className="mobile-inbox-theme-panel-head"><div><strong>ธีมแอป</strong><small>จาก app_themes · เลือกแล้วเห็นผลทันที</small></div><button type="button" onClick={() => setCustomPanel(null)}><X /></button></div><div className="mobile-inbox-theme-grid">{themeOptions.map(preset => <button type="button" key={`${preset.name}-${preset.preset}`} className={`mobile-inbox-theme-swatch ${cyberTheme.name === preset.name ? "is-active" : ""}`} style={{ "--swatch-bg": preset.bg, "--swatch-primary": preset.primary, "--swatch-accent": preset.accent } as React.CSSProperties} onClick={() => chooseTheme(preset)}><span className="mobile-inbox-theme-swatch-light" /><span>{preset.name}</span>{cyberTheme.name === preset.name ? <Check /> : null}</button>)}</div></section> : null}
    {customPanel === "stock" ? <MobileStockPanel onClose={() => setCustomPanel(null)} /> : null}
    <nav className="mobile-inbox-bottom-nav"><button type="button" className="is-active" onClick={() => { setPlatform("line"); }}><MessagesSquare /><span>ข้อความ</span></button><button type="button" onClick={() => { document.querySelector<HTMLInputElement>(".line-mobile-search input")?.focus(); }}><Search /><span>ค้นหา</span></button><button type="button" onClick={openDrawer}><Menu /><span>เมนู</span></button></nav></main>
  return <main onPointerDown={handlePagePointerDown} className="mobile-inbox-page mobile-inbox-themed" style={{ "--mobile-bg": cyberTheme.bg, "--mobile-surface": cyberTheme.surface, "--mobile-primary": cyberTheme.primary, "--mobile-accent": cyberTheme.accent, "--mobile-radius": `${cyberTheme.radius}px`, "--mobile-glow": `${cyberTheme.glow}px` } as React.CSSProperties}>
    <header className="mobile-inbox-header"><div><p className="mobile-inbox-kicker">BB STORE</p><button type="button" onClick={refreshInbox} className="mobile-inbox-title-button"><h1>กล่องข้อความ{threadsQuery.isFetching ? <LoaderCircle className="ml-2 inline-block h-5 w-5 animate-spin" /> : null}</h1></button><small className="mobile-inbox-theme-name">กดชื่อเพื่อรีเฟรช · ธีม {cyberTheme.name}</small></div><div className="mobile-inbox-header-actions"><button type="button" aria-label="เปิดการแจ้งเตือน" className="mobile-inbox-bell-button" onClick={() => setNotificationOpen(value => !value)}><Bell /><span>{visibleChatUnreadCount + orderUnreadCount > 99 ? "99+" : visibleChatUnreadCount + orderUnreadCount}</span></button>{installPrompt ? <button type="button" aria-label="ติดตั้งแอป BB Store Inbox" onClick={() => void installApp()} className="mobile-inbox-install-button"><Download /><span>ติดตั้งแอป</span></button> : null}</div></header>
    {notificationOpen ? <section className="mobile-inbox-notification-panel"><div className="mobile-inbox-notification-head"><strong>การแจ้งเตือน</strong><div className="mobile-inbox-notification-actions"><button type="button" className="mobile-inbox-notification-read" onClick={markAllNotificationsRead}><Check /><span>อ่านแล้ว</span></button><button type="button" className="mobile-inbox-notification-sound" onClick={toggleNotificationSound}>{notificationSoundEnabled ? <Volume2 /> : <VolumeX />}<span>{notificationSoundEnabled ? "เปิดเสียง" : "ปิดเสียง"}</span></button></div></div><div className="mobile-inbox-notification-summary"><span>ข้อความใหม่ <b>{visibleChatUnreadCount}</b></span><span>ออเดอร์ใหม่ <b>{orderUnreadCount}</b></span></div>{visibleChatNotifications.length ? <div className="mobile-inbox-notification-list">{visibleChatNotifications.slice(0, 8).map(item => <button type="button" key={item.threadKey} onClick={() => { setNotificationOpen(false); setPlatform("facebook"); setPageFilter(item.pageId); const room = threads.find(thread => thread.key === item.threadKey); if (room) selectRoom(room); }}><strong>{item.customerName || "ลูกค้า"}</strong><small><Facebook /> {item.pageName || "ไม่ระบุเพจ"} · {timeLabel(item.messageAt)}</small><small>{item.message}</small></button>)}</div> : <p className="mobile-inbox-notification-empty">ยังไม่มีข้อความใหม่สำหรับเพจนี้</p>}</section> : null}
    {drawerOpen && !customPanel ? <><button type="button" aria-label="ปิดเมนู" className="mobile-inbox-drawer-scrim" onClick={() => setDrawerOpen(false)} /><aside className="mobile-inbox-drawer"><div className="mobile-inbox-drawer-head"><strong>เมนูจัดการแชท</strong><button type="button" onClick={() => setDrawerOpen(false)}><X /></button></div><button type="button" onClick={() => openCustomizer("theme")}><Palette /><span>ธีม</span></button><button type="button" onClick={() => openCustomizer("stock")}><Boxes /><span>คลังสินค้า · Product Master</span></button><button type="button" onClick={() => openCustomizer("frame")}><MessagesSquare /><span>กรอบแชท</span></button><button type="button" onClick={() => openCustomizer("sound")}><Volume2 /><span>เสียง</span></button><a className="mobile-inbox-drawer-link" href="https://bbstorefullv-1.vercel.app/" target="_blank" rel="noreferrer"><ExternalLink /><span>เช็คเลขพัสดุ</span><small>กรอกเบอร์โทรลูกค้า</small></a></aside></> : null}
    {customPanel === "theme" ? <section className="mobile-inbox-custom-panel"><div className="mobile-inbox-theme-panel-head"><div><strong>ธีมแอป</strong><small>จาก app_themes · เลือกแล้วเห็นผลทันที</small></div><button type="button" onClick={() => setCustomPanel(null)}><X /></button></div><div className="mobile-inbox-theme-grid">{themeOptions.map(preset => <button type="button" key={`${preset.name}-${preset.preset}`} className={`mobile-inbox-theme-swatch ${cyberTheme.name === preset.name ? "is-active" : ""}`} style={{ "--swatch-bg": preset.bg, "--swatch-primary": preset.primary, "--swatch-accent": preset.accent } as React.CSSProperties} onClick={() => chooseTheme(preset)}><span className="mobile-inbox-theme-swatch-light" /><span>{preset.name}</span>{cyberTheme.name === preset.name ? <Check /> : null}</button>)}</div></section> : null}
    {customPanel === "frame" ? <section className="mobile-inbox-custom-panel"><div className="mobile-inbox-theme-panel-head"><div><strong>กรอบแชท</strong><small>พรีวิว · กดเพื่อใช้เป็นกรอบหลัก</small></div><button type="button" onClick={() => setCustomPanel(null)}><X /></button></div><div className="mobile-inbox-frame-grid">{frameOptions.map(option => <button type="button" key={option.id} onClick={() => { saveCyberFrameRoom("__default__", option.id); setCyberFrame(option.id); setCustomPanel(null); }} className={`mobile-inbox-frame-preview cyber-frame-card cyber-frame-${option.id} ${cyberFrame === option.id ? "is-active" : ""}`}><strong>{option.name}</strong><small>{option.id.toUpperCase()}</small></button>)}</div></section> : null}
    {customPanel === "sound" ? <section className="mobile-inbox-custom-panel mobile-inbox-sound-panel"><div className="mobile-inbox-theme-panel-head"><div><strong>เสียงแจ้งเตือน</strong><small>เสียงที่เลือกจาก Secret Gallery · ROOM 04</small></div><button type="button" onClick={() => setCustomPanel(null)}><X /></button></div><Volume2 className="mx-auto my-4 h-12 w-12 text-[var(--mobile-primary)]" /><p>เลือกเสียงแจ้งเตือนจาก ROOM 04</p><select className="mobile-inbox-sound-select" value={selectedSoundKey} onChange={event => { const option = soundOptions.find(item => item.key === event.target.value); setSelectedSoundKey(event.target.value); setChatNotificationSound(event.target.value, option?.volume); }}><option value="">เสียงเริ่มต้น</option>{soundOptions.map(option => <option key={option.key} value={option.key}>{option.name} · {option.key}</option>)}</select><button type="button" className="mobile-inbox-sound-test" onClick={() => { void unlockChatNotificationAudio(); playChatNotificationSound(); }}>ทดลองเล่นเสียง</button></section> : null}
    {customPanel === "stock" ? <MobileStockPanel onClose={() => setCustomPanel(null)} /> : null}
    <div className="mobile-inbox-tabs"><button type="button" className="platform-facebook is-active" aria-label={`Facebook ${filteredThreads.length} ห้อง`}><Facebook /><span>Facebook</span><b className="mobile-inbox-tab-count">{filteredThreads.length}</b></button><button type="button" className="platform-line" onClick={() => setPlatform("line")} aria-label={`LINE ${lineConversationsQuery.data?.length ?? 0} ห้อง`}><MessageCircle /><span>LINE</span><b className="mobile-inbox-tab-count">{lineConversationsQuery.data?.length ?? 0}</b></button></div>
    <section className="mobile-inbox-list-panel">
      <div className={`mobile-inbox-search cyber-frame-card cyber-frame-${cyberFrameRooms[selectedKey || ""] || cyberFrame}`}><Search /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อลูกค้าหรือข้อความ…" /></div>
      <div className="mobile-inbox-filters"><select aria-label="เลือกเพจ" value={pageFilter} onChange={event => setPageFilter(event.target.value)}><option value="all">ทุกเพจ</option>{availablePages.map(([pageId, pageName]) => <option key={pageId} value={pageId}>{pageName}</option>)}</select>{([ ["all", "ทั้งหมด"], ["ordered", "ออเดอร์"], ["tracking", "เลขพัสดุ"], ["unread", `ยังไม่อ่าน ${visibleUnreadRoomCount}`] ] as const).map(([value, label]) => <button key={value} type="button" className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>
      {!hasConfig ? <div className="mobile-inbox-empty"><MessageCircle /><p>ยังไม่ได้ตั้งค่า Chat ใน ROOM 02</p><button type="button" onClick={() => setLocation("/secret-gallery")}>ไปตั้งค่า</button></div> : threadsQuery.isLoading ? <div className="mobile-inbox-empty"><LoaderCircle className="animate-spin" /><p>กำลังโหลดข้อความ…</p></div> : filteredThreads.length === 0 ? <div className="mobile-inbox-empty"><MessageCircle /><p>{filter === "unread" ? "ไม่มีห้องที่ยังไม่อ่าน" : "ไม่พบห้องแชท"}</p></div> : <div className="mobile-inbox-threads">{filteredThreads.map(thread => <button type="button" key={thread.key} onClick={() => selectRoom(thread)} className={`mobile-inbox-thread ${selected?.key === thread.key ? "is-selected" : ""}`}><span className="mobile-inbox-avatar">{profileAvatar(thread)}</span><span className="mobile-inbox-thread-body"><span className="mobile-inbox-thread-top"><strong>{thread.customerName || ""}</strong><time>{timeLabel(thread.latestAt)}</time></span><span className="mobile-inbox-thread-preview">{thread.preview || "ยังไม่มีข้อความ"}</span><span className="mobile-inbox-thread-tags"><span className="mobile-inbox-platform-badge" aria-label="Facebook"><Facebook /> Facebook</span><span>{thread.pageName || "ไม่ระบุเพจ"}</span>{unreadThreadKeys.has(thread.key) ? <b>ยังไม่อ่าน</b> : null}{thread.orderCount > 0 ? <b>ออเดอร์</b> : null}</span></span></button>)}</div>}
    </section>
    <nav className="mobile-inbox-bottom-nav"><button type="button" className="is-active" onClick={returnToInbox}><MessagesSquare /><span>ข้อความ</span></button><button type="button" onClick={() => { returnToInbox(); requestAnimationFrame(() => document.querySelector<HTMLInputElement>(".mobile-inbox-search input")?.focus()); }}><Search /><span>ค้นหา</span></button><button type="button" onClick={openDrawer}><Menu /><span>เมนู</span></button></nav>
    {openRoom && selected ? <div className="mobile-inbox-conversation"><div className="mobile-inbox-conversation-shell"><header className="mobile-inbox-conversation-header"><button type="button" aria-label="กลับไปหน้ารวมแชท" onClick={closeRoom}><ArrowLeft /></button><span className="mobile-inbox-avatar">{profileAvatar(selected)}</span><div className="min-w-0 flex-1"><strong className="block truncate">{selected.customerName || ""}</strong><small>{selected.pageName || "ไม่ระบุเพจ"}</small></div><button type="button" onClick={openOrderDeck} disabled={messagesQuery.isLoading} className="mobile-inbox-order-summary-button" aria-label="ดึงข้อความลูกค้าล่าสุดแล้วเปิดสรุปบิล" title="ดึงข้อความลูกค้าล่าสุดจาก 🌌BB_CHAT แล้วเปิดสรุปบิล"><Clipboard /><span>🧾สรุปบิล</span></button></header><div ref={timelineRef} onScroll={event => { const node = event.currentTarget; stickTimelineToBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48; }} className="mobile-inbox-timeline">{messages.length ? messages.map(message => { const outgoing = message.direction === "outbound" || message.senderType === "page"; const text = messageText(message); const images = imageUrls(message.attachmentsJson); const mediaOnly = images.length > 0 && (!text.trim() || /^\[รูปภาพ\]$|^ส่งรูปภาพ$/i.test(text.trim())); const roomFrame = cyberFrameRooms[selected.key] || cyberFrame; return (
              <div key={message.id} className={`mobile-inbox-message-row ${outgoing ? "is-outgoing" : ""}`}>
                <div className={`mobile-inbox-message chat-bubble-frame ${roomFrame ? `cyber-frame-card cyber-frame-${roomFrame}` : ""} ${mediaOnly ? "is-media-only" : ""}`}>
                  {!mediaOnly && text ? <p>{text}</p> : null}
                  {images.map(url => <img key={url} src={url} alt="รูปภาพจากแชท" />)}
                  <time>{timeLabel(message.occurredAt)}</time>
                </div>
              </div>
            ); }) : <div className="mobile-inbox-empty"><MessageCircle /><p>{selected.preview || "ยังไม่มีข้อความ"}</p></div>}</div><div className="mobile-inbox-composer">{emojiOpen ? <div className="mobile-inbox-emoji">{["😊", "👍", "🙏", "❤️", "📦"].map(emoji => <button type="button" key={emoji} onClick={() => { addEmoji(emoji); setEmojiOpen(false); }}>{emoji}</button>)}</div> : null}{replyImages.length ? <div className="mobile-inbox-attachment">{replyImages.map((image, index) => <span key={image.url} className="relative inline-flex items-center gap-1"><img src={image.url} alt={`ภาพแนบ ${index + 1}`} className="h-10 w-10 rounded-md object-cover" /><button type="button" aria-label={`เอาภาพที่ ${index + 1} ออก`} onClick={() => setReplyImages(current => current.filter((_, imageIndex) => imageIndex !== index))}><X /></button></span>)}<small>{replyImages.length}/4</small></div> : null}{notice ? <div className="mobile-inbox-notice">{notice}</div> : null}<div className="mobile-inbox-compose-row"><input ref={fileRef} hidden multiple type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={event => { void handleUpload(Array.from(event.target.files ?? [])); event.currentTarget.value = ""; }} /><button type="button" aria-label="แนบภาพ" onClick={() => fileRef.current?.click()} disabled={uploading || replyImages.length >= 4}><Paperclip /></button><Textarea value={replyText} onChange={event => setReplyText(event.target.value)} placeholder="พิมพ์ข้อความ…" disabled={!selectedCustomerId} onPaste={handleComposerPaste} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} /><button type="button" aria-label="อีโมจิ" onClick={() => setEmojiOpen(value => !value)}><Smile /></button><Button type="button" aria-label="ส่งข้อความ" onClick={send} disabled={sendReply.isPending || uploading || !selectedCustomerId || (!replyText.trim() && replyImages.length === 0)}>{sendReply.isPending ? <LoaderCircle className="animate-spin" /> : <Send />}</Button></div></div></div></div> : null}
    {orderDeckOpen && selected && typeof document !== "undefined" ? createPortal(
      <div className="mobile-inbox-order-deck" role="presentation" onClick={() => setOrderDeckOpen(false)}>
        <div ref={orderDeckDialogRef} tabIndex={-1} className="mobile-inbox-order-deck-panel" role="dialog" aria-modal="true" aria-label={`สรุปออเดอร์ · ${selected.customerName || "ลูกค้า"}`} onClick={event => event.stopPropagation()}>
          <OrderDeckFrame pageId={selected.pageId} pageName={selected.pageName || "ไม่ระบุเพจ"} threadId={selected.threadId} customerName={selected.customerName || "ลูกค้า"} customerPhone={String(selected.customerPhone || selected.phone || "")} selectedCustomerMessage={selectedOrderMessageText} messageMode="latest" messageRequest={orderDeckMessageRequest} onMessageRequestHandled={(id) => setOrderDeckMessageRequest(current => current?.id === id ? null : current)} roomStatus="กำลังดูห้อง" onProductImagesSelected={receiveProductImages} onSummaryReady={summary => { setReplyText(summary); setOrderDeckOpen(false); setOrderDeckMessageRequest(null); setNotice("สรุปบิลใส่ช่องตอบกลับแล้ว · ตรวจสอบก่อนกดส่ง"); }} onClose={() => { setOrderDeckOpen(false); setOrderDeckMessageRequest(null); }} />
        </div>
      </div>,
      document.body,
    ) : null}
    {summaryOpen ? <div className="mobile-inbox-summary-overlay" role="dialog" aria-modal="true"><section className="mobile-inbox-summary-panel"><header><div><small>ADMIN ORDER SUMMARY</small><h2>สรุปออเดอร์จากข้อความที่เลือก</h2></div><button type="button" onClick={() => setSummaryOpen(false)} aria-label="ปิดสรุปออเดอร์"><X /></button></header><p className="mobile-inbox-summary-hint">เริ่มจากข้อความที่คุณเลือกเอง · แก้ไขหรือเติมข้อมูลได้ก่อนกดอ่าน</p><Textarea autoFocus value={summaryText} onChange={event => { setSummaryText(event.target.value); setOrderSummary(null); }} placeholder="ข้อความที่เลือกจากลูกค้า…" className="mobile-inbox-summary-input" /><Input value={summaryProduct} onChange={event => { setSummaryProduct(event.target.value); setOrderSummary(null); }} placeholder="สินค้า / ตัวย่อสินค้า เช่น SIERRA_GREEN 2 คอต" className="mobile-inbox-summary-product" />{orderSummary ? <div className="mobile-inbox-summary-result"><div><small>ชื่อ</small><strong>{orderSummary.customerName}</strong></div><div><small>เบอร์</small><strong>{orderSummary.phone || "ไม่ระบุ"}</strong></div><div className="wide"><small>ที่อยู่</small><strong>{orderSummary.address || "ไม่ระบุ"}</strong></div><div><small>สินค้า</small><strong>{orderSummary.product}</strong></div><div><small>COD</small><strong>{orderSummary.cod}</strong></div><pre>{orderSummary.copyText}</pre><Button type="button" onClick={() => { setReplyText(orderSummary.copyText); setSummaryOpen(false); setNotice("ใส่ข้อความสรุปลงช่องตอบกลับแล้ว · ตรวจสอบก่อนส่ง"); }} className="wide bg-gradient-to-r from-fuchsia-600 to-cyan-500"><Send className="mr-2 h-4 w-4" />ใส่ลงช่องตอบกลับ</Button></div> : null}<footer><Button type="button" variant="outline" onClick={() => setSummaryOpen(false)}>ยกเลิก</Button><Button type="button" onClick={() => generateSummary.mutate({ rawText: summaryText, customerName: selected?.customerName || undefined, product: summaryProduct || undefined })} disabled={!summaryText.trim() || generateSummary.isPending} className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-emerald-500">{generateSummary.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Clipboard className="mr-2 h-4 w-4" />}อ่านและสรุป</Button></footer></section></div> : null}
  </main>;
}
