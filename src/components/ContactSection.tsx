import React, { useState } from 'react';
import { Mail, MessageCircle, MapPin, Copy, Check, ExternalLink } from 'lucide-react';

interface ContactSectionProps {
  description?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  description,
  email = 'akuzstickers@gmail.com',
  whatsapp = '+90 546 875 86 71',
  address = 'Üçevler Mahallesi, Küçük Sanayi Sitesi, 6. Blok No: 17/1 Nilüfer / Bursa',
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const cleanWhatsAppNumber = whatsapp.replace(/[^0-9]/g, '');

  return (
    <section id="iletisim" className="py-16 md:py-24 bg-white border-b border-slate-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-wide text-[#ff0055] uppercase font-display mb-3">
            İLETİŞİM
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm md:text-base font-normal max-w-lg mx-auto">
            {description || 'Sorularınız, siparişleriniz veya özel tasarım talepleriniz için bizimle iletişime geçebilirsiniz.'}
          </p>
        </div>

        {/* 3 Contact Cards */}
        <div className="space-y-4 sm:space-y-5">
          
          {/* 1. E-POSTA */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col items-center text-center transition-all hover:border-pink-200 hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-[#ff0055] mb-3 shadow-xs">
              <Mail size={24} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-[#ff0055] mb-1">
              E-POSTA
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <a
                href={`mailto:${email}`}
                className="text-slate-800 font-semibold text-sm sm:text-base hover:text-[#ff0055] transition-colors"
              >
                {email}
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(email, 'email')}
                className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-md hover:bg-slate-100 cursor-pointer"
                title="E-postayı Kopyala"
              >
                {copiedItem === 'email' ? (
                  <Check size={16} className="text-emerald-600" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            </div>
          </div>

          {/* 2. WHATSAPP (Tüm Kart Aktif & 3 Saniyede Bir Arama Titreme Efekti) */}
          <a
            href={`https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent('Merhaba, AKUZ Stickers ürünleri hakkında bilgi almak istiyorum.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-all hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-center select-none"
            title="WhatsApp Üzerinden Hemen İletişime Geç"
          >
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <MessageCircle size={26} className="animate-whatsapp-call" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1 group-hover:text-emerald-700">
                WHATSAPP
              </span>
              <p className="text-slate-800 font-bold text-base sm:text-lg group-hover:text-emerald-600 transition-colors">
                {whatsapp}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-2xs">
                <span>WhatsApp'ta Mesaj Gönder</span>
                <ExternalLink size={13} />
              </div>
            </div>
          </a>

          {/* 3. ADRES (Tüm Kart Aktif & Haritalarda Otomatik Rota Oluşturma & Simgeden Yayılan Dairesel Radar Dalgaları) */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('AKUZ Stickers, Üçevler Mahallesi, Küçük Sanayi Sitesi, 6. Blok No:17/1 Nilüfer/Bursa')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-all hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-center select-none"
            title="Google Haritalar'da AKUZ Stickers İçin Rota Oluştur"
          >
            <div className="flex flex-col items-center">
              {/* Konum simgesinden dışarı doğru yayılan dairesel radar dalgaları */}
              <div className="relative w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-xs group-hover:bg-amber-500 group-hover:text-white transition-all">
                <span className="absolute inset-0 rounded-2xl border-2 border-amber-400 pointer-events-none animate-location-ring-1" />
                <span className="absolute inset-0 rounded-2xl border-2 border-amber-400 pointer-events-none animate-location-ring-2" />
                <span className="absolute inset-0 rounded-2xl border-2 border-amber-300 pointer-events-none animate-location-ring-3" />
                <MapPin size={26} className="relative z-10" />
              </div>

              <span className="text-xs font-black uppercase tracking-widest text-amber-600 mb-1 group-hover:text-amber-700">
                ADRES & ATÖLYE
              </span>
              <p className="text-slate-800 font-semibold text-xs sm:text-sm max-w-md group-hover:text-amber-700 transition-colors">
                {address}
              </p>
              
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all shadow-2xs">
                <span>Haritada Rota Oluştur</span>
                <ExternalLink size={13} />
              </div>
            </div>
          </a>

        </div>

      </div>
    </section>
  );
};
