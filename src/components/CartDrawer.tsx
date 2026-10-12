import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  Plus,
  Minus,
  ArrowRight,
  CheckCircle2,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { CartItem, SiteSettings } from '../types';
import { StickerGraphic } from './StickerGraphic';
import { calculateItemUnitPrice } from '../utils/pricingHelper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onGoToCartPage: () => void;
  siteSettings?: SiteSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onGoToCartPage,
  siteSettings,
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

  if (!isRendered) return null;

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const getItemPrice = (item: CartItem) => {
    return item.calculatedPrice ?? calculateItemUnitPrice(item.product, item.selectedDimension, item.customText);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  const freeShippingThreshold = siteSettings?.freeShippingThreshold ?? 150;
  const standardShippingFee = siteSettings?.shippingFee ?? 39.9;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingFee = (subtotal >= freeShippingThreshold || subtotal === 0 || standardShippingFee === 0) ? 0 : standardShippingFee;
  const grandTotal = subtotal + shippingFee;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 1. Yarı Saydam Karartma (Smooth Fade Giriş & Çıkış) */}
      <div
        onClick={handleSmoothClose}
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 cursor-pointer ${
          isClosing ? 'opacity-0' : 'opacity-100 animate-drawer-backdrop-in'
        }`}
        aria-hidden="true"
      />

      {/* 2. Sepet Çekmecesi (Sağdan Kayarak Gelen İpeksi Smooth Panel) */}
      <div
        className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 z-10 select-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isClosing ? 'translate-x-full' : 'translate-x-0 animate-drawer-slide-in-right'
        }`}
      >
        
        {/* ÜST BAŞLIK */}
        <div className="p-4 sm:p-5 bg-white flex items-center justify-between border-b border-slate-200/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-[#ff0055] flex items-center justify-center border border-pink-100/80 shadow-2xs">
              <ShoppingBag size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Sepetim
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                  {totalQuantity} Ürün
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                AKUZ Stickers Hızlı Sepet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sepeti Boşalt"
              >
                Temizle
              </button>
            )}
            <button
              onClick={handleSmoothClose}
              className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Ücretsiz Kargo İlerleme Çubuğu */}
        <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200/80 text-xs shrink-0">
          {remainingForFreeShipping > 0 ? (
            <div>
              <div className="flex items-center justify-between text-slate-700 font-medium">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <Truck size={14} className="text-[#ff0055]" />
                  <span>Ücretsiz kargo için kalan:</span>
                </span>
                <strong className="text-[#ff0055] font-extrabold font-price">
                  ₺{remainingForFreeShipping.toFixed(2).replace('.', ',')}
                </strong>
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-[#ff0055] transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <p className="text-emerald-700 font-bold flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Tebrikler! Kargo AKUZ Stickers tarafından hediye! 🚀</span>
            </p>
          )}
        </div>

        {/* ÜRÜN LİSTESİ */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf9f6]">
          {cartItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-white text-slate-400 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center mx-auto mb-3">
                <ShoppingBag size={28} />
              </div>
              <h3 className="text-base font-black text-slate-900">Sepetiniz Boş</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Beğendiğiniz Atatürk, araba, motosiklet ve özel tasarım stickerları sepetinize ekleyebilirsiniz.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-[#ff0055] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                Alışverişe Başla
              </button>
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div
                key={`${item.product.id}-${index}`}
                className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3 relative group hover:border-slate-300 transition-colors"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 bg-white rounded-xl p-1 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.product.isCustomText ? (
                    <span className="text-[10px] font-black uppercase text-black font-display text-center leading-tight truncate px-1">
                      {item.customText || 'YAZINIZI YAZIN'}
                    </span>
                  ) : (
                    <StickerGraphic
                      type={item.product.svgType}
                      imageUrl={item.product.imageUrl}
                      colorHex="#111827"
                      customText={item.customText}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase truncate">
                    {item.product.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>{item.selectedDimension}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-700">{item.selectedColor}</span>
                    {item.selectedFinish && (
                      <>
                        <span>·</span>
                        <span className="font-bold text-[#ff0055]">{item.selectedFinish}</span>
                      </>
                    )}
                  </div>
                  {item.customText && (
                    <p className="text-[10px] text-[#ff0055] font-bold truncate mt-0.5">
                      Yazı: "{item.customText}" {item.customFont ? `(${item.customFont})` : ''}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-xs sm:text-sm font-extrabold text-rose-600 font-price tracking-tight">
                      ₺{(getItemPrice(item) * item.quantity).toFixed(2).replace('.', ',')}
                    </span>

                    {/* Miktar Kontrolü */}
                    <div className="flex items-center gap-1.5 bg-slate-100/90 px-2 py-1 rounded-lg border border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                        className="text-slate-600 hover:text-slate-900 p-0.5 rounded cursor-pointer"
                        title="Azalt"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold font-price min-w-4 text-center text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        className="text-slate-600 hover:text-slate-900 p-0.5 rounded cursor-pointer"
                        title="Artır"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sil Butonu */}
                <button
                  type="button"
                  onClick={() => onRemoveItem(index)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer self-start"
                  title="Ürünü Çıkar"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* ALT BUTON: SEPETE GİT */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200/90 space-y-3 shrink-0">
            {/* Ara Toplam */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500 font-medium">Ara Toplam:</span>
                <p className="text-[11px] text-slate-400 font-medium">
                  Kargo: {shippingFee === 0 ? 'Ücretsiz' : `₺${shippingFee.toFixed(2).replace('.', ',')}`}
                </p>
              </div>
              <span className="font-price text-xl font-extrabold text-[#ff0055]">
                ₺{grandTotal.toFixed(2).replace('.', ',')}
              </span>
            </div>

            {/* SEPETE GİT BUTONU (Kullanıcı isteği: sepetime tıklayınca sepete git olsun) */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToCartPage();
              }}
              className="w-full py-3.5 px-4 bg-[#ff0055] hover:bg-[#d90048] active:scale-98 text-white rounded-xl text-xs sm:text-sm font-black transition-all shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sepete Git</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
