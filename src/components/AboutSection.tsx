import React from 'react';

interface AboutSectionProps {
  paragraphs?: string[];
}

export const AboutSection: React.FC<AboutSectionProps> = ({ paragraphs }) => {
  return (
    <section id="hakkimizda" className="py-16 md:py-24 bg-[#faf9f6] border-b border-slate-200/70">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
        
        {/* Slanted Title: Biz Kimiz ? */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic tracking-wide text-[#ff6600] uppercase font-display mb-8">
          Biz Kimiz ?
        </h2>

        {/* Content */}
        <div className="text-slate-700 text-sm sm:text-base md:text-[17px] leading-relaxed font-normal">
          <p className="font-medium text-slate-800">
            <span className="text-[#ff6600] font-black text-[1.08em]">AKUZ</span> Stickers, aracınıza, motosikletinize, kaskınıza, aynanıza, kısacası aklınıza gelebilecek çoğu yerde yapıştırıldığı yeri özelleştiren, ruh katan, özgün tasarımlar oluşturan genç girişimciler tarafından hayata geçirilmiş bir girişimdir. En kaliteli dış mekan vinil çıkartmaları sizlerle buluşturuyor, müşteri memnuniyetini ön planda tutuyoruz.
          </p>
        </div>

      </div>
    </section>
  );
};

