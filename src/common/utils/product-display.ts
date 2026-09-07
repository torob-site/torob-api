/**
 * Shared helpers for mapping a product (with its active offers) to the
 * display shape used across list endpoints: badges / shop_price / shop_text.
 */

type OfferLike = {
  price: unknown;
  is_available: boolean;
  badges?: unknown[] | null;
  shop?: { shop_name?: string | null } | null;
};

/** Cheapest offer, or the only one, or null when there are none. */
export function pickMainOffer<T extends OfferLike>(offers: T[]): T | null {
  if (offers.length === 0) return null;
  if (offers.length === 1) return offers[0] ?? null;
  return offers.reduce((min, offer) => (Number(offer.price) < Number(min.price) ? offer : min));
}

/** `از ۱,۲۰۰,۰۰۰ تومان` when there are several sellers, plain price otherwise. */
export function formatShopPrice(price: unknown, sellerCount: number): string {
  return `${sellerCount > 1 ? 'از ' : ''}${Number(price).toLocaleString('fa-IR')} تومان`;
}

/** `در ۳ فروشگاه` when there are several sellers, `در فروشگاه X` otherwise. */
export function formatShopText(offer: OfferLike | null | undefined, sellerCount: number): string {
  if (!offer) return '';
  return sellerCount > 1 ? `در ${sellerCount} فروشگاه` : `در ${offer.shop?.shop_name ?? ''}`;
}

/**
 * Maps a product (with offers included, each offer including shop + badges)
 * to the list-item shape: strips `offers` (plus any extra keys given) and adds
 * badges / shop_price / shop_text / is_available derived from the main offer.
 */
export function toProductDisplayInfo<T extends { offers: OfferLike[] }>(product: T, omitKeys: string[] = []) {
  const sellerCount = product.offers.length;
  const mainOffer = pickMainOffer(product.offers);

  const rest: Record<string, unknown> = { ...product };
  delete rest.offers;
  for (const key of omitKeys) {
    delete rest[key];
  }

  return {
    ...rest,
    badges: mainOffer?.badges ?? [],
    shop_price: mainOffer ? formatShopPrice(mainOffer.price, sellerCount) : '',
    shop_text: formatShopText(mainOffer, sellerCount),
    is_available: mainOffer?.is_available,
  };
}

/**
 * Maps a single-shop offer (with its product + badges included) to the same
 * list-item shape, always showing that shop's name.
 */
export function toShopProductDisplay<T extends { product: object; badges?: unknown[] | null; price: unknown; is_available: boolean }>(offer: T, shopName: string) {
  const { product, badges } = offer;

  return {
    ...(product as Record<string, unknown>),
    badges: badges ?? [],
    shop_price: `${Number(offer.price).toLocaleString('fa-IR')} تومان`,
    shop_text: `در ${shopName}`,
    is_available: offer.is_available,
  };
}
