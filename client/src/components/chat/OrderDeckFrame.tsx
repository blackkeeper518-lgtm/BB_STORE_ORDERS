import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { buildOrderDeckContextMessage } from "@/lib/order-deck-context";

type OrderDeckFrameProps = {
  pageId: string;
  pageName: string;
  threadId: string;
  customerName: string;
  customerPhone: string;
  customerMessages: string[];
  importKey: number;
  onClose: () => void;
};

export function OrderDeckFrame(props: OrderDeckFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const currentProps = useRef(props);
  currentProps.current = props;

  const sendContext = useCallback((importCustomerMessages = false) => {
    const target = frameRef.current?.contentWindow;
    if (!target || typeof window === "undefined") return;
    target.postMessage(
      buildOrderDeckContextMessage(currentProps.current, importCustomerMessages),
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    sendContext(false);
  }, [props.pageId, props.pageName, props.threadId, sendContext]);

  useEffect(() => {
    if (props.importKey > 0) sendContext(true);
  }, [props.importKey, sendContext]);

  return <section className="flex h-full min-h-0 min-w-0 flex-col gap-2 bg-[#080b14] p-3">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-violet-300/15 pb-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.14em] text-violet-200">DRΛKSIDE · ORDER DECK</p>
        <p className="mt-1 truncate text-[10px] text-cyan-100/55">{props.pageName || "ไม่ระบุเพจ"} · {props.customerName || "ลูกค้า"}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={props.customerMessages.length === 0} onClick={() => sendContext(true)} className="chat-tool-action h-8 px-2" title="นำข้อความฝั่งลูกค้าจากห้องนี้เข้าเครื่องมือสรุปบิล">ดึงข้อความลูกค้า</Button>
        <Button type="button" size="sm" variant="outline" onClick={props.onClose} className="chat-tool-action h-8 w-8 px-0" aria-label="ปิด Order Deck">✕</Button>
      </div>
    </div>
    <iframe
      ref={frameRef}
      src="/order-deck.html?embedded=1"
      title="DRΛKSIDE Order Deck — เครื่องมือสรุปบิล"
      onLoad={() => sendContext(currentProps.current.importKey > 0)}
      className="min-h-0 w-full flex-1 rounded-lg border border-violet-300/15 bg-[#0b0b15]"
    />
    <p className="shrink-0 text-[9px] leading-4 text-cyan-100/40">ดึงเฉพาะข้อความฝั่งลูกค้า · ตรวจข้อมูลก่อนคัดลอก · ไม่บันทึกออเดอร์และไม่ส่งแชทอัตโนมัติ</p>
  </section>;
}
