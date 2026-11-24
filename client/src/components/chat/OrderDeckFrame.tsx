import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildOrderDeckContextMessage } from "@/lib/order-deck-context";
import { isUsableDeckProductImageUrl } from "@/lib/order-deck-product-index";
import { projectApi } from "@/lib/server-project-client";
import { useGlobalThemeRuntime } from "@/contexts/GlobalThemeRuntime";

type OrderDeckFrameProps = {
  pageId: string;
  pageName: string;
  threadId: string;
  customerName: string;
  customerPhone: string;
  selectedCustomerMessage: string;
  messageMode?: "manual" | "latest";
  messageRequest?: { id: number; clearMessage?: boolean } | null;
  onMessageRequestHandled?: (id: number) => void;
  onProductImagesSelected?: (imageUrls: string[], productName?: string) => void | Promise<void>;
  onProductSelected?: (payload: { product: string; textVariants: string[]; productInfo: Record<string, unknown>; imageUrls: string[] }) => void | Promise<void>;
  onProductIndexReady?: (products: Array<{ product: string; terms: string[]; imageUrls: string[]; featured: boolean }>) => void;
  sharedHighlights?: { configured: boolean; productNames: string[] };
  onFeaturedProductsChange?: (productNames: string[]) => void;
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
  const { theme } = useGlobalThemeRuntime();
  currentProps.current = props;

  const sendContext = useCallback((importSelectedCustomerMessage = false, clearSelectedCustomerMessage = false) => {
    const target = frameRef.current?.contentWindow;
    if (!target || typeof window === "undefined") return;
    target.postMessage(
      buildOrderDeckContextMessage({
        pageName: currentProps.current.pageName,
        selectedCustomerMessage: currentProps.current.selectedCustomerMessage,
      }, importSelectedCustomerMessage, clearSelectedCustomerMessage),
      window.location.origin,
    );
  }, []);

  const requestProductIndex = useCallback(() => {
    const target = frameRef.current?.contentWindow;
    if (!target || typeof window === "undefined") return;
    target.postMessage({ type: "ST_ORDER_DECK_REQUEST_PRODUCT_INDEX", pageId: currentProps.current.pageId, pageName: currentProps.current.pageName }, window.location.origin);
  }, []);

  const sendSharedRuntime = useCallback(() => {
    const target = frameRef.current?.contentWindow;
    if (!target || typeof window === "undefined") return;
    target.postMessage({
      type: "ST_SHARED_RUNTIME",
      theme: {
        themeKey: theme.themeKey,
        bg: theme.bg,
        surface: theme.surface,
        primary: theme.primary,
        accent: theme.accent,
        textPrimary: theme.textPrimary,
        textSecondary: theme.textSecondary,
        fontBody: theme.fontBody,
        fontHeading: theme.fontHeading,
        graphicUrl: theme.graphicUrl,
        radius: theme.radius,
        glow: theme.glow,
        motion: theme.motion,
      },
    }, window.location.origin);
  }, [theme]);

  const handleServerRelay = useCallback(async (event: MessageEvent) => {
    const target = frameRef.current?.contentWindow;
    if (!target || event.source !== target || event.origin !== window.location.origin || event.data?.type !== "ST_ORDER_DECK_SERVER_REQUEST") return;
    const requestId = typeof event.data.requestId === "string" ? event.data.requestId.slice(0, 100) : "";
    const operation = String(event.data.operation || "");
    const input = event.data.input && typeof event.data.input === "object" ? event.data.input as Record<string, unknown> : {};
    if (!requestId) return;
    try {
      let result: unknown;
      if (operation === "serverStatus") {
        result = await projectApi.projects.status.query();
      } else if (operation === "postalSearch") {
        const allowed = new Set(["district", "amphoe", "province", "zipcode", "or"]);
        const filters = input.filters && typeof input.filters === "object" ? input.filters as Record<string, unknown> : {};
        const params: Record<string, string> = { select: "district,amphoe,province,zipcode", limit: String(Math.max(1, Math.min(100, Number(input.limit) || 40))) };
        for (const [key, value] of Object.entries(filters)) {
          if (!allowed.has(key) || typeof value !== "string" || value.length > 500) throw new Error("Invalid postal search filter");
          params[key] = value;
        }
        result = await projectApi.projects.execute.mutate({ project: "vault", table: "thailand_address_master", method: "GET", params });
      } else if (operation === "parcelLookup") {
        result = await projectApi.projects.parcelLookup.mutate({ phone: String(input.phone || "").slice(0, 24) });
      } else if (operation === "productCatalog") {
        result = await projectApi.projects.execute.mutate({ project: "vault", table: "🛒product_master", method: "GET", params: { select: "emoji,master_sku,th_name,name_standard,brand,variant,unit_price,alias,status", status: "eq.ACTIVE", order: "th_name.asc", limit: "500" } });
      } else if (operation === "scriptCardsList") {
        const offset = Math.max(0, Math.min(4500, Math.floor(Number(input.offset) || 0)));
        result = await projectApi.projects.execute.mutate({ project: "vault", table: "sales_script_cards", method: "GET", params: { select: "id,sku,title,blocks_json,updated_at", order: "updated_at.desc", limit: "500", offset: String(offset) } });
      } else if (operation === "scriptCardByTitle") {
        const title = String(input.title || "").trim().slice(0, 160);
        result = await projectApi.projects.execute.mutate({ project: "vault", table: "sales_script_cards", method: "GET", params: { select: "id,title,subtitle,script_text,ai_context,ai_instruction,blocks_json,status,version,updated_at", title: `eq.${title}`, order: "updated_at.desc", limit: "1" } });
      } else if (operation === "updateScriptCard") {
        const id = Math.floor(Number(input.id));
        const body = input.body && typeof input.body === "object" ? input.body : {};
        result = await projectApi.projects.execute.mutate({ project: "vault", table: "sales_script_cards", method: "PATCH", params: { id: `eq.${id}`, select: "id" }, body, prefer: "return=representation" });
      } else if (operation === "insertScriptCard") {
        result = await projectApi.projects.execute.mutate({ project: "vault", table: "sales_script_cards", method: "POST", params: { select: "id" }, body: input.body, prefer: "return=minimal" });
      } else if (operation === "uploadWarpImage") {
        const path = String(input.path || "");
        const contentBase64 = String(input.contentBase64 || "");
        const contentType = String(input.contentType || "image/webp").slice(0, 120);
        result = await projectApi.projects.storage.mutate({ operation: "upload", bucket: "warp-images", path, contentBase64, contentType, upsert: false });
      } else {
        throw new Error("Unsupported Order Deck server operation");
      }
      target.postMessage({ type: "ST_ORDER_DECK_SERVER_RESPONSE", requestId, ok: true, result }, window.location.origin);
    } catch (error) {
      target.postMessage({ type: "ST_ORDER_DECK_SERVER_RESPONSE", requestId, ok: false, error: error instanceof Error ? error.message : String(error) }, window.location.origin);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleServerRelay);
    return () => window.removeEventListener("message", handleServerRelay);
  }, [handleServerRelay]);

  useEffect(() => {
    const request = props.messageRequest;
    if (!frameReady || !request || handledMessageRequestId.current === request.id) return;
    handledMessageRequestId.current = request.id;
    sendContext(request.clearMessage !== true, request.clearMessage === true);
    currentProps.current.onMessageRequestHandled?.(request.id);
  }, [frameReady, props.messageRequest, sendContext]);

  useEffect(() => {
    sendContext(false);
    sendSharedRuntime();
    requestProductIndex();
  }, [props.pageId, props.pageName, props.threadId, sendContext, sendSharedRuntime, requestProductIndex]);

  useEffect(() => {
    if (!frameReady || !props.sharedHighlights?.configured) return;
    frameRef.current?.contentWindow?.postMessage({ type: "ST_ORDER_DECK_APPLY_FEATURED_PRODUCTS", productNames: props.sharedHighlights.productNames.slice(0, 30) }, window.location.origin);
  }, [frameReady, props.sharedHighlights]);

  useEffect(() => {
    const request = props.productImagesRequest;
    if (!frameReady || !request) return;
    frameRef.current?.contentWindow?.postMessage({ type: "ST_ORDER_DECK_REQUEST_PRODUCT_IMAGES", product: request.product }, window.location.origin);
  }, [frameReady, props.productImagesRequest?.id, props.productImagesRequest?.product]);

  useEffect(() => {
    const receiveDeckMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || event.origin !== window.location.origin) return;
      if (event.data?.type === "ST_ORDER_DECK_PRODUCT_INDEX") {
        const responsePageId = typeof event.data.pageId === "string" ? event.data.pageId : "";
        if (responsePageId && responsePageId !== currentProps.current.pageId) return;
        const products = Array.isArray(event.data.products)
          ? event.data.products.filter((item: unknown): item is { product: string; terms: unknown[]; imageUrls?: unknown[]; featured?: boolean } => Boolean(item && typeof item === "object" && typeof (item as { product?: unknown }).product === "string" && Array.isArray((item as { terms?: unknown }).terms)))
            .map((item: { product: string; terms: unknown[]; imageUrls?: unknown[]; featured?: boolean }) => ({ product: item.product.slice(0, 120), terms: item.terms.filter((term): term is string => typeof term === "string").slice(0, 32).map(term => term.slice(0, 160)), imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls.filter((url): url is string => typeof url === "string" && isUsableDeckProductImageUrl(url)).slice(0, 4) : [], featured: Boolean(item.featured) }))
            .slice(0, 500)
          : [];
        currentProps.current.onProductIndexReady?.(products);
        return;
      }
      if (event.data?.type === "ST_ORDER_DECK_FEATURED_PRODUCTS_UPDATED") {
        const productNames: string[] = Array.isArray(event.data.productNames)
          ? Array.from(new Set<string>((event.data.productNames as unknown[]).filter((name): name is string => typeof name === "string").map(name => name.trim().slice(0, 120)).filter(Boolean))).slice(0, 30)
          : [];
        currentProps.current.onFeaturedProductsChange?.(productNames);
        return;
      }
      if (event.data?.type === "ST_ORDER_DECK_ORDER_SUMMARY") {
        const summary = typeof event.data.summary === "string" ? event.data.summary.trim().slice(0, 20_000) : "";
        if (summary) currentProps.current.onSummaryReady?.(summary);
        return;
      }
      if (event.data?.type === "ST_ORDER_DECK_PRODUCT_SELECTED") {
        const product = typeof event.data.product === "string" ? event.data.product.trim().slice(0, 160) : "";
        if (!product) return;
        const imageUrls = Array.isArray(event.data.imageUrls)
          ? event.data.imageUrls.filter((url: unknown): url is string => typeof url === "string" && (/^https?:\/\//i.test(url) || (url.length <= 8_100_000 && /^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(url)))).slice(0, 4)
          : [];
        const textVariants = Array.isArray(event.data.textVariants)
          ? event.data.textVariants.filter((text: unknown): text is string => typeof text === "string" && Boolean(text.trim())).map(text => text.trim().slice(0, 8_000)).slice(0, 3)
          : [];
        const productInfo = event.data.productInfo && typeof event.data.productInfo === "object" ? event.data.productInfo as Record<string, unknown> : {};
        currentProps.current.onProductSelected?.({ product, textVariants, productInfo, imageUrls });
        if (imageUrls.length) currentProps.current.onProductImagesSelected?.(imageUrls, product);
        return;
      }
      if (event.data?.type !== "ST_ORDER_DECK_PRODUCT_IMAGES") return;
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
      onLoad={() => { setFrameReady(true); sendContext(false); sendSharedRuntime(); requestProductIndex(); }}
      className="min-h-0 w-full flex-1 rounded-lg border border-violet-300/15 bg-[#0b0b15]"
    />
    <p className="shrink-0 text-[9px] leading-4 text-cyan-100/40">{props.messageMode === "latest" ? "เมื่อเปิด Deck ระบบดึงข้อความลูกค้าล่าสุดที่ใช้สรุปได้เข้าร่างทันที · จะไม่ใช้ข้อความเก่าทดแทนเมื่อข้อความล่าสุดเป็นภาพ/สติ๊กเกอร์ · ไม่ส่งแชทอัตโนมัติ" : "เปิดแผงไม่ดึงข้อมูล · เลือกข้อความในแชท แล้วกด “ดึงข้อมูลลูกค้า” เพื่อเติมชื่อเพจและแทนที่ข้อความเดิมด้วยข้อความนั้นเพียงอันเดียว · ไม่ส่งแชทอัตโนมัติ"}</p>
  </section>;
}
