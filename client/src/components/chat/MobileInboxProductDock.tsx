import type { DeckImageProduct } from "@/lib/order-deck-product-index";

type MobileInboxProductDockProps = {
  products: DeckImageProduct[];
  visible: boolean;
  dismissed: boolean;
  collapsed: boolean;
  disabled: boolean;
  onSelect: (product: string) => void;
  onToggleCollapsed: () => void;
};

export function MobileInboxProductDock({ products, visible, dismissed, collapsed, disabled, onSelect, onToggleCollapsed }: MobileInboxProductDockProps) {
  if (!visible || dismissed || products.length === 0) return null;
  if (collapsed) return <button type="button" className="mobile-inbox-product-dock__reopen" onClick={onToggleCollapsed} aria-label="เปิดสินค้าไฮไลท์">
    <span aria-hidden="true">📌</span> สินค้าไฮไลท์ <span className="mobile-inbox-product-dock__sparkle" aria-hidden="true">✦</span>
  </button>;
  return <aside aria-label="สินค้าไฮไลท์ที่ปักหมุดสำหรับแชท" className="mobile-inbox-product-dock">
    <div className="mobile-inbox-product-dock__panel">
      <div className="mobile-inbox-product-dock__header">
        <span>📌 สินค้าไฮไลท์</span>
        <button type="button" onClick={onToggleCollapsed} aria-label="ยุบสินค้าไฮไลท์">ยุบ −</button>
      </div>
      <div className="mobile-inbox-product-dock__items">
        {products.map(item => <button key={item.product} type="button" onClick={() => onSelect(item.product)} disabled={disabled} title={`เตรียมรูป ${item.product} · ยังไม่ส่ง`}>
          <img src={item.imageUrls[0]} alt="" loading="lazy" />
          <span>{item.product}</span>
        </button>)}
      </div>
    </div>
  </aside>;
}
