import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { Activity, Archive, Bell, Boxes, CalendarDays, Database, LayoutDashboard, LockKeyhole, MessageCircle, PanelLeft, Search, Send, Skull, Truck, WandSparkles } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { PRESENTATION_MODE } from "@shared/presentation";
import { getActiveCamp, readCanonicalOrders, readCanonicalOrderNotifications, type Camp } from "@/lib/canonical";
import { trpc } from "@/lib/trpc";
import { CHAT_NOTIFICATION_EVENT, CHAT_NOTIFICATION_SETTINGS_EVENT, countUnreadChatMessages, filterChatNotificationsForEnabledPages, isChatNotificationSoundEnabled, markChatNotificationsRead, playChatNotificationSound, readChatNotificationPageSettings, readChatNotificationState, reconcileChatNotificationRows, setChatNotificationSoundEnabled, unlockChatNotificationAudio, writeChatNotificationState, type ChatNotification } from "@/lib/chat-notifications";
import { THEME_LAB_EVENT, prepareThemeCss, readThemeLab, themeRoomFromPath } from "@/lib/theme-lab";
import { useGlobalThemeRuntime } from "@/contexts/GlobalThemeRuntime";

const menuItems = [
  { icon: CalendarDays, label: "สรุปออเดอร์รายวัน", path: "/daily-order-summary" },
  { icon: LayoutDashboard, label: "Order Control", path: "/orders" },
  { icon: MessageCircle, label: "แอปแชท Mobile Inbox", path: "/mobile-inbox" },
  { icon: MessageCircle, label: "รวมแชทเพจ", path: "/chats" },
  { icon: MessageCircle, label: "LINE OA · ห้องตอบแชท", path: "/line-chat" },
  { icon: Truck, label: "แมปเลขพัสดุ", path: "/parcel-mapping" },
  { icon: Database, label: "คู่มือระบบ · System Manual", path: "/system-manual" },
  { icon: Send, label: "PIONEER · คิวพัก / ดักสองชั้น", path: "/telegram-delivery" },
  { icon: Bell, label: "ประวัติเปลี่ยนของ · PARADOX", path: "/alert-room" },
  { icon: Skull, label: "BLACKBOX · DEATH NOTE", path: "/blackbox" },
  { icon: Archive, label: "🌓 VAGABOND · ไล่เคสจากแชท", path: "/vagabond" },
  { icon: Boxes, label: "คลังสินค้าจริง / สต๊อกกลาง", path: "/stock-room" },
  { icon: WandSparkles, label: "PRIVATE VAULT · ภาพ / สคริปต์", path: "/script-atelier" },
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
  const { theme, themes, selectTheme, connected } = useGlobalThemeRuntime();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchRows, setGlobalSearchRows] = useState<Array<Record<string, any>>>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ key: string; title: string; detail: string; time: string | null; seen: boolean }>>([]);
  const [unreadThreads, setUnreadThreads] = useState<Array<{ key: string; latestAt: string | null; customerName: string | null }>>([]);
  const chatConfiguredQuery = trpc.chat.configured.useQuery(undefined, { staleTime: 60_000, retry: false });
  const hasServerChatConfig = Boolean(chatConfiguredQuery.data?.configured);
  const projectStatusQuery = trpc.projects.status.useQuery(undefined, { staleTime: 60_000, retry: false });
  const [chatNotificationState, setChatNotificationState] = useState(() => readChatNotificationState());
  const [chatNotificationPageSettings, setChatNotificationPageSettings] = useState(() => readChatNotificationPageSettings());
  const chatNotifications = filterChatNotificationsForEnabledPages(chatNotificationState.pending, chatNotificationPageSettings);
  const [soundEnabled, setSoundEnabled] = useState(() => isChatNotificationSoundEnabled());
  const [camp, setCamp] = useState<Camp>(getActiveCamp());
  const pollNotificationsMutation = trpc.chat.pollNotifications.useMutation();
  const pollNotifications = pollNotificationsMutation.mutateAsync;
  const chatUnreadCount = countUnreadChatMessages({ ...chatNotificationState, pending: chatNotifications });
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
    const term = globalSearch.trim();
    if (!globalSearchOpen || term.length < 3) {
      setGlobalSearchRows([]);
      setGlobalSearchLoading(false);
      return;
    }
    let cancelled = false;
    setGlobalSearchLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const result = await readCanonicalOrders(term);
        if (!cancelled) setGlobalSearchRows(((result.orders ?? []) as Array<Record<string, any>>).slice(0, 18));
      } catch {
        if (!cancelled) setGlobalSearchRows([]);
      } finally {
        if (!cancelled) setGlobalSearchLoading(false);
      }
    }, 220);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [globalSearch, globalSearchOpen]);
  useEffect(() => {
    let cancelled = false;
    const loadNotifications = async () => {
      try {
        const result = await readCanonicalOrderNotifications();
        const rows = (result.orders ?? []) as Array<Record<string, any>>;
        const storageKey = `drakside-last-order-${getActiveCamp()}`;
        const lastSeen = localStorage.getItem(storageKey) || "";
        const rowKeys = rows.map((row) => String(row.upsert_key || row.order_number_display || row.order_number || "")).filter(Boolean);
        const lastSeenIndex = lastSeen ? rowKeys.indexOf(lastSeen) : -1;
        const hasBaseline = lastSeenIndex >= 0;
        const unseenKeys = new Set<string>(hasBaseline ? rowKeys.slice(0, lastSeenIndex) : []);
        const next = rows.slice(0, 50).map((row) => {
          const key = String(row.upsert_key || row.order_number_display || row.order_number || "");
          const orderNumber = String(row.order_number_display || row.order_number || key);
          const title = `ออเดอร์ใหม่ ${orderNumber}`;
          const detail = String(row.final_display_for_packer || row.final_product || row.order_fibo_product || row.telegram_product_display || "ยังไม่มีรายละเอียดสินค้า");
          const time = row.order_time_display || row.order_time || row.order_time_bkk_iso || null;
          return { key, title, detail, time, seen: !unseenKeys.has(key) };
        }).filter((item) => item.key);
        if (!cancelled) {
          setNotifications(next);
          setUnreadThreads(Array.from(unseenKeys).map((key) => {
            const row = rows.find((item) => String(item.upsert_key || item.order_number_display || item.order_number || "") === key);
            return { key, latestAt: row?.order_time_display || row?.order_time || row?.order_time_bkk_iso || null, customerName: `ออเดอร์ใหม่ ${row?.order_number_display || row?.order_number || key}` };
          }));
          if ((!lastSeen || !hasBaseline) && rowKeys[0]) localStorage.setItem(storageKey, rowKeys[0]);
        }
      } catch { /* notification center must not block the app */ }
    };
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 60000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [camp]);
  useEffect(() => {
    const sync = () => {
      setChatNotificationState(readChatNotificationState(undefined));
      setChatNotificationPageSettings(readChatNotificationPageSettings(undefined));
      setSoundEnabled(isChatNotificationSoundEnabled());
    };
    sync();
    window.addEventListener(CHAT_NOTIFICATION_EVENT, sync);
    window.addEventListener(CHAT_NOTIFICATION_SETTINGS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHAT_NOTIFICATION_EVENT, sync);
      window.removeEventListener(CHAT_NOTIFICATION_SETTINGS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  useEffect(() => {
    if (!hasServerChatConfig) return;
    let cancelled = false;
    let inFlight = false;
    const pollWithLock = async () => {
      if (cancelled) return;
      const current = readChatNotificationState(undefined);
      const response = await pollNotifications({ afterRowId: current.cursorRowId });
      if (cancelled) return;
      const result = reconcileChatNotificationRows(current, response.rows, Date.now(), response.cursorRowId);
      const pageSettings = readChatNotificationPageSettings(undefined);
      const changed = filterChatNotificationsForEnabledPages(result.changed, pageSettings);
      const nextState = { ...result.state, pending: filterChatNotificationsForEnabledPages(result.state.pending, pageSettings) };
      writeChatNotificationState(nextState, undefined);
      setChatNotificationState(nextState);
      if (!changed.length) return;
      Array.from(new Set(changed.map(item => item.pageId))).forEach((pageId, index) => {
        window.setTimeout(() => playChatNotificationSound(pageId, undefined), index * 220);
      });
      if (document.visibilityState !== "hidden" || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const newest = changed[changed.length - 1];
      if (!newest) return;
      const systemNotification = new Notification(`ข้อความใหม่ ${changed.length} รายการ`, {
        body: `${newest.customerName} · ${newest.pageName}: ${newest.message}`,
        tag: `bb-chat:${newest.threadKey}`,
        icon: "/favicon.ico",
      });
      systemNotification.onclick = () => {
        systemNotification.close();
        window.focus();
        const next = markChatNotificationsRead(readChatNotificationState(undefined), newest.threadKey);
        writeChatNotificationState(next, undefined);
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
          await navigator.locks.request("bb-chat-notification-poll:server-backed", { ifAvailable: true }, async lock => {
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
  }, [hasServerChatConfig, pollNotifications, setLocation]);
  const toggleNotifications = () => {
    setNotificationsOpen(value => !value);
    void unlockChatNotificationAudio();
    if (typeof Notification !== "undefined" && Notification.permission === "default") void Notification.requestPermission();
  };
  const markAllNotificationsRead = () => {
    const next = markChatNotificationsRead(readChatNotificationState(undefined));
    writeChatNotificationState(next, undefined);
    setChatNotificationState(next);
    if (notifications[0]?.key) localStorage.setItem(`drakside-last-order-${getActiveCamp()}`, notifications[0].key);
    setUnreadThreads([]);
    setNotifications(items => items.map(item => ({ ...item, seen: true })));
    setNotificationsOpen(false);
  };
  const openChatNotification = (item: ChatNotification) => {
    const next = markChatNotificationsRead(readChatNotificationState(undefined), item.threadKey);
    writeChatNotificationState(next, undefined);
    setChatNotificationState(next);
    setNotificationsOpen(false);
    setLocation(`/mobile-inbox?page=${encodeURIComponent(item.pageId)}&thread=${encodeURIComponent(item.threadId)}`);
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
  const roomLabel = location === "/blackbox" ? "💀 BLACKBOX · ห้องตรวจออเดอร์" : activeMenuItem?.label ?? "BB STORE";
  const roomHint = location === "/blackbox" ? "อ่านเหตุผล · route · หลักฐานจาก n8n" : "ศูนย์ควบคุมออเดอร์";
  const isMobile = useIsMobile();
  const [now, setNow] = useState(() => new Date());
  const thaiDateTime = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Bangkok" }).format(now);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const handleCampChange = (event: Event) => setCamp((event as CustomEvent<Camp>).detail); window.addEventListener("camp-change", handleCampChange); return () => window.removeEventListener("camp-change", handleCampChange); }, []);
  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);
  useEffect(() => { const handleMouseMove = (event: MouseEvent) => { if (!isResizing) return; const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0; const newWidth = event.clientX - sidebarLeft; if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth); }; const handleMouseUp = () => setIsResizing(false); if (isResizing) { document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); document.body.style.cursor = "col-resize"; document.body.style.userSelect = "none"; } return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); document.body.style.cursor = ""; document.body.style.userSelect = ""; }; }, [isResizing, setSidebarWidth]);
  const st = false; // Deployment นี้ใช้ ST เท่านั้น; ปิด theme/branch ของ ST เดิม
  return <div className="singto-cyber-edge"><>{themeLabCss ? <style id="nightops-theme-lab">{themeLabCss}</style> : null}<div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className={st ? "border-r border-orange-500/20 bg-[#100b08] text-orange-50 [&_[data-slot=sidebar-inner]]:bg-[#100b08] [&_[data-slot=sidebar-inner]]:text-orange-50" : "border-r border-orange-500/10 bg-[#0d0a12] text-orange-50 [&_[data-slot=sidebar-inner]]:bg-[#0d0a12] [&_[data-slot=sidebar-inner]]:text-orange-50"} disableTransition={isResizing}><SidebarHeader className="h-16 justify-center border-b border-orange-500/10"><div className="flex w-full items-center gap-3 px-2"><button onClick={toggleSidebar} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${st ? "text-orange-200/70 hover:bg-orange-500/10 hover:text-orange-100" : "text-orange-200/60 hover:bg-orange-500/10 hover:text-orange-200"}`} aria-label="เปิดหรือปิดเมนู"><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <button type="button" onClick={() => setLocation("/secret-gallery")} className="group flex min-w-0 items-center gap-2 text-left" title="ห้องลับคลังโปรเจค"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-200"><Skull className="h-4 w-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-semibold tracking-tight text-orange-50 group-hover:text-amber-200">BB STORE</span><span className="mt-0.5 block truncate text-[9px] font-mono uppercase tracking-[.14em] text-orange-100/35">ST · ORDER ENGINE</span></span></button>}</div></SidebarHeader><SidebarContent className="gap-0"><SidebarMenu className="px-2 py-1">{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className={`h-8 text-xs font-normal ${st ? "text-orange-100/85 hover:bg-orange-500/10 hover:text-orange-50 data-[active=true]:bg-orange-500/15 data-[active=true]:text-orange-100" : "text-orange-100/80 hover:bg-orange-500/10 hover:text-orange-50 data-[active=true]:bg-orange-500/10 data-[active=true]:text-orange-100"}`}><item.icon className={`h-3.5 w-3.5 ${location === item.path ? (st ? "text-orange-300" : "text-orange-300") : ""}`} /><span>{item.label}</span>{item.path === "/chats" && chatUnreadCount > 0 ? <span className="ml-auto rounded-full bg-red-500/20 px-1.5 text-[10px] font-semibold text-red-300">{chatUnreadCount}</span> : null}</SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="mx-3 my-2 rounded-xl border border-red-400/15 bg-red-500/[0.04] p-2.5"><button type="button" onClick={toggleNotifications} className="flex w-full items-center gap-2 text-left text-xs text-red-200"><Bell className="h-3.5 w-3.5" /><span>{newNotificationCount ? `มีรายการใหม่ ${newNotificationCount}` : "การแจ้งเตือน"}</span></button></div></SidebarContent><SidebarFooter className="p-3"><div className="flex items-center gap-3 rounded-lg px-1 py-1"><Avatar className={`h-9 w-9 shrink-0 ${st ? "border border-orange-400/30 bg-orange-500/10" : "border border-orange-400/20 bg-orange-500/10"}`}><AvatarFallback className={`bg-transparent text-xs font-medium ${st ? "text-orange-200" : "text-amber-200"}`}>{st ? "ST" : "ST"}</AvatarFallback></Avatar><div className="min-w-0"><p className={`truncate text-sm font-medium leading-none ${st ? "text-orange-100" : "text-amber-100"}`}>{st ? "BB STORE" : "BB STORE"} · {camp}</p><p className={`mt-1.5 truncate text-xs ${st ? "text-orange-100/35" : "text-orange-100/35"}`}>{projectStatusQuery.data?.order ? "Main เชื่อมแล้ว" : "Main ยังไม่ตั้งค่า"} · {projectStatusQuery.data?.trackingParcel ? "Tracking เชื่อมแล้ว" : "Tracking ยังไม่ตั้งค่า"}</p></div></div></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/20 ${isCollapsed ? "hidden" : ""}`} style={{ zIndex: 50 }} onMouseDown={() => !isCollapsed && setIsResizing(true)} /></div><SidebarInset className={`h-full min-h-0 min-w-0 overflow-hidden ${st ? "bg-[#090706]" : "bg-[#09070d]"}`}>{isMobile && <div className={`sticky top-0 z-40 flex h-14 items-center justify-between px-2 backdrop-blur ${st ? "border-b border-orange-500/20 bg-[#100b08]/95" : "border-b border-orange-500/10 bg-[#0d0a12]/95"}`}><div className="flex items-center gap-2"><SidebarTrigger className={`h-9 w-9 rounded-lg ${st ? "text-orange-100 hover:bg-orange-500/10" : "text-orange-100 hover:bg-orange-500/10"}`} /><span className={st ? "text-orange-50" : "text-orange-50"}>{activeMenuItem?.label ?? "เมนู"}</span></div><button type="button" onClick={toggleNotifications} aria-label="เปิดการแจ้งเตือน" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-orange-100 hover:bg-orange-500/10"><Bell className="h-5 w-5" />{newNotificationCount > 0 ? <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{newNotificationCount > 99 ? "99+" : newNotificationCount}</span> : null}</button></div>}<div className={`mx-4 mt-3 flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2 text-[11px] ${st ? "border border-orange-500/20 bg-[#160e08] text-orange-100/75" : "border border-orange-500/20 bg-[#100c19] text-orange-100/75"}`}><span className={`font-medium ${st ? "text-orange-200" : "text-amber-200"}`}>{thaiDateTime}</span><span className={st ? "text-orange-100/35" : "text-orange-100/35"}>·</span><button type="button" onClick={toggleNotifications} className="inline-flex items-center gap-1.5 text-red-100 hover:text-white"><Bell className="h-3.5 w-3.5" />{newNotificationCount ? `มีรายการใหม่ ${newNotificationCount}` : "ไม่มีรายการใหม่"}</button><span className={st ? "text-orange-100/30" : "text-orange-100/30"}>·</span><span className="font-semibold text-fuchsia-200">{roomLabel}</span><span className={st ? "text-orange-100/45" : "text-orange-100/45"}>{roomHint}</span><span className="text-emerald-300/80">● LIVE · 60 วิ</span><label className="global-theme-picker"><span>THEME</span><select aria-label="เลือกธีมเว็บหลัก" value={theme.themeKey} onChange={event => { const next = themes.find(item => item.themeKey === event.target.value); if (next) selectTheme(next); }}><option value={theme.themeKey}>{theme.name}</option>{themes.filter(item => item.themeKey !== theme.themeKey).map(item => <option key={item.themeKey} value={item.themeKey}>{item.name}</option>)}</select><small>{connected ? "ROOM 04" : "LOCAL"}</small></label><button type="button" onClick={() => { window.dispatchEvent(new CustomEvent("universal-search-open")); if (!location.startsWith("/orders")) setGlobalSearchOpen(true); setNotificationsOpen(false); }} className="ml-auto inline-flex h-8 items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-400/10 px-3 text-[10px] font-semibold tracking-[.08em] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.08)] transition hover:border-cyan-200/70 hover:bg-cyan-400/20"><Search className="h-3.5 w-3.5" />UNIVERSAL SEARCH</button></div>{globalSearchOpen && <div className="global-search-hub absolute right-4 top-16 z-[60] w-[min(720px,calc(100vw-2rem))] overflow-hidden rounded-2xl border p-3 shadow-2xl backdrop-blur-xl" role="dialog" aria-label="Universal Search">
          <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.2em]">UNIVERSAL SEARCH</p><p className="mt-1 text-[10px] opacity-65">ค้นจากห้องปัจจุบัน · ไม่พากลับ Order Control</p></div><button type="button" onClick={() => setGlobalSearchOpen(false)} className="rounded-lg px-2 py-1 text-xs" aria-label="ปิดการค้นหา">ปิด</button></div>
          <div className="global-search-input-wrap"><Search className="h-4 w-4 shrink-0" /><input autoFocus value={globalSearch} onChange={event => setGlobalSearch(event.target.value)} placeholder="เบอร์โทร · ชื่อลูกค้า · เลขออเดอร์ · SKU · เลขพัสดุ" /></div>
          <div className="mt-3 max-h-[min(62vh,540px)] space-y-2 overflow-y-auto">{globalSearch.trim().length < 3 ? <p className="global-search-empty">พิมพ์อย่างน้อย 3 ตัวอักษรเพื่อค้นทุกห้อง</p> : globalSearchLoading ? <p className="global-search-empty">กำลังค้นจากศูนย์ข้อมูลกลาง…</p> : globalSearchRows.length ? globalSearchRows.map((row, index) => { const orderKey = String(row.upsert_key || row.order_number || index); const sources = ["Order Control", row.chat_link_key || row.customer_name ? "รวมแชท" : "", row.telegram_status || row.sent_at ? "Telegram" : "", row.delivery_status || row.order_history_id ? "ประวัติส่ง" : ""].filter(Boolean); return <div key={orderKey} className="global-search-result"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-mono text-xs font-bold">{String(row.order_number_display || row.order_number || "ไม่พบเลขออเดอร์")}</p><p className="mt-1 truncate text-[11px] opacity-75">{String(row.customer_name || row.facebook_name || "ไม่พบชื่อลูกค้า")} · {String(row.phone || row.extracted_phone || "ไม่มีเบอร์")}</p></div><span className="shrink-0 text-[10px] opacity-70">{String(row.order_time_display || row.order_time || "")}</span></div><div className="mt-2 flex flex-wrap gap-1">{sources.map(source => <span key={source} className="global-search-source">{source}</span>)}</div><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="global-search-room-action" onClick={() => { setGlobalSearchOpen(false); setLocation(`/orders?search=${encodeURIComponent(String(row.order_number || row.upsert_key || globalSearch))}&universal=1`); }}>เปิดห้องออเดอร์</button>{row.chat_link_key || row.customer_name ? <button type="button" className="global-search-room-action" onClick={() => { setGlobalSearchOpen(false); setLocation(`/chats?search=${encodeURIComponent(globalSearch)}`); }}>เปิดห้องแชท</button> : null}{row.telegram_status || row.sent_at ? <button type="button" className="global-search-room-action" onClick={() => { setGlobalSearchOpen(false); setLocation(`/telegram-delivery?search=${encodeURIComponent(String(row.upsert_key || row.order_number || globalSearch))}`); }}>เปิดห้อง Telegram</button> : null}{row.delivery_status || row.order_history_id ? <button type="button" className="global-search-room-action" onClick={() => { setGlobalSearchOpen(false); setLocation(`/order-history?search=${encodeURIComponent(String(row.upsert_key || row.order_number || globalSearch))}`); }}>เปิดประวัติส่ง</button> : null}</div></div>; }) : <p className="global-search-empty">ไม่พบข้อมูลที่ตรงกันในศูนย์ข้อมูลกลาง</p>}</div>
        </div>}{notificationsOpen && <div className="absolute right-4 top-16 z-50 w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-orange-400/25 bg-[#120b16]/95 p-3 shadow-2xl backdrop-blur-xl"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><b className="text-sm text-orange-100">ศูนย์แจ้งเตือน · {st ? "BB STORE" : "BB STORE"}</b><div className="flex items-center gap-2"><button type="button" onClick={toggleSound} className="text-[10px] text-orange-200/70 hover:text-orange-100">{soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}</button><button type="button" onClick={testSound} className="text-[10px] text-orange-200/70 hover:text-orange-100">ทดสอบเสียง</button><button type="button" onClick={markAllNotificationsRead} className="text-[10px] text-orange-200/60 hover:text-orange-100">อ่านแล้ว</button></div></div><div className="max-h-80 space-y-3 overflow-auto"><section><div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-semibold text-orange-100">ข้อความแชทใหม่ · {chatUnreadCount}</p>{typeof Notification !== "undefined" && Notification.permission !== "granted" ? <button type="button" onClick={() => void Notification.requestPermission()} className="text-[9px] text-orange-200/55 hover:text-orange-100">อนุญาต Browser</button> : null}</div>{!hasServerChatConfig ? <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-[11px] text-orange-100/55">ยังไม่ได้ตั้งค่า CHAT server ใน ROOM 02 เพื่อรับการแจ้งเตือน</p> : chatNotifications.length ? <div className="space-y-2">{chatNotifications.map(item => <button type="button" key={item.threadKey} onClick={() => openChatNotification(item)} className="w-full rounded-xl border border-orange-300/30 bg-orange-400/[0.08] p-3 text-left"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-semibold text-orange-100">{item.customerName} · {item.pageName}</p><span className="rounded-full bg-red-500/20 px-1.5 text-[10px] font-semibold text-red-200">{item.count}</span></div><p className="mt-1 line-clamp-2 text-[11px] text-orange-100/65">{item.message}</p><p className="mt-1 text-[9px] text-orange-100/35">{item.messageAt || "ข้อความใหม่"}</p></button>)}</div> : <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-center text-[11px] text-orange-100/45">ยังไม่มีข้อความแชทใหม่</p>}</section><section><p className="mb-2 text-[11px] font-semibold text-orange-100">ออเดอร์ใหม่ · {unreadThreads.length}</p>{notifications.length ? <div className="space-y-2">{notifications.map(item => <button type="button" key={item.key} onClick={() => { setLocation("/orders"); setNotificationsOpen(false); }} className={`w-full rounded-xl border p-3 text-left ${item.seen ? "border-white/10 bg-black/20" : "animate-pulse border-orange-300/50 bg-orange-400/10"}`}><p className="text-xs font-semibold text-orange-100">{item.title}</p><p className="mt-1 line-clamp-2 text-[11px] text-orange-100/60">{item.detail}</p></button>)}</div> : <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-center text-[11px] text-orange-100/45">ยังไม่มีออเดอร์ใหม่</p>}</section><p className="text-[9px] text-orange-100/30">ย่อหน้าต่างได้เมื่อเว็บยังเปิดอยู่ · หากปิดเบราว์เซอร์ การแจ้งเตือนจะหยุด</p></div></div>}<main className="h-0 min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-4">{children}</main></SidebarInset></></div>;
}
