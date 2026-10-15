import React, { useState } from 'react';
import { Copy, Check, ExternalLink, MapPin } from 'lucide-react';

interface ContactSectionProps {
  description?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
}

// Gerçek WhatsApp Resmi Vektör Logosu
export const WhatsAppOfficialIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 26,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382C17.173 14.233 15.702 13.509 15.428 13.41C15.154 13.31 14.955 13.26 14.756 13.559C14.557 13.857 13.985 14.53 13.811 14.729C13.637 14.928 13.463 14.953 13.164 14.804C12.866 14.655 11.903 14.339 10.767 13.326C9.882 12.537 9.284 11.563 9.11 11.264C8.936 10.966 9.092 10.804 9.241 10.656C9.376 10.522 9.54 10.308 9.689 10.134C9.839 9.96 9.888 9.836 9.988 9.637C10.088 9.438 10.038 9.264 9.963 9.115C9.888 8.966 9.291 7.5 9.043 6.903C8.8 6.321 8.552 6.399 8.373 6.391C8.2 6.383 8.001 6.383 7.802 6.383C7.603 6.383 7.28 6.458 7.006 6.756C6.733 7.055 5.961 7.776 5.961 9.244C5.961 10.712 7.031 12.13 7.18 12.329C7.33 12.528 9.284 15.541 12.278 16.834C12.99 17.142 13.547 17.327 13.981 17.465C14.697 17.693 15.349 17.661 15.864 17.584C16.438 17.498 17.632 16.861 17.881 16.165C18.129 15.469 18.129 14.872 18.055 14.747C17.98 14.623 17.771 14.531 17.472 14.382ZM12.043 21.821C10.286 21.821 8.647 21.353 7.218 20.539L2.83 21.688L4.025 17.412C3.109 15.895 2.58 14.128 2.58 12.238C2.58 7.025 6.822 2.783 12.043 2.783C14.575 2.783 16.948 3.771 18.739 5.565C20.53 7.359 21.516 9.734 21.513 12.269C21.513 17.485 17.271 21.821 12.043 21.821Z" />
  </svg>
);

// 2.5 Saniyede Bir Üçgen Kapağı Yukarı Doğru Açılan Zarf Paketi Simgesi
export const CuteOpeningMailIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => (
  <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="overflow-visible"
    >
      {/* 1. Zarfın Arka Tabanı */}
      <rect x="2" y="10" width="32" height="20" rx="4" fill="#ff0055" />

      {/* 2. İçindeki Mektup Kağıdı (Üçgen kapak açıldığında tatlı şekilde yukarı süzülür) */}
      <g className="animate-envelope-letter-slide">
        {/* Beyaz Mektup Kağıdı */}
        <rect x="5" y="6" width="26" height="18" rx="2" fill="#ffffff" stroke="#fbcfe8" strokeWidth="1" />
        {/* Yazı Çizgileri */}
        <line x1="9" y1="10" x2="27" y2="10" stroke="#ff0055" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="9" y1="14" x2="22" y2="14" stroke="#fda4af" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="9" y1="18" x2="18" y2="18" stroke="#f472b6" strokeWidth="1.2" strokeLinecap="round" />
        {/* Tatlı Mini Kalp / Pul */}
        <circle cx="24.5" cy="16.5" r="1.8" fill="#ff0055" />
      </g>

      {/* 3. Zarfın Ön Cebi (Mektubu kısmen saran ön kıvrımlar) */}
      <path d="M2 30 L18 18 L34 30 Z" fill="#e6004c" />
      <path d="M2 10 L18 20 L2 30 Z" fill="#ff1a66" />
      <path d="M34 10 L18 20 L34 30 Z" fill="#ff1a66" />

      {/* 4. Üçgen Kapak (2.5 Saniyede Bir Yukarı Doğru Açılan Üçgen Kısmı) */}
      <g className="animate-envelope-triangle-flap" style={{ transformOrigin: '18px 10px' }}>
        <polygon
          points="2,10 34,10 18,22"
          fill="#ff2a73"
          stroke="#e6004c"
          strokeWidth="0.8"
        />
        <polyline
          points="2,10 18,22 34,10"
          stroke="#ff80aa"
          strokeWidth="0.8"
          fill="none"
          opacity="0.7"
        />
      </g>
    </svg>
  </div>
);

