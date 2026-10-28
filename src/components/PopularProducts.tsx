import React, { useRef, useEffect, useMemo, useCallback } from 'react';
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
  const momentumRef = useRef(0); // px per second
  const isPausedRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  // Dokunmatik & Fare ile akıcı sürükleme ve kinetik momentum takibi
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0); // px per ms
  const hasSwipedRef = useRef(false);
  const directionLockedRef = useRef<'horizontal' | 'vertical' | null>(null);

  // Kesintisiz sonsuz döngü için ürünleri çoğaltıyoruz
  const copies = useMemo(() => (products.length >= 10 ? 2 : 3), [products.length]);

  const repeatedProducts = useMemo(() => {
    if (products.length === 0) return [];
    if (copies === 2) return [...products, ...products];
    return [...products, ...products, ...products];
  }, [products, copies]);

  // Geçici olarak kaymayı duraklatıp süre bitince kaldığı yerden devam ettirir
  const pauseAutoScrollTemporarily = useCallback((duration = 2500) => {
    isPausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      isPausedRef.current = false;
    }, duration);
  }, []);

  // GPU destekli 60/120 FPS ultra akıcı, kinetik momentumlu kayma motoru
  useEffect(() => {
    if (products.length <= 1) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    const SPEED = 22; // Sakin otomatik akış hızı (px/sn)
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

      const dt = Math.min(now - lastTime, 40); // Maksimum 40ms frame delta
      lastTime = now;

      const track = trackRef.current;
      if (track) {
        const singleSetWidth = track.scrollWidth / copies;

        if (!isDraggingRef.current) {
          // 1. Kinetik Momentum Hareketi (Kullanıcı parmağıyla fırlattığında veya oklara bastığında)
          if (Math.abs(momentumRef.current) > 4) {
            const shift = (momentumRef.current * dt) / 1000;
            posRef.current += shift;
            // Yumuşak fiziksel sürtünme: 120/60 FPS ekranlarda ipeksi yavaşlama
            const friction = Math.pow(0.925, dt / 16.6);
            momentumRef.current *= friction;
          } else {
            momentumRef.current = 0;
            // 2. Normal sakin arka plan akışı
            if (!isPausedRef.current) {
              posRef.current += (dt / 1000) * SPEED;
            }
          }

          // 3. Kesintisiz sonsuz döngü (Sıfır atlama, kusursuz akış)
          if (singleSetWidth > 20) {
            while (posRef.current >= singleSetWidth) {
              posRef.current -= singleSetWidth;
            }
            while (posRef.current < 0) {
              posRef.current += singleSetWidth;
            }
          }

          track.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;
        }
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

  // Sağ veya sol ok tıklandığında yumuşak ve akıcı momentum ile yana kaydırma
  const handleScroll = (direction: 'left' | 'right') => {
    pauseAutoScrollTemporarily(2800);
    const flingSpeed = 1200; // Akıcı geçiş hızı
    if (direction === 'left') {
      momentumRef.current = -flingSpeed;
    } else {
      momentumRef.current = flingSpeed;
    }
  };

  // Dokunmatik / Fare Sürükleme Başlangıcı (Anında tepki)
  const handleDragStart = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    startXRef.current = clientX;
    startYRef.current = clientY;
    lastXRef.current = clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    momentumRef.current = 0;
    hasSwipedRef.current = false;
    directionLockedRef.current = null;
    isPausedRef.current = true;
  };

  // Dokunmatik / Fare Hareketi (1:1 parmak takibi, sıfır gecikme)
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const totalX = clientX - startXRef.current;
    const totalY = clientY - startYRef.current;

    // Yön Tespiti: Kullanıcı sayfayı dikey mi kaydırıyor yoksa yatay carouseli mi?
    if (directionLockedRef.current === null) {
      if (Math.abs(totalX) > 4 || Math.abs(totalY) > 4) {
        if (Math.abs(totalX) >= Math.abs(totalY) * 0.7) {
          directionLockedRef.current = 'horizontal';
        } else {
          // Sayfa dikey kaydırılıyor, carousel sürüklemesini iptal et ve tarayıcıya bırak
          directionLockedRef.current = 'vertical';
          isDraggingRef.current = false;
          return;
        }
      } else {
        return;
      }
    }

    if (directionLockedRef.current !== 'horizontal') return;

    if (Math.abs(totalX) > 7) {
      hasSwipedRef.current = true;
    }

    const dx = lastXRef.current - clientX;
    posRef.current += dx;

    const track = trackRef.current;
    const singleSetWidth = track.scrollWidth / copies;
    if (singleSetWidth > 20) {
      while (posRef.current >= singleSetWidth) posRef.current -= singleSetWidth;
      while (posRef.current < 0) posRef.current += singleSetWidth;
    }
    track.style.transform = `translate3d(-${posRef.current}px, 0, 0)`;

    // Hız hesaplaması (Exponential smoothing ile gürültüden arındırılmış akıcı hız)
    const instVelocity = dx / dt;
    velocityRef.current = velocityRef.current * 0.35 + instVelocity * 0.65;

    lastXRef.current = clientX;
    lastTimeRef.current = now;
  };

  // Dokunmatik / Fare Bitişi (Kinetik Fırlatma)
  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    directionLockedRef.current = null;

    // Kullanıcı parmağını hareket halinde kaldırdıysa fırlatma momentumu ver
    const timeSinceLastMove = performance.now() - lastTimeRef.current;
    if (timeSinceLastMove < 120 && Math.abs(velocityRef.current) > 0.08) {
      const rawMomentum = velocityRef.current * 1000; // px / sn
      momentumRef.current = Math.max(-2800, Math.min(2800, rawMomentum));
    } else {
      momentumRef.current = 0;
    }

    // Kısa süre sonra swipe bayrağını temizle (yanlışlıkla ürün detayının açılmasını önler)
    setTimeout(() => {
      hasSwipedRef.current = false;
    }, 220);

    // Otomatik sakin akışı 2.5 saniye sonra nazikçe devam ettir
    pauseAutoScrollTemporarily(2500);
  };

  // Sürükleme esnasında ürün kartına yanlışlıkla tıklanmasını engelleyen yakalayıcı
  const handleCaptureClick = (e: React.MouseEvent) => {
    if (hasSwipedRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return (
    <section id="popular-products" className="py-2 sm:py-2.5 md:py-3 bg-slate-100/90 text-slate-900 border-b border-slate-200 overflow-hidden">
      <div className="w-full max-w-[1440px] mx-auto px-2.5 sm:px-4 lg:px-6">
        
        {/* Section Header: Kompakt, tek satır ve net okunan başlık */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-1.5 sm:mb-2 pb-1 sm:pb-1.5 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <h2 className="text-[15.5px] sm:text-[17.5px] md:text-[22px] lg:text-[26.5px] font-black italic tracking-tight sm:tracking-wide text-slate-900 uppercase font-display whitespace-nowrap truncate shrink-0">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Masaüstü Ürün Kaydırma Okları */}
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

        {/* Ürünler Listesi - İpeksi Kinetik Dokunmatik Kayma */}
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
              handleDragEnd();
              isPausedRef.current = false;
            }}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={handleDragEnd}
            onTouchCancel={handleDragEnd}
            onMouseDown={(e) => {
              if (e.button === 0) handleDragStart(e.clientX, e.clientY);
            }}
            onMouseMove={(e) => {
              handleDragMove(e.clientX, e.clientY);
            }}
            onMouseUp={handleDragEnd}
            onClickCapture={handleCaptureClick}
            className="relative overflow-hidden select-none -mx-2 sm:-mx-1 px-2 sm:px-1 py-0.5 touch-pan-y cursor-grab active:cursor-grabbing"
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
                  className="w-[166px] sm:w-[188px] md:w-[200px] shrink-0"
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
