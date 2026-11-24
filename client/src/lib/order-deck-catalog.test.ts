import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const deckSource = readFileSync(resolve(root, "DRΛKSIDE-Space-Vault-neon.html"), "utf8");
const deckPublic = readFileSync(resolve(root, "client/public/order-deck.html"), "utf8");
const deckFrame = readFileSync(resolve(root, "client/src/components/chat/OrderDeckFrame.tsx"), "utf8");
const supabase = readFileSync(resolve(root, "server/supabase.ts"), "utf8");

describe("ORDER DECK product catalog integration", () => {
  it("normalizes product text from a shared scope available to all deck closures", () => {
    const declaration = deckSource.match(/function normalizeProductText\(value\)\{[^\n]+\}/)?.[0];
    expect(declaration).toBeTruthy();
    const normalize = new Function(`${declaration}; return normalizeProductText;`)() as (value: string) => string;

    expect(normalize("VESS MINT X MANGO")).toBe("vessmintxmango");
    expect(normalize("เวส มะม่วง")).toBe("เวสมะม่วง");
    expect(deckSource.indexOf(declaration!)).toBeLessThan(deckSource.indexOf("/* ORDER FORGE · browser-local parser"));
    expect(deckSource.match(/(?:const|let) normalizeProductText\s*=/g)).toBeNull();
  });

  it("shares catalog rows and exposes the product-index callback across the separate deck closures", () => {
    expect(deckSource.match(/let productCatalog=\[\];/g)).toHaveLength(1);
    expect(deckSource).toContain("window.ST_ORDER_DECK_NOTIFY_PRODUCT_INDEX=notifyParentProductIndex");
    expect(deckSource).toContain("window.ST_ORDER_DECK_NOTIFY_PRODUCT_INDEX?.();");
  });

  it("resends an unchanged pinned product index whenever a chat room requests it", () => {
    const requestHandler = deckPublic.match(/if\(message\.type==='ST_ORDER_DECK_REQUEST_PRODUCT_INDEX'[\s\S]*?return;\}/)?.[0];
    expect(requestHandler).toBeTruthy();
    expect(requestHandler).toContain("lastProductIndexSignature=''");
    expect(requestHandler).toContain("notifyParentProductIndex(activeChatPageName,activeChatPageId)");
    expect(requestHandler!.indexOf("lastProductIndexSignature=''")).toBeLessThan(requestHandler!.indexOf("notifyParentProductIndex"));
  });

  it("marks products highlighted in any Deck set, without page-name gating", () => {
    expect(deckSource).toContain("const pinnedNames=new Set(adPages.flatMap(page=>Array.isArray(page.selected)?page.selected.filter(name=>typeof name==='string'):[]))");
    expect(deckSource).toContain("const featured=pinnedNames.has(name)");
    expect(deckSource).not.toContain("const featured=Boolean(matchingPage?.selected?.includes(name))");
  });

  it("opens the pinned product view whenever the main Products tab is entered", () => {
    expect(deckSource).toContain("if(button.dataset.tab==='tab-products'){activeProductTab='📌';renderImageProducts()}");
  });

  it("reads active product master rows from ROOM 04 VAULT using server-side project credentials", () => {
    const catalogBranch = deckFrame.match(/operation === "productCatalog"[\s\S]*?\n\s*\} else if \(operation === "scriptCardsList"\)/)?.[0];
    expect(catalogBranch).toBeTruthy();
    expect(catalogBranch).toContain('project: "vault"');
    expect(catalogBranch).toContain('table: "🛒product_master"');
    expect(catalogBranch).toContain('status: "eq.ACTIVE"');
    expect(catalogBranch).not.toContain('project: "main"');
  });

  it("allows the bounded product fields to staff and includes the catalog in ROOM 04 connection checks", () => {
    expect(supabase).toContain('"vault:🛒product_master": new Set(["emoji", "master_sku", "th_name", "name_standard", "brand", "variant", "unit_price", "alias", "status"])');
    expect(supabase).toContain('{ table: "🛒product_master", label: "Product Catalog" }');
  });

  it("maps the requested product markers to their lanes and leaves unknown markers unclassified", () => {
    const declaration = deckSource.match(/function inferProductLaneFromText\(value\)\{[^\n]+\}/)?.[0];
    expect(declaration).toBeTruthy();
    const infer = new Function(`${declaration}; return inferProductLaneFromText;`)() as (value: string) => string;
    for (const marker of ["🟥", "🟨", "⬛"]) expect(infer(marker)).toBe("🔥");
    for (const marker of ["🟩", "🟦"]) expect(infer(marker)).toBe("❄");
    for (const marker of ["🟪", "🥭", "🍎", "🍍", "🍇", "🍏", "🍓", "🍉"]) expect(infer(marker)).toBe("🍉");
    expect(infer("plain product name")).toBe("");
  });

  it("shows unknown products with 💢 and provides lane filters for page lists and page selection", () => {
    expect(deckSource).toContain('id="pageProductFilters"');
    expect(deckSource).toContain('id="adProductFilters"');
    expect(deckSource).toContain("activePageProductFilter==='💢'");
    expect(deckSource).toContain("activeAdProductFilter==='💢'");
    expect(deckSource).toContain("(isUnknown?'💢 ':'')");
    expect(deckSource).toContain("function groupOf(name){return productGroups[name]||inferredProductLane(name)||''}");
    expect(deckPublic).toBe(deckSource);
  });
  it("persists Cloud-loaded product names and migrates renamed products without an undefined write helper", () => {
    expect(deckSource).not.toContain("write('drak-image-products-v1',imageProducts)");
    expect(deckSource).toContain("localStorage.setItem('drak-image-products-v1',JSON.stringify(imageProducts))");
    expect(deckSource).toContain('async function renameProductLocally(oldName,newName)');
    expect(deckSource).toContain('if(item.product&&item.product!==product)await renameProductLocally(item.product,product)');
    expect(deckSource).toContain('page.selected=[...new Set(page.selected.map(name=>name===oldName?newName:name))]');
    expect(deckPublic).toBe(deckSource);
  });
});
