import type { DeckImageProduct } from "@/lib/order-deck-product-index";
import { LoaderCircle } from "lucide-react";

type MobileInboxProductDockProps = {
  products: DeckImageProduct[];
  collapsed: boolean;
  disabled: boolean;
  busy?: boolean;
  loadingProduct?: string | null;
  onSelect: (product: string) => void;
  onToggleCollapsed: () => void;
};

export function MobileInboxProductDock({ products, collapsed, disabled, busy = false, loadingProduct, onSelect, onToggleCollapsed }: MobileInboxProductDockProps) {
  if (collapsed) return <button type="button" className={`mobile-inbox-product-dock__reopen${busy ? " is-loading" : ""}`} onClick={onToggleCollapsed} aria-label="เปิดสินค้าไฮไลท์" aria-busy={busy}>
    <span aria-hidden="true">📌</span> สินค้าไฮไลท์ <span className="mobile-inbox-product-dock__sparkle" aria-hidden="true">✦</span>
  </button>;
  return <aside aria-label="สินค้าไฮไลท์ที่ปักหมุดสำหรับแชท" className="mobile-inbox-product-dock">
    <div className="mobile-inbox-product-dock__panel">
      <div className="mobile-inbox-product-dock__header">
        <span>📌 สินค้าไฮไลท์</span>
        <button type="button" className={busy ? "is-loading" : ""} onClick={onToggleCollapsed} aria-label="ยุบสินค้าไฮไลท์" aria-busy={busy}>ยุบ −</button>
      </div>
      {products.length ? <div className="mobile-inbox-product-dock__items">
        {products.map(item => <button key={item.product} type="button" onClick={() => onSelect(item.product)} disabled={disabled} title={`เตรียมรูป ${item.product} · ยังไม่ส่ง`}>
          <span className="mobile-inbox-product-dock__thumb"><img src={item.imageUrls[0]} alt="" loading="lazy" />{loadingProduct === item.product ? <LoaderCircle className="mobile-inbox-product-dock__loader" aria-label="กำลังโหลดภาพสินค้า" /> : null}</span>
          <span>{item.product}</span>
        </button>)}
      </div> : <p className="mobile-inbox-product-dock__empty">{busy ? "กำลังโหลดรูปและข้อความ…" : "ยังไม่พบรูปภาพที่ปักหมุดในห้องนี้"}</p>}
    </div>
  </aside>;
}
