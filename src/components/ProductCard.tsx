import React, { useState, useRef } from 'react';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Review } from '../types';
import { StickerGraphic } from './StickerGraphic';
import { ImageIndicatorPill } from './ImageIndicatorPill';

interface ProductCardProps {
  product: Product;
  isFav: boolean;
  reviews?: Review[];
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  className?: string;
  variant?: 'popular' | 'catalog';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isFav,
  reviews = [],
  onToggleFavorite,
  onSelectProduct,
  className = '',
  variant = 'popular',
}) => {
  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
      ? [product.imageUrl]
      : ['/akuz-logo-badge.png'];

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isHeartBursting, setIsHeartBursting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const colorCount = product.colors && product.colors.length > 0 ? product.colors.length : 12;

  // Dokunmatik & Fare ile fotoğrafları kaydırma (Ürüne girmeden diğer fotoğrafları görme)
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const hasSwipedRef = useRef(false);

  const handleDragStart = (clientX: number, clientY: number) => {
    // Popüler ürünler yatay kayar vitrininde parmakla kaydırma vitrine ait olmalıdır
    if (images.length <= 1 || variant === 'popular') return;
    startXRef.current = clientX;
    startYRef.current = clientY;
    isDraggingRef.current = true;
    hasSwipedRef.current = false;
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current || startXRef.current === null || startYRef.current === null) return;
    const diffX = clientX - startXRef.current;
    const diffY = clientY - startYRef.current;

    // Yatay hareket dikey hareketten belirginse swipe niyetidir
    if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) {
      hasSwipedRef.current = true;
    }
  };

  const handleDragEnd = (clientX: number, clientY: number, e?: React.SyntheticEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (startXRef.current !== null && startYRef.current !== null && images.length > 1) {
      const distanceX = startXRef.current - clientX;
      const distanceY = startYRef.current - clientY;
      const minSwipeDistance = 25; // 25px: Kullanıcı hafifçe kaydırdığında anında tepki verir

      if (Math.abs(distanceX) > minSwipeDistance && Math.abs(distanceX) > Math.abs(distanceY) * 0.8) {
        hasSwipedRef.current = true;
        if (distanceX > 0) {
          // Sol kaydırma -> Sonraki görsel
          setActiveImgIndex((prev) => (prev + 1) % images.length);
        } else {
          // Sağ kaydırma -> Önceki görsel
          setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
        }
        if (e) {
          e.stopPropagation();
        }
      }
    }

    startXRef.current = null;
    startYRef.current = null;

    // Eğer kaydırma yapıldıysa tıklama olayını kısa süre engelleyerek ürün detayının açılmasını önle
    if (hasSwipedRef.current) {
      setTimeout(() => {
        hasSwipedRef.current = false;
      }, 250);
    }
  };

  const handleProductSelect = () => {
    if (hasSwipedRef.current || isSelecting) return;
    setIsSelecting(true);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(16);
      }
    } catch {}
    // 160ms görsel onay: Müşteri tıkladığı ürünü net şekilde anlar, ardından pürüzsüzce açılır
    setTimeout(() => {
      onSelectProduct(product);
      setTimeout(() => setIsSelecting(false), 350);
    }, 160);
  };

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHeartBursting(true);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([18, 30]);
      }
    } catch {
      // ignore
    }
    onToggleFavorite(product);
    setTimeout(() => setIsHeartBursting(false), 500);
  };

  const pRevs = reviews.filter((r) => r.productId === product.id);
  const count = pRevs.length;
  const avg = count > 0 ? pRevs.reduce((a, b) => a + b.rating, 0) / count : 0;

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden border transition-all duration-200 flex flex-col group select-none ${
        isSelecting
          ? 'ring-2 ring-[#ff6600] border-[#ff6600] scale-[0.985] shadow-lg shadow-orange-500/20'
          : 'border-slate-200/90 shadow-xs hover:border-[#ff6600]/70 hover:shadow-lg hover:shadow-orange-500/10 active:scale-[0.985] active:border-[#ff6600]'
      } ${className}`}
    >
      {/* Top Sticker Canvas / Photo Area - Yatay kaydırılabilir görsel alanı */}
      <div
        onClick={handleProductSelect}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          handleDragEnd(touch.clientX, touch.clientY, e);
        }}
        onMouseDown={(e) => {
          if (e.button === 0) handleDragStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
        onMouseUp={(e) => {
          if (e.button === 0) handleDragEnd(e.clientX, e.clientY, e);
        }}
        onMouseLeave={(e) => {
          if (isDraggingRef.current) handleDragEnd(e.clientX, e.clientY, e);
        }}
        className="relative w-full aspect-square bg-[#fbfbfb] flex flex-col items-center justify-between cursor-pointer overflow-hidden border-b border-slate-100 touch-pan-y"
      >
        {/* Top Sticker Canvas / Photo Area */}
        {product.isCustomText && (
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
              Kişiye Özel
            </span>
          </div>
        )}

        {/* Tıklama Anı Yumuşak Turuncu Çerçeve (Kullanıcı telefonda neye dokunduğunu net anlar) */}
        {isSelecting && (
          <div className="absolute inset-0 bg-orange-500/10 pointer-events-none z-20 transition-all animate-fade-in ring-2 ring-[#ff6600] shadow-[0_0_18px_rgba(255,102,0,0.5)]" />
        )}

        {/* Top Right Heart Favorite Icon Button */}
        <button
          type="button"
          onClick={handleHeartClick}
          className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center transition-all duration-150 z-20 shadow-xs cursor-pointer active:scale-90 ${
            isHeartBursting ? 'ring-2 ring-rose-400 scale-110 shadow-[0_0_12px_rgba(244,63,94,0.6)]' : ''
          }`}
          title={isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
        >
          <Heart
            size={15}
            className={`transition-all duration-200 ${
              isHeartBursting
                ? 'animate-heart-burst text-rose-500 fill-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                : isFav
                ? 'text-rose-500 fill-rose-500'
                : 'text-slate-400 hover:text-[#ff6600]'
            }`}
          />
          {isHeartBursting && (
            <span className="absolute inset-0 pointer-events-none">
              <span
                className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e] animate-heart-sparkle"
                style={{ '--tw-sparkle-x': '14px', '--tw-sparkle-y': '-14px' } as any}
              />
              <span
                className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-heart-sparkle"
                style={{ '--tw-sparkle-x': '-14px', '--tw-sparkle-y': '-14px' } as any}
              />
              <span
                className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_6px_#fb923c] animate-heart-sparkle"
                style={{ '--tw-sparkle-x': '12px', '--tw-sparkle-y': '10px' } as any}
              />
            </span>
          )}
        </button>

        {/* Center: Sticker Photo / Artwork or Custom Text Carousel */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
          {product.isCustomText ? (
            <div className="w-full h-full bg-white flex flex-col items-center justify-center p-3 text-center select-none relative group-hover:scale-102 transition-transform duration-300">
              <span className="text-base sm:text-xl font-black text-black tracking-widest uppercase font-display leading-tight">
                YAZINIZI YAZIN
              </span>
            </div>
          ) : (
            <div
              className="flex w-full h-full transition-transform duration-300 ease-out will-change-transform select-none"
              style={{ transform: `translateX(-${activeImgIndex * 100}%)` }}
            >
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="min-w-full w-full h-full flex-shrink-0 flex items-center justify-center overflow-hidden select-none"
                >
                  <StickerGraphic
                    type={product.svgType}
                    imageUrl={img}
                    fit="cover"
                    className={`w-full h-full object-cover pointer-events-none transition-transform duration-300 ${
                      isSelecting ? 'scale-108 brightness-105' : 'group-hover:scale-105'
                    }`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Masaüstünde Fotoğraf Değiştirme Ok Butonları (Fare ile gezinen kullanıcılar için anında önceki/sonraki) */}
        {images.length > 1 && !product.isCustomText && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
              className="hidden md:group-hover:flex absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/85 text-white items-center justify-center z-20 shadow-sm transition-all active:scale-90 cursor-pointer"
              title="Önceki Fotoğraf"
              aria-label="Önceki Fotoğraf"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIndex((prev) => (prev + 1) % images.length);
              }}
              className="hidden md:group-hover:flex absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/85 text-white items-center justify-center z-20 shadow-sm transition-all active:scale-90 cursor-pointer"
              title="Sonraki Fotoğraf"
              aria-label="Sonraki Fotoğraf"
            >
              <ChevronRight size={15} />
            </button>
          </>
        )}

        {/* Bottom Pill Indicator (Sadece birden fazla fotoğraf olunca) */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center z-10 pointer-events-auto">
            <ImageIndicatorPill
              total={images.length}
              activeIndex={activeImgIndex}
              onSelect={(index) => setActiveImgIndex(index)}
            />
          </div>
        )}
      </div>

      {/* Bottom Info Band - Kompakt ve gereksiz boşlukları kesilmiş yapı */}
      <div className={`${variant === 'popular' ? 'p-2 sm:p-2.5' : 'p-2.5 sm:p-3 md:p-3.5'} bg-white flex flex-col justify-between flex-1 border-t border-slate-100`}>
        <div>
          <h3
            onClick={handleProductSelect}
            className={`font-black ${variant === 'popular' ? 'text-[11.5px] sm:text-xs md:text-[13px] min-h-[1.5rem] sm:min-h-[1.8rem]' : 'text-[11px] sm:text-xs md:text-sm min-h-[1.75rem] sm:min-h-[2.1rem]'} tracking-wide text-slate-900 uppercase cursor-pointer hover:text-[#ff6600] transition-colors line-clamp-2 leading-snug sm:leading-tight`}
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
            <div className="flex items-center text-amber-400 text-xs">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={variant === 'popular' ? 10 : 11}
                  className={
                    count > 0 && s <= Math.round(avg)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }
                />
              ))}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              ({count})
            </span>
          </div>
        </div>

        {/* Price & Renk Sayısı - Resmin altındaki bölmenin sağ altında sade ve net */}
        <div className={`${variant === 'popular' ? 'mt-1 pt-1.5' : 'mt-2 pt-2'} border-t border-slate-100 flex items-center justify-between`}>
          <div className="flex flex-col">
            {product.oldPrice > product.currentPrice && (
              <span className="text-[9px] sm:text-[10px] text-slate-400 line-through font-price font-medium">
                ₺{product.oldPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
            <span className={`font-extrabold ${variant === 'popular' ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm md:text-base'} text-red-600 font-price tracking-tight`}>
              ₺{product.currentPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {/* Resmin altındaki bölmenin sağ altında net ve sade renk ibaresi */}
          {colorCount > 1 && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-md bg-slate-100/90 text-slate-700 group-hover:text-[#ff6600] group-hover:bg-orange-50 group-hover:border-orange-200 text-[10px] sm:text-[11px] font-extrabold border border-slate-200 transition-colors shrink-0 select-none"
              title={`${colorCount} farklı renk seçeneği`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-400 inline-block shrink-0" />
              <span>+{colorCount} Renk</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
