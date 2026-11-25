export type DeckImageProduct = {
  product: string;
  terms: string[];
  imageUrls: string[];
  featured: boolean;
};

export type SharedDeckHighlights = { configured: boolean; productNames: string[] } | undefined;

export const MAX_FEATURED_DECK_IMAGE_PRODUCTS = 30;

const MAX_EMBEDDED_IMAGE_URL_LENGTH = 8_100_000;

export function isUsableDeckProductImageUrl(url: string): boolean {
  return /^https:\/\//i.test(url)
    || (url.length <= MAX_EMBEDDED_IMAGE_URL_LENGTH && /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/i.test(url));
}

export function selectFeaturedDeckImageProducts(products: readonly DeckImageProduct[]): DeckImageProduct[] {
  return products
    .filter(item => item.featured && item.imageUrls.some(isUsableDeckProductImageUrl))
    .slice(0, MAX_FEATURED_DECK_IMAGE_PRODUCTS);
}

export function applySharedDeckHighlights(products: readonly DeckImageProduct[], settings: SharedDeckHighlights): DeckImageProduct[] {
  if (!settings?.configured) return [...products];
  const selected = new Set(settings.productNames);
  const selectedOrder = new Map(settings.productNames.map((name, index) => [name, index]));
  return products
    .map(item => ({ ...item, featured: selected.has(item.product) }))
    .sort((a, b) => {
      const aRank = selectedOrder.get(a.product);
      const bRank = selectedOrder.get(b.product);
      if (aRank !== undefined && bRank !== undefined) return aRank - bRank;
      if (aRank !== undefined) return -1;
      if (bRank !== undefined) return 1;
      return 0;
    });
}
