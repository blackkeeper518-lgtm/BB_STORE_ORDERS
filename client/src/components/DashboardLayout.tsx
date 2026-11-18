import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, Archive, Bell, Boxes, CalendarDays, Database, ExternalLink, LayoutDashboard, LockKeyhole, MessageCircle, PanelLeft, Search, Send, Skull, Truck, WandSparkles } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { PRESENTATION_MODE } from "@shared/presentation";
import { getActiveCamp, getSupabaseConfig, readCanonicalOrders, type Camp } from "@/lib/canonical";
import { CHAT_BROWSER_CONFIG_EVENT, readBrowserChatConfig } from "@/lib/chat-config";
import { trpc } from "@/lib/trpc";
import { CHAT_NOTIFICATION_EVENT, countUnreadChatMessages, isChatNotificationSoundEnabled, markChatNotificationsRead, playChatNotificationSound, readChatNotificationState, reconcileChatNotificationRows, setChatNotificationSoundEnabled, unlockChatNotificationAudio, writeChatNotificationState, type ChatNotification } from "@/lib/chat-notifications";
import { THEME_LAB_EVENT, prepareThemeCss, readThemeLab, themeRoomFromPath } from "@/lib/theme-lab";

const menuItems = [
  { icon: MessageCircle, label: "รวมแชทเพจ", path: "/chats" },
  { icon: MessageCircle, label: "LINE OA · ห้องตอบแชท", path: "/line-chat" },
  { icon: LayoutDashboard, label: "Order Control", path: "/orders" },
  { icon: Truck, label: "แมปเลขพัสดุ", path: "/parcel-mapping" },
  { icon: ExternalLink, label: "BB TRACKING", path: "https://bbstorefullv-1.vercel.app/", external: true },
  { icon: Database, label: "คู่มือระบบ · System Manual", path: "/system-manual" },
  { icon: Send, label: "PIONEER · คิวพัก / ดักสองชั้น", path: "/telegram-delivery" },
  { icon: Bell, label: "ประวัติเปลี่ยนของ · PARADOX", path: "/alert-room" },
  { icon: Skull, label: "BLACKBOX · DEATH NOTE", path: "/blackbox" },
  { icon: Archive, label: "ประวัติปิดงาน · ยกเลิก/ไม่รับ", path: "/close-job-history" },
  { icon: Boxes, label: "คลังสินค้าจริง / สต๊อกกลาง", path: "/stock-room" },
  { icon: WandSparkles, label: "PRIVATE VAULT · ภาพ / สคริปต์", path: "/script-atelier" },
  { icon: CalendarDays, label: "สรุปออเดอร์รายวัน · Flash", path: "/daily-chat-summary" },
  { icon: Archive, label: "GENESIS · Log สุดท้าย", path: "/order-history" },
  { icon: Boxes, label: "แยก 1/2/3 คอต", path: "/order-buckets" },
  { icon: Activity, label: "ประสิทธิภาพดูดออเดอร์", path: "/order-performance" },
  { icon: Database, label: "คลังโปรเจกต์", path: "/" },
];
const SIDEBAR_WIDTH_KEY = "sidebar-width-compact-v2";
const DEFAULT_WIDTH = 190;
const MIN_WIDTH = 170;
const MAX_WIDTH = 480;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => { const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY); return saved ? parseInt(saved, 10) : DEFAULT_WIDTH; });
  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); }, [sidebarWidth]);
  return <SidebarProvider className="h-full min-h-0 w-full min-w-0 overflow-hidden bg-[#09070d] text-white" style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

