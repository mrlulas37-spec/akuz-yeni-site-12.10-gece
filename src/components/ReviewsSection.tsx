import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, User, Lock, LogIn } from 'lucide-react';
import { Review, UserProfile } from '../types';

interface ReviewsSectionProps {
  productId: string;
  reviews: Review[];
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onAddReview: (productId: string, userName: string, rating: number, comment: string) => void;
}

// Helper to mask names: e.g. "Ahmet Yildiz" -> "Ah*** Yi****"
export const maskUserName = (fullName: string): string => {
  if (!fullName || !fullName.trim()) return 'Kullanıcı';
  const parts = fullName.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 1) return part;
      if (part.length === 2) return part[0] + '*';
      if (part.length === 3) return part[0] + '**';
      // First 2 letters visible, rest asterisks matching word length
      return part.slice(0, 2) + '*'.repeat(Math.max(2, part.length - 2));
    })
    .join(' ');
};

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  productId,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!comment.trim()) {
      setErrorMsg('Lütfen ürün hakkında bir değerlendirme yorumu yazınız.');
      return;
    }

    // Mask name immediately so public and storage shows masked version
    const displayName = currentUser.name ? maskUserName(currentUser.name) : 'Ah*** Yı****';
    onAddReview(productId, displayName, rating, comment.trim());
    setComment('');
    setErrorMsg('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
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
            Bu ürün için yapılmış gerçek kullanıcı deneyimleri ve değerlendirmeleri
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
        {/* SOL: Yorum Yapma Formu veya Giriş Yap Uyarısı */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider mb-4">
            Ürünü Değerlendir & Yorum Yap
          </h3>

          {!currentUser ? (
            /* Giriş Yapılmamışsa Gösterilen Korumalı Alan */
            <div className="p-6 bg-slate-50 border border-slate-200/90 rounded-lg flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-lg bg-pink-100/60 text-[#ff0055] flex items-center justify-center mb-3">
                <Lock size={22} />
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase">
                Yorum Yapmak İçin Giriş Yapın
              </h4>
              <p className="text-xs text-slate-500 mt-1 mb-5 max-w-xs leading-relaxed">
                Yalnızca hesabına giriş yapmış kayıtlı müşterilerimiz değerlendirme ve yorum yapabilir.
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="w-full py-3 px-5 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
              >
                <LogIn size={15} />
                <span>Giriş Yap veya Üye Ol</span>
              </button>
            </div>
          ) : (
            /* Giriş Yapılmışsa Yorum Formu */
            <div>
              {/* Aktif Giriş Yapan Kullanıcı Bilgisi (Sansürlü Gösterim) */}
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200/90 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center text-[#ff0055] font-bold text-xs">
                    <User size={15} />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Yorum Sahibi</span>
                    <span className="text-xs font-bold text-slate-900">
                      {maskUserName(currentUser.name)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm font-bold">
                  Hesap Açık
                </span>
              </div>

              {submitted && (
                <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-xs font-bold text-emerald-700 animate-fadeIn">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <span>Yorumunuz başarıyla yayınlandı!</span>
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-600">
                  {errorMsg}
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
                    <span className="text-xs font-bold text-amber-500 ml-2">
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
                    Yorumunuz & Deneyiminiz
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ürünün yapışma kalitesi, folyo dayanımı veya rengi hakkında düşünceleriniz..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff0055] focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg"
                >
                  <Send size={15} />
                  <span>Yorumu Gönder</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* SAĞ: Mevcut Yorumlar Listesi */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {reviews.length === 0 ? (
            <div className="p-8 sm:p-12 bg-white rounded-xl border border-slate-200 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-lg bg-pink-50 text-[#ff0055] flex items-center justify-center mb-3">
                <MessageSquare size={26} />
              </div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase">
                Henüz Değerlendirme Yapılmamış
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Bu ürünü ilk değerlendiren siz olun! Deneyiminizi paylaşarak diğer kullanıcılarımıza yardımcı olun.
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-4 sm:p-5 rounded-lg border border-slate-200/90 shadow-xs flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                      <User size={15} />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide">
                        {maskUserName(rev.userName)}
                      </h5>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                        Doğrulanmış Alıcı
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

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-1 pl-10">
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
