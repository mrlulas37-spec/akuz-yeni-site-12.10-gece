import React from 'react';

interface StickerGraphicProps {
  type?: string;
  colorHex?: string;
  className?: string;
  customText?: string;
  imageUrl?: string;
  fit?: 'contain' | 'cover';
}

export const StickerGraphic: React.FC<StickerGraphicProps> = ({
  className = 'w-full h-full max-h-[170px]',
  imageUrl = '/akuz-logo-badge.png',
  fit = 'cover',
}) => {
  return (
    <div className={`flex items-center justify-center select-none overflow-hidden ${className}`}>
      <img
        src={imageUrl || '/akuz-logo-badge.png'}
        alt="Sticker Görseli"
        className={`w-full h-full ${
          fit === 'cover' ? 'object-cover' : 'object-contain'
        } transition-transform duration-300 group-hover:scale-105`}
        loading="eager"
      />
    </div>
  );
};
