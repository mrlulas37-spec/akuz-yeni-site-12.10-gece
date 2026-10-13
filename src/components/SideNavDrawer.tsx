import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  LayoutGrid,
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
  Phone,
  Flame,
  MapPin,
  Lock,
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
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
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

  if (!isRendered || typeof document === 'undefined') return null;

  const handleCategoryClick = (cat: Product['category'] | 'all') => {
    handleSmoothClose();
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else if (onNavigateToCatalog) {
      onNavigateToCatalog();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex">
      {/* 1. Yarı Saydam Karartma (Smooth Fade Giriş & Çıkış) */}
      <div
        onClick={handleSmoothClose}
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300 cursor-pointer ${
          isClosing ? 'opacity-0' : 'opacity-100 animate-drawer-backdrop-in'
        }`}
        aria-hidden="true"
      />

      {/* 2. Yan Menü Paneli (Yandan Kayarak Gelen İpeksi Smooth Menü) */}
      <aside
        className={`relative w-[285px] sm:w-[315px] max-w-[85vw] h-full h-[100dvh] bg-white shadow-2xl flex flex-col justify-between z-10 overflow-hidden select-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
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

        {/* Kaydırılabilir İçerik Alanı (Tam ekran yüksekliğinde sorunsuz kaydırma) */}
        <div className="flex-1 overflow-y-auto min-h-0 px-3.5 py-4 space-y-4.5 no-scrollbar">
          
          {/* GRUP 1: HESABIM / GİRİŞ DURUMU */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-1.5">
              HESABIM
            </div>
            {currentUser ? (
              <div className="bg-orange-50/60 rounded-xl p-2.5 border border-orange-100 space-y-1.5">
                <div className="flex items-center gap-2.5 px-1 py-1">
                  <div className="w-8 h-8 rounded-full bg-[#ff6600] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-orange-200/60 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleSmoothClose();
                      onOpenAccount('profile');
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#ff6600] hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <UserIcon size={14} className="text-[#ff6600]" />
                      <span>Hesap Bilgilerim</span>
                    </span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSmoothClose();
                      onOpenAccount('addresses');
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#ff6600] hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#ff6600]" />
                      <span>Teslimat Adreslerim</span>
                    </span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleSmoothClose();
                      onOpenAccount('password');
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#ff6600] hover:bg-white rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Lock size={14} className="text-[#ff6600]" />
                      <span>Şifre Değiştir</span>
                    </span>
                    <ChevronRight size={13} className="text-slate-400" />
                  </button>

                  {onOpenOrders && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSmoothClose();
                        onOpenOrders();
                      }}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#ff6600] hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Package size={14} className="text-[#ff6600]" />
                        <span>Siparişlerim</span>
                      </span>
                      <ChevronRight size={13} className="text-slate-400" />
                    </button>
                  )}

                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSmoothClose();
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                onClick={() => {
                  handleSmoothClose();
                  onOpenAuth();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-100 hover:bg-orange-50 hover:text-[#ff6600] border border-slate-200/80 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 text-xs font-bold text-slate-800 group-hover:text-[#ff6600]">
                  <div className="w-7 h-7 rounded-full bg-slate-200 group-hover:bg-[#ff6600] group-hover:text-white flex items-center justify-center transition-colors">
                    <UserIcon size={15} />
                  </div>
                  <span>Giriş Yap / Kayıt Ol</span>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-[#ff6600]" />
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
              onClick={() => {
                handleSmoothClose();
                if (onOpenOrderTracking) onOpenOrderTracking();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-orange-50/80 hover:bg-orange-100/90 border border-orange-200/90 text-slate-800 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#ff6600] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Package size={17} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-black text-slate-900 group-hover:text-[#ff6600] transition-colors">
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
              {/* Favorilerim */}
              <button
                type="button"
                onClick={() => {
                  handleSmoothClose();
                  onOpenFavorites();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Heart
                    size={17}
                    className={favoritesCount > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-500 group-hover:text-[#ff6600]'}
                  />
                  <span>Favorilerim</span>
                </div>
                {favoritesCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    {favoritesCount}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-normal">Boş</span>
                )}
              </button>

              {/* Sepetim */}
              <button
                type="button"
                onClick={() => {
                  handleSmoothClose();
                  onOpenCart();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/70 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag
                    size={17}
                    className={cartCount > 0 ? 'text-[#ff6600]' : 'text-slate-500 group-hover:text-[#ff6600]'}
                  />
                  <span>Sepetim</span>
                </div>
                {cartCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ff6600] text-white">
                    {cartCount} ürün
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-normal">Boş</span>
                )}
              </button>
            </div>
          </div>

          {/* GRUP 3: KATEGORİLER */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-1.5 flex items-center justify-between">
              <span>KATEGORİLER</span>
              <span className="text-[9px] text-[#ff6600] font-bold">AKUZ KATALOG</span>
            </div>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => handleCategoryClick('all')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-slate-800 hover:text-[#ff6600] hover:bg-orange-50/80 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutGrid size={15} className="text-slate-500 group-hover:text-[#ff6600]" />
                  <span>Tüm Ürünler (Katalog)</span>
                </div>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick('araba')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Car size={15} className="text-slate-500 group-hover:text-[#ff6600]" />
                  <span>Araba Stickerları</span>
                </div>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick('motosiklet')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Bike size={15} className="text-slate-500 group-hover:text-[#ff6600]" />
                  <span>Motosiklet Stickerları</span>
                </div>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick('ataturk')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Flame size={15} className="text-red-500" />
                  <span>Atatürk Stickerları</span>
                </div>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick('discount')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Percent size={15} className="text-rose-500" />
                  <span>İndirimli Fırsatlar</span>
                </div>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
              </button>

              <button
                type="button"
                onClick={() => handleCategoryClick('custom')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#ff6600] hover:bg-orange-50/80 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles size={15} className="text-amber-500" />
                  <span>Özel Tasarım & Yazılı</span>
                </div>
                <ChevronRight size={13} className="text-slate-300 group-hover:text-[#ff6600]" />
              </button>
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