type DashboardLayoutContentProps = { children: React.ReactNode; setSidebarWidth: (width: number) => void };
function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const [location, setLocation] = useLocation();
  const [themeLabCss, setThemeLabCss] = useState("");
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ key: string; title: string; detail: string; time: string | null; seen: boolean }>>([]);
  const [unreadThreads, setUnreadThreads] = useState<Array<{ key: string; latestAt: string | null; customerName: string | null }>>([]);
  const [browserChatConfig, setBrowserChatConfig] = useState(() => readBrowserChatConfig());
  const [chatNotificationState, setChatNotificationState] = useState(() => readChatNotificationState(browserChatConfig?.url));
  const chatNotifications = chatNotificationState.pending;
  const [soundEnabled, setSoundEnabled] = useState(() => isChatNotificationSoundEnabled());
  const [camp, setCamp] = useState<Camp>(getActiveCamp());
  const hasBrowserChatConfig = Boolean(browserChatConfig?.url && browserChatConfig.serviceRoleKey);
  const pollNotificationsMutation = trpc.chat.pollNotifications.useMutation();
  const pollNotifications = pollNotificationsMutation.mutateAsync;
  const chatUnreadCount = countUnreadChatMessages(chatNotificationState);
  const newNotificationCount = chatUnreadCount + unreadThreads.length;
  useEffect(() => {
    const applyThemeLab = () => {
      const settings = readThemeLab();
      const room = themeRoomFromPath(location);
      setThemeLabCss(room && settings.rooms.includes(room) ? prepareThemeCss(settings.css) : "");
    };
    applyThemeLab();
    window.addEventListener(THEME_LAB_EVENT, applyThemeLab);
    return () => window.removeEventListener(THEME_LAB_EVENT, applyThemeLab);
  }, [location]);
  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const result = await readCanonicalOrders("");
        const rows = (result.orders ?? []) as Array<Record<string, any>>;
        const storageKey = `drakside-last-order-${getActiveCamp()}`;
        const lastSeen = localStorage.getItem(storageKey) || "";
        const rowKeys = rows.map((row) => String(row.upsert_key || row.order_number || row.id || "")).filter(Boolean);
        const lastSeenIndex = lastSeen ? rowKeys.indexOf(lastSeen) : -1;
        const unseenKeys = new Set<string>(!lastSeen || lastSeenIndex < 0 ? [] : rowKeys.slice(0, lastSeenIndex));
        const next = rows.slice(0, 50).map((row) => {
          const key = String(row.upsert_key || row.order_number || row.id || "");
          const title = `ออเดอร์ใหม่ ${row.order_number || key}`;
          const detail = String(row.lab_product_display_text || "ยังไม่มี master_display_for_packer ใน Lab 88");
          return { key, title, detail, time: row.order_time || row.order_time_display || null, seen: !unseenKeys.has(key) };
        }).filter((item) => item.key);
        if (!cancelled) {
          setNotifications(next);
          setUnreadThreads(Array.from(unseenKeys).map((key) => {
            const row = rows.find((item) => String(item.upsert_key || item.order_number || item.id || "") === key);
            return { key, latestAt: row?.order_time || row?.order_time_display || null, customerName: `ออเดอร์ใหม่ ${row?.order_number || key}` };
          }));
          if (!lastSeen && rowKeys[0]) localStorage.setItem(storageKey, rowKeys[0]);
        }
      } catch { /* notification center must not block the app */ }
    };
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 60000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [camp]);
  useEffect(() => {
    const refreshConfig = () => setBrowserChatConfig(readBrowserChatConfig());
    window.addEventListener("storage", refreshConfig);
    window.addEventListener(CHAT_BROWSER_CONFIG_EVENT, refreshConfig);
    return () => {
      window.removeEventListener("storage", refreshConfig);
      window.removeEventListener(CHAT_BROWSER_CONFIG_EVENT, refreshConfig);
    };
  }, []);
  useEffect(() => {
    const sync = () => {
      setChatNotificationState(readChatNotificationState(browserChatConfig?.url));
      setSoundEnabled(isChatNotificationSoundEnabled());
    };
    sync();
    window.addEventListener(CHAT_NOTIFICATION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHAT_NOTIFICATION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [browserChatConfig?.url]);
  useEffect(() => {
    if (!hasBrowserChatConfig) return;
    let cancelled = false;
    let inFlight = false;
    const pollWithLock = async () => {
      if (cancelled) return;
      const current = readChatNotificationState(browserChatConfig?.url);
      const response = await pollNotifications({ afterRowId: current.cursorRowId });
      if (cancelled) return;
      const result = reconcileChatNotificationRows(current, response.rows, Date.now(), response.cursorRowId);
      writeChatNotificationState(result.state, browserChatConfig?.url);
      setChatNotificationState(result.state);
      if (!result.newMessageCount) return;
      playChatNotificationSound();
      if (document.visibilityState !== "hidden" || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const newest = result.changed[result.changed.length - 1];
      if (!newest) return;
      const systemNotification = new Notification(`ข้อความใหม่ ${result.newMessageCount} รายการ`, {
        body: `${newest.customerName} · ${newest.pageName}: ${newest.message}`,
        tag: `bb-chat:${newest.threadKey}`,
        icon: "/favicon.ico",
      });
      systemNotification.onclick = () => {
        systemNotification.close();
        window.focus();
        const next = markChatNotificationsRead(readChatNotificationState(browserChatConfig?.url), newest.threadKey);
        writeChatNotificationState(next, browserChatConfig?.url);
        setChatNotificationState(next);
        setNotificationsOpen(false);
        setLocation(`/chats?page_id=${encodeURIComponent(newest.pageId)}&thread_id=${encodeURIComponent(newest.threadId)}`);
      };
    };
    const poll = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        if (typeof navigator !== "undefined" && navigator.locks?.request) {
          await navigator.locks.request(`bb-chat-notification-poll:${browserChatConfig?.url ?? "default"}`, { ifAvailable: true }, async lock => {
            if (lock) await pollWithLock();
          });
        } else {
          await pollWithLock();
        }
      } catch {
        // A transient Chat/Supabase error must not block the dashboard; retry next interval.
      } finally {
        inFlight = false;
      }
    };
    void poll();
    const timer = window.setInterval(() => void poll(), 8_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [hasBrowserChatConfig, browserChatConfig?.url, pollNotifications, setLocation]);
  const toggleNotifications = () => {
    setNotificationsOpen(value => !value);
    void unlockChatNotificationAudio();
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  };
  const markAllNotificationsRead = () => {
    const next = markChatNotificationsRead(readChatNotificationState(browserChatConfig?.url));
    writeChatNotificationState(next, browserChatConfig?.url);
    setChatNotificationState(next);
    if (notifications[0]?.key) localStorage.setItem(`drakside-last-order-${getActiveCamp()}`, notifications[0].key);
    setUnreadThreads([]);
    setNotifications(items => items.map(item => ({ ...item, seen: true })));
    setNotificationsOpen(false);
  };
  const openChatNotification = (item: ChatNotification) => {
    const next = markChatNotificationsRead(readChatNotificationState(browserChatConfig?.url), item.threadKey);
    writeChatNotificationState(next, browserChatConfig?.url);
    setChatNotificationState(next);
    setNotificationsOpen(false);
    setLocation(`/chats?page_id=${encodeURIComponent(item.pageId)}&thread_id=${encodeURIComponent(item.threadId)}`);
  };
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setChatNotificationSoundEnabled(next);
    if (next) {
      void unlockChatNotificationAudio();
      playChatNotificationSound();
    }
  };
  const testSound = () => {
    if (!soundEnabled) {
      setSoundEnabled(true);
      setChatNotificationSoundEnabled(true);
    }
    void unlockChatNotificationAudio();
    playChatNotificationSound();
  };
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const [now, setNow] = useState(() => new Date());
  const thaiDateTime = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" }).format(now);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const handleCampChange = (event: Event) => setCamp((event as CustomEvent<Camp>).detail); window.addEventListener("camp-change", handleCampChange); return () => window.removeEventListener("camp-change", handleCampChange); }, []);
  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);
  useEffect(() => { const handleMouseMove = (event: MouseEvent) => { if (!isResizing) return; const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0; const newWidth = event.clientX - sidebarLeft; if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth); }; const handleMouseUp = () => setIsResizing(false); if (isResizing) { document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; } return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; }; }, [isResizing, setSidebarWidth]);
  const st = false; // Deployment นี้ใช้ BB เท่านั้น; ปิด theme/branch ของ ST เดิม
  return <div className="singto-cyber-edge"><>{themeLabCss ? <style id="nightops-theme-lab">{themeLabCss}</style> : null}<div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className={st ? "border-r border-orange-500/20 bg-[#100b08] text-orange-50 [&_[data-slot=sidebar-inner]]:bg-[#100b08] [&_[data-slot=sidebar-inner]]:text-orange-50" : "border-r border-orange-500/10 bg-[#0d0a12] text-orange-50 [&_[data-slot=sidebar-inner]]:bg-[#0d0a12] [&_[data-slot=sidebar-inner]]:text-orange-50"} disableTransition={isResizing}><SidebarHeader className="h-16 justify-center"><div className="flex w-full items-center gap-3 px-2"><button onClick={toggleSidebar} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${st ? "text-orange-200/70 hover:bg-orange-500/10 hover:text-orange-100" : "text-orange-200/60 hover:bg-orange-500/10 hover:text-orange-200"}`} aria-label="เปิดหรือปิดเมนู"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div className="flex min-w-0 items-center gap-2"><button type="button" onClick={() => setLocation("/secret-gallery")} className="group flex min-w-0 items-center gap-2" title="ห้องลับคลังโปรเจค"><span className={`truncate font-semibold tracking-tight ${st ? "text-orange-50 group-hover:text-orange-200" : "text-orange-50 group-hover:text-amber-200"}`}>{st ? "ST SINGTO STORE" : "BB STORE"}</span><LockKeyhole className={`h-3.5 w-3.5 ${st ? "text-orange-300/70 group-hover:text-orange-200" : "text-orange-300/60 group-hover:text-amber-300"}`} /></button></div>}</div></SidebarHeader><SidebarContent className="gap-0"><SidebarMenu className="px-2 py-1">{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={!item.external && location === item.path} onClick={() => item.external ? window.open(item.path, "_blank", "noopener,noreferrer") : setLocation(item.path)} tooltip={item.label} className={`h-8 text-xs font-normal ${st ? "text-orange-100/85 hover:bg-orange-500/10 hover:text-orange-50 data-[active=true]:bg-orange-500/15 data-[active=true]:text-orange-100" : "text-orange-100/80 hover:bg-orange-500/10 hover:text-orange-50 data-[active=true]:bg-orange-500/10 data-[active=true]:text-orange-100"}`}><item.icon className={`h-3.5 w-3.5 ${location === item.path ? (st ? "text-orange-300" : "text-orange-300") : ""}`} /><span>{item.label}</span>{item.path === "/chats" && chatUnreadCount > 0 ? <span className="ml-auto rounded-full bg-red-500/20 px-1.5 text-[10px] font-semibold text-red-300">{chatUnreadCount}</span> : null}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="mx-3 my-2 rounded-xl border border-red-400/15 bg-red-500/[0.04] p-2.5"><button type="button" onClick={toggleNotifications} className="flex w-full items-center gap-2 text-left text-xs text-red-200"><Bell className="h-3.5 w-3.5" /><span>{newNotificationCount ? `มีรายการใหม่ ${newNotificationCount}` : "การแจ้งเตือน"}</span></button></div></SidebarContent><SidebarFooter className="p-3"><div className="flex items-center gap-3 rounded-lg px-1 py-1"><Avatar className={`h-9 w-9 shrink-0 ${st ? "border border-orange-400/30 bg-orange-500/10" : "border border-orange-400/20 bg-orange-500/10"}`}><AvatarFallback className={`bg-transparent text-xs font-medium ${st ? "text-orange-200" : "text-amber-200"}`}>{st ? "ST" : "BB"}</AvatarFallback></Avatar><div className="min-w-0"><p className={`truncate text-sm font-medium leading-none ${st ? "text-orange-100" : "text-amber-100"}`}>{st ? "ST SINGTO STORE" : "BB STORE"} · {camp}</p><p className={`mt-1.5 truncate text-xs ${st ? "text-orange-100/35" : "text-orange-100/35"}`}>{getSupabaseConfig(camp) ? "Main เชื่อมแล้ว" : "Main ยังไม่ตั้งค่า"} · {getSupabaseConfig(camp, "tracking") ? "Tracking เชื่อมแล้ว" : "Tracking ยังไม่ตั้งค่า"}</p></div></div></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/20 ${isCollapsed ? "hidden" : ""}`} style={{ zIndex: 50 }} onMouseDown={() => !isCollapsed && setIsResizing(true)} /></div><SidebarInset className={`h-full min-h-0 min-w-0 overflow-hidden ${st ? "bg-[#090706]" : "bg-[#09070d]"}`}>{isMobile && <div className={`sticky top-0 z-40 flex h-14 items-center justify-between px-2 backdrop-blur ${st ? "border-b border-orange-500/20 bg-[#100b08]/95" : "border-b border-orange-500/10 bg-[#0d0a12]/95"}`}><div className="flex items-center gap-2"><SidebarTrigger className={`h-9 w-9 rounded-lg ${st ? "text-orange-100 hover:bg-orange-500/10" : "text-orange-100 hover:bg-orange-500/10"}`} /><span className={st ? "text-orange-50" : "text-orange-50"}>{activeMenuItem?.label ?? "เมนู"}</span></div><button type="button" onClick={toggleNotifications} aria-label="เปิดการแจ้งเตือน" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-orange-100 hover:bg-orange-500/10"><Bell className="h-5 w-5" />{newNotificationCount > 0 ? <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{newNotificationCount > 99 ? "99+" : newNotificationCount}</span> : null}</button></div>}<div className={`mx-4 mt-3 flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 text-[11px] ${st ? "border border-orange-500/20 bg-[#160e08] text-orange-100/75" : "border border-orange-500/20 bg-[#100c19] text-orange-100/75"}`}><span className={`font-medium ${st ? "text-orange-200" : "text-amber-200"}`}>{thaiDateTime}</span><span className={st ? "text-orange-100/35" : "text-orange-100/35"}>·</span><button type="button" onClick={toggleNotifications} className="inline-flex items-center gap-1.5 text-red-100 hover:text-white"><Bell className="h-3.5 w-3.5" />{newNotificationCount ? `มีรายการใหม่ ${newNotificationCount}` : "ไม่มีรายการใหม่"}</button><span className={st ? "text-orange-100/30" : "text-orange-100/30"}>·</span><span className={st ? "text-orange-300" : "text-amber-300"}>ฐานข้อมูล Deployment นี้</span><span className={st ? "text-orange-100/45" : "text-orange-100/45"}>ฐานข้อมูลของ Deployment นี้</span><span className={st ? "text-orange-100/45" : "text-orange-100/45"}>Live 60s</span><button type="button" onClick={() => setLocation("/orders?universal=1")} className="ml-auto inline-flex h-8 items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 text-[10px] font-semibold tracking-[.08em] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.08)] transition hover:border-cyan-200/70 hover:bg-cyan-400/20"><Search className="h-3.5 w-3.5" />UNIVERSAL SEARCH · ORDER CONTROL</button></div>{notificationsOpen && <div className="absolute right-4 top-16 z-50 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-orange-400/25 bg-[#120b16]/95 p-3 shadow-2xl backdrop-blur-xl"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><b className="text-sm text-orange-100">ศูนย์แจ้งเตือน · {st ? "ST SINGTO STORE" : "BB STORE"}</b><div className="flex items-center gap-2"><button type="button" onClick={toggleSound} className="text-[10px] text-orange-200/70 hover:text-orange-100">{soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}</button><button type="button" onClick={testSound} className="text-[10px] text-orange-200/70 hover:text-orange-100">ทดสอบเสียง</button><button type="button" onClick={markAllNotificationsRead} className="text-[10px] text-orange-200/60 hover:text-orange-100">อ่านแล้ว</button></div></div><div className="max-h-80 space-y-3 overflow-auto"><section><div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-semibold text-orange-100">ข้อความแชทใหม่ · {chatUnreadCount}</p>{typeof Notification !== "undefined" && Notification.permission !== "granted" ? <button type="button" onClick={() => void Notification.requestPermission()} className="text-[9px] text-orange-200/55 hover:text-orange-100">อนุญาต Browser</button> : null}</div>{!hasBrowserChatConfig ? <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-orange-100/55">ตั้งค่า Chat ใน ROOM 02 เพื่อรับการแจ้งเตือน</p> : chatNotifications.length ? <div className="space-y-2">{chatNotifications.map(item => <button type="button" key={item.threadKey} onClick={() => openChatNotification(item)} className="w-full rounded-xl border border-orange-300/30 bg-orange-400/[0.08] p-3 text-left"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-semibold text-orange-100">{item.customerName} · {item.pageName}</p><span className="rounded-full bg-red-500/20 px-1.5 text-[10px] font-semibold text-red-200">{item.count}</span></div><p className="mt-1 line-clamp-2 text-[11px] text-orange-100/65">{item.message}</p><p className="mt-1 text-[9px] text-orange-100/35">{item.messageAt || "ข้อความใหม่"}</p></button>)}</div> : <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-center text-[11px] text-orange-100/45">ยังไม่มีข้อความแชทใหม่</p>}</section><section><p className="mb-2 text-[11px] font-semibold text-orange-100">ออเดอร์ใหม่ · {unreadThreads.length}</p>{notifications.length ? <div className="space-y-2">{notifications.map(item => <button type="button" key={item.key} onClick={() => { setLocation("/orders"); setNotificationsOpen(false); }} className={`w-full rounded-xl border p-3 text-left ${item.seen ? "border-white/10 bg-black/20" : "animate-pulse border-orange-300/50 bg-orange-400/10"}`}><p className="text-xs font-semibold text-orange-100">{item.title}</p><p className="mt-1 line-clamp-2 text-[11px] text-orange-100/60">{item.detail}</p></button>)}</div> : <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-center text-[11px] text-orange-100/45">ยังไม่มีออเดอร์ใหม่</p>}</section><p className="text-[9px] text-orange-100/30">ย่อหน้าต่างได้เมื่อเว็บยังเปิดอยู่ · หากปิดเบราว์เซอร์ การแจ้งเตือนจะหยุด</p></div></div>}<main className="h-0 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">{children}</main></SidebarInset></></div>;
}
