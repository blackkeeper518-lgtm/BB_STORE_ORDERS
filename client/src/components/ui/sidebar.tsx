"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/useMobile";
import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, VariantProps } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";
import * as React from "react";
import { getActiveCamp, getSupabase } from "@/lib/canonical"; // ดึงฟังก์ชันเช็กค่ายและ Supabase client

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  unreadChatCount: number; // เพิ่มสถานะเก็บจำนวนแชทยังไม่ได้อ่าน
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // โน้ต D5
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (e) {
    // Silent fail if browser blocks autoplay
  }
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [unreadChatCount, setUnreadChatCount] = React.useState<number>(0);
  const prevCountRef = React.useRef<number>(0);

  // ดึงข้อมูลแชทยังไม่ได้อ่านแบบ Real-time ตามค่ายปัจจุบัน
  React.useEffect(() => {
    const camp = getActiveCamp();
    const isBB = camp.toUpperCase().includes("BB");
    // เลือกตารางแชทแยกตามค่าย หรือใช้ตารางรวมแชทเพจ
    const messageTable = isBB ? "bb_chat_page_messages" : "chat_page_messages";

    const fetchUnread = async () => {
      try {
        const supabase = getSupabase();
        if (!supabase) return;

        // ตัวอย่างเงื่อนไขนับข้อความที่ยังไม่ได้อ่าน (ปรับตามโครงสร้างตารางจริง เช่น is_read = false หรือ unread = true)
        const { count, error } = await supabase
          .from("chat_customer_messages") // หรือใช้ตารางแชทรวม
          .select("*", { count: "exact", head: true })
          .eq("is_read", false);

        if (!error && count !== null) {
          if (count > prevCountRef.current && prevCountRef.current !== 0) {
            playNotificationSound();
          }
          prevCountRef.current = count;
          setUnreadChatCount(count);
        }
      } catch (err) {
        // ข้ามหากยังไม่ต่อ Supabase
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 10000); // เช็กทุก 10 วิ

    return () => clearInterval(interval);
  }, []);

  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile(open => !open) : setOpen(open => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
      unreadChatCount,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar, unreadChatCount]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

// ... โค้ดส่วน Sidebar, SidebarMenuButton, SidebarMenuBadge ด้านล่างคงเดิม ...
// นำตัวแปร unreadChatCount ไปใส่เป็น Badge กระพริบที่ปุ่ม "รวมแชทเพจ" ได้ทันทีครับ
const { unreadChatCount } = useSidebar();

// ในส่วน Render เมนู:
<SidebarMenuItem>
  <SidebarMenuButton asChild isActive={location.pathname === "/chats"}>
    <a href="/chats" className="relative">
      <MessageSquare className={cn("h-4 w-4", unreadChatCount > 0 && "animate-bounce text-orange-400")} />
      <span>รวมแชทเพจ</span>
      {unreadChatCount > 0 && (
        <span className="ml-auto flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-lg shadow-red-500/50">
          {unreadChatCount}
        </span>
      )}
    </a>
  </SidebarMenuButton>
</SidebarMenuItem>
