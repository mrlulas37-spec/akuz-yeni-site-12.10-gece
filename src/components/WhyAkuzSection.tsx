import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  Percent,
  Car,
  Bike,
  Compass,
  Clock,
  CheckCircle2,
  Droplets,
  Sun,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { WhyAkuzCardItem, CategoryCircleItem } from '../types';
import { ThreeDDiscountCoin } from './ThreeDDiscountCoin';

interface WhyAkuzSectionProps {
  cards?: WhyAkuzCardItem[];
  categoriesConfig?: CategoryCircleItem[];
  onNavigateToCatalog?: () => void;
}

// Ayna Stickerları için minyatür Yan Ayna Simgesi
const MirrorIcon = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="11" rx="8" ry="5.5" />
    <path d="M8 9l4 4" />
    <path d="M12 7l4 4" />
    <path d="M10 16.5l-2.5 3.5h9l-2.5-3.5" />
  </svg>
);

export const WhyAkuzSection: React.FC<WhyAkuzSectionProps> = ({
  cards,
  categoriesConfig,
  onNavigateToCatalog,
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // IntersectionObserver: Müşteri sayfayı aşağı kaydırıp bu bölüme geldiğinde tetiklenir
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setHasAnimated(true);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3 Standart Kartın Varsayılanları
  const defaultCards: WhyAkuzCardItem[] = [
    {
      id: 'why-1',
      title: 'Hızlı Kargo & Müşteri Memnuniyeti',
      description:
        'Aynı gün kargo hizmetimiz ile saat 12.00\'den önce verilen siparişleri aynı gün kargoluyoruz. 7/24 iletişim araçlarımızdan bize ulaşabilirsiniz.',
      iconName: 'truck',
    },
    {
      id: 'why-2',
      title: 'Kaliteli ve Dayanıklı',
      description:
        'Ürünlerimiz kaliteli malzemelerden üretilmiş olup su, rüzgar ve güneş ışınlarından (UV) asla etkilenmez, uygulaması kolaydır.',
      iconName: 'shield',
    },
    {
      id: 'why-3',
      title: 'Ürün Çeşitliliği',
      description:
        'Geniş ürün yelpazemiz ile aradığınız tasarımı kolayca bulabilirsiniz. Kategorilerden dilediğiniz sticker türünü seçebilirsiniz.',
      iconName: 'layers',
    },
  ];

  // Gelen kartlar 3 adet değilse veya eski metinleri içeriyorsa varsayılan 3 kartı kullan
  const activeCards =
    cards && cards.length === 3 && !cards.some((c) => c.description?.includes('Alman malı') || c.title?.includes('Özel Tasarım'))
      ? cards
      : defaultCards;

  // Açıklamalarda eski "sökümü kolaydır" kalmışsa "uygulaması kolaydır" ile güncelle
  const sanitizeDesc = (desc: string) => {
    return desc.replace(/sökümü kolaydır/gi, 'uygulaması kolaydır');
  };

  // Mini Kategori Yuvarlakları - Yuvarlak buton fotoğrafları güncellendiğinde burası da otomatik güncellenir
  const defaultMiniCategories = [
    { id: 'all', name: 'Tümü', icon: <LayoutGrid size={13} />, bg: 'bg-slate-900 text-white' },
    {
      id: 'discount',
      name: 'İndirim',
      icon: <ThreeDDiscountCoin size={22} />,
      bg: 'bg-[radial-gradient(circle_at_center,_#2b0d14_0%,_#140508_55%,_#050204_100%)] text-white',
    },
    {
      id: 'ataturk',
      name: 'Atatürk',
      icon: (
        <img
          src="/uploads/prod_1792267264910_d3639f.jpg"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/products/IMG_1140.jpeg';
          }}
          alt="Atatürk"
          className="w-full h-full object-cover rounded-full"
        />
      ),
      bg: 'bg-slate-950',
    },
    { id: 'araba', name: 'Araba', icon: <Car size={14} />, bg: 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white' },
    { id: 'motosiklet', name: 'Motor', icon: <Bike size={14} />, bg: 'bg-slate-800 text-orange-400' },
    { id: 'custom', name: 'Özel', icon: <Sparkles size={13} />, bg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white' },
    { id: 'offroad', name: '4x4', icon: <Compass size={13} />, bg: 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white' },
    { id: 'ayna', name: 'Ayna', icon: <MirrorIcon size={14} />, bg: 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white' },
  ];

  const miniCategories = React.useMemo(() => {
    return defaultMiniCategories.map((item) => {
      const liveCat = categoriesConfig?.find((c) => c.id === item.id);
      const customImg =
        liveCat?.imageUrl || (item.id === 'ataturk' && !liveCat?.imageUrl ? '/uploads/prod_1792267264910_d3639f.jpg' : undefined);

      let icon = item.icon;
      if (item.id === 'discount') {
        icon = liveCat?.imageUrl ? (
          <img
            src={liveCat.imageUrl}
            alt={liveCat.titleLine1 || item.name}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <ThreeDDiscountCoin size={22} />
        );
      } else if (customImg) {
        icon = (
          <img
            src={customImg}
            alt={liveCat?.titleLine1 || item.name}
            className="w-full h-full object-cover rounded-full"
          />
        );
      }

      return {
        ...item,
        name: liveCat?.titleLine1 || item.name,
        icon,
        bg: liveCat?.bgGradient || item.bg,
      };
    });
  }, [categoriesConfig]);

  const marqueeItems = [...miniCategories, ...miniCategories];

  const handleGoToCatalog = () => {
    if (onNavigateToCatalog) {
      onNavigateToCatalog();
    } else {
      window.location.pathname = '/katalog';
    }
  };

  return (
    <section
      ref={sectionRef}
      className="py-8 sm:py-10 md:py-12 bg-[#faf9f5] border-b border-slate-200/80 relative overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ÜST BAŞLIK: "NEDEN AKUZ STİCKERS?" */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#ff6600]">
            PREMİUM KALİTE STANDARDI
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 mt-1 font-display tracking-tight uppercase">
            NEDEN AKUZ STİCKERS?
          </h2>
          <div className="w-12 h-1 bg-gradient-to-r from-[#ff6600] to-amber-500 mx-auto mt-2.5 rounded-full" />
        </div>

        {/* 3 KOMPAKT DİKDÖRTGEN KART */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 items-stretch">
          
          {/* ========================================================================= */}
          {/* 1. BÖLÜM: HIZLI KARGO & MÜŞTERİ MEMNUNİYETİ (MİNİ YOL & ARABA DÖNGÜSÜ)     */}
          {/* ========================================================================= */}
          <div className="relative rounded-2xl overflow-hidden flex flex-col">
            <div className="flex-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 border border-emerald-200/90 shadow-sm hover:shadow-md transition-all duration-300 hover:border-emerald-300 flex flex-col justify-between relative z-10">
              <div>
                {/* Üst İkon & Hızlı Rozet */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
                    <Truck size={20} strokeWidth={2.4} />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100/90 text-emerald-800 text-[10px] font-extrabold rounded-full border border-emerald-200 shadow-2xs">
                    <Clock size={11} className="text-emerald-700" />
                    <span>Hızlı Gönderim</span>
                  </span>
                </div>

                {/* Sadece Yolun Şerit Çizgisi ve Üstünden Düz Geçen Kargo Arabası (Zıplama Yok) */}
                <div className="mb-2 relative w-full h-8 overflow-hidden select-none pointer-events-none flex items-end">
                  {/* Yolun Kesik Şerit Çizgisi */}
                  <div className="absolute inset-x-0 bottom-0.5 border-b-2 border-dashed border-slate-300 w-full" />

                  {/* Şerit Üstünden Düz ve Akıcı Geçip Giden AKUZ Kargo Arabası (Zıplamasız) */}
                  <div
                    className="absolute bottom-0.5 z-20 animate-cargo-road-loop"
                    style={{ width: '64px', height: '27px' }}
                  >
                    <svg viewBox="0 0 100 42" className="w-full h-full drop-shadow-xs" fill="none">
                      <defs>
                        <linearGradient id="whyTruckBoxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#1e293b" />
                          <stop offset="100%" stopColor="#334155" />
                        </linearGradient>
                        <linearGradient id="whyTruckCabGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ea580c" />
                          <stop offset="100%" stopColor="#ff6600" />
                        </linearGradient>
                      </defs>

                      {/* Kargo Kasası */}
                      <rect x="14" y="6" width="50" height="26" rx="2.5" fill="url(#whyTruckBoxGrad)" />
                      <rect x="14" y="6" width="50" height="6.5" rx="1.5" fill="#ff6600" />
                      <text x="39" y="11.2" textAnchor="middle" fill="#ffffff" fontSize="4.8" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.6">
                        AKUZ
                      </text>
                      <text x="39" y="22" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900" fontFamily="sans-serif">
                        EXPRESS
                      </text>

                      {/* Şoför Kabini */}
                      <path d="M64 12 L77 16 L84 23 L84 32 L64 32 Z" fill="url(#whyTruckCabGrad)" />
                      <path d="M66 15 L75 18 L75 24 L66 24 Z" fill="#93c5fd" opacity="0.9" />

                      {/* Ön Tampon & Far */}
                      <rect x="83" y="26" width="3" height="5" rx="1" fill="#0f172a" />
                      <circle cx="83.5" cy="25" r="1.5" fill="#fef08a" />
                      <rect x="13.5" y="24" width="1.2" height="4" fill="#ef4444" rx="0.5" />

                      {/* Tekerlek Yuvaları */}
                      <path d="M22 32 A5 5 0 0 1 32 32 Z" fill="#ffffff" />
                      <path d="M67 32 A5 5 0 0 1 77 32 Z" fill="#ffffff" />

                      {/* Arka Tekerlek (Zıplamasız, düz yolda döner) */}
                      <circle cx="27" cy="32" r="6.5" fill="#0f172a" />
                      <circle cx="27" cy="32" r="3.8" fill="#64748b" className="animate-wheel-spin" style={{ transformOrigin: '27px 32px' }} />
                      <circle cx="27" cy="32" r="1.5" fill="#e2e8f0" />

                      {/* Ön Tekerlek (Zıplamasız, düz yolda döner) */}
                      <circle cx="72" cy="32" r="6.5" fill="#0f172a" />
                      <circle cx="72" cy="32" r="3.8" fill="#64748b" className="animate-wheel-spin" style={{ transformOrigin: '72px 32px' }} />
                      <circle cx="72" cy="32" r="1.5" fill="#e2e8f0" />
                    </svg>
                  </div>
                </div>

                <h3 className="font-black text-base sm:text-lg text-slate-900 mb-1.5 tracking-tight font-display">
                  {activeCards[0].title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed font-normal">
                  {sanitizeDesc(activeCards[0].description)}
                </p>
              </div>

              {/* Alt Bilgi İpuçları */}
              <div className="pt-2.5 mt-2.5 border-t border-emerald-100 flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-800">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>Saat 12:00 öncesi siparişler aynı gün kargoda</span>
              </div>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* 2. BÖLÜM: KALİTELİ VE DAYANIKLI                                            */}
          {/* ========================================================================= */}
          <div className="relative rounded-2xl overflow-hidden flex flex-col">
            <div className="flex-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-orange-50/60 via-white to-amber-50/40 border border-orange-200/90 shadow-sm hover:shadow-md transition-all duration-300 hover:border-orange-300 flex flex-col justify-between relative z-10">
              <div>
                {/* Üst İkon & Damga */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff6600] to-amber-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/20">
                    <ShieldCheck size={22} strokeWidth={2.4} />
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-orange-100 text-[#ff6600] text-[10px] font-black rounded-full border border-orange-200 uppercase tracking-wider shadow-2xs">
                    <Sparkles size={11} className="text-[#ff6600]" />
                    <span>Vinil Folyo</span>
                  </span>
                </div>

                <h3 className="font-black text-base sm:text-lg text-slate-900 mb-1.5 tracking-tight font-display">
                  {activeCards[1].title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed font-normal">
                  {sanitizeDesc(activeCards[1].description)}
                </p>
              </div>

              {/* Dayanıklılık Rozetleri (Su, UV, Kolay Uygulama) */}
              <div className="pt-2.5 mt-2.5 border-t border-orange-100/90 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-800 text-[10px] font-bold rounded-md border border-sky-100 shadow-2xs">
                  <Droplets size={11} className="text-sky-600" />
                  <span>Su Geçirmez</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-md border border-amber-100 shadow-2xs">
                  <Sun size={11} className="text-amber-600" />
                  <span>UV Dirençli</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-md border border-emerald-100 shadow-2xs">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  <span>Kolay Uygulama</span>
                </span>
              </div>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* 3. BÖLÜM: ÜRÜN ÇEŞİTLİLİĞİ (AKICI KATEGORİLER & SAĞ ALTA KATALOG BUTONU)    */}
          {/* ========================================================================= */}
          <div className="relative rounded-2xl overflow-hidden flex flex-col">
            <div className="flex-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 border border-indigo-200/90 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-300 flex flex-col justify-between relative z-10">
              <div>
                {/* Üst Vitrin Alanı: Kategori Yuvarlakları */}
                <div className="mb-3 overflow-hidden rounded-xl bg-slate-900/5 p-1.5 border border-indigo-100/90 relative">
                  <div className="absolute left-0 inset-y-0 w-4 bg-gradient-to-r from-slate-100/90 to-transparent z-10 pointer-events-none" />
                  <div className="absolute right-0 inset-y-0 w-4 bg-gradient-to-l from-slate-100/90 to-transparent z-10 pointer-events-none" />

                  <div className="flex items-center gap-2.5 w-max animate-category-glider py-0.5">
                    {marqueeItems.map((item, i) => (
                      <div
                        key={`${item.id}-${i}`}
                        className="flex flex-col items-center gap-0.5 shrink-0 select-none"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shadow-2xs overflow-hidden ${item.bg}`}
                        >
                          {item.icon}
                        </div>
                        <span className="text-[8px] font-bold text-slate-600 truncate max-w-[42px]">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="font-black text-base sm:text-lg text-slate-900 mb-1.5 tracking-tight font-display">
                  {activeCards[2].title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-[13px] leading-relaxed font-normal">
                  {sanitizeDesc(activeCards[2].description)}
                </p>
              </div>

              {/* SAĞ ALTA KATALOG SİMGESİ VE BUTONU (Tıklanınca doğrudan katalog sayfasına gider) */}
              <div className="pt-2.5 mt-2.5 border-t border-indigo-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleGoToCatalog}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white font-extrabold text-[11px] shadow-sm hover:from-indigo-500 hover:to-purple-500 hover:scale-105 active:scale-95 transition-all cursor-pointer group/catBtn"
                  title="Katalog Sayfasına Git"
                >
                  <BookOpen size={12} className="text-indigo-200 group-hover/catBtn:text-white transition-colors" />
                  <span>Katalog</span>
                  <ArrowRight size={12} className="text-indigo-200 group-hover/catBtn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
