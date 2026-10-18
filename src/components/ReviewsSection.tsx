import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  User,
  Lock,
  LogIn,
  PackageCheck,
  Truck,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Review, UserProfile } from '../types';

interface ReviewsSectionProps {
  productId: string;
  productName?: string;
  reviews: Review[];
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onAddReview: (
    productId: string,
    userName: string,
    rating: number,
    comment: string
  ) => Promise<{ success: boolean; error?: string }> | void;
}

// Helper to mask names: e.g. "Ahmet Yildiz" -> "Ah*** Yı****"
export const maskUserName = (fullName: string): string => {
  if (!fullName || !fullName.trim()) return 'Kullanıcı';
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 1) return part;
      if (part.length === 2) return part[0] + '*';
      if (part.length === 3) return part[0] + '**';
      return part.slice(0, 2) + '*'.repeat(Math.max(2, part.length - 2));
    })
    .join(' ');
};

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  productId,
  productName = 'Ürün',
  reviews,
  currentUser,
  onOpenAuth,
  onAddReview,
}) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sunucu üzerinde teslimat ve sipariş durumu kontrolü
  const [eligibility, setEligibility] = useState<{
    loading: boolean;
    canReview: boolean;
    reason?: string;
    orderStatus?: string;
    orderId?: string;
  } | null>(null);

  useEffect(() => {
    if (!currentUser || !currentUser.email) {
      setEligibility(null);
      return;
    }

    let isMounted = true;
    setEligibility({ loading: true, canReview: false });

    fetch(
      `/api/reviews/check-eligibility?productId=${encodeURIComponent(productId)}&email=${encodeURIComponent(
        currentUser.email
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success) {
          setEligibility({
            loading: false,
            canReview: data.canReview,
            reason: data.reason,
            orderStatus: data.orderStatus,
            orderId: data.orderId,
          });
        } else {
          setEligibility({
            loading: false,
            canReview: false,
            reason: data.error || 'Değerlendirme yetkisi kontrol edilemedi.',
          });
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setEligibility({
          loading: false,
          canReview: false,
          reason: 'Değerlendirme durumu doğrulanamadı.',
        });
      });

    return () => {
      isMounted = false;
    };
  }, [productId, currentUser?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (eligibility && !eligibility.canReview) {
      setErrorMsg(
        eligibility.reason ||
          'Bu ürüne yalnızca sipariş verip teslim almış olan müşterilerimiz değerlendirme yapabilir.'
      );
      return;
    }

    if (!comment.trim() || comment.trim().length < 3) {
      setErrorMsg('Lütfen ürün hakkında en az 3 karakterlik bir değerlendirme yorumu yazınız.');
      return;
    }

    setIsSubmitting(true);
    try {
      const displayName = currentUser.name ? maskUserName(currentUser.name) : 'Doğrulanmış Müşteri';
      const result = await onAddReview(productId, displayName, rating, comment.trim());

      if (result && typeof result === 'object' && result.success === false) {
        setErrorMsg(result.error || 'Yorum kaydedilemedi.');
        setIsSubmitting(false);
        return;
      }

      setComment('');
      setErrorMsg('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Yorum kaydedilirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
      : '0.0';

  return (
    <section className="pt-10 border-t border-slate-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-display flex items-center gap-2.5">
            <MessageSquare size={22} className="text-[#ff0055]" />
            MÜŞTERİ YORUMLARI & DEĞERLENDİRMELER
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bu ürün için yapılmış gerçek sipariş ve teslimat sonrası kullanıcı deneyimleri
          </p>
        </div>

        {/* Puan Özeti Kutucuğu */}
        <div className="flex items-center gap-3 bg-white p-3.5 px-5 rounded-xl border border-slate-200 shadow-xs self-start md:self-auto">
          <div className="text-3xl font-black text-slate-900 font-mono">
            {avgRating}
          </div>
          <div>
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  className={
                    s <= Math.round(Number(avgRating))
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }
                />
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              {reviews.length} Gerçek Değerlendirme
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SOL: Yorum Yapma Formu veya Giriş / Teslimat Şartı Koruması */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider mb-4 flex items-center justify-between">
            <span>Ürünü Değerlendir</span>
            <span className="text-[11px] font-semibold text-slate-400 tracking-normal normal-case">
              Teslimat Şartlı
            </span>
          </h3>

          {!currentUser ? (
            /* 1. Giriş Yapılmamışsa */
            <div className="p-6 bg-slate-50 border border-slate-200/90 rounded-lg flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-pink-100/70 text-[#ff0055] flex items-center justify-center mb-3">
                <Lock size={22} />
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Yorum Yapmak İçin Giriş Yapın
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 mb-5 max-w-xs leading-relaxed">
                Yorumlar yalnızca bu ürünü sipariş verip teslim almış olan gerçek müşterilerimize açıktır.
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full py-3 px-5 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98"
              >
                <LogIn size={15} />
                <span>Giriş Yap veya Üye Ol</span>
              </button>
            </div>
          ) : eligibility?.loading ? (
            /* 2. Sipariş & Teslimat Durumu Sorgulanıyor */
            <div className="p-8 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col items-center justify-center text-center">
              <div className="w-7 h-7 border-2 border-[#ff0055] border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-bold text-slate-700">Sipariş & Teslimat Durumu Doğrulanıyor...</span>
              <span className="text-[11px] text-slate-400 mt-1">Lütfen bekleyiniz</span>
            </div>
          ) : eligibility && !eligibility.canReview ? (
            /* 3. Giriş Yapılmış Ancak Sipariş Henüz Teslim Alınmamış veya Bu Ürün Alınmamış */
            <div className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-xl flex flex-col text-left">
              {eligibility.orderStatus ? (
                /* Siparişi Var Ama Henüz "Teslim Edildi" Değil */
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                        Siparişiniz Henüz Teslim Edilmedi
                      </h4>
                      <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-sm mt-0.5">
                        Mevcut Durum: {eligibility.orderStatus}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Bu ürün için siparişiniz sistemimizde kayıtlıdır. Ürün kargolanıp adresinize ulaştıktan ve <strong>&quot;Teslim Edildi&quot;</strong> durumuna geçtikten sonra değerlendirmenizi yapabilirsiniz.
                  </p>
                </>
              ) : (
                /* Bu Ürünü Satın Almamış */
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-[#ff0055] flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase">
                        Yalnızca Teslim Alanlar Yorum Yapabilir
                      </h4>
                      <span className="inline-block text-[10px] font-bold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded-sm mt-0.5">
                        Doğrulanmış Alıcı Şartı
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sitemizde şeffaf ve güvenilir bir alışveriş deneyimi sunmak amacıyla, bu ürüne <strong>yalnızca sipariş verip teslim almış olan müşterilerimiz</strong> yorum yapabilir.
                  </p>
                  <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Giriş yapılan hesap:</span>
                    <span className="font-bold text-slate-800">{currentUser.email}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* 4. Teslim Alınmış Sipariş Doğrulandı -> Yorum Formu Açık */
            <div>
              {/* Doğrulanmış Müşteri Rozeti */}
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200/90 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase tracking-wider">
                      ✓ Teslim Edilen Sipariş Doğrulandı
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {maskUserName(currentUser.name)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-sm font-bold shadow-2xs">
                  Doğrulanmış Alıcı
                </span>
              </div>

              {submitted && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs font-bold text-emerald-800 animate-fadeIn">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <span>Yorumunuz başarıyla kaydedildi ve tüm ziyaretçilere yayınlandı!</span>
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs font-bold text-rose-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Yıldız Seçimi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Puanınız
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-slate-300 hover:scale-110 transition-transform cursor-pointer"
                        aria-label={`${star} yıldız`}
                      >
                        <Star
                          size={24}
                          className={
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-600 ml-2">
                      {rating === 5 && 'Mükemmel (5/5)'}
                      {rating === 4 && 'Çok İyi (4/5)'}
                      {rating === 3 && 'Orta (3/5)'}
                      {rating === 2 && 'Geliştirilebilir (2/5)'}
                      {rating === 1 && 'Kötü (1/5)'}
                    </span>
                  </div>
                </div>

                {/* Yorum Metni */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">
                    Yorumunuz & Deneyiminiz <span className="text-[#ff0055]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ürünün yapışma kalitesi, folyo dayanımı veya rengi hakkında düşünceleriniz..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff0055] focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Yorumunuz adınız sansürlenerek ({maskUserName(currentUser.name)}) herkese açık yayınlanacaktır.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !comment.trim()}
                  className="w-full py-3 px-4 bg-[#ff0055] hover:bg-[#d90048] disabled:opacity-50 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Yayınlanıyor...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Yorumu Yayınla</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* SAĞ: Mevcut Yorumlar Listesi (Merkezi Veritabanından Herkes Görür) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {reviews.length === 0 ? (
            <div className="p-8 sm:p-12 bg-white rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-xl bg-pink-50 text-[#ff0055] flex items-center justify-center mb-3">
                <MessageSquare size={26} />
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase">
                Henüz Değerlendirme Yapılmamış
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                Bu ürünü satın alan ilk müşterilerimizden biri olarak deneyiminizi paylaşabilir ve diğer alıcılara yol gösterebilirsiniz.
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col gap-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                      <User size={15} />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide">
                        {maskUserName(rev.userName)}
                      </h5>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded-sm">
                        <CheckCircle2 size={11} className="text-emerald-600" />
                        <span>Doğrulanmış Alıcı</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={13}
                          className={
                            s <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">
                      {rev.date}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1 pl-10.5">
                  {rev.comment}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};
