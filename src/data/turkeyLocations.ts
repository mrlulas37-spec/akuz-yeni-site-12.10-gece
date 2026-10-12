export interface ProvinceData {
  name: string;
  districts: string[];
}

export const TURKEY_PROVINCES: Record<string, string[]> = {
  'Adana': [
    'Seyhan', 'Yüreğir', 'Çukurova', 'Sarıçam', 'Ceyhan', 'Kozan', 'İmamoğlu',
    'Karataş', 'Karaisalı', 'Pozantı', 'Yumurtalık', 'Tufanbeyli', 'Feke', 'Aladağ', 'Saimbeyli'
  ],
  'Adıyaman': [
    'Merkez', 'Besni', 'Kahta', 'Gölbaşı', 'Gerger', 'Sincik', 'Çelikhan', 'Samsat', 'Tut'
  ],
  'Afyonkarahisar': [
    'Merkez', 'Sandıklı', 'Dinar', 'Bolvadin', 'Sinanpaşa', 'Emirdağ', 'Şuhut',
    'Çay', 'İhsaniye', 'İscehisar', 'Sultandağı', 'Çobanlar', 'Dazkırı', 'Başmakçı', 'Evciler', 'Bayat', 'Hocalar', 'Kızılören'
  ],
  'Ağrı': [
    'Merkez', 'Patnos', 'Doğubayazıt', 'Diyadin', 'Eleşkirt', 'Tutak', 'Taşlıçay', 'Hamur'
  ],
  'Aksaray': [
    'Merkez', 'Ortaköy', 'Eskil', 'Gülağaç', 'Güzelyurt', 'Ağaçören', 'Sarıyahşi', 'Sultanhanı'
  ],
  'Amasya': [
    'Merkez', 'Merzifon', 'Suluova', 'Taşova', 'Gümüşhacıköy', 'Göynücek', 'Hamamözü'
  ],
  'Ankara': [
    'Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Etimesgut', 'Sincan', 'Altındağ',
    'Pursaklar', 'Gölbaşı', 'Polatlı', 'Çubuk', 'Kahramankazan', 'Beypazarı', 'Elmadağ',
    'Akyurt', 'Nallıhan', 'Haymana', 'Kızılcahamam', 'Bala', 'Kalecik', 'Ayaş', 'Güdül', 'Çamlıdere', 'Evren', 'Şereflikoçhisar'
  ],
  'Antalya': [
    'Muratpaşa', 'Kepez', 'Konyaaltı', 'Alanya', 'Manavgat', 'Serik', 'Aksu',
    'Kumluca', 'Kaş', 'Korkuteli', 'Gazipaşa', 'Finike', 'Kemer', 'Elmalı', 'Demre', 'Akseki', 'Gündoğmuş', 'İbradı'
  ],
  'Ardahan': [
    'Merkez', 'Göle', 'Çıldır', 'Hanak', 'Posof', 'Damal'
  ],
  'Artvin': [
    'Merkez', 'Hopa', 'Borçka', 'Arhavi', 'Yusufeli', 'Şavşat', 'Ardanuç', 'Murgul', 'Kemalpaşa'
  ],
  'Aydın': [
    'Efeler', 'Nazilli', 'Söke', 'Kuşadası', 'Didim', 'İncirliova', 'Germencik',
    'Çine', 'Bozdoğan', 'Köşk', 'Kuyucak', 'Sultanhisar', 'Karacasu', 'Buharkent', 'Yenipazar', 'Karpuzlu'
  ],
  'Balıkesir': [
    'Karesi', 'Altıeylül', 'Bandırma', 'Edremit', 'Gönen', 'Ayvalık', 'Burhaniye',
    'Bigadiç', 'Susurluk', 'Dursunbey', 'Sındırgı', 'İvrindi', 'Erdek', 'Havran', 'Manyas', 'Savaştepe', 'Balya', 'Gömeç', 'Kepsut', 'Marmara'
  ],
  'Bartın': [
    'Merkez', 'Ulus', 'Amasra', 'Kurucaşile'
  ],
  'Batman': [
    'Merkez', 'Kozluk', 'Sason', 'Beşiri', 'Gercüş', 'Hasankeyf'
  ],
  'Bayburt': [
    'Merkez', 'Demirözü', 'Aydıntepe'
  ],
  'Bilecik': [
    'Merkez', 'Bozüyük', 'Osmaneli', 'Söğüt', 'Gölpazarı', 'Pazaryeri', 'Yenipazar', 'İnhisar'
  ],
  'Bingöl': [
    'Merkez', 'Genç', 'Solhan', 'Karlıova', 'Adaklı', 'Kiğı', 'Yedisu', 'Yayladere'
  ],
  'Bitlis': [
    'Tatvan', 'Merkez', 'Güroymak', 'Ahlat', 'Hizan', 'Mutki', 'Adilcevaz'
  ],
  'Bolu': [
    'Merkez', 'Gerede', 'Mudurnu', 'Göynük', 'Mengen', 'Yeniçağa', 'Dörtdivan', 'Seben', 'Kıbrıscık'
  ],
  'Burdur': [
    'Merkez', 'Bucak', 'Gölhisar', 'Yeşilova', 'Çavdır', 'Tefenni', 'Karamanlı', 'Ağlasun', 'Kemer', 'Altınyayla', 'Çeltikçi'
  ],
  'Bursa': [
    'Osmangazi', 'Yıldırım', 'Nilüfer', 'İnegöl', 'Gemlik', 'Mustafakemalpaşa', 'Mudanya',
    'Gürsu', 'Karacabey', 'Orhangazi', 'Kestel', 'Yenişehir', 'İznik', 'Orhaneli', 'Keles', 'Büyükorhan', 'Harmancık'
  ],
  'Çanakkale': [
    'Merkez', 'Biga', 'Çan', 'Gelibolu', 'Yenice', 'Ayvacık', 'Ezine', 'Bayramiç', 'Lapseki', 'Eceabat', 'Gökçeada', 'Bozcaada'
  ],
  'Çankırı': [
    'Merkez', 'Çerkeş', 'Ilgaz', 'Orta', 'Şabanözü', 'Kurşunlu', 'Yapraklı', 'Kızılırmak', 'Eldivan', 'Atkaracalar', 'Korgun', 'Bayramören'
  ],
  'Çorum': [
    'Merkez', 'Sungurlu', 'Osmancık', 'İskilip', 'Alaca', 'Bayat', 'Mecitözü', 'Kargı', 'Ortaköy', 'Uğurludağ', 'Dodurga', 'Oğuzlar', 'Laçin', 'Boğazkale'
  ],
  'Denizli': [
    'Pamukkale', 'Merkezefendi', 'Çivril', 'Acıpayam', 'Tavas', 'Honaz', 'Sarayköy',
    'Buldan', 'Kale', 'Çal', 'Çameli', 'Serinhisar', 'Bozkurt', 'Güney', 'Çardak', 'Bekilli', 'Beyağaç', 'Babadağ', 'Baklan'
  ],
  'Diyarbakır': [
    'Bağlar', 'Kayapınar', 'Yenişehir', 'Sur', 'Ergani', 'Bismil', 'Silvan',
    'Çınar', 'Çermik', 'Dicle', 'Kulp', 'Hani', 'Lice', 'Eğil', 'Hazro', 'Kocaköy', 'Çüngüş'
  ],
  'Düzce': [
    'Merkez', 'Akçakoca', 'Kaynaşlı', 'Gölyaka', 'Çilimli', 'Yığılca', 'Gümüşova', 'Cumayeri'
  ],
  'Edirne': [
    'Merkez', 'Keşan', 'Uzunköprü', 'İpsala', 'Havsa', 'Meriç', 'Enez', 'Süloğlu', 'Lalapaşa'
  ],
  'Elazığ': [
    'Merkez', 'Kovancılar', 'Karakoçan', 'Palu', 'Arıcak', 'Baskil', 'Maden', 'Sivrice', 'Alacakaya', 'Keban', 'Ağın'
  ],
  'Erzincan': [
    'Merkez', 'Tercan', 'Üzümlü', 'Çayırlı', 'İliç', 'Kemah', 'Refahiye', 'Kemaliye', 'Otlukbeli'
  ],
  'Erzurum': [
    'Yakutiye', 'Palandöken', 'Aziziye', 'Horasan', 'Oltu', 'Pasinler', 'Karayazı',
    'Hınıs', 'Tekman', 'Karaçoban', 'Aşkale', 'Şenkaya', 'Çat', 'Köprüköy', 'İspir', 'Tortum', 'Narman', 'Uzundere', 'Olur', 'Pazaryolu'
  ],
  'Eskişehir': [
    'Odunpazarı', 'Tepebaşı', 'Sivrihisar', 'Çifteler', 'Seyitgazi', 'Alpu', 'Mihalıççık',
    'Mahmudiye', 'Beylikova', 'İnönü', 'Günyüzü', 'Han', 'Mihalgazi', 'Sarıcakaya'
  ],
  'Gaziantep': [
    'Şahinbey', 'Şehitkamil', 'Nizip', 'İslahiye', 'Nurdağı', 'Araban', 'Oğuzeli', 'Yavuzeli', 'Karkamış'
  ],
  'Giresun': [
    'Merkez', 'Bulancak', 'Espiye', 'Görele', 'Tirebolu', 'Dereli', 'Şebinkarahisar',
    'Keşap', 'Yağlıdere', 'Alucra', 'Piraziz', 'Eynesil', 'Çamoluk', 'Güce', 'Doğankent', 'Çanakçı'
  ],
  'Gümüşhane': [
    'Merkez', 'Kelkit', 'Şiran', 'Kürtün', 'Torul', 'Köse'
  ],
  'Hakkari': [
    'Yüksekova', 'Merkez', 'Şemdinli', 'Çukurca', 'Derecik'
  ],
  'Hatay': [
    'Antakya', 'İskenderun', 'Defne', 'Dörtyol', 'Samandağ', 'Kırıkhan', 'Reyhanlı',
    'Arsuz', 'Altınözü', 'Hassa', 'Erzin', 'Payas', 'Belen', 'Yayladağı', 'Kumlu'
  ],
  'Iğdır': [
    'Merkez', 'Tuzluca', 'Aralık', 'Karakoyunlu'
  ],
  'Isparta': [
    'Merkez', 'Yalvaç', 'Eğirdir', 'Şarkikaraağaç', 'Gelendost', 'Keçiborlu', 'Senirkent',
    'Sütçüler', 'Gönen', 'Uluborlu', 'Atabey', 'Aksu', 'Yenişarbademli'
  ],
  'İstanbul': [
    'Kadıköy', 'Beşiktaş', 'Şişli', 'Üsküdar', 'Bakırköy', 'Fatih', 'Beyoğlu', 'Sarıyer',
    'Ataşehir', 'Maltepe', 'Kartal', 'Pendik', 'Ümraniye', 'Beykoz', 'Çekmeköy', 'Sancaktepe',
    'Tuzla', 'Şile', 'Sultanbeyli', 'Adalar', 'Bağcılar', 'Bahçelievler', 'Güngören', 'Zeytinburnu',
    'Küçükçekmece', 'Büyükçekmece', 'Başakşehir', 'Avcılar', 'Esenyurt', 'Beylikdüzü', 'Esenler',
    'Sultangazi', 'Gaziosmanpaşa', 'Eyüpsultan', 'Kağıthane', 'Bayrampaşa', 'Arnavutköy', 'Çatalca', 'Silivri'
  ],
  'İzmir': [
    'Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Çiğli', 'Bayraklı', 'Karabağlar', 'Balçova',
    'Narlıdere', 'Güzelbahçe', 'Gaziemir', 'Menemen', 'Torbalı', 'Kemalpaşa', 'Aliağa', 'Menderes',
    'Tire', 'Bergama', 'Ödemiş', 'Urla', 'Seferihisar', 'Çeşme', 'Dikili', 'Foça', 'Bayındır',
    'Kınık', 'Kiraz', 'Selçuk', 'Karaburun', 'Beydağ'
  ],
  'Kahramanmaraş': [
    'Onikişubat', 'Dulkadiroğlu', 'Elbistan', 'Afşin', 'Türkoğlu', 'Pazarcık', 'Göksun', 'Andırın', 'Çağlayancerit', 'Ekinözü', 'Nurhak'
  ],
  'Karabük': [
    'Merkez', 'Safranbolu', 'Yenice', 'Eskipazar', 'Eflani', 'Ovacık'
  ],
  'Karaman': [
    'Merkez', 'Ermenek', 'Sarıveliler', 'Ayrancı', 'Kazımkarabekir', 'Başyayla'
  ],
  'Kars': [
    'Merkez', 'Kağızman', 'Sarıkamış', 'Selim', 'Digor', 'Arpaçay', 'Akyaka', 'Susuz'
  ],
  'Kastamonu': [
    'Merkez', 'Tosya', 'Taşköprü', 'Cide', 'İnebolu', 'Araç', 'Devrekani', 'Bozkurt',
    'Daday', 'Küre', 'Çatalzeytin', 'Doğanyurt', 'Azdavay', 'İhsangazi', 'Pınarbaşı', 'Şenpazar', 'Abana', 'Seydiler', 'Hanönü', 'Ağlı'
  ],
  'Kayseri': [
    'Melikgazi', 'Kocasinan', 'Talas', 'Develi', 'Yahyalı', 'Bünyan', 'Pınarbaşı',
    'İncesu', 'Tomarza', 'Yeşilhisar', 'Sarıoğlan', 'Hacılar', 'Sarız', 'Felahiye', 'Akkışla', 'Özvatan'
  ],
  'Kilis': [
    'Merkez', 'Musabeyli', 'Elbeyli', 'Polateli'
  ],
  'Kırıkkale': [
    'Merkez', 'Yahşihan', 'Keskin', 'Delice', 'Bahşılı', 'Sulakyurt', 'Balışeyh', 'Karakeçili', 'Çelebi'
  ],
  'Kırklareli': [
    'Lüleburgaz', 'Merkez', 'Babaeski', 'Vize', 'Pınarhisar', 'Demirköy', 'Pehlivanköy', 'Kofçaz'
  ],
  'Kırşehir': [
    'Merkez', 'Kaman', 'Mucur', 'Çiçekdağı', 'Akpınar', 'Boztepe', 'Akçakent'
  ],
  'Kocaeli': [
    'Gebze', 'İzmit', 'Darıca', 'Körfez', 'Gölcük', 'Derince', 'Çayırova',
    'Kartepe', 'Başiskele', 'Karamürsel', 'Kandıra', 'Dilovası'
  ],
  'Konya': [
    'Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Beyşehir', 'Çumra', 'Seydişehir',
    'Ilgın', 'Cihanbeyli', 'Kulu', 'Karapınar', 'Kadınhanı', 'Sarayönü', 'Bozkır', 'Yunak',
    'Doğanhisar', 'Hüyük', 'Altınekin', 'Hadim', 'Çeltik', 'Güneysınır', 'Taşkent', 'Tuzlukçu',
    'Derebucak', 'Akören', 'Halkapınar', 'Yalıhüyük', 'Emirgazi', 'Derbent', 'Ahırlı'
  ],
  'Kütahya': [
    'Merkez', 'Tavşanlı', 'Simav', 'Gediz', 'Emet', 'Altıntaş', 'Domaniç', 'Hisarcık',
    'Aslanapa', 'Çavdarhisar', 'Şaphane', 'Pazarlar', 'Dumlupınar'
  ],
  'Malatya': [
    'Battalgazi', 'Yeşilyurt', 'Doğanşehir', 'Akçadağ', 'Darende', 'Hekimhan', 'Pütürge',
    'Yazıhan', 'Arapgir', 'Kuluncak', 'Arguvan', 'Kale', 'Doğanyol'
  ],
  'Manisa': [
    'Yunusemre', 'Şehzadeler', 'Akhisar', 'Turgutlu', 'Salihli', 'Soma', 'Alaşehir',
    'Saruhanlı', 'Kula', 'Kırkağaç', 'Demirci', 'Sarıgöl', 'Gördes', 'Selendi', 'Ahmetli', 'Gölmarmara', 'Köprübaşı'
  ],
  'Mardin': [
    'Kızıltepe', 'Artuklu', 'Midyat', 'Nusaybin', 'Derik', 'Mazıdağı', 'Dargeçit', 'Savur', 'Yeşilli', 'Ömerli'
  ],
  'Mersin': [
    'Tarsus', 'Toroslar', 'Yenişehir', 'Akdeniz', 'Mezitli', 'Erdemli', 'Silifke',
    'Anamur', 'Mut', 'Bozyazı', 'Gülnar', 'Aydıncık', 'Çamlıyayla'
  ],
  'Muğla': [
    'Bodrum', 'Fethiye', 'Milas', 'Menteşe', 'Marmaris', 'Seydikemer', 'Ortaca',
    'Yatağan', 'Dalaman', 'Köyceğiz', 'Ula', 'Datça', 'Kavaklıdere'
  ],
  'Muş': [
    'Merkez', 'Bulanık', 'Malazgirt', 'Varto', 'Hasköy', 'Korkut'
  ],
  'Nevşehir': [
    'Merkez', 'Ürgüp', 'Avanos', 'Gülşehir', 'Derinkuyu', 'Acıgöl', 'Kozaklı', 'Hacıbektaş'
  ],
  'Niğde': [
    'Merkez', 'Bor', 'Çiftlik', 'Ulukışla', 'Altunhisar', 'Çamardı'
  ],
  'Ordu': [
    'Altınordu', 'Ünye', 'Fatsa', 'Kumru', 'Korgan', 'Gölköy', 'Perşembe', 'Aybastı',
    'Akkuş', 'Gürgentepe', 'Ulubey', 'Mesudiye', 'İkizce', 'Kabadüz', 'Çatalpınar', 'Çaybaşı', 'Kabataş', 'Korkut', 'Gülyalı'
  ],
  'Osmaniye': [
    'Merkez', 'Kadirli', 'Düziçi', 'Bahçe', 'Toprakkale', 'Sumbas', 'Hasanbeyli'
  ],
  'Rize': [
    'Merkez', 'Çayeli', 'Ardeşen', 'Pazar', 'Fındıklı', 'Güneysu', 'Kalkandere', 'İyidere',
    'Derepazarı', 'Çamlıhemşin', 'İkizdere', 'Hemşin'
  ],
  'Sakarya': [
    'Adapazarı', 'Serdivan', 'Akyazı', 'Erenler', 'Hendek', 'Karasu', 'Geyve', 'Arifiye',
    'Sapanca', 'Pamukova', 'Ferizli', 'Kocaali', 'Kaynarca', 'Söğütlü', 'Karapürçek', 'Taraklı'
  ],
  'Samsun': [
    'İlkadım', 'Atakum', 'Bafra', 'Çarşamba', 'Canik', 'Vezirköprü', 'Terme', 'Tekkeköy',
    'Havza', 'Alaçam', '19 Mayıs', 'Ayvacık', 'Kavak', 'Salıpazarı', 'Asarcık', 'Ladik', 'Yakakent'
  ],
  'Şanlıurfa': [
    'Eyyübiye', 'Haliliye', 'Siverek', 'Viranşehir', 'Karaköprü', 'Akçakale', 'Suruç',
    'Birecik', 'Ceylanpınar', 'Harran', 'Bozova', 'Hilvan', 'Halfeti'
  ],
  'Siirt': [
    'Merkez', 'Kurtalan', 'Pervari', 'Baykan', 'Şirvan', 'Eruh', 'Tillo'
  ],
  'Sinop': [
    'Merkez', 'Boyabat', 'Gerze', 'Ayancık', 'Durağan', 'Türkeli', 'Erfelek', 'Dikmen', 'Saraydüzü'
  ],
  'Şırnak': [
    'Cizre', 'Silopi', 'Merkez', 'İdil', 'Uludere', 'Beytüşşebap', 'Güçlükonak'
  ],
  'Sivas': [
    'Merkez', 'Şarkışla', 'Yıldızeli', 'Suşehri', 'Zara', 'Gemerek', 'Kangal', 'Gürün',
    'Divriği', 'Koyulhisar', 'Altınyayla', 'Hafik', 'Ulaş', 'İmranlı', 'Akıncılar', 'Gölova', 'Doğanşar'
  ],
  'Tekirdağ': [
    'Çorlu', 'Süleymanpaşa', 'Çerkezköy', 'Kapaklı', 'Ergene', 'Malkara', 'Saray',
    'Hayrabolu', 'Şarköy', 'Muratlı', 'Marmaraereğlisi'
  ],
  'Tokat': [
    'Merkez', 'Erbaa', 'Turhal', 'Niksar', 'Zile', 'Reşadiye', 'Almus', 'Pazar',
    'Yeşilyurt', 'Artova', 'Sulusaray', 'Başçiftlik'
  ],
  'Trabzon': [
    'Ortahisar', 'Akçaabat', 'Araklı', 'Of', 'Yomra', 'Arsin', 'Vakfıkebir', 'Sürmene',
    'Maçka', 'Beşikdüzü', 'Çarşıbaşı', 'Tonya', 'Düzköy', 'Çaykara', 'Şalpazarı', 'Hayrat', 'Köprübaşı', 'Dernekpazarı'
  ],
  'Tunceli': [
    'Merkez', 'Pertek', 'Mazgirt', 'Çemişgezek', 'Hozat', 'Ovacık', 'Pülümür', 'Nazımiye'
  ],
  'Uşak': [
    'Merkez', 'Banaz', 'Eşme', 'Sivaslı', 'Ulubey', 'Karahallı'
  ],
  'Van': [
    'İpekyolu', 'Erciş', 'Tuşba', 'Edremit', 'Özalp', 'Çaldıran', 'Başkale', 'Muradiye',
    'Gürpınar', 'Gevaş', 'Saray', 'Çatak', 'Bahçesaray'
  ],
  'Yalova': [
    'Merkez', 'Çiftlikköy', 'Çınarcık', 'Altınova', 'Armutlu', 'Termal'
  ],
  'Yozgat': [
    'Merkez', 'Sorgun', 'Akdağmadeni', 'Yerköy', 'Boğazlıyan', 'Saraykent', 'Çekerek',
    'Aydıncık', 'Şefaatli', 'Çayıralan', 'Kadışehri', 'Saraykent', 'Yenifakılı', 'Çandır'
  ],
  'Zonguldak': [
    'Ereğli', 'Merkez', 'Çaycuma', 'Devrek', 'Kozlu', 'Alaplı', 'Kilimli', 'Gökçebey'
  ]
};

export const PROVINCE_NAMES = Object.keys(TURKEY_PROVINCES).sort((a, b) => a.localeCompare(b, 'tr'));
