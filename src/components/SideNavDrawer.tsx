import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  LayoutGrid,
  BookOpen,
  BadgePercent,
  PenTool,
  Car,
  Bike,
  Sparkles,
  Percent,
  Heart,
  ShoppingBag,
  User as UserIcon,
  Package,
  LogOut,
  ChevronRight,
  ChevronDown,
  Phone,
  Flame,
  MapPin,
  Lock,
  Compass,
} from 'lucide-react';
import { AkuzLogo } from './AkuzLogo';
import { UserProfile, Product } from '../types';

interface SideNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  favoritesCount: number;
  cartCount: number;
  onOpenAuth: () => void;
  onOpenAccount: (tab?: 'orders' | 'profile' | 'addresses' | 'password') => void;
  onOpenOrders?: () => void;
  onOpenOrderTracking?: () => void;
  onOpenFavorites: () => void;
  onOpenCart: () => void;
  onSelectCategory?: (category: Product['category'] | 'all') => void;
  onNavigateToCatalog?: (query?: string) => void;
  onLogout?: () => void;
  currentPath?: string;
}

export const SideNavDrawer: React.FC<SideNavDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  favoritesCount,
  cartCount,
  onOpenAuth,
  onOpenAccount,
  onOpenOrders,
  onOpenOrderTracking,
  onOpenFavorites,
  onOpenCart,
  onSelectCategory,
  onNavigateToCatalog,
  onLogout,
  currentPath,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  // Kullanıcı İsteği: Kategorilerin ilk başta kapalı olup tıklandığında aşağı açılması (akordeon)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  // Kullanıcı İsteği: Tıklanan simgelerin turuncu renge bürünerek net algılanması
  const [clickedItemId, setClickedItemId] = useState<string | null>(null);

  // Kullanıcı İsteği: Favorilere veya Hesabıma girildiğinde orda olduğunun belli olması için girdiği yer yansın
  // Favoriler kendi renginde (Rose/Kırmızı parlak neon), Hesap kendi renginde (Safir Mavi parlak neon)
  const isFavoritesActive = Boolean(
    currentPath && (
      currentPath === '/favoriler' ||
      currentPath === '/favorilerim' ||
      currentPath.startsWith('/favoriler')
    )
  );

  const isAccountActive = Boolean(
    currentPath && (
      currentPath === '/hesap' ||
      currentPath === '/hesabim' ||
      currentPath === '/siparislerim' ||
      currentPath === '/adreslerim' ||
      currentPath === '/sifre-degistir' ||
      currentPath === '/giris' ||
      currentPath === '/login' ||
      currentPath === '/kayit' ||
      currentPath === '/sifre-yenile' ||
      currentPath === '/sifremi-unuttum' ||
      currentPath.startsWith('/hesap')
    )
  );

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
      setIsCategoriesOpen(false);
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 480);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSmoothClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsRendered(false);
      setIsClosing(false);
    }, 480);
  };

  useEffect(() => {
    if (!isRendered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSmoothClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isRendered]);

  const navigateWithOrangeFeedback = (itemId: string, action: () => void) => {
    setClickedItemId(itemId);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(18);
      }
    } catch {}
    // 175ms: Müşteri simgenin turuncu yandığını görüp nereye bastığını net anlar, ardından sayfa/panel açılır
    setTimeout(() => {
      handleSmoothClose();
      action();
      setTimeout(() => setClickedItemId(null), 300);
    }, 175);
  };

  const handleCategoryClick = (cat: Product['category'] | 'all') => {
    navigateWithOrangeFeedback(`cat-${cat}`, () => {
      if (onSelectCategory) {
        onSelectCategory(cat);
      } else if (onNavigateToCatalog) {
        onNavigateToCatalog();
      }
    });
  };

  if (!isRendered || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex">
      {/* 1. Yarı Saydam Karartma (Smooth Fade Giriş & Çıkış) */}
      <div
        onClick={handleSmoothClose}
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300 cursor-pointer touch-none ${
          isClosing ? 'opacity-0' : 'opacity-100 animate-drawer-backdrop-in'
        }`}
        aria-hidden="true"
      />

      {/* 2. Yan Menü Paneli (Yandan Kayarak Gelen İpeksi Smooth Menü) */}
      <aside
        className={`relative w-[285px] sm:w-[315px] max-w-[85vw] h-full h-[100dvh] bg-white shadow-2xl flex flex-col justify-between z-10 overflow-hidden overscroll-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isClosing ? '-translate-x-full' : 'translate-x-0 animate-drawer-slide-in-left'
        }`}
        aria-label="Hızlı Gezinme Menüsü"
      >
        {/* Üst Logo ve Kapat Butonu */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#fbfaf6] shrink-0">
          <div className="flex items-center gap-2.5">
            <AkuzLogo size={34} className="drop-shadow-xs" />
            <div>
              <span className="font-black text-xs tracking-wider uppercase text-slate-900 block font-display">
                AKUZ STICKERS
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide">
                Hızlı Menü
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSmoothClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Kapat"
            aria-label="Menüyü Kapat"
          >
            <X size={17} />
          </button>
        </div>

        {/* Kaydırılabilir İçerik Alanı (Tam ekran yüksekliğinde takılmasız akıcı kaydırma) */}
        <div
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="flex-1 overflow-y-auto min-h-0 px-3.5 py-4 space-y-4.5 overscroll-contain touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          
          {/* GRUP 1: HESABIM / GİRİŞ DURUMU */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-1.5">
              HESABIM
            </div>
            {currentUser ? (
              <div className={`rounded-xl p-2.5 border transition-all space-y-1.5 ${
                isAccountActive
                  ? 'border-2 border-blue-500 bg-blue-50/95 shadow-[0_0_18px_rgba(37,99,235,0.45)] animate-glow-account'
                  : 'bg-orange-50/60 border-orange-100'
              }`}>
                <div className="flex items-center gap-2.5 px-1 py-1">
                  <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                    isAccountActive
                      ? 'bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.9)] ring-2 ring-blue-300'
                      : 'bg-[#ff6600] shadow-xs'
                  }`}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs font-bold truncate ${isAccountActive ? 'text-blue-900 font-extrabold' : 'text-slate-900'}`}>{currentUser.name}</p>
                      {isAccountActive && (
                        <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-200/80 px-1.5 py-0.5 rounded-md">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-orange-200/60 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => navigateWithOrangeFeedback('acc-profile', () => onOpenAccount('profile'))}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      clickedItemId === 'acc-profile'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserIcon size={14} className={clickedItemId === 'acc-profile' ? 'text-[#ff6600]' : 'text-slate-500'} />
                      <span>Hesap Bilgilerim</span>
                    </span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateWithOrangeFeedback('acc-addresses', () => onOpenAccount('addresses'))}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      clickedItemId === 'acc-addresses'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className={clickedItemId === 'acc-addresses' ? 'text-[#ff6600]' : 'text-slate-500'} />
                      <span>Teslimat Adreslerim</span>
                    </span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateWithOrangeFeedback('acc-password', () => onOpenAccount('password'))}
                    className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      clickedItemId === 'acc-password'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Lock size={14} className={clickedItemId === 'acc-password' ? 'text-[#ff6600]' : 'text-slate-500'} />
                      <span>Şifre Değiştir</span>
                    </span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  {onOpenOrders && (
                    <button
                      type="button"
                      onClick={() => navigateWithOrangeFeedback('acc-orders', () => onOpenOrders())}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        clickedItemId === 'acc-orders'
                          ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                          : 'text-slate-700 hover:text-[#ff6600] hover:bg-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Package size={14} className={clickedItemId === 'acc-orders' ? 'text-[#ff6600]' : 'text-slate-500'} />
                        <span>Siparişlerim</span>
                      </span>
                      <ChevronRight size={13} className="text-slate-400" />
                    </button>
                  )}

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => navigateWithOrangeFeedback('acc-logout', () => onLogout())}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        clickedItemId === 'acc-logout'
                          ? 'bg-rose-100 text-rose-700 ring-2 ring-rose-500'
                          : 'text-rose-600 hover:bg-rose-50'
                      }`}
                    >
                      <LogOut size={14} />
                      <span>Çıkış Yap</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigateWithOrangeFeedback('auth', onOpenAuth)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group ${
                  isAccountActive
                    ? 'border-2 border-blue-500 bg-blue-50/95 text-blue-700 animate-glow-account shadow-md'
                    : clickedItemId === 'auth'
                    ? 'bg-orange-100 border-[#ff6600] ring-2 ring-[#ff6600] text-[#ff6600]'
                    : 'bg-slate-100 hover:bg-orange-50/80 hover:text-[#ff6600] border-slate-200/80 text-slate-800'
                }`}
              >
                <div className={`flex items-center gap-2.5 text-xs font-bold ${
                  isAccountActive ? 'text-blue-700 font-extrabold' : clickedItemId === 'auth' ? 'text-[#ff6600]' : 'text-slate-800 group-hover:text-[#ff6600]'
                }`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isAccountActive
                      ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.8)]'
                      : clickedItemId === 'auth' ? 'bg-[#ff6600] text-white' : 'bg-slate-200 group-hover:bg-[#ff6600] group-hover:text-white'
                  }`}>
                    <UserIcon size={15} />
                  </div>
                  <span>Giriş Yap / Kayıt Ol</span>
                </div>
                <ChevronRight size={14} className={`transition-colors ${
                  isAccountActive ? 'text-blue-600' : clickedItemId === 'auth' ? 'text-[#ff6600]' : 'text-slate-400 group-hover:text-[#ff6600]'
                }`} />
              </button>
            )}
          </div>

          {/* GRUP 1.5: SİPARİŞ SORGULAMA */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-1.5 flex items-center justify-between">
              <span>SİPARİŞ TAKİBİ</span>
              <span className="text-[9px] text-[#ff6600] font-bold">HIZLI SORGULA</span>
            </div>
            <button
              type="button"
              onClick={() => navigateWithOrangeFeedback('tracking', () => onOpenOrderTracking?.())}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group shadow-2xs ${
                clickedItemId === 'tracking'
                  ? 'bg-orange-100 border-[#ff6600] ring-2 ring-[#ff6600]'
                  : 'bg-orange-50/80 hover:bg-orange-100/70 border-orange-200/90 hover:border-orange-300 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ff6600] text-white flex items-center justify-center shadow-xs shrink-0 transition-colors">
                  <Package size={17} />
                </div>
                <div className="text-left">
                  <div className={`text-xs font-black transition-colors ${
                    clickedItemId === 'tracking' ? 'text-[#ff6600]' : 'text-slate-900 group-hover:text-[#ff6600]'
                  }`}>
                    Sipariş Sorgulama
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Sipariş no ile anlık durum öğren
                  </div>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-[#ff6600]" />
            </button>
          </div>

          {/* GRUP 2: FAVORİLERİM VE SEPET */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-1.5">
              SEPET & FAVORİLER
            </div>
            <div className="space-y-1">
              {/* Favorilerim - Aktifken Gül/Kırmızı Renginde Yanar */}
              <button
                type="button"
                onClick={() => navigateWithOrangeFeedback('favorites', onOpenFavorites)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  isFavoritesActive
                    ? 'border-2 border-rose-500 bg-rose-50/95 text-rose-700 animate-glow-favorites shadow-md font-black'
                    : clickedItemId === 'favorites'
                    ? 'bg-orange-100 ring-2 ring-[#ff6600] text-[#ff6600]'
                    : 'text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Heart
                    size={17}
                    className={
                      isFavoritesActive
                        ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.95)] scale-110'
                        : clickedItemId === 'favorites'
                        ? 'text-[#ff6600] fill-[#ff6600]'
                        : favoritesCount > 0
                        ? 'text-rose-500 fill-rose-500'
                        : 'text-slate-500 group-hover:text-[#ff6600]'
                    }
                  />
                  <span>Favorilerim</span>
                  {isFavoritesActive && (
                    <span className="ml-1 text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-200/80 px-1.5 py-0.5 rounded-md">
                      Aktif
                    </span>
                  )}
                </div>
                {favoritesCount > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-xs ${
                    isFavoritesActive ? 'bg-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.7)]' : 'bg-[#ff6600]'
                  }`}>
                    {favoritesCount}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-normal">Boş</span>
                )}
              </button>

              {/* Sepetim */}
              <button
                type="button"
                onClick={() => navigateWithOrangeFeedback('cart', onOpenCart)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  clickedItemId === 'cart'
                    ? 'bg-orange-100 ring-2 ring-[#ff6600] text-[#ff6600]'
                    : 'text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag
                    size={17}
                    className={clickedItemId === 'cart' ? 'text-[#ff6600]' : cartCount > 0 ? 'text-[#ff6600]' : 'text-slate-500 group-hover:text-[#ff6600]'}
                  />
                  <span>Sepetim</span>
                </div>
                {cartCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ff6600] text-white shadow-xs">
                    {cartCount} ürün
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-normal">Boş</span>
                )}
              </button>
            </div>
          </div>

          {/* GRUP 3: KATEGORİLER (Açılır-Kapanır Akordeon Menü) */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-1.5 flex items-center justify-between">
              <span>KATEGORİLER</span>
              <span className="text-[9px] text-[#ff6600] font-bold">AKUZ KATALOG</span>
            </div>

            {/* Kategoriler Aç/Kapat Akordeon Başlığı */}
            <button
              type="button"
              onClick={() => {
                try {
                  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                    navigator.vibrate?.(12);
                  }
                } catch {}
                setIsCategoriesOpen((prev) => !prev);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer group select-none ${
                isCategoriesOpen
                  ? 'bg-orange-50/90 border-orange-300 ring-2 ring-orange-200/80 shadow-xs'
                  : 'bg-slate-50 hover:bg-orange-50/60 border-slate-200/90 hover:border-orange-200 text-slate-800'
              }`}
              aria-expanded={isCategoriesOpen}
              aria-label="Kategorileri Göster veya Gizle"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isCategoriesOpen
                      ? 'bg-[#ff6600] text-white shadow-xs'
                      : 'bg-orange-100/80 text-[#ff6600] group-hover:bg-[#ff6600] group-hover:text-white'
                  }`}
                >
                  <LayoutGrid size={16} />
                </div>
                <div className="text-left">
                  <span
                    className={`block text-xs font-bold transition-colors ${
                      isCategoriesOpen ? 'text-[#ff6600]' : 'text-slate-800 group-hover:text-[#ff6600]'
                    }`}
                  >
                    Kategoriler
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium">
                    {isCategoriesOpen ? 'Kategorileri gizle' : 'Tüm kategorileri göster'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                    isCategoriesOpen
                      ? 'bg-[#ff6600] text-white'
                      : 'bg-slate-200/80 text-slate-600 group-hover:bg-orange-100 group-hover:text-[#ff6600]'
                  }`}
                >
                  8
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ease-out ${
                    isCategoriesOpen ? 'rotate-180 text-[#ff6600]' : 'text-slate-400 group-hover:text-[#ff6600]'
                  }`}
                />
              </div>
            </button>

            {/* Açılır / Kapanır Kategori Listesi (Smooth Accordion Grid Animation) */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                isCategoriesOpen ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
              }`}
            >
              <div className="overflow-hidden">
                <div className="pl-2 space-y-0.5 border-l-2 border-orange-200 ml-3.5 my-1">
                  {/* 1. Tüm Ürünler */}
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('all')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer group ${
                      clickedItemId === 'cat-all'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-800 hover:text-[#ff6600] hover:bg-orange-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-slate-500 group-hover:text-[#ff6600]" />
                      <span>Katalog (Tüm Ürünler)</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
                  </button>

                  {/* 2. İndirimli Fırsatlar */}
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('discount')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer group ${
                      clickedItemId === 'cat-discount'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BadgePercent size={14} className="text-rose-500" />
                      <span>İndirimli Fırsatlar</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
                  </button>

                  {/* 3. Atatürk Stickerları (Parıldayan Altın Şerit) */}
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('ataturk')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer group ${
                      clickedItemId === 'cat-ataturk'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Flame size={14} className="text-amber-500" />
                      <span className="font-bold">
                        <span className="animate-ataturk-gold-shimmer">Atatürk</span> Stickerları
                      </span>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
                  </button>

                  {/* 4. Araba Stickerları */}
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('araba')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer group ${
                      clickedItemId === 'cat-araba'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Car size={14} className="text-slate-500 group-hover:text-[#ff6600]" />
                      <span>Araba Stickerları</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
                  </button>

                  {/* 5. Motosiklet Stickerları */}
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('motosiklet')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer group ${
                      clickedItemId === 'cat-motosiklet'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bike size={14} className="text-slate-500 group-hover:text-[#ff6600]" />
                      <span>Motosiklet Stickerları</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
                  </button>

                  {/* 6. Kişiye Özel Stickerlar */}
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('custom')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer group ${
                      clickedItemId === 'cat-custom'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PenTool size={14} className="text-purple-600" />
                      <span>Kişiye Özel Stickerlar</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
                  </button>

                  {/* 7. Off-Road Stickerları */}
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('offroad')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer group ${
                      clickedItemId === 'cat-offroad'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Compass size={14} className="text-emerald-600" />
                      <span>Off-Road Stickerları</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
                  </button>

                  {/* 8. Ayna Stickerları */}
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('ayna')}
                    className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer group ${
                      clickedItemId === 'cat-ayna'
                        ? 'bg-orange-100 text-[#ff6600] ring-2 ring-[#ff6600]'
                        : 'text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded border border-cyan-500 bg-cyan-100/60 flex items-center justify-center text-[9px] font-black text-cyan-700">
                        A
                      </span>
                      <span>Ayna Stickerları</span>
                    </div>
                    <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Alt Kısım Bilgi */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70 text-center">
          <p className="text-[10px] text-slate-400 font-medium">
            © 2026 AKUZ Stickers • Premium Sticker Mağazası
          </p>
        </div>
      </aside>
    </div>,
    document.body
  );
};
