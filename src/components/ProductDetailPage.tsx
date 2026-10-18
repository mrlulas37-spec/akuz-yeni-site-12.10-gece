import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Layers,
  Palette,
  Maximize2,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Moon,
  Type,
  Eye,
  Sliders,
  Truck,
  Zap,
} from 'lucide-react';
import { Product, Review, UserProfile, ProductColorOption } from '../types';
import { CUSTOM_FONTS, CustomFontOption } from '../data/customFonts';
import { StickerGraphic } from './StickerGraphic';
import { ImageIndicatorPill } from './ImageIndicatorPill';
import { ReviewsSection } from './ReviewsSection';
import { calculateItemUnitPrice, getLetterPricingBreakdown } from '../utils/pricingHelper';

interface ProductDetailPageProps {
  product: Product;
  allProducts: Product[];
  favoriteIds: string[];
  recentlyViewedProducts: Product[];
  reviews: Review[];
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    color?: string,
    dimension?: string,
    finish?: 'Mat' | 'Parlak',
    customText?: string,
    customFont?: string
  ) => void;
  onAddReview: (productId: string, userName: string, rating: number, comment: string) => void;
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts,
  favoriteIds,
  recentlyViewedProducts,
  reviews,
  currentUser,
  onOpenAuth,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onAddReview,
  onSelectProduct,
  onBack,
}) => {
  // Sadece stokta olan renkleri göster
  const availableColors: ProductColorOption[] = useMemo(() => {
    return product.colors.filter((c: ProductColorOption) => c.inStock !== false);
  }, [product.colors]);

  // Stok Durumu: Ürün ve renk stok kontrolü (stokta ürünler için teslimat rozetleri aktif olur)
  const isProductInStock: boolean = useMemo(() => {
    if (product.inStock === false) return false;
    if (product.colors && product.colors.length > 0) {
      return availableColors.length > 0;
    }
    return true;
  }, [product.inStock, product.colors, availableColors.length]);

  const [selectedColor, setSelectedColor] = useState(
    availableColors[0]?.name || product.colors[0]?.name || 'Siyah'
  );

  const [selectedFinish, setSelectedFinish] = useState<'Mat' | 'Parlak'>('Parlak');

  const selectedColorObj = useMemo(() => {
    return availableColors.find((c: ProductColorOption) => c.name === selectedColor) || availableColors[0] || product.colors[0];
  }, [availableColors, selectedColor, product.colors]);

  // Seçilen rengin desteklediği folyo tipleri
  const allowedFinishesForColor: ('Mat' | 'Parlak')[] = useMemo(() => {
    if (selectedColorObj?.supportedFinishes && selectedColorObj.supportedFinishes.length > 0) {
      return selectedColorObj.supportedFinishes;
    }
    return ['Mat', 'Parlak'];
  }, [selectedColorObj]);

  // Bir rengin mevcut seçili folyo tipini (Mat/Parlak) destekleyip desteklemediğini kontrol eder
  const isColorCompatibleWithFinish = (color: ProductColorOption, finish: 'Mat' | 'Parlak'): boolean => {
    if (!color.supportedFinishes || color.supportedFinishes.length === 0) return true;
    return color.supportedFinishes.includes(finish);
  };

  // Bir folyo tipinin (Mat/Parlak) mevcut seçili rengi destekleyip desteklemediğini kontrol eder
  const isFinishCompatibleWithColor = (finish: 'Mat' | 'Parlak'): boolean => {
    return allowedFinishesForColor.includes(finish);
  };

  // Renk tıklandığında: Rengi seç, o renge ait fotoğraf varsa görseli güncelle
  const handleSelectColor = (color: ProductColorOption) => {
    setClickedColor(color.name);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(12);
      }
    } catch {}
    setSelectedColor(color.name);

    // Renk seçildiğinde o renge ait fotoğrafı otomatik aktif yap:
    if (product.colorImages && product.colorImages[color.name]) {
      setActiveImage(product.colorImages[color.name]);
    } else if (product.images && product.images.length > 0) {
      const cLower = color.name.toLowerCase();
      const matchingImg = product.images.find((img) => {
        const lower = img.toLowerCase();
        if (cLower === 'beyaz' && (lower.includes('beyaz') || lower.includes('white') || lower.includes('1140'))) return true;
        if (cLower === 'siyah' && (lower.includes('siyah') || lower.includes('black') || lower.includes('1138') || lower.includes('1141') || lower.includes('1147') || lower.includes('1143'))) return true;
        if (cLower.includes('hologram') && (lower.includes('hologram') || lower.includes('1146'))) return true;
        return lower.includes(cLower);
      });
      if (matchingImg) {
        setActiveImage(matchingImg);
      }
    }

    if (color.supportedFinishes && color.supportedFinishes.length > 0 && !color.supportedFinishes.includes(selectedFinish)) {
      setSelectedFinish(color.supportedFinishes[0]);
    }
    setTimeout(() => setClickedColor(null), 350);
  };

  // Folyo tipi tıklandığında: Sadece mevcut seçili renk bu folyoyu destekliyorsa seçilebilir, aksi halde tıklanamaz
  const handleSelectFinish = (finish: 'Mat' | 'Parlak') => {
    if (!isFinishCompatibleWithColor(finish)) {
      return; // Tıklanamaz, kilitli
    }
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(12);
      }
    } catch {}
    setSelectedFinish(finish);
  };
  const [selectedDimension, setSelectedDimension] = useState(
    product.dimensions[0] || '15x15 cm'
  );
  const [quantity, setQuantity] = useState(1);
  const [isQtyFlipping, setIsQtyFlipping] = useState(false);
  const [clickedColor, setClickedColor] = useState<string | null>(null);

  const handleQtyChange = (delta: number) => {
    setIsQtyFlipping(true);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(10);
      }
    } catch {}
    setQuantity((q) => Math.max(1, q + delta));
    setTimeout(() => setIsQtyFlipping(false), 240);
  };
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [activeImage, setActiveImage] = useState<string>(
    product.images?.[0] || product.imageUrl || '/akuz-logo-badge.png'
  );

  // Kişiye özel yazı & font seçimi state'leri
  const [customText, setCustomText] = useState<string>(
    product.isCustomText ? 'Yazınızı Yazın' : ''
  );
  const [selectedFont, setSelectedFont] = useState<CustomFontOption>(CUSTOM_FONTS[0]);
  const [fontCategoryFilter, setFontCategoryFilter] = useState<string>('all');
  const fontScrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  const scrollFonts = (direction: 'left' | 'right') => {
    if (fontScrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      fontScrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Touch swipe support for mobile
  const touchStartXRef = React.useRef<number | null>(null);
  const touchEndXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const touchEndYRef = React.useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
    touchStartYRef.current = e.targetTouches[0].clientY;
    touchEndYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
    touchEndYRef.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distanceX = touchStartXRef.current - touchEndXRef.current;
    const distanceY = (touchStartYRef.current || 0) - (touchEndYRef.current || 0);
    const minSwipeDistance = 35;

    if (product.images && product.images.length > 1 && Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      const curIdx = product.images.indexOf(activeImage);
      if (distanceX > minSwipeDistance) {
        // Swipe Left -> Next
        const nextIdx = (curIdx + 1) % product.images.length;
        setActiveImage(product.images[nextIdx]);
      } else if (distanceX < -minSwipeDistance) {
        // Swipe Right -> Prev
        const prevIdx = (curIdx - 1 + product.images.length) % product.images.length;
        setActiveImage(product.images[prevIdx]);
      }
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
    touchStartYRef.current = null;
    touchEndYRef.current = null;
  };

  // Ürüne girildiğinde seçili renge göre fotoğrafı senkronize et
  React.useEffect(() => {
    const initColor = availableColors[0]?.name || product.colors[0]?.name || 'Siyah';
    setSelectedColor(initColor);
    if (product.colorImages && product.colorImages[initColor]) {
      setActiveImage(product.colorImages[initColor]);
    } else if (product.images && product.images.length > 0) {
      const cLower = initColor.toLowerCase();
      const matchingImg = product.images.find((img) => {
        const lower = img.toLowerCase();
        if (cLower === 'beyaz' && (lower.includes('beyaz') || lower.includes('white') || lower.includes('1140'))) return true;
        if (cLower === 'siyah' && (lower.includes('siyah') || lower.includes('black') || lower.includes('1138') || lower.includes('1141') || lower.includes('1147') || lower.includes('1143'))) return true;
        if (cLower.includes('hologram') && (lower.includes('hologram') || lower.includes('1146'))) return true;
        return lower.includes(cLower);
      });
      setActiveImage(matchingImg || product.images[0] || product.imageUrl || '/akuz-logo-badge.png');
    } else {
      setActiveImage(product.imageUrl || '/akuz-logo-badge.png');
    }
  }, [product, availableColors]);

  // Reviews for this specific product
  const productReviews = reviews.filter((r) => r.productId === product.id);
  const reviewCount = productReviews.length;
  const avgRating =
    reviewCount > 0
      ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
      : '0.0';

  // Dinamik Birim Fiyat (Seçili Boyut ve Harf Sayısı Bazlı)
  const currentUnitPrice = useMemo(() => {
    return calculateItemUnitPrice(product, selectedDimension, customText);
  }, [product, selectedDimension, customText]);

  const letterBreakdown = useMemo(() => {
    return getLetterPricingBreakdown(product, customText);
  }, [product, customText]);

  // Filter 1: O ürünün olduğu kategorideki diğer ürünler (kendisi hariç)
  const categoryProducts = allProducts.filter(
    (p) => p.category === product.category && p.id !== product.id
  );

  // Filter 2: Popüler Ürünler (kendisi hariç)
  const popularProducts = allProducts.filter(
    (p) => p.id !== product.id && p.isPopular
  );

  // Filter 3: Son Gezilen Ürünler (kendisi hariç)
  const recentProducts = recentlyViewedProducts.filter((p) => p.id !== product.id);

  const handleAddToCartClick = () => {
    onAddToCart(
      product,
      quantity,
      selectedColor,
      selectedDimension,
      selectedFinish,
      product.isCustomText || customText.trim() ? customText.trim() : undefined,
      product.isCustomText ? selectedFont.name : undefined
    );
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f5f3ec] text-slate-800 pb-24 animate-product-page-enter">
      {/* Top Sticky Breadcrumb / Back Bar */}
      <div className="bg-[#f8f6f0] border-b border-[#e2dfd4] sticky top-[112px] sm:top-[128px] md:top-[144px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-[#ff6600] transition-colors cursor-pointer group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Geri Dön</span>
            </button>

            <div className="flex items-center gap-2 text-xs truncate max-w-xs sm:max-w-md">
              <span className="hidden sm:inline">Katalog</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-slate-900 font-bold truncate">{product.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Product Configuration Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Large High-Res Sticker Visual Stage */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative aspect-square w-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group touch-pan-y animate-hero-reveal"
            >
              {/* Top Right Heart Favorite */}
              <button
                type="button"
                onClick={() => onToggleFavorite(product)}
                className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white border border-slate-200/80 hover:border-rose-300 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all shadow-sm z-10 cursor-pointer"
                title={isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
              >
                <Heart
                  size={22}
                  className={`transition-colors ${
                    isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-400'
                  }`}
                />
              </button>

              {/* Product Artwork / Photo with Full Fill or Custom Text Live Preview */}
              <div className="w-full h-full flex items-center justify-center relative">
                {product.isCustomText ? (
                  /* Canlı Kişiye Özel Yazı Önizleme Sahnesi */
                  <div
                    className={`w-full h-full flex flex-col items-center justify-center p-6 text-center select-none relative transition-colors duration-300 ${
                      selectedColor.toLowerCase() === 'beyaz'
                        ? 'bg-[#181c24]'
                        : 'bg-white'
                    }`}
                  >
                    <div className="relative z-10 max-w-full px-4 overflow-hidden flex flex-col items-center justify-center">
                      <p
                        className="transition-all duration-200 tracking-wider break-words max-w-full leading-tight select-all"
                        style={{
                          fontFamily: selectedFont.fontFamily,
                          fontSize:
                            customText.length > 24
                              ? '1.8rem'
                              : customText.length > 15
                              ? '2.6rem'
                              : customText.length > 8
                              ? '3.4rem'
                              : '4.2rem',
                          ...(selectedColor.toLowerCase().includes('hologram')
                            ? {
                                background:
                                  'linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 2px 8px rgba(167, 139, 250, 0.45))',
                              }
                            : selectedColor.toLowerCase() === 'beyaz'
                            ? {
                                color: '#ffffff',
                                filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6))',
                              }
                            : {
                                color: selectedColorObj?.hex || '#111827',
                              }),
                        }}
                      >
                        {customText.trim() ? customText : 'YAZINIZI YAZIN'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <StickerGraphic
                    type={product.svgType}
                    imageUrl={activeImage}
                    colorHex={selectedColorObj?.hex}
                    colorName={selectedColor}
                    fit="cover"
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      selectedFinish === 'Parlak'
                        ? 'contrast-105'
                        : 'contrast-95 opacity-95'
                    }`}
                  />
                )}

                {/* Subtle Gloss sheen if "Parlak" is active */}
                {selectedFinish === 'Parlak' && !product.isCustomText && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none rounded-xl" />
                )}
              </div>

              {/* Left and Right Navigation Arrows (Birden fazla fotoğraf olunca ve kişiye özel yazı değilse) */}
              {!product.isCustomText && product.images && product.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const imgs = product.images!;
                      const curIdx = imgs.indexOf(activeImage);
                      const prevIdx = (curIdx - 1 + imgs.length) % imgs.length;
                      setActiveImage(imgs[prevIdx]);
                    }}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 z-20 cursor-pointer"
                    title="Önceki Fotoğraf"
                    aria-label="Önceki Fotoğraf"
                  >
                    <ChevronLeft size={24} className="-ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const imgs = product.images!;
                      const curIdx = imgs.indexOf(activeImage);
                      const nextIdx = (curIdx + 1) % imgs.length;
                      setActiveImage(imgs[nextIdx]);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 z-20 cursor-pointer"
                    title="Sonraki Fotoğraf"
                    aria-label="Sonraki Fotoğraf"
                  >
                    <ChevronRight size={24} className="ml-0.5" />
                  </button>
                </>
              )}

              {/* Bottom Pill Indicator (Sadece birden fazla fotoğraf olunca ve kişiye özel değilse) */}
              {!product.isCustomText && product.images && product.images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-auto">
                  <ImageIndicatorPill
                    total={product.images.length}
                    activeIndex={product.images.indexOf(activeImage) !== -1 ? product.images.indexOf(activeImage) : 0}
                    onSelect={(index) => {
                      if (product.images?.[index]) {
                        setActiveImage(product.images[index]);
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Çoklu Görsel Küçük Resim Seçici (Thumbnail Bar - kişiye özel değilse) */}
            {!product.isCustomText && product.images && product.images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 bg-white p-1 transition-all cursor-pointer shrink-0 ${
                      activeImage === img
                        ? 'border-[#ff0055] shadow-md ring-2 ring-[#ff0055]/20 scale-102'
                        : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} fotoğraf ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Configuration, Options & Purchase */}
          <div className="lg:col-span-6 flex flex-col bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            {/* Header info */}
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center text-amber-400 text-xs">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      className={
                        reviewCount > 0 && s <= Math.round(Number(avgRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {avgRating}
                </span>
                <span className="text-xs text-slate-400">
                  ({reviewCount} Değerlendirme)
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase font-display tracking-tight">
                {product.name}
              </h1>

              {/* Price Banner */}
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-red-600 font-price tracking-tight">
                    ₺{currentUnitPrice.toFixed(2).replace('.', ',')}
                  </span>
                  {product.oldPrice > currentUnitPrice && (
                    <span className="text-base sm:text-lg text-slate-400 line-through font-price font-medium">
                      ₺{product.oldPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-sm border border-emerald-200/60">
                    KDV Dahil
                  </span>

                  {/* KULLANICI İSTEĞİ: Fiyat bilgisinin yanına stoktaki ürünler için 'Aynı Gün Kargo' veya 'Hızlı Teslimat' rozeti */}
                  {isProductInStock ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs tracking-tight">
                      <Truck size={13} className="shrink-0 text-white stroke-[2.5]" />
                      <span>Aynı Gün Kargo</span>
                      <span className="text-white/60 font-normal">|</span>
                      <span className="flex items-center gap-0.5 text-amber-300">
                        <Zap size={11} className="fill-amber-300 shrink-0" />
                        Hızlı Teslimat
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      <span>Tükendi</span>
                    </div>
                  )}
                </div>

                {/* Stokta olan ürünler için Aynı Gün Kargo teslimat süresi bilgilendirmesi */}
                {isProductInStock && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-semibold bg-emerald-50/70 px-2.5 py-1 rounded-md border border-emerald-100/90 w-fit">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Stokta Var</span>
                    <span className="text-emerald-300 font-light">•</span>
                    <span>Hafta içi saat 16:00'a kadar verilen siparişlerde <strong>Aynı Gün Kargo</strong></span>
                  </div>
                )}

                {/* Boyut ve Harf Fiyat Bilgilendirme Notu */}
                {product.isCustomText && letterBreakdown.extraLetters > 0 && (
                  <p className="text-[11px] font-bold text-[#ff0055]">
                    İlk {letterBreakdown.freeLetters} harf ücretsiz! +{letterBreakdown.extraLetters} ekstra harf için (+{letterBreakdown.extraTotal} TL) dahil edilmiştir.
                  </p>
                )}
              </div>
            </div>

            {/* SEÇENEK SIRASI:
                EĞER KİŞİYE ÖZEL ÜRÜN İSE:
                1. YAZI METNİ GİRİŞİ (INPUT)
                2. KAYDIRILABİLİR CANLI FONT LİSTESİ (HER FONTUN ALTINDA YAZILAN YAZI CANLI GÖZÜKÜR)
                3. RENK SEÇENEKLERİ
                4. MATERYAL SEÇENEKLERİ (MAT / PARLAK)
                5. BOYUT SEÇENEKLERİ
            */}
            <div className="py-6 space-y-6 border-b border-slate-100">

              {/* KİŞİYE ÖZEL METİN & FONT SEÇİCİ BÖLÜMÜ */}
              {product.isCustomText && (
                <div className="space-y-5 bg-gradient-to-br from-pink-50/40 via-white to-slate-50 p-4 sm:p-5 rounded-2xl border border-pink-100/90 shadow-2xs">
                  
                  {/* 1. Yazı Giriş Alanı */}
                  <div>
                    <label className="flex items-center justify-between text-xs font-black uppercase text-slate-900 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Type size={15} className="text-[#ff0055]" />
                        Sticker Üzerine Yazılacak Yazı / İsim *
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {letterBreakdown.letterCount} Harf {product.freeLetterCount !== undefined ? `(İlk ${product.freeLetterCount} Harf Ücretsiz)` : ''}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={40}
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Yazınızı Yazın"
                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-300 text-slate-900 font-bold text-sm sm:text-base focus:outline-none focus:border-[#ff0055] focus:ring-2 focus:ring-[#ff0055]/20 shadow-xs transition-all tracking-wide"
                      />
                      {customText && (
                        <button
                          type="button"
                          onClick={() => setCustomText('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                        >
                          Temizle
                        </button>
                      )}
                    </div>

                    {/* Harf Ücretlendirme Açıklama Kutusu */}
                    <div className="flex items-center justify-between text-[11px] mt-1.5 px-1">
                      <span className="text-slate-500">
                        Ücretsiz harf hakkı: <strong className="text-slate-800">{letterBreakdown.freeLetters} harf</strong>
                        {letterBreakdown.perLetterPrice > 0 && (
                          <span> (sonrası harf başı +{letterBreakdown.perLetterPrice} TL)</span>
                        )}
                      </span>
                      {letterBreakdown.extraLetters > 0 ? (
                        <span className="font-bold text-[#ff0055] bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                          +{letterBreakdown.extraLetters} Ekstra Harf (+{letterBreakdown.extraTotal} TL)
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Ücretsiz Harf Limiti Dahilinde
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Kaydırılabilir Font Listesi (Canlı Önizlemeli) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <label className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                        <Sliders size={14} className="text-[#ff0055]" />
                        <span>Yazı Fontunu Seçin</span>
                        <span className="text-slate-400 font-semibold text-[11px] lowercase">
                          ({CUSTOM_FONTS.length} font)
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-[#ff0055] hidden sm:inline">
                          Seçilen: {selectedFont.name.split(' (')[0]}
                        </span>
                        {/* Masaüstü Sağ-Sol Kaydırma Okları */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => scrollFonts('left')}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
                            title="Önceki fontlar"
                            aria-label="Önceki fontlar"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => scrollFonts('right')}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer active:scale-95"
                            title="Sonraki fontlar"
                            aria-label="Sonraki fontlar"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Yatay Kaydırılabilir Font Kartları */}
                    <div
                      ref={fontScrollContainerRef}
                      onWheel={(e) => {
                        if (e.deltaY !== 0 && fontScrollContainerRef.current) {
                          fontScrollContainerRef.current.scrollLeft += e.deltaY;
                        }
                      }}
                      className="flex items-stretch gap-3.5 overflow-x-auto pb-3 pt-2.5 px-3.5 -mx-3.5 scroll-smooth"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 transparent',
                      }}
                    >
                      {CUSTOM_FONTS.map((font) => {
                        const isSel = selectedFont.id === font.id;
                        const displayText = customText.trim() ? customText : 'Yazınızı Yazın';

                        return (
                          <div
                            key={font.id}
                            onClick={() => setSelectedFont(font)}
                            className={`min-w-[210px] sm:min-w-[240px] max-w-[260px] p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between select-none shrink-0 ${
                              isSel
                                ? 'border-[#ff0055] bg-white shadow-md ring-2 ring-[#ff0055]/30'
                                : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
                            }`}
                          >
                            {/* Font Başlığı & Tag */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <span className="text-xs font-extrabold text-slate-900 truncate">
                                {font.name.split(' (')[0]}
                              </span>
                              {font.tag && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isSel ? 'bg-pink-100 text-[#ff0055]' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {font.tag}
                                </span>
                              )}
                            </div>

                            {/* CANLI YAZI ÖNİZLEMESİ (Her fontun altında canlı yazar) */}
                            <div className="h-16 flex items-center justify-center bg-slate-50/90 rounded-xl px-2.5 py-1.5 my-1.5 border border-slate-100/90 overflow-hidden">
                              <p
                                className="text-center truncate max-w-full transition-all duration-150"
                                style={{
                                  fontFamily: font.fontFamily,
                                  fontSize:
                                    displayText.length > 20
                                      ? '1.05rem'
                                      : displayText.length > 12
                                      ? '1.25rem'
                                      : '1.55rem',
                                  color: isSel ? '#ff0055' : '#1e293b',
                                }}
                              >
                                {displayText}
                              </p>
                            </div>

                            {/* Seçim Butonu / Durumu */}
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-medium">
                                {font.category === 'racing'
                                  ? 'Yarış & Spor'
                                  : font.category === 'gothic'
                                  ? 'Gotik / Hat'
                                  : font.category === 'script'
                                  ? 'El Yazısı'
                                  : 'Özel Seri'}
                              </span>
                              <span
                                className={`font-black flex items-center gap-1 ${
                                  isSel ? 'text-[#ff0055]' : 'text-slate-400 group-hover:text-slate-700'
                                }`}
                              >
                                {isSel ? (
                                  <>
                                    <Check size={13} strokeWidth={3} />
                                    <span>SEÇİLDİ</span>
                                  </>
                                ) : (
                                  <span>SEÇ</span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
              
              {/* 1. RENK SEÇENEKLERİ */}
              <div>
                <label className="flex items-center justify-between text-xs font-black uppercase text-slate-900 mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Palette size={14} className="text-[#ff0055]" />
                    Renk Seçeneği
                  </span>
                  <span className="text-[#ff0055] font-bold">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {availableColors.map((color: ProductColorOption) => {
                    const isSel = selectedColor === color.name;
                    const isGradient = color.hex.includes('gradient');
                    const isCompatible = isColorCompatibleWithFinish(color, selectedFinish);

                    return (
                      <button
                        key={color.name}
                        type="button"
                        disabled={!isCompatible}
                        onClick={() => handleSelectColor(color)}
                        title={
                          !isCompatible
                            ? `Bu renkte ${selectedFinish} folyo seçeneği mevcut değildir.`
                            : color.name
                        }
                        className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-bold active:scale-95 ${
                          clickedColor === color.name
                            ? 'animate-color-pop ring-2 ring-[#ff0055]'
                            : ''
                        } ${
                          isSel
                            ? 'border-[#ff0055] bg-pink-50/60 text-[#ff0055] shadow-xs ring-1 ring-[#ff0055] cursor-pointer'
                            : !isCompatible
                            ? 'border-slate-200/60 bg-slate-100/70 text-slate-400 opacity-50 cursor-not-allowed select-none'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white cursor-pointer'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-xs ${
                            !isCompatible ? 'opacity-40 grayscale-[40%]' : ''
                          }`}
                          style={{
                            background: isGradient ? color.hex : undefined,
                            backgroundColor: !isGradient ? color.hex : undefined,
                          }}
                        />
                        <span className={!isCompatible ? 'line-through text-slate-400' : ''}>
                          {color.name}
                        </span>

                        {/* Bu renkte seçili folyo yok uyarısı */}
                        {!isCompatible && (
                          <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 shrink-0">
                            {selectedFinish} Yok
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. MATERYAL KAPLAMA: PARLAK / MAT */}
              <div>
                <label className="flex items-center justify-between text-xs font-black uppercase text-slate-900 mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Layers size={14} className="text-[#ff0055]" />
                    Materyal Seçeneği
                  </span>
                  <span className="text-[#ff0055] font-bold">{selectedFinish} Yüzey</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['Parlak', 'Mat'] as const).map((finish) => {
                    const isSel = selectedFinish === finish;
                    const isCompatible = isFinishCompatibleWithColor(finish);

                    return (
                      <button
                        key={finish}
                        type="button"
                        disabled={!isCompatible}
                        onClick={() => handleSelectFinish(finish)}
                        title={
                          !isCompatible
                            ? `${selectedColor} renginde ${finish} folyo seçeneği mevcut değildir.`
                            : `${finish} Yüzey`
                        }
                        className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          isSel
                            ? 'border-[#ff0055] bg-pink-50/50 shadow-xs ring-2 ring-[#ff0055]/30 cursor-pointer'
                            : !isCompatible
                            ? 'border-slate-200/60 bg-slate-100/70 text-slate-400 opacity-50 cursor-not-allowed select-none'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {finish === 'Parlak' ? (
                            <Sparkles
                              size={15}
                              className={isSel ? 'text-[#ff0055]' : !isCompatible ? 'text-slate-400' : 'text-amber-500'}
                            />
                          ) : (
                            <Moon
                              size={15}
                              className={isSel ? 'text-[#ff0055]' : !isCompatible ? 'text-slate-400' : 'text-slate-600'}
                            />
                          )}
                          <span
                            className={`text-xs font-black uppercase ${
                              isSel
                                ? 'text-[#ff0055]'
                                : !isCompatible
                                ? 'line-through text-slate-400'
                                : 'text-slate-800'
                            }`}
                          >
                            {finish}
                          </span>
                        </div>

                        {/* Bu folyo seçili renkte yoksa uyarı rozeti */}
                        {!isCompatible ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md mt-1 border border-amber-200">
                            {selectedColor} için mevcut değil
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 mt-1">
                            {finish === 'Mat'
                              ? 'Pürüzsüz & Yansımasız Asil Duruş'
                              : 'Canlı & Işıltılı Süper Parlak Yüzey'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. BOYUT SEÇENEKLERİ */}
              <div>
                <label className="flex items-center justify-between text-xs font-black uppercase text-slate-900 mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 size={14} className="text-[#ff0055]" />
                    Boyut Seçeneği
                  </span>
                  <span className="text-[#ff0055] font-bold">{selectedDimension}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {product.dimensions.map((dim) => {
                    const isSel = selectedDimension === dim;
                    const dimPrice = product.dimensionPrices && typeof product.dimensionPrices[dim] === 'number'
                      ? product.dimensionPrices[dim]
                      : product.currentPrice;

                    return (
                      <button
                        key={dim}
                        type="button"
                        onClick={() => setSelectedDimension(dim)}
                        className={`px-3 py-2.5 rounded-lg border text-xs font-bold transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-0.5 ${
                          isSel
                            ? 'border-[#ff0055] bg-[#ff0055] text-white shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                        }`}
                      >
                        <span className="font-extrabold">{dim}</span>
                        <span className={`text-[11px] font-price ${isSel ? 'text-white/90' : 'text-slate-500'}`}>
                          ₺{dimPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Purchase CTA Bar */}
            <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
              {/* Adet Seçici */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1 shrink-0 w-full sm:w-auto justify-between sm:justify-start shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleQtyChange(-1)}
                  className="w-10 h-10 rounded-lg bg-white hover:bg-slate-100 active:scale-85 flex items-center justify-center font-bold text-slate-700 shadow-xs cursor-pointer transition-transform"
                >
                  -
                </button>
                <span className={`w-12 text-center font-mono font-black text-sm text-slate-900 select-none transition-all ${
                  isQtyFlipping ? 'animate-number-flip' : ''
                }`}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQtyChange(1)}
                  className="w-10 h-10 rounded-lg bg-white hover:bg-slate-100 active:scale-85 flex items-center justify-center font-bold text-slate-700 shadow-xs cursor-pointer transition-transform"
                >
                  +
                </button>
              </div>

              {/* Sepete Ekle Butonu */}
              <button
                type="button"
                onClick={handleAddToCartClick}
                className={`flex-1 w-full py-3.5 px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 ${
                  addedAnimation
                    ? 'bg-emerald-600 text-white animate-cart-spring shadow-emerald-500/30 ring-4 ring-emerald-500/20'
                    : 'bg-[#ff0055] hover:bg-[#ff6600] text-white hover:shadow-lg hover:shadow-orange-500/25'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check size={18} strokeWidth={3} />
                    <span>Sepete Eklendi!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>
                      Sepete Ekle · ₺{(currentUnitPrice * quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Description & Technical Details */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider mb-2">
                Ürün Açıklaması & Özellikleri
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {product.description}
              </p>

              <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                <div>✓ 1. Sınıf Döküm Vinil Folyo</div>
                <div>✓ Özel Transfer Bandı İle Kolay Uygulama</div>
                <div>✓ Boyaya ve Cama Zarar Vermez</div>
                <div>✓ Tazyikli Su & Güneş Işığına Dayanıklı</div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* YORUMLAR & DEĞERLENDİRME BÖLÜMÜ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <ReviewsSection
          productId={product.id}
          productName={product.name}
          reviews={productReviews}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onAddReview={onAddReview}
        />
      </div>

      {/* EN AŞAĞI BÖLÜMLER:
          1. Popüler Ürünler
          2. O Ürünün Olduğu Kategorideki Ürünler
          3. Son Gezdiğiniz Ürünler
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 sm:mt-24 space-y-16">
        
        {/* 1. POPÜLER ÜRÜNLER */}
        {popularProducts.length > 0 && (
          <section className="pt-5 sm:pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight font-display">
                POPÜLER ÜRÜNLER
              </h2>
            </div>
            <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 pt-0.5 px-0.5">
              {popularProducts.map((p) => {
                const isFav = favoriteIds.includes(p.id);
                const pRevs = reviews.filter((r) => r.productId === p.id);
                const pAvg =
                  pRevs.length > 0
                    ? (pRevs.reduce((a, b) => a + b.rating, 0) / pRevs.length).toFixed(1)
                    : '0.0';
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className="w-[152px] sm:w-[172px] shrink-0 bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-[#ff0055]/50 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    <div className="relative aspect-square w-full bg-[#fbfbfb] p-2 flex items-center justify-center border-b border-slate-100">
                      <StickerGraphic
                        type={p.svgType}
                        imageUrl={p.imageUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(p);
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-slate-400 hover:text-rose-500 flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Heart
                          size={15}
                          className={isFav ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}
                        />
                      </button>
                    </div>
                    <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase truncate group-hover:text-[#ff0055] transition-colors">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center text-amber-400 text-xs">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={10}
                              className={
                                pRevs.length > 0 && s <= Math.round(Number(pAvg))
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({pRevs.length})
                        </span>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-[#ff0055] font-extrabold text-xs sm:text-sm font-mono">
                          ₺{p.currentPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                          İncele &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. O ÜRÜNÜN OLDUĞU KATEGORİDEKİ ÜRÜNLER */}
        {categoryProducts.length > 0 && (
          <section className="pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-display">
                AYNI KATEGORİDEKİ DİĞER ÜRÜNLER
              </h2>
            </div>
            <div className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-4 pt-1 px-1">
              {categoryProducts.map((p) => {
                const isFav = favoriteIds.includes(p.id);
                const pRevs = reviews.filter((r) => r.productId === p.id);
                const pAvg =
                  pRevs.length > 0
                    ? (pRevs.reduce((a, b) => a + b.rating, 0) / pRevs.length).toFixed(1)
                    : '0.0';
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className="w-[220px] sm:w-[250px] shrink-0 bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-[#ff0055]/50 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    <div className="relative aspect-square w-full bg-[#fbfbfb] p-4 flex items-center justify-center border-b border-slate-100">
                      <StickerGraphic
                        type={p.svgType}
                        imageUrl={p.imageUrl}
                        className="w-full h-full max-h-[140px] object-contain group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(p);
                        }}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-slate-400 hover:text-rose-500 flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Heart
                          size={17}
                          className={isFav ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}
                        />
                      </button>
                    </div>
                    <div className="p-3.5 flex flex-col justify-between flex-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase truncate group-hover:text-[#ff0055] transition-colors">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center text-amber-400 text-xs">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              className={
                                pRevs.length > 0 && s <= Math.round(Number(pAvg))
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({pRevs.length})
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-[#ff0055] font-extrabold text-sm font-mono">
                          ₺{p.currentPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-0.5">
                          İncele &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. SON GEZDİĞİNİZ ÜRÜNLER */}
        {recentProducts.length > 0 && (
          <section className="pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-display">
                SON GEZDİĞİNİZ ÜRÜNLER
              </h2>
            </div>
            <div className="flex items-stretch gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-4 pt-1 px-1">
              {recentProducts.map((p) => {
                const isFav = favoriteIds.includes(p.id);
                const pRevs = reviews.filter((r) => r.productId === p.id);
                const pAvg =
                  pRevs.length > 0
                    ? (pRevs.reduce((a, b) => a + b.rating, 0) / pRevs.length).toFixed(1)
                    : '0.0';
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProduct(p)}
                    className="w-[220px] sm:w-[250px] shrink-0 bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-[#ff0055]/50 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col group cursor-pointer"
                  >
                    <div className="relative aspect-square w-full bg-[#fbfbfb] p-4 flex items-center justify-center border-b border-slate-100">
                      <StickerGraphic
                        type={p.svgType}
                        imageUrl={p.imageUrl}
                        className="w-full h-full max-h-[140px] object-contain group-hover:scale-105 transition-transform"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(p);
                        }}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-slate-400 hover:text-rose-500 flex items-center justify-center shadow-xs cursor-pointer"
                      >
                        <Heart
                          size={17}
                          className={isFav ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}
                        />
                      </button>
                    </div>
                    <div className="p-3.5 flex flex-col justify-between flex-1">
                      <h4 className="text-xs font-black text-slate-900 uppercase truncate group-hover:text-[#ff0055] transition-colors">
                        {p.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex items-center text-amber-400 text-xs">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              className={
                                pRevs.length > 0 && s <= Math.round(Number(pAvg))
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ({pRevs.length})
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-[#ff0055] font-extrabold text-sm font-mono">
                          ₺{p.currentPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-0.5">
                          İncele &rarr;
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
