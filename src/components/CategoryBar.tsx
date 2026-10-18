import React from 'react';
import { LayoutGrid, Percent, Car, Bike, Sparkles, Compass } from 'lucide-react';
import { Product, CategoryCircleItem } from '../types';
import { ThreeDDiscountCoin } from './ThreeDDiscountCoin';

interface CategoryBarProps {
  selectedCategory: Product['category'] | 'all';
  onSelectCategory: (category: Product['category'] | 'all') => void;
  categoriesConfig?: CategoryCircleItem[];
}

// Ayna Stickerları için özel Yan Ayna Simgesi
const MirrorIcon = ({ size = 30 }: { size?: number }) => (
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
    all: <LayoutGrid size={30} strokeWidth={2.2} />,
    discount: (
      <ThreeDDiscountCoin size={48} />
    ),
    ataturk: (
      <img
        src="/products/IMG_1278.jpeg"
        alt="Atatürk Stickerları"
        className="w-full h-full object-cover rounded-full"
      />
    ),
    araba: <Car size={32} strokeWidth={2.2} />,
    motosiklet: <Bike size={32} strokeWidth={2.2} />,
    custom: <Sparkles size={30} strokeWidth={2.2} />,
    offroad: <Compass size={30} strokeWidth={2.2} />,
    ayna: <MirrorIcon size={30} />,
  };

  const defaultCategories: CategoryCircleItem[] = [
    // 1. SATIR (4 Adet)
    {
      id: 'all',
      titleLine1: 'Katalog',
      titleLine2: 'Tüm Ürünler',
      bgGradient: 'bg-slate-900 text-white',
    },
    {
      id: 'discount',
      titleLine1: 'İndirimli',
      titleLine2: 'Fırsatlar',
      bgGradient: 'bg-gradient-to-tr from-rose-500 to-red-500 text-white',
    },
    {
      id: 'ataturk',
      titleLine1: 'Atatürk',
      titleLine2: 'Stickerları',
      bgGradient: 'bg-slate-950 overflow-hidden ring-2 ring-amber-400/80 shadow-[0_0_12px_rgba(250,204,21,0.5)]',
      imageUrl: '/products/IMG_1278.jpeg',
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
      bgGradient: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white',
    },
    {
      id: 'offroad',
      titleLine1: 'Off-Road',
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
    const list = (categoriesConfig && categoriesConfig.length >= 8 && categoriesConfig.some((c) => c.id === 'ayna'))
      ? categoriesConfig
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
    const customImg = cat.imageUrl;
    const isAtaturk = cat.id === 'ataturk';
    const isDiscount = cat.id === 'discount';

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
              ? 'bg-[radial-gradient(circle_at_center,_#2b0d14_0%,_#140508_55%,_#050204_100%)] text-white border border-amber-500/30'
              : cat.bgGradient
          } ${
            isClicked
              ? 'ring-4 ring-[#ff6600] shadow-[0_0_18px_rgba(255,102,0,0.85)]'
              : isSelected
              ? 'ring-3 ring-[#ff6600] ring-offset-2 shadow-[0_0_10px_rgba(255,102,0,0.4)]'
              : isAtaturk
              ? 'ring-2 ring-amber-400/90 shadow-[0_0_12px_rgba(250,204,21,0.55)] group-hover:ring-amber-300'
              : isDiscount
              ? 'ring-2 ring-amber-500/70 shadow-[0_0_14px_rgba(245,158,11,0.35)] group-hover:ring-amber-400 group-hover:shadow-[0_0_18px_rgba(245,158,11,0.6)]'
              : 'group-hover:shadow-md group-hover:ring-2 group-hover:ring-[#ff6600]/60'
          }`}
        >
          {isDiscount ? (
            <div className="w-full h-full flex items-center justify-center">
              <ThreeDDiscountCoin size={54} />
            </div>
          ) : customImg ? (
            <img
              src={customImg}
              alt={cat.titleLine1}
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
                : isSelected
                ? 'text-[#ff6600] font-extrabold'
                : isAtaturk
                ? 'text-amber-500 font-extrabold'
                : isDiscount
                ? 'text-rose-600 font-extrabold'
                : 'text-slate-800 group-hover:text-[#ff6600]'
            }`}
            title={cat.titleLine1}
          >
            {isAtaturk && !isClicked ? (
              <span className="animate-ataturk-gold-shimmer">
                {cat.titleLine1}
              </span>
            ) : isDiscount && !isClicked && !isSelected ? (
              <span className="text-rose-600 font-black">
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
                  : isSelected
                  ? 'text-orange-600 font-semibold'
                  : isAtaturk
                  ? 'text-amber-700 font-bold'
                : isDiscount
                ? 'text-rose-600/90 font-bold'
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
