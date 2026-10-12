import React, { useState, useRef } from 'react';
import { Heart, Star } from 'lucide-react';
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

  const handleProductSelect = () => {
    if (isSwipingRef.current || isSelecting) return;
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

  // Touch swipe support - SADECE 'catalog' varyantında aktif.
  // Popüler ürünlerde ve yatay kaydırılan carousel alanlarında fotoğrafın kayması engellenir, ürünler arasında rahatça kaydırılır.
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchEndYRef = useRef<number | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (variant !== 'catalog') return;
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = e.targetTouches[0].clientX;
    touchStartYRef.current = e.targetTouches[0].clientY;
    touchEndYRef.current = e.targetTouches[0].clientY;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (variant !== 'catalog') return;
    touchEndXRef.current = e.targetTouches[0].clientX;
    touchEndYRef.current = e.targetTouches[0].clientY;
    if (touchStartXRef.current !== null && touchStartYRef.current !== null) {
      const diffX = Math.abs(touchEndXRef.current - touchStartXRef.current);
      const diffY = Math.abs(touchEndYRef.current - touchStartYRef.current);
      if (diffX > 10 && diffX > diffY) {
        isSwipingRef.current = true;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (variant !== 'catalog') return;
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distanceX = touchStartXRef.current - touchEndXRef.current;
    const distanceY = (touchStartYRef.current || 0) - (touchEndYRef.current || 0);
    const minSwipeDistance = 35;

    // Yalnızca net yatay swipe olduğunda görsel değiştir, dikey sayfa kaydırmasını asla engelleme
    if (images.length > 1 && Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      if (distanceX > minSwipeDistance) {
        // Swipe Left -> Next Image
        e.stopPropagation();
        setActiveImgIndex((prev) => (prev + 1) % images.length);
      } else if (distanceX < -minSwipeDistance) {
        // Swipe Right -> Prev Image
        e.stopPropagation();
        setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
    touchStartYRef.current = null;
    touchEndYRef.current = null;
  };

  const pRevs = reviews.filter((r) => r.productId === product.id);
  const count = pRevs.length;
  const avg = count > 0 ? pRevs.reduce((a, b) => a + b.rating, 0) / count : 0;

  const currentDisplayImage = images[activeImgIndex] || images[0];

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden border transition-all duration-200 flex flex-col group select-none ${
        isSelecting
          ? 'ring-2 ring-[#ff6600] border-[#ff6600] scale-[0.985] shadow-lg shadow-orange-500/20'
          : 'border-slate-200/90 shadow-xs hover:border-[#ff6600]/70 hover:shadow-lg hover:shadow-orange-500/10 active:scale-[0.985] active:border-[#ff6600]'
      } ${className}`}
    >
      {/* Top Sticker Canvas / Photo Area */}
      <div
        onClick={handleProductSelect}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative w-full aspect-square bg-[#fbfbfb] flex flex-col items-center justify-between cursor-pointer overflow-hidden border-b border-slate-100 ${
          variant === 'catalog' ? 'touch-pan-y' : ''
        }`}
      >
        {/* Top Sticker Canvas / Photo Area */}
        {product.isCustomText && (
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
              Kişiye Özel
            </span>
          </div>
        )}

        {/* Tıklama Anı Yumuşak Onay Rozeti (Müşteri neye tıkladığını net anlar) */}
        {isSelecting && (
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] pointer-events-none z-20 flex items-center justify-center transition-all animate-fade-in">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-900/95 text-white text-[11px] font-black uppercase tracking-wider shadow-xl flex items-center gap-1.5 scale-105 transition-transform">
              <span className="w-2 h-2 rounded-full bg-[#ff0055] animate-ping" />
              <span>Açılıyor…</span>
            </span>
          </div>
        )}

        {/* Top Right Heart Favorite Icon Button */}
        <button
          type="button"
          onClick={handleHeartClick}
          className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center transition-all duration-150 z-20 shadow-xs cursor-pointer active:scale-90 ${
            isHeartBursting ? 'ring-3 ring-rose-400/40 scale-110' : ''
          }`}
          title={isFav ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
        >
          <Heart
            size={15}
            className={`transition-all duration-200 ${
              isHeartBursting
                ? 'animate-heart-burst text-[#ff0055] fill-[#ff0055]'
                : isFav
                ? 'text-rose-500 fill-rose-500'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          />
          {isHeartBursting && (
            <span className="absolute inset-0 pointer-events-none">
              <span
                className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#ff0055] animate-heart-sparkle"
                style={{ '--tw-sparkle-x': '14px', '--tw-sparkle-y': '-14px' } as any}
              />
              <span
                className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-rose-400 animate-heart-sparkle"
                style={{ '--tw-sparkle-x': '-14px', '--tw-sparkle-y': '-14px' } as any}
              />
              <span
                className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-amber-400 animate-heart-sparkle"
                style={{ '--tw-sparkle-x': '12px', '--tw-sparkle-y': '10px' } as any}
              />
            </span>
          )}
        </button>

        {/* Center: Sticker Photo / Artwork or Custom Text Preview */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
          {product.isCustomText ? (
            <div className="w-full h-full bg-white flex flex-col items-center justify-center p-3 text-center select-none relative group-hover:scale-102 transition-transform duration-300">
              <span className="text-base sm:text-xl font-black text-black tracking-widest uppercase font-display leading-tight">
                YAZINIZI YAZIN
              </span>
            </div>
          ) : (
            <StickerGraphic
              type={product.svgType}
              imageUrl={currentDisplayImage}
              fit="cover"
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isSelecting ? 'scale-108 brightness-105' : 'group-hover:scale-105'
              }`}
            />
          )}
        </div>

        {/* Bottom Pill Indicator (Sadece birden fazla fotoğraf olunca) */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center z-10">
            <ImageIndicatorPill
              total={images.length}
              activeIndex={activeImgIndex}
              onSelect={(index) => setActiveImgIndex(index)}
            />
          </div>
        )}
      </div>

      {/* Bottom Info Band - %20 Daha kompakt ve şık çerçeve yapısı */}
      <div className="p-2.5 sm:p-3 md:p-3.5 bg-white flex flex-col justify-between flex-1 border-t border-slate-100">
        <div>
          <h3
            onClick={handleProductSelect}
            className="font-black text-[11px] sm:text-xs md:text-sm tracking-wide text-slate-900 uppercase cursor-pointer hover:text-[#ff6600] transition-colors line-clamp-2 min-h-[1.75rem] sm:min-h-[2.1rem] leading-snug sm:leading-tight"
            title={product.name}
          >
            {product.name}
          </h3>

          <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
            <div className="flex items-center text-amber-400 text-xs">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={11}
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

        {/* Price & Action */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            {product.oldPrice > product.currentPrice && (
              <span className="text-[9px] sm:text-[10px] text-slate-400 line-through font-price font-medium">
                ₺{product.oldPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
            <span className="font-extrabold text-xs sm:text-sm md:text-base text-red-600 font-price tracking-tight">
              ₺{product.currentPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectProduct(product);
            }}
            className="text-[10px] font-black uppercase text-slate-700 hover:text-white bg-slate-100 hover:bg-[#ff0055] px-2 py-1 rounded-sm transition-colors cursor-pointer"
          >
            İNCELE
          </button>
        </div>
      </div>
    </div>
  );
};
