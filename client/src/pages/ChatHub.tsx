import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/useMobile";
import { extractChatImageUrls, getSupabase, mapChatRowsToMessages, mapChatRowsToThreads, reconcileOptimisticMessages } from "@/lib/canonical";
import { normalizeChatImageForMeta, uploadChatImageToVault } from "@/lib/chat-image-upload";
import { buildMetaConversationUrl } from "@/lib/meta-inbox";
import { metaTransientSendNotice } from "@/lib/meta-send-notice";
import { getImportableLatestCustomerMessage, getSelectedOrderMessageText, isSelectableCustomerMessage } from "@/lib/order-deck-context";
import { applySharedDeckHighlights, selectFeaturedDeckImageProducts } from "@/lib/order-deck-product-index";
import { useChatProductHighlights } from "@/hooks/useChatProductHighlights";
import { CYBER_FRAME_EVENT, CYBER_FRAME_OPTIONS, readCyberFrame, readCyberFrameRooms, saveCyberFrameRoom } from "@/lib/cyber-frame";
import { trpc } from "@/lib/trpc";
import "@/styles/cyber-frames.css";
import { Check, CheckCircle2, ChevronDown, CircleUserRound, Clipboard, ExternalLink, LoaderCircle, Megaphone, MessageCircle, MessagesSquare, PanelLeft, Paperclip, Power, RefreshCw, Search, Send, Smile, Sparkles, UserRound, Users, Wrench, X } from "lucide-react";
import { type ClipboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { OrderDeckFrame } from "@/components/chat/OrderDeckFrame";

function timeLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}
function messageTimeLabel(message: { timeTh?: string | null; messageTimeDisplay?: string | null; occurredAt?: string | null }) {
  return message.timeTh || message.messageTimeDisplay || timeLabel(message.occurredAt);
}

function imageUrls(value: string | null | undefined) {
  return extractChatImageUrls(value);
}

function stripSpeakerPrefix(value: string) { return value.replace(/^\s*\[(?:เพจ|ลูกค้า)\]\s*/i, "").trim(); }
function displayMessageText(message: Record<string, any> | null | undefined) {
  if (!message || typeof message !== "object") return "";
  const text = stripSpeakerPrefix(String(message.text ?? ""));
  if (text) return text;
  return imageUrls(message.attachmentsJson).length > 0 ? "ส่งรูปภาพ" : "";
}
function isPageTimelineLine(line: string) { return /\[\s*เพจ\s*\]?\s*[:：]?/i.test(line); }
function isCustomerTimelineLine(line: string) { return /\[\s*ลูกค้า\s*\]?\s*[:：]?/i.test(line); }
function isThreadControlConflict(message: string) { return /META_THREAD_CONTROL_CONFLICT|another app|currently controlling|ควบคุมเธรด|แอพอื่นกำลังควบคุม/i.test(message); }
function hasTimeSlotLabel(thread: Record<string, any>) { return Boolean(String(thread.timeSlotLabel ?? "").trim()); }
function isOrderRoom(thread: Record<string, any>) { return Number(thread.currentThreadTotalBills ?? 0) > 0; }
function hasTrackingOver24Hours(thread: Record<string, any>) {
  return Boolean(String(thread.tracking_number ?? "").trim()) && Number(thread.trackingAgeMs ?? 0) >= 24 * 60 * 60 * 1000;
}


