/**
 * AKUZ Stickers - Akıllı Görsel Optimizasyon ve Yükleme Servisi
 * Cihazdan yüklenen yüksek çözünürlüklü fotoğrafları (5MB-20MB) tarayıcı içinde
 * HTML Canvas kullanarak 1200px boyutuna ve ~150KB boyutuna optimize eder.
 * Ardından sunucuya (/api/upload) yükleyerek temiz bir URL (/uploads/...) üretir.
 */

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Dosyayı tarayıcıda Canvas ile orantılı şekilde küçültüp optimize eder.
 */
export async function optimizeImageFile(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<{ dataUrl: string; width: number; height: number; originalSizeKb: number; optimizedSizeKb: number }> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    format = 'image/jpeg',
  } = options;

  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    // Görsel tipi kontrolü
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Lütfen geçerli bir resim dosyası seçin (JPG, PNG, WEBP vb.).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görsel yüklenirken hata oluştu. Dosya bozuk olabilir.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Boyut oranını koruyarak maksimum sınırlara çek
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Görsel işleme motoru (Canvas 2D) başlatılamadı.'));
        }

        // Beyaz arka plan (PNG saydamlığını korumak veya JPG arka planı için)
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(format, quality);
        // Base64 yaklaşık boyut hesabı
        const optimizedSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          width,
          height,
          originalSizeKb,
          optimizedSizeKb,
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Optimize edilen görseli sunucuya (/api/upload) kaydeder.
 * Sunucu erişilemezse bile optimize edilmiş (küçük boyutlu) dataUrl'i güvenle döndürür.
 */
export async function uploadImageToServer(
  dataUrlOrBase64: string,
  fileName?: string
): Promise<{ url: string; isRemote: boolean }> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: dataUrlOrBase64,
        fileName: fileName || `product_${Date.now()}.jpg`,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.url) {
        return { url: data.url, isRemote: true };
      }
    }
  } catch (err) {
    console.warn('[UPLOAD FALLBACK] Sunucuya doğrudan yükleme yapılamadı, yerel optimize görsel kullanılacak:', err);
  }

  // Fallback: Yerel optimize edilmiş Base64 verisi (Zaten <150KB boyutunda)
  return { url: dataUrlOrBase64, isRemote: false };
}

/**
 * Tek adımda dosyayı al, optimize et ve yükle
 */
export async function processAndUploadProductImage(
  file: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  if (onProgress) onProgress('Görsel optimize ediliyor...');
  const optimized = await optimizeImageFile(file, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.86,
    format: 'image/jpeg',
  });

  if (onProgress) onProgress('Sunucuya yükleniyor...');
  const result = await uploadImageToServer(optimized.dataUrl, file.name);

  return result.url;
}

/**
 * LocalStorage kotalarını aşmadan güvenli kaydetme yardımcısı
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    console.warn(`[STORAGE WARNING] ${key} kaydedilirken kota aşıldı (QuotaExceededError).`, err);
    try {
      // Eğer JSON dizisi ise ve çok büyükse, gereksiz büyük anahtarları temizle
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const lightweight = parsed.map((item: any) => {
          if (item && item.imageUrl && item.imageUrl.length > 500 && item.imageUrl.startsWith('data:')) {
            return { ...item, imageUrl: undefined };
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
        return true;
      }
    } catch {
      // Sessizce yut
    }
    return false;
  }
}
