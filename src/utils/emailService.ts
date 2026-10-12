import { EmailTemplateConfig, SmtpConfig, CartItem, Order } from '../types';
import { getStoredSiteSettings } from './adminStore';

export const DEFAULT_EMAIL_TEMPLATE: EmailTemplateConfig = {
  // Bildirimde ve gelen kutusunda:
  // 1. Üstte gönderici adı: "AKUZ Stickers"
  // 2. Konu satırı: "Ailemize Hoş Geldiniz! ✨"
  // 3. İçerik ve bildirim önizlemesi: "Hesabınız başarıyla oluşturuldu..." (Ailemize hoş geldiniz tekrarlamaz)
  subject: 'Ailemize Hoş Geldiniz! ✨',
  logoUrl: 'https://ais-dev-5uln7xv63yhmjpdpuhfejn-135382651051.europe-west2.run.app/akuz-logo-badge.png',
  headerBgColor: '#ffffff',
  greeting: 'Merhaba, {name}! 👋',
  bodyText: 'Hesabınız ({email}) başarıyla oluşturuldu.\n\nAracınız, motosikletiniz veya kişisel eşyalarınız için en dayanıklı Alman malı döküm vinil folyo çıkartmaları, suya, güneşe ve yüksek basınçlı oto yıkamaya dayanıklı en özel tasarımları keşfetmeye hemen başlayabilirsiniz.',
  showCoupon: false,
  couponCode: '',
  couponDiscountText: '',
  buttonText: 'Kataloğu Keşfet',
  buttonUrl: 'https://akuzstickers.com',
  footerNote: 'Sorularınız veya özel siparişleriniz için bize her zaman ulaşabilirsiniz.',
};

/**
 * 1. Hoş Geldin (Kayıt) E-postası HTML Şablonu
 */
