import React, { useState } from 'react';
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertCircle,
  MessageCircle,
  ChevronRight,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Order } from '../types';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQuery = query.trim().toUpperCase();
    if (!cleanQuery) {
      setSearchError('Lütfen sipariş numaranızı veya e-posta adresinizi girin.');
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
          (o.trackingNumber && o.trackingNumber.toUpperCase().includes(cleanQuery))
      );

      // 2. Bulunamazsa sunucu API'sinden sorgula
      if (!match) {
        // ID ile sorgula
        const res = await fetch(`/api/orders?email=${encodeURIComponent(query.trim().toLowerCase())}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data && data.success && Array.isArray(data.orders) && data.orders.length > 0) {
            match = data.orders[0];
          }
        }
      }

      // Genel sipariş listesinde numara eşleşmesi kontrolü
      if (!match) {
        const allRes = await fetch('/api/orders').catch(() => null);
        if (allRes && allRes.ok) {
          const allData = await allRes.json().catch(() => null);
          if (allData && allData.success && Array.isArray(allData.orders)) {
            match = allData.orders.find(
              (o: any) =>
                (o.id && o.id.toUpperCase().includes(cleanQuery)) ||
                (o.trackingNumber && o.trackingNumber.toUpperCase().includes(cleanQuery))
            );
          }
        }
      }

      setIsSearching(false);
      if (match) {
        setSearchedOrder(match);
      } else {
        setSearchError('Girdiğiniz bilgilere ait sipariş bulunamadı. Lütfen sipariş numaranızı kontrol edin.');
      }
    } catch {
      setIsSearching(false);
      setSearchError('Sorgulama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // Kargo durum adımları
  const getStepIndex = (status: Order['status']) => {
    if (status === 'Teslim Edildi') return 3;
    if (status === 'Kargoya Verildi') return 2;
    return 1; // Hazırlanıyor
  };

  const currentStep = searchedOrder ? getStepIndex(searchedOrder.status) : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#ff6600]">
              <Search size={18} />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">
                Sipariş Sorgulama
              </h2>
              <p className="text-[11px] text-slate-300">
                Siparişinizin anlık kargo ve hazırlık durumunu öğrenin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Arama Formu */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sipariş Numaranız veya E-Posta Adresiniz
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Örn: AKUZ1712... veya e-posta@gmail.com"
                  className="w-full pl-10 pr-24 py-3 text-xs sm:text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600] focus:bg-white transition-all font-mono uppercase"
                />
                <Search size={17} className="absolute left-3.5 text-slate-400" />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-1.5 py-2 px-3.5 bg-[#ff6600] hover:bg-[#e65c00] text-white text-xs font-black rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSearching ? 'Aranıyor...' : 'Sorgula'}
                </button>
              </div>
            </div>
          </form>

          {/* Hata Uyarısı */}
          {searchError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1">
                <p className="font-bold">{searchError}</p>
                <p className="text-[11px] text-rose-600">
                  Sipariş numaranız sipariş oluşturulduktan sonra ekranınızda gösterilmiş ve e-posta adresinize gönderilmiştir.
                </p>
              </div>
            </div>
          )}

          {/* Bulunan Sipariş Kartı */}
          {searchedOrder && (
            <div className="space-y-4 animate-fadeIn">
              {/* Üst Sipariş Özeti */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Sipariş No
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      #{searchedOrder.id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tarih
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {searchedOrder.date}
                    </span>
                  </div>
                </div>

                {/* Stepper Durum Çizelgesi */}
                <div className="py-2">
                  <div className="grid grid-cols-3 gap-2 text-center relative">
                    {/* Çizgiler */}
                    <div className="absolute top-3.5 left-1/6 right-1/6 h-0.5 bg-slate-200 z-0">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                        }}
                      />
                    </div>

                    {/* Adım 1: Hazırlanıyor */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStep >= 1
                            ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Clock size={14} />
                      </div>
                      <span className="text-[11px] font-bold mt-1.5 text-slate-800">
                        Hazırlanıyor
                      </span>
                    </div>

                    {/* Adım 2: Kargoda */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStep >= 2
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Truck size={14} />
                      </div>
                      <span className="text-[11px] font-bold mt-1.5 text-slate-800">
                        Kargoya Verildi
                      </span>
                    </div>

                    {/* Adım 3: Teslim Edildi */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStep >= 3
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <CheckCircle2 size={14} />
                      </div>
                      <span className="text-[11px] font-bold mt-1.5 text-slate-800">
                        Teslim Edildi
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kargo Takip Numarası Varsa Özel Kargo Kartı */}
                {searchedOrder.trackingNumber ? (
                  <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <Truck size={16} />
                      </div>
                      <div>
                        <p className="font-bold text-blue-950">
                          {searchedOrder.carrierName || 'Kargonomi'} Takip No:
                        </p>
                        <p className="font-mono font-black text-blue-800 text-xs">
                          {searchedOrder.trackingNumber}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://kargotakip.kargonomi.com.tr/?tracking=${searchedOrder.trackingNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <span>Kargom Nerede</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs flex items-center gap-2 text-amber-900">
                    <Clock size={16} className="text-amber-600 shrink-0" />
                    <span>
                      Siparişiniz atölyemizde özenle hazırlanıyor. Kargoya verildiğinde takip numaranız burada ve SMS/e-postanızda görünecektir.
                    </span>
                  </div>
                )}
              </div>

              {/* Sipariş Edilen Ürünler */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Siparişteki Ürünler ({searchedOrder.items.length})
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {searchedOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0"
                    >
                      <span className="font-medium text-slate-800">
                        {it.quantity}x {it.productName} ({it.color} · {it.dimension})
                      </span>
                      <span className="font-bold text-slate-900">
                        ₺{(it.price * it.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-black text-slate-900">
                  <span>Toplam Tutar:</span>
                  <span className="text-sm text-[#ff0055]">
                    ₺{searchedOrder.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Teslimat Adresi */}
              {searchedOrder.shippingAddress && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                    <MapPin size={13} />
                    <span>Teslimat Adresi</span>
                  </div>
                  <p className="text-slate-800 font-medium">
                    {searchedOrder.shippingAddress}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Destek & Yardım Kartı */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="text-xs">
              <p className="font-bold text-slate-800">Yardıma mı ihtiyacınız var?</p>
              <p className="text-[11px] text-slate-500">Müşteri temsilcimiz anında yardımcı olsun.</p>
            </div>
            <a
              href="https://wa.me/905468758671?text=Merhaba,%20siparişim%20hakkında%20bilgi%20almak%20istiyorum."
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <MessageCircle size={14} />
              <span>WhatsApp Destek</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
