export interface ProductColorOption {
  name: string;
  hex: string;
  inStock?: boolean;
  supportedFinishes?: ('Mat' | 'Parlak')[]; // Bazı renklerde sadece Parlak veya sadece Mat olabilir
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: 'all' | 'discount' | 'ataturk' | 'araba' | 'motosiklet' | 'offroad' | 'custom' | 'akuz';
  currentPrice: number;
  oldPrice: number;
  rating: number;
  reviewsCount: number;
  isPopular?: boolean;
  isDiscounted?: boolean;
  isCustomText?: boolean;
  freeLetterCount?: number; // Ücretsiz harf/karakter sayısı (örn: 10 harf bedava)
  extraLetterPrice?: number; // Ücretsiz harften sonra harf/karakter başı ek ücret (örn: 5 TL)
  dimensionPrices?: Record<string, number>; // Her boyut için özel fiyat (örn: {'15x10 cm': 49, '20x13 cm': 79})
  tag?: string;
  description: string;
  svgType: 'logo';
  imageUrl?: string;
  images?: string[];
  dimensions: string[];
  colors: ProductColorOption[];
  finishes?: ('Mat' | 'Parlak')[];
}

export interface CategoryCircleItem {
  id: Product['category'] | 'all';
  titleLine1: string;
  titleLine2: string;
  bgGradient: string;
  imageUrl?: string;
}

export interface WhyAkuzCardItem {
  id: string;
  title: string;
  description: string;
  iconName?: 'shield' | 'layers' | 'pen' | 'truck';
}

export interface EmailTemplateConfig {
  subject: string; // E-posta Konu Başlığı
  logoUrl?: string; // E-posta üst logo görseli (/akuz-logo-badge.png veya tam URL)
  headerBgColor?: string; // Logo arkası rengi (Varsayılan: #ffffff beyaz)
  greeting: string; // Selamlama (örn: Merhaba, {name}! 👋)
  bodyText: string; // Ana mesaj metni
  buttonText: string; // Buton metni (örn: Kataloğu Keşfet)
  buttonUrl: string; // Buton yönlendirme linki
  footerNote: string; // Alt dipnot
  badgeText?: string; // İsteğe bağlı rozet metni
  title?: string; // Başlık
  showCoupon?: boolean; // Kupon gösterilsin mi? (Varsayılan false)
  couponCode?: string;
  couponDiscountText?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // SSL (465) or TLS (587)
  user: string; // cPanel e-posta adresi (örn: info@akuzstickers.com)
  pass: string; // cPanel e-posta şifresi
  fromName: string; // Gönderen Adı (örn: Akuz Stickers)
  fromEmail: string; // Gönderen E-posta (örn: info@akuzstickers.com)
  enabled: boolean;
  template?: EmailTemplateConfig; // Kişiselleştirilebilir e-posta şablonu
}

export interface KargonomiConfig {
  apiToken: string;
  apiUrl?: string;
  enabled: boolean;
  autoCreateOnOrder?: boolean; // Müşteri sipariş verir vermez otomatik Kargonomi paneline düşsün mü?
  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  senderCity?: string;
  senderDistrict?: string;
  defaultCarrier?: 'mng' | 'yurtici' | 'surat' | 'aras' | 'ptt' | 'hepsijet' | 'sendeo';
}

export interface PaytrConfig {
  merchantId: string; // Mağaza No (759874)
  merchantKey: string; // Mağaza Parola (5gGXBK84nWWo6s6r)
  merchantSalt: string; // Mağaza Gizli Anahtarı (B4LSmLkCLUTUnro9)
  enabled: boolean;
  testMode: boolean; // 0: Canlı, 1: Test
}

export interface SiteSettings {
  // Neden Akuz Stickers
  whyAkuzCards: WhyAkuzCardItem[];
  // Hakkımızda
  aboutParagraphs: string[];
  // İletişim
  contactEmail: string;
  contactPhone: string;
  contactWhatsApp: string;
  contactAddress: string;
  contactDescription: string;
  // Kategori Yuvarlakları
  categories: CategoryCircleItem[];
  // Global Folyo Tipleri
  availableFoilTypes: ('Mat' | 'Parlak')[];
  // cPanel / SMTP E-posta Ayarları
  smtpSettings?: SmtpConfig;
  // Kargonomi Kargo Entegrasyonu
  kargonomiSettings?: KargonomiConfig;
  // PayTR Sanal Pos Ödeme Entegrasyonu
  paytrSettings?: PaytrConfig;
  // Google OAuth İsteğe Bağlı İstemci Kimliği (Özel alan adı için)
  googleClientId?: string;
  // Müşterinin Ödeyeceği Kargo Ücreti ve Ücretsiz Kargo Sepet Tutarı Barajı
  shippingFee?: number;
  freeShippingThreshold?: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number; // 1 - 5
  comment: string;
  date: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor: string;
  selectedDimension: string;
  selectedFinish?: 'Mat' | 'Parlak';
  customText?: string;
  customFont?: string;
  calculatedPrice?: number; // Boyut ve harf ücreti dahil tekil birim fiyat
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  cart?: CartItem[];
  favorites?: string[];
  recentlyViewed?: string[];
}

export interface Address {
  id: string;
  title: string;
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
  isDefault?: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: 'Hazırlanıyor' | 'Kargoya Verildi' | 'Teslim Edildi';
  total: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  carrierName?: string;
  kargonomiShipmentId?: string;
  items: {
    productName: string;
    quantity: number;
    color: string;
    dimension: string;
    price: number;
    finish?: string;
    customText?: string;
  }[];
}