export const getWelcomeEmailHtml = (name: string, email: string, customTpl?: EmailTemplateConfig): string => {
  const tpl = customTpl || getStoredSiteSettings().smtpSettings?.template || DEFAULT_EMAIL_TEMPLATE;

  const resolvedGreeting = (tpl.greeting || DEFAULT_EMAIL_TEMPLATE.greeting)
    .replace('{name}', name)
    .replace('{email}', email);

  // Eğer eski kayıtlı ayarlarda "Ailemize hoş geldiniz!" tekrarlanıyorsa temizle
  let rawBody = tpl.bodyText || DEFAULT_EMAIL_TEMPLATE.bodyText;
  if (rawBody.startsWith('Ailemize hoş geldiniz! ')) {
    rawBody = rawBody.replace('Ailemize hoş geldiniz! ', '');
  }

  const resolvedBody = rawBody
    .replace('{name}', name)
    .replace('{email}', email)
    .split('\n')
    .filter(Boolean)
    .map((p) => `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: #475569;">${p}</p>`)
    .join('');

  const headerBg = tpl.headerBgColor || '#ffffff';
  const logoCid = 'cid:akuz-logo@akuzstickers.com';

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${tpl.subject || DEFAULT_EMAIL_TEMPLATE.subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  
  <!-- PREHEADER / ÖNİZLEME METNİ -->
  <div style="display: none; font-size: 1px; color: #0f172a; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Hesabınız başarıyla oluşturuldu. Özel tasarımları ve ürün kataloğumuzu keşfedin. &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <div style="width: 100%; background-color: #0f172a; padding: 40px 10px; box-sizing: border-box;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3); border: 1px solid #1e293b;">
      
      <!-- HEADER -->
      <tr>
        <td style="background-color: ${headerBg}; padding: 36px 30px 28px; text-align: center; border-bottom: 2px solid #f1f5f9;">
          <a href="${tpl.buttonUrl || 'https://akuzstickers.com'}" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoCid}" 
              alt="Logo" 
              width="120"
              style="display: block; margin: 0 auto; width: 120px; max-width: 120px; height: auto; border: 0; outline: none; text-decoration: none;"
            />
          </a>
        </td>
      </tr>

      <!-- BODY CONTENT -->
      <tr>
        <td style="padding: 36px 32px;">
          <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">
            ${resolvedGreeting}
          </div>

          <div style="margin-bottom: 24px;">
            ${resolvedBody}
          </div>

          <!-- ÖZELLİKLER LİSTESİ -->
          <div style="margin: 24px 0; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            <p style="font-weight: 800; font-size: 13px; text-transform: uppercase; color: #0f172a; margin: 0 0 10px;">
              Bizi Farklı Kılan Özellikler:
            </p>
            <div style="font-size: 13px; line-height: 1.8; color: #475569;">
              ✦ <strong>Üstün Dayanıklılık:</strong> Güneş ışınlarına (UV) ve yüksek basınçlı oto yıkamaya karşı ekstra dayanıklı.<br>
              ✦ <strong>İz Bırakmaz:</strong> İleride söküldüğünde aracınızın boyasına veya verniğine kesinlikle zarar vermez.<br>
              ✦ <strong>Kişiye Özel Tasarım:</strong> Canlı yazı stüdyomuz ile kendi sözünüzü ve imzanızı tasarlayabilirsiniz.<br>
              ✦ <strong>Özenli & Hızlı Kargo:</strong> Koruyucu transfer bantlarıyla hasarsız kapınıza teslim.
            </div>
          </div>

          <!-- CTA BUTTON -->
          ${
            tpl.buttonText && tpl.buttonUrl
              ? `
          <div style="text-align: center; margin: 32px 0 16px;">
            <a href="${tpl.buttonUrl}" style="display: inline-block; background: #ff0055; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 14px 36px; border-radius: 30px; box-shadow: 0 10px 15px -3px rgba(255, 0, 85, 0.4);">
              ${tpl.buttonText}
            </a>
          </div>
          `
              : ''
          }

          ${
            tpl.footerNote
              ? `<p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 20px;">${tpl.footerNote}</p>`
              : ''
          }
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 8px;">Bu e-posta <strong>${email}</strong> adresine üyelik kaydınız nedeniyle gönderilmiştir.</p>
          <p style="margin: 0;">Destek & WhatsApp: <strong>+90 546 875 86 71</strong></p>
          <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1;">© ${new Date().getFullYear()} AKUZ Stickers. Tüm hakları saklıdır.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
};

export interface OrderEmailDetails {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: string;
  trackingNumber?: string;
  carrierName?: string;
  items: {
    productName: string;
    quantity: number;
    color: string;
    dimension: string;
    finish?: string;
    customText?: string;
    price: number;
  }[];
  totalPrice: number;
  orderNote?: string;
}

/**
 * 2. Siparişiniz Hazırlanıyor E-postası HTML Şablonu (Eski 'Sipariş Alındı' yerine)
 */
