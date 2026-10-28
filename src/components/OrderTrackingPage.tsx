import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertCircle,
  MapPin,
  Calendar,
  ArrowLeft,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { Order } from '../types';
import { StickerGraphic } from './StickerGraphic';
import { WhatsAppOfficialIcon } from './ContactSection';

interface OrderTrackingPageProps {
  orders: Order[];
  onGoHome: () => void;
  onNavigateToCatalog?: () => void;
  initialOrderId?: string;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({
  orders,
  onGoHome,
  onNavigateToCatalog,
  initialOrderId = '',
}) => {
  const [query, setQuery] = useState(initialOrderId);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // URL'den veya başlangıç parametresinden otomatik sorgulama
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderParam = params.get('siparis') || params.get('order') || initialOrderId;
    if (orderParam && orderParam.trim()) {
      setQuery(orderParam.trim());
      executeSearch(orderParam.trim());
    }
  }, [initialOrderId]);

  const executeSearch = async (searchTarget: string) => {
    const cleanQuery = searchTarget.trim().toUpperCase();
    if (!cleanQuery) {
      setSearchError('Lütfen sipariş numaranızı veya e-posta adresinizi giriniz.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setSearchedOrder(null);

    try {
      // 1. Önce yerel orders listesinde ara
      let match = orders.find(
        (o) =>
          (o.id && o.id.toUpperCase().includes(cleanQuery)) ||
          (o.customerEmail && o.customerEmail.toUpperCase() === cleanQuery) ||
          (o.customerPhone && o.customerPhone.replace(/\D/g, '').includes(cleanQuery.replace(/\D/g, ''))) ||
          (o.trackingNumber && o.trackingNumber.toUpperCase().includes(cleanQuery))
      );

      // 2. Sunucu Takip API'sinden sipariş numarası veya takip koduyla anında sorgula
      if (!match) {
        const trackRes = await fetch(`/api/orders/track?query=${encodeURIComponent(searchTarget.trim())}`).catch(() => null);
        if (trackRes && trackRes.ok) {
          const trackData = await trackRes.json().catch(() => null);
          if (trackData && trackData.success && trackData.order) {
            match = trackData.order;
          }
        }
      }

      // 3. Bulunamazsa sunucu API'sinden e-posta ile sorgula
      if (!match) {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(searchTarget.trim().toLowerCase())}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.success && Array.isArray(data.orders) && data.orders.length > 0) {
            match = data.orders[0];
          }
        }
      }

      setIsSearching(false);
      if (match) {
        setSearchedOrder(match);
      } else {
        setSearchError('Girdiğiniz bilgilere ait bir sipariş bulunamadı. Lütfen sipariş numaranızı veya e-posta adresinizi kontrol ediniz.');
      }
    } catch {
      setIsSearching(false);
      setSearchError('Sorgulama sırasında bir bağlantı hatası oluştu. Lütfen tekrar deneyiniz.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const getStepIndex = (status: Order['status']) => {
    if (status === 'Teslim Edildi') return 3;
    if (status === 'Kargoya Verildi') return 2;
    return 1; // Hazırlanıyor
  };

  const currentStep = searchedOrder ? getStepIndex(searchedOrder.status) : 1;

  return (
    <div className="min-h-[85vh] bg-[#faf9f6] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb ve Geri Dön */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#ff0055] transition-colors py-2 px-3 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Ana Sayfaya Dön</span>
          </button>
        </div>

        {/* Başlık ve Bilgilendirme */}
        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 border border-orange-200 text-[#ff6600] text-xs font-black">
            <Package size={14} />
            <span>CANLI KARGO & SİPARİŞ TAKİBİ</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Siparişinizi Sorgulayın
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Sipariş numaranız, e-posta adresiniz veya kargo takip numaranız ile anlık üretim, paketleme ve teslimat durumunu kolayca öğrenin.
          </p>
        </div>

        {/* Arama Kartı */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-2">
                Sipariş Numaranız veya E-Posta Adresiniz
              </label>
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Örn: AKUZ1712... veya eposta@gmail.com"
                    className="w-full pl-11 pr-4 py-3.5 text-xs sm:text-sm bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:bg-white transition-all font-mono uppercase text-slate-900"
                  />
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="py-3.5 px-7 bg-[#ff6600] hover:bg-[#e65c00] active:scale-98 text-white text-xs sm:text-sm font-black rounded-2xl transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  <Search size={16} />
                  <span>{isSearching ? 'Sorgulanıyor...' : 'Siparişi Sorgula'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
              <span>💡 <strong>İpucu:</strong> Sipariş numaranız sipariş anında ekranda çıkan ve e-postanıza iletilen <strong>AKUZ...</strong> kodudur.</span>
            </div>
          </form>

          {/* Hata Mesajı */}
          {searchError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-rose-800 font-semibold animate-fadeIn">
              <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-1">
                <p>{searchError}</p>
                <p className="text-[11px] text-rose-600 font-normal">
                  Yardım için WhatsApp hattımızdan bizimle iletişime geçebilirsiniz.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Yükleniyor Göstergesi */}
        {isSearching && (
          <div className="text-center py-12 space-y-3 animate-fadeIn">
            <div className="w-12 h-12 border-3 border-[#ff6600] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Sipariş veritabanı taranıyor, lütfen bekleyiniz...</p>
          </div>
        )}

        {/* Bulunan Sipariş Sonuç Kartı */}
        {searchedOrder && !isSearching && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden animate-slide-down space-y-6 p-6 sm:p-8">
            
            {/* Header: Sipariş No & Durum */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  SİPARİŞ NUMARASI
                </span>
                <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight flex items-center gap-2">
                  #{searchedOrder.id}
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-sans border border-slate-200">
                    {searchedOrder.date}
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    TOPLAM TUTAR
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#ff0055] font-price">
                    ₺{searchedOrder.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            {/* 3 Adımlı Canlı Durum İlerleme Çubuğu */}
            <div className="bg-slate-50/80 rounded-2xl p-5 sm:p-6 border border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between text-xs font-black text-slate-800">
                <span className="flex items-center gap-2">
                  <Clock size={16} className="text-[#ff6600]" />
                  <span>Sipariş Hazırlık & Kargo Aşaması</span>
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#ff6600]/10 text-[#ff6600] border border-[#ff6600]/20">
                  {searchedOrder.status}
                </span>
              </div>

              {/* İlerleme Çubuğu Adımları */}
              <div className="relative">
                {/* Arka plan çizgisi */}
                <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0" />
                {/* Dolu çizgi */}
                <div
                  className="absolute top-5 left-8 h-1 bg-emerald-500 transition-all duration-700 -z-0"
                  style={{
                    width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : 'calc(100% - 4rem)',
                  }}
                />

                <div className="grid grid-cols-3 gap-2 relative z-10 text-center">
                  
                  {/* Adım 1: Hazırlanıyor */}
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                        currentStep >= 1
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Hazırlanıyor</p>
                      <p className="text-[10px] text-slate-500 hidden sm:block">Atölyede kesiliyor</p>
                    </div>
                  </div>

                  {/* Adım 2: Kargoya Verildi */}
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                        currentStep >= 2
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : currentStep === 1
                          ? 'bg-amber-100 text-amber-700 ring-4 ring-amber-50 animate-pulse'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Truck size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Kargoya Verildi</p>
                      <p className="text-[10px] text-slate-500 hidden sm:block">Taşıyıcıya teslim edildi</p>
                    </div>
                  </div>

                  {/* Adım 3: Teslim Edildi */}
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                        currentStep >= 3
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">Teslim Edildi</p>
                      <p className="text-[10px] text-slate-500 hidden sm:block">Adresinize ulaştırıldı</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Kargo Takip Bilgisi Kutusu */}
            {searchedOrder.trackingNumber && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Truck size={20} />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block">
                      {searchedOrder.carrierName || 'Kargonomi'} Kargo Takip No:
                    </span>
                    <span className="font-mono font-bold text-emerald-800 text-sm select-all">
                      {searchedOrder.trackingNumber}
                    </span>
                  </div>
                </div>

                <a
                  href={`https://kargonomi.com/kargo-takip?no=${searchedOrder.trackingNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Kargoyu Canlı Takip Et</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            )}

            {/* Alıcı ve Teslimat Bilgileri */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">
                  ALICI BİLGİLERİ
                </span>
                <p className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <User size={14} className="text-slate-400" />
                  <span>{searchedOrder.customerName || 'Müşteri'}</span>
                </p>
                {searchedOrder.customerPhone && (
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" />
                    <span>{searchedOrder.customerPhone}</span>
                  </p>
                )}
                {searchedOrder.customerEmail && (
                  <p className="text-slate-600 flex items-center gap-1.5 truncate">
                    <Mail size={13} className="text-slate-400" />
                    <span>{searchedOrder.customerEmail}</span>
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="font-bold text-slate-400 uppercase text-[10px] block">
                  TESLİMAT ADRESİ
                </span>
                <p className="text-slate-800 font-semibold leading-relaxed flex items-start gap-1.5">
                  <MapPin size={14} className="text-[#ff0055] shrink-0 mt-0.5" />
                  <span>{searchedOrder.shippingAddress || 'Belirtilmemiş'}</span>
                </p>
              </div>
            </div>

            {/* Siparişteki Ürünler Listesi */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Siparişteki Ürünler ({searchedOrder.items.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate">
                        {item.quantity}x {item.productName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {item.dimension} · {item.color}
                        {item.finish ? ` · ${item.finish}` : ''}
                        {item.customText ? ` · "${item.customText}"` : ''}
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-900 font-price shrink-0">
                      ₺{(item.price * item.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alt İşlemler Butonları */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <a
                href={`https://wa.me/905468758671?text=${encodeURIComponent(
                  `Merhaba, #${searchedOrder.id} numaralı siparişim hakkında bilgi almak istiyorum.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black rounded-xl transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <WhatsAppOfficialIcon size={16} />
                <span>WhatsApp'tan Siparişi Sor</span>
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchedOrder(null);
                    setQuery('');
                    setHasSearched(false);
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Farklı Sipariş Sorgula
                </button>
                {onNavigateToCatalog && (
                  <button
                    type="button"
                    onClick={onNavigateToCatalog}
                    className="px-4 py-2.5 bg-[#ff0055] hover:bg-[#d90048] text-white text-xs font-black rounded-xl transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ShoppingBag size={14} />
                    <span>Kataloğa Git</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
