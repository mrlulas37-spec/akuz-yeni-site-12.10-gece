import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  SlidersHorizontal,
  ArrowUpDown,
  Eye,
  Heart,
  ShoppingBag,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Product, CategoryCircleItem } from '../types';
import { ProductCard } from './ProductCard';
import { CategoryBar } from './CategoryBar';

export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'popular';

interface CatalogPageProps {
  products: Product[];
  selectedCategory: Product['category'] | 'all';
  onSelectCategory: (category: Product['category'] | 'all') => void;
  categoriesConfig?: CategoryCircleItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  favoriteIds: string[];
  onToggleFavorite: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onGoHome: () => void;
}

const CATEGORY_LIST: { id: Product['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Tüm Kategoriler' },
  { id: 'discount', label: 'İndirimli Fırsatlar' },
  { id: 'ataturk', label: 'Atatürk Stickerları' },
  { id: 'araba', label: 'Araba Stickerları' },
  { id: 'motosiklet', label: 'Motosiklet Stickerları' },
  { id: 'offroad', label: '4x4 Off-Road Çıkartmaları' },
  { id: 'custom', label: 'Kişiye Özel Tasarımlar' },
  { id: 'ayna', label: 'Ayna Stickerları' },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'default', label: 'Önerilen Sıralama' },
  { id: 'price-asc', label: 'Fiyat: Artan (En Düşük)' },
  { id: 'price-desc', label: 'Fiyat: Azalan (En Yüksek)' },
  { id: 'name-asc', label: 'Ürün Adı: (A - Z)' },
  { id: 'popular', label: 'En Popüler / Çok Satanlar' },
];

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  categoriesConfig,
  searchQuery,
  onSearchChange,
  favoriteIds,
  onToggleFavorite,
  onSelectProduct,
  onGoHome,
}) => {
  const [currentSort, setCurrentSort] = useState<SortOption>('default');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleOutside = () => {
      setIsSortOpen(false);
    };
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  // Filter & Sort
  const displayedProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Category filter
      if (selectedCategory === 'discount') {
        if (!p.isDiscounted) return false;
      } else if (selectedCategory !== 'all') {
        if (p.category !== selectedCategory) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });

    // Sort logic
    switch (currentSort) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case 'name-asc':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        break;
      case 'popular':
        result = [...result].sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
        break;
      default:
        break;
    }

    return result;
  }, [products, selectedCategory, searchQuery, currentSort]);

  // Trendyol Tarzı Kategori Vitrini (Katalog tıklandığında gösterilecek ürün boyutunda dikdörtgen kategori bölmeleri)
  const showcaseCategories = useMemo(() => {
    const defaultList: CategoryCircleItem[] = [
      {
        id: 'ataturk',
        titleLine1: 'Atatürk',
        titleLine2: 'Stickerları',
        bgGradient: 'bg-slate-900',
        imageUrl: '/products/IMG_1278.jpeg',
        cardImageUrl: '/products/IMG_1278.jpeg',
        subtitle: 'İmza, Portre & Özel Tasarımlar',
      },
      {
        id: 'araba',
        titleLine1: 'Araba',
        titleLine2: 'Stickerları',
        bgGradient: 'bg-slate-900',
        cardImageUrl: '/products/AkuzStickers_LaFamilia.jpg',
        subtitle: 'Cam, Kaporta & Tampon Vinilleri',
      },
      {
        id: 'motosiklet',
        titleLine1: 'Motosiklet',
        titleLine2: 'Stickerları',
        bgGradient: 'bg-slate-800',
        cardImageUrl: '/products/IMG_1143.webp',
        subtitle: 'Kask, Depo, Maşa & Jant Çıkartmaları',
      },
      {
        id: 'offroad',
        titleLine1: 'Off-Road',
        titleLine2: 'Stickerları',
        bgGradient: 'bg-slate-900',
        cardImageUrl: '/products/IMG_1140.jpeg',
        subtitle: '4x4 Arazi, Dağ & Macera Çıkartmaları',
      },
      {
        id: 'custom',
        titleLine1: 'Kişiye Özel',
        titleLine2: 'Stickerlar',
        bgGradient: 'bg-slate-900',
        cardImageUrl: '/products/phonto.jpeg',
        subtitle: 'Kendi Yazını & Fontunu Tasarla',
      },
      {
        id: 'ayna',
        titleLine1: 'Ayna',
        titleLine2: 'Stickerları',
        bgGradient: 'bg-slate-900',
        cardImageUrl: '/products/IMG_1142.jpeg',
        subtitle: 'Yan Ayna & Dikiz Çıkartmaları',
      },
      {
        id: 'discount',
        titleLine1: 'İndirimli',
        titleLine2: 'Fırsatlar',
        bgGradient: 'bg-slate-900',
        cardImageUrl: '/products/IMG_1147.webp',
        subtitle: 'Avantajlı Paketler & İndirimler',
      },
    ];

    const source: CategoryCircleItem[] =
      categoriesConfig && categoriesConfig.length > 0
        ? categoriesConfig.filter((c) => c.id !== 'all')
        : defaultList;

    return source.map((c) => {
      const def = defaultList.find((d) => d.id === c.id);
      let img = c.cardImageUrl || c.imageUrl || def?.cardImageUrl;
      if (!img) {
        const prod = products.find((p) => (c.id === 'discount' ? p.isDiscounted : p.category === c.id));
        if (prod?.imageUrl) img = prod.imageUrl;
      }
      return {
        ...c,
        cardImageUrl: img || '/products/IMG_1141.jpeg',
        subtitle: c.subtitle || def?.subtitle || 'Özel Tasarım Döküm Vinil',
        fullTitle: `${c.titleLine1} ${c.titleLine2}`.trim(),
      };
    });
  }, [categoriesConfig, products]);

  const activeCategoryLabel =
    CATEGORY_LIST.find((c) => c.id === selectedCategory)?.label || 'Tüm Kategoriler';
  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.id === currentSort)?.label || 'Önerilen Sıralama';

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 pb-12 sm:pb-16">
      {/* Breadcrumb & Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 md:top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <button
                onClick={onGoHome}
                className="hover:text-[#ff6600] font-semibold transition-colors cursor-pointer"
              >
                Ana Sayfa
              </button>
              <span>/</span>
              <button
                onClick={() => onSelectCategory('all')}
                className={`transition-colors cursor-pointer ${
                  selectedCategory === 'all' ? 'text-slate-900 font-bold' : 'hover:text-[#ff6600] font-semibold'
                }`}
              >
                Katalog
              </button>
              {selectedCategory !== 'all' && (
                <>
                  <span>/</span>
                  <span className={`font-bold ${selectedCategory === 'ataturk' ? 'animate-ataturk-gold-shimmer' : 'text-[#ff6600]'}`}>
                    {activeCategoryLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 8 Dairesel Kategori Çubuğu (Katalog Sayfasında da Tıklanınca Sadece O Kategori Filtrelenir) */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        categoriesConfig={categoriesConfig}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3">
        {/* Title & Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 pb-2.5 sm:pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight uppercase">
              {selectedCategory === 'ataturk' ? (
                <>
                  <span className="animate-ataturk-gold-shimmer">ATATÜRK</span>{' '}
                  <span className="text-slate-900">STİCKERLARI</span>
                </>
              ) : selectedCategory !== 'all' ? (
                activeCategoryLabel
              ) : (
                'KATALOG'
              )}
            </h1>
          </div>

          {/* SADE SIRALAMA KUTUSU & SIFIRLA (Kullanıcı İsteği: Kategori Seçme Kısmı Silindi, Sıralama Sol Yukarıya Hizalandı) */}
          <div className="flex flex-wrap items-center justify-start gap-1.5 sm:gap-2 -mt-0.5 sm:mt-0">
            {/* SIRALAMA KUTUSU (Dropdown - %30 Daha Kompakt) */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                  isSortOpen || currentSort !== 'default'
                    ? 'border-[#ff6600] bg-orange-50/70 text-[#ff6600]'
                    : 'border-slate-300 bg-white hover:border-slate-400 text-slate-700'
                }`}
              >
                <ArrowUpDown size={13} className={currentSort !== 'default' ? 'text-[#ff6600]' : 'text-slate-500'} />
                <span>Sırala: <strong className="font-bold">{activeSortLabel}</strong></span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 ${isSortOpen ? 'rotate-180 text-[#ff6600]' : 'text-slate-400'}`}
                />
              </button>

              {/* Sıralama Açılır Menü */}
              {isSortOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Sıralama Ölçütü
                  </div>
                  {SORT_OPTIONS.map((sort) => (
                    <button
                      key={sort.id}
                      type="button"
                      onClick={() => {
                        setCurrentSort(sort.id);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        currentSort === sort.id
                          ? 'bg-[#ff6600] text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span>{sort.label}</span>
                      {currentSort === sort.id && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Aktif Sıralama / Arama Temizle (Varsa) */}
            {(currentSort !== 'default' || Boolean(searchQuery.trim())) && (
              <button
                type="button"
                onClick={() => {
                  setCurrentSort('default');
                  onSearchChange('');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold text-slate-500 hover:text-[#ff6600] bg-slate-200/60 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                title="Sıralama ve Aramayı Sıfırla"
              >
                <X size={12} />
                <span>Sıfırla</span>
              </button>
            )}
          </div>
        </div>

        {/* KULLANICI İSTEĞİ: KATALOG BUTONUNA TIKLANDIĞINDA KATEGORİ SEÇME ALANI (TRENDYOL VİTRİNİ) */}
        {selectedCategory === 'all' && (
          <div className="mt-6 mb-12">
            <div className="mb-4 px-1">
              <span className="text-[11px] sm:text-xs font-black tracking-widest text-[#ff6600] uppercase block">
                KATEGORİ VİTRİNİ
              </span>
            </div>

            {/* ÜRÜN GİBİ BÖLMELER (DİKDÖRTGEN KARTLAR) - FİYATSIZ, SADECE RESİM KAPLAYAN, KATEGORİYE AÇILAN */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {showcaseCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.id);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200/90 hover:border-[#ff6600] bg-slate-950 transition-all duration-300 text-left cursor-pointer shadow-xs hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
                >
                  {/* Sadece Resim Kaplayan Ürün Boyutunda Dikdörtgen */}
                  <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-slate-900 overflow-hidden">
                    <img
                      src={cat.cardImageUrl}
                      alt={cat.fullTitle}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />

                    {/* Zarif Kategori Aydınlatma Gradyanı */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent flex flex-col justify-end p-3.5 sm:p-4 transition-opacity" />

                    {/* Kategori Başlığı ve Keşfet Göstergesi */}
                    <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4 flex flex-col justify-end z-10 pointer-events-none">
                      <span className="text-white font-black text-sm sm:text-base tracking-wide uppercase drop-shadow-md leading-snug group-hover:text-orange-400 transition-colors">
                        {cat.fullTitle}
                      </span>
                      {cat.subtitle && (
                        <span className="text-slate-300 text-[10px] sm:text-[11px] font-medium mt-0.5 line-clamp-1 drop-shadow-sm">
                          {cat.subtitle}
                        </span>
                      )}
                      <div className="mt-2.5 flex items-center gap-1.5 text-[#ff6600] text-[11px] sm:text-xs font-black tracking-wider uppercase drop-shadow-sm">
                        <span>Kategoriye Git</span>
                        <span className="transition-transform duration-200 group-hover:translate-x-1 font-bold">→</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* TÜM ÜRÜNLER AYRACI / LİSTELEME BAŞLIĞI */}
            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-black tracking-widest text-[#ff6600] uppercase block">
                  DOĞRUDAN LİSTELEME
                </span>
                <h3 className="text-lg sm:text-xl font-black uppercase text-slate-900 font-display">
                  TÜM STICKER KOLEKSİYONU
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Kategori seçmeden tüm ürünleri doğrudan listeleyin ({displayedProducts.length} Ürün)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ÜRÜN IZGARASI (GRID) */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 mt-6 shadow-xs">
            <div className="w-16 h-16 bg-orange-50 text-[#ff6600] rounded-full flex items-center justify-center mx-auto mb-4">
              <SlidersHorizontal size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase">
              Bu Kriterde Ürün Bulunamadı
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Seçilen kategori veya arama teriminde henüz eklenmiş ürün bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 mt-4">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFav={favoriteIds.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
                onSelectProduct={onSelectProduct}
                variant="catalog"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
