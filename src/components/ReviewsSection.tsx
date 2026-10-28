import React from 'react';
import {
  Star,
  MessageSquare,
  CheckCircle2,
  User,
  PackageCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { Review, UserProfile } from '../types';

interface ReviewsSectionProps {
  productId: string;
  productName?: string;
  reviews: Review[];
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onAddReview?: (
    productId: string,
    userName: string,
    rating: number,
    comment: string
  ) => Promise<{ success: boolean; message?: string; error?: string; status?: string }> | void;
}

// Helper to mask names: e.g. "Ahmet Yildiz" -> "Ah*** Yı****"
export const maskUserName = (fullName: string): string => {
  if (!fullName || !fullName.trim()) return 'Doğrulanmış Müşteri';
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
  reviews,
}) => {
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviews.length).toFixed(1)
      : '0.0';

  // 1-5 yıldız dağılımı
  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
    starCounts[star] = (starCounts[star] || 0) + 1;
  });

  return (
    <section className="pt-10 border-t border-slate-200">
      
      {/* BAŞLIK & PUAN ÖZETİ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight font-display flex items-center gap-2.5">
            <MessageSquare size={22} className="text-[#ff0055]" />
            MÜŞTERİ YORUMLARI & DEĞERLENDİRMELER
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Bu ürün için yapılmış onaylı kullanıcı değerlendirmeleri
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-3 bg-white p-3 px-4 sm:px-5 rounded-2xl border border-slate-200 shadow-2xs self-start md:self-auto">
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
                {reviews.length} Onaylı Değerlendirme
              </div>
            </div>
          </div>
        )}
      </div>

      {/* YORUM YAPMA BİLGİLENDİRME ÇUBUĞU */}
      <div className="mb-6 p-3.5 sm:p-4 bg-gradient-to-r from-amber-50/90 via-orange-50/60 to-slate-50 rounded-2xl border border-amber-200/80 flex items-start sm:items-center gap-3 text-xs text-amber-900">
        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <Info size={16} />
        </div>
        <div className="flex-1 leading-relaxed">
          <p>
            <strong className="font-extrabold text-amber-950">Güvenilir ve Gerçek Değerlendirme Sistemi:</strong> Yorum yapma işlemi yalnızca sipariş verip ürünü teslim alan müşterilerimiz tarafından <strong>&quot;Hesabım &gt; Siparişlerim&quot;</strong> bölümünden yapılabilmektedir.
          </p>
        </div>
      </div>

      {/* YORUM LİSTESİ VEYA HENÜZ YAPILMADI KISMI */}
      {reviews.length === 0 ? (
        /* HENÜZ YORUM YAPILMADI */
        <div className="p-8 sm:p-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <MessageSquare size={26} />
          </div>
          <h4 className="text-base font-black text-slate-900">
            Henüz Yorum Yapılmadı
          </h4>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            Bu ürün için henüz onaylanmış bir müşteri yorumu bulunmuyor. Bu ürünü sipariş verip teslim aldıktan sonra <strong>&quot;Siparişlerim&quot;</strong> sayfanızdan ilk değerlendirmeyi siz yapabilirsiniz.
          </p>
        </div>
      ) : (
        /* YAPILAN YORUMLAR */
        <div className="space-y-3 sm:space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col gap-2.5 hover:border-slate-300 transition-colors"
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
                      <span>Teslim Alınmış Doğrulanmış Sipariş</span>
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

              {rev.adminReply && (
                <div className="mt-2.5 ml-10 p-3 bg-slate-50 border-l-2 border-[#ff0055] rounded-r-xl text-xs">
                  <div className="flex items-center gap-1.5 text-[#ff0055] font-black text-[11px] uppercase tracking-wider mb-1">
                    <Sparkles size={12} />
                    <span>Akuz Stickers Mağaza Yanıtı</span>
                    {rev.adminReplyDate && (
                      <span className="text-slate-400 font-normal lowercase ml-auto text-[10px]">
                        {rev.adminReplyDate}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {rev.adminReply}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </section>
  );
};
