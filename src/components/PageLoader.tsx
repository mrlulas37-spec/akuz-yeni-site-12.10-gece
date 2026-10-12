import React, { useState, useEffect, useRef } from 'react';

interface PageLoaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ onComplete, forceShow = false }) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [runId, setRunId] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Manual replay listener
  useEffect(() => {
    const handleReplay = () => {
      setIsFadingOut(false);
      setProgress(4);
      setPhase(0);
      setIsVisible(true);
      setRunId((prev) => prev + 1);
    };

    window.addEventListener('akuz:play-loader', handleReplay);
    return () => window.removeEventListener('akuz:play-loader', handleReplay);
  }, []);

  // 60FPS Canlı Sinüs Dalga & Sıvı Yükselme Animasyonu (Hızlı ve akıcı)
  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    const duration = 1300; // Tam 1.3 saniye yüklenme animasyonu süresi
    let currentPhase = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(1, elapsed / duration);

      // Doğal, yumuşak başlayan ve biten su dolumu ivmesi
      const easeProgress = 1 - Math.pow(1 - rawProgress, 1.4);

      const currentPercent = Math.min(100, Math.round(easeProgress * 100));
      setProgress(currentPercent);

      currentPhase += 0.09;
      setPhase(currentPhase);

      if (rawProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // %100 dolduğunda logo parıldasın ve ardından pürüzsüzce mağaza açılsın
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsVisible(false);
            if (onCompleteRef.current) onCompleteRef.current();
          }, 350);
        }, 180);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible, runId]);

  const handleQuickDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onCompleteRef.current) onCompleteRef.current();
    }, 250);
  };

  // Dalga Kapalı Alan Yolu (Renkli logoyu su dalgası şeklinde keser)
  const getWavePath = (level: number, wavePhase: number, amp: number) => {
    const yBase = 100 - level;
    if (level <= 0) return 'M 0 100 L 100 100 Z';
    if (level >= 99) return 'M 0 0 L 100 0 L 100 100 L 0 100 Z';

    const currentAmp = level > 92 ? amp * ((100 - level) / 8) : level < 8 ? amp * (level / 8) : amp;

    let d = `M 0 100 L 0 ${yBase}`;
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * 100;
      const yWave = yBase +
        Math.sin((x / 100) * Math.PI * 3.5 + wavePhase) * currentAmp +
        Math.sin((x / 100) * Math.PI * 1.8 + wavePhase * 1.3) * (currentAmp * 0.35);
      d += ` L ${x.toFixed(2)} ${yWave.toFixed(2)}`;
    }
    d += ` L 100 100 Z`;
    return d;
  };

  // Dalga Tepesi Çizgi Yolu: Logonun dairesel kiriş sınırları içinde kalır (dışarı taşmaz)
  const getWaveCrestLine = (level: number, wavePhase: number, amp: number) => {
    const yBase = 100 - level;
    if (level <= 1 || level >= 99) return '';

    const currentAmp = level > 92 ? amp * ((100 - level) / 8) : level < 8 ? amp * (level / 8) : amp;

    // Daire yarıçapı R = 48, merkez (50, 50). Su seviyesindeki kiriş genişliğini hesapla:
    const dy = Math.abs(yBase - 50);
    const maxDy = 47.5;
    if (dy > maxDy) return '';
    const dx = Math.sqrt(Math.max(0, 48 * 48 - dy * dy));
    const xStart = Math.max(3, 50 - dx);
    const xEnd = Math.min(97, 50 + dx);

    let d = '';
    const steps = 22;
    for (let i = 0; i <= steps; i++) {
      const x = xStart + (i / steps) * (xEnd - xStart);
      const yWave = yBase +
        Math.sin((x / 100) * Math.PI * 3.5 + wavePhase) * currentAmp +
        Math.sin((x / 100) * Math.PI * 1.8 + wavePhase * 1.3) * (currentAmp * 0.35);
      d += i === 0 ? `M ${x.toFixed(2)} ${yWave.toFixed(2)}` : ` L ${x.toFixed(2)} ${yWave.toFixed(2)}`;
    }
    return d;
  };

  if (!isVisible && !forceShow) {
    return null;
  }

  const mainWavePath = getWavePath(progress, phase, 3.6);
  const secondaryWavePath = getWavePath(progress, phase + 2.1, 2.7);
  const waveCrestPath = getWaveCrestLine(progress, phase, 3.6);

  return (
    <aside
      aria-label="Yükleniyor"
      onClick={handleQuickDismiss}
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#070a12] select-none cursor-pointer transition-opacity duration-600 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Canlı Atmosferik Neon Işımaları */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 sm:w-96 sm:h-96 bg-[#ff4400]/25 rounded-full blur-3xl opacity-90 animate-pulse" />
        <div className="w-64 h-64 bg-[#ff0055]/20 rounded-full blur-2xl opacity-75" />
      </div>

      {/* SADECE LOGO - Canlı, zengin ve parlak neon renklerle su dolumu */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-76 md:h-76 flex items-center justify-center">
        
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full object-contain pointer-events-none select-none"
        >
          <defs>
            {/* 1. Logonun Yuvarlak Rozet Sınırı - Dışarı taşmayı tamamen önleyen sınır */}
            <clipPath id="akuzBadgeShapeClip">
              <circle cx="50" cy="50" r="48" />
            </clipPath>

            {/* 2. Ana Su Dalgası Kesim Yolu */}
            <clipPath id="akuzLiquidWaveClip">
              <path d={mainWavePath} />
            </clipPath>

            {/* 3. İkincil Dalga Kesim Yolu */}
            <clipPath id="akuzSecondaryWaveClip">
              <path d={secondaryWavePath} />
            </clipPath>

            {/* Zengin Neon Turuncu / Ateş Sıvı Gradyanı */}
            <linearGradient id="primaryLiquidGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ff1e00" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#ff5500" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#ff7b00" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffaa00" stopOpacity="0.9" />
            </linearGradient>

            {/* İkincil Yarı-Saydam Dalga Gradyanı (Işıltı ve Derinlik) */}
            <linearGradient id="secondaryLiquidGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ff0055" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ff7700" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffcc00" stopOpacity="0.6" />
            </linearGradient>

            {/* Su Yüzeyi Neon Parlama Çizgisi */}
            <linearGradient id="crestGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff0055" stopOpacity="0" />
              <stop offset="15%" stopColor="#ff5500" stopOpacity="1" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="55%" stopColor="#ffdd00" stopOpacity="1" />
              <stop offset="85%" stopColor="#ff5500" stopOpacity="1" />
              <stop offset="100%" stopColor="#ff0055" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 1. KATMAN: TABAN LOGO (Solgun gri yerine, derin camın arkasında bekleyen doğal silüet) */}
          <image
            href="/akuz-logo-badge.png"
            x="0"
            y="0"
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid meet"
            opacity="0.35"
            style={{
              filter: 'brightness(0.7) contrast(1.15)',
            }}
          />

          {/* Daire sınırına hapsedilen zengin sıvı & logo katmanları */}
          <g clipPath="url(#akuzBadgeShapeClip)">
            {/* 2. KATMAN: İKİNCİL DERİNLİK DALGASI (Neon pembe/altın su ışıltısı) */}
            <path
              d={secondaryWavePath}
              fill="url(#secondaryLiquidGrad)"
            />

            {/* 3. KATMAN: PARLAK NEON TURUNCU SIVI KÜTLESİ (Suyun içi rengarenk ve capcanlı) */}
            <path
              d={mainWavePath}
              fill="url(#primaryLiquidGrad)"
              opacity="0.5"
              style={{
                mixBlendMode: 'screen',
              }}
            />

            {/* 4. KATMAN: SU İÇİNDE YÜKSELEN 100% CANLI, ULTRA-DOYGUN, PARLAK LOGO */}
            <g clipPath="url(#akuzLiquidWaveClip)">
              <image
                href="/akuz-logo-badge.png"
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  filter: 'saturate(1.35) contrast(1.12) drop-shadow(0 0 10px rgba(255, 85, 0, 0.45))',
                }}
              />
            </g>

            {/* 5. KATMAN: SU İÇİNDE YÜKSELEN CANLI PARLAK BALONCUKLAR */}
            {progress > 5 && progress < 96 && (
              <g>
                <circle
                  cx={36 + Math.sin(phase * 1.5) * 3}
                  cy={Math.max(100 - progress + 6, 100 - (progress * 0.75))}
                  r="1.2"
                  fill="#ffffff"
                  style={{ filter: 'drop-shadow(0 0 2px #ff7700)' }}
                />
                <circle
                  cx={52 + Math.cos(phase * 1.3) * 4}
                  cy={Math.max(100 - progress + 9, 100 - (progress * 0.52))}
                  r="1.6"
                  fill="#ffaa00"
                  style={{ filter: 'drop-shadow(0 0 3px #ff3300)' }}
                />
                <circle
                  cx={64 + Math.sin(phase * 1.8) * 3}
                  cy={Math.max(100 - progress + 5, 100 - (progress * 0.82))}
                  r="1.1"
                  fill="#ffffff"
                  style={{ filter: 'drop-shadow(0 0 2px #ff0055)' }}
                />
                <circle
                  cx={44 + Math.cos(phase * 1.7) * 2.5}
                  cy={Math.max(100 - progress + 14, 100 - (progress * 0.4))}
                  r="1.3"
                  fill="#ff7700"
                  style={{ filter: 'drop-shadow(0 0 2px #ffffff)' }}
                />
              </g>
            )}

            {/* 6. KATMAN: SU YÜZEYİ PARLAK NEON IŞILTI ÇİZGİSİ */}
            {waveCrestPath && (
              <path
                d={waveCrestPath}
                fill="none"
                stroke="url(#crestGlowGrad)"
                strokeWidth="1.8"
                strokeLinecap="round"
                style={{
                  filter: 'drop-shadow(0 0 3px #ff5500) drop-shadow(0 0 5px #ffcc00)',
                }}
              />
            )}

            {/* 7. KATMAN: TAM DAİRE İNCE NEON ÇERÇEVE PARILTISI */}
            <circle
              cx="50"
              cy="50"
              r="47.6"
              fill="none"
              stroke="url(#crestGlowGrad)"
              strokeWidth="0.8"
              opacity={0.35 + (progress / 100) * 0.65}
            />
          </g>

          {/* 8. KATMAN: %100 TAMAMLANDIĞINDA MUAZZAM IŞILTI */}
          {progress >= 99 && (
            <g clipPath="url(#akuzBadgeShapeClip)">
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="url(#primaryLiquidGrad)"
                opacity="0.25"
              />
              <image
                href="/akuz-logo-badge.png"
                x="0"
                y="0"
                width="100"
                height="100"
                preserveAspectRatio="xMidYMid meet"
                className="animate-pulse"
                opacity="0.9"
                style={{
                  filter: 'saturate(1.4) contrast(1.15) drop-shadow(0 0 16px rgba(255, 102, 0, 0.75))',
                }}
              />
            </g>
          )}
        </svg>
      </div>
    </aside>
  );
};
