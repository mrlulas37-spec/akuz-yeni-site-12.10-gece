import { Product } from '../types';

/**
 * Ürünün seçili boyutuna ve varsa özel yazı harf adedine göre güncel birim fiyatını hesaplar.
 * - Boyuta özel fiyat tanımlıysa (`product.dimensionPrices?.[dimension]`), o fiyat baz alınır.
 * - Yoksa ürünün genel `product.currentPrice` fiyatı baz alınır.
 * - Eğer ürün kişiye özel yazı ürünü ise (`product.isCustomText`):
 *   Belirlenen ücretsiz harf adedinden (`product.freeLetterCount`, örn: 10) sonraki her harf için
 *   harf başı belirlenen ek ücret (`product.extraLetterPrice`, örn: 5 TL) eklenir.
 */
export function calculateItemUnitPrice(
  product: Product,
  dimension?: string,
  customText?: string
): number {
  // 1. Boyut bazlı fiyat
  let basePrice = product.currentPrice;
  if (dimension && product.dimensionPrices && typeof product.dimensionPrices[dimension] === 'number') {
    basePrice = product.dimensionPrices[dimension];
  }

  // 2. Özel yazı harf bazlı ek fiyat
  let extraLetterTotal = 0;
  if (product.isCustomText && customText && customText.trim()) {
    const freeLetters = typeof product.freeLetterCount === 'number' ? product.freeLetterCount : 10;
    const perLetterPrice = typeof product.extraLetterPrice === 'number' ? product.extraLetterPrice : 0;

    // Boşluklar hariç harf sayısı (kullanıcı dostu: harf başı ücretlendirme)
    const letterCount = customText.replace(/\s+/g, '').length;
    const extraCount = Math.max(0, letterCount - freeLetters);

    if (extraCount > 0 && perLetterPrice > 0) {
      extraLetterTotal = extraCount * perLetterPrice;
    }
  }

  return basePrice + extraLetterTotal;
}

/**
 * Harf ücretlendirme detayını metin olarak döndürür
 */
export function getLetterPricingBreakdown(
  product: Product,
  customText?: string
): {
  letterCount: number;
  freeLetters: number;
  extraLetters: number;
  perLetterPrice: number;
  extraTotal: number;
} {
  const freeLetters = typeof product.freeLetterCount === 'number' ? product.freeLetterCount : 10;
  const perLetterPrice = typeof product.extraLetterPrice === 'number' ? product.extraLetterPrice : 0;
  const letterCount = customText ? customText.replace(/\s+/g, '').length : 0;
  const extraLetters = Math.max(0, letterCount - freeLetters);
  const extraTotal = extraLetters * perLetterPrice;

  return {
    letterCount,
    freeLetters,
    extraLetters,
    perLetterPrice,
    extraTotal,
  };
}
