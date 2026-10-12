import React from 'react';
import {
  CheckCircle2,
  Package,
  Truck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageCircle,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Order } from '../types';

interface OrderSuccessPageProps {
  order: Order | null;
  onGoHome: () => void;
  onViewOrders?: () => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  order,
  onGoHome,
  onViewOrders,
}) => {
  // WhatsApp sipariş takip mesajı oluştur
  const generateWhatsAppMessage = () => {
    if (!order) return '';
    let msg = `Merhaba AKUZ Stickers, #${order.id} numaralı siparişim hakkında bilgi almak istiyorum:%0A%0A`;
    msg += `*Sipariş No:* #${order.id}%0A`;
    msg += `*İsim:* ${order.customerName}%0A`;
    msg += `*Tutar:* ₺${order.total.toFixed(2)}%0A`;
    if (order.trackingNumber) {
      msg += `*Takip No:* ${order.trackingNumber}%0A`;
    }
    msg += `%0ASiparişim ne zaman kargolanır acaba?`;
    return msg;
  };

  return (
    <div className="min-h-[85vh] bg-[#faf9f6] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-xl space-y-7">
        
        {/* Üst İkon ve Tebrik Başlığı */}
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-emerald-500 to-teal-500 text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25 border-4 border-white">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>
            <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-xs">
              <Sparkles size={16} />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Siparişiniz Başarıyla Onaylandı</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Harika! Siparişinizi Aldık 🎉
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Siparişiniz atölye üretim kuyruğuna alındı ve özenle hazırlanmaya başlandı. 
            Tüm süreç adım adım tarafınıza bildirilecektir.
          </p>
        </div>

        {/* Sipariş No ve Tarih Rozet Kutusu */}
        {order && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="text-center sm:text-left">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Sipariş Numaranız
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-[#ff0055] tracking-wide">
                #{order.id}
              </span>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Sipariş Tarihi
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-200 flex items-center justify-center sm:justify-end gap-1.5 mt-0.5">
                <Calendar size={13} className="text-emerald-400" />
                <span>{order.date}</span>
              </span>
            </div>
          </div>
        )}

        {/* E-posta Bildirim Bilgilendirmesi */}
        {order?.customerEmail && (
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail size={16} />
            </div>
            <div className="space-y-0.5">
              <p className="font-black text-emerald-950">
                Onay ve Hazırlık E-Postası Gönderildi!
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Sipariş özeti ve üretim aşaması <strong>{order.customerEmail}</strong> adresinize gönderildi. (Gelen kutunuzu veya spam klasörünü kontrol edebilirsiniz.)
              </p>
            </div>
          </div>
        )}

        {/* Sipariş Detayları & Teslimat Özeti */}
        {order && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Package size={16} className="text-[#ff0055]" />
                <span>Sipariş Özeti</span>
              </span>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-extrabold text-[10px]">
                {order.status || 'Hazırlanıyor'}
              </span>
            </div>

            {/* Ürün Listesi */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {order.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-200/50 last:border-b-0"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900 block text-xs">
                        {it.quantity}x {it.productName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {it.color} · {it.dimension} {it.finish ? `(${it.finish})` : ''}
                        {it.customText ? ` · Yazı: "${it.customText}"` : ''}
                      </span>
                    </div>
                    <span className="font-black text-slate-900 text-xs shrink-0">
                      ₺{(it.price * it.quantity).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-1.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
              <div className="flex justify-between">
                <span>Alıcı:</span>
                <strong className="text-slate-900">{order.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span>İletişim Telefonu:</span>
                <strong className="text-slate-900">{order.customerPhone}</strong>
              </div>
              <div className="flex justify-between">
                <span>Teslimat Adresi:</span>
                <strong className="text-slate-900 text-right max-w-xs">{order.shippingAddress}</strong>
              </div>
              {order.trackingNumber && (
                <div className="flex justify-between pt-1 text-emerald-700 font-bold">
                  <span>Kargo Takip No:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
                    {order.trackingNumber} ({order.carrierName || 'Kargonomi'})
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-slate-900 font-black text-sm">
              <span>Ödenen Toplam:</span>
              <span className="text-xl text-[#ff0055]">
                ₺{order.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        )}

        {/* Sipariş Sonrası Süreç Bilgilendirmesi */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-lg block mb-1">🎨</span>
            <strong className="block text-slate-900 font-bold text-[11px]">1. Üretim</strong>
            <span className="text-[10px] text-slate-500">Özel vinil kesim ve kontrol</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-lg block mb-1">📦</span>
            <strong className="block text-slate-900 font-bold text-[11px]">2. Paketleme</strong>
            <span className="text-[10px] text-slate-500">Mukavva korumalı ambalaj</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-lg block mb-1">🚀</span>
            <strong className="block text-slate-900 font-bold text-[11px]">3. Hızlı Kargo</strong>
            <span className="text-[10px] text-slate-500">Aynı gün / ertesi gün kargoda</span>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="space-y-3 pt-1">
          {order && (
            <a
              href={`https://wa.me/905468758671?text=${generateWhatsAppMessage()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              <MessageCircle size={18} />
              <span>WhatsApp Destek & Sipariş Takibi</span>
            </a>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onViewOrders && (
              <button
                type="button"
                onClick={onViewOrders}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Package size={15} />
                <span>Siparişlerimi Görüntüle</span>
              </button>
            )}
            <button
              type="button"
              onClick={onGoHome}
              className={`w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                !onViewOrders ? 'sm:col-span-2' : ''
              }`}
            >
              <ShoppingBag size={15} />
              <span>Alışverişe Devam Et</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