export const ContactSection: React.FC<ContactSectionProps> = ({
  description,
  email,
  whatsapp = '+90 546 875 86 71',
  address = 'Üçevler Mahallesi, Küçük Sanayi Sitesi, 6. Blok No: 17/1 Nilüfer / Bursa',
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  // Kullanıcı kesin isteği: e-posta akuzstickers@gmail.com olarak garanti altına alındı
  const targetEmail = 'akuzstickers@gmail.com';

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
          
          {/* 1. E-POSTA (2.5 Saniyede Bir Tatlı Şekilde Açılan Animasyonlu Simgeli) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col items-center text-center transition-all hover:border-pink-200 hover:shadow-md">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-[#ff0055] mb-3 shadow-xs">
              <CuteOpeningMailIcon size={32} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-[#ff0055] mb-1">
              E-POSTA
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <a
                href={`mailto:${targetEmail}`}
                className="text-slate-800 font-semibold text-sm sm:text-base hover:text-[#ff0055] transition-colors"
              >
                {targetEmail}
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(targetEmail, 'email')}
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

          {/* 2. WHATSAPP (Gerçek Resmi WhatsApp Logosu & Titreme Efekti) */}
          <a
            href={`https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent('Merhaba, AKUZ Stickers ürünleri hakkında bilgi almak istiyorum.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-all hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-center select-none relative overflow-hidden"
            title="WhatsApp Üzerinden Hemen İletişime Geç"
          >
            <div className="flex flex-col items-center">
              <div className="relative w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#25D366] mb-3 shadow-xs group-hover:bg-[#25D366] group-hover:text-white transition-all overflow-hidden">
                {/* 2.5 saniyede bir çalan ses dalgası halkaları (Dikdörtgen kutudan taşmaz) */}
                <span className="absolute inset-0 rounded-2xl border-2 border-[#25D366] pointer-events-none animate-whatsapp-wave-1" />
                <span className="absolute inset-0 rounded-2xl border-2 border-[#25D366]/70 pointer-events-none animate-whatsapp-wave-2" />
                <div className="animate-whatsapp-ring flex items-center justify-center relative z-10">
                  <WhatsAppOfficialIcon size={28} />
                </div>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-[#25D366] mb-1 group-hover:text-emerald-700">
                WHATSAPP
              </span>
              <p className="text-slate-800 font-bold text-base sm:text-lg group-hover:text-emerald-600 transition-colors">
                {whatsapp}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 group-hover:bg-[#25D366] group-hover:text-white group-hover:border-[#25D366] transition-all shadow-2xs">
                <span>WhatsApp'ta Mesaj Gönder</span>
                <ExternalLink size={13} />
              </div>
            </div>
          </a>

          {/* 3. ADRES (Kutudan Taşmayan Optimize Edilmiş Dairesel Radar Animasyonu) */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('AKUZ Stickers, Üçevler Mahallesi, Küçük Sanayi Sitesi, 6. Blok No:17/1 Nilüfer/Bursa')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs transition-all hover:border-amber-400 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer text-center select-none relative overflow-hidden"
            title="Google Haritalar'da AKUZ Stickers İçin Rota Oluştur"
          >
            <div className="flex flex-col items-center">
              {/* Konum simgesinden dışarı doğru yayılan dairesel radar dalgaları */}
              <div className="relative w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3 shadow-xs group-hover:bg-amber-500 group-hover:text-white transition-all">
                <span className="absolute inset-0 rounded-full border-2 border-amber-400 pointer-events-none animate-location-ring-1" />
                <span className="absolute inset-0 rounded-full border-2 border-amber-400/80 pointer-events-none animate-location-ring-2" />
                <span className="absolute inset-0 rounded-full border-2 border-amber-300/60 pointer-events-none animate-location-ring-3" />
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
