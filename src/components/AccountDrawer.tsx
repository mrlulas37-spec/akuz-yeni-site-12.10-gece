import React, { useState } from 'react';
import { X, User, MapPin, Heart, ShoppingBag, Package, LogOut, Plus, Trash2, Check } from 'lucide-react';
import { UserProfile, Product, Address, Order } from '../types';
import { StickerGraphic } from './StickerGraphic';
import { TURKEY_PROVINCES, PROVINCE_NAMES } from '../data/turkeyLocations';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout: () => void;
  favoriteProducts: Product[];
  onRemoveFavorite: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenCart: () => void;
  orders: Order[];
  initialTab?: 'profile' | 'favorites' | 'orders';
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
  favoriteProducts,
  onRemoveFavorite,
  onAddToCart,
  onOpenCart,
  orders,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'orders'>(initialTab);
  
  // Editable Profile State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaved, setIsSaved] = useState(false);

  // Address Modal/Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrTitle, setAddrTitle] = useState('');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrFull, setAddrFull] = useState('');

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
    }
  }, [user]);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      name,
      email,
      phone,
    };
    onUpdateUser(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrTitle || !addrFull) return;

    const newAddress: Address = {
      id: `addr-${Date.now()}`,
      title: addrTitle,
      recipientName: addrRecipient || name,
      phone: addrPhone || phone,
      city: addrCity,
      district: addrDistrict,
      fullAddress: addrFull,
      isDefault: user.addresses.length === 0,
    };

    const updated: UserProfile = {
      ...user,
      addresses: [...user.addresses, newAddress],
    };

    onUpdateUser(updated);
    setShowAddressForm(false);
    setAddrTitle('');
    setAddrRecipient('');
    setAddrFull('');
  };

  const handleDeleteAddress = (id: string) => {
    const updated: UserProfile = {
      ...user,
      addresses: user.addresses.filter((a) => a.id !== id),
    };
    onUpdateUser(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-drawer-slide-in-right">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white flex items-center justify-between border-b border-slate-200/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-500 to-[#ff0055] text-white flex items-center justify-center font-black text-lg shadow-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                {user.name}
              </h2>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              title="Çıkış Yap"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Çıkış</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={16} />
            <span>Kişisel Bilgiler & Adresler</span>
          </button>

          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart size={16} />
            <span>Favorilerim ({favoriteProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package size={16} />
            <span>Geçmiş Siparişlerim ({orders.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: PROFILE & ADDRESSES */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Profile Details Form */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200/80">
                <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                  <User size={16} className="text-orange-600" />
                  Kişisel & İletişim Bilgileri
                </h3>

                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Ad Soyad
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Telefon Numarası
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      E-Posta Adresi
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {isSaved ? <Check size={14} className="text-emerald-400" /> : null}
                      <span>{isSaved ? 'Kaydedildi' : 'Bilgileri Güncelle'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Delivery Addresses */}
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200/80">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin size={16} className="text-orange-600" />
                    Kayıtlı Teslimat Adresleri
                  </h3>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Yeni Adres Ekle</span>
                  </button>
                </div>

                {/* Add Address Form Toggle */}
                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="mb-4 p-4 bg-white rounded-lg border border-orange-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase">Yeni Adres Bilgisi</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Adres Başlığı (Örn: Evim, Garaj)"
                        value={addrTitle}
                        onChange={(e) => setAddrTitle(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg border border-slate-200"
                      />
                      <input
                        type="text"
                        placeholder="Teslim Alacak Kişi"
                        value={addrRecipient}
                        onChange={(e) => setAddrRecipient(e.target.value)}
                        className="px-3 py-2 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={addrCity}
                        onChange={(e) => {
                          setAddrCity(e.target.value);
                          setAddrDistrict('');
                        }}
                        className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white cursor-pointer"
                      >
                        <option value="">İl Seçiniz (81 İl)</option>
                        {PROVINCE_NAMES.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </select>
                      <select
                        value={addrDistrict}
                        disabled={!addrCity}
                        onChange={(e) => setAddrDistrict(e.target.value)}
                        className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <option value="">{addrCity ? 'İlçe Seçiniz' : 'Önce İl Seçiniz'}</option>
                        {addrCity &&
                          (TURKEY_PROVINCES[addrCity] || []).map((dist) => (
                            <option key={dist} value={dist}>
                              {dist}
                            </option>
                          ))}
                      </select>
                    </div>
                    <textarea
                      required
                      placeholder="Tam Adres (Cadde, sokak, bina ve daire no)"
                      value={addrFull}
                      onChange={(e) => setAddrFull(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Adresi Kaydet
                      </button>
                    </div>
                  </form>
                )}

                {/* Address Cards List */}
                <div className="space-y-3">
                  {user.addresses.length === 0 ? (
                    <p className="text-xs text-slate-500 py-2">Henüz kayıtlı bir teslimat adresi bulunmuyor.</p>
                  ) : (
                    user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3.5 bg-white rounded-lg border border-slate-200/80 flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{addr.title}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded-sm">
                                Varsayılan
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 font-medium mt-1">
                            {addr.recipientName} ({addr.phone})
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {addr.fullAddress} - {addr.district} / {addr.city}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors rounded-md hover:bg-rose-50 cursor-pointer"
                          title="Adresi Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: FAVORITES */}
          {activeTab === 'favorites' && (
            <div className="space-y-3">
              {favoriteProducts.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2.5">
                    <Heart size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Henüz Favori Ürününüz Yok</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Beğendiğiniz stickerları kalp ikonuna tıklayarak favorilerinize kaydedebilir ve hızlıca sipariş verebilirsiniz.
                  </p>
                </div>
              ) : (
                favoriteProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-white rounded-md p-2 border border-slate-200 flex items-center justify-center shrink-0">
                        <StickerGraphic type={p.svgType} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                          {p.name}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xs font-extrabold text-red-600 font-price">
                            ₺{p.currentPrice.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-[11px] text-slate-400 line-through font-price font-medium">
                            ₺{p.oldPrice.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAddToCart(p)}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                      >
                        <ShoppingBag size={14} />
                        <span className="hidden sm:inline">Sepete Ekle</span>
                      </button>
                      <button
                        onClick={() => onRemoveFavorite(p.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Favorilerden Kaldır"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: PAST ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={36} className="text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">Geçmiş Sipariş Bulunmuyor</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Verdiğiniz tüm siparişleri ve kargo takip durumunu bu ekrandan takip edebilirsiniz.
                  </p>
                </div>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-900">Sipariş No: #{ord.id}</span>
                        <p className="text-[11px] text-slate-500">{ord.date}</p>
                      </div>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-sm">
                        {ord.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-slate-700">
                          <span>
                            {item.quantity}x {item.productName} ({item.color}, {item.dimension})
                          </span>
                          <span className="font-price font-bold">
                            ₺{item.price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="text-xs font-bold text-slate-600">Toplam Tutar:</span>
                      <span className="text-sm font-black text-slate-900 font-price">
                        ₺{ord.total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
