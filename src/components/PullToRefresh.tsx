import React from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

// Sayfa kaydırmasını engellememesi ve en üste çıkarken geri ittirme yapmaması için
// dokunmatik olayları engellemeyen güvenli pasif bileşen
export const PullToRefresh: React.FC<PullToRefreshProps> = () => {
  return null;
};

