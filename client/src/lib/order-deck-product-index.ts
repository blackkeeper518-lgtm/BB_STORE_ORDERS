export type DeckImageProduct = {
  product: string;
  terms: string[];
  imageUrls: string[];
  featured: boolean;
};

const MAX_EMBEDDED_IMAGE_URL_LENGTH = 8_100_000;

export function isUsableDeckProductImageUrl(url: string): boolean {
  return /^https:\/\//i.test(url)
    || (url.length <= MAX_EMBEDDED_IMAGE_URL_LENGTH && /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+=*$/i.test(url));
}

export function selectFeaturedDeckImageProducts(products: readonly DeckImageProduct[]): DeckImageProduct[] {
  return products
    .filter(item => item.featured && item.imageUrls.some(isUsableDeckProductImageUrl))
    .slice(0, 8);
}
