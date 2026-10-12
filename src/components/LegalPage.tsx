import React from 'react';
import { ShieldCheck, ArrowLeft, FileText, Scale, RefreshCw, Cookie, Shield } from 'lucide-react';

export type LegalDocId = 'kvkk' | 'gizlilik' | 'kullanim' | 'mesafeli_satis' | 'iade' | 'cerez';

export const LEGAL_DOCS_DATA: Record<LegalDocId, {
  title: string;
  slug: string;
  badge: string;
  icon: React.ElementType;
  sections: { heading: string; body: string }[];
}> = {
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    slug: 'kvkk',
    badge: 'Kişisel Verilerin Korunması',
    icon: ShieldCheck,
    sections: [
      {
        heading: '1. Veri Sorumlusunun Kimliği',
        body: '6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, veri sorumlusu sıfatıyla AKUZ Stickers olarak; ad, soyad, iletişim bilgileri, sipariş ve adres verileriniz; siparişlerin işleme alınması, faturalandırma ve teslimat süreçlerinin yürütülmesi amaçlarıyla sınırlı olarak işlenmektedir.',
      },
      {
        heading: '2. İşlenen Kişisel Verileriniz',
        body: 'Sitemiz üzerinden alışveriş yaparken ya da üye olurken paylaştığınız Ad, Soyad, E-Posta, Teslimat Adresi, Telefon Numarası ve Sipariş Geçmişi bilgileri kaydedilmektedir. Kredi kartı ve ödeme bilgileri sistemlerimizde asla saklanmaz, doğrudan lisanslı güvenli ödeme altyapısı tarafından işlenir.',
      },
      {
        heading: '3. Kişisel Verilerin Aktarılması',
        body: 'Toplanan veriler, yalnızca siparişinizin adresinize ulaştırılabilmesi için anlaşmalı kargo firmalarıyla ve yasal bir zorunluluk doğması durumunda yetkili adli mercilerle paylaşılabilir. Üçüncü şahıslara veya reklam ağlarına kesinlikle satılmaz.',
      },
      {
        heading: '4. KVKK 11. Madde Kapsamındaki Haklarınız',
        body: 'Kişisel verilerinizin işlenip işlenmediğini öğrenme, yanlış işlenmişse düzeltilmesini talep etme ve verilerinizin silinmesini isteme hakkına sahipsiniz. Başvurularınızı akuzstickers@gmail.com adresine iletebilirsiniz.',
      },
    ],
  },
  gizlilik: {
    title: 'Gizlilik ve Güvenlik Politikası',
    slug: 'gizlilik-politikasi',
    badge: 'Bilgi Güvenliği',
    icon: Shield,
    sections: [
      {
        heading: '1. Gizlilik İlkemiz',
        body: 'AKUZ Stickers, kullanıcılarının gizliliğine ve bilgi güvenliğine azami önem vermektedir. Web sitemiz üzerinden toplanan kişisel verileriniz hiçbir şart altında ticari amaçla satılmaz veya yetkisiz taraflarla paylaşılmaz.',
      },
      {
        heading: '2. SSL Şifreleme ve Güvenlik',
        body: 'Sitemizde gerçekleştirilen tüm işlemler 256-bit SSL güvenlik sertifikası ile korunmaktadır. Tarayıcınız ile sunucularımız arasındaki bilgi akışı tamamen kriptolu olarak gerçekleşir.',
      },
      {
        heading: '3. Hesap Güvenliği',
        body: 'Hesap şifrenizin gizliliği sizin sorumluluğunuzdadır. AKUZ Stickers yetkilileri sizden hiçbir koşulda şifrenizi e-posta veya mesaj yoluyla talep etmez.',
      },
    ],
  },
  kullanim: {
    title: 'Kullanım Koşulları',
    slug: 'kullanim-kosullari',
    badge: 'Site Şartları',
    icon: Scale,
    sections: [
      {
        heading: '1. Kabul Edilme Şartları',
        body: 'AKUZ Stickers web sitesini ziyaret eden veya sipariş veren her kullanıcı kullanım koşullarını kabul etmiş sayılır.',
      },
      {
        heading: '2. Fikri Mülkiyet Hakları',
        body: 'Sitede yer alan tüm tasarım, logo, grafik ve metinlerin fikri mülkiyet hakları AKUZ Stickers\'a aittir. İzinsiz çoğaltılamaz, kopyalanamaz veya ticari amaçla yeniden dağıtılamaz.',
      },
      {
        heading: '3. Hizmet Değişiklikleri',
        body: 'AKUZ Stickers, ürün fiyatlarında, tasarım modellerinde ve site içeriğinde önceden haber vermeksizin değişiklik yapma hakkını saklı tutar.',
      },
    ],
  },
  mesafeli_satis: {
    title: 'Mesafeli Satış Sözleşmesi',
    slug: 'mesafeli-satis-sozlesmesi',
    badge: 'Tüketici Hakları',
    icon: FileText,
    sections: [
      {
        heading: '1. Taraflar ve Kapsam',
        body: 'Bu sözleşme, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince düzenlenmiştir. Satıcı: AKUZ Stickers. Alıcı: Site üzerinden sipariş oluşturan gerçek veya tüzel kişidir.',
      },
      {
        heading: '2. Ürün ve Teslimat Bilgileri',
        body: 'Alıcı, satın aldığı ürünün temel nitelikleri, satış fiyatı, ödeme şekli ve teslimat koşulları hakkında önceden bilgilendirildiğini teyit eder. Sipariş onaylandıktan sonra belirlenen süre içinde kargoya teslim edilir.',
      },
      {
        heading: '3. Kargo ve Teslimat',
        body: 'Ürün, alıcının belirttiği adrese güvenli koruyucu ambalajında transfer bandı ile birlikte gönderilir. Teslim anında kargo paketinde belirgin hasar bulunması halinde tutanak tutturulmalıdır.',
      },
    ],
  },
  iade: {
    title: 'İptal ve İade Politikası',
    slug: 'iptal-ve-iade',
    badge: 'İade & Değişim',
    icon: RefreshCw,
    sections: [
      {
        heading: '1. 14 Gün Koşulsuz İade Hakkı',
        body: 'Standart hazır sticker ürünlerimizde ambalajı açılmamış, taşıyıcı transfer bandı yırtılmamış ve herhangi bir yüzeye yapıştırılmamış ürünleri teslimat tarihinden itibaren 14 gün içinde koşulsuz iade edebilirsiniz.',
      },
      {
        heading: '2. Özel Tasarım ve Kişiselleştirilmiş Ürünler',
        body: 'Müşteriye özel üretilen kişiselleştirilmiş yazılı, özel plakalı veya özel ölçülü stickerlarda tüketici mevzuatı gereği keyfi cayma hakkı bulunmamaktadır.',
      },
      {
        heading: '3. İade Süreci ve Geri Ödeme',
        body: 'İade edilecek ürün sağlam ambalajıyla gönderilmeli ve kargo takip numarası bildirilmelidir. Ürün tarafımıza ulaşıp incelendikten sonra 3-5 iş günü içinde ücret iadesi yapılır.',
      },
    ],
  },
  cerez: {
    title: 'Çerez Politikası',
    slug: 'cerez-politikasi',
    badge: 'Cookies',
    icon: Cookie,
    sections: [
      {
        heading: '1. Çerez Nedir?',
        body: 'Çerezler, web sitemizi ziyaret ettiğinizde cihazınıza kaydedilen küçük metin dosyalarıdır. Sitemizin düzgün çalışmasını ve oturumunuzun korunmasını sağlar.',
      },
      {
        heading: '2. Kullanılan Çerez Türleri',
        body: 'Sitemizde sepetinizin hatırlanması, kullanıcı oturumunun korunması ve ziyaret tercihlerinizin kaydedilmesi amacıyla temel zorunlu çerezler kullanılmaktadır.',
      },
      {
        heading: '3. Çerez Tercihleri',
        body: 'Tarayıcı ayarlarınız üzerinden çerez tercihlerinizi dilediğiniz zaman sınırlandırabilir veya tamamen silebilirsiniz.',
      },
    ],
  },
};

