import React from 'react';
import { BookOpen, BadgePercent, PenTool, Car, Bike, Sparkles, Compass } from 'lucide-react';
import { Product, CategoryCircleItem } from '../types';

interface CategoryBarProps {
  selectedCategory: Product['category'] | 'all';
  onSelectCategory: (category: Product['category'] | 'all') => void;
  categoriesConfig?: CategoryCircleItem[];
}

// 1. Katalog / Tüm Ürünler için Özel Katalog Simgesi (Sade ve Temiz Açık Kitapçık)
export const CatalogIcon = ({ size = 32 }: { size?: number }) => (
  <div className="flex items-center justify-center text-white">
    <BookOpen size={size} strokeWidth={2.3} className="drop-shadow-md text-white" />
  </div>
);

// 2. İndirimli Fırsatlar için Özel İndirim Simgesi (Belirgin ve Büyütülmüş % Rozeti)
export const DiscountIcon = ({ size = 42 }: { size?: number }) => (
  <div className="relative flex items-center justify-center text-white">
    <BadgePercent size={size} strokeWidth={2.3} className="drop-shadow-md text-white" />
  </div>
);

// 3. Kişiye Özel Stickerlar için Özel Kişiselleştirme & Yavaş Kaligrafik El Yazısı Animasyonu (Kişiye / Özel)
export const CustomPersonalizedIcon = ({ size = 24 }: { size?: number }) => (
  <div className="relative flex flex-col items-center justify-center text-white w-full h-full select-none pt-0.5 px-0.5">
    {/* Kalem Simgesi: Kullanıcı İsteği: Hiç kıpırdamaz, titreşmez, hafif aşağıda konumlu, lüks altın rengi */}
    <div className="translate-y-0.5 pointer-events-none flex items-center justify-center">
      <PenTool size={size} strokeWidth={2.4} className="text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
    </div>
    {/* Altında el ile yazılır gibi yavaşça sırayla yazılan 2 satırlı el yazısı: 1. Satır: Kişiye, 2. Satır: Özel */}
    <div className="flex flex-col items-center justify-center leading-tight mt-0.5 pointer-events-none w-full">
      <div className="relative overflow-visible animate-write-line-1 flex justify-center w-full">
        <span
          style={{ fontFamily: "'Dancing Script', 'Caveat', 'Great Vibes', cursive" }}
          className="text-[12.5px] sm:text-[14px] font-extrabold text-white tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] whitespace-nowrap block"
        >
          Kişiye
        </span>
      </div>
      <div className="relative overflow-visible animate-write-line-2 -mt-1 flex justify-center w-full">
        <span
          style={{ fontFamily: "'Dancing Script', 'Caveat', 'Great Vibes', cursive" }}
          className="text-[12.5px] sm:text-[14px] font-extrabold text-amber-200 tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] whitespace-nowrap block"
        >
          Özel
        </span>
      </div>
    </div>
  </div>
);

