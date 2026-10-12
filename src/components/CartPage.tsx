import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Tag,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { CartItem, Product, Review, SiteSettings } from '../types';
import { StickerGraphic } from './StickerGraphic';
import { ProductCard } from './ProductCard';
import { calculateItemUnitPrice } from '../utils/pricingHelper';

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onGoHome: () => void;
  onNavigateToCatalog: () => void;
  allProducts: Product[];
  favoriteIds: string[];
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  reviews?: Review[];
  siteSettings?: SiteSettings;
}

export const CartPage: React.FC<CartPageProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onGoHome,
  onNavigateToCatalog,
  allProducts,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  reviews = [],
  siteSettings,
}) => {
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string>('');

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const getItemPrice = (item: CartItem) => {
    return item.calculatedPrice ?? calculateItemUnitPrice(item.product, item.selectedDimension, item.customText);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  const freeShippingThreshold = siteSettings?.freeShippingThreshold ?? 150;
  const standardShippingFee = siteSettings?.shippingFee ?? 39.9;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingFee = (subtotal >= freeShippingThreshold || subtotal === 0 || standardShippingFee === 0) ? 0 : standardShippingFee;
  const discountAmount = (subtotal * appliedDiscount) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'AKUZ10') {
      setAppliedDiscount(10);
      setPromoMessage('%10 İndirim Kuponu Başarıyla Uygulandı!');
    } else if (promoCode.trim().toUpperCase() === 'AKUZ20') {
      setAppliedDiscount(20);
      setPromoMessage('%20 Özel İndirim Uygulandı!');
    } else {
      setAppliedDiscount(0);
      setPromoMessage('Geçersiz veya süresi dolmuş kupon kodu.');
    }
  };

  // Sepette olmayan, popüler ve önerilen ürünler listesi (Kullanıcı sepetinde yoksa öncelikli)
  const cartProductIds = useMemo(() => new Set(cartItems.map((i) => i.product.id)), [cartItems]);

  const recommendedProducts = useMemo(() => {
    // 1. Sepette olmayan popüler ürünler
    const notInCartPopular = allProducts.filter((p) => !cartProductIds.has(p.id) && p.isPopular);
    // 2. Sepette olmayan diğer ürünler
    const notInCartOthers = allProducts.filter((p) => !cartProductIds.has(p.id) && !p.isPopular);
    // Kombine et ve ilk 8 tanesini al
    const combined = [...notInCartPopular, ...notInCartOthers];
    return combined.slice(0, 8);
  }, [allProducts, cartProductIds]);

  return (
    <div className="min-h-screen bg-[#f5f3ec] py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Başlık Çubuğu */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <button
              onClick={onGoHome}
              className="p-2 bg-white text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
              title="Ana Sayfaya Dön"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Alışveriş Sepeti
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-50 text-[#ff0055] border border-pink-100">
                  {totalQuantity} Ürün
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Seçtiğiniz stickerları inceleyin, miktarları güncelleyin ve sepeti onaylayın.
              </p>
            </div>
          </div>

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="self-start sm:self-auto px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              Sepeti Temizle
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Boş Sepet Ekranı */
          <div className="bg-white rounded-3xl p-10 sm:p-16 border border-slate-200/90 text-center max-w-xl mx-auto shadow-2xs mb-16">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 text-[#ff6600] flex items-center justify-center mx-auto mb-5 border border-orange-100 shadow-xs">
              <ShoppingBag size={38} strokeWidth={2.2} />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Sepetinizde Ürün Bulunmuyor
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
              Aracınıza, motorunuza veya camınıza özel döküm vinil sticker modellerimizi inceleyerek sepete ekleyebilirsiniz.
            </p>
            <button
              onClick={onNavigateToCatalog}
              className="px-6 py-3 bg-[#ff6600] hover:bg-[#e65c00] active:scale-95 text-white text-xs sm:text-sm font-black rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              Kataloğu İncele & Alışverişe Başla
            </button>
          </div>
        ) : (
          /* Dolu Sepet Grid: Sol Ürünler, Sağ Sipariş Özeti */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
            
            {/* SOL KOLON: Ürün Listesi */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Kargo Bilgilendirme Kutusu */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                {remainingForFreeShipping > 0 ? (
                  <div>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 font-medium">
                      <span className="flex items-center gap-2 text-slate-600">
                        <Truck size={17} className="text-[#ff0055]" />
                        <span>Ücretsiz kargo avantajı için:</span>
                      </span>
                      <strong className="text-[#ff0055] font-extrabold font-price">
                        ₺{remainingForFreeShipping.toFixed(2).replace('.', ',')} daha ekleyin
                      </strong>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-[#ff0055] transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-emerald-700 font-bold flex items-center gap-2 text-xs sm:text-sm">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <span>Tebrikler! ₺150 üzeri sepetiniz için kargo AKUZ Stickers tarafından hediye! 🚀</span>
                  </p>
                )}
              </div>

              {/* Ürün Kartları */}
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div
                    key={`${item.product.id}-${index}`}
                    className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 bg-white rounded-xl p-2 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {item.product.isCustomText ? (
                          <span className="text-xs font-black uppercase text-black font-display text-center leading-tight truncate px-1">
                            {item.customText || 'YAZINIZI YAZIN'}
                          </span>
                        ) : (
                          <StickerGraphic
                            type={item.product.svgType}
                            imageUrl={item.product.imageUrl}
                            colorHex="#111827"
                            customText={item.customText}
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>

                      {/* Başlık & Detaylar */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase truncate">
                          {item.product.name}
                        </h3>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1 flex-wrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                            {item.selectedDimension}
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-slate-700">
                            Renk: {item.selectedColor}
                          </span>
                          {item.selectedFinish && (
                            <>
                              <span>·</span>
                              <span className="font-bold text-[#ff0055]">
                                {item.selectedFinish} Folyo
                              </span>
                            </>
                          )}
                        </div>
                        {item.customText && (
                          <p className="text-xs text-[#ff0055] font-bold mt-1">
                            Özel Yazı: "{item.customText}" {item.customFont ? `(Font: ${item.customFont})` : ''}
                          </p>
                        )}
                        <p className="text-xs text-slate-400 mt-1 font-price">
                          Birim Fiyat: ₺{getItemPrice(item).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    </div>

                    {/* Sağ Taraf: Miktar, Toplam Fiyat, Sil Butonu */}
                    <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Miktar Sayacı */}
                      <div className="flex items-center gap-2 bg-slate-100/90 px-2.5 py-1 rounded-xl border border-slate-200/70">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                          className="text-slate-600 hover:text-slate-900 p-1 rounded-md cursor-pointer"
                          title="Azalt"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-sm font-bold font-price min-w-5 text-center text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                          className="text-slate-600 hover:text-slate-900 p-1 rounded-md cursor-pointer"
                          title="Artır"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Satır Toplam Fiyatı */}
                      <div className="text-right min-w-[90px]">
                        <span className="text-base sm:text-lg font-extrabold text-rose-600 font-price tracking-tight">
                          ₺{(getItemPrice(item) * item.quantity).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* Sil Butonu */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Ürünü Çıkar"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Güvence Rozetleri */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">1. Sınıf Alman Vinil</p>
                    <p className="text-slate-400">Solmaz ve sökülmez kalite</p>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <Truck size={20} className="text-[#ff0055] shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Hızlı & Güvenli Kargo</p>
                    <p className="text-slate-400">Özel korumalı rulo kutularda</p>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                  <CreditCard size={20} className="text-blue-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Kolay Sipariş Takibi</p>
                    <p className="text-slate-400">Canlı destek & kargo takibi</p>
                  </div>
                </div>
              </div>

            </div>

            {/* SAĞ KOLON: Sipariş Özeti & Kupon & Sepeti Onayla */}
            <div className="lg:col-span-4 sticky top-28 space-y-4">
              
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
                <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>Sipariş Özeti</span>
                  <span className="text-xs font-semibold text-slate-400">{cartItems.length} Kalem Ürün</span>
                </h2>

                {/* Kupon Kodu */}
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="İndirim Kuponu (AKUZ10)"
                        className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 uppercase font-semibold focus:outline-none focus:border-[#ff0055] focus:bg-white transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Uygula
                    </button>
                  </div>
                  {promoMessage && (
                    <p
                      className={`text-[11px] font-bold ${
                        appliedDiscount > 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {promoMessage}
                    </p>
                  )}
                </form>

                {/* Fiyat Tablosu */}
                <div className="space-y-2 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span>Ürünler Toplamı:</span>
                    <span className="font-price font-semibold text-slate-800">
                      ₺{subtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>İndirim Tutarı (%{appliedDiscount}):</span>
                      <span className="font-price font-semibold">
                        -₺{discountAmount.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Kargo Ücreti:</span>
                    <span className="font-price font-semibold">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-600 font-bold">ÜCRETSİZ</span>
                      ) : (
                        `₺${shippingFee.toFixed(2).replace('.', ',')}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200/90 pt-3 mt-2">
                    <span>Toplam Tutar:</span>
                    <span className="font-price text-2xl font-extrabold text-[#ff6600]">
                      ₺{grandTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Sadece "Sepeti Onayla" yazan buton -> Kargo bilgileri sayfasına yönlendirir */}
                <button
                  type="button"
                  onClick={onProceedToCheckout}
                  className="w-full py-4 px-4 bg-[#ff6600] hover:bg-[#e65c00] active:scale-98 text-white rounded-xl text-sm font-black transition-all shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sepeti Onayla</span>
                  <ArrowRight size={17} />
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  Sonraki adımda teslimat adresinizi seçip ödeme adımına geçeceksiniz.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* SEPETİN ALTINDA ÖNERİLEN ÜRÜNLER (Kullanıcı İsteği: "sepette asağıda ürünler gozuksun önerilen ürünler gibi birşey yap") */}
        {recommendedProducts.length > 0 && (
          <section className="pt-6 sm:pt-10 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#ff0055] flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                    Sepetinize Yakışacak Stickerlar
                  </h2>
                </div>
              </div>

              <button
                onClick={onNavigateToCatalog}
                className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#ff0055] hover:text-[#d90048] transition-colors cursor-pointer"
              >
                <span>Tüm Kataloğu Gör</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Grid Kartlar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-5">
              {recommendedProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  isFav={favoriteIds.includes(prod.id)}
                  reviews={reviews.filter((r) => r.productId === prod.id)}
                  onToggleFavorite={onToggleFavorite}
                  onSelectProduct={onSelectProduct}
                  variant="catalog"
                />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <button
                onClick={onNavigateToCatalog}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs inline-flex items-center gap-1.5"
              >
                <span>Tüm Kataloğu İncele</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
