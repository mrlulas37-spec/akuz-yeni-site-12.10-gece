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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#4a4a4a]/90 backdrop-blur-xs shadow-md transition-all ${className}`}
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
                ? 'w-5 h-2 bg-white rounded-full'
                : 'w-2 h-2 bg-[#9e9e9e] hover:bg-slate-200 rounded-full'
            }`}
            aria-label={`Görsel ${idx + 1}`}
          />
        );
      })}
    </div>
  );
};
