import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Truck,
  CreditCard,
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  AlertTriangle,
  X,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Plus,
  Sparkles,
  UserCheck,
  Copy,
  Check,
  Package,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { CartItem, UserProfile, Order, SiteSettings, Address } from '../types';
import { StickerGraphic } from './StickerGraphic';
import { sendOrderPreparingEmail } from '../utils/emailService';
import { createKargonomiShipment } from '../utils/kargonomiService';
import { getStoredSiteSettings } from '../utils/adminStore';
import { calculateItemUnitPrice } from '../utils/pricingHelper';
import { TURKEY_PROVINCES, PROVINCE_NAMES, getNeighborhoodsForDistrict } from '../data/turkeyLocations';

interface CountryCodeOption {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

const COUNTRY_OPTIONS: CountryCodeOption[] = [
  { code: 'TR', dial: '+90', flag: '🇹🇷', name: 'Türkiye (+90)' },
  { code: 'AZ', dial: '+994', flag: '🇦🇿', name: 'Azerbaycan (+994)' },
  { code: 'DE', dial: '+49', flag: '🇩🇪', name: 'Almanya (+49)' },
  { code: 'NL', dial: '+31', flag: '🇳🇱', name: 'Hollanda (+31)' },
  { code: 'GB', dial: '+44', flag: '🇬🇧', name: 'Birleşik Krallık (+44)' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'Fransa (+33)' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'ABD / Kanada (+1)' },
  { code: 'AT', dial: '+43', flag: '🇦🇹', name: 'Avusturya (+43)' },
  { code: 'BE', dial: '+32', flag: '🇧🇪', name: 'Belçika (+32)' },
  { code: 'CH', dial: '+41', flag: '🇨🇭', name: 'İsviçre (+41)' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Suudi Arabistan (+966)' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'BAE (+971)' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Katar (+974)' },
  { code: 'RU', dial: '+7', flag: '🇷🇺', name: 'Rusya (+7)' },
  { code: 'GR', dial: '+30', flag: '🇬🇷', name: 'Yunanistan (+30)' },
  { code: 'BG', dial: '+359', flag: '🇧🇬', name: 'Bulgaristan (+359)' },
  { code: 'OTHER', dial: '+', flag: '🌐', name: 'Diğer (+)' },
];

/**
 * Telefon numarasını biçimlendirir.
 * TR (+90) için kullanıcı isteği doğrultusunda: 3 hane - 3 hane - 4 hane (XXX XXX XXXX)
 * Örn: 546 875 8671
 */
const formatPhoneNumber = (val: string, dial: string): string => {
  let digits = val.replace(/\D/g, '');
  if (dial === '+90') {
    // Başta 0 varsa kaldır (kullanıcı 05XX yazarsa otomatik 5XX'e dönüştür)
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    // TR numaraları en fazla 10 haneli
    digits = digits.slice(0, 10);
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    }
  } else {
    // Diğer ülkeler için en fazla 14 hane ve doğal aralıklı yazım
    digits = digits.slice(0, 14);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)} ${digits.slice(10)}`;
  }
};

interface CheckoutPageProps {
  cartItems: CartItem[];
  currentUser: UserProfile | null;
  onGoBackToCart: () => void;
  onGoHome: () => void;
  onViewOrders?: () => void;
  onPlaceOrder?: (newOrder: Order) => void;
  onOpenAuth?: () => void;
  siteSettings?: SiteSettings;
  onNavigateToTracking?: (orderId: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  currentUser,
  onGoBackToCart,
  onGoHome,
  onViewOrders,
  onPlaceOrder,
  onOpenAuth,
  siteSettings: propSiteSettings,
  onNavigateToTracking,
}) => {
  // Sipariş başarıyla verildi durumu
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Ödeme yöntemi: PayTR Kredi / Banka Kartı (WhatsApp ve Havale kaldırıldı)
  const [paymentMethod] = useState<'card'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Üye olmadan devam et seçimi
  const [continueAsGuest, setContinueAsGuest] = useState(false);

  // PayTR Sanal POS State'leri ve Canlı Site Ayarları
  const siteSettings = propSiteSettings ?? getStoredSiteSettings();
  const [isPaytrModalOpen, setIsPaytrModalOpen] = useState(false);
  const [paytrIframeUrl, setPaytrIframeUrl] = useState<string | null>(null);
  const [paytrError, setPaytrError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Kayıtlı Adres Seçimi: 'new' veya kayıtlı adres ID'si
  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  // Telefon Ülke Kodu Seçimi (Varsayılan Türkiye +90)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+90');

  // Form alanları
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [fullAddress, setFullAddress] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
    city?: string;
    district?: string;
    neighborhood?: string;
    fullAddress?: string;
  }>({});

  // Hesapta olan bilgileri veya kayıtlı adresleri çek
  useEffect(() => {
    let initialName = currentUser?.name || '';
    let initialPhone = currentUser?.phone || '';
    let initialEmail = currentUser?.email || '';
    let initialCity = '';
    let initialDistrict = '';
    let initialNeighborhood = '';
    let initialAddress = '';
    let initialSelectedId: string | 'new' = 'new';

    if (currentUser?.addresses && currentUser.addresses.length > 0) {
      const defaultAddr = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
      initialSelectedId = defaultAddr.id;
      initialAddress = defaultAddr.fullAddress || '';
      initialCity = defaultAddr.city || '';
      initialDistrict = defaultAddr.district || '';
      initialNeighborhood = defaultAddr.neighborhood || '';
      if (defaultAddr.phone) initialPhone = defaultAddr.phone;
      if (defaultAddr.recipientName) initialName = defaultAddr.recipientName;
    } else {
      // LocalStorage fallback
      try {
        const savedUser = localStorage.getItem('akuz_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (!initialName && parsed.name) initialName = parsed.name;
          if (!initialPhone && parsed.phone) initialPhone = parsed.phone;
          if (!initialEmail && parsed.email) initialEmail = parsed.email;
          if (parsed.addresses && parsed.addresses.length > 0) {
            const def = parsed.addresses.find((a: any) => a.isDefault) || parsed.addresses[0];
            initialSelectedId = def.id || 'saved-1';
            initialAddress = def.fullAddress || '';
            initialCity = def.city || '';
            initialDistrict = def.district || '';
            initialNeighborhood = def.neighborhood || '';
            if (def.phone) initialPhone = def.phone;
            if (def.recipientName) initialName = def.recipientName;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    setFullName(initialName);
    setPhone(formatPhoneNumber(initialPhone, '+90'));
    setEmail(initialEmail);
    setCity(initialCity);
    setDistrict(initialDistrict);
    setNeighborhood(initialNeighborhood);
    setFullAddress(initialAddress);
    setSelectedAddressId(initialSelectedId);
  }, [currentUser]);

  // Mahalle için özel / elle giriş durumu
  const [isCustomNeighborhood, setIsCustomNeighborhood] = useState(false);

  // Kayıtlı adres seçildiğinde alanları anında doldur
  const handleSelectSavedAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    if (addr.recipientName) setFullName(addr.recipientName);
    if (addr.phone) setPhone(formatPhoneNumber(addr.phone, selectedCountryCode));
    setCity(addr.city || '');
    setDistrict(addr.district || '');
    setNeighborhood(addr.neighborhood || '');
    // Eğer gelen mahalle standart listede yoksa elle giriş modunu aç
    if (addr.neighborhood && addr.district) {
      const list = getNeighborhoodsForDistrict(addr.district);
      setIsCustomNeighborhood(!list.includes(addr.neighborhood));
    } else {
      setIsCustomNeighborhood(false);
    }
    setFullAddress(addr.fullAddress || '');
    setFieldErrors({});
    setFormError('');
  };

  // Yeni / Farklı adres gir seçildiğinde alanları temizle
  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setCity('');
    setDistrict('');
    setNeighborhood('');
    setIsCustomNeighborhood(false);
    setFullAddress('');
    setFieldErrors({});
    setFormError('');
  };

  // Zorunlu alan kontrolü - Eksik olan alanların tek tek adını belirler
  const validateOrderForm = (): boolean => {
    const errors: {
      fullName?: string;
      phone?: string;
      email?: string;
      city?: string;
      district?: string;
      neighborhood?: string;
      fullAddress?: string;
    } = {};
    const missingFields: string[] = [];

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanCity = city.trim();
    const cleanDistrict = district.trim();
    const cleanNeighborhood = neighborhood.trim();
    const cleanAddress = fullAddress.trim();

    if (!cleanName) {
      errors.fullName = 'İsim ve Soyisim alanı zorunludur.';
      missingFields.push('İsim Soyisim');
    }

    if (!cleanPhone) {
      errors.phone = 'Telefon numarası alanı zorunludur.';
      missingFields.push('Telefon Numarası');
    } else {
      const rawDigits = cleanPhone.replace(/\D/g, '');
      if (selectedCountryCode === '+90' && rawDigits.length !== 10) {
        errors.phone = 'Geçerli 10 haneli Türkiye cep telefonu giriniz (Örn: 5XX XXX XXXX).';
        missingFields.push('10 Haneli Telefon Numarası');
      } else if (selectedCountryCode !== '+90' && rawDigits.length < 7) {
        errors.phone = 'Geçerli bir telefon numarası giriniz.';
        missingFields.push('Geçerli Telefon Numarası');
      }
    }

    // E-posta isteğe bağlıdır; ancak girilmişse geçerli format kontrolü yapılır
    if (cleanEmail && (!cleanEmail.includes('@') || !cleanEmail.includes('.'))) {
      errors.email = 'Lütfen geçerli bir e-posta adresi giriniz (Örn: ad@gmail.com).';
      missingFields.push('Geçerli E-Posta Adresi');
    }

    if (!cleanCity) {
      errors.city = 'Lütfen 81 il arasından il seçimi yapınız.';
      missingFields.push('İl');
    }

    if (!cleanDistrict) {
      errors.district = 'Lütfen ilçe seçimi yapınız.';
      missingFields.push('İlçe');
    }

    if (!cleanNeighborhood) {
      errors.neighborhood = 'Lütfen mahalle bilginizi giriniz.';
      missingFields.push('Mahalle');
    }

    if (!cleanAddress) {
      errors.fullAddress = 'Açık teslimat adresi (cadde, sokak, no) alanı zorunludur.';
      missingFields.push('Açık Adres');
    }

    setFieldErrors(errors);

    if (missingFields.length > 0) {
      setFormError(`Lütfen sipariş için zorunlu olan şu alanları eksiksiz doldurunuz: ${missingFields.join(', ')}.`);
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return false;
    }

    setFormError('');
    return true;
  };

  const getItemPrice = (item: CartItem) => {
    return item.calculatedPrice ?? calculateItemUnitPrice(item.product, item.selectedDimension, item.customText);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );
  const standardShippingFee = typeof siteSettings?.shippingFee === 'number'
    ? siteSettings.shippingFee
    : (siteSettings?.shippingFee !== undefined && !isNaN(Number(siteSettings.shippingFee)) ? Number(siteSettings.shippingFee) : 39.9);
  const freeShippingThreshold = typeof siteSettings?.freeShippingThreshold === 'number'
    ? siteSettings.freeShippingThreshold
    : (siteSettings?.freeShippingThreshold !== undefined && !isNaN(Number(siteSettings.freeShippingThreshold)) ? Number(siteSettings.freeShippingThreshold) : 150);

  const isAllShippingFree = standardShippingFee === 0 || freeShippingThreshold === 0;
  const isNoFreeShipping = freeShippingThreshold >= 999999;
  const isFreeShippingQualified = isAllShippingFree || (subtotal >= freeShippingThreshold && !isNoFreeShipping);
  const shippingFee = (subtotal === 0 || isFreeShippingQualified) ? 0 : standardShippingFee;
  const grandTotal = subtotal + shippingFee;

  // PayTR Başarılı/Başarısız Dönüş Takibi ve Webhook / Message Dinleyici
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paytrResult = params.get('payment_result');
    const oid = params.get('oid');
    if (paytrResult === 'success') {
      const orderIdToUse = oid ? `AKUZ-${oid.replace(/^AKUZ/, '')}` : ('AKUZ-' + Math.floor(1000 + Math.random() * 9000));
      handleExecuteOrder('PayTR Kredi / Banka Kartı (3D Secure)', orderIdToUse, true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paytrResult === 'failed') {
      setPaytrError('Ödeme işlemi bankanız veya PayTR tarafından onaylanamadı. Lütfen kart bilgilerinizi kontrol ediniz.');
      window.history.replaceState({}, '', window.location.pathname);
    }

    const handleWindowMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PAYTR_PAYMENT_SUCCESS') {
        const customOid = event.data.oid ? `AKUZ-${event.data.oid.replace(/^AKUZ/, '')}` : (pendingOrderId || ('AKUZ-' + Math.floor(1000 + Math.random() * 9000)));
        setIsPaytrModalOpen(false);
        handleExecuteOrder('PayTR Kredi / Banka Kartı (3D Secure)', customOid, true);
      } else if (event.data?.type === 'PAYTR_PAYMENT_FAILED') {
        setIsPaytrModalOpen(false);
        setPaytrError('Ödeme işlemi tamamlanamadı. Lütfen kart bilgilerinizi kontrol ediniz.');
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [pendingOrderId, cartItems, fullName, phone, email, fullAddress, city, district, neighborhood]);

  // PayTR Ödeme Oturumu Başlat (Gerçek Token Al & iFrame Aç)
  const handleInitiatePaytrPayment = async () => {
    if (!validateOrderForm()) return;

    setFormError('');
    setPaytrError(null);
    setIsProcessingPayment(true);

    const generatedOrderId = 'AKUZ' + Date.now();
    setPendingOrderId(generatedOrderId);

    const finalAddress = neighborhood.trim()
      ? `${neighborhood.trim()} Mah., ${fullAddress.trim()}`
      : fullAddress.trim();
    const finalPhone = `${selectedCountryCode} ${phone.trim()}`;
    const cleanEmail = email ? email.trim() : '';

    // Sayfa yönlendirmesi veya iframe döngüsünde verilerin kaybolmaması için yerel hafızaya yedekle
    const pendingCheckoutData = {
      orderId: generatedOrderId,
      fullName: fullName.trim(),
      phone: finalPhone,
      email: cleanEmail,
      city: city.trim(),
      district: district.trim(),
      neighborhood: neighborhood.trim(),
      fullAddress: fullAddress.trim(),
      shippingAddress: `${finalAddress}, ${district.trim()}/${city.trim()}`,
      orderNote,
      cartItems,
      grandTotal,
      subtotal,
      shippingFee,
    };
    try {
      sessionStorage.setItem('akuz_pending_checkout', JSON.stringify(pendingCheckoutData));
      localStorage.setItem('akuz_pending_checkout', JSON.stringify(pendingCheckoutData));
    } catch (e) {}

    try {
      const response = await fetch('/api/paytr/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: generatedOrderId,
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: finalPhone,
          address: finalAddress,
          city: city.trim(),
          district: district.trim(),
          totalAmount: grandTotal,
          orderNote,
          items: cartItems.map((item) => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: getItemPrice(item),
            color: item.selectedColor,
            dimension: item.selectedDimension,
            finish: item.selectedFinish,
            customText: item.customText,
          })),
        }),
      });

      const data = await response.json();
      setIsProcessingPayment(false);

      if (data.success && data.iframeUrl) {
        setPaytrIframeUrl(data.iframeUrl);
        setIsPaytrModalOpen(true);
      } else {
        setPaytrError(data.error || 'PayTR ödeme oturumu başlatılamadı. Lütfen bilgilerinizi kontrol ediniz.');
      }
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaytrError(err.message || 'PayTR sunucusuna bağlanılamadı.');
    }
  };

  const handlePaymentSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateOrderForm()) return;
    handleInitiatePaytrPayment();
  };

  const handleExecuteOrder = (
    methodLabel: string = 'PayTR Kredi / Banka Kartı (3D Secure)',
    customOrderId?: string,
    skipValidation: boolean = false
  ) => {
    let nameToUse = fullName.trim() || currentUser?.name || '';
    let phoneToUse = `${selectedCountryCode} ${phone.trim()}`;
    let emailToUse = (currentUser?.email || email || '').trim().toLowerCase();
    let addressToUse = `${neighborhood.trim() ? `${neighborhood.trim()} Mah., ` : ''}${fullAddress.trim()}, ${district.trim()}/${city.trim()}`;
    let itemsToUse = cartItems.map((item) => ({
      productId: item.product?.id || '',
      productName: item.product.name,
      quantity: item.quantity,
      color: item.selectedColor,
      dimension: item.selectedDimension,
      finish: item.selectedFinish,
      customText: item.customText,
      price: getItemPrice(item),
    }));
    let grandTotalToUse = grandTotal;
    let orderNoteToUse = orderNote;

    // Eğer yeniden yönlendirme ile dönüldüyse ve React state sıfırlanmışsa, kaydedilen taslaktan kurtar
    if (!nameToUse || itemsToUse.length === 0) {
      try {
        const raw = sessionStorage.getItem('akuz_pending_checkout') || localStorage.getItem('akuz_pending_checkout');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (!nameToUse && parsed.fullName) nameToUse = parsed.fullName;
          if ((!phoneToUse || phoneToUse.length < 5) && parsed.phone) phoneToUse = parsed.phone;
          if (!emailToUse && parsed.email) emailToUse = parsed.email;
          if (parsed.shippingAddress) addressToUse = parsed.shippingAddress;
          if (itemsToUse.length === 0 && Array.isArray(parsed.cartItems) && parsed.cartItems.length > 0) {
            itemsToUse = parsed.cartItems.map((it: any) => ({
              productId: it.product?.id || it.productId || it.id || '',
              productName: it.product?.name || it.productName || 'AKUZ Sticker',
              quantity: it.quantity || 1,
              color: it.selectedColor || it.color || '',
              dimension: it.selectedDimension || it.dimension || '',
              finish: it.selectedFinish || it.finish || '',
              customText: it.customText || '',
              price: it.price || (getItemPrice ? getItemPrice(it) : 0),
            }));
          }
          if (parsed.grandTotal) grandTotalToUse = parsed.grandTotal;
          if (parsed.orderNote) orderNoteToUse = parsed.orderNote;
        }
      } catch (e) {
        console.warn('Could not restore pending checkout', e);
      }
    }

    if (!skipValidation) {
      if (!validateOrderForm()) return;
    }
    setFormError('');

    const isPaytrTest = Boolean(siteSettings?.paytrSettings?.testMode || methodLabel.includes('Test'));
    const defaultPrefix = isPaytrTest ? 'AKUZ-TEST-' : 'AKUZ-';
    const cleanCustomId = customOrderId ? (customOrderId.startsWith('AKUZ') ? customOrderId : `AKUZ-${customOrderId}`) : '';
    const newOrderId = cleanCustomId || (defaultPrefix + Math.floor(100000 + Math.random() * 900000));

    const finalCustomerEmail = (emailToUse || currentUser?.email || 'musteri@akuzstickers.com').trim().toLowerCase();
    const finalCustomerName = nameToUse || currentUser?.name || 'Değerli Müşterimiz';

    const newOrder: Order = {
      id: newOrderId,
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'Hazırlanıyor',
      paymentStatus: isPaytrTest ? 'Ödendi (PayTR Test Modu)' : 'Ödendi (PayTR 3D Secure)',
      paymentMethod: methodLabel,
      total: grandTotalToUse,
      customerName: finalCustomerName,
      customerPhone: phoneToUse,
      customerEmail: finalCustomerEmail,
      userId: currentUser?.id || (currentUser as any)?.user_id,
      shippingAddress: addressToUse,
      items: itemsToUse,
      isTestOrder: isPaytrTest,
    };

    // 1. Merkezi Host Sunucusuna Kaydet
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch((err) => console.warn('[HOST ORDER SAVE ERROR]', err));

    // 2. React state ve yerel belleğe işle & sepeti sıfırla
    if (onPlaceOrder) {
      onPlaceOrder(newOrder);
    }

    // 3. Otomatik "Siparişiniz Hazırlanıyor" E-postası gönder
    if (finalCustomerEmail && finalCustomerEmail.includes('@')) {
      sendOrderPreparingEmail({
        orderId: newOrderId,
        customerName: finalCustomerName,
        customerEmail: finalCustomerEmail,
        customerPhone: phoneToUse,
        shippingAddress: addressToUse,
        items: itemsToUse,
        totalPrice: grandTotalToUse,
        orderNote: orderNoteToUse,
      }).catch(console.error);
    }

    // 4. Kargonomi Kargo Entegrasyonu
    const currentSettings = getStoredSiteSettings();
    const kargonomi = currentSettings.kargonomiSettings;
    if (kargonomi?.enabled && kargonomi.autoCreateOnOrder !== false) {
      createKargonomiShipment({
        orderId: newOrderId,
        recipientName: finalCustomerName,
        recipientPhone: phoneToUse,
        recipientAddress: addressToUse,
        recipientCity: city || 'Bursa',
        recipientDistrict: district || 'Nilüfer',
        itemsDescription: itemsToUse.map((i: any) => `${i.quantity}x ${i.productName}`).join(', '),
        carrier: kargonomi.defaultCarrier || 'mng',
      }).then((kargoRes) => {
        if (kargoRes.success && kargoRes.trackingNumber) {
          console.log('[KARGONOMI AUTO SUCCESS] Takip No:', kargoRes.trackingNumber);
          newOrder.trackingNumber = kargoRes.trackingNumber;
          newOrder.carrierName = kargoRes.carrier || 'Kargonomi';
          newOrder.kargonomiShipmentId = kargoRes.shipmentId;
        }
      }).catch(console.error);
    }

    // 5. Sepet ve taslak verilerini tamamen temizle
    try {
      sessionStorage.removeItem('akuz_pending_checkout');
      localStorage.removeItem('akuz_pending_checkout');
      localStorage.setItem('akuz_cart', '[]');
    } catch {}

    // Modal varsa kapat ve onay ekranını aç
    setIsPaytrModalOpen(false);
    setOrderPlaced(newOrder);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generateWhatsAppMessage = () => {
    let msg = `Merhaba AKUZ Stickers, sipariş vermek istiyorum:%0A%0A`;
    if (fullName) msg += `*Müşteri:* ${fullName}%0A`;
    if (phone) msg += `*Telefon:* ${phone}%0A`;
    if (email) msg += `*E-posta:* ${email}%0A`;
    if (fullAddress) msg += `*Kargo Adresi:* ${fullAddress}, ${district}/${city}%0A`;
    if (orderNote) msg += `*Sipariş Notu:* ${orderNote}%0A%0A`;

    msg += `*Siparişteki Ürünler:*%0A`;
    cartItems.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.product.name}*%0A   Adet: ${item.quantity}%0A   Renk: ${item.selectedColor}%0A   Ölçü: ${item.selectedDimension}${
        item.selectedFinish ? `%0A   Materyal: ${item.selectedFinish} Folyo` : ''
      }${
        item.customText ? `%0A   Özel Metin: ${item.customText}` : ''
      }%0A   Fiyat: ₺${(getItemPrice(item) * item.quantity).toFixed(2)}%0A%0A`;
    });
    msg += `*Genel Toplam Tutar: ₺${grandTotal.toFixed(2)}*%0A`;
    msg += `Kargo ve ödeme bilgileri için yardımcı olabilir misiniz?`;
    return msg;
  };

  // EĞER SİPARİŞ BAŞARIYLA TAMAMLANDIYSA: KAPSAMLI ONAY VE TAKİP EKRANI
  if (orderPlaced) {
    const isTestMode = Boolean(orderPlaced.isTestOrder || orderPlaced.paymentMethod?.includes('Test') || orderPlaced.paymentStatus?.includes('Test'));

    const handleCopyOrderId = () => {
      if (orderPlaced?.id) {
        navigator.clipboard.writeText(orderPlaced.id);
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 2500);
      }
    };

    const handleTrackOrderClick = () => {
      if (onNavigateToTracking) {
        onNavigateToTracking(orderPlaced.id);
      } else {
        window.location.href = `/siparis-sorgula?siparis=${encodeURIComponent(orderPlaced.id)}`;
      }
    };

    return (
      <div className="min-h-[85vh] bg-[#faf9f6] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-2xl text-center space-y-6 animate-fadeIn">
          
          {/* Kutlama / Başarılı Simgesi */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 animate-ping opacity-75"></div>
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 size={44} strokeWidth={2.5} />
            </div>
          </div>

          {/* Rozet ve Ana Başlık */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sipariş Alındı • Hazırlanıyor</span>
              {isTestMode && (
                <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full font-bold ml-1">
                  Test Modu
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Siparişiniz Başarıyla Alındı!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Ödemeniz güvenle teyit edildi. Stickerlarınız AKUZ atölyemizde özenle üretilmeye ve paketlenmeye başlandı.
            </p>
          </div>

          {/* ÖNE ÇIKAN SİPARİŞ VE TAKİP NUMARASI KARTI */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-700/80 shadow-md text-left space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                  Sipariş & Canlı Takip Numaranız
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-wider text-emerald-400 select-all">
                  #{orderPlaced.id}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/15"
                  title="Sipariş Numamasını Kopyala"
                >
                  {copiedOrderId ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                  <span>{copiedOrderId ? 'Kopyalandı! ✓' : 'Kopyala'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTrackOrderClick}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <Package size={15} />
                  <span>Siparişi Takip Et</span>
                </button>
              </div>
            </div>

            <p className="text-[11.5px] text-slate-300 border-t border-slate-700/60 pt-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Bu numara ile siparişinizi dilediğiniz zaman canlı takip edebilir, kargo aşamalarını izleyebilirsiniz.</span>
            </p>
          </div>

          {/* HESABA ATAMA BİLGİLENDİRMESİ */}
          {orderPlaced.customerEmail && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl text-left flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <UserCheck size={18} />
              </div>
              <div className="text-xs space-y-0.5">
                <h4 className="font-extrabold text-emerald-950">
                  {currentUser ? 'Hesabınıza Başarıyla Tanımlandı' : 'Sipariş Kaydınız Oluşturuldu'}
                </h4>
                <p className="text-emerald-800 leading-relaxed">
                  Siparişiniz <strong className="font-bold underline">{orderPlaced.customerEmail}</strong> hesabına atanmıştır. 
                  Üst menüdeki <strong>"Siparişlerim"</strong> bölümünden siparişinizin tüm aşamalarını görebilirsiniz.
                </p>
              </div>
            </div>
          )}

          {/* SİPARİŞ DETAYLARI TABLOSU */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center text-slate-500">
              <span>Teslim Edilecek Kişi:</span>
              <strong className="text-slate-800 font-bold">{orderPlaced.customerName}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>İletişim Telefonu:</span>
              <strong className="text-slate-800 font-bold">{orderPlaced.customerPhone}</strong>
            </div>
            <div className="flex justify-between items-start text-slate-500">
              <span>Teslimat Adresi:</span>
              <strong className="text-slate-800 text-right max-w-xs font-semibold">{orderPlaced.shippingAddress}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Ödeme Şekli & Durumu:</span>
              <span className="font-bold text-slate-900 bg-emerald-100/70 text-emerald-900 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                {orderPlaced.paymentStatus || 'Ödendi'}
              </span>
            </div>

            {orderPlaced.trackingNumber && (
              <div className="flex justify-between items-center text-slate-500 pt-1.5 border-t border-slate-200/60">
                <span>Kargo Takip No:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {orderPlaced.trackingNumber} ({orderPlaced.carrierName || 'Kargonomi'})
                </span>
              </div>
            )}

            {/* Ürün Listesi */}
            {Array.isArray(orderPlaced.items) && orderPlaced.items.length > 0 && (
              <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Siparişteki Ürünler ({orderPlaced.items.length} Kalem):
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {orderPlaced.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-200/60 text-[11px]">
                      <div className="truncate mr-2">
                        <span className="font-bold text-slate-900">{it.quantity}x {it.productName}</span>
                        {(it.color || it.dimension || it.customText) && (
                          <span className="text-slate-500 block text-[10px]">
                            {it.color && `${it.color}`} {it.dimension && `• ${it.dimension}`} {it.customText && `• "${it.customText}"`}
                          </span>
                        )}
                      </div>
                      <span className="font-bold font-mono text-slate-800 shrink-0">
                        ₺{((it.price || 0) * (it.quantity || 1)).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-900 pt-3 border-t border-slate-200 font-bold text-sm">
              <span>Toplam Tahsil Edilen Tutar:</span>
              <span className="text-[#ff0055] font-black text-xl font-price">
                ₺{orderPlaced.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* AKSİYON BUTONLARI */}
          <div className="space-y-2.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onViewOrders && (
                <button
                  type="button"
                  onClick={onViewOrders}
                  className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Package size={16} />
                  <span>Siparişlerimi Görüntüle</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTrackOrderClick}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Package size={16} />
                <span>Canlı Sipariş Takibi</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onGoHome}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={15} />
              <span>Mağazaya Dön ve Alışverişe Devam Et</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // EĞER SEPET BOŞSA: BOŞ SEPET EKRANI
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] bg-[#faf9f6] py-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Truck size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-900">Sepetinizde Ürün Bulunmuyor</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sipariş vermek ve kargo bilgilerinizi girmek için lütfen kataloğumuzdaki sticker modellerinden sepetinize ekleyin.
          </p>
          <button
            onClick={onGoHome}
            className="w-full py-3.5 px-4 bg-[#ff0055] hover:bg-[#d90048] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Alışverişe Başla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Adım İlerleme Çubuğu */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <button
              onClick={onGoBackToCart}
              className="p-2 bg-white text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Sepete Dön"
            >
              <ArrowLeft size={16} />
              <span>Sepete Dön</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kargo ve Teslimat Bilgileri
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="text-emerald-600 font-bold">1. Sepetim</span>
            <ChevronRight size={14} />
            <span className="text-[#ff0055] font-bold">2. Teslimat & Kargo</span>
            <ChevronRight size={14} />
            <span className="text-slate-400">3. Ödeme</span>
          </div>
        </div>

        {formError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-700 font-semibold flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* SOL KOLON: Form Bilgileri */}
          <div className="lg:col-span-7 space-y-6">

            {/* ÜYE GİRİŞİ VEYA GİRİŞ YAPMADAN DEVAM ET ALANI */}
            {!currentUser ? (
              <div
                className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                  !continueAsGuest
                    ? 'bg-gradient-to-br from-white via-orange-50/50 to-white border-orange-200 shadow-md ring-2 ring-[#ff6600]/20'
                    : 'bg-white border-slate-200/90 shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff6600] animate-pulse shrink-0" />
                      <h2 className="text-sm sm:text-base font-black text-slate-900">
                        {!continueAsGuest
                          ? 'Hesabınız Var mı? Giriş Yapın veya Üye Olun'
                          : 'Giriş Yapmadan (Misafir Olarak) Devam Ediyorsunuz'}
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-[#ff6600]">
                        {!continueAsGuest ? 'Önerilen' : 'Misafir'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                      {!continueAsGuest
                        ? 'Siparişinizi kolayca takip etmek ve kayıtlı adreslerinizi hızlıca kullanmak için lütfen giriş yapın veya üye olun. Dilerseniz giriş yapmadan doğrudan devam edebilirsiniz.'
                        : 'Sipariş takip bilgileriniz e-posta ve SMS ile iletilecektir. Dilediğiniz zaman sisteme giriş yapabilirsiniz.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenAuth) onOpenAuth();
                      }}
                      className="flex-1 sm:flex-initial py-2.5 px-4 bg-[#ff0055] hover:bg-[#d90048] active:scale-98 text-white text-xs font-black rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <User size={14} />
                      <span>Giriş Yap / Üye Ol</span>
                    </button>

                    {!continueAsGuest ? (
                      <button
                        type="button"
                        onClick={() => setContinueAsGuest(true)}
                        className="flex-1 sm:flex-initial py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Giriş Yapmadan Devam Et
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setContinueAsGuest(false)}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Giriş Seçeneklerini Aç
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <UserCheck size={16} />
                  </div>
                  <div>
                    <span className="font-extrabold">{currentUser.name}</span> olarak giriş yapıldı ({currentUser.email})
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Kayıtlı Müşteri
                </span>
              </div>
            )}
            
            {/* İletişim & Adres Formu */}
            <form onSubmit={handlePaymentSubmit} className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Truck size={18} className="text-[#ff0055]" />
                  <span>Teslimat Adresi Detayları</span>
                </h2>
                {currentUser?.addresses && currentUser.addresses.length > 0 && selectedAddressId !== 'new' && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Kayıtlı Adres Seçili</span>
                  </span>
                )}
              </div>

              {/* KAYITLI ADRES SEÇİM ALANI (Eğer kullanıcının kayıtlı adresi varsa seçebilir) */}
              {currentUser?.addresses && currentUser.addresses.length > 0 && (
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#ff0055]" />
                      <span>Kayıtlı Teslimat Adresleriniz</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleSelectNewAddress}
                      className={`text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        selectedAddressId === 'new'
                          ? 'text-[#ff0055] font-black'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Plus size={13} />
                      <span>Farklı / Yeni Adres Gir</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentUser.addresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-[#ff0055] bg-pink-50/40 ring-2 ring-[#ff0055]/20 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected ? 'border-[#ff0055] bg-[#ff0055]' : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="font-extrabold text-xs text-slate-900">
                                {addr.title || 'Teslimat Adresi'}
                              </span>
                            </div>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded">
                                Varsayılan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 font-semibold truncate">
                            {addr.recipientName || fullName} · {addr.phone || phone}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {addr.neighborhood ? `${addr.neighborhood} Mah., ` : ''}
                            {addr.fullAddress}, {addr.district}/{addr.city}
                          </p>
                        </div>
                      );
                    })}

                    {/* Farklı / Yeni Adres Ekle Kartı */}
                    <div
                      onClick={handleSelectNewAddress}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        selectedAddressId === 'new'
                          ? 'border-[#ff0055] bg-pink-50/40 ring-2 ring-[#ff0055]/20 shadow-xs text-[#ff0055] font-black'
                          : 'border-dashed border-slate-300 bg-white hover:border-slate-400 text-slate-600 font-bold'
                      }`}
                    >
                      <Plus size={16} />
                      <span className="text-xs">Yeni / Farklı Bir Adres Gir</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ad Soyad */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" />
                      <span>Ad Soyad <span className="text-[#ff0055]">*</span></span>
                    </span>
                    {fieldErrors.fullName && (
                      <span className="text-[11px] font-bold text-rose-600">{fieldErrors.fullName}</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
                    }}
                    placeholder="Adınız ve Soyadınız"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium ${
                      fieldErrors.fullName
                        ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                        : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                    }`}
                  />
                </div>

                {/* Telefon Numarası (Ülke Kodu Seçimi + 3 hane 3 hane 4 hane boşluklu format) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      <span>Telefon Numarası <span className="text-[#ff0055]">*</span></span>
                    </span>
                    {fieldErrors.phone && (
                      <span className="text-[11px] font-bold text-rose-600">{fieldErrors.phone}</span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    {/* Ülke Kodu Seçici */}
                    <div className="relative shrink-0">
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => {
                          const newDial = e.target.value;
                          setSelectedCountryCode(newDial);
                          setPhone(formatPhoneNumber(phone, newDial));
                        }}
                        className="h-full pl-2.5 pr-7 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#ff0055] focus:bg-white transition-all appearance-none cursor-pointer"
                        title="Ülke Telefon Kodu Seçiniz"
                      >
                        {COUNTRY_OPTIONS.map((c) => (
                          <option key={c.code} value={c.dial}>
                            {c.flag} {c.dial}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                        <ChevronDown size={14} />
                      </div>
                    </div>

                    {/* Telefon Numarası Girişi */}
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value, selectedCountryCode);
                        setPhone(formatted);
                        if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder={selectedCountryCode === '+90' ? '5XX XXX XXXX' : 'Telefon Numarası'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium ${
                        fieldErrors.phone
                          ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                          : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                      }`}
                    />
                  </div>
                  {selectedCountryCode === '+90' && (
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">
                      Örn: 546 875 8671 (3 hane 3 hane 4 hane boşluklu format)
                    </p>
                  )}
                </div>
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <span>E-posta Adresi <span className="text-slate-400 font-normal text-[11px]">(İsteğe Bağlı)</span></span>
                  </span>
                  {fieldErrors.email && (
                    <span className="text-[11px] font-bold text-rose-600">{fieldErrors.email}</span>
                  )}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="ornek@email.com (isteğe bağlı)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium ${
                    fieldErrors.email
                      ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                      : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                  }`}
                />
              </div>

              {/* İl, İlçe ve Mahalle (İl ve İlçe Gibi Mahalle İçin de Seçenek Eklendi) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* İl */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>İl <span className="text-[#ff0055]">*</span></span>
                    {fieldErrors.city && (
                      <span className="text-[11px] font-bold text-rose-600">{fieldErrors.city}</span>
                    )}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setCity(selected);
                      setDistrict('');
                      setNeighborhood('');
                      setIsCustomNeighborhood(false);
                      if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: undefined }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium cursor-pointer ${
                      fieldErrors.city
                        ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                        : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                    }`}
                  >
                    <option value="">İl Seçiniz (81 İl)</option>
                    {PROVINCE_NAMES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                {/* İlçe */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>İlçe <span className="text-[#ff0055]">*</span></span>
                    {fieldErrors.district && (
                      <span className="text-[11px] font-bold text-rose-600">{fieldErrors.district}</span>
                    )}
                  </label>
                  <select
                    value={district}
                    disabled={!city}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setDistrict(selected);
                      setNeighborhood('');
                      setIsCustomNeighborhood(false);
                      if (fieldErrors.district) setFieldErrors((prev) => ({ ...prev, district: undefined }));
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      fieldErrors.district
                        ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                        : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                    }`}
                  >
                    <option value="">{city ? 'İlçe Seçiniz' : 'Önce İl Seçiniz'}</option>
                    {city &&
                      (TURKEY_PROVINCES[city] || []).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Mahalle (İl ve İlçe Gibi Seçenek + Listede Olmayan İçin Elle Giriş) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Mahalle <span className="text-[#ff0055]">*</span></span>
                    {fieldErrors.neighborhood && (
                      <span className="text-[11px] font-bold text-rose-600">{fieldErrors.neighborhood}</span>
                    )}
                  </label>
                  {!isCustomNeighborhood ? (
                    <div className="flex gap-1.5">
                      <select
                        value={neighborhood}
                        disabled={!district}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__custom__') {
                            setIsCustomNeighborhood(true);
                            setNeighborhood('');
                          } else {
                            setNeighborhood(val);
                            if (fieldErrors.neighborhood) setFieldErrors((prev) => ({ ...prev, neighborhood: undefined }));
                          }
                        }}
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          fieldErrors.neighborhood
                            ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                            : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                        }`}
                      >
                        <option value="">{district ? 'Mahalle Seçiniz' : 'Önce İlçe Seçin'}</option>
                        {district &&
                          getNeighborhoodsForDistrict(district).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        {district && (
                          <option value="__custom__">
                            ✍️ Listede Yoksa / Elle Yaz...
                          </option>
                        )}
                      </select>
                      {district && (
                        <button
                          type="button"
                          onClick={() => setIsCustomNeighborhood(true)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Mahalleyi Elle Yaz"
                        >
                          Yaz
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={neighborhood}
                        onChange={(e) => {
                          setNeighborhood(e.target.value);
                          if (fieldErrors.neighborhood) setFieldErrors((prev) => ({ ...prev, neighborhood: undefined }));
                        }}
                        placeholder="Mahalle adı yazınız"
                        className={`w-full px-3 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium ${
                          fieldErrors.neighborhood
                            ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                            : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomNeighborhood(false);
                          setNeighborhood('');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Seçenek Listesine Dön"
                      >
                        Seç
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Açık Teslimat Adresi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>Açık Teslimat Adresi (Cadde, Sokak, Bina No, Daire) <span className="text-[#ff0055]">*</span></span>
                  </span>
                  {fieldErrors.fullAddress && (
                    <span className="text-[11px] font-bold text-rose-600">{fieldErrors.fullAddress}</span>
                  )}
                </label>
                <textarea
                  rows={2}
                  value={fullAddress}
                  onChange={(e) => {
                    setFullAddress(e.target.value);
                    if (fieldErrors.fullAddress) setFieldErrors((prev) => ({ ...prev, fullAddress: undefined }));
                  }}
                  placeholder="Cadde, sokak, apartman ve daire no bilgisi..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium resize-none ${
                    fieldErrors.fullAddress
                      ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                      : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                  }`}
                />
              </div>

              {/* Sipariş Notu (Opsiyonel) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sipariş / Kargo Notu (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  placeholder="Örn: Zile basmayınız, güvenliğe bırakınız"
                  className="w-full bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#ff0055] focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
                <Lock size={13} className="text-emerald-600 shrink-0" />
                <span>Kişisel verileriniz 6698 sayılı KVKK kapsamında güvence altındadır.</span>
              </div>
            </form>

          </div>

          {/* SAĞ KOLON: Sipariş Özeti & Ödeme Yap Butonu */}
          <div className="lg:col-span-5 sticky top-28 space-y-4">
            
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-5">
              <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
                <span>Siparişiniz ({cartItems.length} Ürün)</span>
                <button
                  type="button"
                  onClick={onGoBackToCart}
                  className="text-xs font-bold text-[#ff0055] hover:underline cursor-pointer"
                >
                  Düzenle
                </button>
              </h2>

              {/* Ürün Mini Listesi */}
              <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                {cartItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-12 h-12 bg-white rounded-lg p-1 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.product.isCustomText ? (
                        <span className="text-[9px] font-black uppercase text-black font-display text-center leading-tight truncate px-0.5">
                          {item.customText || 'YAZINIZI YAZIN'}
                        </span>
                      ) : (
                        <StickerGraphic
                          type={item.product.svgType}
                          imageUrl={item.product.imageUrl}
                          colorHex="#111827"
                          customText={item.customText}
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.quantity}x {item.product.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.selectedDimension} · {item.selectedColor}
                        {item.customText ? ` · "${item.customText}"` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 font-price">
                      ₺{(getItemPrice(item) * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Fiyat Tablosu */}
              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Ara Toplam:</span>
                  <span className="font-price font-semibold text-slate-800">
                    ₺{subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kargo Ücreti 🚚:</span>
                  <span className="font-price font-semibold">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">ÜCRETSİZ</span>
                    ) : (
                      `₺${shippingFee.toFixed(2).replace('.', ',')}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200/90 pt-3 mt-2">
                  <span>Ödenecek Toplam:</span>
                  <span className="font-price text-2xl font-extrabold text-[#ff0055]">
                    ₺{grandTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* ÖDEME YÖNTEMİ: PayTR Kredi / Banka Kartı */}
              <div className="pt-2">
                <div className="p-4 bg-gradient-to-br from-pink-50/80 via-white to-slate-50 rounded-2xl border border-pink-200/90 space-y-3 text-xs mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-pink-100 border border-pink-200 flex items-center justify-center text-[#ff0055]">
                        <CreditCard size={17} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">Kredi / Banka Kartı (PayTR)</h4>
                        <p className="text-[10px] text-slate-500">256-Bit SSL & 3D Secure Doğrulamalı</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      GÜVENLİ POS
                    </span>
                  </div>

                  {/* Desteklenen Kart Rozetleri */}
                  <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-700">
                    <span className="px-2 py-0.5 bg-white rounded border border-slate-200">Troy</span>
                    <span className="px-2 py-0.5 bg-white rounded border border-slate-200">Visa</span>
                    <span className="px-2 py-0.5 bg-white rounded border border-slate-200">MasterCard</span>
                  </div>

                  {paytrError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0 text-red-600" />
                        <span>{paytrError}</span>
                      </div>
                      {siteSettings?.paytrSettings?.testMode && (
                        <div className="pt-2 border-t border-red-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <span className="text-[11px] text-red-700">Test modunda doğrudan siparişi oluşturabilirsiniz:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const customOid = 'AKUZ-TEST-' + Math.floor(100000 + Math.random() * 900000);
                              handleExecuteOrder('PayTR Kredi / Banka Kartı (Test Modu)', customOid, true);
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                          >
                            🧪 Test Olarak Hemen Tamamla
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Siparişi tamamla butonuna tıkladığınızda, bankanızın resmi SMS doğrulamalı PayTR 3D Secure güvenli ödeme ekranı açılacaktır.
                  </p>
                </div>
              </div>

              {/* SİPARİŞİ TAMAMLA BUTONU */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handlePaymentSubmit}
                  className="w-full py-3.5 px-4 bg-[#ff0055] hover:bg-[#d90048] disabled:opacity-75 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard size={18} />
                  <span>
                    {isProcessingPayment
                      ? 'PayTR Ödeme Ekranı Yükleniyor...'
                      : `PayTR ile Güvenli Öde (${grandTotal.toFixed(2).replace('.', ',')} TL)`}
                  </span>
                </button>

                {siteSettings?.paytrSettings?.testMode && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>Test Modu Aktif</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!validateOrderForm()) return;
                        const customOid = 'AKUZ-TEST-' + Math.floor(100000 + Math.random() * 900000);
                        handleExecuteOrder('PayTR Kredi / Banka Kartı (Test Modu)', customOid, true);
                      }}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      🧪 Test Siparişini Hemen Onayla
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700">
                    <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                    <span className="font-bold">256-Bit SSL Şifreleme</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-slate-700">
                    <Lock size={15} className="text-blue-600 shrink-0" />
                    <span className="font-bold">PayTR 3D Secure</span>
                  </div>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-medium leading-tight">
                  🔒 Kart bilgileriniz sunucularımızda saklanmaz. Ödemeniz doğrudan bankanızın 3D Secure SMS şifresi ile şifreli olarak tamamlanır.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* PAYTR 3D SECURE GÜVENLİ ÖDEME MODAL DIALOG */}
      {isPaytrModalOpen && paytrIframeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] animate-slide-down">
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs sm:text-sm tracking-wide">PayTR Güvenli Ödeme</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      3D SECURE
                    </span>
                    {siteSettings?.paytrSettings?.testMode && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        TEST MODU
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Tutar: <strong className="text-white font-mono">{grandTotal.toFixed(2)} TL</strong> · AKUZ Stickers
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Ödeme ekranını kapatmak istediğinize emin misiniz?')) {
                    setIsPaytrModalOpen(false);
                  }
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Kapat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Test Modu Bilgi ve Hızlı Onay Çubuğu */}
            {siteSettings?.paytrSettings?.testMode && (
              <div className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-200">
                <span className="text-[11px] text-amber-300 font-medium">
                  🧪 PayTR Test Modu devrede: Test kartı ile ödeyebilir veya hemen onaylayabilirsiniz.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsPaytrModalOpen(false);
                    const customOid = pendingOrderId ? `AKUZ-${pendingOrderId.replace(/^AKUZ/, '')}` : ('AKUZ-' + Math.floor(1000 + Math.random() * 9000));
                    handleExecuteOrder('PayTR Kredi / Banka Kartı (Test Modu)', customOid, true);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg cursor-pointer transition-colors whitespace-nowrap shadow-xs"
                >
                  ✓ Test Ödemesini Hemen Onayla
                </button>
              </div>
            )}

            {/* iFrame Container */}
            <div className="flex-1 bg-slate-100 overflow-y-auto p-1 sm:p-3 min-h-[560px] sm:min-h-[620px]">
              <iframe
                src={paytrIframeUrl}
                id="paytriframe"
                frameBorder={0}
                scrolling="yes"
                className="w-full h-[560px] sm:h-[620px] bg-white rounded-2xl shadow-xs border border-slate-200"
                title="PayTR 3D Secure Ödeme Ekranı"
              />
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                <span>Kart bilgileriniz asla sunucularımızda saklanmaz.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsPaytrModalOpen(false)}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPaytrModalOpen(false);
                    const customOid = pendingOrderId ? `AKUZ-${pendingOrderId.replace(/^AKUZ/, '')}` : undefined;
                    handleExecuteOrder('PayTR Kredi / Banka Kartı (3D Secure)', customOid, true);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>Ödemeyi Tamamladım</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