// Ayna Stickerları için özel Yan Ayna Simgesi
export const MirrorIcon = ({ size = 30 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="drop-shadow-xs"
  >
    <ellipse cx="12" cy="11" rx="8" ry="5.5" />
    <path d="M8 9l4 4" />
    <path d="M12 7l4 4" />
    <path d="M10 16.5l-2.5 3.5h9l-2.5-3.5" />
  </svg>
);

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoriesConfig,
}) => {
  const [clickedId, setClickedId] = React.useState<string | null>(null);
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});

  const handleCategoryClick = (id: Product['category'] | 'all') => {
    setClickedId(id);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(20);
      }
    } catch {}
    // Kullanıcı İsteği: Telefonda nereye tıklandığı net turuncu olarak anlaşılsın, ardından pürüzsüzce ayrı sayfaya açılsın
    setTimeout(() => {
      onSelectCategory(id);
      setTimeout(() => setClickedId(null), 350);
    }, 220);
  };

  const defaultIcons: Record<string, React.ReactNode> = {
    all: <CatalogIcon size={32} />,
    discount: <DiscountIcon size={42} />,
    ataturk: (
      <img
        src="/uploads/prod_1792267264910_d3639f.jpg"
        alt="Atatürk Stickerları"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/products/IMG_1140.jpeg';
        }}
        className="w-full h-full object-cover rounded-full"
      />
    ),
    araba: <Car size={32} strokeWidth={2.2} />,
    motosiklet: <Bike size={32} strokeWidth={2.2} />,
    custom: <CustomPersonalizedIcon size={24} />,
    offroad: <Compass size={30} strokeWidth={2.2} />,
    ayna: <MirrorIcon size={30} />,
  };

  const defaultCategories: CategoryCircleItem[] = [
    // 1. SATIR (4 Adet)
    {
      id: 'all',
      titleLine1: 'Katalog',
      titleLine2: 'Tüm Ürünler',
      bgGradient: 'bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-800 text-white border border-slate-700/50',
    },
    {
      id: 'discount',
      titleLine1: 'İndirimli',
      titleLine2: 'Fırsatlar',
      bgGradient: 'bg-gradient-to-tr from-rose-600 via-red-500 to-orange-500 text-white shadow-[0_0_14px_rgba(239,68,68,0.4)]',
    },
    {
      id: 'ataturk',
      titleLine1: 'Atatürk',
      titleLine2: 'Stickerları',
      bgGradient: 'bg-slate-950 overflow-hidden ring-2 ring-amber-400/80 shadow-[0_0_12px_rgba(250,204,21,0.5)]',
      imageUrl: '/uploads/prod_1792267264910_d3639f.jpg',
    },
    {
      id: 'araba',
      titleLine1: 'Araba',
      titleLine2: 'Stickerları',
      bgGradient: 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white',
    },
    // 2. SATIR (4 Adet)
    {
      id: 'motosiklet',
      titleLine1: 'Motosiklet',
      titleLine2: 'Stickerları',
      bgGradient: 'bg-slate-800 text-orange-400',
    },
    {
      id: 'custom',
      titleLine1: 'Kişiye Özel',
      titleLine2: 'Stickerlar',
      bgGradient: 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-600 text-white shadow-[0_0_14px_rgba(147,51,234,0.4)]',
    },
    {
      id: 'offroad',
      titleLine1: 'Karavan',
      titleLine2: 'Stickerları',
      bgGradient: 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white',
    },
    {
      id: 'ayna',
      titleLine1: 'Ayna',
      titleLine2: 'Stickerları',
      bgGradient: 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white',
    },
  ];

  // Kullanıcı İsteği: "tüm ürünler yazan yuvarlktaki yazı katalog ,altı da tüm ürünler olarak değişsin"
  const categories = React.useMemo(() => {
    // Hem sunucudan gelen hem varsayılan listeyi birleştir (Kullanıcının yüklediği görseller asla kaybolmaz)
    const list = Array.isArray(categoriesConfig) && categoriesConfig.length > 0
      ? defaultCategories.map((def) => {
          const matched = categoriesConfig.find((c) => c.id === def.id);
          return matched ? { ...def, ...matched } : def;
        })
      : defaultCategories;

    const preferredOrder = ['all', 'discount', 'ataturk', 'araba', 'motosiklet', 'custom', 'offroad', 'ayna'];
    const sorted = [...list].sort((a, b) => {
      const idxA = preferredOrder.indexOf(a.id);
      const idxB = preferredOrder.indexOf(b.id);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });
    return sorted.map((cat) => {
      if (cat.id === 'all') {
        return {
          ...cat,
          titleLine1: 'Katalog',
          titleLine2: 'Tüm Ürünler',
        };
      }
      return cat;
    });
  }, [categoriesConfig]);

  // Kullanıcı İsteği Sıralaması:
  // 1. Satır: tüm ürünler, indirimli fırsatlar, atatürk stickerları, araba stickerları
  // 2. Satır: motorsiklet stickerları, kişiye özel stickerlar, off road stickerları, ayna stickerları
  const row1 = categories.slice(0, 4);
  const row2 = categories.slice(4, 8);

  const renderCategoryButton = (cat: CategoryCircleItem) => {
    const isSelected = selectedCategory === cat.id;
    const isClicked = clickedId === cat.id;
    // all, discount ve custom kategorileri için kullanıcının istediği özel simgeler önceliklidir
    // cardImageUrl (katalog sayfasındaki büyük banner) bu yuvarlak simgelerin üstüne binemez
    const isDedicatedIcon = cat.id === 'all' || cat.id === 'discount' || cat.id === 'custom';
    let candidateImg: string | null = null;
    if (isDedicatedIcon) {
      candidateImg = cat.imageUrl && !cat.imageUrl.startsWith('/products/') ? cat.imageUrl : null;
    } else if (cat.id === 'motosiklet') {
      // Motosiklet yuvarlağında yanlışlıkla işeyen çocuk görseli (IMG_1143) çıkmasını engelle
      if (cat.imageUrl && !cat.imageUrl.includes('IMG_1143')) {
        candidateImg = cat.imageUrl;
      } else if (cat.cardImageUrl && !cat.cardImageUrl.includes('IMG_1143')) {
        candidateImg = cat.cardImageUrl;
      } else {
        candidateImg = null;
      }
    } else if (cat.id === 'ataturk') {
      // Atatürk kategorisi için kullanıcının orijinal araba camı Atatürk imza stickerı görseli
      candidateImg = cat.imageUrl || cat.cardImageUrl || '/uploads/prod_1792267264910_d3639f.jpg';
    } else {
      candidateImg = cat.imageUrl || cat.cardImageUrl || null;
    }
    const isBroken = failedImages[cat.id] === true;
    const customImg = (!isBroken && candidateImg) ? candidateImg : null;
    const isAtaturk = cat.id === 'ataturk';
    const isDiscount = cat.id === 'discount';
    const isAll = cat.id === 'all';

    return (
      <button
        key={cat.id}
        onClick={() => handleCategoryClick(cat.id as Product['category'] | 'all')}
        className={`flex flex-col items-center gap-1.5 w-full max-w-[92px] sm:max-w-[110px] md:max-w-[124px] group cursor-pointer focus:outline-none transition-colors text-center select-none ${
          isClicked ? 'text-[#ff6600]' : ''
        }`}
      >
        {/* Dairesel Kategori İkonu - Tıklanınca Sadece Şık Turuncu Yanar */}
        <div
          className={`w-[66px] h-[66px] sm:w-[76px] sm:h-[76px] md:w-[84px] md:h-[84px] rounded-full flex items-center justify-center transition-all duration-150 shadow-sm overflow-hidden ${
            isDiscount
              ? 'bg-gradient-to-tr from-rose-600 via-red-500 to-orange-500 text-white'
              : isAll
              ? 'bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-800 text-white border border-slate-700/50'
              : cat.bgGradient
          } ${
            isClicked
              ? 'ring-4 ring-[#ff6600] shadow-[0_0_18px_rgba(255,102,0,0.85)]'
              : isSelected
              ? 'ring-3 ring-[#ff6600] ring-offset-2 shadow-[0_0_10px_rgba(255,102,0,0.4)]'
              : isAtaturk
              ? 'ring-2 ring-amber-400/90 shadow-[0_0_12px_rgba(250,204,21,0.55)] group-hover:ring-amber-300'
              : isDiscount
              ? 'ring-2 ring-rose-400/80 shadow-[0_0_14px_rgba(244,63,94,0.45)] group-hover:ring-rose-300 group-hover:shadow-[0_0_18px_rgba(244,63,94,0.7)]'
              : 'group-hover:shadow-md group-hover:ring-2 group-hover:ring-[#ff6600]/60'
          }`}
        >
          {customImg ? (
            <img
              src={customImg}
              alt={cat.titleLine1}
              onError={(e) => {
                if (cat.id === 'ataturk') {
                  (e.currentTarget as HTMLImageElement).src = '/products/IMG_1140.jpeg';
                } else {
                  setFailedImages((prev) => ({ ...prev, [cat.id]: true }));
                }
              }}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            defaultIcons[cat.id] || <Sparkles size={30} />
          )}
        </div>

        {/* 2 Satırlı Başlık */}
        <div className="text-center leading-[1.15] w-full px-0.5">
          <p
            className={`text-[11.5px] sm:text-xs md:text-[13px] font-bold transition-colors truncate ${
              isClicked
                ? 'text-[#ff6600] font-black'
                : isAll
                ? 'text-[#ff6600] font-extrabold'
                : isSelected
                ? 'text-[#ff6600] font-extrabold'
                : isAtaturk
                ? 'text-amber-500 font-extrabold'
                : 'text-slate-800 group-hover:text-[#ff6600]'
            }`}
            title={cat.titleLine1}
          >
            {isAtaturk && !isClicked ? (
              <span className="animate-ataturk-gold-shimmer">
                {cat.titleLine1}
              </span>
            ) : (
              cat.titleLine1
            )}
          </p>
          {cat.titleLine2 && (
            <p
              className={`text-[10px] sm:text-[11px] md:text-xs font-medium transition-colors truncate ${
                isClicked
                  ? 'text-[#ff6600] font-bold'
                  : isAll
                  ? 'text-slate-500 group-hover:text-[#ff6600]'
                  : isSelected
                  ? 'text-orange-600 font-semibold'
                  : isAtaturk
                  ? 'text-amber-700 font-bold'
                  : 'text-slate-500 group-hover:text-[#ff6600]'
              }`}
              title={cat.titleLine2}
            >
              {cat.titleLine2}
            </p>
          )}
        </div>
      </button>
    );
};

  return (
    <section className="bg-[#f8f6f0] border-b border-[#e5e2d8] py-3 sm:py-3.5 shadow-2xs">
      {/* Sağdan sola kaplayacak şekilde tam simetrik genişlik, solda boşluk kalmaz */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:gap-3.5 items-center w-full">
          {/* 1. Satır: Tüm Ürünler • İndirimli Fırsatlar • Atatürk Stickerları • Araba Stickerları */}
          <div className="grid grid-cols-4 w-full gap-2 sm:gap-4 md:gap-8 justify-items-center items-start">
            {row1.map(renderCategoryButton)}
          </div>
          {/* 2. Satır: Motosiklet Stickerları • Kişiye Özel Stickerlar • Off-Road Stickerları • Ayna Stickerları */}
          <div className="grid grid-cols-4 w-full gap-2 sm:gap-4 md:gap-8 justify-items-center items-start">
            {row2.map(renderCategoryButton)}
          </div>
        </div>
      </div>
    </section>
  );
};
