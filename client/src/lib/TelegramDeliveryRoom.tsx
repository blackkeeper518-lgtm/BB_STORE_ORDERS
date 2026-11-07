import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActiveCamp, markBbOrderSentByKey, readTelegramDeliveryOrders, searchThailandPostalMaster, updateBbOrderByKey, type PostalMasterMatch } from "@/lib/canonical";
import { AlertTriangle, CheckCircle2, Clipboard, Clock3, Eye, MessageSquareText, RefreshCw, Send, ShieldAlert, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTelegramBody, selectTelegramMessage, sendTelegramFromN8n } from "@/lib/telegramDelivery";
import { getOrderWarnings } from "@/lib/orderWarnings";

const DEFAULT_HEADER = "🚀 [บิลสมบูรณ์ - 🎯ORDER_SNIPER_X]";

function liveClockLabel(value: Date) {
  return new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(value);
}

type OrderRow = Record<string, any>;
type DragSelectionState = { startKey: string; target: boolean; active: boolean; didDrag: boolean; lastKey: string };

function isOrderRow(value: unknown): value is OrderRow {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "object") {
    try { return JSON.stringify(value); } catch { return ""; }
  }
  return String(value);
}

function isSent(row: OrderRow | null | undefined) {
  if (!isOrderRow(row)) return false;
  if (row.source_view === "🌟GENESIS_xXx_HISTORY") return true;
  const status = textValue(row.telegram_status).trim().toLowerCase().replace(/^🔥\s*/, "");
  const deliveryStatus = textValue(row.delivery_status).trim().toLowerCase().replace(/^🔥\s*/, "");
  const deliveryState = textValue(row.delivery_state).trim().toLowerCase().replace(/^🔥\s*/, "");
  const viewSentFlag = textValue(row.drakside_is_sent).trim().toLowerCase();
  const sent = textValue(row.telegram_sent).trim().toLowerCase().replace(/^🔥\s*/, "");
  const sentValues = ["1", "true", "t", "sent", "delivered", "sent_to_telegram", "success", "completed", "ไปแล้วไปลับ"];
  return Boolean(String(row.sent_at || row.telegram_sent_at || "").trim()) || sentValues.includes(status) || sentValues.includes(deliveryStatus) || sentValues.includes(deliveryState) || ["1", "true", "t"].includes(viewSentFlag) || ["1", "true", "t", "sent", "success", "completed"].includes(sent);
}

function orderKey(row: OrderRow) {
  return String(row.upsert_key ?? row.id ?? row.order_number ?? "");
}

function sourceTableOf(row: OrderRow): "🗝️HERMES_ARCHIVE" | "🌀SINGULARITY_xXx_EXCHANGE" {
  if (row.source_table === "🗝️HERMES_ARCHIVE" || row.source_table === "🌀SINGULARITY_xXx_EXCHANGE") return row.source_table;
  throw new Error(`ไม่พบ source_table ที่ชัดเจนสำหรับ ${String(row.upsert_key ?? row.order_number ?? "ออเดอร์นี้")}`);
}

function deliveryStatus(row: OrderRow) {
  return isSent(row)
    ? { label: "🔥SENT", slogan: "ส่งแล้ว · ออกจากคิว", tone: "border-cyan-200/80 bg-cyan-400/20 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,.35)]" }
    : { label: "รอส่ง", slogan: "ยังอยู่ในห้องรอจัดส่ง", tone: "border-amber-300/40 bg-amber-500/10 text-amber-200" };
}

function realTime(row: OrderRow) {
  return row.order_time_display || null;
}

function displayTime(row: OrderRow | null | undefined) { return isOrderRow(row) ? String(row.order_time_display || "ไม่พบ order_time_display") : "—"; }

function productOf(row: OrderRow) {
  return evidenceText(row.order_fibo_product) || evidenceText(row.for_packer_st_display) ||
    evidenceText(row.manus_for_packer) || evidenceText(row.google_for_packer) ||
    evidenceText(row.packer_tag_display) || evidenceText(row.bb_pack_center);
}

function evidenceText(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(evidenceText).filter(Boolean).join("\n");
  if (typeof value === "object") return Object.entries(value as Record<string, unknown>).map(([key, item]) => `${key}: ${evidenceText(item)}`).join("\n");
  return String(value);
}

function originalOrderBlock(row: OrderRow) {
  return evidenceText(row.original) || "ไม่พบก้อนออเดอร์แท้ในคอลัมน์ original";
}

function laneOf(row: OrderRow) {
  const text = `${row.sku || ""} ${row.product_name || ""} ${row.th_name || ""} ${productOf(row)}`.toLowerCase();
  if (/green|เขียว|cool|เย็น|mond_green/.test(text)) return { label: "โซนเย็น", mark: "ICE", tone: "border-cyan-300/70 bg-cyan-400/15 text-cyan-100 shadow-[0_0_24px_rgba(40,220,255,.28)]" };
  if (/red|ร้อน|hot|เผ็ด|mond_red/.test(text)) return { label: "โซนร้อน", mark: "HEAT", tone: "border-amber-300/70 bg-amber-400/15 text-amber-100 shadow-[0_0_24px_rgba(255,170,40,.3)]" };
  return { label: "โซนผลไม้", mark: "FRESH", tone: "border-fuchsia-300/70 bg-fuchsia-500/15 text-fuchsia-100 shadow-[0_0_24px_rgba(255,70,180,.28)]" };
}

function addressOf(row: OrderRow) {
  return evidenceText(row.address_fibo_selected_clean) || evidenceText(row.telegram_primary_address) ||
    evidenceText(row.address_display_packer) || evidenceText(row.rescue_address_normalized) ||
    evidenceText(row.full_address) || "ยังไม่มีที่อยู่";
}

function provinceOf(row: OrderRow) {
  return String(row.province || row.master_province || "ไม่ระบุจังหวัด").trim();
}