export const getOrderPreparingEmailHtml = (order: OrderEmailDetails): string => {
  const logoCid = 'cid:akuz-logo@akuzstickers.com';

  const itemsRowsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
        <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${item.productName}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
          ${item.quantity} adet · ${item.dimension} · ${item.color}${item.finish ? ` (${item.finish})` : ''}
          ${item.customText ? `<br><span style="color: #ff0055; font-weight: 600;">Yazı: "${item.customText}"</span>` : ''}
        </div>
      </td>
      <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; font-size: 14px; color: #0f172a; white-space: nowrap;">
        ₺${(item.price * item.quantity).toFixed(2).replace('.', ',')}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Siparişiniz Hazırlanıyor #${order.orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  
  <!-- PREHEADER -->
  <div style="display: none; font-size: 1px; color: #0f172a; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    #${order.orderId} nolu siparişiniz atölyemizde özenle hazırlanıyor ve üretime alındı. Detaylar içeride. &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <div style="width: 100%; background-color: #0f172a; padding: 40px 10px; box-sizing: border-box;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3); border: 1px solid #1e293b;">
      
      <!-- HEADER -->
      <tr>
        <td style="background-color: #ffffff; padding: 36px 30px 24px; text-align: center; border-bottom: 2px solid #f1f5f9;">
          <a href="https://akuzstickers.com" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoCid}" 
              alt="Logo" 
              width="120"
              style="display: block; margin: 0 auto; width: 120px; max-width: 120px; height: auto; border: 0; outline: none; text-decoration: none;"
            />
          </a>
        </td>
      </tr>

      <!-- MAIN CONTENT -->
      <tr>
        <td style="padding: 36px 32px;">
          <!-- BAŞLIK -->
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 6px;">
              Siparişiniz Atölyemizde Hazırlanıyor! 🎨
            </h1>
            <p style="font-size: 13px; color: #64748b; margin: 0;">
              Sipariş No: <strong style="color: #ff0055;">#${order.orderId}</strong>
            </p>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
            Merhaba <strong>${order.customerName}</strong>, siparişiniz başarıyla alındı ve üretim ekibimiz tarafından özenle hazırlanmaya başlandı. siparişin yola çıktığında sana tekrar haber vereceğiz.
          </p>

          <!-- SİPARİŞ ÖZETİ KUTUSU -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              Hazırlanan Ürünler
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              ${itemsRowsHtml}
              <tr>
                <td style="padding-top: 14px; font-weight: 800; font-size: 15px; color: #0f172a;">Toplam Tutar:</td>
                <td align="right" style="padding-top: 14px; font-weight: 900; font-size: 20px; color: #ff0055;">
                  ₺${order.totalPrice.toFixed(2).replace('.', ',')}
                </td>
              </tr>
            </table>
          </div>

          <!-- TESLİMAT BİLGİLERİ -->
          ${
            order.shippingAddress
              ? `
          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px 20px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">
              Teslim Edilecek Adres
            </div>
            <div style="font-size: 13px; font-weight: 600; color: #0f172a; line-height: 1.5;">
              ${order.shippingAddress}
              ${order.customerPhone ? `<br><span style="color: #64748b; font-weight: normal;">Tel: ${order.customerPhone}</span>` : ''}
            </div>
          </div>
          `
              : ''
          }

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 8px;">Bu e-posta <strong>${order.customerEmail}</strong> adresine sipariş hazırlık bildiriminiz nedeniyle gönderilmiştir.</p>
          <p style="margin: 0;">Destek & WhatsApp: <strong>+90 546 875 86 71</strong></p>
          <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1;">© ${new Date().getFullYear()} AKUZ Stickers. Tüm hakları saklıdır.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
};

/**
 * 3. Kargoya Verildi E-postası HTML Şablonu
 */
