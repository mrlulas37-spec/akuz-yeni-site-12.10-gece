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
  MessageCircle,
  X,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { CartItem, UserProfile, Order, SiteSettings } from '../types';
import { StickerGraphic } from './StickerGraphic';
import { sendOrderPreparingEmail } from '../utils/emailService';
import { createKargonomiShipment } from '../utils/kargonomiService';
import { getStoredSiteSettings } from '../utils/adminStore';
import { calculateItemUnitPrice } from '../utils/pricingHelper';
import { TURKEY_PROVINCES, PROVINCE_NAMES } from '../data/turkeyLocations';

interface CheckoutPageProps {
  cartItems: CartItem[];
  currentUser: UserProfile | null;
  onGoBackToCart: () => void;
  onGoHome: () => void;
  onViewOrders?: () => void;
  onPlaceOrder?: (newOrder: Order) => void;
  onOpenAuth?: () => void;
  siteSettings?: SiteSettings;
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
}) => {
  // Sipariş başarıyla verildi durumu
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(null);

  // Ödeme yöntemi seçimi: 'whatsapp' | 'card' | 'bank_transfer'
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'card' | 'bank_transfer'>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Üye olmadan devam et seçimi
  const [continueAsGuest, setContinueAsGuest] = useState(false);

  // PayTR Sanal POS State'leri ve Canlı Site Ayarları
  const siteSettings = propSiteSettings ?? getStoredSiteSettings();
  const [isPaytrModalOpen, setIsPaytrModalOpen] = useState(false);
  const [paytrIframeUrl, setPaytrIframeUrl] = useState<string | null>(null);
  const [paytrError, setPaytrError] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  // Form alanları (İl ve İlçe her zaman varsayılan olarak boş kalır, kullanıcı 81 ilden seçer)
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [fullAddress, setFullAddress] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
    city?: string;
    district?: string;
    fullAddress?: string;
  }>({});

  // Hesapta olan bilgileri çek (İl ve İlçe her zaman boş kalır)
  useEffect(() => {
    let initialName = currentUser?.name || '';
    let initialPhone = currentUser?.phone || '';
    let initialEmail = currentUser?.email || '';
    let initialAddress = '';

    if (currentUser?.addresses && currentUser.addresses.length > 0) {
      const defaultAddr = currentUser.addresses.find((a) => a.isDefault) || currentUser.addresses[0];
      initialAddress = defaultAddr.fullAddress || '';
      if (!initialPhone && defaultAddr.phone) initialPhone = defaultAddr.phone;
      if (!initialName && defaultAddr.recipientName) initialName = defaultAddr.recipientName;
    }

    // LocalStorage fallback
    if (!initialName || !initialPhone || !initialAddress) {
      try {
        const savedUser = localStorage.getItem('akuz_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (!initialName && parsed.name) initialName = parsed.name;
          if (!initialPhone && parsed.phone) initialPhone = parsed.phone;
          if (!initialEmail && parsed.email) initialEmail = parsed.email;
          if (parsed.addresses && parsed.addresses.length > 0) {
            const def = parsed.addresses.find((a: any) => a.isDefault) || parsed.addresses[0];
            if (!initialAddress && def.fullAddress) initialAddress = def.fullAddress;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    setFullName(initialName);
    setPhone(initialPhone);
    setEmail(initialEmail);
    // İl ve İlçe kullanıcı seçene kadar her zaman boş kalır
    setCity('');
    setDistrict('');
    setFullAddress(initialAddress);
  }, [currentUser]);

  // Zorunlu alan kontrolü - Eksik olan alanların tek tek adını belirler
  const validateOrderForm = (): boolean => {
    const errors: {
      fullName?: string;
      phone?: string;
      email?: string;
      city?: string;
      district?: string;
      fullAddress?: string;
    } = {};
    const missingFields: string[] = [];

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanCity = city.trim();
    const cleanDistrict = district.trim();
    const cleanAddress = fullAddress.trim();

    if (!cleanName) {
      errors.fullName = 'İsim ve Soyisim alanı zorunludur.';
      missingFields.push('İsim Soyisim');
    }

    if (!cleanPhone) {
      errors.phone = 'Telefon numarası alanı zorunludur.';
      missingFields.push('Telefon Numarası');
    } else if (cleanPhone.replace(/\D/g, '').length < 10) {
      errors.phone = 'Geçerli bir telefon numarası giriniz (en az 10 hane).';
      missingFields.push('Geçerli Telefon Numarası');
    }

    if (!cleanEmail) {
      errors.email = 'E-posta adresi alanı zorunludur.';
      missingFields.push('E-Posta');
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
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

    if (!cleanAddress) {
      errors.fullAddress = 'Açık teslimat adresi alanı zorunludur.';
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
  const freeShippingThreshold = siteSettings?.freeShippingThreshold ?? 150;
  const standardShippingFee = siteSettings?.shippingFee ?? 39.9;
  const shippingFee = (subtotal >= freeShippingThreshold || subtotal === 0 || standardShippingFee === 0) ? 0 : standardShippingFee;
  const grandTotal = subtotal + shippingFee;

  // PayTR Başarılı/Başarısız Dönüş Takibi
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paytrResult = params.get('payment_result');
    const oid = params.get('oid');
    if (paytrResult === 'success') {
      const orderIdToUse = oid ? `AKUZ-${oid.replace(/^AKUZ/, '')}` : ('AKUZ-' + Math.floor(1000 + Math.random() * 9000));
      handleExecuteOrder(false, 'PayTR Kredi / Banka Kartı (3D Secure)', orderIdToUse);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (paytrResult === 'failed') {
      setPaytrError('Ödeme işlemi bankanız veya PayTR tarafından onaylanamadı. Lütfen kart bilgilerinizi kontrol ediniz.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // PayTR Ödeme Oturumu Başlat (Gerçek Token Al & iFrame Aç)
  const handleInitiatePaytrPayment = async () => {
    if (!validateOrderForm()) return;

    setFormError('');
    setPaytrError(null);
    setIsProcessingPayment(true);

    const generatedOrderId = 'AKUZ' + Date.now();
    setPendingOrderId(generatedOrderId);

    try {
      const response = await fetch('/api/paytr/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: generatedOrderId,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: fullAddress.trim(),
          city: city.trim(),
          district: district.trim(),
          totalAmount: grandTotal,
          items: cartItems.map((item) => ({
            productName: item.product.name,
            quantity: item.quantity,
            price: getItemPrice(item),
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

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOrderForm()) return;

    if (paymentMethod === 'card') {
      handleInitiatePaytrPayment();
    } else if (paymentMethod === 'bank_transfer') {
      handleExecuteOrder(false, 'Banka Havalesi / EFT');
    } else {
      handleExecuteOrder(true, 'WhatsApp Hızlı Sipariş');
    }
  };

  const handleExecuteOrder = (viaWhatsApp: boolean, methodLabel: string, customOrderId?: string) => {
    if (!validateOrderForm()) return;
    setFormError('');

    const newOrderId = customOrderId || ('AKUZ-' + Math.floor(1000 + Math.random() * 9000));
    const orderItems = cartItems.map((item) => ({
      productName: item.product.name,
      quantity: item.quantity,
      color: item.selectedColor,
      dimension: item.selectedDimension,
      finish: item.selectedFinish,
      customText: item.customText,
      price: getItemPrice(item),
    }));

    const cleanEmail = email ? email.trim() : '';

    const newOrder: Order = {
      id: newOrderId,
      date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      status: 'Hazırlanıyor',
      total: grandTotal,
      customerName: fullName.trim(),
      customerPhone: phone.trim(),
      customerEmail: cleanEmail,
      shippingAddress: `${fullAddress.trim()}, ${district}/${city}`,
      items: orderItems,
    };

    // 1. Merkezi Host Sunucusuna Kaydet
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder),
    }).catch((err) => console.warn('[HOST ORDER SAVE ERROR]', err));

    // 2. React state ve yerel belleğe işle
    if (onPlaceOrder) {
      onPlaceOrder(newOrder);
    }

    // 3. Otomatik "Siparişiniz Hazırlanıyor" E-postası gönder
    if (cleanEmail && cleanEmail.includes('@')) {
      sendOrderPreparingEmail({
        orderId: newOrderId,
        customerName: fullName.trim() || 'Değerli Müşterimiz',
        customerEmail: cleanEmail,
        customerPhone: phone.trim(),
        shippingAddress: `${fullAddress.trim()}, ${district}/${city}`,
        items: orderItems,
        totalPrice: grandTotal,
        orderNote,
      }).catch(console.error);
    }

    // 4. Kargonomi Kargo Entegrasyonu
    const currentSettings = getStoredSiteSettings();
    const kargonomi = currentSettings.kargonomiSettings;
    if (kargonomi?.enabled && kargonomi.autoCreateOnOrder !== false) {
      createKargonomiShipment({
        orderId: newOrderId,
        recipientName: fullName.trim() || 'Müşteri',
        recipientPhone: phone.trim() || '05555555555',
        recipientAddress: fullAddress.trim() || 'Teslimat Adresi',
        recipientCity: city,
        recipientDistrict: district,
        itemsDescription: orderItems.map((i) => `${i.quantity}x ${i.productName}`).join(', '),
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

    // Modal varsa kapat ve onay ekranını aç
    setIsPaytrModalOpen(false);
    setOrderPlaced(newOrder);

    // WhatsApp seçildiyse güvenli anchor yönlendirmesi
    if (viaWhatsApp) {
      try {
        const waUrl = `https://wa.me/905468758671?text=${generateWhatsAppMessage()}`;
        const a = document.createElement('a');
        a.href = waUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.log('WhatsApp link created', e);
      }
    }
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

  // EĞER SİPARİŞ BAŞARIYLA TAMAMLANDIYSA: ONY EKRANI
  if (orderPlaced) {
    return (
      <div className="min-h-[80vh] bg-[#faf9f6] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-xl text-center space-y-6">
          <div className="w-18 h-18 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
            <CheckCircle2 size={40} />
          </div>

          <div>
            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black rounded-full mb-3">
              ⏳ Siparişiniz Hazırlanıyor
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Siparişiniz Başarıyla Alındı!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Sipariş Numaranız: <strong className="text-slate-900 font-extrabold font-mono">#{orderPlaced.id}</strong>
            </p>
          </div>

          {orderPlaced.customerEmail && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs text-slate-600 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Mail size={14} className="text-[#ff0055]" />
                <span>Onay E-Postası Gönderildi</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Sipariş hazırlık detayları <strong>{orderPlaced.customerEmail}</strong> adresinize başarıyla iletilmiştir.
              </p>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Teslim Edilecek Kişi:</span>
              <strong className="text-slate-800">{orderPlaced.customerName}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Telefon:</span>
              <strong className="text-slate-800">{orderPlaced.customerPhone}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Teslimat Adresi:</span>
              <strong className="text-slate-800 text-right max-w-xs">{orderPlaced.shippingAddress}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Ödeme Şekli:</span>
              <span className="font-semibold text-slate-800">
                {paymentMethod === 'card'
                  ? '💳 Kredi / Banka Kartı (3D Secure Onaylandı)'
                  : paymentMethod === 'bank_transfer'
                  ? '🏦 Banka Havalesi / EFT'
                  : '💬 WhatsApp İle Hızlı Onay'}
              </span>
            </div>

            {orderPlaced.trackingNumber && (
              <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Kargo Takip No:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {orderPlaced.trackingNumber} ({orderPlaced.carrierName || 'Kargonomi'})
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-900 pt-2 border-t border-slate-200 font-bold text-sm">
              <span>Toplam Tutar:</span>
              <span className="text-[#ff0055] font-black text-base">₺{orderPlaced.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {paymentMethod === 'bank_transfer' && (
            <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-left text-xs space-y-1.5 text-indigo-950">
              <p className="font-bold flex items-center gap-1.5 text-indigo-900">
                <span>Havale / EFT Hesap Bilgisi</span>
              </p>
              <div className="p-2 bg-white rounded-lg border border-indigo-100 font-mono text-[11px] select-all">
                TR42 0004 6000 0012 3456 7890 12
              </div>
              <p className="text-[11px] text-indigo-800">
                Alıcı: <strong>Murat Ulusoy</strong> · Banka: <strong>Akbank / Ziraat Bankası</strong>
              </p>
              <p className="text-[10px] text-indigo-600">
                * Açıklama kısmına <strong className="font-mono">#{orderPlaced.id}</strong> yazmanız siparişinizin derhal hazırlanmasını sağlar.
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <a
              href={`https://wa.me/905468758671?text=${generateWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              <MessageCircle size={18} />
              <span>WhatsApp İle Siparişi Onayla & Takip Et</span>
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onViewOrders && (
                <button
                  type="button"
                  onClick={onViewOrders}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Siparişlerimi Görüntüle
                </button>
              )}
              <button
                type="button"
                onClick={onGoHome}
                className={`w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  !onViewOrders ? 'sm:col-span-2' : ''
                }`}
              >
                Alışverişe Devam Et
              </button>
            </div>
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
              <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Truck size={18} className="text-[#ff0055]" />
                <span>Teslimat Adresi Detayları</span>
              </h2>

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

                {/* Telefon Numarası */}
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
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    placeholder="Örn: 0546 875 86 71"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium ${
                      fieldErrors.phone
                        ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                        : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <span>E-posta Adresi <span className="text-[#ff0055]">*</span></span>
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
                  placeholder="ornek@email.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium ${
                    fieldErrors.email
                      ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-400'
                      : 'bg-slate-50 border-slate-200 focus:border-[#ff0055] focus:bg-white'
                  }`}
                />
              </div>

              {/* İl ve İlçe (81 İl Seçimi ve Dinamik İlçe Seçimi - Her Zaman Boş Başlar) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium cursor-pointer ${
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
                      setDistrict(e.target.value);
                      if (fieldErrors.district) setFieldErrors((prev) => ({ ...prev, district: undefined }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-slate-800 focus:outline-none transition-all font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
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
              </div>

              {/* Açık Teslimat Adresi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400" />
                    <span>Açık Teslimat Adresi <span className="text-[#ff0055]">*</span></span>
                  </span>
                  {fieldErrors.fullAddress && (
                    <span className="text-[11px] font-bold text-rose-600">{fieldErrors.fullAddress}</span>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={fullAddress}
                  onChange={(e) => {
                    setFullAddress(e.target.value);
                    if (fieldErrors.fullAddress) setFieldErrors((prev) => ({ ...prev, fullAddress: undefined }));
                  }}
                  placeholder="Mahalle, cadde, sokak, apartman ve daire no bilgisi..."
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
                  <span>Kargo Ücreti:</span>
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

              {/* ÖDEME YÖNTEMİ SEÇİMİ (Trendyol Modeli) */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Ödeme Yöntemi Seçin:
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('whatsapp')}
                    className={`py-2.5 px-2 rounded-xl border text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'whatsapp'
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <MessageCircle size={16} className="text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2.5 px-2 rounded-xl border text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-[#ff0055] bg-pink-50/70 text-pink-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard size={16} className="text-[#ff0055]" />
                    <span>Kredi Kartı (PayTR)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`py-2.5 px-2 rounded-xl border text-[11px] sm:text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-indigo-500 bg-indigo-50/70 text-indigo-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Truck size={16} className="text-indigo-600" />
                    <span>Havale/EFT</span>
                  </button>
                </div>

                {/* PayTR Sanal POS Bilgi ve Güven Kutusu */}
                {paymentMethod === 'card' && (
                  <div className="p-3.5 bg-gradient-to-br from-pink-50/80 via-white to-slate-50 rounded-2xl border border-pink-200/90 space-y-2.5 text-xs animate-fadeIn mb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-pink-100 border border-pink-200 flex items-center justify-center text-[#ff0055]">
                          <Lock size={15} />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-xs">PayTR 256-Bit SSL Sanal POS</h4>
                          <p className="text-[10px] text-slate-500">Banka Onaylı 3D Secure Güvenli Ödeme</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        AKTİF
                      </span>
                    </div>

                    {/* Desteklenen Kart Rozetleri */}
                    <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-700">
                      <span className="px-2 py-0.5 bg-white rounded border border-slate-200">Troy</span>
                      <span className="px-2 py-0.5 bg-white rounded border border-slate-200">Visa</span>
                      <span className="px-2 py-0.5 bg-white rounded border border-slate-200">MasterCard</span>
                      <span className="px-2 py-0.5 bg-white rounded border border-slate-200">World</span>
                      <span className="px-2 py-0.5 bg-white rounded border border-slate-200">Bonus</span>
                      <span className="px-2 py-0.5 bg-white rounded border border-slate-200">Maximum</span>
                    </div>

                    {paytrError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0 text-red-600" />
                        <span>{paytrError}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Butona tıkladığınızda, bankanızın resmi SMS doğrulamalı PayTR 3D Secure ödeme ekranı güvenle açılacaktır.
                    </p>
                  </div>
                )}

                {/* Havale / EFT Bilgi Kutusu */}
                {paymentMethod === 'bank_transfer' && (
                  <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-[11px] text-indigo-900 space-y-1 animate-fadeIn mb-3">
                    <p className="font-bold flex items-center gap-1">
                      <span>Banka: Akbank & Ziraat Bankası</span>
                    </p>
                    <p className="font-mono font-semibold">TR42 0004 6000 0012 3456 7890 12</p>
                    <p className="text-[10px] text-indigo-700">Alıcı: Murat Ulusoy · Açıklamaya sipariş numaranızı yazınız.</p>
                  </div>
                )}
              </div>

              {/* SİPARİŞİ TAMAMLA BUTONU */}
              <div className="space-y-2.5 pt-1">
                {paymentMethod === 'whatsapp' ? (
                  <button
                    type="button"
                    onClick={() => handleExecuteOrder(true, 'WhatsApp Hızlı Sipariş')}
                    className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle size={18} />
                    <span>WhatsApp İle Siparişi Tamamla</span>
                  </button>
                ) : paymentMethod === 'card' ? (
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handlePaymentSubmit}
                    className="w-full py-3.5 px-4 bg-[#ff0055] hover:bg-[#d90048] disabled:opacity-75 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-rose-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CreditCard size={18} />
                    <span>{isProcessingPayment ? 'PayTR Ödeme Ekranı Yükleniyor...' : `PayTR ile Güvenli Öde (${grandTotal.toFixed(2)} TL)`}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleExecuteOrder(false, 'Banka Havalesi / EFT')}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 size={18} />
                    <span>Havale / EFT Siparişini Oluştur</span>
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Güvenli 256-Bit SSL şifrelemeli işlem · PayTR Güvencesi</span>
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
                    handleExecuteOrder(false, 'PayTR Kredi / Banka Kartı (3D Secure)', customOid);
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
