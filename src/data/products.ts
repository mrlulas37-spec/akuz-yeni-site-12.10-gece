import { Product } from '../types';

export const COLOR_OPTIONS = [
  { name: 'Siyah', hex: '#111827' },
  { name: 'Beyaz', hex: '#ffffff' },
  { name: 'Hologramlı', hex: 'linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)' },
  { name: 'Kırmızı', hex: '#dc2626' },
  { name: 'Mavi', hex: '#2563eb' },
  { name: 'Gold', hex: '#d97706' },
  { name: 'Gümüş', hex: '#94a3b8' },
  { name: 'Yeşil', hex: '#16a34a' },
  { name: 'Sarı', hex: '#eab308' },
  { name: 'Mor', hex: '#9333ea' },
  { name: 'Lacivert', hex: '#1e3a8a' },
  { name: 'Turuncu', hex: '#ea580c' },
];

export const PRODUCTS: Product[] = [
  {
    "id": "kisiye-ozel-yazi-sticker",
    "name": "KİŞİYE ÖZEL YAZI & İSİM STICKER",
    "slug": "kisiye-ozel-yazi",
    "category": "custom",
    "currentPrice": 49,
    "oldPrice": 99,
    "rating": 5,
    "reviewsCount": 14,
    "isPopular": true,
    "isDiscounted": true,
    "isCustomText": true,
    "freeLetterCount": 10,
    "extraLetterPrice": 4,
    "dimensionPrices": {
      "20x5 cm": 49,
      "30x7 cm": 69,
      "45x10 cm": 99,
      "60x14 cm": 139,
      "80x18 cm": 189
    },
    "tag": "KİŞİYE ÖZEL",
    "description": "İstediğiniz metni, ismi, Instagram kullanıcı adını, araba modelini veya sloganınızı yazın; onlarca yarış, gotik, modern ve el yazısı fontu arasından anında canlı önizleme ile seçiminizi yapın. 1. kalite döküm transfer vinil folyo ile kesilir ve transfer bandı ile kullanıma hazır gönderilir.",
    "svgType": "logo",
    "dimensions": [
      "20x5 cm",
      "30x7 cm",
      "45x10 cm",
      "60x14 cm",
      "80x18 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ]
  },
  {
    "id": "ataturk-imza-sticker",
    "name": "KEMAL ATATÜRK İMZA",
    "slug": "ataturk-imza",
    "category": "ataturk",
    "currentPrice": 39,
    "oldPrice": 79,
    "rating": 0,
    "reviewsCount": 0,
    "isPopular": true,
    "isDiscounted": true,
    "dimensionPrices": {
      "12x5 cm": 39,
      "18x7 cm": 59,
      "25x10 cm": 79,
      "35x14 cm": 109
    },
    "tag": "ÇOK SATAN",
    "description": "Gazi Mustafa Kemal Atatürk orijinal vektörel ıslak imza çıkartması. Araba arka camı, ön cam köşesi, bagaj kapağı veya motosiklet için hassas kesim yüksek kaliteli vinil folyo transfer.",
    "svgType": "logo",
    "imageUrl": "/products/IMG_1138.jpeg",
    "images": [
      "/products/IMG_1138.jpeg",
      "/products/IMG_1140.jpeg"
    ],
    "dimensions": [
      "12x5 cm",
      "18x7 cm",
      "25x10 cm",
      "35x14 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ],
    "colorImages": {
      "Siyah": "/products/IMG_1138.jpeg",
      "Beyaz": "/products/IMG_1140.jpeg"
    }
  },
  {
    "id": "bagajdan-bakan-canavar-sticker",
    "name": "BAGAJDAN BAKAN CANAVAR",
    "slug": "bagajdan-bakan-canavar",
    "category": "araba",
    "currentPrice": 49,
    "oldPrice": 89,
    "rating": 0,
    "reviewsCount": 0,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "YENİ ÜRÜN",
    "description": "Bagaj kapağından, araba camından veya kaportadan sinsice bakan gözleriyle dikkat çeken canavar tasarımı çıkartma folyo. Güneşe, yıkamaya ve hava koşullarına dayanıklı yüksek kaliteli vinil sticker.",
    "svgType": "logo",
    "imageUrl": "/products/IMG_1141.jpeg",
    "images": [
      "/products/IMG_1141.jpeg",
      "/products/IMG_1142.jpeg"
    ],
    "dimensions": [
      "15x10 cm",
      "20x13 cm",
      "25x16 cm",
      "30x20 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ],
    "colorImages": {
      "Siyah": "/products/IMG_1141.jpeg"
    }
  },
  {
    "id": "gazi-mustafa-kemal-ataturk-imza-sticker",
    "name": "GAZİ MUSTAFA KEMAL ATATÜRK İMZA",
    "slug": "gazi-mustafa-kemal-ataturk-imza",
    "category": "ataturk",
    "currentPrice": 45,
    "oldPrice": 85,
    "rating": 0,
    "reviewsCount": 0,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "YENİ ÜRÜN",
    "description": "Gazi Mustafa Kemal Atatürk özel tasarım imza çıkartması. Araç camı, kaporta, dizüstü bilgisayar ve pürüzsüz tüm yüzeyler için yüksek kaliteli transfer vinil sticker.",
    "svgType": "logo",
    "imageUrl": "/products/IMG_1147.webp",
    "images": [
      "/products/IMG_1147.webp",
      "/products/IMG_1146.jpeg"
    ],
    "dimensions": [
      "15x6 cm",
      "20x8 cm",
      "25x10 cm",
      "35x14 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ],
    "colorImages": {
      "Siyah": "/products/IMG_1147.webp",
      "Hologramlı": "/products/IMG_1146.jpeg"
    }
  },
  {
    "id": "yaramaz-cocuk-sticker",
    "name": "YARAMAZ ÇOCUK",
    "slug": "yaramaz-cocuk",
    "category": "araba",
    "currentPrice": 39,
    "oldPrice": 79,
    "rating": 0,
    "reviewsCount": 0,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "YENİ ÜRÜN",
    "description": "Araba camı, depo kapağı veya bagaj için eğlenceli ve dikkat çekici yaramaz çocuk figür çıkartması. Suya, güneşe ve yüksek basınçlı oto yıkamaya tam dayanıklı birinci sınıf transfer folyo.",
    "svgType": "logo",
    "imageUrl": "/products/IMG_1143.webp",
    "images": [
      "/products/IMG_1143.webp",
      "/products/IMG_1144.webp"
    ],
    "dimensions": [
      "12x10 cm",
      "16x13 cm",
      "20x16 cm",
      "25x20 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ]
  },
  {
    "id": "la-familia-es-todo-sticker",
    "name": "LA FAMILIA ES TODO",
    "slug": "la-familia-es-todo",
    "category": "araba",
    "currentPrice": 45,
    "oldPrice": 85,
    "rating": 0,
    "reviewsCount": 0,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "YENİ ÜRÜN",
    "description": "İtalyanca ve İspanyolca kültürün güçlü simgesi \"La Familia Es Todo\" (Aile Her Şeydir) tipografik ve gotik hat çıkartması. Araç arka camı, kapı altı, bagaj ve motosiklet yüzeyleri için özel kesim dayanıklı vinil transfer sticker.",
    "svgType": "logo",
    "imageUrl": "/products/phonto.jpeg",
    "images": [
      "/products/phonto.jpeg",
      "/products/AkuzStickers_LaFamilia.jpg"
    ],
    "dimensions": [
      "20x5 cm",
      "30x7 cm",
      "45x10 cm",
      "60x14 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ]
  },
  {
    "id": "dikiz-yan-ayna-serit-sticker",
    "name": "DİKİZ & YAN AYNA ÇİZGİ ŞERİT STİCKER",
    "slug": "dikiz-yan-ayna-serit",
    "category": "ayna",
    "currentPrice": 39,
    "oldPrice": 75,
    "rating": 5,
    "reviewsCount": 6,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "AYNA ÖZEL",
    "description": "Aracınızın sağ ve sol yan dikiz aynaları için özel boyutlandırılmış dinamik spor şerit çıkartma folyo. Güneşe, suya ve basınçlı oto yıkamaya tam dayanıklı döküm vinil transfer sticker.",
    "svgType": "logo",
    "imageUrl": "/akuz-logo-badge.png",
    "dimensions": [
      "15x2 cm",
      "20x2.5 cm",
      "25x3 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ]
  },
  {
    "id": "the-doctor-46-motosiklet-sticker",
    "name": "THE DOCTOR 46 YARIŞ MOTOR STICKER",
    "slug": "the-doctor-46-yaris-motor-sticker",
    "category": "motosiklet",
    "currentPrice": 39,
    "oldPrice": 79,
    "rating": 5,
    "reviewsCount": 18,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "MOTOSİKLET",
    "description": "Efsanevi VR46 The Doctor yarış çıkartması. Motosiklet grenajı, kask, ön cam, depo ve kuyruk için yüksek mukavemetli transfer vinil folyo.",
    "svgType": "logo",
    "imageUrl": "/products/IMG_1141.jpeg",
    "images": [
      "/products/IMG_1141.jpeg"
    ],
    "dimensions": [
      "12x8 cm",
      "16x11 cm",
      "20x14 cm",
      "25x18 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ]
  },
  {
    "id": "kask-depo-pence-motosiklet-sticker",
    "name": "MONSTER PENÇE MOTOR STICKER",
    "slug": "monster-pence-motor-sticker",
    "category": "motosiklet",
    "currentPrice": 35,
    "oldPrice": 69,
    "rating": 4.9,
    "reviewsCount": 12,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "MOTOSİKLET",
    "description": "Motosiklet kaskı, depo yanı ve far üstü için 3 parçalı pençe tırmalama sticker folyo. Güneşe ve basınçlı suya tam dayanıklıdır.",
    "svgType": "logo",
    "imageUrl": "/products/IMG_1143.webp",
    "images": [
      "/products/IMG_1143.webp"
    ],
    "dimensions": [
      "15x5 cm",
      "20x7 cm",
      "28x10 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ]
  },
  {
    "id": "4x4-offroad-camur-pence-sticker",
    "name": "4x4 OFF-ROAD ÇAMUR PENÇE",
    "slug": "4x4-offroad-camur-pence",
    "category": "offroad",
    "currentPrice": 49,
    "oldPrice": 99,
    "rating": 5,
    "reviewsCount": 9,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "4x4 OFF-ROAD",
    "description": "4x4 arazi araçları, pickup ve SUV arka çamurluk, kapı altı ve bagaj için çamurlu arazi şartlarına tam dayanıklı vinil transfer sticker.",
    "svgType": "logo",
    "imageUrl": "/products/AkuzStickers_LaFamilia.jpg",
    "images": [
      "/products/AkuzStickers_LaFamilia.jpg"
    ],
    "dimensions": [
      "25x12 cm",
      "35x17 cm",
      "50x24 cm",
      "70x34 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ]
  },
  {
    "id": "pusula-dag-offroad-arazi-sticker",
    "name": "PUSULA & DAĞ 4x4 ARAZİ STICKER",
    "slug": "pusula-dag-4x4-arazi-sticker",
    "category": "offroad",
    "currentPrice": 55,
    "oldPrice": 110,
    "rating": 5,
    "reviewsCount": 15,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "4x4 OFF-ROAD",
    "description": "Gezgin, kampçı ve arazi tutkunları için kaput ve arka bagaj kapağı pusula ve dağ silueti vinil çıkartma folyo.",
    "svgType": "logo",
    "imageUrl": "/products/IMG_1147.webp",
    "images": [
      "/products/IMG_1147.webp"
    ],
    "dimensions": [
      "25x25 cm",
      "35x35 cm",
      "50x50 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ]
  },
  {
    "id": "yarasa-ayna-spor-serit-sticker",
    "name": "YARASA AYNA & DİKİZ SPOR ŞERİT",
    "slug": "yarasa-ayna-dikiz-spor-serit",
    "category": "ayna",
    "currentPrice": 35,
    "oldPrice": 70,
    "rating": 5,
    "reviewsCount": 7,
    "isPopular": true,
    "isDiscounted": true,
    "tag": "AYNA ÖZEL",
    "description": "Sağ ve sol ayna kapakları için aerodinamik spor çizgi ve ok çıkartması. Suya, güneşe ve yüksek basınçlı oto yıkamaya tam dayanıklı döküm vinil.",
    "svgType": "logo",
    "imageUrl": "/akuz-logo-badge.png",
    "dimensions": [
      "16x2.5 cm",
      "20x3 cm",
      "24x3.5 cm"
    ],
    "colors": [
      {
        "name": "Siyah",
        "hex": "#111827"
      },
      {
        "name": "Beyaz",
        "hex": "#ffffff"
      },
      {
        "name": "Hologramlı",
        "hex": "linear-gradient(135deg, #a78bfa 0%, #38bdf8 35%, #ec4899 70%, #facc15 100%)"
      },
      {
        "name": "Kırmızı",
        "hex": "#dc2626"
      },
      {
        "name": "Mavi",
        "hex": "#2563eb"
      },
      {
        "name": "Gold",
        "hex": "#d97706"
      },
      {
        "name": "Gümüş",
        "hex": "#94a3b8"
      },
      {
        "name": "Yeşil",
        "hex": "#16a34a"
      },
      {
        "name": "Sarı",
        "hex": "#eab308"
      },
      {
        "name": "Mor",
        "hex": "#9333ea"
      },
      {
        "name": "Lacivert",
        "hex": "#1e3a8a"
      },
      {
        "name": "Turuncu",
        "hex": "#ea580c"
      }
    ],
    "finishes": [
      "Mat",
      "Parlak"
    ]
  }
];
