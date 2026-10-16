import React, { useState, useEffect } from 'react';
import { X, Heart, ShoppingBag, MessageCircle, Check, Star, Shield, Droplets, SunMedium, ChevronLeft, ChevronRight, Truck, Zap } from 'lucide-react';
import { Product } from '../types';
import { StickerGraphic } from './StickerGraphic';
import { ImageIndicatorPill } from './ImageIndicatorPill';
import { calculateItemUnitPrice } from '../utils/pricingHelper';

interface ProductQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    color: string,
    dimension: string,
    customText?: string
  ) => void;
  isFavorite: boolean;
  onToggleFavorite: (product: Product) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  isFavorite,
  onToggleFavorite,
}) => {
  const [selectedColor, setSelectedColor] = useState('Siyah');
  const [selectedColorHex, setSelectedColorHex] = useState('#111827');
  const [selectedDimension, setSelectedDimension] = useState('15 cm');
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState('AKUZ ÖZEL');
  const [addedNotice, setAddedNotice] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  const images =
    product?.images && product.images.length > 0
      ? product.images
      : product?.imageUrl
      ? [product.imageUrl]
      : ['/akuz-logo-badge.png'];

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors[0]?.name || 'Siyah');
      setSelectedColorHex(product.colors[0]?.hex || '#111827');
      setSelectedDimension(product.dimensions[0] || '15 cm');
      setQuantity(1);
      setAddedNotice(false);
      setActiveImgIndex(0);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleColorChange = (name: string, hex: string) => {
    setSelectedColor(name);
    setSelectedColorHex(hex);
  };

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedColor, selectedDimension);
    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 1200);
  };

  const currentPrice = calculateItemUnitPrice(product, selectedDimension);
  const totalPrice = currentPrice * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Left Side: Sticker Canvas Display */}
        <div className="w-full md:w-1/2 bg-slate-100/80 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-200 relative min-h-[280px]">
          
          {/* Top Favorite */}
          <div className="w-full flex items-center justify-end">
            <button
              onClick={() => onToggleFavorite(product)}
              className="p-2 rounded-full bg-white shadow-xs hover:text-rose-500 transition-colors"
              title="Favori"
            >
              <Heart
                size={18}
                className={isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}
              />
            </button>
          </div>

          {/* Sticker Preview Container (Kare - Aspect Square) */}
          <div className="my-auto w-full max-w-[280px] aspect-square bg-white rounded-xl shadow-md border border-slate-200/70 overflow-hidden relative group">
            {/* Center Sticker Image */}
            <div className="w-full h-full flex items-center justify-center">
              <StickerGraphic
                type={product.svgType}
                imageUrl={images[activeImgIndex] || product.imageUrl}
                fit="cover"
                colorHex={selectedColorHex}
                customText={customText}
                className="w-full h-full object-cover drop-shadow-md"
              />
            </div>

            {/* Left and Right Navigation Arrows (Birden fazla fotoğraf olunca) */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const prevIdx = (activeImgIndex - 1 + images.length) % images.length;
                    setActiveImgIndex(prevIdx);
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 z-20 cursor-pointer"
                  title="Önceki Fotoğraf"
                  aria-label="Önceki Fotoğraf"
                >
                  <ChevronLeft size={18} className="-ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextIdx = (activeImgIndex + 1) % images.length;
                    setActiveImgIndex(nextIdx);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 z-20 cursor-pointer"
                  title="Sonraki Fotoğraf"
                  aria-label="Sonraki Fotoğraf"
                >
                  <ChevronRight size={18} className="ml-0.5" />
                </button>
              </>
            )}

            {/* Bottom Pill Indicator (Sadece birden fazla fotoğraf olunca) */}
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center z-20 pointer-events-auto">
                <ImageIndicatorPill
                  total={images.length}
                  activeIndex={activeImgIndex}
                  onSelect={(index) => setActiveImgIndex(index)}
                />
              </div>
            )}
          </div>

          {/* Features Pills */}
          <div className="w-full flex items-center justify-center gap-4 text-[11px] text-slate-600 font-medium pt-2">
            <span className="flex items-center gap-1">
              <SunMedium size={14} className="text-amber-500" /> UV Korumalı
            </span>
            <span className="flex items-center gap-1">
              <Droplets size={14} className="text-blue-500" /> Su Geçirmez
            </span>
            <span className="flex items-center gap-1">
              <Shield size={14} className="text-emerald-500" /> Boyaya Zarar Vermez
            </span>
          </div>

        </div>

        {/* Right Side: Options & Actions */}
        <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#ff0055]">
                AKUZ PREMIUM STICKER
              </span>
              <div className="flex items-center text-amber-500 text-xs font-bold">
                <Star size={13} className="fill-amber-400 mr-0.5" />
                {product.rating} ({product.reviewsCount} Değerlendirme)
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase font-display leading-snug">
              {product.name}
            </h2>

            {/* Price Box */}
            <div className="flex flex-wrap items-center gap-2.5 mt-2 mb-4">
              <span className="text-2xl font-black text-[#ff0055] font-mono">
                ₺{product.currentPrice.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-sm font-semibold text-slate-400 line-through font-mono">
                ₺{product.oldPrice.toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                %50 İNDİRİM
              </span>

              {/* Stoktaki ürünler için 'Aynı Gün Kargo' veya 'Hızlı Teslimat' rozeti */}
              {(product.inStock !== false && (!product.colors || product.colors.some(c => c.inStock !== false))) && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs">
                  <Truck size={12} className="shrink-0 text-white stroke-[2.5]" />
                  <span>Aynı Gün Kargo</span>
                  <span className="text-white/60 font-normal">|</span>
                  <span className="flex items-center gap-0.5 text-amber-300">
                    <Zap size={10} className="fill-amber-300 shrink-0" />
                    Hızlı Teslimat
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              {product.description}
            </p>

            {/* Color Selection */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">
                  Folyo Rengi:
                </span>
                <span className="text-xs font-medium text-[#ff0055]">
                  {selectedColor}
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {product.colors.map((color) => {
                  const isSelected = selectedColor === color.name;
                  const isGradient = color.hex.includes('gradient');
                  return (
                    <button
                      key={color.name}
                      onClick={() => handleColorChange(color.name, color.hex)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-[#ff0055] ring-2 ring-pink-200 scale-110 shadow-sm'
                          : 'border-slate-300 hover:scale-105'
                      }`}
                      style={{
                        background: isGradient ? color.hex : undefined,
                        backgroundColor: !isGradient ? color.hex : undefined,
                      }}
                      title={color.name}
                    >
                      {isSelected && (
                        <Check
                          size={14}
                          className={color.name === 'Beyaz' || color.name === 'Sarı' ? 'text-black' : 'text-white'}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dimension Selection */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">
                  Ölçü / Boyut:
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {selectedDimension}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {product.dimensions.map((dim) => {
                  const isSelected = selectedDimension === dim;
                  return (
                    <button
                      key={dim}
                      onClick={() => setSelectedDimension(dim)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {dim}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-5 py-2 border-y border-slate-100">
              <span className="text-xs font-bold text-slate-900">Adet:</span>
              <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-7 h-7 rounded-lg bg-white font-bold text-sm text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <span className="text-sm font-black font-mono w-6 text-center text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-7 h-7 rounded-lg bg-white font-bold text-sm text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="space-y-2 mt-2">
            <button
              onClick={handleAdd}
              disabled={addedNotice}
              className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                addedNotice
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#ff0055] hover:bg-[#d90048] text-white active:scale-98'
              }`}
            >
              {addedNotice ? (
                <>
                  <Check size={18} />
                  <span>Sepete Eklendi! (₺{totalPrice.toFixed(2).replace('.', ',')})</span>
                </>
              ) : (
                <>
                  <ShoppingBag size={18} />
                  <span>Sepete Ekle - ₺{totalPrice.toFixed(2).replace('.', ',')}</span>
                </>
              )}
            </button>

            <a
              href={`https://wa.me/905468758671?text=${encodeURIComponent(
                `Merhaba, AKUZ Stickers üzerinden "${product.name}" (${selectedDimension}, ${selectedColor}, ${quantity} adet) siparişi vermek istiyorum.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center gap-2 transition-colors cursor-pointer border border-emerald-200"
            >
              <MessageCircle size={16} />
              <span>WhatsApp ile Hızlı Sipariş Ver</span>
            </a>
          </div>

        </div>

      </div>
    </div>
  );
};
