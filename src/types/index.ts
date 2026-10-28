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
  category: 'all' | 'discount' | 'ataturk' | 'araba' | 'motosiklet' | 'offroad' | 'custom' | 'akuz' | 'ayna';
  currentPrice: number;
  oldPrice: number;
  rating: number;
  reviewsCount: number;
  isPopular?: boolean;
  isDiscounted?: boolean;
  isCustomText?: boolean;
  inStock?: boolean;
  freeLetterCount?: number; // Ücretsiz harf/karakter sayısı (örn: 10 harf bedava)
  extraLetterPrice?: number; // Ücretsiz harften sonra harf/karakter başı ek ücret (örn: 5 TL)
  dimensionPrices?: Record<string, number>; // Her boyut için özel fiyat (örn: {'15x10 cm': 49, '20x13 cm': 79})
  tag?: string;
  description: string;
  svgType: 'logo';
  imageUrl?: string;
  images?: string[];
  colorImages?: Record<string, string>; // Renk bazlı özel ürün fotoğrafları (örn: { 'Siyah': '/products/IMG_1138.jpeg', 'Beyaz': '/products/IMG_1140.jpeg' })
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
  cardImageUrl?: string; // Katalog sayfasındaki dikdörtgen kategori vitrin kartı görseli
  subtitle?: string; // Kategori alt başlığı/açıklaması
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
  // Müşteri Yorum Sistemi Ayarları
  reviewSettings?: ReviewSettings;
}

export interface ReviewSettings {
  enabled: boolean; // Yorum yapma sistemi açık mı (Varsayılan: true)
  autoApprove: boolean; // Yorumlar otomatik mi yayınlansın, yoksa admin onayı mı gereksin (Varsayılan: false)
  onlyPurchased: boolean; // Yalnızca ürünü teslim alanlar mı yorum yapabilir (Varsayılan: false)
  maskNames: boolean; // Kullanıcı adları gizlensin mi (Ah*** Yı***) (Varsayılan: true)
}

export interface Review {
  id: string;
  productId: string;
  productName?: string;
  userName: string;
  userEmail?: string;
  rating: number; // 1 - 5
  comment: string;
  date: string;
  createdAt?: string;
  status?: 'approved' | 'pending' | 'rejected';
  orderId?: string;
  verifiedPurchase?: boolean;
  adminReply?: string;
  adminReplyDate?: string;
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
  id?: string;
  user_id?: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  address?: string;
  full_name?: string;
  cart?: CartItem[];
  favorites?: string[];
  recentlyViewed?: string[];
  isGoogleUser?: boolean;
  authProvider?: string;
  auth_provider?: string;
  provider?: string;
  registeredVia?: string;
  passwordHash?: string;
}

export interface Address {
  id: string;
  title: string;
  recipientName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood?: string;
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
  userId?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  carrierName?: string;
  kargonomiShipmentId?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  fraudScore?: number;
  fraudRiskLevel?: 'Düşük' | 'Orta' | 'Yüksek';
  fraudRiskReasons?: string[];
  securityAlert?: string;
  isTestOrder?: boolean;
  verifiedTotal?: number;
  priceTampered?: boolean;
  clientIp?: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    color: string;
    dimension: string;
    price: number;
    finish?: string;
    customText?: string;
  }[];
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'PRICE_TAMPERING_BLOCKED' | 'CARDING_ATTACK_PREVENTED' | 'RATE_LIMIT_EXCEEDED' | 'PATH_TRAVERSAL_BLOCKED' | 'SUSPICIOUS_PAYTR_CALLBACK' | 'XSS_ATTACK_NEUTRALIZED' | 'ORDER_FRAUD_DETECTED' | 'IP_BLOCKED';
  ip: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  orderId?: string;
  userAgent?: string;
}

