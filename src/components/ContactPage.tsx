import React, { useState } from 'react';
import { MapPin, Copy, Check, ExternalLink, ArrowLeft, Clock, Send } from 'lucide-react';
import { AkuzLogo } from './AkuzLogo';
import { CuteOpeningMailIcon, WhatsAppOfficialIcon } from './ContactSection';

interface ContactPageProps {
  onGoHome: () => void;
  email?: string;
  whatsapp?: string;
  address?: string;
}

export const ContactPage: React.FC<ContactPageProps> = ({
  onGoHome,
  email = 'akuzstickers@gmail.com',
  whatsapp = '+90 546 875 86 71',
  address = 'Üçevler Mahallesi, Küçük Sanayi Sitesi, 6. Blok No: 17/1 Nilüfer / Bursa',
}) => {
  const targetEmail = 'akuzstickers@gmail.com';
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [formSent, setFormSent] = useState(false);
  const [name, setName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [message, setMessage] = useState('');

  const cleanWhatsAppNumber = whatsapp.replace(/[^0-9]/g, '');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
    setTimeout(() => {
      setName('');
      setEmailInput('');
      setMessage('');
    }, 500);
  };

  return (
    <div className="bg-[#fcfbf9] min-h-[80vh] py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#ff0055] transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft size={18} />
            Ana Sayfaya Dön
          </button>

          <span className="text-xs text-slate-400 font-medium">/iletisim</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-xl space-y-10">
          
          {/* Header */}
          <div className="text-center max-w-xl mx-auto">
            <div className="flex justify-center mb-4">
              <AkuzLogo size={60} />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-wide text-[#ff0055] uppercase font-display mb-3">
              İLETİŞİM
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-normal">
              Sorularınız, sipariş takibi veya özel tasarım sticker talepleriniz için bize hemen ulaşın.
            </p>
          </div>

          {/* Contact Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            
            {/* 1. E-POSTA */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:border-pink-300 hover:shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-pink-100/70 border border-pink-200 flex items-center justify-center text-[#ff0055] mb-3 shadow-xs">
                <CuteOpeningMailIcon size={30} />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-[#ff0055] mb-1">
                E-POSTA
              </span>
              <span className="text-xs text-slate-500 mb-2">Resmi Destek & Fatura</span>
              <a
                href={`mailto:${targetEmail}`}
                className="text-slate-900 font-bold text-sm sm:text-base hover:text-[#ff0055] transition-colors break-all"
              >
                {targetEmail}
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(targetEmail, 'email')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {copiedItem === 'email' ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span className="text-emerald-600">Kopyalandı</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Adresi Kopyala</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. WHATSAPP */}
            <a
              href={`https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent('Merhaba, AKUZ Stickers ürünleri hakkında bilgi almak istiyorum.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-slate-50/60 border border-slate-200 rounded-2xl p-6 text-center transition-all hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer select-none"
              title="WhatsApp ile Hemen Mesaj Gönder"
            >
              <div className="flex flex-col items-center">
                <div className="relative w-14 h-14 rounded-2xl bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-[#25D366] mb-3 group-hover:bg-[#25D366] group-hover:text-white transition-all shadow-xs">
                  <div className="animate-whatsapp-call flex items-center justify-center">
                    <WhatsAppOfficialIcon size={28} />
                  </div>
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-[#25D366] mb-1">
                  WHATSAPP
                </span>
                <span className="text-xs text-slate-500 mb-2">Hızlı Mesaj & Tasarım Danışma</span>
                <span className="text-slate-900 font-bold text-base group-hover:text-emerald-600 transition-colors">
                  {whatsapp}
                </span>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] rounded-lg transition-colors cursor-pointer shadow-xs">
                  <ExternalLink size={13} />
                  <span>Mesaj Gönder</span>
                </div>
              </div>
            </a>

            {/* 3. ADRES */}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('AKUZ Stickers, Üçevler Mahallesi, Küçük Sanayi Sitesi, 6. Blok No:17/1 Nilüfer/Bursa')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-slate-50/60 border border-slate-200 rounded-2xl p-6 text-center transition-all hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer select-none overflow-hidden relative"
              title="Google Haritalar'da AKUZ Stickers İçin Rota Oluştur"
            >
              <div className="flex flex-col items-center">
                <div className="relative w-14 h-14 rounded-2xl bg-amber-100/70 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-xs">
                  <span className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none animate-location-ring-1" />
                  <span className="absolute inset-0 rounded-full border-2 border-amber-400/80 pointer-events-none animate-location-ring-2" />
                  <span className="absolute inset-0 rounded-full border-2 border-amber-300/60 pointer-events-none animate-location-ring-3" />
                  <MapPin size={26} className="relative z-10" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 mb-1">
                  KONUM / ATÖLYE
                </span>
                <span className="text-xs text-slate-500 mb-2">Tasarım & Sevkiyat Merkezi</span>
                <span className="text-slate-800 font-semibold text-xs sm:text-sm group-hover:text-amber-700 transition-colors">
                  {address}
                </span>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer shadow-xs">
                  <ExternalLink size={13} />
                  <span>Haritada Rota Oluştur</span>
                </div>
              </div>
            </a>

          </div>

          {/* Quick Message Form */}
          <div className="border-t border-slate-100 pt-8 max-w-xl mx-auto">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 text-center mb-1">
              Bize Hızlı Mesaj Bırakın
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              Özel ebat, renk veya toptan sipariş talepleriniz için formu doldurabilirsiniz.
            </p>

            {formSent ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-sm font-semibold animate-fadeIn">
                ✓ Mesajınız iletildi! En kısa sürede sizinle iletişime geçeceğiz.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adınız Soyadınız</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-Posta Adresiniz</label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="ornek@gmail.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mesajınız</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Sticker ölçüsü, araç modeli veya sorunuz..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#ff0055] hover:bg-[#d90048] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <Send size={15} />
                  <span>Mesajı Gönder</span>
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
