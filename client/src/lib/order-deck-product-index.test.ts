import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isUsableDeckProductImageUrl, selectFeaturedDeckImageProducts } from "./order-deck-product-index";

const root = process.cwd();
const chatHub = readFileSync(resolve(root, "client/src/pages/ChatHub.tsx"), "utf8");
const mobileInbox = readFileSync(resolve(root, "client/src/pages/MobileInbox.tsx"), "utf8");
const mobileDock = readFileSync(resolve(root, "client/src/components/chat/MobileInboxProductDock.tsx"), "utf8");
const deckSource = readFileSync(resolve(root, "client/public/order-deck.html"), "utf8");
const deckFrame = readFileSync(resolve(root, "client/src/components/chat/OrderDeckFrame.tsx"), "utf8");

describe("Order Deck floating product shortcuts", () => {
  it("shows only Deck-highlighted products with usable images and caps the dock at eight", () => {
    const products = Array.from({ length: 10 }, (_, index) => ({
      product: `product-${index}`,
      terms: [],
      imageUrls: [`https://cdn.example/${index}.jpg`],
      featured: true,
    }));
    products.push(
      { product: "not-pinned", terms: [], imageUrls: ["https://cdn.example/not-pinned.jpg"], featured: false },
      { product: "no-image", terms: [], imageUrls: [], featured: true },
      { product: "local-only", terms: [], imageUrls: ["blob:https://app.example/image"], featured: true },
    );

    expect(selectFeaturedDeckImageProducts(products).map(item => item.product)).toEqual(
      Array.from({ length: 8 }, (_, index) => `product-${index}`),
    );
  });

  it("allows a pinned local editor image through the dock and rejects unsafe or oversized data URLs", () => {
    const localImage = "data:image/webp;base64,dGVzdA==";
    expect(isUsableDeckProductImageUrl(localImage)).toBe(true);
    expect(isUsableDeckProductImageUrl("javascript:alert(1)")).toBe(false);
    expect(isUsableDeckProductImageUrl(`data:image/webp;base64,${"a".repeat(8_100_000)}`)).toBe(false);
    expect(selectFeaturedDeckImageProducts([
      { product: "pinned-local", terms: [], imageUrls: [localImage], featured: true },
      { product: "unpinned-local", terms: [], imageUrls: [localImage], featured: false },
    ]).map(item => item.product)).toEqual(["pinned-local"]);
  });

  it("uses the live Deck product-index bridge as its inventory and requests images from Deck", () => {
    expect(chatHub).toContain("onProductIndexReady={setDeckImageProducts}");
    expect(chatHub).not.toContain("loadDeckProductIndexForPage(");
    expect(chatHub).toContain("setProductImagesRequest({ id: productImagesRequestId.current, product });");
    expect(chatHub).toContain("onClick={() => requestProductImagesFromDeck(item.product)}");
    expect(deckFrame).toContain('type: "ST_ORDER_DECK_REQUEST_PRODUCT_IMAGES"');
    expect(deckSource).toContain("window.parent.postMessage({type:'ST_ORDER_DECK_PRODUCT_IMAGES'");
  });

  it("passes local images from pinned editor records through the Deck index and iframe bridge", () => {
    expect(deckSource).toContain("const embeddedPinnedImage=featured&&imageUrl.length<=8100000");
    expect(deckSource).toContain("const imageUrls=remoteImage||embeddedPinnedImage?[imageUrl]:[]");
    expect(deckFrame).toContain("isUsableDeckProductImageUrl(url)");
  });

  it("keeps the pinned product shortcuts on the chat and hides them after an image send succeeds", () => {
    expect(chatHub).toContain("productFloatVisible && !productFloatDismissed && featuredImageProducts.length");
    expect(chatHub).toContain("onClick={() => requestProductImagesFromDeck(item.product)}");
    expect(chatHub).toContain("if (replyImages.length > 0) setProductFloatDismissed(true);");
    expect(chatHub).toContain("setDeckImageProducts([]);");
    expect(chatHub).toContain("window.setTimeout(() => setProductFloatVisible(true), 3000)");
    expect(chatHub).toContain("onProductIndexReady={setDeckImageProducts}");
    expect(chatHub).toContain("flex-col-reverse");
    expect(deckSource).toContain('id="chooseAdProducts">📌 ไฮไลท์สินค้า</button>');
    expect(chatHub).toContain("absolute bottom-[112px] right-3 z-30 w-[min(300px,calc(100%-1.5rem))]");
  });

  it("hands the cached latest customer text into the Deck immediately and checks the server in the background", () => {
    expect(chatHub).toContain("const refreshed = await messagesQuery.refetch();");
    expect(chatHub).toContain("getImportableLatestCustomerMessage(messagesQuery.data ?? [])");
    expect(chatHub).toContain("stageDeckMessage(cachedLatest);");
    expect(chatHub).toContain("if (!cachedLatest || freshLatest.id !== cachedLatest.id || freshLatest.text !== cachedLatest.text) stageDeckMessage(freshLatest);");
    expect(chatHub).toContain("orderDeckRequestRoomKeyRef.current !== requestRoomKey");
    expect(chatHub).toContain('messageMode="latest"');
    expect(chatHub).toContain("onMessageRequestHandled=");
  });

  it("renders an actionable setup hint after the delayed reveal when no pinned image can appear", () => {
    expect(chatHub).toContain("productFloatVisible && !productFloatDismissed && !featuredImageProducts.length");
    expect(chatHub).toContain("ตั้งไฮไลท์สินค้า");
  });

  it("mounts the pinned-image dock and Deck bridge in Mobile Inbox before opening the Deck", () => {
    expect(mobileInbox).toContain('openRoom && selected ? <div className="mobile-inbox-deck-bridge"');
    expect(mobileInbox).toContain("onProductIndexReady={setDeckImageProducts}");
    expect(mobileInbox).toContain("productImagesRequest={productImagesRequest}");
    expect(mobileInbox).toContain("onProductImagesSelected={receiveProductImages}");
    expect(mobileInbox).toContain("<MobileInboxProductDock products={featuredImageProducts}");
    expect(mobileInbox).toContain("onSelect={requestProductImagesFromDeck}");
    expect(mobileInbox).toContain("window.setTimeout(() => setProductDockVisible(true), 3000)");
    expect(mobileInbox).toContain("if (replyImages.length > 0) setProductDockDismissed(true);");
    expect(mobileInbox).toContain("else if (replyText.trim()) setProductDockCollapsed(true);");
    expect(mobileInbox).toContain("collapsed={productDockCollapsed}");
    expect(mobileInbox).toContain("onToggleCollapsed={() => setProductDockCollapsed(value => !value)}");
    expect(mobileDock).toContain("📌 สินค้าไฮไลท์");
    expect(mobileDock).toContain("className=\"mobile-inbox-product-dock__reopen\"");
    expect(mobileDock).toContain("onClick={() => onSelect(item.product)}");
    expect(mobileDock).toContain("onClick={onToggleCollapsed}");
  });

  it("clears the Deck draft instead of retaining a previous room's message when no latest text can be imported", () => {
    expect(deckSource).toContain("clearSelectedCustomerMessage===true");
    expect(deckSource).toContain("raw.value=''");
    expect(deckSource).toBe(readFileSync(resolve(root, "client/public/order-deck.html"), "utf8"));
  });
});
