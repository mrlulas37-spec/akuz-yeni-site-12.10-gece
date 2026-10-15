import { SiteSettings, CategoryCircleItem, WhyAkuzCardItem, ProductColorOption } from '../types';

export const INITIAL_CATEGORY_CIRCLES: CategoryCircleItem[] = [
  // 1. SATIR (4 Adet)
  {
    id: 'all',
    titleLine1: 'Katalog',
    titleLine2: 'Tüm Ürünler',
    bgGradient: 'bg-slate-900 text-white',
  },
  {
    id: 'discount',
    titleLine1: 'İndirimli',
    titleLine2: 'Fırsatlar',
    bgGradient: 'bg-gradient-to-tr from-rose-500 to-red-500 text-white',
  },
  {
    id: 'ataturk',
    titleLine1: 'Atatürk',
    titleLine2: 'Stickerları',
    bgGradient: 'bg-slate-950 overflow-hidden ring-1 ring-amber-400/40',
    imageUrl: '/products/IMG_1278.jpeg',
  },
  {
    id: 'araba',
    titleLine1: 'Araba',
    titleLine2: 'Stickerları',
    bgGradient: 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white',
  },
  // 2. SATIR (4 Adet)
  {
    id: 'motosiklet',
    titleLine1: 'Motosiklet',
    titleLine2: 'Stickerları',
    bgGradient: 'bg-slate-800 text-orange-400',
  },
  {
    id: 'custom',
    titleLine1: 'Kişiye Özel',
    titleLine2: 'Stickerlar',
    bgGradient: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white',
  },
  {
    id: 'offroad',
    titleLine1: 'Off-Road',
    titleLine2: 'Stickerları',
    bgGradient: 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white',
  },
  {
    id: 'ayna',
    titleLine1: 'Ayna',
    titleLine2: 'Stickerları',
    bgGradient: 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white',
  },
];

export const INITIAL_WHY_AKUZ_CARDS: WhyAkuzCardItem[] = [
  {
    id: 'why-1',
    title: 'Hızlı Kargo & Müşteri Memnuniyeti',
    description:
      'Aynı gün kargo hizmetimiz ile birlikte saat 12.00\'den önce verilen siparişleri aynı gün kargoluyoruz. Herhangi bir sorun yaşamanız durumunda bize iletişim araçlarımızdan 7/24 ulaşabilirsiniz.',
    iconName: 'truck',
  },
  {
    id: 'why-2',
    title: 'Kaliteli ve Dayanıklı',
    description:
      'Ürünlerimiz kaliteli malzemelerden üretilmiş olup su, rüzgar ve güneş ışınlarından (UV) asla etkilenmez, sökümü kolaydır.',
    iconName: 'shield',
  },
  {
    id: 'why-3',
    title: 'Ürün Çeşitliliği',
    description:
      'Geniş ürün yelpazemiz ile aradığınız ürünü kolayca bulabilirsiniz. Kategoriler kısmından ne tür sticker istediğinizi seçmeniz yeterli.',
    iconName: 'layers',
  },
];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  whyAkuzCards: INITIAL_WHY_AKUZ_CARDS,
  aboutParagraphs: [
    'AKUZ Stickers, aracınıza, motosikletinize, kaskınıza, aynanıza, kısacası aklınıza gelebilecek çoğu yerde yapıştırıldığı yeri özelleştiren, ruh katan, özgün tasarımlar oluşturan genç girişimciler tarafından hayata geçirilmiş bir girişimdir. En kaliteli dış mekan vinil çıkartmaları sizlerle buluşturuyor, müşteri memnuniyetini ön planda tutuyoruz.',
  ],
  contactEmail: 'akuzstickers@gmail.com',
  contactPhone: '+90 546 875 86 71',
  contactWhatsApp: '+90 546 875 86 71',
  contactAddress: 'Üçevler Mahallesi, Küçük Sanayi Sitesi, 6. Blok No: 17/1 Nilüfer / Bursa',
  contactDescription:
    'Sorularınız, siparişleriniz veya özel tasarım talepleriniz için bizimle iletişime geçebilirsiniz.',
  categories: INITIAL_CATEGORY_CIRCLES,
  availableFoilTypes: ['Mat', 'Parlak'],
  smtpSettings: {
    host: 'mail.akuzstickers.com',
    port: 465,
    secure: true,
    user: 'info@akuzstickers.com',
    pass: '',
    fromName: 'AKUZ Stickers',
    fromEmail: 'info@akuzstickers.com',
    enabled: true,
  },
  kargonomiSettings: {
    apiToken: 'Ly2mGS6WC2iDAuwdC2C5D9omqnsJkjBZIO4qeJMIe8175aa3',
    apiUrl: 'https://app.kargonomi.com.tr/api/v1',
    enabled: true,
    autoCreateOnOrder: true,
    senderName: 'AKUZ Stickers',
    senderPhone: '+90 546 875 86 71',
    senderAddress: 'Üçevler Mah., Küçük Sanayi Sitesi, 6. Blok No: 17/1, Nilüfer',
    senderCity: 'Bursa',
    senderDistrict: 'Nilüfer',
    defaultCarrier: 'mng',
  },
  paytrSettings: {
    merchantId: '759874',
    merchantKey: '5gGXBK84nWWo6s6r',
    merchantSalt: 'B4LSmLkCLUTUnro9',
    enabled: true,
    testMode: true, // PayTR mağaza onayı için ilk 24 saatte test ödemesi gereklidir
  },
  shippingFee: 39.9,
  freeShippingThreshold: 150,
  googleClientId: '947652767285-huldifd2fqu7gcdqqcq6emoufcom9h46.apps.googleusercontent.com',
};

