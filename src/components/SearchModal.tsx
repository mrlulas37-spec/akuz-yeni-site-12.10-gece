import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Product } from '../types';
import { SearchDropdownContent } from './SearchDropdownContent';
import { saveRecentSearch } from '../utils/recentSearches';

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

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  products,
  onSelectProduct,
  onViewAllProducts,
  recentlyViewedProducts,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery.trim());
        onViewAllProducts(searchQuery);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    /* SADECE MOBİLDE GÖSTERİLİR (md:hidden) */
    <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden animate-fade-in">
      {/* Üst Arama Çubuğu */}
      <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-white sticky top-0 z-20">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3 text-[#ff0055] pointer-events-none" size={18} strokeWidth={2.4} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ürün veya model ara..."
            className="w-full bg-slate-100 focus:bg-white text-slate-900 placeholder:text-slate-400 text-[16px] rounded-full pl-9 pr-8 py-2.5 border border-transparent focus:border-[#ff0055] focus:ring-2 focus:ring-pink-100 transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 text-xs text-slate-400 hover:text-slate-700 bg-slate-200 w-4 h-4 rounded-full flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-bold text-slate-700 hover:text-[#ff0055] px-2 py-1.5 cursor-pointer"
        >
          Kapat
        </button>
      </div>

      {/* Ekranı Kaplayan İçerik */}
      <div className="flex-1 overflow-y-auto">
        <SearchDropdownContent
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          products={products}
          onSelectProduct={onSelectProduct}
          onViewAllProducts={onViewAllProducts}
          onClose={onClose}
          isMobileFull={true}
          recentlyViewedProducts={recentlyViewedProducts}
        />
      </div>
    </div>
  );
};
