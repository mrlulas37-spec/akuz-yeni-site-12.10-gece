import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PRODUCTS } from '../src/data/products';
import {
  INITIAL_SITE_SETTINGS,
  INITIAL_GLOBAL_COLORS,
  INITIAL_CATEGORY_CIRCLES,
  INITIAL_WHY_AKUZ_CARDS,
} from '../src/utils/adminStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(BASE_DIR, 'data_storage');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const COLORS_FILE = path.join(DATA_DIR, 'global_colors.json');

// 1. PRODUCTS.JSON
// If products.json doesn't exist or is empty, populate from PRODUCTS
let currentProducts = PRODUCTS;
if (fs.existsSync(PRODUCTS_FILE)) {
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      currentProducts = parsed;
    }
  } catch (e) {
    console.warn('Could not parse existing products.json, using defaults.');
  }
}
fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(currentProducts, null, 2), 'utf-8');
console.log(`[SYNC] products.json updated (${currentProducts.length} ürün)`);

// 2. SETTINGS.JSON
// Merge with INITIAL_SITE_SETTINGS preserving any custom keys
let currentSettings = { ...INITIAL_SITE_SETTINGS };
if (fs.existsSync(SETTINGS_FILE)) {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      currentSettings = {
        ...INITIAL_SITE_SETTINGS,
        ...parsed,
        categories: (Array.isArray(parsed.categories) && parsed.categories.length > 0)
          ? parsed.categories
          : INITIAL_CATEGORY_CIRCLES,
        whyAkuzCards: (Array.isArray(parsed.whyAkuzCards) && parsed.whyAkuzCards.length > 0)
          ? parsed.whyAkuzCards
          : INITIAL_WHY_AKUZ_CARDS,
        paytrSettings: {
          ...INITIAL_SITE_SETTINGS.paytrSettings,
          ...(parsed.paytrSettings || {}),
        },
        kargonomiSettings: {
          ...INITIAL_SITE_SETTINGS.kargonomiSettings,
          ...(parsed.kargonomiSettings || {}),
        },
        smtpSettings: {
          ...INITIAL_SITE_SETTINGS.smtpSettings,
          ...(parsed.smtpSettings || {}),
        },
      };
    }
  } catch (e) {
    console.warn('Could not parse existing settings.json, using defaults.');
  }
}
fs.writeFileSync(SETTINGS_FILE, JSON.stringify(currentSettings, null, 2), 'utf-8');
console.log(`[SYNC] settings.json updated`);

// 3. GLOBAL_COLORS.JSON
fs.writeFileSync(COLORS_FILE, JSON.stringify(INITIAL_GLOBAL_COLORS, null, 2), 'utf-8');
console.log(`[SYNC] global_colors.json updated (${INITIAL_GLOBAL_COLORS.length} renk)`);

// 4. USERS.JSON (ensure file exists)
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  console.log(`[SYNC] users.json initialized`);
} else {
  console.log(`[SYNC] users.json already exists`);
}

// 5. ORDERS.JSON (ensure file exists)
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
  console.log(`[SYNC] orders.json initialized`);
} else {
  console.log(`[SYNC] orders.json already exists`);
}

console.log('[SYNC] All data_storage files successfully synchronized for cPanel!');
