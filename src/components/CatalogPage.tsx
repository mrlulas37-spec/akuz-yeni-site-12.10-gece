import React, { useState, useMemo } from 'react';
import { ChevronDown, SlidersHorizontal, ArrowUpDown, Filter, Eye, Heart, ShoppingBag, X } from 'lucide-react';
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
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Close dropdowns on outside click
  React.useEffect(() => {
    const handleOutside = () => {
      setIsCategoryOpen(false);
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

  const activeCategoryLabel =
    CATEGORY_LIST.find((c) => c.id === selectedCategory)?.label || 'Tüm Kategoriler';
  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.id === currentSort)?.label || 'Önerilen Sıralama';

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900 pb-20">
      {/* Breadcrumb & Navigation Bar */}
      <div className="bg-white border-b border-slate-200/80 sticky top-16 md:top-20 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
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
                  <span className="text-[#ff6600] font-bold">{activeCategoryLabel}</span>
                </>
              )}
            </div>

            <span className="font-mono text-xs font-semibold text-slate-600">
              {displayedProducts.length} Ürün Listelendi
            </span>
          </div>
        </div>
      </div>

      {/* 8 Dairesel Kategori Çubuğu (Katalog Sayfasında da Tıklanınca Sadece O Kategori Filtrelenir) */}
      <CategoryBar
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        categoriesConfig={categoriesConfig}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Title & Filter Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight uppercase">
                {selectedCategory !== 'all' ? activeCategoryLabel : 'KATALOG'}
              </h1>
              {selectedCategory !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ff6600] text-white shadow-2xs">
                  {displayedProducts.length} Ürün
                </span>
              )}
            </div>
            {selectedCategory !== 'all' && (
              <p className="text-xs text-slate-500 font-medium mt-1">
                Sadece seçilen kategorinin ürünleri gösteriliyor
              </p>
            )}
          </div>

          {/* SADE FİLTRELEME & SIRALAMA KUTULARI */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                className="px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 text-[#ff6600] hover:bg-orange-100 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                title="Tüm Ürünleri Göster"
              >
                <span>✕ Tüm Ürünler</span>
              </button>
            )}
            {/* 1. KATEGORİ KUTUSU (Dropdown) */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen);
                  setIsSortOpen(false);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                  isCategoryOpen || selectedCategory !== 'all'
                    ? 'border-[#ff6600] bg-orange-50/60 text-[#ff6600]'
                    : 'border-slate-300 bg-white hover:border-slate-400 text-slate-800'
                }`}
              >
                <Filter size={15} className={selectedCategory !== 'all' ? 'text-[#ff6600]' : 'text-slate-500'} />
                <span>Kategori: <strong>{activeCategoryLabel}</strong></span>
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${isCategoryOpen ? 'rotate-180 text-[#ff6600]' : 'text-slate-400'}`}
                />
              </button>

              {/* Kategori Açılır Menü */}
              {isCategoryOpen && (
                <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 bg-white rounded-lg border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    Kategori Seçin
                  </div>
                  {CATEGORY_LIST.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        onSelectCategory(cat.id);
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-[#ff6600] text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span>{cat.label}</span>
                      {selectedCategory === cat.id && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. SIRALAMA KUTUSU (Dropdown - Artan Fiyat, Azalan Fiyat vs.) */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setIsSortOpen(!isSortOpen);
                  setIsCategoryOpen(false);
                }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                  isSortOpen || currentSort !== 'default'
                    ? 'border-[#ff6600] bg-orange-50/60 text-[#ff6600]'
                    : 'border-slate-300 bg-white hover:border-slate-400 text-slate-800'
                }`}
              >
                <ArrowUpDown size={15} className={currentSort !== 'default' ? 'text-[#ff6600]' : 'text-slate-500'} />
                <span>Sırala: <strong>{activeSortLabel}</strong></span>
                <ChevronDown
                  size={15}
                  className={`transition-transform duration-200 ${isSortOpen ? 'rotate-180 text-[#ff6600]' : 'text-slate-400'}`}
                />
              </button>

              {/* Sıralama Açılır Menü */}
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-black uppercase text-slate-400 tracking-wider">
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
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
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

            {/* Aktif Filtre Temizle (Varsa) */}
            {(selectedCategory !== 'all' || currentSort !== 'default' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  setCurrentSort('default');
                  onSearchChange('');
                }}
                className="flex items-center gap-1 px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-[#ff6600] bg-slate-200/60 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                title="Filtreleri Sıfırla"
              >
                <X size={14} />
                <span>Sıfırla</span>
              </button>
            )}
          </div>
        </div>

        {/* KATEGORİ DİKDÖRTGENLERİ - Sadece Tüm Ürünler görüntülendiğinde gösterilir */}
        {selectedCategory === 'all' && (
          <div className="mt-6 mb-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 font-display">
                  ÖNE ÇIKAN KATEGORİLER
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  İncelemek istediğiniz kategoriyi seçin
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 max-w-4xl">
              {/* 1. DİKDÖRTGEN: ATATÜRK STICKERLARI */}
              <button
                type="button"
                onClick={() => onSelectCategory('ataturk')}
                className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 hover:border-[#ff6600] bg-white transition-all duration-200 text-left cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-900 overflow-hidden">
                  <img
                    src="/products/IMG_1278.jpeg"
                    alt="Atatürk Stickerları"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-wide">
                    Sticker
                  </span>
                </div>
                <div className="p-2.5 sm:p-3.5 bg-white flex flex-col justify-between flex-1">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#ff6600] transition-colors leading-snug">
                    Atatürk Stickerları
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
                    Özel İmza & Portre Çıkartmaları
                  </span>
                </div>
              </button>

              {/* 2. DİKDÖRTGEN: ARABA STICKERLARI */}
              <button
                type="button"
                onClick={() => onSelectCategory('araba')}
                className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 hover:border-[#ff6600] bg-white transition-all duration-200 text-left cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-slate-900 overflow-hidden">
                  <img
                    src="/products/IMG_1141.jpeg"
                    alt="Araba Stickerları"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold tracking-wide">
                    Sticker
                  </span>
                </div>
                <div className="p-2.5 sm:p-3.5 bg-white flex flex-col justify-between flex-1">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#ff6600] transition-colors leading-snug">
                    Araba Stickerları
                  </h3>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
                    Araç Camı & Kaporta Çıkartmaları
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ÜRÜN IZGARASI (GRID) */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200 mt-8 shadow-xs">
            <div className="w-16 h-16 bg-orange-50 text-[#ff6600] rounded-full flex items-center justify-center mx-auto mb-4">
              <SlidersHorizontal size={28} />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase">
              Bu Kriterde Ürün Bulunamadı
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Seçilen kategori veya arama teriminde henüz eklenmiş ürün yok. Diğer kategorilere göz atabilirsiniz.
            </p>
            <button
              onClick={() => {
                onSelectCategory('all');
                onSearchChange('');
              }}
              className="mt-5 px-5 py-2.5 bg-[#ff6600] hover:bg-orange-600 text-white rounded-md text-xs font-bold transition-colors cursor-pointer shadow-md"
            >
              Tüm Kataloğu Görüntüle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5 mt-6">
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