export const getOrderShippedEmailHtml = (order: OrderEmailDetails): string => {
  const logoCid = 'cid:akuz-logo@akuzstickers.com';
  const trackingNo = order.trackingNumber || 'Sistemde Tanımlandı';
  const carrier = order.carrierName || 'Kargonomi / Anlaşmalı Kargo';
  const trackingUrl = order.trackingNumber
    ? `https://kargonomi.com/kargo-takip?no=${order.trackingNumber}`
    : 'https://akuzstickers.com';

  const itemsRowsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
        <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${item.productName}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
          ${item.quantity} adet · ${item.dimension} · ${item.color}${item.finish ? ` (${item.finish})` : ''}
          ${item.customText ? `<br><span style="color: #ff0055; font-weight: 600;">Yazı: "${item.customText}"</span>` : ''}
        </div>
      </td>
      <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; font-size: 14px; color: #0f172a; white-space: nowrap;">
        ₺${(item.price * item.quantity).toFixed(2).replace('.', ',')}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Siparişiniz Kargoya Verildi #${order.orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  
  <!-- PREHEADER -->
  <div style="display: none; font-size: 1px; color: #0f172a; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    #${order.orderId} nolu siparişiniz kargoya teslim edildi ve yola çıktı! Takip numarası içeride. &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <div style="width: 100%; background-color: #0f172a; padding: 40px 10px; box-sizing: border-box;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3); border: 1px solid #1e293b;">
      
      <!-- HEADER -->
      <tr>
        <td style="background-color: #ffffff; padding: 36px 30px 24px; text-align: center; border-bottom: 2px solid #f1f5f9;">
          <a href="https://akuzstickers.com" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoCid}" 
              alt="Logo" 
              width="120"
              style="display: block; margin: 0 auto; width: 120px; max-width: 120px; height: auto; border: 0; outline: none; text-decoration: none;"
            />
          </a>
        </td>
      </tr>

      <!-- MAIN CONTENT -->
      <tr>
        <td style="padding: 36px 32px;">
          <!-- BAŞLIK -->
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 6px;">
              Siparişiniz Yola Çıktı! 📦
            </h1>
            <p style="font-size: 13px; color: #64748b; margin: 0;">
              Sipariş No: <strong style="color: #ff0055;">#${order.orderId}</strong>
            </p>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
            Merhaba <strong>${order.customerName}</strong>, beklediğiniz sticker siparişiniz koruyucu ambalajına özenle yerleştirilerek kargo firmasına teslim edilmiştir.
          </p>

          <!-- KARGO TAKİP KUTUSU -->
          <div style="background-color: #eff6ff; border: 2px dashed #93c5fd; border-radius: 16px; padding: 22px 24px; margin-bottom: 24px; text-align: center;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #1e40af; letter-spacing: 1px; margin-bottom: 6px;">
              Kargo Takip Bilgileri
            </div>
            <div style="font-size: 18px; font-weight: 900; color: #0f172a; font-family: monospace; letter-spacing: 1px; margin-bottom: 4px;">
              ${trackingNo}
            </div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 16px;">
              Kargo Firması: <strong>${carrier}</strong>
            </div>

            <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 800; padding: 12px 26px; border-radius: 12px; box-shadow: 0 6px 12px -2px rgba(37, 99, 235, 0.3);">
              Kargonun Nerede Olduğunu Gör 🚚
            </a>
          </div>

          <!-- SİPARİŞ ÖZETİ KUTUSU -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px;">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              Gönderilen Ürünler
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              ${itemsRowsHtml}
              <tr>
                <td style="padding-top: 14px; font-weight: 800; font-size: 15px; color: #0f172a;">Toplam Tutar:</td>
                <td align="right" style="padding-top: 14px; font-weight: 900; font-size: 20px; color: #ff0055;">
                  ₺${order.totalPrice.toFixed(2).replace('.', ',')}
                </td>
              </tr>
            </table>
          </div>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 8px;">Bu e-posta <strong>${order.customerEmail}</strong> adresine kargo takip bilgilendirmesi amacıyla gönderilmiştir.</p>
          <p style="margin: 0;">Destek & WhatsApp: <strong>+90 546 875 86 71</strong></p>
          <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1;">© ${new Date().getFullYear()} AKUZ Stickers. Tüm hakları saklıdır.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
};

/**
 * 4. Teslim Edildi E-postası HTML Şablonu
 */
