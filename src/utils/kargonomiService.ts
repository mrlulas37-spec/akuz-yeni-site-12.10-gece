import { KargonomiConfig } from '../types';
import { getStoredSiteSettings } from './adminStore';

export interface CreateShipmentPayload {
  orderId: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientCity: string;
  recipientDistrict: string;
  itemsDescription?: string;
  carrier?: string;
}

export interface KargonomiResult {
  success: boolean;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  shipmentId?: string;
  barcodeUrl?: string;
  message: string;
  raw?: any;
}

/**
 * Kargonomi API'si ile kargo oluşturur
 */
export const createKargonomiShipment = async (
  payload: CreateShipmentPayload,
  customConfig?: KargonomiConfig
): Promise<KargonomiResult> => {
  try {
    const settings = getStoredSiteSettings();
    const config = customConfig || settings.kargonomiSettings;

    const response = await fetch('/api/kargonomi/create-shipment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload,
        config,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Kargonomi servisine bağlanırken bir hata oluştu.',
    };
  }
};

/**
 * Kargonomi API Token ve bağlantısını doğrular
 */
export const testKargonomiConnection = async (
  token: string,
  apiUrl?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/kargonomi/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        apiUrl,
      }),
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Kargonomi bağlantısı kurulamadı.',
    };
  }
};