// Global varsayılan renk paleti (Stokta var/yok & desteklenen folyo seçenekleri ile)
export const INITIAL_GLOBAL_COLORS: ProductColorOption[] = [
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
];

const SETTINGS_KEY = 'akuz_site_settings';
const GLOBAL_COLORS_KEY = 'akuz_global_colors';

export const getStoredSiteSettings = (): SiteSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return INITIAL_SITE_SETTINGS;
    const parsed: SiteSettings = { ...INITIAL_SITE_SETTINGS, ...JSON.parse(raw) };
    if (!parsed.googleClientId) {
      parsed.googleClientId = '947652767285-huldifd2fqu7gcdqqcq6emoufcom9h46.apps.googleusercontent.com';
    }
    if (!parsed.categories || !Array.isArray(parsed.categories) || parsed.categories.length === 0) {
      parsed.categories = INITIAL_CATEGORY_CIRCLES;
    } else {
      parsed.categories = parsed.categories.map((c) => {
        let titleLine1 = c.titleLine1;
        let titleLine2 = c.titleLine2;
        if (c.id === 'all') {
          titleLine1 = 'Katalog';
          titleLine2 = '';
        }
        return {
          ...c,
          titleLine1,
          titleLine2,
          imageUrl: c.imageUrl?.startsWith('/IMG_') ? `/products${c.imageUrl}` : c.imageUrl,
        };
      });
    }
    if (!parsed.aboutParagraphs || !Array.isArray(parsed.aboutParagraphs) || parsed.aboutParagraphs.length === 0 || parsed.aboutParagraphs[0]?.includes('tutkulu bir girişimdir')) {
      parsed.aboutParagraphs = INITIAL_SITE_SETTINGS.aboutParagraphs;
    }
    if (!parsed.whyAkuzCards || !Array.isArray(parsed.whyAkuzCards) || parsed.whyAkuzCards.length === 0 || parsed.whyAkuzCards.some(c => c.description.includes('Alman malı') || c.title.includes('Özel Tasarım'))) {
      parsed.whyAkuzCards = INITIAL_WHY_AKUZ_CARDS;
    }
    if (!parsed.contactEmail || parsed.contactEmail !== 'akuzstickers@gmail.com') {
      parsed.contactEmail = 'akuzstickers@gmail.com';
    }
    if (!parsed.contactAddress || parsed.contactAddress.includes('10. Sokak') || parsed.contactAddress === 'Bursa, Türkiye') {
      parsed.contactAddress = INITIAL_SITE_SETTINGS.contactAddress;
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