export const getOrderDeliveredEmailHtml = (order: OrderEmailDetails): string => {
  const logoCid = 'cid:akuz-logo@akuzstickers.com';

  const itemsRowsHtml = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
        <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${item.productName}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
          ${item.quantity} adet · ${item.dimension} · ${item.color}${item.finish ? ` (${item.finish})` : ''}
          ${item.customText ? `<br><span style="color: #ff0055; font-weight: 600;">Yazı: "${item.customText}"</span>` : ''}
        </div>
      </td>
      <td align="right" style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; font-weight: 700; font-size: 14px; color: #0f172a; white-space: nowrap;">
        ₺${(item.price * item.quantity).toFixed(2).replace('.', ',')}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Siparişiniz Teslim Edildi #${order.orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  
  <!-- PREHEADER -->
  <div style="display: none; font-size: 1px; color: #0f172a; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    #${order.orderId} nolu siparişiniz başarıyla teslim edildi. Güzel günlerde kullanın! &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
  </div>

  <div style="width: 100%; background-color: #0f172a; padding: 40px 10px; box-sizing: border-box;">
    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3); border: 1px solid #1e293b;">
      
      <!-- HEADER -->
      <tr>
        <td style="background-color: #ffffff; padding: 36px 30px 24px; text-align: center; border-bottom: 2px solid #f1f5f9;">
          <a href="https://akuzstickers.com" target="_blank" style="text-decoration: none; display: inline-block;">
            <img 
              src="${logoCid}" 
              alt="Logo" 
              width="120"
              style="display: block; margin: 0 auto; width: 120px; max-width: 120px; height: auto; border: 0; outline: none; text-decoration: none;"
            />
          </a>
        </td>
      </tr>

      <!-- MAIN CONTENT -->
      <tr>
        <td style="padding: 36px 32px;">
          <!-- BAŞLIK -->
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 6px;">
              Siparişiniz Teslim Edildi! ✨
            </h1>
            <p style="font-size: 13px; color: #64748b; margin: 0;">
              Sipariş No: <strong style="color: #ff0055;">#${order.orderId}</strong>
            </p>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
            Merhaba <strong>${order.customerName}</strong>, kargo firması tarafından paketinizin teslim edildiği bildirilmiştir. Çıkartmalarınızı güzel günlerde, keyifle kullanmanızı dileriz!
          </p>

          <!-- SİPARİŞ ÖZETİ KUTUSU -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px;">
            <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
              Teslim Edilen Ürünler
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              ${itemsRowsHtml}
              <tr>
                <td style="padding-top: 14px; font-weight: 800; font-size: 15px; color: #0f172a;">Toplam Tutar:</td>
                <td align="right" style="padding-top: 14px; font-weight: 900; font-size: 20px; color: #ff0055;">
                  ₺${order.totalPrice.toFixed(2).replace('.', ',')}
                </td>
              </tr>
            </table>
          </div>

          <!-- SİTEMİZDEN DEĞERLENDİRİN KUTUSU -->
          <div style="background: linear-gradient(135deg, #fdf2f8 0%, #ffffff 100%); border: 1px solid #fbcfe8; border-radius: 16px; padding: 22px 24px; text-align: center;">
            <div style="font-size: 15px; font-weight: 900; color: #0f172a; margin-bottom: 6px;">
              Siparişinizi Sitemizden Değerlendirin ⭐⭐⭐⭐⭐
            </div>
            <p style="font-size: 13px; color: #475569; line-height: 1.6; margin: 0 0 16px;">
              Ürünlerimiz ve alışveriş deneyiminiz hakkındaki görüşleriniz bizim için çok kıymetli. Deneyiminizi paylaşarak diğer sticker tutkunlarına yol gösterebilirsiniz.
            </p>

            <a href="https://akuzstickers.com" target="_blank" style="display: inline-block; background-color: #ff0055; color: #ffffff !important; text-decoration: none; font-size: 13px; font-weight: 800; padding: 13px 28px; border-radius: 12px; box-shadow: 0 6px 12px -2px rgba(255, 0, 85, 0.3);">
              Sitemizden Değerlendirin ⭐
            </a>
          </div>

        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          <p style="margin: 0 0 8px;">Bu e-posta <strong>${order.customerEmail}</strong> adresine teslimat onayı nedeniyle gönderilmiştir.</p>
          <p style="margin: 0;">Destek & WhatsApp: <strong>+90 546 875 86 71</strong></p>
          <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1;">© ${new Date().getFullYear()} AKUZ Stickers. Tüm hakları saklıdır.</p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Geriye dönük uyumluluk: getOrderReceivedEmailHtml çağrıları getOrderPreparingEmailHtml'e yönlendirilir
 */
export const getOrderReceivedEmailHtml = getOrderPreparingEmailHtml;