function telegramText(row: OrderRow, header: string) {
  const builderBill = String(row.telegram_message_for_send_final ?? row.telegram_message ?? getTelegramBody(row)?.text ?? row.telegram_main_bill ?? "").trim();
  if (builderBill) return withPreferredBillHeader(row, builderBill, header);
  // สร้างข้อความจากออเดอร์ BB: ใช้ฟิวค่ายตัวเองและไม่พึ่ง master_* เป็นแหล่งหลัก
  const customer = row.customer_name || "";
  const phone = row.extracted_phone || row.phone || "";
  const cod = row.cod_amount;
  const orderNumber = row.order_number_display || row.order_number || "";
  const time = row.order_time_display || "";
  const shipping = String(row.shipping_carrier || "⚡FLASH EXPRESS").trim() || "⚡FLASH EXPRESS";
  const warnings = warningOf(row);
  return [row.stock_notice || row.telegram_header || row.product_header || row.bill_header || header, "━━━━━━━━━━━━━━━━━━━━", time && `⏰ วันที่สั่งซื้อ : ${time}`, orderNumber && `🆔 เลขออเดอร์ : ${orderNumber}`, row.page_name && `📢 PAGE : ${row.page_name}`, customer && `👤 FB : ${customer}`, cod !== null && cod !== undefined && cod !== "" && `💰 ยอด COD : ${cod} บาท`, "━━━━━━━━━━━━━━━━━━━━", customer, phone, addressOf(row), "━━━━━━━━━━━━━━━━━━━━", "📦 รายการสินค้าสำหรับจัดของ", productOf(row), warnings.length ? "🚨 ป้ายเตือน" : "", ...warnings, "━━━━━━━━━━━━━━━━━━━━", `🚚 ขนส่ง: ${shipping}`].filter(Boolean).join("\n");
}

