const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data_storage');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const PUBLIC_DATA_DIR = path.join(ROOT_DIR, 'public', 'data_storage');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function syncPreviewData() {
  console.log('[SYNC] Önizleme verileri kaynak kodlara ve cPanel yapılandırmasına aktarılıyor...');
  ensureDir(DATA_DIR);
  ensureDir(PUBLIC_DATA_DIR);

  // 1. Ürünleri Senkronize Et (data_storage/products.json -> src/data/products.ts)
  const productsJsonFile = path.join(DATA_DIR, 'products.json');
  if (fs.existsSync(productsJsonFile)) {
    try {
      const raw = fs.readFileSync(productsJsonFile, 'utf8').trim();
      if (raw && raw !== '[]') {
        const products = JSON.parse(raw);
        if (Array.isArray(products) && products.length > 0) {
          const productsTsPath = path.join(SRC_DIR, 'data', 'products.ts');
          const tsCode = `import { Product } from '../types';

export const COLOR_OPTIONS = [
  { name: 'Siyah', hex: '#111827' },
  { name: 'Beyaz', hex: '#ffffff' },
  { name: 'Hologramlı', hex: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)' },
  { name: 'Kırmızı', hex: '#dc2626' },
  { name: 'Mavi', hex: '#2563eb' },
  { name: 'Gold', hex: '#d97706' },
  { name: 'Gümüş', hex: '#94a3b8' },
  { name: 'Yeşil', hex: '#16a34a' },
  { name: 'Sarı', hex: '#eab308' },
  { name: 'Mor', hex: '#9333ea' },
  { name: 'Lacivert', hex: '#1e3a8a' },
  { name: 'Turuncu', hex: '#ea580c' },
];

export const PRODUCTS: Product[] = ${JSON.stringify(products, null, 2)};
`;
          fs.writeFileSync(productsTsPath, tsCode, 'utf8');
          console.log(`[SYNC SUCCESS] src/data/products.ts güncellendi (${products.length} ürün).`);
        }
      }
    } catch (e) {
      console.warn('[SYNC WARN] products.json senkronizasyonu başarısız:', e.message);
    }
  }

  // 2. Ayarları ve Yuvarlak Butonları Senkronize Et (data_storage/settings.json -> src/utils/adminStore.ts)
  const settingsJsonFile = path.join(DATA_DIR, 'settings.json');
  const colorsJsonFile = path.join(DATA_DIR, 'global_colors.json');

  if (fs.existsSync(settingsJsonFile)) {
    try {
      const rawSettings = fs.readFileSync(settingsJsonFile, 'utf8').trim();
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        let colors = null;
        if (fs.existsSync(colorsJsonFile)) {
          try {
            const rawColors = fs.readFileSync(colorsJsonFile, 'utf8').trim();
            if (rawColors) colors = JSON.parse(rawColors);
          } catch {}
        }

        const categories = settings.categories || [];
        const whyAkuzCards = settings.whyAkuzCards || [];
        const aboutParagraphs = settings.aboutParagraphs || [];

        const adminStoreTsPath = path.join(SRC_DIR, 'utils', 'adminStore.ts');
        const adminStoreTsCode = `import { SiteSettings, CategoryCircleItem, WhyAkuzCardItem, ProductColorOption } from '../types';

export const INITIAL_CATEGORY_CIRCLES: CategoryCircleItem[] = ${JSON.stringify(categories, null, 2)};

export const INITIAL_WHY_AKUZ_CARDS: WhyAkuzCardItem[] = ${JSON.stringify(whyAkuzCards, null, 2)};

export const INITIAL_SITE_SETTINGS: SiteSettings = ${JSON.stringify({
          ...settings,
          categories,
          whyAkuzCards,
          aboutParagraphs,
        }, null, 2)};

// Global varsayılan renk paleti (Stokta var/yok & desteklenen folyo seçenekleri ile)
export const INITIAL_GLOBAL_COLORS: ProductColorOption[] = ${JSON.stringify(
          colors || [
            { name: 'Siyah', hex: '#111827', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Beyaz', hex: '#ffffff', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Hologramlı', hex: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)', inStock: true, supportedFinishes: ['Parlak'] },
            { name: 'Kırmızı', hex: '#dc2626', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Mavi', hex: '#2563eb', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Gold', hex: '#d97706', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Gümüş', hex: '#94a3b8', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Yeşil', hex: '#16a34a', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Sarı', hex: '#eab308', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Mor', hex: '#9333ea', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Lacivert', hex: '#1e3a8a', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
            { name: 'Turuncu', hex: '#ea580c', inStock: true, supportedFinishes: ['Mat', 'Parlak'] },
          ],
          null,
          2
        )};

const SETTINGS_KEY = 'akuz_site_settings';
const GLOBAL_COLORS_KEY = 'akuz_global_colors';

export const getStoredSiteSettings = (): SiteSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return INITIAL_SITE_SETTINGS;
    const parsed: SiteSettings = { ...INITIAL_SITE_SETTINGS, ...JSON.parse(raw) };
    if (!parsed.googleClientId) {
      parsed.googleClientId = INITIAL_SITE_SETTINGS.googleClientId || '947652767285-huldifd2fqu7gcdqqcq6emoufcom9h46.apps.googleusercontent.com';
    }
    if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      parsed.categories = INITIAL_CATEGORY_CIRCLES;
    }
    if (!parsed.whyAkuzCards || !Array.isArray(parsed.whyAkuzCards) || parsed.whyAkuzCards.length === 0) {
      parsed.whyAkuzCards = INITIAL_WHY_AKUZ_CARDS;
    }
    if (!parsed.aboutParagraphs || !Array.isArray(parsed.aboutParagraphs) || parsed.aboutParagraphs.length === 0) {
      parsed.aboutParagraphs = INITIAL_SITE_SETTINGS.aboutParagraphs;
    }
    if (parsed.shippingFee !== undefined && !isNaN(Number(parsed.shippingFee))) {
      parsed.shippingFee = Number(parsed.shippingFee);
    }
    if (parsed.freeShippingThreshold !== undefined && !isNaN(Number(parsed.freeShippingThreshold))) {
      parsed.freeShippingThreshold = Number(parsed.freeShippingThreshold);
    }
    return parsed;
  } catch {
    return INITIAL_SITE_SETTINGS;
  }
};

export const saveStoredSiteSettings = (settings: SiteSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save site settings', e);
  }
};

export const getStoredGlobalColors = (): ProductColorOption[] => {
  try {
    const raw = localStorage.getItem(GLOBAL_COLORS_KEY);
    if (!raw) return INITIAL_GLOBAL_COLORS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_GLOBAL_COLORS;
  }
};

export const saveStoredGlobalColors = (colors: ProductColorOption[]): void => {
  try {
    localStorage.setItem(GLOBAL_COLORS_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error('Failed to save global colors', e);
  }
};
`;
        fs.writeFileSync(adminStoreTsPath, adminStoreTsCode, 'utf8');
        console.log(`[SYNC SUCCESS] src/utils/adminStore.ts güncellendi (Kategoriler: ${categories.length} adet).`);
      }
    } catch (e) {
      console.warn('[SYNC WARN] settings.json senkronizasyonu başarısız:', e.message);
    }
  }

  // 3. data_storage/*.json dosyalarını public/data_storage içine kopyala (cPanel PHP & statik uyumu)
  try {
    if (fs.existsSync(DATA_DIR)) {
      const files = fs.readdirSync(DATA_DIR);
      for (const file of files) {
        const srcFile = path.join(DATA_DIR, file);
        if (fs.statSync(srcFile).isFile()) {
          fs.copyFileSync(srcFile, path.join(PUBLIC_DATA_DIR, file));
        }
      }
      console.log(`[SYNC SUCCESS] data_storage dosyaları public/data_storage klasörüne kopyalandı.`);
    }
  } catch (e) {
    console.warn('[SYNC WARN] public/data_storage kopyalama hatası:', e.message);
  }

  console.log('[SYNC COMPLETE] Tüm önizleme verileri başarıyla senkronize edildi.');
}

if (require.main === module) {
  syncPreviewData();
}

module.exports = { syncPreviewData };
