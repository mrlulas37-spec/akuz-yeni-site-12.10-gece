import React from 'react';
import { ArrowLeft, CheckCircle2, Award, Zap, Shield, Sparkles } from 'lucide-react';
import { AkuzLogo } from './AkuzLogo';

interface AboutPageProps {
  onGoHome: () => void;
  onNavigateToCatalog: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onGoHome, onNavigateToCatalog }) => {
  return (
    <div className="bg-[#fcfbf9] min-h-[80vh] py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#ff0055] transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft size={18} />
            Ana Sayfaya Dön
          </button>

          <span className="text-xs text-slate-400 font-medium">/hakkimizda</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-xl space-y-10">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              <AkuzLogo size={64} />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-wide text-[#ff6600] uppercase font-display mb-4">
              Biz Kimiz ?
            </h1>
          </div>

          {/* Core Story */}
          <div className="text-slate-700 text-base sm:text-lg leading-relaxed border-t border-b border-slate-100 py-8 text-center max-w-3xl mx-auto">
            <p className="font-medium text-slate-800">
              <span className="text-[#ff6600] font-black text-[1.08em]">AKUZ</span> Stickers, aracınıza, motosikletinize, kaskınıza, aynanıza, kısacası aklınıza gelebilecek çoğu yerde yapıştırıldığı yeri özelleştiren, ruh katan, özgün tasarımlar oluşturan genç girişimciler tarafından hayata geçirilmiş bir girişimdir. En kaliteli dış mekan vinil çıkartmaları sizlerle buluşturuyor, müşteri memnuniyetini ön planda tutuyoruz.
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex flex-col items-center text-center">
              <Shield className="w-8 h-8 text-[#ff0055] mb-2" />
              <h3 className="font-bold text-slate-900 text-sm mb-1">UV & Yıkama Direnci</h3>
              <p className="text-xs text-slate-600">Yüksek basınçlı yıkamaya ve güneşe tam dayanıklı</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col items-center text-center">
              <Award className="w-8 h-8 text-amber-600 mb-2" />
              <h3 className="font-bold text-slate-900 text-sm mb-1">1. Sınıf Vinil Kalitesi</h3>
              <p className="text-xs text-slate-600">Premium sınıf döküm vinil hammadde</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex flex-col items-center text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
              <h3 className="font-bold text-slate-900 text-sm mb-1">Boyaya Zarar Vermez</h3>
              <p className="text-xs text-slate-600">Söküldüğünde yapışkan bırakmaz, verniği korur</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex flex-col items-center text-center">
              <Sparkles className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-bold text-slate-900 text-sm mb-1">Özgün Tasarımlar</h3>
              <p className="text-xs text-slate-600">Aracınıza özel çizim ve imza detaylar</p>
            </div>
          </div>

          {/* CTA Box */}
          <div className="bg-slate-900 rounded-2xl p-6 sm:p-8 text-center text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-extrabold font-display">Tüm Tasarımlarımızı Keşfedin</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">Popüler Atatürk imzası, off-road ve motosiklet koleksiyonumuz sizi bekliyor.</p>
            </div>
            <button
              onClick={onNavigateToCatalog}
              className="px-6 py-3 bg-[#ff0055] hover:bg-[#d90048] text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md cursor-pointer shrink-0 active:scale-98"
            >
              Kataloğa Git
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
