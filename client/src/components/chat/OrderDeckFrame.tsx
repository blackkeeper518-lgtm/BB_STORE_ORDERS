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

  return <section className="min-w-0 space-y-2 rounded-xl border border-violet-300/15 bg-black/15 p-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="chat-tools-section-title">DRΛKSIDE · ORDER DECK</p>
        <p className="mt-1 truncate text-[9px] text-cyan-100/45">เพจปัจจุบัน · {props.pageName || "ไม่ระบุเพจ"}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={props.customerMessages.length === 0}
        onClick={() => sendContext(true)}
        className="chat-tool-action h-8 px-2"
        title="นำข้อความฝั่งลูกค้าจากห้องนี้เข้าเครื่องมือสรุปบิล"
      >
        ดึงข้อความลูกค้า
      </Button>
    </div>
    <iframe
      ref={frameRef}
      src="/order-deck.html?embedded=1"
      title="DRΛKSIDE Order Deck — เครื่องมือสรุปบิล"
      onLoad={() => sendContext(false)}
      className="h-[66dvh] min-h-[520px] w-full rounded-lg border border-violet-300/15 bg-[#0b0b15]"
    />
    <p className="text-[9px] leading-4 text-cyan-100/40">ดึงเฉพาะข้อความฝั่งลูกค้า · ตรวจข้อมูลก่อนคัดลอก · ไม่บันทึกออเดอร์และไม่ส่งแชทอัตโนมัติ</p>
  </section>;
}
