import React, { useState } from 'react';
import { Package, User, LogOut, MapPin, Plus, Trash2, Check, ArrowLeft, Truck, ExternalLink, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { UserProfile, Address, Order } from '../types';
import { changeUserPassword } from '../utils/auth';
import { TURKEY_PROVINCES, PROVINCE_NAMES } from '../data/turkeyLocations';

interface AccountPageProps {
  user: UserProfile | null;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout: () => void;
  orders: Order[];
  onGoHome: () => void;
  initialTab?: 'orders' | 'profile';
}

export const AccountPage: React.FC<AccountPageProps> = ({
  user,
  onUpdateUser,
  onLogout,
  orders,
  onGoHome,
  initialTab = 'profile',
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>(initialTab);

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

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    if (!user) return;

    setIsUpdatingPassword(true);
    const res = await changeUserPassword(user.email, currentPassword, newPassword);
    setIsUpdatingPassword(false);

    if (res.success) {
      setPasswordSuccess(res.message || 'Şifreniz başarıyla güncellendi!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError(res.error || 'Şifre güncellenemedi.');
    }
  };

  // Sync state if user changes
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone);
    }
  }, [user]);

  // Sadece bu kullanıcıya ait siparişleri filtrele (Gizlilik ve Güvenlik)
  const userOrders = React.useMemo(() => {
    if (!user || !user.email) return [];
    const cleanUserEmail = user.email.toLowerCase().trim();
    return orders.filter(
      (o) => o.customerEmail && o.customerEmail.toLowerCase().trim() === cleanUserEmail
    );
  }, [orders, user]);

  if (!user) {
    return (
      <div className="bg-[#fcfbf9] min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={30} />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Giriş Yapılmadı</h2>
          <p className="text-sm text-slate-500 mb-6">
            Hesap detaylarınızı ve siparişlerinizi görüntülemek için lütfen giriş yapın.
          </p>
          <button
            onClick={onGoHome}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

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
    setAddrPhone('');
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
    <div className="bg-[#fcfbf9] min-h-[85vh] pt-1.5 sm:pt-2.5 pb-8 sm:pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb / Top Bar */}
        <div className="mb-2 sm:mb-2.5 flex items-center justify-between gap-3 pb-1.5 border-b border-slate-200/60">
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#ff0055] transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-100 cursor-pointer -ml-1"
          >
            <ArrowLeft size={16} />
            Ana Sayfaya Dön
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Hesabım / {activeTab === 'orders' ? 'Siparişlerim' : 'Hesap Bilgileri'}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50/90 hover:bg-rose-100 border border-rose-200/60 transition-colors py-1 px-3 rounded-lg cursor-pointer active:scale-95 shadow-2xs"
              title="Hesaptan Güvenli Çıkış Yap"
            >
              <LogOut size={14} className="text-rose-500" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>

        {/* Ana Grid Yapısı: Sol Sidebar Panel + Sağ İçerik Alanı */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          
          {/* SOL PANEL (Siparişlerim, Hesap Bilgileri) */}
          <aside className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-3.5 sm:p-4 space-y-3">
            
            {/* Kullanıcı Profil Özeti */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ff0055] to-rose-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-black text-slate-900 truncate leading-tight">
                  {user.name}
                </h2>
                <p className="text-[11px] text-slate-500 truncate" title={user.email}>
                  {user.email}
                </p>
              </div>
            </div>

            {/* Sol Menü Butonları */}
            <nav className="space-y-1.5" aria-label="Hesap Menüsü">
              {/* 1. Siparişlerim */}
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-[#ff0055] text-white shadow-sm shadow-pink-200'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package size={17} className={activeTab === 'orders' ? 'text-white' : 'text-slate-500'} />
                  <span>Siparişlerim</span>
                </div>
                {orders.length > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      activeTab === 'orders'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {orders.length}
                  </span>
                )}
              </button>

              {/* 2. Hesap Bilgileri */}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-[#ff0055] text-white shadow-sm shadow-pink-200'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <User size={17} className={activeTab === 'profile' ? 'text-white' : 'text-slate-500'} />
                <span>Hesap Bilgileri</span>
              </button>
            </nav>

          </aside>

          {/* SAĞ İÇERİK ALANI */}
          <main className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5.5">
            
            {/* TAB 1: SİPARİŞLERİM */}
            {activeTab === 'orders' && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Package size={20} className="text-[#ff0055]" />
                    Siparişlerim
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Verdiğiniz tüm siparişleri, ürün ayrıntılarını ve durumunu buradan inceleyebilirsiniz.
                  </p>
                </div>

                {userOrders.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <div className="w-14 h-14 bg-white text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs border border-slate-200">
                      <Package size={28} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Henüz Verilmiş Siparişiniz Yok</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Kataloğumuzdaki sticker modellerini inceleyerek ilk siparişinizi kolayca oluşturabilirsiniz.
                    </p>
                    <button
                      onClick={onGoHome}
                      className="mt-4 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      Alışverişe Başla
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                          <div>
                            <span className="text-xs font-extrabold text-slate-900">
                              Sipariş No: #{ord.id}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">{ord.date}</p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {ord.trackingNumber && (
                              <a
                                href={`https://kargonomi.com/kargo-takip?no=${ord.trackingNumber}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                              >
                                <Truck size={13} />
                                <span>Kargo Takip: {ord.trackingNumber}</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                            <span
                              className={`text-xs font-black px-3 py-1 rounded-full self-start sm:self-auto border ${
                                ord.status === 'Hazırlanıyor'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : ord.status === 'Kargoya Verildi'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {ord.status === 'Hazırlanıyor' && '⏳ '}
                              {ord.status === 'Kargoya Verildi' && '🚀 '}
                              {ord.status === 'Teslim Edildi' && '✓ '}
                              {ord.status}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                              <span className="font-semibold text-slate-800">
                                {item.quantity}x {item.productName}{' '}
                                <span className="text-slate-400 font-normal">
                                  ({item.color}, {item.dimension})
                                </span>
                              </span>
                              <span className="font-mono font-bold text-slate-900">
                                ₺{item.price.toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-200/80">
                          <span className="text-xs font-bold text-slate-600">Toplam Tutar:</span>
                          <span className="text-base font-black text-[#ff0055] font-mono">
                            ₺{ord.total.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HESAP BİLGİLERİ (Fotoğraftaki Kişisel & İletişim Bilgileri + Teslimat Adresleri) */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                
                {/* 1. KİŞİSEL & İLETİŞİM BİLGİLERİ */}
                <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-4">
                    <User size={18} className="text-[#ff0055]" />
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Kişisel & İletişim Bilgileri
                    </h3>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Ad Soyad
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055] font-semibold text-slate-800 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Telefon Numarası
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+90 5XX XXX XX XX"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055] font-semibold text-slate-800 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        E-Posta Adresi
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055] font-semibold text-slate-800 transition-colors"
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-98"
                      >
                        {isSaved ? <Check size={16} className="text-emerald-400" /> : null}
                        <span>{isSaved ? 'Kaydedildi' : 'Bilgileri Güncelle'}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 2. KAYITLI TESLİMAT ADRESLERİ */}
                <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-[#ff0055]" />
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                        Kayıtlı Teslimat Adresleri
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="text-xs font-bold text-[#ff0055] hover:text-[#d90048] flex items-center gap-1 cursor-pointer bg-pink-50 hover:bg-pink-100/70 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus size={15} />
                      <span>Yeni Adres Ekle</span>
                    </button>
                  </div>

                  {/* Yeni Adres Formu */}
                  {showAddressForm && (
                    <form onSubmit={handleAddAddress} className="mb-5 p-4 sm:p-5 bg-white rounded-xl border border-pink-200 space-y-3 shadow-xs">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                        Yeni Adres Bilgisi
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="Adres Başlığı (Örn: Ev Adresim, Garaj)"
                          value={addrTitle}
                          onChange={(e) => setAddrTitle(e.target.value)}
                          className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055]"
                        />
                        <input
                          type="text"
                          placeholder="Teslim Alacak Kişi"
                          value={addrRecipient}
                          onChange={(e) => setAddrRecipient(e.target.value)}
                          className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055]"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Telefon Numarası"
                          value={addrPhone}
                          onChange={(e) => setAddrPhone(e.target.value)}
                          className="px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055]"
                        />
                        <select
                          value={addrCity}
                          onChange={(e) => {
                            setAddrCity(e.target.value);
                            setAddrDistrict('');
                          }}
                          className="px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055] bg-white cursor-pointer"
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
                          className="px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055] bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                        className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055]"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                        >
                          Adresi Kaydet
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Kayıtlı Adres Kartları (Fotoğraftaki tasarım) */}
                  <div className="space-y-3">
                    {user.addresses.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 text-center bg-white rounded-xl border border-dashed border-slate-200">
                        Henüz kayıtlı bir teslimat adresi bulunmuyor.
                      </p>
                    ) : (
                      user.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="p-4 bg-white rounded-xl border border-slate-200/90 flex items-start justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                                {addr.title}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-md">
                                  Varsayılan
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-700 font-semibold mt-1.5">
                              {addr.recipientName} ({addr.phone})
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                              {addr.fullAddress} - {addr.district} / {addr.city}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50 cursor-pointer shrink-0"
                            title="Adresi Sil"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. GÜVENLİK & ŞİFRE DEĞİŞTİRME */}
                <div className="bg-slate-50/70 p-5 sm:p-6 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Lock size={18} className="text-[#ff0055]" />
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                      Şifre Değiştir
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                    Hesap güvenliğiniz için şifrenizi dilediğiniz zaman buradan yenileyebilirsiniz.
                  </p>

                  {passwordError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn font-semibold">
                      <Check size={16} className="text-emerald-600 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    {/* Mevcut Şifre */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mevcut Şifreniz
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Mevcut şifrenizi girin"
                          className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055] font-semibold text-slate-800 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                          title={showCurrentPass ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                        >
                          {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Yeni Şifre */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Yeni Şifre (En az 6 karakter)
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Yeni şifrenizi belirleyin"
                            className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055] font-semibold text-slate-800 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                            title={showNewPass ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                          >
                            {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Yeni Şifre Tekrar */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Yeni Şifre (Tekrar)
                        </label>
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Yeni şifrenizi tekrar girin"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055]/30 focus:border-[#ff0055] font-semibold text-slate-800 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-75 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-98"
                      >
                        <Lock size={15} />
                        <span>{isUpdatingPassword ? 'Güncelleniyor...' : 'Şifreyi Değiştir'}</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}

          </main>

        </div>

      </div>
    </div>
  );
};
