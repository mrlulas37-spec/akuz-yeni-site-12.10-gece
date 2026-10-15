import React from 'react';
import { Sparkles } from 'lucide-react';
import { AkuzLogo } from './AkuzLogo';

interface FooterProps {
  onOpenLegal: (type: string) => void;
  onScrollToTop: () => void;
  onNavigateToCatalog?: () => void;
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onScrollToTop, onNavigateToCatalog, onNavigate }) => {
  return (
    <footer className="bg-[#f8f6f0] py-16 md:py-20 text-center border-t border-[#e5e2d8]">
      <div className="max-w-xl mx-auto px-4 flex flex-col items-center">
        
        {/* Orijinal Yüklenen AKUZ Stickers Rozet Logosu */}
        <div
          onClick={onScrollToTop}
          className="cursor-pointer group inline-flex flex-col items-center mb-6 select-none"
          title="Başa Dön"
        >
          <AkuzLogo size={80} className="group-hover:scale-105 transition-transform drop-shadow-md" />
        </div>

        {/* Subtitle in spaced magenta tracking-widest uppercase matching image */}
        <p className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-slate-500 mb-10">
          PREMİUM STİCKERLAR
        </p>

        {/* "YASAL" Title matching Image 6 */}
        <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-6">
          YASAL
        </h4>

        {/* Legal Links List matching Image 6 */}
        <ul className="space-y-3.5 mb-14 text-xs sm:text-sm text-slate-600 font-medium">
          <li>
            <button
              onClick={() => onNavigate ? onNavigate('/kvkk') : onOpenLegal('kvkk')}
              className="hover:text-[#ff6600] transition-colors cursor-pointer"
            >
              KVKK Aydınlatma Metni
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate ? onNavigate('/gizlilik-politikasi') : onOpenLegal('gizlilik')}
              className="hover:text-[#ff6600] transition-colors cursor-pointer"
            >
              Gizlilik Politikası
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate ? onNavigate('/kullanim-kosullari') : onOpenLegal('kullanim')}
              className="hover:text-[#ff6600] transition-colors cursor-pointer"
            >
              Kullanım Koşulları
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate ? onNavigate('/mesafeli-satis-sozlesmesi') : onOpenLegal('mesafeli_satis')}
              className="hover:text-[#ff6600] transition-colors cursor-pointer"
            >
              Mesafeli Satış Sözleşmesi
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate ? onNavigate('/iptal-ve-iade') : onOpenLegal('iade')}
              className="hover:text-[#ff6600] transition-colors cursor-pointer"
            >
              İptal & İade Politikası
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate ? onNavigate('/cerez-politikasi') : onOpenLegal('cerez')}
              className="hover:text-[#ff6600] transition-colors cursor-pointer"
            >
              Çerez Politikası
            </button>
          </li>
        </ul>

        {/* Copyright notice matching Image 6 */}
        <p className="text-xs text-slate-400 font-normal">
          © 2026 AKUZ Stickers. Tüm hakları saklıdır.
        </p>

        {/* Giriş Yüklenme Animasyonunu Yeniden Oynatma Butonu */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('akuz:play-loader'))}
          className="mt-3 text-[11px] font-semibold text-slate-400 hover:text-[#ff6600] transition-colors cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-orange-50/70"
          title="Giriş Su Dolumu Logo Animasyonunu Tekrar Oynat"
        >
          <Sparkles size={12} className="text-[#ff6600]" />
          <span>Giriş Animasyonunu Tekrar Oynat</span>
        </button>

      </div>
    </footer>
  );
};
