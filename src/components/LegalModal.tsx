import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: string | null;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  documentType,
}) => {
  if (!isOpen || !documentType) return null;

  const getContent = () => {
    switch (documentType) {
      case 'kvkk':
        return {
          title: 'KVKK Aydınlatma Metni',
          text: `6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla AKUZ Stickers olarak; ad, soyad, iletişim bilgileri, sipariş ve adres verileriniz; siparişlerin işleme alınması, faturalandırma ve teslimat süreçlerinin yürütülmesi amaçlarıyla sınırlı olarak işlenmektedir. Verileriniz, yasal yükümlülükler ve kargo şirketleri hariç üçüncü şahıslarla paylaşılmaz.`,
        };
      case 'gizlilik':
        return {
          title: 'Gizlilik Politikası',
          text: `AKUZ Stickers, kullanıcılarının gizliliğine ve bilgi güvenliğine azami önem vermektedir. Web sitemiz üzerinden toplanan kişisel verileriniz hiçbir şart altında ticari amaçla satılmaz veya yetkisiz taraflarla paylaşılmaz. Tüm veri transferleri SSL şifreleme protokolleri ile güvence altındadır.`,
        };
      case 'kullanim':
        return {
          title: 'Kullanım Koşulları',
          text: `AKUZ Stickers web sitesini ziyaret eden veya sipariş veren her kullanıcı kullanım koşullarını kabul etmiş sayılır. Sitede yer alan tüm tasarım, logo, grafik ve metinlerin fikri mülkiyet hakları AKUZ Stickers'a aittir. İzinsiz çoğaltılamaz ve ticari amaçla kopyalanamaz.`,
        };
      case 'mesafeli_satis':
        return {
          title: 'Mesafeli Satış Sözleşmesi',
          text: `Bu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince düzenlenmiştir. Alıcı, satın aldığı ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimat koşulları hakkında önceden bilgilendirildiğini teyit eder.`,
        };
      case 'iade':
        return {
          title: 'İptal & İade Politikası',
          text: `Standart sticker ürünlerimizde ambalajı açılmamış, taşıyıcı transfer bandı yırtılmamış ve yapıştırılmamış ürünleri teslimat tarihinden itibaren 14 gün içinde koşulsuz iade edebilirsiniz. Müşteriye özel üretilen kişiselleştirilmiş yazılı stickerlarda ve özel kesim ürünlerde cayma hakkı yönetmelik gereği geçerli değildir. Hasarlı kargo durumunda kargo görevlisine tutanak tutturulmalıdır.`,
        };
      case 'cerez':
        return {
          title: 'Çerez Politikası',
          text: `Sitemizde sepetinizin hatırlanması, kullanıcı oturumunun korunması ve alışveriş deneyiminizin iyileştirilmesi amacıyla zorunlu çerezler kullanılmaktadır. Tarayıcı ayarlarınız üzerinden çerez tercihlerinizi dilediğiniz zaman değiştirebilirsiniz.`,
        };
      default:
        return {
          title: 'Yasal Bilgilendirme',
          text: 'Detaylı bilgi için lütfen akuzstickers@gmail.com üzerinden bizimle iletişime geçiniz.',
        };
    }
  };

  const { title, text } = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl p-6 sm:p-8 border border-slate-200 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-md bg-orange-50 text-orange-600">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 font-display">{title}</h3>
        </div>

        <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">
          {text}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
