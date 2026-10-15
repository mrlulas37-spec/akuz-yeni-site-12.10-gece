import React, { useState, useMemo } from 'react';
import { Heart, ArrowLeft, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Product } from '../types';
import { StickerGraphic } from './StickerGraphic';

interface FavoritesPageProps {
  favoriteProducts: Product[];
  favoriteIds: string[];
  onToggleFavorite: (product: Product) => void;
  onRemoveFavorite: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onGoHome: () => void;
  onNavigateToCatalog: () => void;
}

type FavSortOption = 'recent' | 'price-asc' | 'price-desc' | 'name-asc';

const SORT_OPTIONS: { id: FavSortOption; label: string }[] = [
  { id: 'recent', label: 'Eklenme Sırası' },
  { id: 'price-asc', label: 'Fiyat: Artan (En Düşük)' },
  { id: 'price-desc', label: 'Fiyat: Azalan (En Yüksek)' },
  { id: 'name-asc', label: 'İsim (A - Z)' },
];

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  favoriteProducts,
  onRemoveFavorite,
  onSelectProduct,
  onGoHome,
  onNavigateToCatalog,
}) => {
  const [sortOption, setSortOption] = useState<FavSortOption>('recent');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectingFavId, setSelectingFavId] = useState<string | null>(null);

  const handleSelectFavProduct = (p: Product) => {
    setSelectingFavId(p.id);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(16);
      }
    } catch {}
    setTimeout(() => {
      onSelectProduct(p);
      setSelectingFavId(null);
    }, 150);
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutside = () => setIsSortOpen(false);
    window.addEventListener('click', handleOutside);
    return () => window.removeEventListener('click', handleOutside);
  }, []);

  const sortedProducts = useMemo(() => {
    const items = [...favoriteProducts];
    switch (sortOption) {
      case 'price-asc':
        return items.sort((a, b) => a.currentPrice - b.currentPrice);
      case 'price-desc':
        return items.sort((a, b) => b.currentPrice - a.currentPrice);
      case 'name-asc':
        return items.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
      case 'recent':
      default:
        return items;
    }
  }, [favoriteProducts, sortOption]);

  return (
    <div className={`bg-[#fcfbf9] min-h-[80vh] ${favoriteProducts.length === 0 ? 'pt-1 sm:pt-1.5 pb-6' : 'pt-3 sm:pt-4 pb-8 sm:pb-12'} text-slate-800`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Geri Dön */}
        <div className={`flex items-center gap-2 text-xs text-slate-500 ${favoriteProducts.length === 0 ? 'mb-1 sm:mb-1.5' : 'mb-2.5 sm:mb-3'} font-medium`}>
          <button
            onClick={onGoHome}
            className="hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Ana Sayfa</span>
          </button>
          <span>/</span>
          <span className="text-slate-900 font-bold">Favorilerim</span>
        </div>

        {/* Başlık ve İstatistik Çubuğu */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${favoriteProducts.length === 0 ? 'pb-1.5 sm:pb-2 mb-1.5 sm:mb-2' : 'pb-3 sm:pb-4 mb-4 sm:mb-5'} border-b border-slate-200/80`}>
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-2xs">
                <Heart size={18} className="fill-rose-500" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight">
                  Favorilerim
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  {favoriteProducts.length > 0
                    ? `Listenizde toplam ${favoriteProducts.length} adet beğendiğiniz ürün bulunuyor.`
                    : 'Beğendiğiniz ürünleri burada saklayıp dilediğiniz an inceleyebilirsiniz.'}
                </p>
              </div>
            </div>
          </div>

          {/* Sıralama (Eğer ürün varsa) */}
          {favoriteProducts.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <ArrowUpDown size={14} className="text-slate-500" />
                  <span>{SORT_OPTIONS.find((s) => s.id === sortOption)?.label}</span>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isSortOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 animate-fadeIn">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortOption(opt.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                          sortOption === opt.id
                            ? 'text-rose-600 bg-rose-50/70 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* İÇERİK: BOŞ DURUM VEYA ÜRÜN KARTLARI LİSTESİ */}
        {favoriteProducts.length === 0 ? (
          <div className="max-w-lg mx-auto text-center py-4 sm:py-5 px-4 sm:px-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs mt-0 animate-fadeIn">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-2 shadow-2xs">
              <Heart size={22} className="fill-rose-500" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mb-1">
              Favori Listeniz Henüz Boş
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 mb-4 max-w-sm mx-auto leading-relaxed">
              Koleksiyonumuzdaki Atatürk, araba, motosiklet ve özel tasarım stickerları keşfedin; beğendiklerinizi kalp butonuna tıklayarak buraya kaydedin.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={onNavigateToCatalog}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#ff0055] hover:bg-[#e0004c] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-pink-500/20 transition-all cursor-pointer active:scale-95"
              >
                Kataloğu İncele
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer active:scale-95"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Ürün Kartları Izgarası (Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6">
              {sortedProducts.map((p) => {
                const displayImage =
                  p.images && p.images.length > 0
                    ? p.images[0]
                    : p.imageUrl || '/akuz-logo-badge.png';

                return (
                  <div
                    key={p.id}
                    className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    {/* Görsel Alanı */}
                    <div
                      onClick={() => onSelectProduct(p)}
                      className="relative aspect-square bg-[#fcfbf9] overflow-hidden cursor-pointer flex items-center justify-center p-3 sm:p-4"
                    >
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={p.name}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <StickerGraphic type={p.svgType} className="w-full h-full object-contain" />
                      )}

                      {/* Favoriden Çıkar Butonu (Sağ Üst) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFavorite(p.id);
                        }}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-rose-500 shadow-md flex items-center justify-center hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Favorilerden Çıkar"
                      >
                        <Heart size={16} className="fill-rose-500 text-rose-500" />
                      </button>

                      {/* İndirim Rozeti */}
                      {p.oldPrice && p.oldPrice > p.currentPrice && (
                        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black tracking-wider uppercase shadow-xs">
                          %{Math.round(((p.oldPrice - p.currentPrice) / p.oldPrice) * 100)} İNDİRİM
                        </div>
                      )}
                    </div>

                    {/* Bilgi Alanı */}
                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                      <div
                        onClick={() => handleSelectFavProduct(p)}
                        className="cursor-pointer"
                      >
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {p.category.toUpperCase()}
                        </span>
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-[#ff0055] transition-colors line-clamp-2 mt-0.5">
                          {p.name}
                        </h3>
                      </div>

                      {/* Fiyat & İncele Butonu (Hızlı Sepete Ekle Yerine) */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm sm:text-base font-extrabold text-rose-600 font-price tracking-tight">
                              ₺{p.currentPrice.toFixed(2).replace('.', ',')}
                            </span>
                            {p.oldPrice && (
                              <span className="text-[11px] text-slate-400 line-through font-price font-medium">
                                ₺{p.oldPrice.toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ürünü İncele Butonu (Ölçü/renk seçimi için detay sayfasına yönlendirir) */}
                        <button
                          type="button"
                          onClick={() => handleSelectFavProduct(p)}
                          className={`px-3 py-1.5 text-[11px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                            selectingFavId === p.id
                              ? 'bg-[#ff0055] text-white scale-95 shadow-md'
                              : 'text-slate-700 hover:text-white bg-slate-100 hover:bg-[#ff0055]'
                          }`}
                        >
                          {selectingFavId === p.id ? 'AÇILIYOR…' : 'İNCELE'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
