import React, { useEffect, useState } from 'react';
import { AkuzLogo } from './AkuzLogo';

interface FastAkuzLoaderProps {
  isVisible: boolean;
  onFinished?: () => void;
  message?: string;
}

export const FastAkuzLoader: React.FC<FastAkuzLoaderProps> = ({
  isVisible,
  onFinished,
  message = 'Yükleniyor...',
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setProgress(0);
      setIsFadingOut(false);
      return;
    }

    setProgress(15);
    setIsFadingOut(false);

    // 1 saniye içinde pürüzsüz %100 doluş
    const t1 = setTimeout(() => setProgress(65), 300);
    const t2 = setTimeout(() => setProgress(100), 750);
    const t3 = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        if (onFinished) onFinished();
      }, 200);
    }, 950);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isVisible, onFinished]);

  if (!isVisible && !isFadingOut) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-[#070a12]/85 backdrop-blur-md transition-opacity duration-200 pointer-events-auto ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        {/* Glowing Logo */}
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff0055] via-[#ff6600] to-amber-400 blur-xl opacity-60 animate-pulse" />
          <div className="relative z-10 w-20 h-20 rounded-2xl bg-[#0d121f] border border-white/10 flex items-center justify-center shadow-2xl">
            <AkuzLogo size={46} />
          </div>
        </div>

        {/* AKUZ Typographic Title */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="font-display font-black text-2xl tracking-wider text-white uppercase drop-shadow-md">
            AKUZ
          </span>
          <span className="font-display font-black text-2xl tracking-wider text-[#ff0055] uppercase drop-shadow-md">
            STICKERS
          </span>
        </div>

        <p className="text-xs font-semibold text-slate-300 tracking-wide mb-3">
          {message}
        </p>

        {/* 1 Saniyelik Hızlı İlerleme Çubuğu */}
        <div className="w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-gradient-to-r from-[#ff0055] via-[#ff6600] to-amber-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