/**
 * Kayıt olan kullanıcıya Hoş Geldin E-postası gönderir.
 */
export const sendWelcomeEmail = async (name: string, email: string): Promise<boolean> => {
  try {
    const settings = getStoredSiteSettings();
    const smtpConfig = settings.smtpSettings;
    const tpl = smtpConfig?.template || DEFAULT_EMAIL_TEMPLATE;

    const resolvedSubject = (
      tpl.subject && !tpl.subject.includes('AKUZ Stickers Ailesine')
        ? tpl.subject
        : 'Ailemize Hoş Geldiniz! ✨'
    )
      .replace('{name}', name)
      .replace('{email}', email);

    const htmlContent = getWelcomeEmailHtml(name, email, tpl);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: resolvedSubject,
        html: htmlContent,
        smtpConfig: smtpConfig,
      }),
    });

    const data = await response.json();
    if (data.success) {
      console.log('[WELCOME EMAIL SUCCESS]', email, data);
      return true;
    } else {
      console.warn('[WELCOME EMAIL ERROR]', data.error);
      return false;
    }
  } catch (err) {
    console.error('[WELCOME EMAIL EXCEPTION]', err);
    return false;
  }
};

/**
 * Hoş geldin e-postasını hata detayını da dönecek şekilde gönderir (Admin testleri için)
 */
export const sendWelcomeEmailDetailed = async (name: string, email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const settings = getStoredSiteSettings();
    const smtpConfig = settings.smtpSettings;
    const tpl = smtpConfig?.template || DEFAULT_EMAIL_TEMPLATE;

    const resolvedSubject = (
      tpl.subject && !tpl.subject.includes('AKUZ Stickers Ailesine')
        ? tpl.subject
        : 'Ailemize Hoş Geldiniz! ✨'
    )
      .replace('{name}', name)
      .replace('{email}', email);

    const htmlContent = getWelcomeEmailHtml(name, email, tpl);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: resolvedSubject,
        html: htmlContent,
        smtpConfig: smtpConfig,
      }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: 'Sunucu API yanıtı yerine web sayfası (HTML) döndürdü. cPanel public_html içinde api/ klasörü ve .htaccess dosyasının yüklendiğinden emin olun.',
      };
    }

    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Sunucu hatası' };
  }
};

/**
 * Sipariş oluşturulduğunda veya hazırlığa alındığında "Siparişiniz Hazırlanıyor" e-postası gönderir.
 */
export const sendOrderPreparingEmail = async (order: OrderEmailDetails): Promise<boolean> => {
  const res = await sendOrderPreparingEmailDetailed(order);
  return res.success;
};

export const sendOrderPreparingEmailDetailed = async (order: OrderEmailDetails): Promise<{ success: boolean; error?: string }> => {
  try {
    const settings = getStoredSiteSettings();
    const smtpConfig = settings.smtpSettings;
    const subject = `Siparişiniz Hazırlanıyor #${order.orderId} ⏳`;
    const htmlContent = getOrderPreparingEmailHtml(order);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: order.customerEmail,
        subject: subject,
        html: htmlContent,
        smtpConfig: smtpConfig,
      }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: 'Sunucu API yanıtı yerine web sayfası (HTML) döndürdü. cPanel public_html içinde api/ klasörü ve .htaccess dosyasının yüklendiğinden emin olun.',
      };
    }

    if (data.success) {
      console.log('[ORDER PREPARING EMAIL SUCCESS]', order.orderId, data);
      return { success: true };
    } else {
      console.warn('[ORDER PREPARING EMAIL ERROR]', data.error);
      return { success: false, error: data.error };
    }
  } catch (err: any) {
    console.error('[ORDER PREPARING EMAIL EXCEPTION]', err);
    return { success: false, error: err.message || 'Sunucu hatası' };
  }
};

/**
 * Geriye dönük uyumluluk: sendOrderReceivedEmail artık 'Siparişiniz Hazırlanıyor' şablonunu gönderir
 */
