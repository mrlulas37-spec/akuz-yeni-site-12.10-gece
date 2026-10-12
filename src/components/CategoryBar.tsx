import React from 'react';
import { LayoutGrid, Percent, Car, Bike, Sparkles, Compass } from 'lucide-react';
import { Product, CategoryCircleItem } from '../types';

interface CategoryBarProps {
  selectedCategory: Product['category'] | 'all';
  onSelectCategory: (category: Product['category'] | 'all') => void;
  categoriesConfig?: CategoryCircleItem[];
}

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
        navigator.vibrate?.(15);
      }
    } catch {}
    onSelectCategory(id);
    setTimeout(() => setClickedId(null), 400);
  };
  const defaultIcons: Record<string, React.ReactNode> = {
    all: <LayoutGrid size={28} strokeWidth={2.2} />,
    discount: <Percent size={28} strokeWidth={2.4} />,
    ataturk: (
      <img
        src="/products/IMG_1278.jpeg"
        alt="Atatürk Stickerları"
        className="w-full h-full object-cover rounded-full"
      />
    ),
    araba: <Car size={30} strokeWidth={2.2} />,
    motosiklet: <Bike size={30} strokeWidth={2.2} />,
    offroad: <Compass size={28} strokeWidth={2.2} />,
    custom: <Sparkles size={28} strokeWidth={2.2} />,
  };

  const categories = categoriesConfig || [
    {
      id: 'all',
      titleLine1: 'Tüm Ürünler',
      titleLine2: 'Katalog',
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
      bgGradient: 'bg-slate-900 overflow-hidden',
      imageUrl: '/products/IMG_1278.jpeg',
    },
    {
      id: 'araba',
      titleLine1: 'Araba',
      titleLine2: 'Stickerları',
      bgGradient: 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white',
    },
    {
      id: 'motosiklet',
      titleLine1: 'Motosiklet',
      titleLine2: 'Stickerları',
      bgGradient: 'bg-slate-800 text-orange-400',
    },
    {
      id: 'offroad',
      titleLine1: '4x4 Off-Road',
      titleLine2: 'Çıkartmaları',
      bgGradient: 'bg-gradient-to-tr from-emerald-600 to-teal-700 text-white',
    },
    {
      id: 'custom',
      titleLine1: 'Kişiye Özel',
      titleLine2: 'Yazı & Grafik',
      bgGradient: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white',
    },
  ];

  // 2 Satıra böl (doğal okuma sırasına göre)
  const halfIndex = Math.ceil(categories.length / 2);
  const row1 = categories.slice(0, halfIndex);
  const row2 = categories.slice(halfIndex);

  const renderCategoryButton = (cat: CategoryCircleItem) => {
    const isSelected = selectedCategory === cat.id;
    const isClicked = clickedId === cat.id;
    const customImg = cat.imageUrl;

    return (
      <button
        key={cat.id}
        onClick={() => handleCategoryClick(cat.id as Product['category'] | 'all')}
        className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none transition-transform active:scale-95 w-[80px] sm:w-[88px] md:w-[96px]"
      >
        {/* Dairesel Kategori İkonu (Büyütülmüş ve Belirgin Boyut) */}
        <div
          className={`w-[60px] h-[60px] sm:w-[66px] sm:h-[66px] md:w-[70px] md:h-[70px] rounded-full flex items-center justify-center transition-all duration-200 shadow-xs overflow-hidden ${
            cat.bgGradient
          } ${
            isClicked
              ? 'animate-rubber-pop ring-3 ring-[#ff6600]/50 shadow-md scale-105'
              : isSelected
              ? 'ring-2.5 ring-[#ff0055] ring-offset-2 scale-105 shadow-sm'
              : 'hover:scale-105 group-hover:shadow-sm group-hover:ring-2 group-hover:ring-[#ff6600]/60'
          }`}
        >
          {customImg ? (
            <img
              src={customImg}
              alt={cat.titleLine1}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            defaultIcons[cat.id] || <Sparkles size={28} />
          )}
        </div>

        {/* 2 Satırlı Başlık */}
        <div className="text-center leading-[1.15] w-full px-0.5">
          <p
            className={`text-[11.5px] sm:text-xs font-bold transition-colors truncate ${
              isSelected
                ? 'text-[#ff0055]'
                : 'text-slate-800 group-hover:text-[#ff6600]'
            }`}
            title={cat.titleLine1}
          >
            {cat.titleLine1}
          </p>
          {cat.titleLine2 && (
            <p
              className={`text-[10px] sm:text-[11px] font-medium transition-colors truncate ${
                isSelected
                  ? 'text-[#ff0055]'
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
    <section className="bg-[#f8f6f0] border-b border-[#e5e2d8] py-2.5 sm:py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex flex-col gap-2 sm:gap-2.5 items-center">
          {/* 1. Satır */}
          <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar w-full py-0.5 px-1 overscroll-x-contain touch-pan-y">
            {row1.map(renderCategoryButton)}
          </div>
          {/* 2. Satır */}
          <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-4 md:gap-6 overflow-x-auto no-scrollbar w-full py-0.5 px-1 overscroll-x-contain touch-pan-y">
            {row2.map(renderCategoryButton)}
          </div>
        </div>
      </div>
    </section>
  );
};
