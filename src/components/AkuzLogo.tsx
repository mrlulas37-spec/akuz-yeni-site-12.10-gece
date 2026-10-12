import React from 'react';

interface AkuzLogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const AkuzLogo: React.FC<AkuzLogoProps> = ({
  className = '',
  size,
  alt = 'AKUZ Stickers Logo',
}) => {
  return (
    <img
      src="/akuz-logo-badge.png"
      alt={alt}
      style={size ? { width: size, height: size } : undefined}
      className={`object-contain select-none shrink-0 pointer-events-auto transition-transform duration-200 group-hover:scale-105 ${className}`}
      loading="eager"
    />
  );
};
