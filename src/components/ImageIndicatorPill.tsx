import React from 'react';

interface ImageIndicatorPillProps {
  total: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
  className?: string;
}

export const ImageIndicatorPill: React.FC<ImageIndicatorPillProps> = ({
  total,
  activeIndex,
  onSelect,
  className = '',
}) => {
  if (total <= 1) return null;

  return (
    <div
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#3a3a3a]/80 backdrop-blur-xs shadow-xs transition-all pointer-events-auto ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {Array.from({ length: total }).map((_, idx) => {
        const isActive = idx === activeIndex;
        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(idx);
            }}
            className={`transition-all duration-200 cursor-pointer focus:outline-none ${
              isActive
                ? 'w-2.5 h-1 bg-white rounded-full shadow-xs'
                : 'w-1 h-1 bg-white/50 hover:bg-white/80 rounded-full'
            }`}
            aria-label={`Görsel ${idx + 1}`}
          />
        );
      })}
    </div>
  );
};