const CHAT_PAGE_FILTER_KEY = "bb-orders-chat-page-filter-v1";
const CHAT_SELECTED_ROOM_KEY = "bb-orders-chat-selected-room-v1";
type SelectedOrderMessage = { id: string; threadKey: string; text: string };
function CopyValueCard({ label, value, copied, onCopy }: { label: string; value: unknown; copied: boolean; onCopy: () => void }) {
  const text = String(value ?? "").trim();
  const hasValue = Boolean(text);
  return <button type="button" onClick={onCopy} disabled={!hasValue} title={hasValue ? `คัดลอก${label}: ${text}` : "ไม่มีข้อมูล"} className={`chat-tool-copy-row ${copied ? "chat-tool-copy-row--copied" : ""}`}>
    <span className="min-w-0 flex-1"><span className="chat-tool-copy-row__label">{label}</span><span className="chat-tool-copy-row__value">{hasValue ? text : "—"}</span></span>
    <span className={`chat-tool-copy-row__action ${copied ? "is-copied" : ""}`}>{copied ? "คัดลอกแล้ว ✓" : "คัดลอก"}</span>
  </button>;
}
function SendStatusBadge({ label, value, route }: { label: string; value: unknown; route: "parcel" | "telegram" }) {
  const status = String(value ?? "").trim();
  if (!status) return null;
  return <span className={`chat-send-status chat-send-status--${route} chat-send-status--active`} title={`${label}: ${status}`}>
    <span className="chat-send-status__dot" aria-hidden="true" />
    <span className="chat-send-status__label">{label}</span>
    <span className="chat-send-status__value">{status}</span>
  </span>;
}
export default function ChatHub() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const chatConfiguredQuery = trpc.chat.configured.useQuery(undefined, { staleTime: 60_000, retry: false });
  const hasServerChatConfig = Boolean(chatConfiguredQuery.data?.configured);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(() => typeof window === "undefined" ? null : localStorage.getItem(CHAT_SELECTED_ROOM_KEY));
  const [composerOpen, setComposerOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(() => typeof window === "undefined" || window.innerWidth >= 1440);
  const [orderDeckOpen, setOrderDeckOpen] = useState(false);
  const [selectedOrderMessage, setSelectedOrderMessage] = useState<SelectedOrderMessage | null>(null);
  const [orderDeckMessageRequest, setOrderDeckMessageRequest] = useState<{ id: number; clearMessage?: boolean } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pageFilterOpen, setPageFilterOpen] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { const value = JSON.parse(localStorage.getItem(CHAT_PAGE_FILTER_KEY) || "[]"); return Array.isArray(value) ? value.filter(item => typeof item === "string") : []; } catch { return []; }
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "ordered" | "tracking_over_24h">("all");
  const [replyText, setReplyText] = useState("");
  const [replyImages, setReplyImages] = useState<Array<{ url: string; sendUrl: string; name: string }>>([]);
  const [deckImageProducts, setDeckImageProducts] = useState<Array<{ product: string; terms: string[]; imageUrls: string[]; featured: boolean }>>([]);
  const [productFloatVisible, setProductFloatVisible] = useState(false);
  const [productFloatDismissed, setProductFloatDismissed] = useState(false);
  const [productImagesRequest, setProductImagesRequest] = useState<{ id: number; product: string } | null>(null);
  const productImagesRequestId = useRef(0);
  const orderDeckMessageRequestIdRef = useRef(0);
  const orderDeckHandoffRequestIdRef = useRef(0);
  const [imageUploading, setImageUploading] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [stickerId, setStickerId] = useState("");
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const optimisticMessageIdRef = useRef<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<"idle" | "sending" | "sent" | "warning" | "failed">("idle");
  const [replyNotice, setReplyNotice] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summary, setSummary] = useState<{ orderNumber: string; customerName: string; phone: string; address: string; product: string; cod: string; copyText: string; unitPrice?: number | null; timingMs?: { total: number; parse: number; dataLookup: number; audit: number } } | null>(null);
  const [messageFilter, setMessageFilter] = useState<"all" | "customer" | "page">("all");
  const [cyberFrame, setCyberFrame] = useState(() => readCyberFrame());
  const [cyberFrameRooms, setCyberFrameRooms] = useState(() => readCyberFrameRooms());
  const [framePickerRoom, setFramePickerRoom] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedToolField, setCopiedToolField] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  const chatTimelineRef = useRef<HTMLDivElement>(null);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const nearBottomRef = useRef(true);
  const lastSelectedKeyRef = useRef<string | null>(null);
  const lastLatestMessageKeyRef = useRef<string | null>(null);
  const routeSelectionPendingRef = useRef<string | null>(null);
  useEffect(() => {
    const refreshFrame = () => { setCyberFrame(readCyberFrame()); setCyberFrameRooms(readCyberFrameRooms()); };
    window.addEventListener("storage", refreshFrame);
    window.addEventListener(CYBER_FRAME_EVENT, refreshFrame);
    return () => {
      window.removeEventListener("storage", refreshFrame);
      window.removeEventListener(CYBER_FRAME_EVENT, refreshFrame);
    };
  }, []);
  const setRoomFrame = (roomKey: string, id: string) => { saveCyberFrameRoom(roomKey, id); setCyberFrameRooms(readCyberFrameRooms()); };
  useEffect(() => { localStorage.setItem(CHAT_PAGE_FILTER_KEY, JSON.stringify(selectedPages)); }, [selectedPages]);
  useLayoutEffect(() => {
    const field = replyTextareaRef.current;
    if (!field) return;
    const maxHeight = Math.min(136, Math.max(80, Math.floor(window.innerHeight * 0.22)));
    const minHeight = Math.min(80, maxHeight);
    field.style.height = "auto";
    const contentHeight = field.scrollHeight;
    field.style.height = `${Math.min(maxHeight, Math.max(minHeight, contentHeight))}px`;
    field.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  }, [replyText]);
  useEffect(() => { if (selectedKey) localStorage.setItem(CHAT_SELECTED_ROOM_KEY, selectedKey); }, [selectedKey]);
  const threadsQuery = trpc.chat.threads.useQuery({ surface: "web" }, {
    enabled: hasServerChatConfig,
    staleTime: 0,
    // Refresh the room list frequently enough to surface newly ingested conversations.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    select: mapChatRowsToThreads,
  });
  const pageCatalogQuery = trpc.chat.pages.useQuery(undefined, { enabled: hasServerChatConfig, staleTime: 0, refetchInterval: false, refetchOnWindowFocus: false, retry: false });
  const setPageWebStatus = trpc.chat.setPageWebStatus.useMutation({ onSuccess: () => { void pageCatalogQuery.refetch(); void threadsQuery.refetch(); } });
  const threads = threadsQuery.data ?? [];
  const availablePages = useMemo<Array<[string, string, boolean, boolean]>>(
    () => {
      const catalog = pageCatalogQuery.data ?? [];
      const source = catalog.length ? catalog : Array.from(new Map(threads.filter(thread => thread.pageId && thread.pageName).map(thread => [thread.pageId as string, { pageId: thread.pageId as string, pageName: thread.pageName || "ไม่ระบุเพจ", enabledWeb: true }])).values());
      return source.map(page => [page.pageId, page.pageName, threads.some(thread => thread.pageId === page.pageId && isOrderRoom(thread)), "enabledWeb" in page ? page.enabledWeb : true] as [string, string, boolean, boolean]).sort((a, b) => a[1].localeCompare(b[1], "th"));
    },
    [pageCatalogQuery.data, threads],
  );

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return threads.filter(thread => {
      const matchesPage = selectedPages.length === 0 || Boolean(thread.pageId && selectedPages.includes(thread.pageId));
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "ordered" ? isOrderRoom(thread) : hasTrackingOver24Hours(thread));
      const matchesSearch = !query || [thread.customerName, thread.pageName, thread.preview, thread.searchText, thread.latestOrderNumber].some(value => String(value ?? "").toLowerCase().includes(query));
      return matchesPage && matchesStatus && matchesSearch;
    });
  }, [threads, search, selectedPages, statusFilter]);
  const selected = filteredThreads.find(thread => thread.key === selectedKey) ?? filteredThreads[0];
  const selectedPageId = selected?.pageId ?? selected?.orders[0]?.page_id ?? "";
  const selectedThreadId = selected?.threadId ?? "";
  const selectedRoomKey = selected?.key ?? "";
  const orderDeckRequestRoomKeyRef = useRef("");
  orderDeckRequestRoomKeyRef.current = `${selectedPageId}:${selectedThreadId}`;
  const selectedCustomerId = selected?.customerId ?? "";
  // Historical rows may not have chat_link_key; page_id + thread_id are the
  // same canonical key accepted by the Meta URL helper.
  const selectedMetaInboxUrl = buildMetaConversationUrl(
    selected?.chatLinkKey || (selectedPageId && selectedThreadId ? `${selectedPageId}_t_${selectedThreadId}` : ""),
  );
  const [handoffTracking, setHandoffTracking] = useState<Record<string, any> | null>(null);
  const messagesQuery = trpc.chat.messages.useQuery({ pageId: selectedPageId, threadId: selectedThreadId, surface: "web" }, {
    enabled: hasServerChatConfig && Boolean(selectedPageId && selectedThreadId),
    staleTime: 0,
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    select: mapChatRowsToMessages,
  });
  const selectedOrderMessageText = getSelectedOrderMessageText(selectedOrderMessage, selected?.key);
  useEffect(() => {
    setProductFloatVisible(false);
    setProductFloatDismissed(false);
    setDeckImageProducts([]);
    setProductImagesRequest(null);
    if (!selectedRoomKey) return;
    const timer = window.setTimeout(() => setProductFloatVisible(true), 3000);
    return () => window.clearTimeout(timer);
  }, [selectedRoomKey, selectedPageId, selected?.pageName]);
  useEffect(() => {
    setOptimisticMessages([]);
    optimisticMessageIdRef.current = null;
    setSelectedOrderMessage(null);
    setOrderDeckMessageRequest(null);
    orderDeckMessageRequestIdRef.current += 1;
  }, [selectedPageId, selectedThreadId]);
  useEffect(() => {
    setOptimisticMessages(current => reconcileOptimisticMessages(current, messagesQuery.data ?? []));
  }, [messagesQuery.data, optimisticMessages]);
  useEffect(() => {
    if (!selectedPageId || !selectedThreadId || typeof window === "undefined") {
      setHandoffTracking(null);
      return;
    }
    try {
      const storageKey = `darkside-send-gate:${selectedPageId}:${selectedThreadId}`;
      const raw = window.sessionStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      setHandoffTracking(parsed);
      if (parsed && (parsed.tracking_number || parsed.facebook_tracking_message || parsed.drakside_tracking_message)) setToolsOpen(true);
      const facebookMessage = String(selected?.facebook_tracking_message || parsed?.facebook_tracking_message || "").trim();
      const draksideMessage = String(selected?.drakside_tracking_message || parsed?.drakside_tracking_message || "").trim();
      const stagedMessage = facebookMessage || draksideMessage;
      if (stagedMessage) {
        setReplyText(stagedMessage);
        setComposerOpen(true);
        setDeliveryStatus("idle");
        setReplyNotice("ข้อความพร้อมตรวจทานในกล่องตอบแชท · ยังไม่ส่ง");
        window.sessionStorage.removeItem(storageKey);
      }
    } catch {
      setHandoffTracking(null);
    }
  }, [selectedPageId, selectedThreadId]);
  const linkedOrders = selected?.orders ?? [];
  const selectedTrackingRows = useMemo(() => {
    if (!selected) return [];
    const room = selected as Record<string, any>;
    const row = {
      tracking_number: room.tracking_number ?? room.parcel_tracking_number ?? "",
      order_number: room.order_number ?? "",
      order_number_display: room.order_number_display ?? "",
      shipping_carrier: room.shipping_carrier ?? "",
      address_display_packer: room.address_display_packer ?? room.full_address ?? room.address ?? "",
      facebook_tracking_message: room.facebook_tracking_message ?? "",
      drakside_tracking_message: room.drakside_tracking_message ?? "",
      source_lane: room.source_lane ?? "",
    };
    const merged = { ...handoffTracking };
    Object.entries(row).forEach(([key, value]) => {
      if (String(value ?? "").trim()) merged[key] = value;
    });
    return Object.values(merged).some(value => String(value ?? "").trim()) ? [merged] : [];
  }, [selected, handoffTracking]);
  const copyToolValue = async (key: string, value: unknown) => {
    const text = String(value ?? "").trim();
    if (!text || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setCopiedToolField(key);
    window.setTimeout(() => setCopiedToolField(current => current === key ? null : current), 1800);
  };
  const toolValues = useMemo(() => {
    const room = selected as Record<string, any> | undefined;
    return [
      { key: "phone", label: "เบอร์โทร", value: room?.phone ?? room?.customerPhone ?? room?.extracted_phone },
      { key: "order", label: "ออเดอร์", value: room?.order_number_display ?? room?.order_number },
      { key: "address", label: "ที่อยู่", value: room?.address_display_packer || room?.full_address || room?.address || room?.shipping_address || handoffTracking?.address_display_packer },
      { key: "packer", label: "ข้อมูลแพ็ก", value: room?.manus_for_packer },
    ];
  }, [selected, handoffTracking]);
  const availableToolValues = toolValues.filter(item => String(item.value ?? "").trim());
  const chatEvidenceQuery = trpc.orders.chatEvidence.useQuery({ pageId: selectedPageId, threadId: selectedThreadId }, { enabled: Boolean(selectedPageId && selectedThreadId && orderDetailOpen), refetchInterval: 60_000 });
  const totalMessages = useMemo(() => threads.reduce((total, thread) => total + thread.messageCount, 0), [threads]);
  const verifySentMessage = async (sentText: string) => {
    const target = sentText.trim();
    if (!target) return false;
    try {
      const refreshed = await messagesQuery.refetch();
      return (refreshed.data ?? []).some((message: any) => {
        const body = String(message?.text ?? message?.message_text ?? message?.messageText ?? "").trim();
        if (body !== target) return false;
        const at = new Date(message?.occurredAt ?? message?.createdAt ?? 0).getTime();
        return Number.isFinite(at) && at >= Date.now() - 120_000;
      });
    } catch { return false; }
  };
  const sendReply = trpc.chat.sendReply.useMutation({
    onMutate: () => { setDeliveryStatus("sending"); setReplyNotice(""); },
    onSuccess: result => {
      const historyFailed = result.chatHistoryPersisted === false;
      setDeliveryStatus(historyFailed ? "warning" : "sent");
      setReplyNotice(historyFailed
        ? "Meta รับคำสั่งแล้ว แต่บันทึกประวัติแชทไม่สำเร็จ · อย่าส่งซ้ำก่อนตรวจสอบ"
        : "ส่งข้อความสำเร็จแล้ว");
      if (result.message_id) {
        setOptimisticMessages(current => current.map(message => message.id === optimisticMessageIdRef.current ? { ...message, messageId: result.message_id } : message));
      }
      if (replyImages.length > 0) setProductFloatDismissed(true);
      setEmojiPickerOpen(false);
      setStickerId("");
      void Promise.all([messagesQuery.refetch(), threadsQuery.refetch()]);
    },
    onError: (error, variables) => {
      const failedId = optimisticMessageIdRef.current;
      const payload = variables as { text?: string; imageUrls?: string[] } | undefined;
      const sentText = String(payload?.text ?? "");
      const imageUrls = Array.isArray(payload?.imageUrls) ? payload.imageUrls.filter(Boolean) : [];
      if (failedId) {
        setOptimisticMessages(current => current.map(message => message.id === failedId ? { ...message, deliveryFailed: true } : message));
      }
      optimisticMessageIdRef.current = null;
      if (imageUrls.length) {
        setReplyImages(current => current.length ? current : imageUrls.map((url, index) => ({ url, sendUrl: url, name: `ภาพที่ส่งไม่ครบ-${index + 1}` })));
      }
      const raw = error.message || "ส่งข้อความไม่สำเร็จ";
      void Promise.all([messagesQuery.refetch(), threadsQuery.refetch()]);
      if (!metaTransientSendNotice(raw)) { setDeliveryStatus("failed"); setReplyNotice(imageUrls.length ? `ส่งภาพไม่ครบ · ${raw} · ภาพยังค้างไว้ ห้ามกดส่งซ้ำจนกว่าจะตรวจ Meta` : raw); return; }
      // Meta code -1 / subcode 2018012 = internal error ฝั่ง Meta · ตรวจก่อนแล้วค่อยเตือน
      setDeliveryStatus("sending");
      setReplyNotice("");
      window.setTimeout(() => {
        void verifySentMessage(sentText).then(delivered => {
          if (delivered) { setDeliveryStatus("sent"); return; }
          setDeliveryStatus("warning");
          setReplyNotice("ยังไม่ยืนยันการส่ง · ตรวจใน Business Suite");
          if (sentText) setReplyText(current => (current.trim() ? current : sentText));
        });
      }, 1_500);
    },
  });
  const generateSummary = trpc.orders.generateSummary.useMutation({ onSuccess: result => { setSummary(result); setSummaryText(""); setReplyText(result.copyText); } });
  const summaryTimingsQuery = trpc.orders.summaryTimings.useQuery({ limit: 8 }, { enabled: summaryOpen, refetchInterval: false });
  const metaErrorsQuery = trpc.chat.metaErrors.useQuery(undefined, { refetchInterval: 60_000 });
  const confirmationsQuery = trpc.orders.confirmations.useQuery(undefined, { refetchInterval: 30_000 });
  const confirmOrder = trpc.orders.confirmFromChat.useMutation({ onSuccess: () => confirmationsQuery.refetch() });
  const confirmedKeys = new Set((confirmationsQuery.data ?? []).map(row => `${row.pageId}:${row.threadId}`));
  const openOrderSummary = () => {
    if (!selected) return;
    const requestGeneration = ++orderDeckMessageRequestIdRef.current;
    const requestRoomKey = orderDeckRequestRoomKeyRef.current;
    const stageDeckMessage = (message: { id: string; text: string } | null) => {
      if (message) setSelectedOrderMessage({ ...message, threadKey: selected.key });
      else setSelectedOrderMessage(null);
      setOrderDeckMessageRequest({ id: ++orderDeckHandoffRequestIdRef.current, clearMessage: !message });
    };
    const cachedLatest = getImportableLatestCustomerMessage(messagesQuery.data ?? []);
    setSummary(null);
    setOrderDeckOpen(true);
    setSummaryOpen(false);
    setOrderDeckMessageRequest(null);
    stageDeckMessage(cachedLatest);
    setReplyNotice(cachedLatest
      ? "ใส่ข้อความที่โหลดอยู่เข้า Deck แล้ว · กำลังตรวจข้อความล่าสุดเบื้องหลัง"
      : "กำลังตรวจข้อความลูกค้าล่าสุดจากเซิร์ฟเวอร์…");
    void (async () => {
      try {
        const refreshed = await messagesQuery.refetch();
        if (!refreshed.isSuccess) throw refreshed.error ?? new Error("ไม่พบผลการดึงข้อความล่าสุด");
        if (requestGeneration !== orderDeckMessageRequestIdRef.current || orderDeckRequestRoomKeyRef.current !== requestRoomKey) return;
        const freshLatest = getImportableLatestCustomerMessage(refreshed.data ?? []);
        if (!freshLatest) {
          stageDeckMessage(null);
          setReplyNotice("เปิด Order Deck แล้ว · ยังไม่มีข้อความลูกค้าล่าสุดที่ใช้สรุปได้ แต่เลือกสินค้า/ภาพได้ทันที");
          return;
        }
        if (!cachedLatest || freshLatest.id !== cachedLatest.id || freshLatest.text !== cachedLatest.text) stageDeckMessage(freshLatest);
        setReplyNotice("ตรวจข้อความลูกค้าล่าสุดจากเซิร์ฟเวอร์แล้ว · ยังไม่ส่ง");
      } catch (error) {
        if (requestGeneration !== orderDeckMessageRequestIdRef.current || orderDeckRequestRoomKeyRef.current !== requestRoomKey) return;
        const refreshError = error instanceof Error ? error.message : String(error);
        setReplyNotice(cachedLatest
          ? "ใช้ข้อความที่โหลดไว้ในห้องแชทแล้ว · ตรวจข้อความใหม่จากเซิร์ฟเวอร์ไม่สำเร็จ"
          : `เปิด Deck แล้ว · ดึงข้อความล่าสุดไม่สำเร็จ: ${refreshError}`);
      }
    })();
  };
  const toggleOrderMessageSelection = (message: unknown) => {
    if (!isSelectableCustomerMessage(message) || !selected) return;
    const text = message.customer_message_text.trim();
    const id = String(message.id ?? message.messageId ?? `${message.occurredAt ?? ""}:${text}`);
    const isAlreadySelected = selectedOrderMessage?.id === id && selectedOrderMessage.threadKey === selected.key;
    if (isAlreadySelected) {
      setSelectedOrderMessage(null);
      setReplyNotice("ยกเลิกการเลือกข้อความสำหรับสรุปออเดอร์แล้ว");
      return;
    }
    setSelectedOrderMessage({ id, threadKey: selected.key, text });
    setReplyNotice("เลือกข้อความนี้ไว้แล้ว · เปิดสรุปออเดอร์แล้วกด “ดึงข้อมูลลูกค้า” เมื่อต้องการนำเข้า");
  };
  const selectedConfirmed = Boolean(selected && confirmedKeys.has(`${selectedPageId}:${selectedThreadId}`));
  const confirmSelectedOrder = () => { if (!selectedPageId || !selectedThreadId || selectedConfirmed) return; confirmOrder.mutate({ pageId: selectedPageId, threadId: selectedThreadId, customerName: selected?.customerName ?? undefined, customerId: selectedCustomerId || undefined, evidenceText: selected?.preview ?? undefined }); };

  useEffect(() => { if (!selectedKey && filteredThreads[0]) setSelectedKey(filteredThreads[0].key); }, [filteredThreads, selectedKey]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pageId = params.get("page_id");
    const threadId = params.get("thread_id");
    if (!pageId || !threadId) return;
    const target = threads.find(thread => thread.pageId === pageId && thread.threadId === threadId);
    if (target) {
      routeSelectionPendingRef.current = target.key;
      setSelectedPages([]);
      setSearch("");
      setStatusFilter("all");
      setSelectedKey(target.key);
      if (isMobile) setMobileOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [threads, isMobile]);
  useEffect(() => {
    if (routeSelectionPendingRef.current) {
      if (!filteredThreads.some(thread => thread.key === routeSelectionPendingRef.current)) return;
      routeSelectionPendingRef.current = null;
      return;
    }
    if (selectedKey && !filteredThreads.some(thread => thread.key === selectedKey)) setSelectedKey(filteredThreads[0]?.key ?? null);
  }, [filteredThreads, selectedKey]);
  useEffect(() => {
    const element = chatTimelineRef.current;
    if (!element) return;
    const latestMessage = messagesQuery.data?.[messagesQuery.data.length - 1];
    const latestMessageKey = latestMessage
      ? `${latestMessage.occurredAt ?? ""}|${latestMessage.messageId ?? latestMessage.id ?? ""}`
      : "";
    const latestMessageChanged = lastLatestMessageKeyRef.current !== latestMessageKey;
    lastLatestMessageKeyRef.current = latestMessageKey;
    const selectedChanged = lastSelectedKeyRef.current !== selectedKey;
    lastSelectedKeyRef.current = selectedKey;
    // ถ้ามีแถวเก่าถูกบันทึกเข้ามาทีหลัง แต่ newest ของห้องเดิมไม่เปลี่ยน
    // ให้เก็บไว้ใน timeline ตามเวลาเดิม โดยไม่แสดงเป็นข้อความใหม่/เลื่อนห้อง
    if (!selectedChanged && !latestMessageChanged) return;
    if (!selectedChanged && !nearBottomRef.current) {
      setShowNewMessages(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => element.scrollTo({ top: element.scrollHeight, behavior: "auto" }));
    setShowNewMessages(false);
    return () => window.cancelAnimationFrame(frame);
  }, [selectedKey, messagesQuery.data?.length]);

  const handleTimelineScroll = () => {
    const element = chatTimelineRef.current;
    if (!element) return;
    nearBottomRef.current = element.scrollHeight - element.clientHeight - element.scrollTop <= 100;
    if (nearBottomRef.current) setShowNewMessages(false);
  };

  const jumpToLatest = () => {
    const element = chatTimelineRef.current;
    if (!element) return;
    nearBottomRef.current = true;
    element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    setShowNewMessages(false);
  };

  const sendCurrentReply = () => {
    const text = replyText.trim();
    if (!selectedPageId || !selectedThreadId || (!text && replyImages.length === 0)) return;
    if (!selectedCustomerId) { setDeliveryStatus("failed"); setReplyNotice("ห้องนี้ยังไม่มี Customer PSID จึงยังส่งข้อความไม่ได้"); return; }
    const optimisticId = `optimistic-${Date.now()}`;
    optimisticMessageIdRef.current = optimisticId;
    setOptimisticMessages(current => [...current, { id: optimisticId, text: text || "ส่งรูปภาพ", message_text: text, direction: "outbound", senderType: "page", side: "right", occurredAt: new Date().toISOString(), attachmentsJson: replyImages.length ? JSON.stringify(replyImages.map(image => ({ url: image.url }))) : "[]" }]);
    sendReply.mutate({
      pageId: selectedPageId,
      pageName: selected?.pageName ?? undefined,
      portalKey: selected?.portalKey ?? undefined,
      chatLinkKey: selected?.chatLinkKey ?? undefined,
      threadId: selectedThreadId,
      recipientId: selectedCustomerId,
      text: text || undefined,
      imageUrls: replyImages.map(image => image.sendUrl || image.url),
    });
    setReplyText("");
    setReplyImages([]);
    setReplyNotice("");
  };
  const handleImageUpload = async (input?: File | File[]) => {
    const files = (Array.isArray(input) ? input : input ? [input] : []).slice(0, 4 - replyImages.length);
    if (!files.length) { setReplyNotice("แนบภาพได้สูงสุด 4 ภาพต่อข้อความ"); return; }
    const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
    const vaultClient = getSupabase("vault");
    if (!vaultClient) { setReplyNotice("อัปโหลดภาพไม่สำเร็จ: ยังไม่ได้ตั้งค่า VAULT server credentials บน deployment"); return; }
    setImageUploading(true);
    setReplyNotice(`กำลังอัปโหลด ${files.length} ภาพเข้า ROOM 04 · PRIVATE VAULT…`);
    const uploaded: Array<{ url: string; sendUrl: string; name: string }> = [];
    try {
      for (const file of files) {
        const extension = file.type.split("/")[1] || "png";
        const namedFile = file.name ? file : new File([file], `pasted-image-${Date.now()}-${uploaded.length + 1}.${extension}`, { type: file.type });
        const normalizedFile = await normalizeChatImageForMeta(namedFile);
        if (!supportedTypes.includes(normalizedFile.type as typeof supportedTypes[number]) || normalizedFile.size > 6_000_000) {
          setReplyNotice("รองรับ JPG, PNG, GIF หรือ WebP ขนาดไม่เกิน 6 MB ต่อภาพ");
          continue;
        }
        const result = await uploadChatImageToVault(vaultClient, normalizedFile);
        uploaded.push({ url: result.url, sendUrl: result.url, name: normalizedFile.name });
      }
      setReplyImages(current => [...current, ...uploaded].slice(0, 4));
      if (uploaded.length) setReplyNotice(`${uploaded.length} ภาพพร้อมส่ง · สูงสุด 4 ภาพต่อข้อความ`);
    } catch (error) {
      setReplyNotice(`อัปโหลดภาพไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setImageUploading(false);
    }
  };
  const handleDeckProductSelected = ({ product, textVariants, productInfo }: { product: string; textVariants: string[]; productInfo: Record<string, unknown>; imageUrls: string[] }) => {
    const blocks = Array.isArray(productInfo.blocks)
      ? productInfo.blocks.map(block => {
        if (!block || typeof block !== "object") return "";
        const item = block as { title?: unknown; content?: unknown };
        return [item.title, item.content].filter(value => typeof value === "string" && value.trim()).join("\n");
      }).filter(Boolean)
      : [];
    const detail = [
      textVariants[0] || "",
      !textVariants.length && typeof productInfo.description === "string" ? productInfo.description : "",
      !textVariants.length && blocks.length ? blocks.join("\n\n") : "",
      !textVariants.length && typeof productInfo.price === "string" ? `ราคา: ${productInfo.price}` : "",
      !textVariants.length && !blocks.length && !String(productInfo.description ?? "").trim() && !String(productInfo.price ?? "").trim() ? product : "",
    ].filter(Boolean).join("\n").trim();
    setReplyText(current => current.trim() ? `${current.trim()}\n${detail}`.trim() : detail);
    setComposerOpen(true);
    setProductImagesRequest(null);
    setReplyNotice(`เตรียมสินค้า ${product} ลงช่องรอส่งแล้ว · ${textVariants.length ? "เลือกข้อความแรกเป็นร่าง" : "ไม่มีรูปก็ใช้ข้อมูลสินค้าได้"}`);
  };
  const handleDeckProductImagesSelected = async (imageUrls: string[], productName?: string) => {
    if (sendReply.isPending || imageUploading) {
      setReplyNotice("รอให้การส่งหรืออัปโหลดภาพปัจจุบันเสร็จก่อน");
      return;
    }
    const remaining = Math.max(0, 4 - replyImages.length);
    if (!remaining) { setReplyNotice("แนบภาพได้สูงสุด 4 ภาพต่อข้อความ · เอาภาพเดิมออกก่อนเพิ่มสินค้า"); return; }
    const existing = new Set(replyImages.map(image => image.sendUrl || image.url));
    const productLabel = productName?.trim() || "สินค้า";
    if (replyImages.some(image => image.name.startsWith(`${productLabel}-`))) { setReplyNotice(`ภาพ ${productLabel} อยู่ในช่องรอส่งแล้ว`); return; }
    const unique = imageUrls.filter((url, index) => typeof url === "string" && !existing.has(url) && imageUrls.indexOf(url) === index);
    const chosen = unique.slice(0, remaining);
    if (!chosen.length) { setReplyNotice("ภาพสินค้านี้อยู่ในช่องรอส่งแล้ว"); return; }

    const pending: Array<{ url: string; sendUrl: string; name: string }> = [];
    const files: File[] = [];
    const invalidCount = chosen.filter(url => !/^https?:\/\//i.test(url) && !/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(url)).length;
    chosen.forEach((url, index) => {
      if (/^https?:\/\//i.test(url)) {
        pending.push({ url, sendUrl: url, name: `${productLabel}-${index + 1}` });
        return;
      }
      const match = url.match(/^data:(image\/(?:png|jpeg|gif|webp));base64,([\s\S]+)$/i);
      if (!match) return;
      try {
        const binary = window.atob(match[2]);
        const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
        const mime = match[1].toLowerCase();
        const extension = mime === "image/jpeg" ? "jpg" : mime.slice("image/".length);
        files.push(new File([bytes], `${productLabel}-${index + 1}.${extension}`, { type: mime }));
      } catch { /* Ignore malformed data URLs and report them below. */ }
    });

    const failures: string[] = [];
    if (files.length) {
      const vaultClient = getSupabase("vault");
      if (!vaultClient) failures.push("ไม่พบ ROOM 04 · PRIVATE VAULT สำหรับเตรียมภาพจาก Deck");
      else {
        setImageUploading(true);
        setReplyNotice(`กำลังเตรียมภาพ ${productLabel}…`);
        for (const file of files) {
          if (file.size > 6_000_000) { failures.push(`${file.name} เกิน 6 MB`); continue; }
          try {
            const uploaded = await uploadChatImageToVault(vaultClient, file);
            pending.push({ url: uploaded.url, sendUrl: uploaded.url, name: file.name });
          } catch (error) {
            failures.push(error instanceof Error ? error.message : "อัปโหลดภาพไม่สำเร็จ");
          }
        }
        setImageUploading(false);
      }
    }

    if (pending.length) setReplyImages(current => [...current, ...pending].slice(0, 4));
    const limitNote = unique.length > remaining ? " · เพิ่มได้เท่าที่เหลือให้ครบ 4 ภาพ" : "";
    const failureNote = failures.length || invalidCount ? ` · บางภาพเพิ่มไม่ได้${failures.length ? `: ${failures[0]}` : ""}` : "";
    setReplyNotice(pending.length
      ? `เพิ่มภาพ ${productLabel} ${pending.length} ภาพลงช่องรอส่งแล้ว · ตรวจสอบก่อนกดส่ง${limitNote}${failureNote}`
      : `ยังเพิ่มภาพ ${productLabel} ไม่สำเร็จ${failureNote}`);
  };
  const handleComposerPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.items)
      .filter(item => item.kind === "file" && item.type.startsWith("image/"))
      .map(item => item.getAsFile())
      .filter((file): file is File => Boolean(file));
    if (!files.length) return;
    event.preventDefault();
    void handleImageUpload(files);
  };
  const addEmoji = (emoji: string) => setReplyText(current => `${current}${current ? " " : ""}${emoji}`);
  const productSuggestions = useMemo(() => {
    const normalize = (value: string) => value.normalize("NFC").toLocaleLowerCase("th-TH").replace(/[\u200B-\u200F\uFEFF]/g, "").replace(/[^\p{L}\p{N}]/gu, "");
    const whole = normalize(replyText);
    const lastToken = normalize(replyText.trim().split(/\s+/).at(-1) || "");
    if (!whole || (!lastToken && !whole)) return [];
    return deckImageProducts.map(entry => {
      const terms = [...new Set([entry.product, ...entry.terms].map(normalize).filter(term => term.length >= 2))];
      const score = terms.reduce((best, term) => Math.max(best, whole.includes(term) ? 100 + Math.min(term.length, 30) : lastToken.length >= 2 && term.includes(lastToken) ? 50 + Math.min(lastToken.length, 30) : 0), 0);
      return { ...entry, score };
    }).filter(entry => entry.score > 0 && entry.imageUrls.length > 0).sort((a, b) => b.score - a.score || a.product.localeCompare(b.product, "th")).slice(0, 4);
  }, [deckImageProducts, replyText]);
  const { settings: sharedProductHighlights, saveProductNames: saveSharedProductHighlights } = useChatProductHighlights();
  const featuredImageProducts = useMemo(() => selectFeaturedDeckImageProducts(applySharedDeckHighlights(deckImageProducts, sharedProductHighlights)), [deckImageProducts, sharedProductHighlights]);
  const requestDeckProductImages = (product: string, imageUrls: string[]) => {
    if (!imageUrls.length) { setReplyNotice(`ยังไม่มีภาพของ ${product} ในคลังรูปสินค้า`); return; }
    void handleDeckProductImagesSelected(imageUrls, product);
  };
  const requestProductImagesFromDeck = (product: string) => {
    productImagesRequestId.current += 1;
    setProductImagesRequest({ id: productImagesRequestId.current, product });
  };
  const copySummary = async () => {
    if (!replyText.trim()) return;
    await navigator.clipboard.writeText(replyText);
    setCopied(true);
  window.setTimeout(() => setCopied(false), 1600);
};
  const visibleTimeline = (selected?.chatTimeline ?? []).filter((line: string) => stripSpeakerPrefix(line).trim() && (messageFilter === "all" || (messageFilter === "page" ? isPageTimelineLine(line) : isCustomerTimelineLine(line))));
  const visibleStoredMessages = [...(messagesQuery.data ?? []), ...optimisticMessages].filter(message => {
    if (!message || typeof message !== "object") return false;
    const hasContent = String(message.text ?? "").trim().length > 0 || imageUrls(message.attachmentsJson).length > 0;
    const matchesFilter = messageFilter === "all" || (messageFilter === "page" ? message.direction === "outbound" : message.direction === "inbound");
    return hasContent && matchesFilter;
  });

  const composer = <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden border-t border-cyan-300/20 pt-2">
    <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={event => { handleImageUpload(Array.from(event.target.files ?? [])); event.currentTarget.value = ""; }} />
    {emojiPickerOpen ? <div role="group" aria-label="เลือกอีโมจิ" className="mb-2 flex flex-wrap gap-1 rounded-xl border border-cyan-300/15 bg-[#0a111b] p-2">{["😊", "😂", "😍", "🥰", "👍", "🙏", "❤️", "🎉", "📦", "✨"].map(emoji => <button key={emoji} type="button" onClick={() => { addEmoji(emoji); setEmojiPickerOpen(false); }} className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-cyan-300/10" aria-label={`เพิ่มอีโมจิ ${emoji}`}>{emoji}</button>)}</div> : null}
    {productSuggestions.length ? <div role="list" aria-label="ปุ่มส่งรูปสินค้าที่ตรงกับข้อความ" className="mb-1 flex max-w-full flex-wrap justify-start gap-1.5">{productSuggestions.map(item => <button key={item.product} type="button" role="listitem" onClick={() => requestDeckProductImages(item.product, item.imageUrls)} disabled={imageUploading || sendReply.isPending || replyImages.length >= 4} className="flex max-w-[220px] items-center gap-2 rounded-xl border border-cyan-300/25 bg-[#0b1924]/95 px-2.5 py-1.5 text-left shadow-[0_0_16px_rgba(34,211,238,.12)] transition hover:border-cyan-200/60 hover:bg-cyan-300/10 disabled:opacity-40" title={`เพิ่มภาพ ${item.product} ลงช่องรอส่ง`}>{item.imageUrls[0] ? <img src={item.imageUrls[0]} alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover" /> : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-300/[0.07] text-[10px] text-emerald-200">IMG</span>}<span className="min-w-0"><span className="block truncate text-[11px] font-semibold text-cyan-50">{item.product}</span><span className="block text-[9px] text-cyan-100/55">แตะเพื่อเตรียมรูป · ยังไม่ส่ง</span></span></button>)}</div> : null}
    <div className="flex min-w-0 items-end gap-1.5 rounded-xl border border-cyan-300/20 bg-[#0a111b] p-1.5 sm:gap-2 sm:p-2">
      <Button type="button" aria-label="แนบรูปภาพ" title={imageUploading ? "กำลังอัปโหลด…" : "แนบรูปภาพ"} variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={imageUploading || sendReply.isPending || replyImages.length >= 4} className="h-10 w-10 shrink-0 rounded-lg p-0 text-cyan-100/75 hover:bg-cyan-300/10 hover:text-cyan-100"><Paperclip className="h-5 w-5" /></Button>
      <Textarea ref={replyTextareaRef} value={replyText} onChange={event => setReplyText(event.target.value)} placeholder={selectedCustomerId ? "พิมพ์ข้อความ…" : "ไม่พบ Customer PSID ของห้องนี้"} disabled={!selectedCustomerId} className="field-sizing-fixed h-20 max-h-[136px] min-h-20 min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-2 py-2 text-sm leading-6 text-white placeholder:text-cyan-100/35 focus-visible:ring-0 focus-visible:ring-offset-0" onPaste={handleComposerPaste} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) { event.preventDefault(); sendCurrentReply(); } }} />
      <Button type="button" aria-label="เลือกอีโมจิ" title="เลือกอีโมจิ" variant="ghost" aria-expanded={emojiPickerOpen} onClick={() => setEmojiPickerOpen(value => !value)} className="h-10 w-10 shrink-0 rounded-lg p-0 text-cyan-100/75 hover:bg-cyan-300/10 hover:text-cyan-100"><Smile className="h-5 w-5" /></Button>
      <Button aria-label="ส่งข้อความ" title="ส่งข้อความ" disabled={sendReply.isPending || imageUploading || !selectedCustomerId || (!replyText.trim() && replyImages.length === 0)} onClick={sendCurrentReply} className="h-10 min-w-10 shrink-0 rounded-lg bg-gradient-to-br from-cyan-300 to-violet-400 px-3 text-[#07101a] shadow-[0_0_14px_rgba(34,211,238,.22)] transition hover:brightness-110">{sendReply.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
    </div>
  </div>;

  const conversation = selected ? <div className="chat-cosmos-conversation relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-cyan-300/15 bg-gradient-to-r from-cyan-400/[0.035] via-transparent to-fuchsia-500/[0.06] px-4 py-3 sm:px-5"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/20 via-violet-500/20 to-fuchsia-500/25 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,.12)]"><CircleUserRound className="h-5 w-5" /></div><div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-1.5"><span className={`chat-room-code-label ${isOrderRoom(selected) ? "cod-room-header" : ""} ${hasTimeSlotLabel(selected) ? "time-slot-room-sign" : ""} rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-semibold`} title={selected.timeSlotLabel || undefined}>ROOM · {selected.pageId ? selected.pageId.slice(-4) : "ST"}{isOrderRoom(selected) ? " ⚡" : ""}{hasTimeSlotLabel(selected) ? " 🔥" : ""}</span></div><h2 className="chat-customer-name-label truncate text-sm font-semibold">{selected.customerName || ""}</h2><div className="mt-1 flex items-center gap-2 text-xs text-cyan-100/55"><span className="truncate">{selected.pageName}</span><span>·</span><span>{timeLabel(selected.latestAt)}</span></div></div></div><div className="flex max-w-full flex-wrap items-center justify-end gap-2"><Badge className="hidden border border-emerald-400/25 bg-emerald-400/10 text-emerald-300 sm:inline-flex">● ONLINE</Badge>{selectedMetaInboxUrl ? <a href={selectedMetaInboxUrl} target="_blank" rel="noopener noreferrer" title="เปิดบทสนทนานี้ใน Meta Business Suite" className="chat-tool-action chat-tool-action--primary inline-flex h-8 items-center gap-1.5 px-2.5"><ExternalLink className="h-3.5 w-3.5" />แชทจริง</a> : <span title="ห้องนี้ยังไม่มี page_id/thread_id ที่ใช้เปิด Meta ได้" className="inline-flex h-8 items-center rounded-lg border border-amber-300/20 bg-amber-300/[0.06] px-2 text-[10px] text-amber-200/60">ไม่มีลิงก์ Meta</span>}<div className="chat-conversation-actions"><Button size="sm" variant="outline" onClick={confirmSelectedOrder} disabled={selectedConfirmed || confirmOrder.isPending} className="chat-tool-action h-8 px-3">{selectedConfirmed ? <><CheckCircle2 className="mr-1 h-3.5 w-3.5" />ยืนยันแล้ว</> : confirmOrder.isPending ? "กำลังบันทึก…" : "ยืนยันเป็นออเดอร์"}</Button><Button size="sm" variant="outline" onClick={() => setOrderDetailOpen(true)} className="chat-tool-action h-8 px-3" title="ดูออเดอร์ที่เชื่อมกับห้องนี้">ออเดอร์ ({selected.orderCount ?? linkedOrders.length ?? 0})</Button><Button size="sm" onClick={openOrderSummary} className="chat-tool-action h-8 px-3">สรุปออเดอร์</Button></div>{isMobile ? <button onClick={() => setMobileOpen(false)} className="rounded-xl p-2 text-fuchsia-100/55 hover:bg-fuchsia-500/10 hover:text-white" aria-label="ปิดห้องแชท"><X className="h-5 w-5" /></button> : null}</div></div>
    <div ref={chatTimelineRef} onScroll={handleTimelineScroll} className="chat-cosmos-timeline relative min-h-0 flex-1 flex flex-col justify-start gap-3 overflow-y-auto overscroll-contain bg-[radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.12),transparent_28%),radial-gradient(circle_at_12%_74%,rgba(168,85,247,0.11),transparent_30%),linear-gradient(135deg,#080c15,#0d0914_56%,#090b12)] p-4 sm:p-5 [-webkit-overflow-scrolling:touch]">
      {showNewMessages ? <button type="button" onClick={jumpToLatest} className="sticky bottom-3 left-1/2 z-20 mx-auto -mb-10 rounded-full border border-fuchsia-300/30 bg-gradient-to-r from-fuchsia-600 via-violet-600 to-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-[0_0_24px_rgba(168,85,247,0.45)] transition hover:scale-105">ข้อความใหม่ · ลงล่างสุด</button> : null}
      {messagesQuery.isFetching ? <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/20 bg-[#15101d]/90 px-2.5 py-1 text-[10px] text-fuchsia-200"><LoaderCircle className="h-3 w-3 animate-spin" />กำลังอัปเดต</div> : null}
      {visibleStoredMessages.length === 0 ? <>{visibleTimeline.length ? visibleTimeline.map((line: string, index: number) => {
        const isPageMessage = isPageTimelineLine(line);
        const text = stripSpeakerPrefix(line);
        return <div key={`${line}-${index}`} className={`flex w-full shrink-0 flex-col ${isPageMessage ? "items-end" : "items-start"}`}>
          <div className={`chat-message-bubble ${isPageMessage ? "chat-message-bubble--page rounded-br-md" : "chat-message-bubble--customer rounded-bl-md"} min-w-0 max-w-[86%] break-words [overflow-wrap:anywhere] rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg`}>
            <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{text}</p>
          </div>
        </div>;
      }) : <div className="rounded-2xl border border-fuchsia-500/10 bg-black/20 p-4 text-sm leading-6 text-fuchsia-100/60"><p>{selected.preview}</p></div>}</> : null}
      {visibleStoredMessages.map((message, messageIndex) => {
        const isRight = ("side" in message && message.side === "right") || message.direction === "outbound" || message.senderType === "page";
        const isCustomerMessage = isSelectableCustomerMessage(message);
        const senderName = isRight ? (selected.pageName || "เพจ") : (selected.customerName || "");
        const text = stripSpeakerPrefix(String(message.text ?? message.message_text ?? "")).trim();
        const attachments = imageUrls(message.attachmentsJson);
        const isImagePlaceholder = /^(?:📷\s*)?ส่งรูปภาพ$/u.test(text);
        const mediaOnly = attachments.length > 0 && isImagePlaceholder;
        const messageId = String(message.id ?? message.messageId ?? `${message.occurredAt ?? ""}:${text}`);
        const isSelected = isCustomerMessage && !isRight && selectedOrderMessage?.threadKey === selected.key && selectedOrderMessage.id === messageId;
        return <div key={`${String(message.id)}:${messageIndex}`} className={`flex w-full shrink-0 flex-col ${isRight ? "items-end" : "items-start"}`}>
          <div className={`chat-message-bubble chat-bubble-frame ${isRight ? "chat-message-bubble--page rounded-br-md" : "chat-message-bubble--customer rounded-bl-md"} ${cyberFrameRooms[selected.key] || cyberFrame ? `cyber-frame-card cyber-frame-${cyberFrameRooms[selected.key] || cyberFrame}` : ""} min-w-0 max-w-[86%] shrink-0 break-words rounded-2xl ${mediaOnly ? "p-1.5" : "px-4 py-3"} text-sm leading-6 shadow-lg`}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-60">{senderName}</p>
            {(!attachments.length || !isImagePlaceholder) ? <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{displayMessageText(message)}</p> : null}
            {attachments.map(url => <button key={url} type="button" onClick={() => setLightboxUrl(url)} className="mt-1 block cursor-zoom-in text-left"><img src={url} alt="ไฟล์แนบจากแชท คลิกเพื่อขยาย" className="block max-h-[min(52vh,420px)] max-w-[min(72vw,360px)] rounded-lg object-contain transition hover:brightness-110" /></button>)}
            <p className="mt-1 text-[10px] opacity-50">{senderName} · {messageTimeLabel(message)}</p>
          </div>
          {isCustomerMessage && !isRight && text ? <button type="button" className={`mobile-inbox-message-select ${isSelected ? "is-selected" : ""}`} aria-pressed={isSelected} aria-label={isSelected ? "ยกเลิกเลือกข้อความนี้" : "เลือกข้อความนี้สำหรับสรุปออเดอร์"} title="เลือกได้ครั้งละหนึ่งข้อความ · การเลือกยังไม่ดึงข้อมูลเข้า Order Deck" onClick={() => toggleOrderMessageSelection(message)}>{isSelected ? <><Check className="h-3 w-3" /> เลือกแล้ว</> : <><Clipboard className="h-3 w-3" /> เลือกข้อความ</>}</button> : null}
        </div>;
      })}
    </div>
    {productFloatVisible && !productFloatDismissed && featuredImageProducts.length ? <aside aria-label="สินค้าไฮไลท์ที่ปักหมุดสำหรับแชท" className="chat-product-float absolute bottom-[112px] right-3 z-30 w-[min(300px,calc(100%-1.5rem))] motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in motion-safe:duration-500 sm:bottom-[126px] sm:right-5 sm:w-[min(320px,calc(100%-2.5rem))]"><div className="mx-auto max-w-4xl rounded-2xl border border-fuchsia-300/25 bg-[#100b18]/95 p-2.5 shadow-[0_0_28px_rgba(217,70,239,.18)] backdrop-blur-xl"><div className="mb-2 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><Sparkles className="h-3.5 w-3.5 shrink-0 text-fuchsia-300"/><span className="truncate text-[10px] font-semibold tracking-wide text-fuchsia-100">📌 สินค้าไฮไลท์</span><span className="hidden text-[9px] text-fuchsia-100/40 sm:inline">แตะแล้วรูปลงช่องรอส่ง</span></div><button type="button" onClick={() => setProductFloatDismissed(true)} aria-label="ซ่อนแถบรูปแนะนำ" className="rounded-md px-2 py-1 text-[10px] text-fuchsia-100/55 hover:bg-white/10 hover:text-white">ซ่อน ×</button></div><div className="flex max-h-[42vh] flex-col-reverse gap-2 overflow-y-auto pb-0.5">{featuredImageProducts.map(item => <button key={item.product} type="button" onClick={() => requestProductImagesFromDeck(item.product)} disabled={imageUploading || sendReply.isPending || replyImages.length >= 4} title={`เตรียมรูป ${item.product} · ยังไม่ส่ง`} className="group flex w-full shrink-0 items-center gap-2 rounded-xl border border-fuchsia-200/15 bg-black/25 p-1.5 text-left transition hover:-translate-y-0.5 hover:border-fuchsia-200/55 hover:shadow-[0_0_18px_rgba(217,70,239,.24)] disabled:opacity-40"><img src={item.imageUrls[0]} alt={item.product} loading="lazy" className="h-10 w-10 shrink-0 rounded-lg bg-black/30 object-cover"/><span className="min-w-0 flex-1 truncate px-1.5 py-1.5 text-[10px] font-medium text-fuchsia-50">{item.product}</span></button>)}</div></div></aside> : null}
    {productFloatVisible && !productFloatDismissed && !featuredImageProducts.length ? <aside aria-label="ตั้งค่าสินค้าไฮไลท์" className="chat-product-float absolute bottom-[112px] right-3 z-30 w-[min(300px,calc(100%-1.5rem))] motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:fade-in motion-safe:duration-500 sm:bottom-[126px] sm:right-5 sm:w-[min(320px,calc(100%-2.5rem))]"><div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-amber-300/25 bg-[#100b18]/95 p-3 shadow-[0_0_28px_rgba(217,170,70,.14)] backdrop-blur-xl"><div className="min-w-0"><p className="text-[11px] font-semibold text-amber-100">ยังไม่มีสินค้าที่ไฮไลท์ไว้ในชุด Deck</p><p className="mt-1 text-[9px] text-fuchsia-100/55">เปิด “ไฮไลท์สินค้า” แล้วติ๊กสินค้าที่ต้องการ · ชุดไหนก็ใช้ได้</p></div><div className="flex shrink-0 items-center gap-2"><button type="button" onClick={openOrderSummary} className="rounded-lg border border-amber-200/25 bg-amber-300/10 px-3 py-2 text-[10px] font-semibold text-amber-100 hover:bg-amber-300/20">ตั้งไฮไลท์สินค้า</button><button type="button" onClick={() => setProductFloatDismissed(true)} aria-label="ซ่อนแถบตั้งค่าสินค้าแนะนำ" className="rounded-md px-2 py-1 text-[10px] text-fuchsia-100/55 hover:bg-white/10 hover:text-white">ซ่อน ×</button></div></div></aside> : null}
    <div className={`chat-cosmos-composer mt-auto flex shrink-0 flex-col overflow-hidden border-t border-cyan-300/20 bg-gradient-to-b from-[#111326] to-[#090c14] p-3 shadow-[0_-8px_28px_rgba(34,211,238,.05)] sm:p-4 transition-[height] duration-300 ${composerOpen ? "chat-cosmos-composer--open" : "h-12 min-h-12"}`}><div className="mb-2 flex shrink-0 items-center justify-between gap-2 border-b border-fuchsia-500/10 pb-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5" aria-live="polite">
        {imageUploading ? <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[10px] text-cyan-200"><LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin" />กำลังอัปโหลดภาพ…</span> : replyImages.length ? <div className="flex min-w-0 max-w-[48vw] items-center gap-1.5 overflow-x-auto sm:max-w-[360px]">{replyImages.map((image, index) => <div key={image.url} className="relative shrink-0"><img src={image.url} alt={`ภาพแนบ ${index + 1}`} className="h-9 w-9 rounded-md border border-cyan-300/25 object-cover" /><button type="button" aria-label={`เอาภาพที่ ${index + 1} ออก`} onClick={() => setReplyImages(current => current.filter((_, imageIndex) => imageIndex !== index))} className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1 text-[9px] leading-4 text-white">×</button></div>)}<span className="text-[9px] text-emerald-300">{replyImages.length}/4</span></div> : <span className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-fuchsia-100/45">กล่องตอบแชท</span>}
        {replyNotice && ((!replyImages.length && !imageUploading) || deliveryStatus === "failed") ? <span className={`min-w-0 truncate text-[10px] ${deliveryStatus === "sent" ? "text-emerald-300" : deliveryStatus === "warning" ? "text-amber-300" : deliveryStatus === "failed" ? "text-rose-300" : "text-cyan-200"}`}>{replyNotice}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {([ ["all", "ทั้งหมด", MessagesSquare], ["customer", "ลูกค้า", UserRound], ["page", "เพจ", Megaphone] ] as const).map(([value, label, Icon]) => <button key={value} type="button" title={label} aria-label={`กรองข้อความ: ${label}`} aria-pressed={messageFilter === value} onClick={() => setMessageFilter(value)} className={`chat-tool-action chat-tool-action--icon ${messageFilter === value ? "chat-tool-action--active" : ""}`}><Icon className="h-4 w-4" /></button>)}
        <button type="button" onClick={() => setToolsOpen(value => !value)} title={toolsOpen ? "ปิดแผงเครื่องมือ" : "เปิดแผงเครื่องมือ"} aria-label={toolsOpen ? "ปิดแผงเครื่องมือ" : "เปิดแผงเครื่องมือ"} aria-pressed={toolsOpen} className={`chat-tool-action chat-tool-action--icon ${toolsOpen ? "chat-tool-action--active" : ""}`}><Wrench className="h-4 w-4" /></button>
        <button type="button" onClick={() => setComposerOpen(value => !value)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/[0.06] text-fuchsia-200 transition hover:bg-fuchsia-400/15" title={composerOpen ? "หุบกล่องตอบแชท" : "เปิดกล่องตอบแชท"} aria-label={composerOpen ? "หุบกล่องตอบแชท" : "เปิดกล่องตอบแชท"}><ChevronDown className={`h-4 w-4 transition-transform ${composerOpen ? "rotate-0" : "rotate-180"}`} /></button>
      </div>
    </div><div className={`min-h-0 flex flex-1 flex-col overflow-y-auto overscroll-contain ${composerOpen ? "" : "pointer-events-none opacity-0"}`}>{summary ? <div className="mb-3 hidden shrink-0 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/[0.06] p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold text-fuchsia-200">พรีวิวใบสรุป · {summary.orderNumber}</p><button onClick={() => setSummary(null)} className="text-[10px] text-fuchsia-100/40 hover:text-white">ล้าง</button></div><p className="mt-1 text-[11px] text-fuchsia-100/45">ตรวจข้อความด้านล่างให้ถูกต้องก่อนกดส่งให้ลูกค้า</p><Button variant="outline" size="sm" onClick={copySummary} className="mt-2 h-7 border-fuchsia-400/20 bg-transparent text-[10px] text-fuchsia-200">{copied ? <Check className="mr-1 h-3 w-3" /> : <Clipboard className="mr-1 h-3 w-3" />}{copied ? "คัดลอกแล้ว" : "คัดลอกข้อความสรุป"}</Button></div> : null}{composer}</div></div>
  </div> : <div className="flex min-h-[560px] items-center justify-center text-sm text-fuchsia-100/35">เลือกห้องแชทเพื่อเริ่มดูข้อความ</div>;

  return <div className={`chat-cosmos-shell cosmic-stage h-full min-h-0 overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(34,211,238,0.11),transparent_38%),radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.10),transparent_40%),#070912] text-white ${isMobile ? "chat-hub-mobile" : ""}`}><div className={`chat-hub-content mx-auto flex h-full min-h-0 max-w-[1600px] flex-col gap-3 overflow-hidden p-2 sm:p-4 lg:p-6 ${orderDeckOpen ? "chat-hub-content--deck-open" : ""}`}>
    <div className="chat-live-strip flex shrink-0 items-center gap-2 rounded-xl border border-cyan-300/15 bg-[#0c1320]/80 px-3 py-2 text-xs text-cyan-100/70 shadow-[inset_0_0_16px_rgba(34,211,238,.04)] backdrop-blur-lg"><span className="inline-flex items-center gap-1.5 text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />SIGNAL LIVE</span><span className="text-fuchsia-100/20">·</span><span>รอบล่าสุด: {threadsQuery.dataUpdatedAt ? new Date(threadsQuery.dataUpdatedAt).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "กำลังโหลด"}</span></div>
    {!hasServerChatConfig ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/25 bg-amber-300/[0.06] px-4 py-3 text-xs text-amber-100"><span>ยังไม่ได้ตั้งค่า CHAT server · ระบบจะยังไม่เรียกฐานข้อมูลแชท</span><Button size="sm" variant="outline" onClick={() => setLocation("/secret-gallery")} className="border-amber-200/25 bg-transparent text-amber-100">ตั้งค่า ROOM 02</Button></div> : null}
    {threadsQuery.isError ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-xs text-red-200"><span>โหลดห้องแชทไม่สำเร็จ: {threadsQuery.error.message}</span><Button size="sm" variant="outline" onClick={() => threadsQuery.refetch()} className="border-red-300/20 bg-transparent text-red-100">ลองใหม่</Button></div> : null}
    {threads.find(thread => thread.orderCountError)?.orderCountError ? <div role="alert" className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.06] px-4 py-3 text-xs leading-5 text-cyan-200">โหลดแชทได้ แต่การเชื่อมแถวออเดอร์มีปัญหา: {String(threads.find(thread => thread.orderCountError)?.orderCountError)}</div> : null}
    <header className="neon-sign relative shrink-0 overflow-hidden rounded-2xl border border-cyan-300/35 bg-gradient-to-r from-[#0c1421] via-[#151020] to-[#170d1d] px-4 py-3 shadow-[0_0_14px_rgba(34,211,238,.24),0_0_32px_rgba(168,85,247,.20),inset_0_0_20px_rgba(217,70,239,.10)] backdrop-blur-xl"><div className="hero-orbit pointer-events-none opacity-60" aria-hidden="true" /><div className="relative z-10 flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-300">COSMIC · CHAT CONTROL</p><button type="button" onClick={() => { void Promise.all([threadsQuery.refetch(), pageCatalogQuery.refetch(), messagesQuery.refetch()]); }} className="mt-1 text-left text-xl font-semibold tracking-tight text-white drop-shadow-[0_0_8px_rgba(244,114,182,.95)] hover:text-cyan-200">กล่องข้อความ{threadsQuery.isFetching ? <RefreshCw className="ml-2 inline h-4 w-4 animate-spin" /> : null}</button></div><span className="hidden text-[10px] text-fuchsia-100/35 sm:inline">กดชื่อเพื่อรีเฟรชข้อมูล</span></div></header>
    <div className="relative flex min-h-0 flex-1 flex-nowrap gap-3 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] xl:gap-4 xl:overflow-hidden"><Card className="flex w-[min(290px,84vw)] min-h-0 shrink-0 flex-col overflow-hidden rounded-3xl border-cyan-300/20 bg-[#0b111c]/95 shadow-[0_8px_32px_rgba(34,211,238,.08),0_0_24px_rgba(168,85,247,.06)] backdrop-blur-xl"><CardHeader className="border-b border-fuchsia-500/10 pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base">ห้องแชท <span className="ml-1 text-xs font-normal text-fuchsia-100/35">{filteredThreads.length}</span></CardTitle><button onClick={() => setPageFilterOpen(value => !value)} className={`chat-tool-action chat-tool-action--filter ${selectedPages.length ? "chat-tool-action--active" : ""}`}><span className="h-2 w-2 rounded-sm border border-current" />เพจ{selectedPages.length ? ` · ${selectedPages.length}` : ""}<ChevronDown className="h-3 w-3" /></button></div>
      <div className="relative mt-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-fuchsia-100/30" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="ค้นหาชื่อลูกค้าหรือข้อความ…" className="rounded-xl border-fuchsia-500/15 bg-black/20 pl-9 text-white placeholder:text-fuchsia-100/25 focus-visible:ring-fuchsia-400" />{pageFilterOpen ? <div className="absolute right-0 top-12 z-20 w-64 rounded-2xl border border-fuchsia-400/20 bg-[#181020] p-3 shadow-2xl shadow-black/50"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">เลือกเพจ</p><button onClick={() => setSelectedPages([])} className="text-[10px] text-fuchsia-100/40 hover:text-white">ล้าง</button></div>{availablePages.map(([pageId, pageName, codToday, enabledWeb]) => { const active = selectedPages.includes(pageId); return <div key={pageId} className="rounded-xl border border-fuchsia-300/10 bg-black/15 p-1.5"><button type="button" onClick={() => setSelectedPages(current => active ? current.filter(item => item !== pageId) : [...current, pageId])} className={`page-holo-label group flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs transition ${codToday ? "page-holo-label--live" : ""} ${active ? "border-cyan-300/55 bg-cyan-300/15 text-cyan-50 shadow-[0_0_16px_rgba(34,211,238,.20)]" : "border-transparent text-fuchsia-50/70 hover:border-fuchsia-300/35 hover:bg-fuchsia-500/10"}`}><span className={`relative flex h-2.5 w-2.5 shrink-0 rounded-full ${codToday ? "bg-fuchsia-100 shadow-[0_0_12px_rgba(255,255,255,.95)]" : active ? "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.9)]" : "bg-fuchsia-200/25"}`} /><span className="min-w-0 flex-1 truncate">{pageName}</span><span className="font-mono text-[9px] text-fuchsia-100/35">ST.{pageId.slice(-4)}</span>{codToday ? <span className="cod-neon-sign" aria-label="มีออเดอร์วันนี้">วันนี้</span> : null}</button><button type="button" disabled={setPageWebStatus.isPending} onClick={() => setPageWebStatus.mutate({ pageId, enabled: !enabledWeb })} className={`mt-1 flex w-full items-center justify-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold ${enabledWeb ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : "border-red-300/25 bg-red-400/10 text-red-200"}`}><Power className="h-3 w-3" />เว็บ {enabledWeb ? "ON" : "OFF"}</button></div>; })}{!availablePages.length ? <p className="p-2 text-xs text-fuchsia-100/35">ยังไม่มีรายชื่อเพจ</p> : null}</div> : null}</div>
      <div className="mt-3 flex flex-wrap gap-1.5">{([ ["all", "ทั้งหมด"], ["ordered", "ออเดอร์"], ["tracking_over_24h", "เลขพัสดุ"] ] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`chat-tool-action chat-tool-action--filter ${statusFilter === value ? "chat-tool-action--active" : ""}`}>{label}</button>)}</div></CardHeader><CardContent className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 [-webkit-overflow-scrolling:touch]">{threadsQuery.isLoading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-fuchsia-100/40"><RefreshCw className="h-4 w-4 animate-spin" />กำลังโหลดห้อง…</div> : filteredThreads.length === 0 ? <div className="p-12 text-center text-sm text-fuchsia-100/40"><MessageCircle className="mx-auto mb-3 h-8 w-8 text-fuchsia-100/15" />ยังไม่มีห้องตามตัวกรอง</div> : filteredThreads.map((thread, index) => { const roomFrame = cyberFrameRooms[thread.key] || cyberFrame; const isSelectedRoom = selected?.key === thread.key; return <div key={thread.key} role="button" tabIndex={0} onClick={() => { setSelectedKey(thread.key); if (isMobile) setMobileOpen(true); }} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedKey(thread.key); if (isMobile) setMobileOpen(true); } }} className={`room-list-card ${isSelectedRoom ? "room-list-card--selected" : ""} relative mb-1 flex w-full items-start gap-3 rounded-2xl p-3.5 text-left transition ${isSelectedRoom ? "bg-gradient-to-r from-fuchsia-400/[0.13] via-violet-500/[0.08] to-pink-500/[0.10]" : "hover:bg-cyan-300/[0.06] hover:ring-1 hover:ring-cyan-300/15"}`}><span className="cyber-frame-avatar-wrap relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center"><span className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${index % 2 ? "bg-fuchsia-500/20 text-fuchsia-200" : "bg-fuchsia-500/20 text-fuchsia-200"}`}>{(thread.customerName || "").slice(0, 1)}</span></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="chat-customer-list-label truncate text-sm font-semibold">{thread.customerName || ""}</span><span className="shrink-0 text-xs text-cyan-100/55">{timeLabel(thread.latestAt)}</span></span><span className="room-card-meta mt-1 flex items-center gap-1.5 truncate text-xs text-fuchsia-100/75">{framePickerRoom === thread.key ? <select autoFocus aria-label={`เลือกกรอบของ ${thread.customerName || ""}`} value={roomFrame || ""} onClick={event => event.stopPropagation()} onChange={event => { setRoomFrame(thread.key, event.target.value); setFramePickerRoom(null); }} onBlur={() => setFramePickerRoom(null)} className="cyber-frame-inline-picker" title="เลือกกรอบการ์ดลูกค้า"><option value="">ปกติ</option>{CYBER_FRAME_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.id.toUpperCase()} · {option.name}</option>)}</select> : <button type="button" onClick={event => { event.stopPropagation(); setFramePickerRoom(thread.key); }} className={`chat-room-code-label cyber-frame-picker-trigger parcel-status-chip shrink-0 rounded border px-1.5 py-0.5 font-mono text-[9px] ${isOrderRoom(thread) ? "parcel-status-chip--order" : ""}`}  title="กดเพื่อเลือกกรอบลูกค้า · สถานะจากฝั่งเพจ">PARCEL·{thread.parcel_status_emoji || "—"}</button>}{thread.orderCount > 0 ? <span title="แถวออเดอร์ที่ผูกกับห้องได้" className="rounded bg-cyan-400/15 px-1 text-cyan-200">ORD {thread.orderCount}</span> : null}{confirmedKeys.has(`${thread.pageId}:${thread.threadId}`) ? <span className="room-card-signal rounded bg-fuchsia-400/15 px-1 text-cyan-200">ยืนยันแล้ว</span> : null}<span className="room-card-page truncate">◈ {thread.pageName || "ไม่ระบุเพจ"}</span></span><span className="room-card-preview mt-1 block truncate text-xs text-fuchsia-100/45">{thread.preview || "ยังไม่มีข้อความล่าสุด"}</span></span></div>})}</CardContent></Card>
      <Card className="hidden h-full min-h-0 min-w-[min(560px,85vw)] flex-1 overflow-hidden rounded-3xl border-violet-300/20 bg-[#0b101b]/95 shadow-[0_8px_36px_rgba(168,85,247,.10)] backdrop-blur-xl md:block">{conversation}</Card>
      <Card className={`chat-cosmos-tools chat-tools-panel relative flex min-h-0 w-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border backdrop-blur-xl transition-[width] duration-200 ${toolsOpen ? "" : "pointer-events-none"}`} style={{ width: toolsOpen ? "320px" : "0px" }}>
        <CardHeader className="shrink-0 border-b border-cyan-300/10 px-3 pb-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm text-cyan-100">เครื่องมือห้องนี้</CardTitle>
              <p className="mt-1 truncate text-[10px] text-cyan-100/45">{selected ? `${selected.customerName || ""} · ${selected.pageName || "ไม่ระบุเพจ"}` : "เลือกห้องแชทก่อน"}</p>
              {selected?.parcel_status_emoji ? <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-lime-300/45 bg-lime-300/[0.08] px-2.5 py-1.5 text-lime-100 shadow-[0_0_10px_rgba(132,204,22,.38),inset_0_0_12px_rgba(190,242,100,.08)]" title="สถานะพัสดุจากข้อมูลห้องแชต"><span className="animate-pulse text-base leading-none" aria-hidden="true">{selected.parcel_status_emoji}</span><span className="text-[10px] font-semibold tracking-wide">สถานะพัสดุ</span></div> : null}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {selectedMetaInboxUrl ? <a href={selectedMetaInboxUrl} target="_blank" rel="noopener noreferrer" title="เปิดห้องแชทจริงใน Meta Business Suite" aria-label="เปิดห้องแชทจริงใน Meta Business Suite" className="chat-tool-action chat-tool-action--primary h-8 px-2"><ExternalLink className="h-3 w-3" />แชทจริง</a> : null}
              <button type="button" onClick={() => setToolsOpen(false)} className="chat-tool-action chat-tool-action--icon" aria-label="หุบแผงเครื่องมือ"><X className="h-4 w-4" /></button>
            </div>
          </div>
          {[
            selected?.parcel_status_emoji,
            selected?.delivery_status,
          ].some(value => String(value ?? "").trim().length > 0) ? <div className="chat-send-status-row mt-2 justify-end">
            <SendStatusBadge label="Telegram" value={selected?.delivery_status} route="telegram" />
          </div> : null}
        </CardHeader>
        <CardContent className="min-h-0 space-y-3 overflow-y-auto p-3">
          {selected ? <>
            {availableToolValues.length ? <section className="space-y-1.5">
              <div className="flex items-center justify-between gap-2"><p className="chat-tools-section-title">ข้อมูลสำหรับคัดลอก</p><span className="text-[9px] text-cyan-100/35">แตะแถวเพื่อคัดลอก</span></div>
              <div className="space-y-1.5">{availableToolValues.map(item => <CopyValueCard key={item.key} label={item.label} value={item.value} copied={copiedToolField === item.key} onCopy={() => void copyToolValue(item.key, item.value)} />)}</div>
            </section> : null}
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2"><p className="chat-tools-section-title">ข้อความเลขพัสดุ</p><span className="chat-tools-section-tag">สำรอง</span></div>
              {selectedTrackingRows.length ? <>
                <div className="space-y-2">{selectedTrackingRows.map((row, index) => <div key={`${row.tracking_number}-${index}`} className="chat-tools-item">
                  <div className="flex items-center justify-between gap-2"><p className="truncate font-mono text-xs font-semibold text-cyan-50">{row.tracking_number || "รอเลขพัสดุ"}</p><span className="shrink-0 text-[9px] text-cyan-100/45">{row.shipping_carrier || "ขนส่งไม่ระบุ"}</span></div>
                  <p className="mt-1 truncate text-[9px] text-cyan-100/45">{row.order_number_display || row.order_number || "ไม่พบออเดอร์"}</p>
                  <p className="mt-1 truncate text-[9px] text-cyan-100/45">SOURCE LANE · {row.source_lane || "ไม่ระบุ"}</p>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <Button type="button" size="sm" onClick={() => setReplyText(String(row.facebook_tracking_message || ""))} disabled={!row.facebook_tracking_message} className="chat-tool-action h-8 w-full">Facebook</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setReplyText(String(row.drakside_tracking_message || ""))} disabled={!row.drakside_tracking_message} className="chat-tool-action h-8 w-full">Drakside</Button>
                  </div>
                </div>)}</div>
                <p className="text-[9px] leading-4 text-cyan-100/35">กดเพื่อใส่ในกล่องพิมพ์ · ยังไม่ส่ง</p>
              </> : <p className="chat-tools-empty">ไม่มีข้อความเลขพัสดุสำรองในห้องนี้</p>}
            </section>
            {!availableToolValues.length && !selectedTrackingRows.length ? <p className="chat-tools-empty">ห้องนี้ยังไม่มีข้อมูลสำรอง</p> : null}
          </> : <p className="chat-tools-empty">เลือกห้องแชทเพื่อใช้เครื่องมือ</p>}
        </CardContent>
      </Card>
    </div>
    {selected ? <aside aria-label="DRΛKSIDE Order Deck" aria-hidden={!orderDeckOpen} className={`order-deck-drawer fixed inset-y-0 right-0 z-[55] h-dvh w-[min(480px,30vw)] min-w-[360px] overflow-hidden border-l border-violet-300/25 bg-[#080b14]/[0.98] shadow-[-18px_0_48px_rgba(0,0,0,.48),-2px_0_24px_rgba(168,85,247,.12)] backdrop-blur-xl transition-transform duration-300 ease-out ${orderDeckOpen ? "translate-x-0" : "pointer-events-none translate-x-full"}`}>
      <OrderDeckFrame
        pageId={selectedPageId}
        pageName={selected.pageName ?? ""}
        threadId={selectedThreadId}
        customerName={selected.customerName ?? ""}
        customerPhone={String(selected.phone ?? selected.customerPhone ?? selected.extracted_phone ?? "")}
        selectedCustomerMessage={selectedOrderMessageText}
        messageMode="latest"
        messageRequest={orderDeckMessageRequest}
        onMessageRequestHandled={id => setOrderDeckMessageRequest(current => current?.id === id ? null : current)}
        onProductImagesSelected={handleDeckProductImagesSelected}
        onProductSelected={handleDeckProductSelected}
        onProductIndexReady={setDeckImageProducts} sharedHighlights={sharedProductHighlights} onFeaturedProductsChange={saveSharedProductHighlights}
        productImagesRequest={productImagesRequest}
        onSummaryReady={summary => { orderDeckMessageRequestIdRef.current += 1; setOrderDeckMessageRequest(null); setReplyText(summary); setOrderDeckOpen(false); setReplyNotice("สรุปบิลอยู่ในช่องตอบกลับแล้ว · ตรวจสอบก่อนกดส่ง"); }}
        onClose={() => { orderDeckMessageRequestIdRef.current += 1; setOrderDeckMessageRequest(null); setOrderDeckOpen(false); }}
      />
    </aside> : null}
    {isMobile ? <nav className="chat-mobile-bottom-nav" aria-label="เมนู Inbox มือถือ"><button type="button" className="is-active" aria-label="ข้อความ" onClick={() => setMobileOpen(false)}><MessagesSquare className="h-5 w-5" /><span>ข้อความ</span></button><button type="button" aria-label="ค้นหา" onClick={() => document.querySelector<HTMLInputElement>('.chat-hub-mobile input[placeholder*="ค้นหา"]')?.focus()}><Search className="h-5 w-5" /><span>ค้นหา</span></button><button type="button" aria-label="เมนู" onClick={() => setLocation("/secret-gallery")}><PanelLeft className="h-5 w-5" /><span>เมนู</span></button></nav> : null}
    {isMobile && mobileOpen ? <div className="chat-mobile-conversation-overlay fixed inset-0 z-50 flex items-end bg-[#03050b]/85 backdrop-blur-md"><div className="flex h-[100dvh] max-h-[100dvh] w-full min-h-0 flex-col overflow-hidden border-cyan-300/25 bg-[#0b101a]/95 shadow-[0_0_36px_rgba(34,211,238,.12),0_0_56px_rgba(168,85,247,.12)] backdrop-blur-xl">{conversation}</div></div> : null}
    {summaryOpen ? <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-2xl rounded-3xl border border-fuchsia-400/25 bg-[#15101d] p-5 shadow-2xl shadow-fuchsia-950/40"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-300">ADMIN ORDER SUMMARY</p><h3 className="mt-2 text-xl font-semibold text-white">สร้างใบสรุปออเดอร์ในห้องนี้</h3></div><button onClick={() => setSummaryOpen(false)} className="rounded-xl p-2 text-fuchsia-100/50 hover:bg-fuchsia-500/10 hover:text-white"><X className="h-5 w-5" /></button></div><Textarea autoFocus value={summaryText} onChange={event => setSummaryText(event.target.value)} placeholder="วางข้อความลูกค้าที่นี่…" className="mt-4 min-h-48 border-fuchsia-500/20 bg-black/25 text-sm leading-6 text-white placeholder:text-fuchsia-100/25" />{summary ? <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">PREVIEW · {summary.orderNumber}</p><span className="text-[10px] text-emerald-200/60">ยังไม่ส่ง</span></div><div className="mt-3 grid gap-2 text-sm sm:grid-cols-2"><div><span className="text-[10px] text-fuchsia-100/40">ชื่อลูกค้า</span><p className="text-white">{summary.customerName || ""}</p></div><div><span className="text-[10px] text-fuchsia-100/40">เบอร์โทร</span><p className="text-white">{summary.phone || "ไม่ระบุเบอร์โทร"}</p></div><div className="sm:col-span-2"><span className="text-[10px] text-fuchsia-100/40">ที่อยู่</span><p className="text-fuchsia-100/80">{summary.address || "ไม่ระบุที่อยู่"}</p></div><div><span className="text-[10px] text-fuchsia-100/40">สินค้า</span><p className="text-fuchsia-200">{summary.product}</p></div><div><span className="text-[10px] text-fuchsia-100/40">วันนี้</span><p className="text-cyan-200">{summary.cod === "ไม่ระบุ" ? summary.cod : `${summary.cod} บาท`}</p></div></div><div className="mt-3 border-t border-emerald-400/10 pt-3"><span className="text-[10px] text-fuchsia-100/40">ข้อความที่จะนำไปใส่ช่องตอบกลับ</span><pre className="mt-1 whitespace-pre-wrap text-xs leading-5 text-fuchsia-100/75">{summary.copyText}</pre></div>{summary.timingMs ? <p className="mt-3 border-t border-emerald-400/10 pt-2 text-[10px] text-emerald-200/55">วัดเวลา: รวม {summary.timingMs.total}ms · ดึงข้อมูล {summary.timingMs.dataLookup}ms · แปลงข้อความ {summary.timingMs.parse}ms · Audit {summary.timingMs.audit}ms</p> : null}</div> : null}<div className="mt-4 rounded-xl border border-fuchsia-400/10 bg-black/15 p-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-100/40">ประวัติ Timing ล่าสุด</p>{summaryTimingsQuery.isLoading ? <p className="mt-2 text-[10px] text-fuchsia-100/35">กำลังโหลด…</p> : <div className="mt-2 space-y-1">{summaryTimingsQuery.data?.slice(0, 5).map(row => { const timing = (row.metadata as { timingMs?: { total?: number; dataLookup?: number; parse?: number; audit?: number } }).timingMs; return <p key={row.id} className="text-[10px] text-fuchsia-100/50">{row.orderNumber ?? "draft"} · รวม {timing?.total ?? "—"}ms · data {timing?.dataLookup ?? "—"}ms · parse {timing?.parse ?? "—"}ms</p>; })}</div>}</div><div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setSummaryOpen(false)} className="border-fuchsia-400/20 bg-transparent text-fuchsia-100/70">ยกเลิก</Button><Button disabled={!summaryText.trim() || generateSummary.isPending} onClick={() => generateSummary.mutate({ rawText: summaryText, pageId: selectedPageId || undefined, threadId: selectedThreadId || undefined })} className="bg-gradient-to-r from-fuchsia-600 via-violet-600 to-emerald-500">{generateSummary.isPending ? "กำลังอ่าน…" : "สรุปออเดอร์"}</Button></div></div></div> : null}
    {orderDetailOpen ? <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-cyan-400/25 bg-[#15101d] p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">LINKED ORDERS</p><h3 className="mt-1 text-xl font-semibold text-white">ออเดอร์ของ {selected?.customerName || "ลูกค้ารายนี้"}</h3></div><button onClick={() => setOrderDetailOpen(false)} className="rounded-xl p-2 text-fuchsia-100/50 hover:bg-fuchsia-500/10 hover:text-white"><X className="h-5 w-5" /></button></div><p className="mt-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3 text-xs leading-5 text-cyan-100/75">ห้องนี้เชื่อมแถวออเดอร์ได้ {linkedOrders.length} ใบ · ป้ายออเดอร์วันนี้อ่านจากเวลาออเดอร์ในข้อมูลห้อง</p>{threadsQuery.isLoading ? <div className="mt-8 flex items-center justify-center gap-2 text-sm text-fuchsia-100/50"><LoaderCircle className="h-4 w-4 animate-spin text-cyan-300" />กำลังค้นหาออเดอร์…</div> : linkedOrders.length ? <div className="mt-4 space-y-3">{linkedOrders.map((order: any) => <div key={order.order_number} className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-cyan-100">{order.order_number}</p><span className="text-xs text-fuchsia-100/50">COD {order.cod_amount ?? order.expected_cod ?? "—"} บาท</span></div><p className="mt-2 text-sm text-fuchsia-100/75">{order.customer_name || ""} · {order.phone || "ไม่ระบุเบอร์"}</p><p className="mt-1 text-xs leading-5 text-fuchsia-100/50">{order.full_address || "ไม่ระบุที่อยู่"}</p><p className="mt-2 text-xs text-fuchsia-200/70">{order.lab_product_display_text || "ยังไม่มี master_display_for_packer ใน Lab 88"}</p></div>)}</div> : <p className="mt-5 rounded-2xl border border-fuchsia-500/10 bg-black/20 p-4 text-sm text-fuchsia-100/50">ยังไม่พบออเดอร์ที่เชื่อมกับห้องนี้</p>}{chatEvidenceQuery.isLoading ? <div className="mt-5 flex items-center gap-2 text-xs text-cyan-200/70"><LoaderCircle className="h-3.5 w-3.5 animate-spin" />กำลังโหลดหลักฐานแชท…</div> : <div className="mt-5 rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/[0.04] p-4"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">CHAT EVIDENCE</p><span className="text-[10px] text-cyan-100/50">{chatEvidenceQuery.data?.length ?? 0} รายการ</span></div><div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{chatEvidenceQuery.data?.length ? chatEvidenceQuery.data.map(row => <div key={String(row.id)} className="rounded-xl border border-fuchsia-400/10 bg-black/20 p-2.5"><div className="flex justify-between gap-2 text-[10px] text-cyan-100/45"><span>{row.speaker_type === "page" ? "[เพจ]" : "[ลูกค้า]"} {String(row.customer_name ?? row.sender_name ?? "ลูกค้า")}</span><span>{timeLabel(String(row.occurred_at ?? row.source_created_at ?? ""))}</span></div><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-fuchsia-50/80">{String(row.message_text ?? "[ข้อความไม่มีตัวอักษร / มีไฟล์แนบ]")}</p><p className="mt-1 truncate text-[9px] text-cyan-100/30">source: {String(row.source_message_id ?? row.dedupe_key ?? "—")}</p></div>) : <p className="text-xs text-cyan-100/45">ยังไม่มีหลักฐานจากตารางแชทลูกค้าหรือเพจสำหรับห้องนี้</p>}</div></div>}</div></div> : null}
    {lightboxUrl ? <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxUrl(null)}><img src={lightboxUrl} alt="รูปภาพขนาดเต็ม" className="max-h-[92vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl" /></div> : null}
    <footer className="flex items-center gap-2 px-2 text-[11px] text-fuchsia-100/30"><MessageCircle className="h-3.5 w-3.5" />n8n API → Supabase ทุก 1 นาที · ห้องแชทอ่านจากตารางกลาง · ทุกการตอบกลับบันทึก Audit Log</footer>
  </div></div>;
}
