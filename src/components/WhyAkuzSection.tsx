import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  ShieldCheck,
  RotateCcw,
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
  Wind
} from 'lucide-react';
import { WhyAkuzCardItem } from '../types';

interface WhyAkuzSectionProps {
  cards?: WhyAkuzCardItem[];
}

export const WhyAkuzSection: React.FC<WhyAkuzSectionProps> = ({ cards }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [stickerAnimKey, setStickerAnimKey] = useState(0);

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
      { threshold: 0.18, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animKey]);

  const handleReplayAnimations = () => {
    setHasAnimated(false);
    setTimeout(() => {
      setAnimKey((prev) => prev + 1);
      setHasAnimated(true);
    }, 60);
  };

  // 3 Standart Kartın Varsayılanları
  const defaultCards: WhyAkuzCardItem[] = [
    {
      id: 'why-1',
      title: 'Hızlı Kargo & Müşteri Memnuniyeti',
      description:
        'Aynı gün kargo hizmetimiz ile birlikte saat 12.00\'den önce verilen siparişleri aynı gün kargoluyoruz. Herhangi bir sorun yaşamanız durumunda bize iletişim araçlarımızdan 7/24 ulaşabilirsiniz.',
      iconName: 'truck',
    },
    {
      id: 'why-2',
      title: 'Kaliteli ve Dayanıklı',
      description:
        'Ürünlerimiz kaliteli malzemelerden üretilmiş olup su, rüzgar ve güneş ışınlarından (UV) asla etkilenmez, sökümü kolaydır.',
      iconName: 'shield',
    },
    {
      id: 'why-3',
      title: 'Ürün Çeşitliliği',
      description:
        'Geniş ürün yelpazemiz ile aradığınız ürünü kolayca bulabilirsiniz. Kategoriler kısmından ne tür sticker istediğinizi seçmeniz yeterli.',
      iconName: 'layers',
    },
  ];

  // Gelen kartlar 3 adet değilse veya eski metinleri içeriyorsa varsayılan 3 kartı kullan
  const activeCards =
    cards && cards.length === 3 && !cards.some((c) => c.description?.includes('Alman malı') || c.title?.includes('Özel Tasarım'))
      ? cards
      : defaultCards;

  // Mini Kategori Yuvarlakları (Sayfanın üstündeki butonların minyatür hali)
  const miniCategories = [
    { id: 'all', name: 'Tümü', icon: <LayoutGrid size={15} />, bg: 'bg-slate-900 text-white' },
    { id: 'discount', name: 'İndirim', icon: <Percent size={15} />, bg: 'bg-gradient-to-tr from-rose-500 to-red-500 text-white' },
    {
      id: 'ataturk',
      name: 'Atatürk',
      icon: (
        <img
          src="/products/IMG_1278.jpeg"
          alt="Atatürk"
          className="w-full h-full object-cover rounded-full"
        />
      ),
      bg: 'bg-slate-900',
    },
    { id: 'araba', name: 'Araba', icon: <Car size={16} />, bg: 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white' },
    { id: 'motosiklet', name: 'Motor', icon: <Bike size={16} />, bg: 'bg-slate-800 text-orange-400' },
    { id: 'offroad', name: '4x4', icon: <Compass size={15} />, bg: 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white' },
    { id: 'custom', name: 'Özel', icon: <Sparkles size={15} />, bg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white' },
  ];

  // Kesintisiz akıcı kayma için iki kez tekrarla
  const marqueeItems = [...miniCategories, ...miniCategories];

  return (
    <section
      ref={sectionRef}
      key={animKey}
      className="py-16 md:py-24 bg-[#faf9f5] border-b border-slate-200/80 relative overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ÜST BAŞLIK: "NEDEN AKUZ STİCKERS?" (ı yerine i yapıldı) */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-[#ff6600]">
            PREMİUM KALİTE STANDARDI
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-2 font-display tracking-tight uppercase">
            NEDEN AKUZ STİCKERS?
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#ff6600] to-amber-500 mx-auto mt-3.5 rounded-full" />

          {/* Animasyonu Tekrar Oynatma Butonu */}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleReplayAnimations}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-[#ff6600] transition-colors py-1 px-2.5 rounded-full hover:bg-orange-50 cursor-pointer"
              title="Giriş Animasyonlarını Yeniden Oynat"
            >
              <RotateCcw size={12} />
              <span>Animasyonları Yeniden Başlat</span>
            </button>
          </div>
        </div>

        {/* 3 ÖZEL ANİMASYONLU BÖLÜM KARTI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* ========================================================================= */}
          {/* 1. BÖLÜM: HIZLI KARGO & MÜŞTERİ MEMNUNİYETİ (Kargo Aracı Yavaşça Geçer) */}
          {/* ========================================================================= */}
          <div className="relative rounded-2xl overflow-hidden min-h-[340px] flex flex-col">
            
            {/* Animasyon: Soldan Sağa Rahatça Görülecek Hızda Geçen Kargo Aracı (~2.6s) */}
            {hasAnimated && (
              <div
                className="absolute inset-y-0 w-full z-30 pointer-events-none flex items-center justify-center animate-cargo-truck"
                style={{ animationDelay: '0.05s' }}
              >
                {/* AKUZ Kargo Aracı (Büyük, Okunaklı ve Net Görünür) */}
                <div className="relative w-72 sm:w-80 drop-shadow-[0_16px_32px_rgba(0,0,0,0.4)] scale-115 sm:scale-130">
                  <svg viewBox="0 0 340 160" className="w-full h-auto" fill="none">
                    {/* Hız Rüzgar Çizgileri */}
                    <path d="M5 45 H55" stroke="#ff6600" strokeWidth="4" strokeLinecap="round" opacity="0.85" />
                    <path d="M-15 75 H50" stroke="#f97316" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
                    <path d="M0 105 H60" stroke="#ff6600" strokeWidth="4" strokeLinecap="round" opacity="0.85" />

                    {/* Kargo Kasa Gövdesi (Siyah & Turuncu) */}
                    <rect x="70" y="24" width="170" height="96" rx="8" fill="#1e293b" />
                    <rect x="70" y="24" width="170" height="26" rx="4" fill="#ff6600" />
                    
                    {/* Kasa Üzerinde AKUZ Logo & Kargo Yazısı */}
                    <text x="155" y="42" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5">
                      AKUZ EXPRESS
                    </text>
                    <text x="155" y="78" textAnchor="middle" fill="#f8fafc" fontSize="17" fontWeight="900" fontFamily="sans-serif">
                      AYNI GÜN KARGO
                    </text>
                    <text x="155" y="100" textAnchor="middle" fill="#fb923c" fontSize="11" fontWeight="700" fontFamily="sans-serif">
                      ⚡ 12:00 Öncesi Siparişler
                    </text>

                    {/* Şoför Kabini (Ön Burun) */}
                    <path d="M240 50 L285 68 L300 95 L300 120 L240 120 Z" fill="#ff6600" />
                    {/* Ön Cam */}
                    <path d="M246 58 L280 72 L280 95 L246 95 Z" fill="#93c5fd" opacity="0.85" />
                    {/* Ön Tampon & Izgara */}
                    <rect x="295" y="98" width="14" height="20" rx="3" fill="#0f172a" />
                    {/* Ön Far Işığı (Sarı Işık Huzmesi) */}
                    <path d="M300 96 L338 85 L340 115 L300 106 Z" fill="#fef08a" opacity="0.55" />

                    {/* Tekerlek 1 (Arka) */}
                    <circle cx="120" cy="122" r="23" fill="#0f172a" />
                    <circle cx="120" cy="122" r="14" fill="#475569" className="animate-wheel-spin" style={{ transformOrigin: '120px 122px' }} />
                    <circle cx="120" cy="122" r="6" fill="#cbd5e1" />

                    {/* Tekerlek 2 (Ön) */}
                    <circle cx="260" cy="122" r="23" fill="#0f172a" />
                    <circle cx="260" cy="122" r="14" fill="#475569" className="animate-wheel-spin" style={{ transformOrigin: '260px 122px' }} />
                    <circle cx="260" cy="122" r="6" fill="#cbd5e1" />
                  </svg>
                </div>
              </div>
            )}

            {/* Kargo Aracının İçinden Çıkan / Beliren Kart */}
            <div
              className={`flex-1 p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 border-2 border-emerald-200/90 shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-emerald-400 group relative z-10 ${
                hasAnimated ? 'animate-cargo-reveal' : 'opacity-0'
              }`}
              style={{ animationDelay: '0.15s' }}
            >
              {/* Üst İkon & Hızlı Rozet */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                    <Truck size={26} strokeWidth={2.4} />
                  </div>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100/90 text-emerald-800 text-[11px] font-extrabold rounded-full border border-emerald-200 shadow-2xs">
                    <Clock size={12} className="text-emerald-700" />
                    <span>Hızlı Gönderim</span>
                  </span>
                </div>

                <h3 className="font-black text-lg sm:text-xl text-slate-900 mb-3 tracking-tight font-display">
                  {activeCards[0].title}
                </h3>

                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-normal">
                  {activeCards[0].description}
                </p>
              </div>

              {/* Alt Bilgi İpuçları */}
              <div className="pt-5 mt-5 border-t border-emerald-100 flex items-center gap-2 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Saat 12:00 öncesi siparişler aynı gün kargoda</span>
              </div>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* 2. BÖLÜM: KALİTELİ VE DAYANIKLI (ETİKET / STICKER YAPIŞTIRMA ANİMASYONU) */}
          {/* ========================================================================= */}
          <div
            className="relative rounded-3xl min-h-[340px] flex flex-col p-1 bg-slate-100/70 border border-slate-200/70 shadow-inner overflow-hidden cursor-pointer group/sticker"
            onClick={() => setStickerAnimKey((k) => k + 1)}
            title="Etiketi Tekrar Yapıştırmak İçin Tıklayın"
          >
            {/* Yapışma Yüzeyi İpucu (Mat Yüzey / Araç Camı & Kaporta Dokusu) */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-50 pointer-events-none" />

            {/* DİKDÖRTGENİN KENDİSİ BİR STİCKER'DIR VE SOL ALTTAN SAĞ ÜSTE DOĞRU YAVAŞÇA YAPIŞIR */}
            <div
              key={stickerAnimKey}
              className={`w-full flex-1 p-6 sm:p-7 rounded-2xl bg-white border-[5px] border-white shadow-2xl flex flex-col justify-between relative overflow-hidden group select-none ring-1 ring-slate-200/90 ${
                hasAnimated ? 'animate-sticker-adhere' : 'opacity-0'
              }`}
              style={{
                animationDelay: '0.15s',
                background: 'linear-gradient(135deg, #ffffff 0%, #fffbf2 55%, #fff7ed 100%)',
              }}
            >
              {/* ================================================================ */}
              {/* 1. GERÇEKÇİ ETİKET YAPIŞTIRMA ANİMASYONU KATMANI (OVERLAY SCENE) */}
              {/* ================================================================ */}
              {hasAnimated && (
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                  
                  {/* A) Şeffaf Taşıyıcı Transfer Bandının Sıyrılarak Ayrılması (Transfer Tape Peel) */}
                  <div
                    className="absolute inset-0 bg-white/25 border-2 border-dashed border-orange-300/40 animate-transfer-peel"
                    style={{
                      backgroundImage: 'radial-gradient(rgba(249, 115, 22, 0.15) 1px, transparent 1px)',
                      backgroundSize: '14px 14px',
                      animationDelay: '0.2s',
                    }}
                  />

                  {/* B) Basınç & Hava Kabarcığı Giderme Dalgası (Sol Alttan Sağ Üste) */}
                  <div
                    className="absolute inset-0 animate-squeegee-sweep bg-gradient-to-tr from-transparent via-orange-400/30 to-transparent w-[150%] h-[150%]"
                    style={{ animationDelay: '0.2s' }}
                  />

                  {/* C) AKUZ Profesyonel Keçeli Sticker Uygulama Raglesi (Squeegee Tool) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center animate-squeegee-tool pointer-events-none"
                    style={{ animationDelay: '0.1s' }}
                  >
                    <div className="w-56 sm:w-64 drop-shadow-[0_20px_25px_rgba(0,0,0,0.45)]">
                      <svg viewBox="0 0 240 120" className="w-full h-auto" fill="none">
                        <defs>
                          <linearGradient id="ragleBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ff781f" />
                            <stop offset="50%" stopColor="#ff5500" />
                            <stop offset="100%" stopColor="#d84300" />
                          </linearGradient>
                          <linearGradient id="ragleFeltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#0f172a" />
                          </linearGradient>
                          <linearGradient id="ragleShine" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Ragle Gövdesi (Ergonomik Tutamaklı Plastik Gövde) */}
                        <rect x="25" y="20" width="190" height="65" rx="14" fill="url(#ragleBodyGrad)" stroke="#ea580c" strokeWidth="2" />
                        <rect x="30" y="24" width="180" height="20" rx="8" fill="url(#ragleShine)" />

                        {/* Tutuş Tırtıkları */}
                        <line x1="50" y1="42" x2="190" y2="42" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                        <line x1="65" y1="50" x2="175" y2="50" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

                        {/* Ragle Üzeri AKUZ Logo ve Yazı */}
                        <text x="120" y="65" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.2">
                          AKUZ PROFESYONEL RAGLE
                        </text>

                        {/* Keçe Koruma Ucu (Siyah Yumuşak Yüzey - Çizilme Önleyici) */}
                        <rect x="22" y="84" width="196" height="18" rx="4" fill="url(#ragleFeltGrad)" stroke="#020617" strokeWidth="1.5" />
                        <line x1="25" y1="87" x2="215" y2="87" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />

                        {/* Yapıştırma Basınç Okları / Işık Noktası */}
                        <circle cx="120" cy="104" r="3" fill="#ffedd5" />
                        <path d="M110 108 L120 114 L130 108" stroke="#ffedd5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  {/* D) Yapışma Tamamlanınca Üzerinden Geçen Parlaklık Flare (Gloss Shine) */}
                  <div
                    className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-gloss-flare pointer-events-none"
                    style={{ animationDelay: '0.4s' }}
                  />

                  {/* E) Yapışma Başarılı Işıltıları (Seal Sparkles) */}
                  <div
                    className="absolute top-4 right-4 animate-seal-sparkle text-amber-500"
                    style={{ animationDelay: '0.5s' }}
                  >
                    <Sparkles size={24} className="fill-amber-400 text-amber-500 drop-shadow-md" />
                  </div>
                  <div
                    className="absolute bottom-6 left-8 animate-seal-sparkle text-[#ff6600]"
                    style={{ animationDelay: '0.7s' }}
                  >
                    <Sparkles size={18} className="fill-orange-400 text-orange-500 drop-shadow-md" />
                  </div>
                </div>
              )}

              {/* Vinil Parlaklık Çizgisi (Hover durumunda da ışık akar) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent pointer-events-none -rotate-12 translate-x-[-100%] group-hover/sticker:translate-x-[150%] transition-transform duration-1000" />

              {/* Stickerın Sağ Üst Kıvrık Köşesi (Yapışmadan Önce Havada Kalkan Uç) */}
              <div className="absolute top-0 right-0 w-9 h-9 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-14 h-14 bg-gradient-to-bl from-slate-200 via-slate-100 to-white shadow-md rotate-45 transform origin-top-right border-b border-l border-slate-300/80" />
              </div>

              <div>
                {/* Üst İkon & Damga */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#ff6600] to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/25 group-hover/sticker:scale-105 transition-transform">
                    <ShieldCheck size={28} strokeWidth={2.4} />
                  </div>

                  {/* Kalite Vinil Mührü & Tekrar Yapıştır Butonu */}
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-[#ff6600] text-[11px] font-black rounded-full border border-orange-200 uppercase tracking-wider shadow-2xs">
                      <Sparkles size={12} className="text-[#ff6600]" />
                      <span>Vinil Folyo</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setStickerAnimKey((k) => k + 1);
                      }}
                      className="p-1 rounded-full text-slate-400 hover:text-[#ff6600] hover:bg-orange-50 transition-colors cursor-pointer"
                      title="Etiket Yapıştırma Animasyonunu Tekrar Oynat"
                    >
                      <RotateCcw size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="font-black text-lg sm:text-xl text-slate-900 mb-3 tracking-tight font-display flex items-center justify-between">
                  <span>{activeCards[1].title}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                    Tam Yapıştı ✓
                  </span>
                </h3>

                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-normal">
                  {activeCards[1].description}
                </p>
              </div>

              {/* Dayanıklılık Rozetleri (Su, UV, Rüzgar) */}
              <div className="pt-4 mt-5 border-t border-orange-100/90 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-sky-800 text-[10px] font-bold rounded-lg border border-sky-100 shadow-2xs">
                  <Droplets size={12} className="text-sky-600" />
                  <span>Su Geçirmez</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-100 shadow-2xs">
                  <Sun size={12} className="text-amber-600" />
                  <span>UV Dirençli</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 shadow-2xs">
                  <Wind size={12} className="text-slate-500" />
                  <span>Kolay Söküm</span>
                </span>
              </div>
            </div>
          </div>


          {/* ========================================================================= */}
          {/* 3. BÖLÜM: ÜRÜN ÇEŞİTLİLİĞİ (Yuvarlak Tuşlar Soldan Sağa Akıcı Şekilde Geçer) */}
          {/* ========================================================================= */}
          <div className="relative rounded-2xl overflow-hidden min-h-[340px] flex flex-col">
            <div
              className={`flex-1 p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 border-2 border-indigo-200/90 shadow-lg flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-indigo-400 group relative z-10 ${
                hasAnimated ? 'animate-product-page-enter' : 'opacity-0'
              }`}
              style={{ animationDelay: '0.4s' }}
            >
              <div>
                {/* ÜST VİTRİN ALANI: Sayfanın Üstündeki Yuvarlak Butonlar Soldan Sağa Akıcı Şekilde Geçer */}
                <div className="mb-5 overflow-hidden rounded-2xl bg-slate-900/5 p-2.5 border border-indigo-100/90 relative">
                  {/* Yumuşak Sol ve Sağ Kenar Gölgeleri */}
                  <div className="absolute left-0 inset-y-0 w-6 bg-gradient-to-r from-slate-100/90 to-transparent z-10 pointer-events-none" />
                  <div className="absolute right-0 inset-y-0 w-6 bg-gradient-to-l from-slate-100/90 to-transparent z-10 pointer-events-none" />

                  {/* Soldan Sağa Doğru Orta Hızda Akan Kategori Yuvarlakları */}
                  <div className="flex items-center gap-3 w-max animate-category-glider py-1">
                    {marqueeItems.map((item, i) => (
                      <div
                        key={`${item.id}-${i}`}
                        className="flex flex-col items-center gap-1 shrink-0 select-none group/item"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs overflow-hidden transition-transform duration-200 hover:scale-110 ${item.bg}`}
                        >
                          {item.icon}
                        </div>
                        <span className="text-[9px] font-bold text-slate-600 truncate max-w-[48px]">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="font-black text-lg sm:text-xl text-slate-900 mb-3 tracking-tight font-display">
                  {activeCards[2].title}
                </h3>

                <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-normal">
                  {activeCards[2].description}
                </p>
              </div>

              {/* Alt Kategori Seçim İpucu */}
              <div className="pt-4 mt-5 border-t border-indigo-100 flex items-center justify-between text-[11px] font-bold text-indigo-700">
                <span>Araba, Motor, 4x4 & Kişiye Özel</span>
                <span className="text-[#ff6600]">Tüm Kategoriler →</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