interface LegalPageProps {
  docId: LegalDocId;
  onGoHome: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ docId, onGoHome }) => {
  const doc = LEGAL_DOCS_DATA[docId] || LEGAL_DOCS_DATA.kvkk;
  const IconComponent = doc.icon;

  return (
    <div className="bg-[#fcfbf9] min-h-[80vh] py-10 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb / Back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#ff0055] transition-colors py-2 px-3 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft size={18} />
            Ana Sayfaya Dön
          </button>

          <span className="text-xs text-slate-400 font-mono font-medium">/{doc.slug}</span>
        </div>

        {/* Main Document Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-xl space-y-8">
          
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#ff0055] bg-pink-50 border border-pink-200/80 px-2.5 py-1 rounded-md inline-block mb-3">
                {doc.badge}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 font-display">
                {doc.title}
              </h1>
              <p className="text-xs text-slate-400 mt-1.5">AKUZ Stickers Resmi Bilgilendirme Metni • Yürürlük Yılı: 2026</p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-pink-50 text-[#ff0055] flex items-center justify-center shrink-0 border border-pink-100 shadow-xs">
              <IconComponent size={28} />
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-6 text-slate-700 text-sm sm:text-base leading-relaxed">
            {doc.sections.map((sec, idx) => (
              <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
                <h2 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {sec.heading}
                </h2>
                <p className="text-slate-600 font-normal leading-relaxed text-sm sm:text-[15px]">
                  {sec.body}
                </p>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
