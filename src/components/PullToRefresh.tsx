import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh?: () => Promise<void> | void;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ disabled = false }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isPullingRef = useRef(false);

  const THRESHOLD = 72; // Yenileme için gereken piksel mesafesi

  useEffect(() => {
    if (disabled || typeof window === 'undefined') return;

    const handleTouchStart = (e: TouchEvent) => {
      // Sadece sayfanın tam en üstündeyken çekme hareketini başlat
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY <= 0 && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        currentYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      if (scrollY > 0) {
        isPullingRef.current = false;
        setPullDistance(0);
        setIsPulling(false);
        return;
      }

      currentYRef.current = e.touches[0].clientY;
      const rawDelta = currentYRef.current - startYRef.current;

      if (rawDelta > 0) {
        // Aşağı çekme hareketi: Yumuşatılmış elastik direnç formülü
        const damped = Math.min(rawDelta * 0.42, 115);
        setPullDistance(damped);
        setIsPulling(true);

        // Doğal kaydırma çakışmasını önle
        if (damped > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    const handleTouchEnd = () => {
      if (!isPullingRef.current) return;
      isPullingRef.current = false;

      const rawDelta = currentYRef.current - startYRef.current;
      const damped = Math.min(rawDelta * 0.42, 115);

      if (damped >= THRESHOLD && !isRefreshing) {
        // Eşik aşıldı -> Sayfaya reload at!
        setIsRefreshing(true);
        setPullDistance(THRESHOLD);
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate?.(30);
          }
        } catch {}

        // Kullanıcıya yükleme animasyonunu hissettirip reload at
        setTimeout(() => {
          window.location.reload();
        }, 320);
      } else {
        // Eşik aşılmadı -> Geri toparla
        setPullDistance(0);
        setIsPulling(false);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disabled, isRefreshing]);

  if (!isPulling && !isRefreshing) return null;

  const isReadyToRelease = pullDistance >= THRESHOLD;
  const rotationAngle = Math.min((pullDistance / THRESHOLD) * 360, 360);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center transition-all duration-150"
      style={{
        transform: `translateY(${Math.max(0, pullDistance - 15)}px)`,
        opacity: Math.min(pullDistance / 35, 1),
      }}
    >
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 text-white shadow-xl border border-slate-700/80 backdrop-blur-md">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
            isRefreshing ? 'animate-spin text-[#ff0055]' : isReadyToRelease ? 'text-emerald-400' : 'text-slate-300'
          }`}
          style={!isRefreshing ? { transform: `rotate(${rotationAngle}deg)` } : undefined}
        >
          {isRefreshing ? (
            <RefreshCw size={15} />
          ) : isReadyToRelease ? (
            <RefreshCw size={15} />
          ) : (
            <ArrowDown size={15} />
          )}
        </div>

        <span className="text-xs font-bold tracking-tight">
          {isRefreshing
            ? 'Sayfa Yenileniyor...'
            : isReadyToRelease
            ? 'Bırakın, Sayfa Yenilensin'
            : 'Yenilemek için aşağı çekin'}
        </span>
      </div>
    </div>
  );
};
