import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Flame,
  TrendingUp,
  Clock,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { Product } from '../types';
import { StickerGraphic } from './StickerGraphic';
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearAllRecentSearches,
  RECENT_SEARCH_EVENT_NAME,
} from '../utils/recentSearches';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onViewAllProducts: (customQuery?: string) => void;
  recentlyViewedProducts?: Product[];
}

export interface TrendingSearchItem {
  id: string;
  term: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  rank: number;
  badge?: string;
  badgeType?: 'hot' | 'trend' | 'popular' | 'new';
  searchesCount?: string;
}

export const TRENDING_SEARCHES: TrendingSearchItem[] = [
  {
    id: 'trend-1',
    term: 'Kurt Logosu',
    category: 'araba',
    categoryLabel: 'Araba Stickerları',
    categoryIcon: '🐺',
    rank: 1,
    badge: '1. Sırada · Çok Popüler',
    badgeType: 'hot',
    searchesCount: '2.4K+ arama',
  },
  {
    id: 'trend-2',
    term: 'Atatürk İmza',
    category: 'ataturk',
    categoryLabel: 'Atatürk Koleksiyonu',
    categoryIcon: '🇹🇷',
    rank: 2,
    badge: 'Haftanın Trendi',
    badgeType: 'trend',
    searchesCount: '1.9K+ arama',
  },
  {
    id: 'trend-3',
    term: 'La Familia Es Todo',
    category: 'araba',
    categoryLabel: 'Cam & Kaporta',
    categoryIcon: '🚗',
    rank: 3,
    badge: 'Çok Satan',
    badgeType: 'popular',
    searchesCount: '1.6K+ arama',
  },
  {
    id: 'trend-4',
    term: 'Kişiye Özel İsim & Yazı',
    category: 'custom',
    categoryLabel: 'Özel Tasarım',
    categoryIcon: '✍️',
    rank: 4,
    badge: 'Özelleştirilebilir',
    badgeType: 'trend',
    searchesCount: '1.3K+ arama',
  },
  {
    id: 'trend-5',
    term: 'Offroad 4x4 & Pusula',
    category: 'offroad',
    categoryLabel: 'Karavan & Arazi',
    categoryIcon: '🧭',
    rank: 5,
    badge: 'Yeni Trend',
    badgeType: 'new',
    searchesCount: '980+ arama',
  },
  {
    id: 'trend-6',
    term: 'Motosiklet Kask & Depo',
    category: 'motosiklet',
    categoryLabel: 'Motosiklet',
    categoryIcon: '🏍️',
    rank: 6,
    badge: 'Popüler',
    badgeType: 'popular',
    searchesCount: '870+ arama',
  },
  {
    id: 'trend-7',
    term: 'Depo Kapağı Canavarı',
    category: 'araba',
    categoryLabel: 'Araba & Mizah',
    categoryIcon: '⛽',
    rank: 7,
    badge: 'Eğlenceli',
    badgeType: 'hot',
    searchesCount: '740+ arama',
  },
  {
    id: 'trend-8',
    term: 'Yan Ayna Dikiz Stickerı',
    category: 'ayna',
    categoryLabel: 'Ayna Stickerları',
    categoryIcon: '🪞',
    rank: 8,
    badge: 'Yeni',
    badgeType: 'new',
    searchesCount: '620+ arama',
  },
  {
    id: 'trend-9',
    term: 'Baby on Board / Bebek Var',
    category: 'araba',
    categoryLabel: 'Aile & Güvenlik',
    categoryIcon: '👶',
    rank: 9,
    badge: 'Popüler',
    badgeType: 'popular',
    searchesCount: '580+ arama',
  },
  {
    id: 'trend-10',
    term: 'Göktürkçe Türk',
    category: 'araba',
    categoryLabel: 'Özel Seri',
    categoryIcon: '🏹',
    rank: 10,
    badge: 'Klasik',
    badgeType: 'popular',
    searchesCount: '510+ arama',
  },
];

