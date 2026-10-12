import React from 'react';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  return (
    <a
      href="https://wa.me/905468758671?text=Merhaba%2C%20AKUZ%20Stickers%20%C3%BCzerinden%20sticker%20sipari%C5%9Fi%20veya%20%C3%B6zel%20tasar%C4%B1m%20hakk%C4%B1nda%20g%C3%B6r%C3%BC%C5%9Fmek%20istiyorum."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20ba59] text-white p-3.5 sm:p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      aria-label="WhatsApp İletişim Hattı"
      title="WhatsApp Sipariş ve Destek Hattı"
    >
      <MessageCircle size={30} className="fill-white text-[#25D366]" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-bold pl-0 group-hover:pl-2">
        WhatsApp Sipariş
      </span>
    </a>
  );
};
