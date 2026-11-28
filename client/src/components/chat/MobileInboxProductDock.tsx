import type { DeckImageProduct } from "@/lib/order-deck-product-index";
import { LoaderCircle } from "lucide-react";

type MobileInboxProductDockProps = {
  products: DeckImageProduct[];
  visible: boolean;
  collapsed: boolean;
  disabled: boolean;
  loadingProduct?: string | null;
  onSelect: (product: string) => void;
  onToggleCollapsed: () => void;
};

export function MobileInboxProductDock({
  products,
  visible,
  collapsed,
  disabled,
  loadingProduct,
  onSelect,
  onToggleCollapsed,
}: MobileInboxProductDockProps) {
  const isLoading = Boolean(loadingProduct);
  const loadingLabel = loadingProduct ? `กำลังโหลดภาพ ${loadingProduct}…` : "";

  if ((!visible && !isLoading) || (!products.length && !isLoading)) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        className={`mobile-inbox-product-dock__reopen${isLoading ? " is-loading" : ""}`}
        onClick={onToggleCollapsed}
        aria-label={isLoading ? `${loadingLabel} · แตะเพื่อเปิดสินค้าไฮไลท์` : "เปิดสินค้าไฮไลท์"}
        aria-busy={isLoading}
        title={isLoading ? loadingLabel : "เปิดสินค้าไฮไลท์"}
      >
        {isLoading ? (
          <LoaderCircle className="mobile-inbox-product-dock__loading-icon" aria-hidden="true" />
        ) : (
          <span aria-hidden="true">📌</span>
        )}
        <span className={isLoading ? "mobile-inbox-product-dock__loading-text" : ""}>
          {isLoading ? loadingLabel : "สินค้าไฮไลท์"}
        </span>
        <span className="mobile-inbox-product-dock__sparkle" aria-hidden="true">✦</span>
      </button>
    );
  }

  return (
    <aside aria-label="สินค้าไฮไลท์ที่ปักหมุดสำหรับแชท" aria-busy={isLoading} className="mobile-inbox-product-dock">
      <div className={`mobile-inbox-product-dock__panel${isLoading ? " is-loading" : ""}`}>
        <div className="mobile-inbox-product-dock__header">
          <span>📌 สินค้าไฮไลท์</span>
          <button type="button" onClick={onToggleCollapsed} aria-label="ยุบสินค้าไฮไลท์">ยุบ −</button>
        </div>
        {isLoading ? (
          <div className="mobile-inbox-product-dock__loading-status" role="status" aria-live="polite">
            <LoaderCircle className="mobile-inbox-product-dock__loading-icon" aria-hidden="true" />
            <span className="mobile-inbox-product-dock__loading-text">{loadingLabel}</span>
          </div>
        ) : null}
        <div className="mobile-inbox-product-dock__items">
          {products.map((item) => (
            <button
              key={item.product}
              type="button"
              onClick={() => onSelect(item.product)}
              disabled={disabled || isLoading}
              className={loadingProduct === item.product ? "is-loading" : ""}
              title={loadingProduct === item.product ? loadingLabel : `เตรียมรูป ${item.product} · ยังไม่ส่ง`}
              aria-busy={loadingProduct === item.product}
            >
              <span className="mobile-inbox-product-dock__thumb">
                <img src={item.imageUrls[0]} alt="" loading="lazy" />
                {loadingProduct === item.product ? (
                  <LoaderCircle className="mobile-inbox-product-dock__loader" aria-label="กำลังโหลดภาพสินค้า" />
                ) : null}
              </span>
              <span>{item.product}{loadingProduct === item.product ? <small className="mobile-inbox-product-dock__item-loading-label">กำลังโหลดภาพ…</small> : null}</span>
              {loadingProduct === item.product ? <span className="mobile-inbox-product-dock__item-sparkle" aria-hidden="true">✦</span> : null}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