function plainTelegramText(value: unknown) {
  return String(value ?? "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function withPreferredBillHeader(row: OrderRow, bill: string, standbyHeader: string) {
  const dynamicHeader = String(row.stock_notice ?? "").trim();
  const rawPreferred = dynamicHeader || String(standbyHeader ?? "").trim();
  const preferred = rawPreferred ? escapeTelegramHtml(rawPreferred) : "";
  if (!preferred || bill.startsWith(preferred)) return bill;

  const lines = bill.split(/\r?\n/);
  const firstIndex = lines.findIndex((line) => line.trim());
  if (firstIndex < 0) return preferred;
  const firstLine = lines[firstIndex].trim();
  if (plainTelegramText(firstLine) === rawPreferred) return bill;
  if (/^[━─—═-]{3,}$/.test(firstLine)) return `${preferred}\n${bill}`;

  // Replace an existing bill title (including an older static builder title).
  if (/^(?:🚀|╳╳|█▓▒░)|\[บิลสมบูรณ์/i.test(plainTelegramText(firstLine))) {
    lines[firstIndex] = preferred;
    return lines.join("\n");
  }
  return `${preferred}\n${bill}`;
}

function escapeTelegramHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mappingLabel(row: OrderRow) {
  if (row.master_matched === true || String(row.mapping_status_fast ?? "").toUpperCase() === "MAPPED_FROM_PRODUCT_MASTER" || String(row.master_display_for_packer ?? "").trim()) return "MAPPED_FROM_PRODUCT_MASTER";
  return String(row.mapping_status || row.web_mapping_status || "REVIEW_PRODUCT");
}

function issueOf(row: OrderRow) {
  const issues: string[] = [];
  if (!row.upsert_key) issues.push("ไม่มี upsert_key");
  if (!productOf(row) || productOf(row).includes("ยังไม่มี")) issues.push("ไม่พบสินค้า");
  if (!addressOf(row) || addressOf(row).includes("ยังไม่มี")) issues.push("ไม่พบที่อยู่");
  if (!row.mapping_status && !row.web_mapping_status) issues.push("ยังไม่ระบุผลแมป");
  return issues;
}

function warningOf(row: OrderRow) {
  return getOrderWarnings(row).map((warning) => warning.message);
}

export default function TelegramDeliveryRoom() {
  const [header, setHeader] = useState(DEFAULT_HEADER);
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(0);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [dragSelecting, setDragSelecting] = useState(false);
  const dragSelectionRef = useRef<DragSelectionState | null>(null);
  const [sentAwaitingStatusKeys, setSentAwaitingStatusKeys] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(true);
  const [warningsOnly, setWarningsOnly] = useState(false);
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("search") ?? "");
  const [postalQuery, setPostalQuery] = useState("");
  const [postalMatches, setPostalMatches] = useState<PostalMasterMatch[]>([]);
  const [postalLoading, setPostalLoading] = useState(false);
  const [postalError, setPostalError] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [editText, setEditText] = useState("");
  const [manualMessageOverrides, setManualMessageOverrides] = useState<Record<string, string>>({});
  const [room, setRoom] = useState<"queue" | "sent">(() => window.location.pathname === "/andromeda" || new URLSearchParams(window.location.search).get("room") === "sent" ? "sent" : "queue");
  const query = useQuery({
    queryKey: ["telegram-delivery-room", getActiveCamp(), room, search],
    queryFn: () => readTelegramDeliveryOrders(search, room),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const allOrders: OrderRow[] = Array.isArray(query.data?.orders)
    ? query.data.orders.filter(isOrderRow)
    : [];
  // Keep the order_time_display ordering supplied by the canonical reader; do not parse display dates again in the browser.
  const waiting = useMemo(() => allOrders.filter((row) => room === "sent" ? isSent(row) : !isSent(row)), [allOrders, room]);
  const visibleWaiting = useMemo(() => warningsOnly ? waiting.filter((row) => warningOf(row).length > 0) : waiting, [waiting, warningsOnly]);
  const order = waiting[selected];
  const selectedOrders = useMemo(() => visibleWaiting.filter((row) => selectedKeys.has(orderKey(row))), [selectedKeys, visibleWaiting]);
  const savedManualMessage = order ? manualMessageOverrides[orderKey(order)] : undefined;
  const message = useMemo(() => order ? (manualMessageOverrides[orderKey(order)] ?? telegramText(order, header || DEFAULT_HEADER)) : "คิวว่าง — ไม่มีออเดอร์รอส่ง", [order, header, manualMessageOverrides]);
  const telegramSelection = useMemo(() => {
    if (!order) return null;
    const rowForSend = savedManualMessage ? { ...order, telegram_message_for_send_final: escapeTelegramHtml(savedManualMessage) } : order;
    return selectTelegramMessage(rowForSend, message);
  }, [order, message, savedManualMessage]);
  const selectedIssues = order ? issueOf(order) : [];
  const selectedWarningDetails = order ? getOrderWarnings(order) : [];
  const selectedWarnings = selectedWarningDetails.map((warning) => warning.message);
  const messagePreview = useMemo(() => order ? plainTelegramText(message) : "", [order, message]);
  const warningCount = waiting.reduce((sum, row) => sum + warningOf(row).length, 0);
  const warningBillCount = waiting.reduce((sum, row) => sum + (warningOf(row).length > 0 ? 1 : 0), 0);
  const lane = order ? laneOf(order) : { label: "ยังไม่เลือกโซน", mark: "WAIT", tone: "border-cyan-300/50 bg-cyan-400/10 text-cyan-200" };

  const provinceSummary = useMemo(() => {
    const map = new Map<string, number>();
    waiting.forEach((row) => map.set(provinceOf(row), (map.get(provinceOf(row)) ?? 0) + 1));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [waiting]);

  useEffect(() => {
    if (selected >= waiting.length) setSelected(Math.max(0, waiting.length - 1));
  }, [selected, waiting.length]);

  useEffect(() => {
    setEditMode(false);
    setEditText("");
  }, [order?.id, order?.upsert_key]);

  useEffect(() => {
    const visibleKeys = new Set(visibleWaiting.map(orderKey));
    setSelectedKeys((current) => new Set(Array.from(current).filter((key) => visibleKeys.has(key))));
  }, [visibleWaiting]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const stopDrag = () => {
      if (dragSelectionRef.current) dragSelectionRef.current.active = false;
      setDragSelecting(false);
    };
    window.addEventListener("mouseup", stopDrag);
    return () => window.removeEventListener("mouseup", stopDrag);
  }, []);

  async function copyMessage() {
    if (!order) return;
    await navigator.clipboard?.writeText(editMode ? editText : messagePreview);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function persistOrderSent(row: OrderRow) {
    if (!row.upsert_key) throw new Error("ไม่พบ upsert_key สำหรับเขียนสถานะ");
    await markBbOrderSentByKey(String(row.upsert_key), sourceTableOf(row));
  }

  function clearSentAwaitingStatus(key: string) {
    setSentAwaitingStatusKeys((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  async function sendCurrentOrder() {
    if (!order || !telegramSelection) { setSendMessage("ยังไม่มีออเดอร์ที่เลือก"); return; }
    if (room === "sent" || isSent(order)) { setSendMessage("รายการนี้เป็น 🔥SENT แล้ว — ถ้าจำเป็นต้องส่งซ้ำ ให้กดกลับเข้าคิวก่อน"); return; }
    const warnings = getOrderWarnings(order);
    const blockers = warnings.filter((warning) => warning.severity === "BLOCK");
    if (blockers.length) { setSendMessage(`งดส่งออเดอร์นี้: ${blockers.map((warning) => warning.message).join(" · ")}`); return; }
    const reviews = warnings.filter((warning) => warning.severity === "REVIEW");
    if (reviews.length && !window.confirm(`ออเดอร์นี้มี ${reviews.length} จุดที่ต้องตรวจ:\n${reviews.map((warning) => `• ${warning.message}`).join("\n")}\n\nตรวจข้อมูลด้วยตนเองแล้วและยืนยันส่งต่อหรือไม่?`)) { setSendMessage("หยุดส่งไว้ก่อน · ยังไม่ได้ยืนยันจุดเตือน"); return; }
    const key = orderKey(order);
    if (sentAwaitingStatusKeys.has(key)) { setSendMessage("Telegram ส่งแล้ว แต่สถานะยังไม่ลงโต๊ะ — อย่าส่งซ้ำ ให้กด 🔥SENT เพื่อปิดรายการ"); return; }
    setSendMessage("กำลังส่ง Telegram...");
    try {
      await sendTelegramFromN8n(order, telegramSelection);
    } catch (error) {
      setSendMessage(`ส่งไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
    setSentAwaitingStatusKeys((current) => new Set(current).add(key));
    try {
      await persistOrderSent(order);
      clearSentAwaitingStatus(key);
      setSendMessage("ส่ง Telegram แล้ว · เขียน 🔥SENT สำเร็จ — ออกจากคิวแล้ว");
      setSelectedKeys((current) => { const next = new Set(current); next.delete(key); return next; });
      setSelected(0);
      await query.refetch();
    } catch (error) {
      setSendMessage(`Telegram ส่งออกแล้ว แต่เขียน 🔥SENT ไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)} — อย่าส่งซ้ำ กด 🔥SENT เพื่อปิดรายการ`);
    }
  }

  function toggleOrder(row: OrderRow) {
    const key = orderKey(row);
    if (!key) return;
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function beginOrderDrag(event: ReactMouseEvent<HTMLButtonElement>, row: OrderRow) {
    if (event.button !== 0) return;
    const key = orderKey(row);
    if (!key) return;
    event.preventDefault();
    dragSelectionRef.current = { startKey: key, target: !selectedKeys.has(key), active: true, didDrag: false, lastKey: key };
  }

  function dragOverOrder(event: ReactMouseEvent<HTMLButtonElement>, row: OrderRow) {
    const drag = dragSelectionRef.current;
    const key = orderKey(row);
    if (!drag?.active || event.buttons !== 1 || !key || key === drag.lastKey) return;
    drag.didDrag = true;
    drag.lastKey = key;
    setDragSelecting(true);
    setSelectedKeys((current) => {
      const next = new Set(current);
      for (const targetKey of [drag.startKey, key]) {
        if (drag.target) next.add(targetKey); else next.delete(targetKey);
      }
      return next;
    });
  }

  function selectOrder(event: ReactMouseEvent<HTMLButtonElement>, row: OrderRow, index: number) {
    const drag = dragSelectionRef.current;
    if (drag?.didDrag) { dragSelectionRef.current = null; return; }
    dragSelectionRef.current = null;
    setSelected(index);
    if (event.detail === 0) toggleOrder(row);
  }

  function toggleAllVisible() {
    const keys = visibleWaiting.map(orderKey).filter(Boolean);
    setSelectedKeys((current) => keys.length > 0 && keys.every((key) => current.has(key)) ? new Set() : new Set(keys));
  }

  function toggleWarningFilter() {
    if (!warningsOnly) {
      const firstWarningIndex = waiting.findIndex((row) => warningOf(row).length > 0);
      if (firstWarningIndex >= 0) setSelected(firstWarningIndex);
    }
    setWarningsOnly((current) => !current);
  }

  async function sendSelectedOrders() {
    const rowsToSend = room === "sent" ? [] : selectedOrders.filter((row) => !isSent(row) && !sentAwaitingStatusKeys.has(orderKey(row)));
    if (!rowsToSend.length) { setSendMessage(room === "sent" || selectedOrders.length ? "รายการที่เลือกเป็น 🔥SENT หรือส่งแล้ว — จะไม่ส่งซ้ำ" : "ลากเลือกบิลก่อนครับ"); return; }
    const blockedRows = rowsToSend.filter((row) => getOrderWarnings(row).some((warning) => warning.severity === "BLOCK"));
    if (blockedRows.length) { setSendMessage(`หยุดทั้งชุด · มี ${blockedRows.length} ออเดอร์เข้ากฎงดส่ง — ${blockedRows.slice(0, 3).map((row) => String(row.order_number || row.upsert_key)).join(", ")}`); return; }
    const reviewRows = rowsToSend.filter((row) => getOrderWarnings(row).some((warning) => warning.severity === "REVIEW"));
    if (reviewRows.length && !window.confirm(`มี ${reviewRows.length} จาก ${rowsToSend.length} ออเดอร์ที่พบข้อมูลต้องตรวจ\nยืนยันว่าตรวจครบแล้วและปล่อยส่งทั้งชุดหรือไม่?`)) { setSendMessage("หยุดส่งชุดไว้ก่อน · ยังไม่ได้ยืนยันจุดเตือน"); return; }
    let completed = 0;
    setSendMessage(`กำลังปล่อยรัน ${rowsToSend.length} ออเดอร์...`);
    try {
      for (const row of rowsToSend) {
        const key = orderKey(row);
        const savedText = manualMessageOverrides[key];
        const text = savedText ?? telegramText(row, header || DEFAULT_HEADER);
        const rowForSend = savedText ? { ...row, telegram_message_for_send_final: escapeTelegramHtml(savedText) } : row;
        await sendTelegramFromN8n(rowForSend, selectTelegramMessage(rowForSend, text));
        setSentAwaitingStatusKeys((current) => new Set(current).add(key));
        try {
          await persistOrderSent(row);
          clearSentAwaitingStatus(key);
          completed += 1;
          setSelectedKeys((current) => { const next = new Set(current); next.delete(key); return next; });
        } catch (error) {
          setSendMessage(`ส่ง Telegram แล้ว แต่เขียน 🔥SENT ไม่สำเร็จ (${row.order_number || key}) — อย่าส่งซ้ำ กด 🔥SENT เพื่อปิดรายการ`);
          await query.refetch();
          return;
        }
      }
      setSendMessage(`ส่งและเขียน 🔥SENT สำเร็จ ${completed} ออเดอร์ — ออกจากคิวแล้ว`);
      setSelectedKeys(new Set());
      setSelected(0);
      await query.refetch();
    } catch (error) {
      setSendMessage(`หยุดส่งหลัง ${completed}/${rowsToSend.length} ออเดอร์: ${error instanceof Error ? error.message : String(error)}`);
      await query.refetch();
    }
  }

  async function markSelectedOrdersSent() {
    if (!selectedOrders.length) { setSendMessage("ยังไม่ได้เลือกออเดอร์"); return; }
    if (room === "sent") { setSendMessage("รายการอยู่ในประวัติ 🔥SENT แล้ว"); return; }
    try {
      for (const row of selectedOrders) {
        if (!row.upsert_key) throw new Error("แถวที่เลือกไม่มี upsert_key เลยหยุดก่อน เพื่อไม่ให้ขึ้นว่าส่งแล้วทั้งที่ยังไม่ได้เขียน");
        await persistOrderSent(row);
        clearSentAwaitingStatus(orderKey(row));
      }
      setSendMessage(`เขียน 🔥SENT ลงโต๊ะหลักสำเร็จ ${selectedOrders.length} ออเดอร์ — ออกจากคิวเตือนแล้ว`);
      setSelectedKeys(new Set());
      await query.refetch();
    } catch (error) {
      setSendMessage(`บันทึก SENT ไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function markCurrentOrderSent() {
    if (room === "sent") { setSendMessage("รายการนี้อยู่ในประวัติ 🔥SENT แล้ว"); return; }
    if (!order?.upsert_key) { setSendMessage("ติ๊กส่งแล้วไม่ได้: ไม่พบ upsert_key"); return; }
    try {
      await persistOrderSent(order);
      clearSentAwaitingStatus(orderKey(order));
      setSendMessage("เขียน 🔥SENT ลงโต๊ะหลักสำเร็จ — รายการออกจากคิวเตือน");
      setSelectedKeys((current) => {
        const next = new Set(current);
        next.delete(orderKey(order));
        return next;
      });
      setSelected(0);
      await query.refetch();
    } catch (error) {
      setSendMessage(`ติ๊กส่งแล้วไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function returnCurrentOrderToQueue() {
    if (!order?.upsert_key) { setSendMessage("เปลี่ยนสถานะไม่ได้: ไม่พบ upsert_key"); return; }
    if (!isSent(order)) { setSendMessage("รายการนี้ยังไม่อยู่ในประวัติส่งแล้ว"); return; }
    const confirmed = window.confirm("นำรายการนี้กลับเข้าคิวรอส่งใช่ไหม? ถ้าส่งไปแล้ว อาจทำให้ส่งซ้ำได้");
    if (!confirmed) return;
    setStatusSaving(true);
    try {
      await updateBbOrderByKey(String(order.upsert_key), {
        telegram_sent: "false",
        telegram_status: "PENDING",
        delivery_status: "PENDING",
        delivery_state: "PENDING",
        sent_at: null,
        telegram_sent_at: null,
      }, sourceTableOf(order));
      setSendMessage("เปลี่ยนสถานะแล้ว — รายการกลับเข้าคิวรอส่ง");
      setSelectedKeys((current) => {
        const next = new Set(current);
        next.delete(orderKey(order));
        return next;
      });
      setSelected(0);
      setWarningsOnly(false);
      setRoom("queue");
    } catch (error) {
      setSendMessage(`เปลี่ยนสถานะไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    } finally { setStatusSaving(false); }
  }

  function toggleEditMessage() {
    if (editMode) {
      setEditMode(false);
      return;
    }
    setEditText(messagePreview);
    setEditMode(true);
  }

  async function saveOrderEdit() {
    if (!order?.upsert_key) { setSendMessage("บันทึกไม่ได้: ไม่พบ upsert_key ของออเดอร์"); return; }
    const text = editText.trim();
    if (!text) { setSendMessage("ข้อความส่งว่างอยู่ ยังบันทึกไม่ได้"); return; }
    setEditSaving(true);
    try {
      // Save only the final outgoing bill text; raw chat evidence and source fields remain untouched.
      const savedText = escapeTelegramHtml(text);
      await updateBbOrderByKey(String(order.upsert_key), { telegram_message_for_send_final: savedText }, sourceTableOf(order));
      setManualMessageOverrides((current) => ({ ...current, [orderKey(order)]: text }));
      setEditMode(false);
      setSendMessage(`บันทึกข้อความส่งสำเร็จลง ${sourceTableOf(order)} — ปุ่มส่งจะใช้ก้อนนี้`);
      await query.refetch();
    } catch (error) {
      setSendMessage(`บันทึกไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`);
    } finally { setEditSaving(false); }
  }

  async function runPostalSearch() {
    if (!postalQuery.trim()) { setPostalMatches([]); setPostalError("วางที่อยู่หรือพิมพ์รหัส ปณ. 5 หลักก่อน"); return; }
    setPostalLoading(true);
    setPostalError("");
    try {
      const rows = await searchThailandPostalMaster(postalQuery);
      setPostalMatches(rows);
      if (!rows.length) setPostalError("ไม่พบพื้นที่หรือรหัส ปณ. ที่ตรงกัน");
    } catch (error) {
      setPostalMatches([]);
      setPostalError(error instanceof Error ? error.message : String(error));
    } finally { setPostalLoading(false); }
  }

  function postalAddressText(row: PostalMasterMatch) {
    return [
      row.district ? `ต.${row.district}` : "",
      row.amphoe ? `อ.${row.amphoe}` : "",
      row.province ? `จ.${row.province}` : "",
      row.zipcode || "",
    ].filter(Boolean).join(" ");
  }

  async function copyPostalAddress(row: PostalMasterMatch) {
    const address = postalAddressText(row);
    if (!address) return;
    try {
      await navigator.clipboard?.writeText(address);
      setPostalError(`คัดลอกที่อยู่แล้ว: ${address}`);
    } catch {
      setPostalError("คัดลอกไม่ได้ — เลือกข้อความที่อยู่แล้วคัดลอกเองได้เลย");
    }
  }

  return (
    <div className="bb-telegram-room min-h-full space-y-5 text-white">
      <header className="relative overflow-hidden rounded-3xl border border-fuchsia-400/30 bg-[#10091c] p-6 shadow-2xl shadow-fuchsia-950/30">
        <div className="bb-running-line pointer-events-none absolute inset-x-0 top-0 h-1" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-300"><Send className="mr-2 inline h-4 w-4" />{room === "sent" ? "ANDROMEDA · SENT ROOM" : "PIONEER · HOLD QUEUE"}</p>
            <h1 className="cyber-title mt-3 text-3xl font-semibold">{room === "sent" ? "ห้องส่ง Telegram" : "คิวพัก · ดักสองชั้น"}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-100/75">{room === "sent" ? "รายการที่เข้าสายส่ง Telegram และอยู่ในสถานะส่งแล้ว" : "คิวพักก่อนส่งสำหรับตรวจบิลและดักข้อมูลสองชั้น"}</p>
            <div className="mt-4 flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center"><span className="whitespace-nowrap text-xs font-semibold text-fuchsia-200">หัวบิลสำรอง</span><Input value={header} onChange={(event) => setHeader(event.target.value)} aria-label="หัวบิลสำรอง ใช้เมื่อ stock_notice ว่าง" className="border-fuchsia-400/30 bg-black/30 text-fuchsia-50 placeholder:text-fuchsia-200/30" /><span className="whitespace-nowrap text-[10px] text-fuchsia-200/50">ใช้เมื่อ stock_notice ว่างเท่านั้น</span></div>
          </div>
          <div className="bb-clock-panel flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs"><span className="bb-running-light h-2 w-2 rounded-full" />{liveClockLabel(now)}</div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-orange-400/15 bg-black/25 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-orange-200/50">รอส่ง</p><p className="mt-1 text-2xl font-semibold text-orange-200">{waiting.length}</p></div>
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/50">ส่งแล้วในข้อมูลที่อ่าน</p><p className="mt-1 text-2xl font-semibold text-cyan-200">{allOrders.filter(isSent).length}</p></div>
          <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/5 p-3"><p className="text-[10px] uppercase tracking-[0.18em] text-fuchsia-200/50">อัปเดตล่าสุด</p><p className="mt-1 text-sm font-medium text-fuchsia-100">{query.data?.fetchedAt ? new Date(query.data.fetchedAt).toLocaleTimeString("th-TH") : "ยังไม่อ่าน"}</p></div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className={`relative overflow-hidden rounded-2xl border border-fuchsia-300/35 bg-[#0b0715]/90 px-4 py-4 text-center text-fuchsia-100 shadow-[inset_0_0_30px_rgba(168,85,247,.12),0_0_28px_rgba(168,85,247,.12)] ${lane.tone}`}><div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:18px_18px]" /><div className="bb-running-line absolute inset-x-0 top-0 h-px" /><p className="relative text-[10px] font-bold tracking-[0.28em] opacity-70">PACKING ZONE</p><div className="relative mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-fuchsia-300/70 text-3xl shadow-[0_0_24px_rgba(217,70,239,.55)] animate-pulse">▣</div><p className="relative mt-2 text-2xl font-black tracking-tight">{lane.label}</p><p className="relative text-[10px] font-bold tracking-[0.35em] opacity-70">{lane.mark}</p></div>
        <div className={`relative overflow-hidden rounded-2xl border border-fuchsia-300/45 bg-[#0b0715]/90 px-4 py-4 text-center text-fuchsia-100 shadow-[inset_0_0_34px_rgba(217,70,239,.18),0_0_34px_rgba(217,70,239,.22)] ${order ? deliveryStatus(order).tone : ""}`}><div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:18px_18px]" /><div className="bb-running-line absolute inset-x-0 top-0 h-px" /><p className="relative text-[10px] font-bold tracking-[0.28em] opacity-70">DELIVERY STATUS</p><div className="relative mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full border-2 border-fuchsia-200 text-4xl font-black shadow-[0_0_18px_rgba(244,114,182,.7),inset_0_0_18px_rgba(217,70,239,.45)] animate-pulse">{order ? (isSent(order) ? "✦" : "◉") : "—"}</div><p className="relative mt-2 text-3xl font-black tracking-tight text-fuchsia-50">{order ? deliveryStatus(order).label : "รอเลือก"}</p><p className="relative text-[10px] font-bold tracking-[0.22em] text-fuchsia-200/65">{order ? (isSent(order) ? "MISSION COMPLETE" : "QUEUE · READY TO LAUNCH") : "STANDBY"}</p></div>
        <div className={`relative overflow-hidden rounded-2xl border px-4 py-4 text-center text-white shadow-[inset_0_0_38px_rgba(255,30,140,.22),0_0_38px_rgba(255,20,130,.32)] ${selectedWarnings.length ? "border-rose-300/80 bg-gradient-to-br from-rose-950 via-[#190817] to-fuchsia-950" : "border-emerald-300/70 bg-gradient-to-br from-emerald-950 via-[#071a17] to-cyan-950 shadow-[inset_0_0_38px_rgba(52,211,153,.2),0_0_36px_rgba(34,211,238,.28)]"}`}><div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_15%_20%,rgba(255,255,255,.8)_1px,transparent_2px),radial-gradient(circle_at_75%_65%,rgba(255,255,255,.7)_1px,transparent_2px)] [background-size:34px_34px,46px_46px]" /><div className="bb-running-line absolute inset-x-0 top-0 h-1" /><p className="relative flex items-center justify-center gap-2 text-[10px] font-black tracking-[0.3em] text-rose-100"><AlertTriangle className="h-4 w-4" />WARNING RADAR</p><div className={`relative mx-auto mt-2 flex h-20 w-20 items-center justify-center rounded-full border-2 text-4xl font-black ${selectedWarnings.length ? "animate-pulse border-rose-200 text-rose-100 shadow-[0_0_34px_rgba(251,113,133,.9),inset_0_0_20px_rgba(244,63,94,.45)]" : "border-emerald-200 text-emerald-100 shadow-[0_0_32px_rgba(52,211,153,.75),inset_0_0_20px_rgba(16,185,129,.35)]"}`}>{selectedWarnings.length ? selectedWarnings.length : "✓"}</div><p className="relative mt-2 text-2xl font-black tracking-tight">{selectedWarnings.length ? `เตือน ${selectedWarnings.length} จุด` : "บิลนี้ผ่าน"}</p><p className="relative text-[10px] font-bold tracking-[0.2em] text-cyan-100/80">{warningCount} จุดเตือนในคิวทั้งหมด</p><div className="relative mt-2 max-h-16 overflow-auto text-left text-[10px] leading-4 text-rose-50/90">{selectedWarnings.length ? selectedWarningDetails.slice(0, 3).map((item) => <p key={item.code} className="truncate"><b>{item.severity === "BLOCK" ? "งดส่ง" : "ตรวจ"}</b> · {item.message}</p>) : <p className="text-center text-emerald-100">ยังไม่พบจุดเตือนในออเดอร์นี้</p>}</div></div>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[290px_minmax(0,1fr)_340px]">
        <Card className="rounded-3xl border-fuchsia-400/20 bg-[#10091c]">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="flex items-center gap-2 text-base text-fuchsia-100"><Clock3 className="h-4 w-4 text-fuchsia-300" />{room === "sent" ? "ประวัติส่งแล้ว" : "คิวตามเวลาจริง"}</CardTitle><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setRoom(room === "sent" ? "queue" : "sent")} className={room === "sent" ? "border-cyan-400/30 text-cyan-200" : "border-fuchsia-300/70 bg-fuchsia-600/25 text-fuchsia-50 shadow-[0_0_18px_rgba(217,70,239,.45)]"}>{room === "sent" ? "กลับคิวรอส่ง" : "ประวัติส่งแล้ว"}</Button><Button size="sm" variant="outline" onClick={() => query.refetch()} className="border-orange-400/20 text-orange-200"><RefreshCw className={`mr-1 h-3.5 w-3.5 ${query.isFetching ? "animate-spin" : ""}`} />รีเฟรช</Button></div></div>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาเลขออเดอร์ / ลูกค้า / สินค้า" className="border-orange-400/20 bg-black/40 text-orange-100 placeholder:text-orange-100/30" />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-orange-100/55"><span>แสดง {visibleWaiting.length} รายการ · เลือกแล้ว {selectedOrders.length}</span><div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={toggleAllVisible} className="h-7 border-cyan-400/30 px-2 text-[10px] text-cyan-200">{visibleWaiting.length > 0 && visibleWaiting.every((row) => selectedKeys.has(orderKey(row))) ? "ปิดเลือกทั้งหมด" : "เลือกทั้งหมด"}</Button>{selectedOrders.length > 0 && <Button size="sm" variant="outline" onClick={() => setSelectedKeys(new Set())} className="h-7 border-rose-300/30 px-2 text-[10px] text-rose-200">ล้างเลือก</Button>}<Button size="sm" onClick={sendSelectedOrders} disabled={!selectedOrders.length || room === "sent" || editMode || sendMessage.startsWith("กำลังปล่อยรัน")} className="h-7 border-fuchsia-300/50 bg-fuchsia-500/20 px-2 text-[10px] text-fuchsia-100">ปล่อยรัน ({selectedOrders.length})</Button><Button size="sm" onClick={markSelectedOrdersSent} disabled={!selectedOrders.length || room === "sent"} className="h-7 border-emerald-300/50 bg-emerald-500/20 px-2 text-[10px] text-emerald-100">🔥SENT</Button><Button size="sm" variant="outline" onClick={toggleWarningFilter} aria-pressed={warningsOnly} disabled={warningBillCount === 0 && !warningsOnly} className={`h-7 border px-2 text-[10px] ${warningsOnly ? "border-rose-300/50 bg-rose-500/20 text-rose-100" : "border-rose-400/30 text-rose-200"}`}><AlertTriangle className="mr-1 h-3 w-3" />{warningsOnly ? "ดูทุกบิล" : `บิลมีเตือน (${warningBillCount})`}</Button></div></div>
          </CardHeader>
          {room === "sent" && order && isSent(order) && <div className="px-6 pb-3"><Button onClick={returnCurrentOrderToQueue} disabled={statusSaving} className="w-full border border-fuchsia-300/50 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_18px_rgba(217,70,239,.24)] hover:bg-fuchsia-500/30">{statusSaving ? "กำลังเปลี่ยนสถานะ..." : "เปลี่ยนสถานะ · กลับเข้าคิวรอส่ง"}</Button></div>}
          <CardContent><div className={`mb-2 rounded-lg border px-3 py-2 text-[10px] ${dragSelecting ? "border-cyan-100/80 bg-cyan-300/20 text-cyan-50 shadow-[0_0_18px_rgba(34,211,238,.55)]" : "border-fuchsia-300/15 bg-fuchsia-400/5 text-fuchsia-100/60"}`}>{dragSelecting ? "กำลังลากเลือก — ปล่อยเมาส์เพื่อจบ" : "กดเมาส์ค้างแล้วลากผ่านการ์ด เพื่อเลือกหลายบิล"}</div><div className="max-h-[640px] space-y-2 overflow-auto pr-1">
            {query.isLoading && <div className="rounded-2xl border border-dashed border-orange-400/20 p-6 text-center text-sm text-orange-100/55">กำลังอ่านห้อง...</div>}
            {query.error && <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">อ่านข้อมูลไม่สำเร็จ: {String(query.error.message)}</div>}
            {!query.isLoading && !query.error && visibleWaiting.length === 0 && <div className="rounded-2xl border border-dashed border-emerald-400/20 p-6 text-center text-sm text-emerald-200/70">{warningsOnly ? "ไม่มีบิลที่มีคำเตือนในคิวนี้" : "คิวว่างแล้ว"}</div>}
            {visibleWaiting.map((item) => {
              const index = waiting.indexOf(item);
              const issues = issueOf(item);
              const warningDetails = getOrderWarnings(item);
              const warnings = warningDetails.map((warning) => warning.message);
              return <button type="button" key={item.upsert_key || item.order_number || item.id || index} aria-pressed={selectedKeys.has(orderKey(item))} onMouseDown={(event) => beginOrderDrag(event, item)} onMouseEnter={(event) => dragOverOrder(event, item)} onClick={(event) => selectOrder(event, item, index)} className={`w-full rounded-2xl border p-3 text-left transition-all duration-150 ${selectedKeys.has(orderKey(item)) ? "border-cyan-100/90 bg-gradient-to-r from-fuchsia-600/25 via-violet-500/20 to-cyan-500/25 shadow-[0_0_18px_rgba(34,211,238,.65),0_0_34px_rgba(217,70,239,.5)] ring-1 ring-fuchsia-100/70" : index === selected ? "border-orange-300/70 bg-orange-500/15 shadow-lg shadow-orange-950/20" : "border-white/10 bg-black/20 hover:border-orange-400/30"}`}>
                <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 font-mono text-xs text-orange-100"><span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-1 ${selectedKeys.has(orderKey(item)) ? "animate-pulse border-cyan-100 bg-cyan-300/25 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,.95)]" : "border-white/15 text-white/35"}`}>{selectedKeys.has(orderKey(item)) ? "✦" : "·"}</span>{item.order_number || item.upsert_key || `#${item.id ?? "?"}`}</span><span className="text-[10px] text-orange-100/45">{displayTime(item)}</span></div>
                <p className="mt-2 truncate text-xs text-orange-100/70">{productOf(item)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5"><span className={`rounded-full border px-2 py-0.5 text-[10px] ${deliveryStatus(item).tone}`}>{deliveryStatus(item).label}</span>{selectedKeys.has(orderKey(item)) && <span className="animate-pulse rounded-full border border-cyan-100/80 bg-cyan-300/20 px-2 py-0.5 text-[10px] font-bold text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,.7)]">✦ เลือกแล้ว</span>}{warningDetails.some((warning) => warning.severity === "BLOCK") && <span className="rounded-full border border-rose-200/50 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-100">งดส่ง</span>}{warnings.length > 0 && <span className="rounded-full border border-red-300/30 bg-red-400/10 px-2 py-0.5 text-[10px] text-red-200">เตือน {warnings.length}</span>}{issues.length > 0 && <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-200">ตรวจ {issues.length}</span>}</div><p className="mt-1 text-[10px] text-orange-100/40">{deliveryStatus(item).slogan}</p>
              </button>;
            })}
          </div></CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-3xl border-fuchsia-400/20 bg-[#10091c]"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base text-cyan-100"><Eye className="h-4 w-4 text-cyan-300" />ข้อมูลแต่งหล่อสำหรับส่ง <span className="ml-2 text-[10px] font-normal text-cyan-100/55">{displayTime(order)}</span></CardTitle><div className="flex flex-wrap gap-2"><Button onClick={sendCurrentOrder} disabled={!order || room === "sent" || isSent(order) || sentAwaitingStatusKeys.has(orderKey(order)) || editMode || sendMessage === "กำลังส่ง Telegram..."} className="bb-send-button"><Send className="mr-2 h-4 w-4" />{sendMessage === "กำลังส่ง Telegram..." ? "กำลังส่ง..." : "กดส่ง Telegram"}</Button><Button onClick={markCurrentOrderSent} disabled={!order || room === "sent" || statusSaving} className="border border-emerald-300/50 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"><CheckCircle2 className="mr-2 h-4 w-4" />{isSent(order) ? "🔥SENT · เขียนลงโต๊ะ" : "🔥SENT"}</Button><Button onClick={toggleEditMessage} disabled={!order || editSaving} variant="outline" className="bb-status-button">{editMode ? "ยกเลิกแก้" : "แก้ข้อความส่ง"}</Button><Button onClick={copyMessage} disabled={!order} variant="outline" className="bb-status-button"><Clipboard className="mr-2 h-4 w-4" />{copied ? "คัดลอกแล้ว" : "คัดลอกทั้งบิล"}</Button><Button variant="outline" onClick={() => setShowEvidence((value) => !value)} disabled={!order} className="border-cyan-400/20 text-cyan-200"><MessageSquareText className="mr-2 h-4 w-4" />{showEvidence ? "ซ่อนก้อนออเดอร์แท้" : "ก้อนออเดอร์แท้"}</Button></div></div>{sendMessage && <p className={`mt-3 rounded-xl border p-3 text-xs ${sendMessage.includes("สำเร็จ") ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>{sendMessage}</p>}</CardHeader><CardContent>
            {order ? <div className="grid gap-4">{editMode ? <textarea aria-label="ข้อความแต่งหล่อสำหรับส่ง Telegram" value={editText} onChange={(event) => setEditText(event.target.value)} className="min-h-[480px] w-full resize-y whitespace-pre-wrap rounded-2xl border border-cyan-300/70 bg-[#020812] p-5 font-mono text-sm leading-7 text-cyan-50 shadow-[inset_0_0_32px_rgba(34,211,238,.15),0_0_30px_rgba(34,211,238,.25)] outline-none focus:ring-2 focus:ring-fuchsia-300/70" /> : <pre className="min-h-[480px] whitespace-pre-wrap rounded-2xl border border-cyan-300/35 bg-black/55 p-5 text-sm leading-7 text-cyan-50 shadow-[inset_0_0_24px_rgba(34,211,238,.1),0_0_24px_rgba(34,211,238,.12)]">{messagePreview}</pre>}{editMode && <Button onClick={saveOrderEdit} disabled={editSaving || !editText.trim()} className="bb-save-button">{editSaving ? "กำลังบันทึก..." : "บันทึกข้อความส่ง"}</Button>}<div className="space-y-3"><div className="rounded-2xl border relative overflow-hidden border-cyan-300/45 bg-cyan-400/10 p-4 text-sm shadow-[inset_0_0_28px_rgba(34,211,238,.14),0_0_24px_rgba(34,211,238,.18)]"><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-200/80">จุดตรวจ</p><div className="mt-3 space-y-2"><p className="flex items-center gap-2 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4" />เวลาจริง: {displayTime(order)}</p><p className="flex items-center gap-2 text-xs text-cyan-200"><Sparkles className="h-4 w-4" />สินค้า: {productOf(order)}</p><p className="flex items-center gap-2 text-xs text-orange-100/70"><ShieldAlert className="h-4 w-4" />สถานะข้อมูล: {mappingLabel(order)}</p>{selectedWarnings.length > 0 && <div className="rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-xs text-red-100"><p className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />คำเตือนระบบ</p>{selectedWarningDetails.map((warning) => <p key={warning.code}><b>[{warning.severity === "BLOCK" ? "งดส่ง" : "ตรวจ"}]</b> {warning.message}</p>)}</div>}{selectedIssues.length > 0 ? <div className="rounded-xl border border-amber-300/20 bg-amber-400/10 p-3 text-xs text-amber-100"><p className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" />พบจุดต้องตรวจ</p>{selectedIssues.map((issue) => <p key={issue}>• {issue}</p>)}</div> : selectedWarnings.length === 0 && <p className="text-xs text-emerald-200">ไม่พบคำเตือนพื้นฐาน</p>}</div></div><div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-6 text-orange-100/65"><b className="text-orange-200">สถานะการส่ง</b><br /><span className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold ${deliveryStatus(order).tone}`}>{deliveryStatus(order).label}</span><p className="mt-2">{deliveryStatus(order).slogan}</p><p className="mt-1">{isSent(order) ? "รายการนี้ถูกทำเครื่องหมายส่งแล้ว" : "ส่งสำเร็จแล้วระบบจะเขียน 🔥SENT และเอาออกจากคิว"}</p></div></div></div> : <div className="rounded-2xl border border-dashed border-orange-400/20 p-10 text-center text-sm text-orange-100/55">เลือกออเดอร์จากคิวเพื่อดูรายละเอียด</div>}
          </CardContent></Card>

        </div>
        <div className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:self-start">
          <Card className="rounded-3xl border-fuchsia-300/30 bg-[#10091c] shadow-[0_0_24px_rgba(168,85,247,.12)]">
            <CardHeader className="pb-3"><CardTitle className="text-base text-fuchsia-100">⌕ ค้นหาเลข ปณ.</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={postalQuery} onChange={(event) => setPostalQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void runPostalSearch(); } }} placeholder="วางที่อยู่ หรือพิมพ์รหัส ปณ. 5 หลัก" aria-label="ค้นหารหัสไปรษณีย์จากที่อยู่หรือรหัส ปณ." className="border-cyan-300/25 bg-black/40 text-cyan-50 placeholder:text-cyan-100/35" />
              <div className="flex flex-wrap gap-2">
                <Button onClick={runPostalSearch} disabled={postalLoading} className="bg-fuchsia-500/25 text-fuchsia-100 hover:bg-fuchsia-500/35">{postalLoading ? "กำลังค้น..." : "ค้นเลข ปณ."}</Button>
                <Button variant="outline" disabled={!order} onClick={() => { setPostalQuery(String(order?.address_display_packer || order?.full_address || order?.addressclean || "")); setPostalError(""); }} className="border-cyan-300/30 text-cyan-100">ใช้ที่อยู่บิล</Button>
              </div>
              <p className="text-[10px] leading-4 text-cyan-100/45">ค้นเฉพาะ district · amphoe · province · zipcode จากตารางใน SB</p>
              {postalError && <p className={`rounded-lg border px-3 py-2 text-xs ${postalError.startsWith("คัดลอก") ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-200" : "border-orange-300/25 bg-orange-400/10 text-orange-100"}`}>{postalError}</p>}
              {postalMatches.length > 0 && <div className="max-h-64 space-y-2 overflow-auto pr-1">{postalMatches.map((row, index) => <div key={`${row.zipcode}-${row.district}-${index}`} className="rounded-xl border border-cyan-300/15 bg-black/30 p-3"><p className="text-xs text-cyan-100">{[row.district, row.amphoe, row.province].filter(Boolean).join(" · ") || "ไม่ระบุพื้นที่"}</p><div className="mt-2 flex items-center justify-between"><span className="font-mono text-lg font-semibold tracking-wider text-fuchsia-200">{row.zipcode || "—"}</span><Button size="sm" variant="outline" disabled={!postalAddressText(row)} onClick={() => void copyPostalAddress(row)} className="h-7 border-cyan-200/50 bg-cyan-400/10 px-2 text-[10px] text-cyan-50 shadow-[0_0_12px_rgba(34,211,238,.25)]">คัดลอกที่อยู่</Button></div></div>)}</div>}
            </CardContent>
          </Card>
          {order && showEvidence ? (
            <Card className="rounded-3xl border-cyan-400/25 bg-[#0d1015]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base text-cyan-100"><Eye className="h-4 w-4 text-cyan-300" />ก้อนออเดอร์แท้ · ORIGINAL</CardTitle></CardHeader>
              <CardContent>
                <pre className="max-h-[calc(100vh-280px)] min-h-[360px] overflow-auto whitespace-pre-wrap rounded-2xl border border-cyan-400/25 bg-black/55 p-4 text-xs leading-6 text-cyan-50 shadow-[inset_0_0_24px_rgba(34,211,238,.12)]">{originalOrderBlock(order)}</pre>
                <p className="mt-3 text-xs text-cyan-100/45">อ่านจากคอลัมน์ original · แก้ก้อนสำหรับส่งที่ช่องกลางเท่านั้น</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-3xl border-cyan-300/45 bg-[#06131c] shadow-[inset_0_0_30px_rgba(34,211,238,.15),0_0_32px_rgba(34,211,238,.22)]">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base text-cyan-100"><Eye className="h-4 w-4 text-cyan-300" />ก้อนออเดอร์แท้</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-cyan-100/70">{order ? "ก้อนออเดอร์แท้ถูกซ่อนไว้" : "เลือกบิลก่อนเพื่อดูก้อนออเดอร์แท้"}</p><Button onClick={() => setShowEvidence(true)} disabled={!order} className="mt-3 border border-cyan-300/50 bg-cyan-400/15 text-cyan-100 hover:bg-cyan-400/25">เปิดก้อนออเดอร์แท้ด้านขวา</Button></CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="rounded-3xl border-fuchsia-400/15 bg-[#100b15]"><CardHeader><CardTitle className="flex items-center gap-2 text-base text-fuchsia-100"><ShieldAlert className="h-4 w-4 text-fuchsia-300" />สรุปคิวตามจังหวัด</CardTitle></CardHeader><CardContent><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{provinceSummary.length === 0 ? <p className="text-sm text-fuchsia-100/55">ยังไม่มีจังหวัดในคิว</p> : provinceSummary.map(([province, count]) => <div key={province} className="flex items-center justify-between rounded-2xl border border-fuchsia-400/10 bg-black/25 px-4 py-3"><span className="text-sm text-fuchsia-100/75">{province}</span><span className="font-mono text-lg text-fuchsia-200">{count}</span></div>)}</div><p className="mt-4 text-xs text-fuchsia-100/40">จังหวัดอยู่ด้านล่างเพื่อไม่แย่งความสำคัญจากงานตรวจและส่งออเดอร์</p></CardContent></Card>
    </div>
  );
}
