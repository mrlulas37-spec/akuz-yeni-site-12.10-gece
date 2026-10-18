import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Review } from '../types';
import { ProductCard } from './ProductCard';

interface PopularProductsProps {
  products: Product[];
  favoriteIds: string[];
  reviews?: Review[];
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAllClick: () => void;
  title?: string;
}

export const PopularProducts: React.FC<PopularProductsProps> = ({
  products,
  favoriteIds,
  reviews = [],
  onToggleFavorite,
  onSelectProduct,
  onViewAllClick,
  title = 'POPÜLER ÜRÜNLER',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const momentumShiftRef = useRef(0);
  const isPausedRef = useRef(false);
  const isInteractingRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  // Dokunmatik kaydırma takibi
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchStartPosRef = useRef(0);
  const isTouchSwipingRef = useRef(false);
  const swipeDirectionRef = useRef<'horizontal' | 'vertical' | null>(null);

  // Kesintisiz, sonsuz ve pürüzsüz akış için ürünleri 3 set olarak çoğaltıyoruz
  const copies = useMemo(() => (products.length >= 10 ? 2 : 3), [products.length]);

  const repeatedProducts = useMemo(() => {
    if (products.length === 0) return [];
    if (copies === 2) return [...products, ...products];
    return [...products, ...products, ...products];
  }, [products, copies]);

  // Geçici olarak kaymayı duraklatıp süre bitince kaldığı yerden devam ettirir
  const pauseAutoScrollTemporarily = useCallback((duration = 2000) => {
    isPausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      isPausedRef.current = false;
    }, duration);
  }, []);

  // GPU destekli, 60/120 FPS ultra akıcı, sıfır takılma (micro-stutter free) kayma motoru
  useEffect(() => {
    if (products.length <= 1) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    const SPEED = 22;
    let isVisibleInViewport = true;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisibleInViewport = entry.isIntersecting;
        if (isVisibleInViewport) {
          lastTime = performance.now();
          cancelAnimationFrame(animationFrameId);
          animationFrameId = requestAnimationFrame(step);
        }
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    const step = (now: number) => {
      if (!isVisibleInViewport) return;

      const dt = Math.min(now - lastTime, 50); // Maksimum 50ms (sekme geçişi gecikmesini önler)
      lastTime = now;

      const track = trackRef.current;
      if (track) {
        const singleSetWidth = track.scrollWidth / copies;

        // 1. Ok tuşlarına tıklandığında yumuşak momentum geçişi
        if (Math.abs(momentumShiftRef.current) > 0.2) {
          const shiftStep = momentumShiftRef.current * 0.12;
          posRef.current += shiftStep;
          momentumShiftRef.current -= shiftStep;
        } else if (!isPausedRef.current && !isInteractingRef.current) {
          // 2. Normal sakin otomatik akış (sub-pixel GPU interpolasyonu)
          posRef.current += (dt / 1000) * SPEED;
        }

        // 3. Kesintisiz sonsuz döngü (Görsel olarak sıfır sıçrama)
        if (singleSetWidth > 20) {
          while (posRef.current >= singleSetWidth) {
            posRef.current -= singleSetWidth;
          }
          while (posRef.current < 0) {
            posRef.current += singleSetWidth;
          }
        }

        // 4. Doğrudan transform: translate3d ile GPU üzerinden sıfır render maliyetli pürüzsüz kaydırma
        track.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPausedRef.current = true;
      } else {
        lastTime = performance.now();
        isPausedRef.current = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [products, copies]);

  // Sağ veya sol ok tıklandığında yumuşak şekilde yana kaydırma
  const handleScroll = (direction: 'left' | 'right') => {
    const shiftAmount = 230; // Yaklaşık bir ürün kartı genişliği
    pauseAutoScrollTemporarily(2500);

    if (direction === 'left') {
      momentumShiftRef.current -= shiftAmount;
    } else {
      momentumShiftRef.current += shiftAmount;
    }
  };

  // Dokunmatik olaylar (Mobil cihazlarda akıcı kaydırma ve sayfa dikey kaydırmasını engellememe)
  const handleTouchStart = (e: React.TouchEvent) => {
    isInteractingRef.current = true;
    isPausedRef.current = true;
    isTouchSwipingRef.current = false;
    swipeDirectionRef.current = null;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartPosRef.current = posRef.current;
    momentumShiftRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isInteractingRef.current || !trackRef.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = touchStartXRef.current - currentX;
    const deltaY = touchStartYRef.current - currentY;

    // Yön tespiti: Kullanıcı dikey olarak sayfayı kaydırıyorsa Popüler Ürünler dikey harekete asla engel olmaz
    if (swipeDirectionRef.current === null) {
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          // Sayfa dikey kaydırılıyor, yatay carouseli kilitle ve tarayıcıya bırak
          swipeDirectionRef.current = 'vertical';
          isInteractingRef.current = false;
          return;
        } else {
          swipeDirectionRef.current = 'horizontal';
        }
      } else {
        return;
      }
    }

    if (swipeDirectionRef.current !== 'horizontal') return;

    if (Math.abs(deltaX) > 5) {
      isTouchSwipingRef.current = true;
    }

    const track = trackRef.current;
    const singleSetWidth = track.scrollWidth / copies;

    let newPos = touchStartPosRef.current + deltaX;
    if (singleSetWidth > 20) {
      while (newPos >= singleSetWidth) newPos -= singleSetWidth;
      while (newPos < 0) newPos += singleSetWidth;
    }

    posRef.current = newPos;
    track.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
  };

  const handleTouchEnd = () => {
    isInteractingRef.current = false;
    swipeDirectionRef.current = null;
    pauseAutoScrollTemporarily(1800);
  };

  return (
    <section id="popular-products" className="py-2 sm:py-2.5 md:py-3 bg-slate-100/90 text-slate-900 border-b border-slate-200 overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-2.5 sm:px-4 lg:px-6">
        
        {/* Section Header: Yüksekliği daraltılmış, kompakt, tek satır ve net okunan başlık */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-1.5 sm:mb-2 pb-1 sm:pb-1.5 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base md:text-xl lg:text-2xl font-black italic tracking-tight sm:tracking-wide text-slate-900 uppercase font-display whitespace-nowrap truncate shrink-0">
              {title}
            </h2>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff6600]/10 text-[#ff6600]">
              Akıcı Kayar Liste
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Masaüstü Ürün Kaydırma Okları (Sonsuz döngüde her zaman aktif ve pürüzsüz) */}
            {products.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 mr-1">
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors shadow-xs cursor-pointer active:scale-95"
                  title="Önceki Ürünler"
                  aria-label="Önceki Ürünler"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-colors shadow-xs cursor-pointer active:scale-95"
                  title="Sonraki Ürünler"
                  aria-label="Sonraki Ürünler"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <button
              onClick={onViewAllClick}
              className="text-[#ff0055] hover:text-[#d90048] font-extrabold text-xs sm:text-xs md:text-sm tracking-wider flex items-center gap-1 group cursor-pointer whitespace-nowrap"
            >
              <span>TÜMÜNÜ GÖR</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Products list with GPU transform - Yana doğru kesintisiz, boşlukları kırpılmış kompakt vitrin */}
        {products.length === 0 ? (
          <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-slate-500 text-sm">Aradığınız kriterde ürün bulunamadı.</p>
            <button
              onClick={onViewAllClick}
              className="mt-2 px-4 py-1.5 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
            >
              Tüm Ürünleri Göster
            </button>
          </div>
        ) : (
          <div
            ref={containerRef}
            onMouseEnter={() => {
              isPausedRef.current = true;
            }}
            onMouseLeave={() => {
              isPausedRef.current = false;
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative overflow-hidden select-none -mx-2 sm:-mx-1 px-2 sm:px-1 py-0.5 touch-pan-y"
          >
            <div
              ref={trackRef}
              style={{
                willChange: 'transform',
                transform: 'translate3d(0, 0, 0)',
              }}
              className="flex items-stretch gap-2.5 sm:gap-3.5 pb-1 pt-0.5"
            >
              {repeatedProducts.map((product, idx) => (
                <ProductCard
                  key={`${product.id}-loop-${idx}`}
                  product={product}
                  variant="popular"
                  isFav={favoriteIds.includes(product.id)}
                  reviews={reviews}
                  onToggleFavorite={onToggleFavorite}
                  onSelectProduct={onSelectProduct}
                  className="w-[152px] sm:w-[172px] shrink-0"
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};


