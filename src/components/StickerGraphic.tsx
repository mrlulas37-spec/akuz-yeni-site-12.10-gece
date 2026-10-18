import React, { useState, useEffect } from 'react';

interface StickerGraphicProps {
  type?: string;
  colorHex?: string;
  colorName?: string;
  className?: string;
  customText?: string;
  imageUrl?: string;
  fit?: 'contain' | 'cover';
}

const colorizedCache = new Map<string, string>();

function hexToRgb(hex?: string) {
  if (!hex) return { r: 17, g: 24, b: 39 };
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(clean);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 17, g: 24, b: 39 };
}

// Convert HSL to RGB for Hologram gradient
function hslToRgb(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

export const StickerGraphic: React.FC<StickerGraphicProps> = ({
  className = 'w-full h-full max-h-[170px]',
  imageUrl = '/akuz-logo-badge.png',
  colorHex,
  colorName,
  fit = 'cover',
}) => {
  const [displaySrc, setDisplaySrc] = useState<string>(imageUrl || '/akuz-logo-badge.png');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const src = imageUrl || '/akuz-logo-badge.png';

    // Siyah, boş renk veya görsel yoksa doğrudan orijinali kullan
    const isBlack = !colorName || colorName.toLowerCase() === 'siyah' || colorHex === '#111827' || colorHex === '#000000';
    if (isBlack || !src || src.includes('.svg')) {
      setDisplaySrc(src);
      return;
    }

    const isHologram = colorName?.toLowerCase().includes('hologram') || (colorHex && colorHex.includes('gradient'));
    const isWhite = colorName?.toLowerCase() === 'beyaz' || colorHex?.toLowerCase() === '#ffffff';
    const cacheKey = `${src}_${colorName || ''}_${colorHex || ''}`;

    if (colorizedCache.has(cacheKey)) {
      setDisplaySrc(colorizedCache.get(cacheKey)!);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      if (!isMounted) return;

      try {
        const canvas = document.createElement('canvas');
        const maxDim = 800; // Optimum kalite ve ultra-hızlı işleme için
        let w = img.naturalWidth || img.width || 400;
        let h = img.naturalHeight || img.height || 400;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setDisplaySrc(src);
          setIsLoading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Köşe piksellerinin açık zemin olup olmadığını kontrol et (vektörel sticker çizimi tespiti)
        const checkCornersBright = () => {
          const cornerIndices = [0, (w - 1) * 4, ((h - 1) * w) * 4, ((h - 1) * w + (w - 1)) * 4];
          let brightCount = 0;
          for (const idx of cornerIndices) {
            const b = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            if (b > 180) brightCount++;
          }
          return brightCount >= 3;
        };

        const isArtworkOnWhite = checkCornersBright();

        // Eğer gerçek araç üzerinde çekilmiş bir fotoğraf ise, orijinal hali daha doğaldır
        if (!isArtworkOnWhite) {
          setDisplaySrc(src);
          setIsLoading(false);
          return;
        }

        const rgb = hexToRgb(colorHex);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

          // Koyu çizgi tespiti (sticker çizgisi / deseni)
          if (brightness < 205) {
            const strength = Math.min(1, (215 - brightness) / 160);

            if (isHologram) {
              const pixelX = (i / 4) % w;
              const pixelY = Math.floor((i / 4) / w);
              const hue = Math.round(((pixelX / w) * 320 + (pixelY / h) * 60)) % 360;
              const [hr, hg, hb] = hslToRgb(hue, 95, 62);
              data[i] = Math.round(r * (1 - strength) + hr * strength);
              data[i + 1] = Math.round(g * (1 - strength) + hg * strength);
              data[i + 2] = Math.round(b * (1 - strength) + hb * strength);
            } else if (isWhite) {
              // Beyaz sticker: çizgileri parlak beyaz yap
              data[i] = Math.min(255, 240 + Math.round(15 * strength));
              data[i + 1] = Math.min(255, 240 + Math.round(15 * strength));
              data[i + 2] = Math.min(255, 245 + Math.round(10 * strength));
            } else {
              // Hedef folyo rengi (Kırmızı, Mavi, Gold, vb.)
              data[i] = Math.round(r * (1 - strength) + rgb.r * strength);
              data[i + 1] = Math.round(g * (1 - strength) + rgb.g * strength);
              data[i + 2] = Math.round(b * (1 - strength) + rgb.b * strength);
            }
          } else if (isWhite) {
            // Beyaz seçildiğinde beyaz stickerın görünmesi için arka planı hafif füme araç camı tonuna al
            data[i] = 28;
            data[i + 1] = 32;
            data[i + 2] = 40;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const resultUrl = canvas.toDataURL('image/jpeg', 0.9);
        colorizedCache.set(cacheKey, resultUrl);

        if (isMounted) {
          setDisplaySrc(resultUrl);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setDisplaySrc(src);
          setIsLoading(false);
        }
      }
    };

    img.onerror = () => {
      if (isMounted) {
        setDisplaySrc(src);
        setIsLoading(false);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [imageUrl, colorHex, colorName]);

  return (
    <div className={`flex items-center justify-center select-none overflow-hidden relative ${className}`}>
      <img
        src={displaySrc}
        alt="Sticker Görseli"
        className={`w-full h-full ${
          fit === 'cover' ? 'object-cover' : 'object-contain'
        } transition-all duration-300 group-hover:scale-105 ${
          isLoading ? 'opacity-85 scale-[0.99]' : 'opacity-100 scale-100'
        }`}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};