export const sendOrderReceivedEmail = sendOrderPreparingEmail;

/**
 * Sipariş kargoya verildiğinde müşteriye "Siparişiniz Kargoya Verildi" e-postası gönderir.
 */
export const sendOrderShippedEmail = async (order: OrderEmailDetails): Promise<boolean> => {
  const res = await sendOrderShippedEmailDetailed(order);
  return res.success;
};

export const sendOrderShippedEmailDetailed = async (order: OrderEmailDetails): Promise<{ success: boolean; error?: string }> => {
  try {
    const settings = getStoredSiteSettings();
    const smtpConfig = settings.smtpSettings;
    const trackingInfo = order.trackingNumber ? ` (Takip: ${order.trackingNumber})` : '';
    const subject = `Siparişiniz Kargoya Verildi! #${order.orderId} 🚀${trackingInfo}`;
    const htmlContent = getOrderShippedEmailHtml(order);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: order.customerEmail,
        subject: subject,
        html: htmlContent,
        smtpConfig: smtpConfig,
      }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: 'Sunucu API yanıtı yerine web sayfası (HTML) döndürdü. cPanel public_html içinde api/ klasörü ve .htaccess dosyasının yüklendiğinden emin olun.',
      };
    }

    if (data.success) {
      console.log('[ORDER SHIPPED EMAIL SUCCESS]', order.orderId, data);
      return { success: true };
    } else {
      console.warn('[ORDER SHIPPED EMAIL ERROR]', data.error);
      return { success: false, error: data.error };
    }
  } catch (err: any) {
    console.error('[ORDER SHIPPED EMAIL EXCEPTION]', err);
    return { success: false, error: err.message || 'Sunucu hatası' };
  }
};

/**
 * Sipariş teslim edildiğinde müşteriye "Siparişiniz Teslim Edildi" e-postası gönderir.
 */
export const sendOrderDeliveredEmail = async (order: OrderEmailDetails): Promise<boolean> => {
  const res = await sendOrderDeliveredEmailDetailed(order);
  return res.success;
};

export const sendOrderDeliveredEmailDetailed = async (order: OrderEmailDetails): Promise<{ success: boolean; error?: string }> => {
  try {
    const settings = getStoredSiteSettings();
    const smtpConfig = settings.smtpSettings;
    const subject = `Siparişiniz Teslim Edildi #${order.orderId} ✨`;
    const htmlContent = getOrderDeliveredEmailHtml(order);

    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: order.customerEmail,
        subject: subject,
        html: htmlContent,
        smtpConfig: smtpConfig,
      }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        error: 'Sunucu API yanıtı yerine web sayfası (HTML) döndürdü. cPanel public_html içinde api/ klasörü ve .htaccess dosyasının yüklendiğinden emin olun.',
      };
    }

    if (data.success) {
      console.log('[ORDER DELIVERED EMAIL SUCCESS]', order.orderId, data);
      return { success: true };
    } else {
      console.warn('[ORDER DELIVERED EMAIL ERROR]', data.error);
      return { success: false, error: data.error };
    }
  } catch (err: any) {
    console.error('[ORDER DELIVERED EMAIL EXCEPTION]', err);
    return { success: false, error: err.message || 'Sunucu hatası' };
  }
};

/**
 * cPanel SMTP Bağlantısını test eder
 */
export const testSmtpConnection = async (smtpConfig: SmtpConfig): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/test-smtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ smtpConfig }),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return {
        success: false,
        message: 'Sunucu API yanıtı yerine web sayfası (HTML) döndürdü. cPanel public_html içinde api/ klasörü ve .htaccess dosyasının yüklendiğinden emin olun.',
      };
    }

    if (data.success) {
      return { success: true, message: data.message || 'SMTP bağlantısı başarılı!' };
    } else {
      return { success: false, message: data.error || 'Bağlantı başarısız oldu.' };
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Sunucuya bağlanırken bir hata oluştu.' };
  }
};
