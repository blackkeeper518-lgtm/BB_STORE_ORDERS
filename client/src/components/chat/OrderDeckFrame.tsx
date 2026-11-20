import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildOrderDeckContextMessage } from "@/lib/order-deck-context";

type OrderDeckFrameProps = {
  pageId: string;
  pageName: string;
  threadId: string;
  customerName: string;
  customerPhone: string;
  selectedCustomerMessage: string;
  messageMode?: "manual" | "latest";
  messageRequest?: { id: number } | null;
  onMessageRequestHandled?: (id: number) => void;
  onProductImagesSelected?: (imageUrls: string[], productName?: string) => void | Promise<void>;
  onProductIndexReady?: (products: Array<{ product: string; terms: string[] }>) => void;
  productImagesRequest?: { id: number; product: string } | null;
  onSummaryReady?: (summary: string) => void;
  roomStatus?: string;
  onClose: () => void;
};

export function OrderDeckFrame(props: OrderDeckFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const currentProps = useRef(props);
  const handledMessageRequestId = useRef<number | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  currentProps.current = props;

  const sendContext = useCallback((importSelectedCustomerMessage = false) => {
    const target = frameRef.current?.contentWindow;
    if (!target || typeof window === "undefined") return;
    target.postMessage(
      buildOrderDeckContextMessage({
        pageName: currentProps.current.pageName,
        selectedCustomerMessage: currentProps.current.selectedCustomerMessage,
      }, importSelectedCustomerMessage),
      window.location.origin,
    );
  }, []);

  const requestProductIndex = useCallback(() => {
    const target = frameRef.current?.contentWindow;
    if (!target || typeof window === "undefined") return;
    target.postMessage({ type: "BB_ORDER_DECK_REQUEST_PRODUCT_INDEX" }, window.location.origin);
  }, []);

  useEffect(() => {
    const request = props.messageRequest;
    if (!frameReady || !request || handledMessageRequestId.current === request.id) return;
    handledMessageRequestId.current = request.id;
    sendContext(true);
    currentProps.current.onMessageRequestHandled?.(request.id);
  }, [frameReady, props.messageRequest, sendContext]);

  useEffect(() => {
    sendContext(false);
  }, [props.pageId, props.pageName, props.threadId, sendContext]);

  useEffect(() => {
    const request = props.productImagesRequest;
    if (!frameReady || !request) return;
    frameRef.current?.contentWindow?.postMessage({ type: "BB_ORDER_DECK_REQUEST_PRODUCT_IMAGES", product: request.product }, window.location.origin);
  }, [frameReady, props.productImagesRequest?.id, props.productImagesRequest?.product]);

  useEffect(() => {
    const receiveDeckMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || event.origin !== window.location.origin) return;
      if (event.data?.type === "BB_ORDER_DECK_PRODUCT_INDEX") {
        const products = Array.isArray(event.data.products)
          ? event.data.products.filter((item: unknown): item is { product: string; terms: unknown[] } => Boolean(item && typeof item === "object" && typeof (item as { product?: unknown }).product === "string" && Array.isArray((item as { terms?: unknown }).terms)))
            .map((item: { product: string; terms: unknown[] }) => ({ product: item.product.slice(0, 120), terms: item.terms.filter((term): term is string => typeof term === "string").slice(0, 32).map(term => term.slice(0, 160)) }))
            .slice(0, 500)
          : [];
        currentProps.current.onProductIndexReady?.(products);
        return;
      }
      if (event.data?.type === "BB_ORDER_DECK_ORDER_SUMMARY") {
        const summary = typeof event.data.summary === "string" ? event.data.summary.trim().slice(0, 20_000) : "";
        if (summary) currentProps.current.onSummaryReady?.(summary);
        return;
      }
      if (event.data?.type !== "BB_ORDER_DECK_PRODUCT_IMAGES") return;
      const urls = Array.isArray(event.data.imageUrls)
        ? event.data.imageUrls.filter((url: unknown): url is string => typeof url === "string" && (/^https?:\/\//i.test(url) || (url.length <= 8_100_000 && /^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(url)))).slice(0, 4)
        : [];
      if (urls.length) currentProps.current.onProductImagesSelected?.(urls, typeof event.data.product === "string" ? event.data.product : undefined);
    };
    window.addEventListener("message", receiveDeckMessage);
    return () => window.removeEventListener("message", receiveDeckMessage);
  }, []);

  return <section className="flex h-full min-h-0 min-w-0 flex-col gap-2 bg-[#080b14] p-3">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-violet-300/15 pb-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.14em] text-violet-200">DRΛKSIDE · ORDER DECK</p>
        <p className="mt-1 truncate text-[10px] text-cyan-100/55">{props.pageName || "ไม่ระบุเพจ"} · {props.customerName || "ลูกค้า"}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[9px] text-emerald-200/75"><span aria-hidden="true">●</span><span>{props.roomStatus || "ห้องพร้อมใช้งาน"}</span><span className="text-cyan-100/35">· ROOM {props.threadId.slice(-6)}</span></p>
        <p className="mt-1 max-w-[360px] truncate text-[9px] text-fuchsia-100/55" title={props.selectedCustomerMessage || (props.messageMode === "latest" ? "ยังไม่มีข้อความลูกค้าล่าสุดที่นำเข้าได้" : "ยังไม่ได้เลือกข้อความจากแชท")}>
          {props.selectedCustomerMessage ? `${props.messageMode === "latest" ? "ข้อความล่าสุดที่ดึง" : "ข้อความที่เลือก"}: ${props.selectedCustomerMessage}` : (props.messageMode === "latest" ? "ยังไม่มีข้อความลูกค้าล่าสุดที่นำเข้าได้" : "ยังไม่ได้เลือกข้อความจากแชท")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {props.messageMode !== "latest" ? <Button type="button" size="sm" variant="outline" disabled={!frameReady || !props.selectedCustomerMessage.trim()} onClick={() => sendContext(true)} className="chat-tool-action h-8 px-2" title="เติมชื่อเพจและแทนที่ข้อความเดิมด้วยข้อความที่เลือกเพียงอันเดียว">ดึงข้อมูลลูกค้า</Button> : null}
        <Button type="button" size="sm" variant="outline" onClick={props.onClose} className="chat-tool-action h-8 w-8 px-0" aria-label="ปิด Order Deck">✕</Button>
      </div>
    </div>
    <iframe
      ref={frameRef}
      src="/order-deck.html?embedded=1"
      title="DRΛKSIDE Order Deck — เครื่องมือสรุปบิล"
      onLoad={() => { setFrameReady(true); sendContext(false); requestProductIndex(); }}
      className="min-h-0 w-full flex-1 rounded-lg border border-violet-300/15 bg-[#0b0b15]"
    />
    <p className="shrink-0 text-[9px] leading-4 text-cyan-100/40">{props.messageMode === "latest" ? "ปุ่ม “ดึงล่าสุด · บิล” จะนำข้อความลูกค้าล่าสุดที่ใช้ได้เข้าร่างเมื่อกดเท่านั้น · ข้อความภาพ/สติ๊กเกอร์จะไม่ใช้ข้อความเก่าทดแทน · ไม่ส่งแชทอัตโนมัติ" : "เปิดแผงไม่ดึงข้อมูล · เลือกข้อความในแชท แล้วกด “ดึงข้อมูลลูกค้า” เพื่อเติมชื่อเพจและแทนที่ข้อความเดิมด้วยข้อความนั้นเพียงอันเดียว · ไม่ส่งแชทอัตโนมัติ"}</p>
  </section>;
}
