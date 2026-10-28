import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Check,
  AlertCircle,
  ShieldCheck,
  Settings,
  Sparkles,
  User,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Review, ReviewSettings, Product } from '../types';

interface AdminReviewManagementProps {
  products: Product[];
  onRefreshProducts?: () => void;
}

export const AdminReviewManagement: React.FC<AdminReviewManagementProps> = ({
  products,
  onRefreshProducts,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    avgRating: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Ayarlar Paneli
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ReviewSettings>({
    enabled: true,
    autoApprove: false,
    onlyPurchased: false,
    maskNames: true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Düzenleme Modalı
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [editUserName, setEditUserName] = useState('');
  const [editStatus, setEditStatus] = useState<'approved' | 'pending' | 'rejected'>('approved');
  const [editAdminReply, setEditAdminReply] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Yeni Yorum Ekleme Modalı
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newStatus, setNewStatus] = useState<'approved' | 'pending'>('approved');
  const [newVerified, setNewVerified] = useState(true);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Yorumları ve Ayarları Getir
  const fetchReviewsData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      }
    } catch (err: any) {
      console.warn('Yorumlar yüklenemedi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/reviews/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reviewSettings) {
          setSettings(data.reviewSettings);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchReviewsData();
    fetchSettings();
  }, []);

  // Ayarları Kaydet
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/admin/reviews/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Yorum sistemi ayarları başarıyla kaydedildi.');
      } else {
        showToast('error', data.error || 'Ayarlar kaydedilemedi.');
      }
    } catch {
      showToast('error', 'Sunucu bağlantı hatası.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Tekil Durum Değiştir (Onayla / Reddet / Beklet)
  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'pending' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const label =
          newStatus === 'approved' ? 'onaylandı ve yayına alındı.' : newStatus === 'rejected' ? 'reddedildi.' : 'onay beklemeye alındı.';
        showToast('success', `Yorum ${label}`);
        fetchReviewsData();
        if (onRefreshProducts) onRefreshProducts();
      } else {
        showToast('error', data.error || 'İşlem başarısız.');
      }
    } catch {
      showToast('error', 'Sunucu hatası.');
    }
  };

  // Yorum Sil
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Yorum kalıcı olarak silindi.');
        fetchReviewsData();
        if (onRefreshProducts) onRefreshProducts();
      } else {
        showToast('error', data.error || 'Silme işlemi başarısız.');
      }
    } catch {
      showToast('error', 'Sunucu hatası.');
    }
  };

  // Toplu İşlem
  const handleBatchAction = async (action: 'approve_all_pending' | 'delete_rejected') => {
    const confirmMsg =
      action === 'approve_all_pending'
        ? 'Tüm onay bekleyen yorumları onaylayıp sitede yayınlamak istiyor musunuz?'
        : 'Tüm reddedilmiş yorumları kalıcı olarak silmek istiyor musunuz?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/reviews/batch-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || 'Toplu işlem tamamlandı.');
        fetchReviewsData();
        if (onRefreshProducts) onRefreshProducts();
      } else {
        showToast('error', data.error || 'İşlem başarısız.');
      }
    } catch {
      showToast('error', 'Sunucu hatası.');
    }
  };

  // Düzenleme Başlat
  const startEdit = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || '');
    setEditUserName(review.userName || '');
    setEditStatus((review.status as any) || 'approved');
    setEditAdminReply(review.adminReply || '');
  };

  // Düzenleme Kaydet
  const handleSaveEdit = async () => {
    if (!editingReview) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          comment: editComment,
          rating: editRating,
          userName: editUserName,
          adminReply: editAdminReply,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Yorum başarıyla güncellendi.');
        setEditingReview(null);
        fetchReviewsData();
        if (onRefreshProducts) onRefreshProducts();
      } else {
        showToast('error', data.error || 'Güncelleme başarısız.');
      }
    } catch {
      showToast('error', 'Sunucu hatası.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Manuel Yorum Ekle
  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductId) {
      showToast('error', 'Lütfen bir ürün seçin.');
      return;
    }
    if (!newComment.trim()) {
      showToast('error', 'Lütfen yorum metni girin.');
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await fetch('/api/admin/reviews/manual-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: newProductId,
          userName: newUserName.trim() || 'Doğrulanmış Müşteri',
          userEmail: newUserEmail.trim() || 'musteri@akuzstickers.com',
          rating: newRating,
          comment: newComment.trim(),
          status: newStatus,
          verifiedPurchase: newVerified,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', 'Yeni yorum başarıyla oluşturuldu.');
        setIsAddModalOpen(false);
        setNewComment('');
        setNewUserName('');
        setNewUserEmail('');
        fetchReviewsData();
        if (onRefreshProducts) onRefreshProducts();
      } else {
        showToast('error', data.error || 'Yorum eklenemedi.');
      }
    } catch {
      showToast('error', 'Sunucu hatası.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Filtreleme
  const filteredReviews = reviews.filter((r) => {
    const currentStatus = r.status || 'approved';
    if (statusFilter !== 'all' && currentStatus !== statusFilter) {
      return false;
    }
    if (selectedProductId !== 'all' && r.productId !== selectedProductId) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = r.userName?.toLowerCase().includes(q);
      const matchEmail = r.userEmail?.toLowerCase().includes(q);
      const matchComment = r.comment?.toLowerCase().includes(q);
      const matchProduct = r.productName?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchComment && !matchProduct) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Bildirim */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-bold text-white transition-all transform animate-fadeIn ${
            notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ÜST BAŞLIK VE KONTROL BUTONLARI */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2.5">
            <MessageSquare size={24} className="text-[#ff0055]" />
            Müşteri Yorumları & Değerlendirme Yönetimi
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gelen müşteri yorumlarını denetleyin, onaylayın, yanıtlayın ve mağaza yorum kurallarını yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isSettingsOpen
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Settings size={15} />
            <span>Yorum Ayarları</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (products.length > 0 && !newProductId) {
                setNewProductId(products[0].id);
              }
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus size={16} />
            <span>Manuel Yorum Ekle</span>
          </button>

          <button
            type="button"
            onClick={fetchReviewsData}
            disabled={isLoading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            title="Yenile"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Toplam Yorum */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Toplam Yorum</span>
            <MessageSquare size={16} className="text-slate-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {stats.total}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Veritabanındaki tüm yorumlar</span>
        </div>

        {/* Onay Bekleyenler (Amber Pulse) */}
        <div className={`p-4 rounded-xl border shadow-xs flex flex-col justify-between transition-all ${
          stats.pending > 0
            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span>Onay Bekleyen</span>
              {stats.pending > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
              )}
            </span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-700 font-mono">
            {stats.pending}
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-1">
            {stats.pending > 0 ? 'Admin onayı bekliyor' : 'Bekleyen yorum yok'}
          </span>
        </div>

        {/* Yayında (Onaylanan) */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Yayında</span>
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
            {stats.approved}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1">Sitede aktif görünen</span>
        </div>

        {/* Reddedilenler */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-700 text-xs font-bold uppercase tracking-wider">
            <span>Reddedilen</span>
            <XCircle size={16} className="text-rose-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600 font-mono">
            {stats.rejected}
          </div>
          <span className="text-[11px] text-slate-400 mt-1">Sitede gizlenen</span>
        </div>

        {/* Ortalama Puan */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Ortalama Puan</span>
            <Star size={16} className="text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 font-mono flex items-center gap-1.5">
            <span>{stats.avgRating}</span>
            <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
          </div>
          <div className="flex items-center text-amber-400 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={11}
                className={s <= Math.round(stats.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* YORUM AYARLARI KARTI (Açılır/Kapanır) */}
      {isSettingsOpen && (
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Settings size={18} className="text-[#ff0055]" />
                Mağaza Yorum Kuralları & Moderasyon Ayarları
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Müşterilerin ne zaman yorum yapabileceğini ve onay akışını buradan yönetin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1 rounded-md"
            >
              Kapat ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Yorum Sistemi Durumu */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 mb-1.5">
                  <MessageSquare size={15} className="text-[#ff0055]" />
                  <span>Yorum Sistemi Durumu</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Siteniz genelinde müşterilerin yeni ürün yorumu gönderebilmesini açar veya geçici olarak durdurur.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, enabled: true }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.enabled
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ✓ Açık (Yorumlar Alınsın)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, enabled: false }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !settings.enabled
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ✕ Kapalı (Durdurulsun)
                </button>
              </div>
            </div>

            {/* 2. Onay Modu (Auto Approve vs Require Approval) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 mb-1.5">
                  <ShieldCheck size={15} className="text-amber-600" />
                  <span>Yorum Onay Mekanizması</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  {settings.autoApprove
                    ? '⚡ Otomatik Onay: Gönderilen tüm yorumlar anında sitede ve ürün sayfasında yayına girer.'
                    : '🛡️ Yönetici Onayı Gerekli: Gönderilen yorumlar admin onaylayana kadar ne sitede ne de yazan müşterinin telefonunda görünmez.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, autoApprove: false }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !settings.autoApprove
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🛡️ Admin Onayı Gerekli (Önerilen)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, autoApprove: true }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.autoApprove
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ⚡ Anında Otomatik Yayınla
                </button>
              </div>
            </div>

            {/* 3. Kimler Yorum Yapabilir */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 mb-1.5">
                  <User size={15} className="text-blue-600" />
                  <span>Yorum Yapabilme Şartı</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  {settings.onlyPurchased
                    ? '🔒 Sadece Teslim Alınan Siparişler: Yalnızca bu ürünü sipariş verip teslim almış olan müşteriler yorum yazabilir.'
                    : '🌐 Herkese Açık: Hesabına giriş yapmış tüm müşteriler değerlendirme yazabilir.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, onlyPurchased: false }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !settings.onlyPurchased
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🌐 Herkes Yorum Yapabilir
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, onlyPurchased: true }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.onlyPurchased
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🔒 Sadece Teslim Alanlar
                </button>
              </div>
            </div>

            {/* 4. İsim Maskeleme */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <label className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2 mb-1.5">
                  <Lock size={15} className="text-slate-700" />
                  <span>Müşteri İsmi Maskeleme (KVKK)</span>
                </label>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Sitede yorumların yanında müşterilerin isimleri Ah*** Yı*** şeklinde sansürlenerek gizlilik korunur.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, maskNames: true }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.maskNames
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ✓ Açık (Ah*** Yı***)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, maskNames: false }))}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !settings.maskNames
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  ✕ Kapalı (Tam İsim)
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
              className="py-2.5 px-6 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSavingSettings ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Yorum Ayarlarını Kaydet</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* FİLTRELEME & TOPLU İŞLEM BARI */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Durum Sekmeleri */}
        <div className="flex flex-wrap items-center gap-1.5 border-b lg:border-b-0 pb-3 lg:pb-0 border-slate-100">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tümü ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <Clock size={13} />
            <span>Onay Bekleyenler ({stats.pending})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Yayında ({stats.approved})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <XCircle size={13} />
            <span>Reddedilenler ({stats.rejected})</span>
          </button>
        </div>

        {/* Arama ve Ürün Filtresi */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Ürün, müşteri veya yorumda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff0055] focus:bg-white transition-all"
            />
          </div>

          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ff0055]"
          >
            <option value="all">Tüm Ürünler</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Hızlı Toplu Aksiyonlar */}
          {stats.pending > 0 && (
            <button
              type="button"
              onClick={() => handleBatchAction('approve_all_pending')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1"
              title="Tüm bekleyen yorumları bir kerede onayla"
            >
              <Check size={14} />
              <span>Tümünü Onayla ({stats.pending})</span>
            </button>
          )}

          {stats.rejected > 0 && (
            <button
              type="button"
              onClick={() => handleBatchAction('delete_rejected')}
              className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Reddedilen yorumları temizle"
            >
              <Trash2 size={13} />
              <span>Reddedilenleri Temizle ({stats.rejected})</span>
            </button>
          )}
        </div>
      </div>

      {/* YORUM KARTLARI LİSTESİ */}
      <div className="space-y-3.5">
        {filteredReviews.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-pink-50 text-[#ff0055] flex items-center justify-center mb-3">
              <MessageSquare size={26} />
            </div>
            <h4 className="text-base font-black text-slate-900 uppercase">
              {reviews.length === 0 ? 'Henüz Hiç Yorum Bulunmuyor' : 'Filtreye Uygun Yorum Bulunamadı'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
              {reviews.length === 0
                ? 'Müşteriler ürünlerinize yorum yaptıkça veya yukarıdaki "Manuel Yorum Ekle" butonu ile siz ekledikçe burada listelenecektir.'
                : 'Seçili filtre veya arama kriterine uyan değerlendirme kaydı yok. Filtreleri temizlemeyi deneyin.'}
            </p>
            {reviews.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) setNewProductId(products[0].id);
                  setIsAddModalOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-[#ff0055] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#d90048] transition-all cursor-pointer"
              >
                + İlk Yorumu Ekle
              </button>
            )}
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const currentStatus = rev.status || 'approved';
            const prod = products.find((p) => p.id === rev.productId || p.slug === rev.productId);

            return (
              <div
                key={rev.id}
                className={`bg-white p-5 rounded-2xl border transition-all shadow-xs ${
                  currentStatus === 'pending'
                    ? 'border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20'
                    : currentStatus === 'rejected'
                    ? 'border-rose-200 bg-rose-50/15'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* ÜST BİLGİ ŞERİDİ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    {/* Ürün Görseli */}
                    {prod?.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <ShoppingBag size={18} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 line-clamp-1">
                          {rev.productName || prod?.name || 'Ürün'}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-sm shrink-0">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            <span>Doğrulanmış Sipariş</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{rev.userName}</span>
                        {rev.userEmail && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400 font-mono text-[10px]">{rev.userEmail}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Puan Yıldızları */}
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}
                        />
                      ))}
                      <span className="text-xs font-black text-slate-700 ml-1.5 font-mono">
                        {rev.rating}.0
                      </span>
                    </div>

                    {/* Durum Rozeti */}
                    {currentStatus === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                        <Clock size={12} className="text-amber-600 animate-spin" />
                        <span>Onay Bekliyor</span>
                      </span>
                    )}
                    {currentStatus === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span>Yayında</span>
                      </span>
                    )}
                    {currentStatus === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                        <XCircle size={12} className="text-rose-600" />
                        <span>Reddedildi</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* YORUM METNİ */}
                <div className="my-3 pl-1">
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* MAĞAZA YANITI (Varsa) */}
                {rev.adminReply && (
                  <div className="mt-2.5 mb-3 p-3 bg-pink-50/50 border-l-3 border-[#ff0055] rounded-r-xl text-xs">
                    <div className="flex items-center justify-between text-[#ff0055] font-black text-[11px] uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-1.5">
                        <Sparkles size={13} />
                        <span>Akuz Stickers Mağaza Yetkilisi Yanıtı</span>
                      </span>
                      {rev.adminReplyDate && (
                        <span className="text-slate-400 font-normal lowercase text-[10px]">
                          {rev.adminReplyDate}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {rev.adminReply}
                    </p>
                  </div>
                )}

                {/* ALT AKSİYON BARI */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Tarih: {rev.date} {rev.createdAt && `(${new Date(rev.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })})`}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Onayla / Reddet / Beklet butonları */}
                    {currentStatus !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(rev.id, 'approved')}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        title="Bu yorumu onayla ve sitede yayınla"
                      >
                        <Check size={13} />
                        <span>Onayla & Yayınla</span>
                      </button>
                    )}

                    {currentStatus !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(rev.id, 'rejected')}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Bu yorumu reddet ve gizle"
                      >
                        <XCircle size={13} />
                        <span>Reddet</span>
                      </button>
                    )}

                    {currentStatus !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(rev.id, 'pending')}
                        className="px-2.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Tekrar onay bekleyen duruma al"
                      >
                        <Clock size={13} />
                        <span>Beklemeye Al</span>
                      </button>
                    )}

                    {/* Düzenle Butonu */}
                    <button
                      type="button"
                      onClick={() => startEdit(rev)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Yorumu veya yanıtı düzenle"
                    >
                      <Edit3 size={13} />
                      <span>Düzenle / Yanıtla</span>
                    </button>

                    {/* Sil Butonu */}
                    <button
                      type="button"
                      onClick={() => handleDelete(rev.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Yorumu kalıcı olarak sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DÜZENLEME & YANITLAMA MODALI */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Edit3 size={18} className="text-[#ff0055]" />
                Yorumu Düzenle & Mağaza Yanıtı
              </h3>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Müşteri Adı */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Müşteri Adı
                </label>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#ff0055]"
                />
              </div>

              {/* Puan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Puan (Yıldız)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        size={20}
                        className={star <= editRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-700 font-mono ml-2">
                    {editRating} / 5
                  </span>
                </div>
              </div>

              {/* Durum */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Yayın Durumu
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ff0055]"
                >
                  <option value="approved">Yayında (Onaylı — Sitede Görünür)</option>
                  <option value="pending">Onay Bekliyor (Sitede ve Müşteride Gizli)</option>
                  <option value="rejected">Reddedildi (Sitede Gizli)</option>
                </select>
              </div>

              {/* Yorum Metni */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Müşteri Yorum Metni
                </label>
                <textarea
                  rows={3}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#ff0055]"
                />
              </div>

              {/* Mağaza Yanıtı (Admin Reply) */}
              <div>
                <label className="block text-xs font-bold text-[#ff0055] mb-1 uppercase flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>Akuz Stickers Mağaza Yanıtı (İsteğe Bağlı)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Müşteriye resmi mağaza yanıtınız: 'Bizi tercih ettiğiniz ve güzel yorumunuz için teşekkür ederiz...'"
                  value={editAdminReply}
                  onChange={(e) => setEditAdminReply(e.target.value)}
                  className="w-full px-3 py-2 bg-pink-50/40 border border-pink-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff0055]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="px-5 py-2 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSavingEdit ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUEL YORUM EKLEME MODALI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Plus size={18} className="text-[#ff0055]" />
                Ürüne Yeni Yorum Ekle
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-3.5">
              {/* Ürün Seçimi */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Ürün Seçin <span className="text-[#ff0055]">*</span>
                </label>
                <select
                  required
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ff0055]"
                >
                  <option value="">Lütfen ürün seçiniz</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Müşteri Adı & E-posta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Müşteri Adı
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Mehmet Demir"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#ff0055]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    E-posta
                  </label>
                  <input
                    type="email"
                    placeholder="mehmet@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#ff0055]"
                  />
                </div>
              </div>

              {/* Puan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Puan
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        size={20}
                        className={star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-amber-700 font-mono ml-2">
                    {newRating} / 5
                  </span>
                </div>
              </div>

              {/* Durum & Doğrulanmış */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Başlangıç Durumu
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ff0055]"
                  >
                    <option value="approved">Doğrudan Yayına Al (Onaylı)</option>
                    <option value="pending">Onay Beklemeye Al</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Doğrulanmış Rozeti
                  </label>
                  <select
                    value={newVerified ? 'yes' : 'no'}
                    onChange={(e) => setNewVerified(e.target.value === 'yes')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ff0055]"
                  >
                    <option value="yes">✓ Doğrulanmış Sipariş Rozeti Göster</option>
                    <option value="no">✕ Rozetsiz Göster</option>
                  </select>
                </div>
              </div>

              {/* Yorum Metni */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                  Yorum Metni <span className="text-[#ff0055]">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ürün hakkındaki yorum ve değerlendirme metni..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#ff0055]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-5 py-2 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingNew ? 'Ekleniyor...' : 'Yorumu Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