export const CATEGORY_META: Record<string, { label: string; icon: string; shortLabel: string }> = {
  araba: {
    label: 'Araba & Araç Dış Stickerları',
    shortLabel: 'Araba',
    icon: '🚗',
  },
  motosiklet: {
    label: 'Motosiklet & Kask Stickerları',
    shortLabel: 'Motosiklet',
    icon: '🏍️',
  },
  ataturk: {
    label: 'Atatürk Stickerları & İmzalar',
    shortLabel: 'Atatürk',
    icon: '🇹🇷',
  },
  custom: {
    label: 'Kişiye Özel Yazı & İsim Tasarımları',
    shortLabel: 'Kişiye Özel',
    icon: '✍️',
  },
  offroad: {
    label: 'Karavan & Off-Road 4x4 Stickerları',
    shortLabel: 'Off-Road',
    icon: '🚙',
  },
  ayna: {
    label: 'Ayna & Cam Stickerları',
    shortLabel: 'Ayna',
    icon: '🪞',
  },
  discount: {
    label: 'İndirimli Fırsat Ürünleri',
    shortLabel: 'İndirimli',
    icon: '🏷️',
  },
  akuz: {
    label: 'Akuz Özel Tasarımlar',
    shortLabel: 'Akuz',
    icon: '⚡',
  },
  all: {
    label: 'Genel Koleksiyon',
    shortLabel: 'Tümü',
    icon: '📦',
  },
};

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  products,
  onSelectProduct,
  onViewAllProducts,
  recentlyViewedProducts = [],
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const popularScrollRef = useRef<HTMLDivElement>(null);
  const recentScrollRef = useRef<HTMLDivElement>(null);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectingProdId, setSelectingProdId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollRecentLeft, setCanScrollRecentLeft] = useState(false);
  const [canScrollRecentRight, setCanScrollRecentRight] = useState(false);

  // Otomatik odaklanma ve klavye kısayolu
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      setSelectedCategoryFilter('all');
    }
  }, [isOpen]);

  // Son aramalar event senkronizasyonu
  useEffect(() => {
    const handleUpdate = () => {
      setRecentSearches(getRecentSearches());
    };
    window.addEventListener(RECENT_SEARCH_EVENT_NAME, handleUpdate);
    return () => window.removeEventListener(RECENT_SEARCH_EVENT_NAME, handleUpdate);
  }, []);

  // ESC ve Enter tuşları
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery.trim());
        onViewAllProducts(searchQuery.trim());
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Arama çalıştırma fonksiyonu
  const handleExecuteSearch = (term: string) => {
    saveRecentSearch(term);
    onSearchChange(term);
    setSelectedCategoryFilter('all');
  };

  // Ürün seçme fonksiyonu
  const handleProductClick = (prod: Product) => {
    setSelectingProdId(prod.id);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(15);
      }
    } catch {}
    setTimeout(() => {
      saveRecentSearch(prod.name);
      onSelectProduct(prod);
      onClose();
      setSelectingProdId(null);
    }, 120);
  };

  // Eşleşen ürünler
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = (p.category || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchTag = (p.tag || '').toLowerCase().includes(q);
      return matchName || matchCat || matchDesc || matchTag;
    });
  }, [products, searchQuery]);

  // Kategori bazlı gruplandırma
  const groupedResults = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    searchResults.forEach((prod) => {
      const catKey = prod.category || 'other';
      if (!groups[catKey]) {
        groups[catKey] = [];
      }
      groups[catKey].push(prod);
    });
    return groups;
  }, [searchResults]);

  // Grupların anahtarları (ürün sayısına göre sıralı)
  const categoryKeys = useMemo(() => {
    return Object.keys(groupedResults).sort(
      (a, b) => groupedResults[b].length - groupedResults[a].length
    );
  }, [groupedResults]);

  // Filtrelenmiş veya tüm sonuçlar
  const displayedCategories = useMemo(() => {
    if (selectedCategoryFilter === 'all') {
      return categoryKeys;
    }
    return categoryKeys.filter((k) => k === selectedCategoryFilter);
  }, [categoryKeys, selectedCategoryFilter]);

  const popularProducts = useMemo(() => {
    return products.filter((p) => p.isPopular).slice(0, 8);
  }, [products]);

  // Carousel kaydırma kontrolleri
  const checkScroll = () => {
    if (!popularScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = popularScrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScroll = (dir: 'left' | 'right') => {
    if (!popularScrollRef.current) return;
    popularScrollRef.current.scrollBy({
      left: dir === 'left' ? -260 : 260,
      behavior: 'smooth',
    });
  };

  const checkRecentScroll = () => {
    if (!recentScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = recentScrollRef.current;
    setCanScrollRecentLeft(scrollLeft > 10);
    setCanScrollRecentRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const handleScrollRecent = (dir: 'left' | 'right') => {
    if (!recentScrollRef.current) return;
    recentScrollRef.current.scrollBy({
      left: dir === 'left' ? -260 : 260,
      behavior: 'smooth',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ürün ve Model Arama"
      className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-black/60 backdrop-blur-xs md:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full md:max-w-3xl md:h-[90vh] md:max-h-[820px] bg-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200/90 h-full">
        {/* ========================================================= */}
        {/* 1. ÜST ARAMA ÇUBUĞU */}
        {/* ========================================================= */}
        <div className="p-3 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 bg-white sticky top-0 z-20 shrink-0">
          <div className="relative flex-1 flex items-center">
            <Search
              className="absolute left-3.5 text-[#ff0055] pointer-events-none"
              size={18}
              strokeWidth={2.4}
            />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setSelectedCategoryFilter('all');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Sticker, model veya kategori ara (örn: kurt, 4x4, atatürk, isim)..."
              className="w-full bg-slate-100 focus:bg-white text-slate-900 placeholder:text-slate-400 text-sm sm:text-base rounded-full pl-10 pr-9 py-2.5 sm:py-3 border border-transparent focus:border-[#ff0055] focus:ring-2 focus:ring-pink-100 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setSelectedCategoryFilter('all');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 text-xs text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                title="Aramayı Temizle"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-black text-slate-700 hover:text-[#ff0055] px-2.5 py-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            Kapat
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. ARAMA YAPILIYORSA: KATEGORİ SEÇİCİ TAB BARI & GRUPLU SONUÇLAR */}
        {/* ========================================================= */}
        {searchQuery.trim().length > 0 ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Üst Özet ve Katalogda Göster Butonu */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  "{searchQuery}" Sonuçları
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-[#ff0055]">
                  {searchResults.length} Ürün
                </span>
                <span className="text-xs text-slate-400">
                  ({categoryKeys.length} Kategori)
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  saveRecentSearch(searchQuery.trim());
                  onViewAllProducts(searchQuery.trim());
                  onClose();
                }}
                className="text-xs font-bold text-[#ff0055] hover:text-[#d90048] flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Katalogda Filtrele</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Kategori Bazlı Filtreleme Tabları (Hızlı Filtreleme) */}
            {categoryKeys.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Layers size={13} />
                  <span>Tüm Kategoriler ({searchResults.length})</span>
                </button>

                {categoryKeys.map((catKey) => {
                  const meta = CATEGORY_META[catKey] || {
                    label: catKey,
                    shortLabel: catKey,
                    icon: '📦',
                  };
                  const count = groupedResults[catKey]?.length || 0;
                  const isSelected = selectedCategoryFilter === catKey;

                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(catKey)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#ff0055] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{meta.icon}</span>
                      <span>{meta.shortLabel}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Hiç Sonuç Yoksa */}
            {searchResults.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Search size={24} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800">
                    "{searchQuery}" için eşleşen ürün bulunamadı
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Farklı bir kelime deneyebilir veya aşağıdaki popüler trend aramalardan birini seçebilirsiniz.
                  </p>
                </div>

                {/* Hızlı Trend Önerileri */}
                <div className="pt-2 flex flex-wrap justify-center gap-1.5 max-w-md mx-auto">
                  {TRENDING_SEARCHES.slice(0, 5).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleExecuteSearch(t.term)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-pink-50 hover:text-[#ff0055] rounded-full text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      {t.categoryIcon} {t.term}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* KATEGORİ BAZLI GRUPLANDIRILMIŞ ÜRÜN LİSTESİ */
              <div className="space-y-6">
                {displayedCategories.map((catKey) => {
                  const meta = CATEGORY_META[catKey] || {
                    label: catKey.toUpperCase(),
                    shortLabel: catKey,
                    icon: '📦',
                  };
                  const prods = groupedResults[catKey] || [];

                  return (
                    <div
                      key={catKey}
                      className="bg-slate-50/70 rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-3"
                    >
                      {/* Kategori Başlığı */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta.icon}</span>
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-slate-900">
                              {meta.label}
                            </h4>
                            <span className="text-[11px] font-bold text-slate-500">
                              {prods.length} Eşleşen Ürün
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            saveRecentSearch(searchQuery);
                            onViewAllProducts(searchQuery);
                            onClose();
                          }}
                          className="text-[11px] font-bold text-[#ff0055] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>Katalog</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>

                      {/* Kategorideki Ürün Kartları */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {prods.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleProductClick(prod)}
                            className={`flex items-center gap-3 p-2.5 bg-white rounded-xl border transition-all cursor-pointer group ${
                              selectingProdId === prod.id
                                ? 'border-[#ff0055] ring-2 ring-pink-200 bg-pink-50/50 scale-[0.98]'
                                : 'border-slate-200/80 hover:border-[#ff0055] hover:shadow-xs'
                            }`}
                          >
                            <div className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1 border border-slate-100">
                              <StickerGraphic
                                type={prod.svgType}
                                imageUrl={prod.imageUrl}
                                fit="cover"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-[#ff0055] transition-colors line-clamp-1">
                                {prod.name}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {prod.dimensions?.[0] || 'Standart Ölçü'} • {meta.shortLabel}
                              </p>
                              <div className="mt-1 flex items-baseline gap-1.5">
                                <span className="text-xs font-black text-[#ff0055] font-price">
                                  ₺{prod.currentPrice.toFixed(2).replace('.', ',')}
                                </span>
                                {prod.oldPrice > prod.currentPrice && (
                                  <span className="text-[10px] text-slate-400 line-through font-price">
                                    ₺{prod.oldPrice.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <ChevronRight
                              size={15}
                              className="text-slate-400 group-hover:text-[#ff0055] group-hover:translate-x-0.5 transition-all shrink-0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* 3. ARAMA BOŞKEN: TRENDING SEARCHES -> SON ARAMALAR -> POPÜLER ÜRÜNLER */
          /* ========================================================= */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* A. TRENDING SEARCHES (POPÜLER & TREND ARAMALAR BÖLÜMÜ) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-[#ff6600] flex items-center justify-center shrink-0">
                    <TrendingUp size={16} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase text-slate-900 flex items-center gap-1.5">
                      <span>Trending Searches</span>
                      <Flame size={14} className="text-[#ff0055] fill-[#ff0055] animate-pulse" />
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Bugün en çok aranan ve incelenen popüler sticker aramaları
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-[#ff6600] border border-orange-200">
                  Canlı Trendler
                </span>
              </div>

              {/* Trend Aramalar Grid Kartları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TRENDING_SEARCHES.map((t) => {
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleExecuteSearch(t.term)}
                      className="flex items-center justify-between p-2.5 sm:p-3 bg-white hover:bg-orange-50/60 rounded-2xl border border-slate-200/80 hover:border-orange-300 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Sıralama Numarası */}
                        <div
                          className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                            t.rank === 1
                              ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-2xs'
                              : t.rank === 2
                              ? 'bg-slate-800 text-white'
                              : t.rank === 3
                              ? 'bg-orange-100 text-[#ff6600]'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.rank}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-slate-800 group-hover:text-[#ff6600] transition-colors truncate">
                              {t.term}
                            </span>
                            <span className="text-xs">{t.categoryIcon}</span>
                          </div>
                          <span className="text-[10.5px] text-slate-400 font-medium block truncate">
                            {t.categoryLabel}
                          </span>
                        </div>
                      </div>

                      {/* Trend Rozeti */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {t.badge && (
                          <span
                            className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-full ${
                              t.badgeType === 'hot'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : t.badgeType === 'trend'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.badge}
                          </span>
                        )}
                        <ChevronRight
                          size={14}
                          className="text-slate-400 group-hover:text-[#ff6600] group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B. SON ARAMALAR (GEÇMİŞ) */}
            {recentSearches.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock size={14} className="text-slate-400" />
                    Son Aramalarınız
                  </span>
                  <button
                    type="button"
                    onClick={() => clearAllRecentSearches()}
                    className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    Geçmişi Temizle
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => handleExecuteSearch(term)}
                      className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-full cursor-pointer transition-all border border-slate-200/50"
                    >
                      <Clock size={12} className="text-slate-400 group-hover:text-slate-600" />
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }}
                        className="text-slate-400 hover:text-rose-500 ml-0.5 p-0.5 rounded-full hover:bg-white transition-colors cursor-pointer"
                        title="Kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* C. ÖNCEDEN BAKTIKLARINIZ (KULLANICI DAHA ÖNCE ÜRÜN İNCELEDİYSE) */}
            {recentlyViewedProducts.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock size={14} className="text-[#ff6600]" />
                    Önceden Baktıklarınız
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {recentlyViewedProducts.length} Ürün
                  </span>
                </div>

                <div className="relative group/recent-carousel">
                  {canScrollRecentLeft && (
                    <button
                      type="button"
                      onClick={() => handleScrollRecent('left')}
                      className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  {canScrollRecentRight && (
                    <button
                      type="button"
                      onClick={() => handleScrollRecent('right')}
                      className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}

                  <div
                    ref={recentScrollRef}
                    onScroll={checkRecentScroll}
                    className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
                  >
                    {recentlyViewedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleProductClick(prod)}
                        className={`w-[170px] shrink-0 border bg-white rounded-xl p-2 flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs transition-all group ${
                          selectingProdId === prod.id
                            ? 'border-[#ff0055] ring-2 ring-pink-200 scale-[0.98]'
                            : 'border-slate-200 hover:border-[#ff6600]'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                          <StickerGraphic
                            type={prod.svgType}
                            imageUrl={prod.imageUrl}
                            fit="cover"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#ff6600] transition-colors">
                            {prod.name}
                          </p>
                          <span className="text-xs font-black text-[#ff0055] font-price mt-0.5 block">
                            ₺{prod.currentPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* D. POPÜLER ÜRÜNLER VİTRİNİ */}
            {popularProducts.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500" />
                    Öne Çıkan Popüler Stickerlar
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onViewAllProducts();
                      onClose();
                    }}
                    className="text-xs font-bold text-[#ff0055] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Tümünü Gör <ChevronRight size={13} />
                  </button>
                </div>

                <div className="relative group/pop-carousel">
                  {canScrollLeft && (
                    <button
                      type="button"
                      onClick={() => handleScroll('left')}
                      className="hidden md:flex absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  {canScrollRight && (
                    <button
                      type="button"
                      onClick={() => handleScroll('right')}
                      className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}

                  <div
                    ref={popularScrollRef}
                    onScroll={checkScroll}
                    className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
                  >
                    {popularProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => handleProductClick(prod)}
                        className={`w-[175px] shrink-0 border bg-white rounded-xl p-2 flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs transition-all group ${
                          selectingProdId === prod.id
                            ? 'border-[#ff0055] ring-2 ring-pink-200 scale-[0.98]'
                            : 'border-slate-200 hover:border-[#ff0055]'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                          <StickerGraphic
                            type={prod.svgType}
                            imageUrl={prod.imageUrl}
                            fit="cover"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-800 line-clamp-1 group-hover:text-[#ff0055] transition-colors">
                            {prod.name}
                          </p>
                          <span className="text-xs font-black text-[#ff0055] font-price mt-0.5 block">
                            ₺{prod.currentPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
