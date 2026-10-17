import React, { useState, useRef, useEffect } from 'react';
import { Search, Heart, ShoppingBag, User as UserIcon, Package, LogOut, Shield, Menu, MapPin, Lock } from 'lucide-react';
import { AkuzLogo } from './AkuzLogo';
import { UserProfile, Product, SiteSettings } from '../types';
import { SearchDropdownContent } from './SearchDropdownContent';
import { SideNavDrawer } from './SideNavDrawer';
import { saveRecentSearch } from '../utils/recentSearches';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoritesCount: number;
  cartCount: number;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenAccount: (tab?: 'orders' | 'profile' | 'addresses' | 'password') => void;
  onOpenOrders?: () => void;
  onOpenOrderTracking?: () => void;
  onLogout?: () => void;
  onOpenFavorites: () => void;
  onOpenCart: () => void;
  onOpenSearch?: () => void;
  onScrollToTop?: () => void;
  currentPath?: string;
  onNavigateToCatalog?: (customQuery?: string) => void;
  onSelectCategory?: (category: Product['category'] | 'all') => void;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  recentlyViewedProducts?: Product[];
  siteSettings?: SiteSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  favoritesCount,
  cartCount,
  currentUser,
  onOpenAuth,
  onOpenAccount,
  onOpenOrders,
  onOpenOrderTracking,
  onLogout,
  onOpenFavorites,
  onOpenCart,
  onOpenSearch,
  onScrollToTop,
  currentPath = '/',
  onNavigateToCatalog,
  onSelectCategory,
  products = [],
  onSelectProduct,
  recentlyViewedProducts = [],
  siteSettings,
}) => {
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const accountMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleAccountMouseEnter = () => {
    // Mobilde ve dokunmatik cihazlarda hover penceresi açılmasın (sadece masaüstü lg: 1024px ve üzeri)
    if (window.innerWidth < 1024) return;
    if (accountMenuTimeoutRef.current) {
      clearTimeout(accountMenuTimeoutRef.current);
      accountMenuTimeoutRef.current = null;
    }
    setIsAccountMenuOpen(true);
  };

  const handleAccountMouseLeave = () => {
    if (window.innerWidth < 1024) return;
    accountMenuTimeoutRef.current = setTimeout(() => {
      setIsAccountMenuOpen(false);
    }, 200);
  };

  // Close desktop dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDesktopDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchClick = () => {
    // If mobile (< 768px), open full screen modal
    if (window.innerWidth < 768) {
      if (onOpenSearch) onOpenSearch();
    } else {
      // Desktop: Open downward dropdown
      setIsDesktopDropdownOpen(true);
      searchInputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        saveRecentSearch(searchQuery.trim());
        setIsDesktopDropdownOpen(false);
        if (onNavigateToCatalog) {
          onNavigateToCatalog(searchQuery);
        }
      }
    } else if (e.key === 'Escape') {
      setIsDesktopDropdownOpen(false);
      searchInputRef.current?.blur();
    }
  };
  const handleLogoClick = () => {
    // Arama ve filtreleri sıfırla
    if (onSearchChange) onSearchChange('');

    if (currentPath !== '/') {
      // 1. Ana sayfa dışında bir yerde (ürün, sepet, hesap vb.) iken basılırsa: Ana sayfaya atsın
      if (onScrollToTop) {
        onScrollToTop();
      } else {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // 2. Zaten ana sayfada iken o logoya basılırsa: Sayfa reload atsın sitenin açılış animasyonuyla
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.dispatchEvent(new CustomEvent('akuz:play-loader'));
    }
  };

  // Kullanıcı İsteği: Tıklanan simgelerin turuncu olup 175ms sonra açılması (nereye tıklandığının telefonda net anlaşılması)
  const [activeOrangeIcon, setActiveOrangeIcon] = useState<string | null>(null);
  const triggerOrangeAction = (iconName: string, action?: () => void) => {
    setActiveOrangeIcon(iconName);
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(18);
      }
    } catch {}
    if (action) {
      // 175ms: Kullanıcı telefonda nereye dokunduğunu net anlar, ardından sayfa/panel açılır
      setTimeout(() => {
        action();
      }, 175);
    }
    setTimeout(() => {
      setActiveOrangeIcon((cur) => (cur === iconName ? null : cur));
    }, 450);
  };

  const freeThreshold = typeof siteSettings?.freeShippingThreshold === 'number'
    ? siteSettings.freeShippingThreshold
    : (siteSettings?.freeShippingThreshold !== undefined && !isNaN(Number(siteSettings.freeShippingThreshold)) ? Number(siteSettings.freeShippingThreshold) : 150);
  const currentFee = typeof siteSettings?.shippingFee === 'number'
    ? siteSettings.shippingFee
    : (siteSettings?.shippingFee !== undefined && !isNaN(Number(siteSettings.shippingFee)) ? Number(siteSettings.shippingFee) : 39.9);

  const shippingTickerText = (currentFee === 0 || freeThreshold === 0)
    ? 'Tüm Siparişlerde Kargo Bedava!'
    : freeThreshold >= 999999
    ? `Sabit Kargo: ₺${currentFee.toFixed(2).replace('.', ',')}`
    : `${freeThreshold.toFixed(0)} TL ve Üzeri Ücretsiz Kargo!`;

  const TOP_TICKER_ITEMS = [
    { text: 'Açılışa Özel Tüm Ürünlerde %35 İndirim!', badge: '🎉 AÇILIŞA ÖZEL' },
    { text: shippingTickerText, badge: '🚚 ÜCRETSİZ KARGO' },
    { text: 'Açılışa Özel Tüm Ürünlerde %35 İndirim!', badge: '🎉 AÇILIŞA ÖZEL' },
    { text: shippingTickerText, badge: '🚚 ÜCRETSİZ KARGO' },
    { text: 'Açılışa Özel Tüm Ürünlerde %35 İndirim!', badge: '🎉 AÇILIŞA ÖZEL' },
    { text: shippingTickerText, badge: '🚚 ÜCRETSİZ KARGO' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#f8f6f0]/95 backdrop-blur-md border-b border-[#e5e2d8] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      {/* 0. SAYFANIN EN ÜSTÜNDEKİ TURUNCU ŞERİT (Sağdan Sola Doğru Orta Yavaşlıkta %20 Daha Yavaş Akan Döngü) */}
      <div className="w-full bg-[#ff6600] text-white py-1.5 sm:py-2 overflow-hidden relative shadow-xs border-b border-orange-700/30 select-none">
        <div className="flex items-center gap-10 sm:gap-14 w-max animate-top-ticker-rtl">
          {TOP_TICKER_ITEMS.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 sm:gap-3 shrink-0 whitespace-nowrap">
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] sm:text-[11px] font-black tracking-wider">
                {item.badge}
              </span>
              <span className="text-xs sm:text-sm font-black tracking-wide text-white drop-shadow-xs">
                {item.text}
              </span>
              <span className="text-orange-200/70 text-xs ml-1">•</span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 1. ÜST SATIR: Sol Büyütülmüş Logo ve Sağ Butonlar (Ferah ve Dikkat Çekici) */}
        <div className="flex items-center justify-between h-[74px] sm:h-[88px] md:h-[104px] gap-4">
          
          {/* 1. Sol: Büyütülmüş Logo */}
          <div
            onClick={() => triggerOrangeAction('logo', handleLogoClick)}
            className={`flex items-center cursor-pointer shrink-0 group select-none relative active:scale-95 transition-all pl-0.5 sm:pl-1 ${
              activeOrangeIcon === 'logo' ? 'drop-shadow-[0_0_16px_rgba(255,102,0,0.7)] scale-105' : ''
            }`}
            title="Sayfayı Yenile & Ana Sayfa"
          >
            <AkuzLogo className="w-[62px] h-[62px] sm:w-[78px] sm:h-[78px] md:w-[94px] md:h-[94px] lg:w-[104px] lg:h-[104px] drop-shadow-sm transition-transform duration-200 group-hover:scale-105" />
          </div>

          {/* 2. Sağ: Giriş Yap / Hesabım, Favoriler, Sepet (Rahat ve Ferah) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3.5 shrink-0">
            {/* Giriş Yap / Hesabım Butonu */}
            {currentUser ? (
              <div
                className="relative"
                onMouseEnter={handleAccountMouseEnter}
                onMouseLeave={handleAccountMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => {
                    triggerOrangeAction('account', () => {
                      if (window.innerWidth >= 1024) {
                        setIsAccountMenuOpen((prev) => !prev);
                      } else {
                        onOpenAccount();
                      }
                    });
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/60 transition-all group cursor-pointer text-xs sm:text-sm font-semibold ${
                    activeOrangeIcon === 'account'
                      ? 'ring-2 ring-[#ff6600] bg-orange-50/80 shadow-md scale-105 text-[#ff6600]'
                      : ''
                  }`}
                  title="Hesap Paneli & Menüsü"
                >
                  <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-sm transition-all ${
                    activeOrangeIcon === 'account'
                      ? 'bg-[#ff6600] shadow-[0_0_12px_rgba(255,102,0,0.8)] scale-110'
                      : 'bg-gradient-to-tr from-[#ff6600] to-orange-500'
                  }`}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:flex flex-col text-left leading-tight">
                    <span className="text-[10px] text-slate-400 font-medium">Hesabım</span>
                    <span className={`text-xs font-bold truncate max-w-[90px] transition-colors ${
                      activeOrangeIcon === 'account' ? 'text-[#ff6600]' : 'text-slate-800 group-hover:text-[#ff6600]'
                    }`}>{currentUser.name.split(' ')[0]}</span>
                  </div>
                </button>

                {/* Hesabım Hover Dropdown Penceresi (Sadece Masaüstünde Görünür) */}
                {isAccountMenuOpen && (
                  <div className="hidden lg:block absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 top-full pt-2 z-50 animate-fadeIn">
                    {/* Üstteki beyaz ok üçgeni */}
                    <div className="relative">
                      <div className="w-3.5 h-3.5 bg-white border-t border-l border-slate-200/90 rotate-45 mx-auto -mb-2 z-10 relative shadow-[-2px_-2px_4px_rgba(0,0,0,0.02)]" />
                      
                      {/* Kart İçeriği */}
                      <div className="w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3 overflow-hidden text-left relative z-20">
                        {/* 1. Gmail Başlığı (Turuncu / Vurgulu Renk) */}
                        <div className="px-3 py-2.5 border-b border-slate-100">
                          <p className="text-xs font-extrabold text-[#ff6600] truncate" title={currentUser.email}>
                            {currentUser.email}
                          </p>
                        </div>

                        {/* Menü Öğeleri */}
                        <div className="py-1">
                          {/* 2. Siparişlerim */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              if (onOpenOrders) {
                                onOpenOrders();
                              } else {
                                onOpenAccount();
                              }
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/60 rounded-xl transition-colors cursor-pointer group"
                          >
                            <Package size={17} className="text-slate-500 group-hover:text-[#ff6600] transition-colors" />
                            <span>Siparişlerim</span>
                          </button>

                          {/* Favorilerim */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              onOpenFavorites();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/60 rounded-xl transition-colors cursor-pointer group"
                          >
                            <Heart size={17} className="text-slate-500 group-hover:text-[#ff6600] transition-colors" />
                            <span>Favorilerim ({favoritesCount})</span>
                          </button>

                          {/* 3. Hesap Bilgileri */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              onOpenAccount('profile');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/60 rounded-xl transition-colors cursor-pointer group"
                          >
                            <UserIcon size={16} className="text-slate-500 group-hover:text-[#ff6600] transition-colors" />
                            <span>Hesap Bilgilerim</span>
                          </button>

                          {/* 4. Adreslerim */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              onOpenAccount('addresses');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/60 rounded-xl transition-colors cursor-pointer group"
                          >
                            <MapPin size={16} className="text-slate-500 group-hover:text-[#ff6600] transition-colors" />
                            <span>Adreslerim</span>
                          </button>

                          {/* 5. Şifre Değiştir */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              onOpenAccount('password');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/60 rounded-xl transition-colors cursor-pointer group"
                          >
                            <Lock size={16} className="text-slate-500 group-hover:text-[#ff6600] transition-colors" />
                            <span>Şifre Değiştir</span>
                          </button>

                          {/* 4. Çıkış Yap */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsAccountMenuOpen(false);
                              if (onLogout) onLogout();
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/70 rounded-xl transition-colors cursor-pointer group"
                          >
                            <LogOut size={17} className="text-slate-500 group-hover:text-[#ff6600] transition-colors" />
                            <span>Çıkış Yap</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => triggerOrangeAction('auth', onOpenAuth)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/70 transition-all group cursor-pointer ${
                  activeOrangeIcon === 'auth'
                    ? 'ring-2 ring-[#ff6600] bg-orange-50/90 shadow-[0_0_15px_rgba(255,102,0,0.6)] scale-105 text-[#ff6600]'
                    : ''
                }`}
                title="Giriş Yap / Üye Ol"
              >
                <UserIcon
                  size={21}
                  className={`transition-all ${
                    activeOrangeIcon === 'auth'
                      ? 'text-[#ff6600] drop-shadow-[0_0_10px_rgba(255,102,0,0.8)] scale-110'
                      : 'text-slate-600 group-hover:text-[#ff6600]'
                  }`}
                />
                <span className={`hidden md:inline-block text-xs sm:text-sm font-semibold transition-colors ${
                  activeOrangeIcon === 'auth' ? 'text-[#ff6600]' : 'group-hover:text-[#ff6600]'
                }`}>
                  Giriş Yap
                </span>
              </button>
            )}

            {/* Favoriler (Kalp) İkonu ve Yazısı - Turuncu Tıklama Etkileşimi */}
            <button
              onClick={() => triggerOrangeAction('favorites', onOpenFavorites)}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/70 transition-all group cursor-pointer ${
                activeOrangeIcon === 'favorites'
                  ? 'ring-2 ring-[#ff6600] bg-orange-50/90 shadow-[0_0_15px_rgba(255,102,0,0.6)] scale-105 text-[#ff6600]'
                  : ''
              }`}
              title="Favorilerim"
            >
              <div className="relative flex items-center justify-center">
                <Heart
                  size={21}
                  className={`transition-all ${
                    activeOrangeIcon === 'favorites'
                      ? 'text-[#ff6600] fill-[#ff6600] drop-shadow-[0_0_12px_rgba(255,102,0,0.9)] scale-120'
                      : favoritesCount > 0
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-slate-600 group-hover:text-[#ff6600]'
                  }`}
                />
                {favoritesCount > 0 && (
                  <span className={`absolute -top-1.5 -right-2 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-scale transition-colors ${
                    activeOrangeIcon === 'favorites' ? 'bg-[#ff6600]' : 'bg-rose-500'
                  }`}>
                    {favoritesCount}
                  </span>
                )}
              </div>
              <span className={`hidden md:inline-block text-xs sm:text-sm font-semibold transition-colors ${
                activeOrangeIcon === 'favorites' ? 'text-[#ff6600]' : 'group-hover:text-[#ff6600]'
              }`}>
                Favoriler
              </span>
            </button>

            {/* Sepet İkonu ve Yazısı - Turuncu Tıklama Etkileşimi */}
            <button
              onClick={() => triggerOrangeAction('cart', onOpenCart)}
              className={`relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/70 transition-all group cursor-pointer ${
                activeOrangeIcon === 'cart'
                  ? 'ring-2 ring-[#ff6600] bg-orange-50/90 shadow-[0_0_18px_rgba(255,102,0,0.7)] scale-105 text-[#ff6600]'
                  : ''
              }`}
              title="Sepetim"
            >
              <div className="relative flex items-center justify-center">
                <ShoppingBag
                  size={23}
                  className={`transition-all stroke-[2.3] ${
                    activeOrangeIcon === 'cart'
                      ? 'text-[#ff6600] drop-shadow-[0_0_14px_rgba(255,102,0,0.95)] scale-120'
                      : 'text-[#ff6600] drop-shadow-[0_0_8px_rgba(255,102,0,0.65)] group-hover:drop-shadow-[0_0_12px_rgba(255,102,0,0.9)] group-hover:scale-110'
                  }`}
                />
                {cartCount > 0 && (
                  <span className={`absolute -top-1.5 -right-2 min-w-4 h-4 px-1 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-scale transition-colors bg-[#ff6600] shadow-orange-500/50`}>
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`hidden md:inline-block text-xs sm:text-sm font-bold transition-colors ${
                activeOrangeIcon === 'cart' ? 'text-[#ff6600]' : 'text-slate-800 group-hover:text-[#ff6600]'
              }`}>
                Sepetim
              </span>
            </button>
          </div>
        </div>

        {/* 2. ALT SATIR: ARAMA ÇUBUĞU VE SOLUNDA 3 ÇİZGİLİ MENÜ SEMBOLÜ (%15 Küçültülmüş) */}
        <div className="pb-2.5 pt-0.5 sm:pb-3 max-w-2xl mx-auto w-full px-1 sm:px-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Arama çubuğunun solundaki 3 Çizgili Menü Butonu - Turuncu Etkileşim (%15 Daha Kompakt) */}
            <button
              type="button"
              onClick={() => triggerOrangeAction('menu', () => setIsSideMenuOpen(true))}
              className={`shrink-0 flex items-center justify-center gap-1 px-2.5 py-2 sm:py-2.5 rounded-full text-slate-800 bg-[#eeece3] hover:bg-[#eae7dc] active:bg-[#dbd8cc] border shadow-xs active:scale-95 transition-all cursor-pointer group ${
                activeOrangeIcon === 'menu'
                  ? 'border-[#ff6600] ring-2 ring-[#ff6600] bg-orange-50 shadow-[0_0_16px_rgba(255,102,0,0.6)] text-[#ff6600]'
                  : 'border-[#dbd8cc] hover:border-[#cfcbc0]'
              }`}
              title="Kategoriler, Hesabım, Favorilerim, Sepet"
              aria-label="Hızlı Menüyü Aç"
            >
              <Menu
                size={15}
                className={`transition-all ${
                  activeOrangeIcon === 'menu'
                    ? 'text-[#ff6600] drop-shadow-[0_0_10px_rgba(255,102,0,0.8)] scale-110'
                    : 'text-slate-800 group-hover:text-[#ff6600]'
                }`}
              />
              <span className={`text-[11px] font-bold transition-colors hidden sm:inline ${
                activeOrangeIcon === 'menu' ? 'text-[#ff6600]' : 'text-slate-700 group-hover:text-[#ff6600]'
              }`}>
                Menü
              </span>
            </button>

            {/* Arama Çubuğu (%15 Daha Kompakt) */}
            <div ref={searchContainerRef} className="flex-1 relative min-w-0">
              <div
                onClick={handleSearchClick}
                className={`relative flex items-center transition-all ${
                  isDesktopDropdownOpen
                    ? 'ring-2 ring-orange-200 shadow-md rounded-full'
                    : ''
                }`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onKeyDown={handleKeyDown}
                  onClick={handleSearchClick}
                  onFocus={handleSearchClick}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setIsDesktopDropdownOpen(true);
                  }}
                  placeholder="Sticker Ara…"
                  className={`w-full bg-[#eeece3] hover:bg-[#eae7dc] focus:bg-white text-slate-900 placeholder:text-slate-500 text-sm md:text-[13px] rounded-full pl-9 sm:pl-10 pr-8 py-2 sm:py-2.5 border transition-all outline-none shadow-xs ${
                    isDesktopDropdownOpen
                      ? 'border-[#ff6600] bg-white shadow-md'
                      : 'border-[#dbd8cc]'
                  }`}
                />
                <Search
                  size={15}
                  className={`absolute left-3 sm:left-3.5 pointer-events-none transition-colors ${
                    isDesktopDropdownOpen ? 'text-[#ff6600]' : 'text-slate-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSearchChange('');
                    }}
                    className="absolute right-3 text-[10px] text-slate-400 hover:text-slate-700 bg-slate-200/90 hover:bg-slate-300 w-4.5 h-4.5 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                    title="Temizle"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* BİLGİSAYARDA ARAMA ÇUBUĞUNUN ALTINA DOĞRU AÇILAN PENCERE (DROPDOWN) */}
              {isDesktopDropdownOpen && (
                <div className="hidden md:block absolute left-0 right-0 top-full mt-2 bg-[#fdfcf9] rounded-2xl shadow-2xl border border-[#e2dfd4] z-50 overflow-hidden animate-slide-down">
                  <SearchDropdownContent
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    products={products}
                    recentlyViewedProducts={recentlyViewedProducts}
                    onSelectProduct={(p) => {
                      setIsDesktopDropdownOpen(false);
                      if (onSelectProduct) onSelectProduct(p);
                    }}
                    onViewAllProducts={(customQuery) => {
                      const q = customQuery || searchQuery;
                      if (q && q.trim()) {
                        saveRecentSearch(q.trim());
                      }
                      setIsDesktopDropdownOpen(false);
                      if (onNavigateToCatalog) onNavigateToCatalog(q);
                    }}
                    onClose={() => setIsDesktopDropdownOpen(false)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 3 Çizgili Sembole Tıklanınca Açılan Yan Çekmece Menü */}
      <SideNavDrawer
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        currentUser={currentUser}
        favoritesCount={favoritesCount}
        cartCount={cartCount}
        onOpenAuth={onOpenAuth}
        onOpenAccount={onOpenAccount}
        onOpenOrders={onOpenOrders}
        onOpenOrderTracking={onOpenOrderTracking}
        onOpenFavorites={onOpenFavorites}
        onOpenCart={onOpenCart}
        onSelectCategory={onSelectCategory}
        onNavigateToCatalog={onNavigateToCatalog}
        onLogout={onLogout}
      />
    </header>
  );
};
