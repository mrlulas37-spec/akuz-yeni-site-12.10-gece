import React, { useRef, useState, useEffect } from 'react';
import { Search, Flame, Clock, Trash2, ChevronRight, X, ChevronLeft } from 'lucide-react';
import { Product } from '../types';
import { StickerGraphic } from './StickerGraphic';
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearAllRecentSearches,
  RECENT_SEARCH_EVENT_NAME,
} from '../utils/recentSearches';

interface SearchDropdownContentProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onViewAllProducts: (customQuery?: string) => void;
  onClose: () => void;
  isMobileFull?: boolean;
  recentlyViewedProducts?: Product[];
}

const DEFAULT_POPULAR_SEARCHES = [
  { term: 'yaramaz çocuk', hasFlame: true },
  { term: 'la familia es todo', hasFlame: true },
  { term: 'atatürk imza', hasFlame: true },
  { term: 'araba sticker', hasFlame: false },
  { term: 'motosiklet', hasFlame: false },
  { term: 'depo kapağı', hasFlame: false },
  { term: 'offroad 4x4', hasFlame: false },
  { term: 'kişiye özel', hasFlame: false },
];

export const SearchDropdownContent: React.FC<SearchDropdownContentProps> = ({
  searchQuery,
  onSearchChange,
  products,
  onSelectProduct,
  onViewAllProducts,
  onClose,
  isMobileFull = false,
  recentlyViewedProducts = [],
}) => {
  const popularScrollRef = useRef<HTMLDivElement>(null);
  const recentScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollRecentLeft, setCanScrollRecentLeft] = useState(false);
  const [canScrollRecentRight, setCanScrollRecentRight] = useState(false);
  const [selectingProdId, setSelectingProdId] = useState<string | null>(null);

  const handleProductClick = (prod: Product) => {
    setSelectingProdId(prod.id);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(15);
      }
    } catch {}
    setTimeout(() => {
      onSelectProduct(prod);
      onClose();
      setSelectingProdId(null);
    }, 140);
  };

  // Son aramalar (Local Storage - gerçek kullanıcı aramaları)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());

  useEffect(() => {
    const handleUpdate = () => {
      setRecentSearches(getRecentSearches());
    };
    window.addEventListener(RECENT_SEARCH_EVENT_NAME, handleUpdate);
    return () => window.removeEventListener(RECENT_SEARCH_EVENT_NAME, handleUpdate);
  }, []);

  const handleRemoveRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    removeRecentSearch(termToRemove);
  };

  const handleClearAllRecentSearches = () => {
    clearAllRecentSearches();
  };

  const popularProducts = products.filter((p) => p.isPopular).slice(0, 6);
  const displayProducts = popularProducts.length > 0 ? popularProducts : products.slice(0, 6);

  const searchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const checkScroll = () => {
    if (!popularScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = popularScrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [displayProducts]);

  const handleScroll = (dir: 'left' | 'right') => {
    if (!popularScrollRef.current) return;
    popularScrollRef.current.scrollBy({
      left: dir === 'left' ? -240 : 240,
      behavior: 'smooth',
    });
  };

  const checkRecentScroll = () => {
    if (!recentScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = recentScrollRef.current;
    setCanScrollRecentLeft(scrollLeft > 10);
    setCanScrollRecentRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkRecentScroll();
  }, [recentlyViewedProducts]);

  const handleScrollRecent = (dir: 'left' | 'right') => {
    if (!recentScrollRef.current) return;
    recentScrollRef.current.scrollBy({
      left: dir === 'left' ? -240 : 240,
      behavior: 'smooth',
    });
  };

  const handleExecuteSearch = (term: string) => {
    saveRecentSearch(term);
    onSearchChange(term);
    onViewAllProducts(term);
    onClose();
  };

  return (
    <div className={`flex flex-col bg-white text-slate-800 ${isMobileFull ? 'h-full overflow-y-auto p-4' : 'p-4 sm:p-5 max-h-[70vh] overflow-y-auto'}`}>
      {/* 1. EĞER ARAMA YAZILIYORSA: ANLIK SONUÇLAR */}
      {searchQuery.trim().length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Arama Sonuçları ({searchResults.length})
            </span>
            <button
              type="button"
              onClick={() => handleExecuteSearch(searchQuery)}
              className="text-xs font-bold text-[#ff0055] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Tümünü Gör <ChevronRight size={13} />
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-sm">
              "{searchQuery}" ile eşleşen bir ürün bulunamadı.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {searchResults.slice(0, 5).map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => {
                    saveRecentSearch(prod.name);
                    handleProductClick(prod);
                  }}
                  className={`flex items-center gap-3 py-2.5 rounded-xl px-2 cursor-pointer transition-all group ${
                    selectingProdId === prod.id
                      ? 'bg-pink-50/80 scale-[0.985] ring-1 ring-[#ff0055]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1 border border-slate-200/60">
                    <StickerGraphic
                      type={prod.svgType}
                      imageUrl={prod.imageUrl}
                      fit="cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-[#ff0055] transition-colors truncate">
                      {prod.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{prod.description}</p>
                    <p className="text-xs font-extrabold text-[#ff0055] font-price mt-0.5">
                      ₺{prod.currentPrice.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-1 group-hover:text-[#ff0055] transition-all" />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* 2. BOŞKEN: SON ARAMALAR -> POPÜLER ARAMALAR -> EN AŞAĞIDA POPÜLER ÜRÜNLER */
        <div className="space-y-5">
          {/* A. Son Aramalar */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-400" />
                  Son Aramalar
                </span>
                <button
                  type="button"
                  onClick={handleClearAllRecentSearches}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                  Temizle
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    onClick={() => handleExecuteSearch(term)}
                    className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-full cursor-pointer transition-all border border-slate-200/50"
                  >
                    <Clock size={12} className="text-slate-400 group-hover:text-slate-600" />
                    <span>{term}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRecentSearch(e, term)}
                      className="text-slate-400 hover:text-rose-500 ml-0.5 p-0.5 rounded-full hover:bg-white transition-colors"
                      title="Sil"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* B. Popüler Aramalar */}
          <div>
            <span className="block text-xs font-bold text-slate-700 mb-2">
              Popüler Aramalar
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {DEFAULT_POPULAR_SEARCHES.map((item) => (
                <button
                  key={item.term}
                  type="button"
                  onClick={() => handleExecuteSearch(item.term)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                    item.hasFlame
                      ? 'bg-amber-50/70 border-amber-200/80 text-amber-950 hover:bg-amber-100 hover:border-amber-300'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50'
                  } shadow-2xs hover:shadow-xs active:scale-95`}
                >
                  {item.hasFlame && (
                    <Flame size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
                  )}
                  <span>{item.term}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Önceden Baktıklarınız (Sadece kullanıcı daha önce bir ürüne baktıysa görünür, bakmadıysa yazısı ve bölümü tamamen gizlenir) */}
          {recentlyViewedProducts && recentlyViewedProducts.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
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
                    className="hidden md:flex absolute -left-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                    title="Önceki"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                {canScrollRecentRight && (
                  <button
                    type="button"
                    onClick={() => handleScrollRecent('right')}
                    className="hidden md:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                    title="Sonraki"
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
                      className={`w-[185px] shrink-0 border bg-white rounded-xl p-2 flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-md transition-all group ${
                        selectingProdId === prod.id
                          ? 'border-[#ff0055] ring-2 ring-[#ff0055]/30 scale-[0.98]'
                          : 'border-slate-200 hover:border-[#ff6600]'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-lg bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                        <StickerGraphic
                          type={prod.svgType}
                          imageUrl={prod.imageUrl}
                          fit="cover"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#ff6600] transition-colors">
                          {prod.name}
                        </p>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xs font-extrabold text-[#ff0055] font-price">
                            ₺{prod.currentPrice.toFixed(2).replace('.', ',')}
                          </span>
                          {prod.oldPrice > prod.currentPrice && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ₺{prod.oldPrice.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* C. Popüler Ürünler (En Aşağıda) */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                Popüler Ürünler
              </span>
              <button
                type="button"
                onClick={() => {
                  onViewAllProducts();
                  onClose();
                }}
                className="text-xs font-bold text-[#ff0055] hover:text-[#d90048] flex items-center gap-0.5 cursor-pointer"
              >
                Tümünü Gör
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="relative group/carousel">
              {canScrollLeft && (
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="hidden md:flex absolute -left-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                  title="Önceki"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              {canScrollRight && (
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="hidden md:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                  title="Sonraki"
                >
                  <ChevronRight size={16} />
                </button>
              )}

              <div
                ref={popularScrollRef}
                onScroll={checkScroll}
                className="flex items-stretch gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
              >
                {displayProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleProductClick(prod)}
                    className={`w-[185px] shrink-0 border bg-white rounded-xl p-2 flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-md transition-all group ${
                      selectingProdId === prod.id
                        ? 'border-[#ff0055] ring-2 ring-[#ff0055]/30 scale-[0.98]'
                        : 'border-slate-200 hover:border-[#ff0055]/50'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center border border-slate-100">
                      <StickerGraphic
                        type={prod.svgType}
                        imageUrl={prod.imageUrl}
                        fit="cover"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-[#ff0055] transition-colors">
                        {prod.name}
                      </p>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-xs font-extrabold text-[#ff0055] font-price">
                          ₺{prod.currentPrice.toFixed(2).replace('.', ',')}
                        </span>
                        {prod.oldPrice && (
                          <span className="text-[10px] text-slate-400 line-through font-price font-medium">
                            ₺{prod.oldPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
