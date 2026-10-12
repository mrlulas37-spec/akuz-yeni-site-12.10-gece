import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  Package,
  Layers,
  Users,
  ShoppingBag,
  HelpCircle,
  FileText,
  Phone,
  Palette,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Search,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  Maximize2,
  Mail,
  Send,
  Server,
  KeyRound,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Truck,
  QrCode,
  CheckCircle,
  Type,
  Menu,
  Download,
  Archive,
  FolderDown,
  FileCheck,
  Copy,
  HardDrive,
  Upload,
  CreditCard,
  Lock,
} from 'lucide-react';
import {
  Product,
  Order,
  SiteSettings,
  ProductColorOption,
  CategoryCircleItem,
  WhyAkuzCardItem,
  SmtpConfig,
  KargonomiConfig,
  PaytrConfig,
} from '../types';
import {
  INITIAL_SITE_SETTINGS,
  INITIAL_CATEGORY_CIRCLES,
  INITIAL_WHY_AKUZ_CARDS,
} from '../utils/adminStore';
import { RegisteredAccount } from '../utils/auth';
import {
  testSmtpConnection,
  sendWelcomeEmail,
  sendWelcomeEmailDetailed,
  sendOrderPreparingEmail,
  sendOrderPreparingEmailDetailed,
  sendOrderShippedEmail,
  sendOrderShippedEmailDetailed,
  sendOrderDeliveredEmail,
  sendOrderDeliveredEmailDetailed,
} from '../utils/emailService';
import { createKargonomiShipment, testKargonomiConnection } from '../utils/kargonomiService';

interface AdminPanelProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  siteSettings: SiteSettings;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
  globalColors: ProductColorOption[];
  onUpdateGlobalColors: (colors: ProductColorOption[]) => void;
  orders: Order[];
  onUpdateOrders: (orders: Order[]) => void;
  users: RegisteredAccount[];
  onNavigateHome: () => void;
  onNavigateToCatalog: () => void;
}

type TabType =
  | 'products'
  | 'categories'
  | 'colors-foils'
  | 'orders'
  | 'users'
  | 'why-akuz'
  | 'about'
  | 'contact'
  | 'paytr'
  | 'kargonomi'
  | 'email-smtp'
  | 'cpanel-deploy';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  onUpdateProducts,
  siteSettings,
  onUpdateSiteSettings,
  globalColors,
  onUpdateGlobalColors,
  orders,
  onUpdateOrders,
  users,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Güvenli Kategori ve İçerik Listeleri (Asla undefined olamaz, çökme engellendi)
  const safeCategories: CategoryCircleItem[] =
    Array.isArray(siteSettings?.categories) && siteSettings.categories.length > 0
      ? siteSettings.categories
      : INITIAL_CATEGORY_CIRCLES;

  const safeWhyCards: WhyAkuzCardItem[] =
    Array.isArray(siteSettings?.whyAkuzCards) && siteSettings.whyAkuzCards.length > 0
      ? siteSettings.whyAkuzCards
      : INITIAL_WHY_AKUZ_CARDS;

  const safeAboutParagraphs: string[] =
    Array.isArray(siteSettings?.aboutParagraphs) && siteSettings.aboutParagraphs.length > 0
      ? siteSettings.aboutParagraphs
      : INITIAL_SITE_SETTINGS.aboutParagraphs;

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsScrollRef.current) {
      tabsScrollRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth',
      });
    }
  };

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const [downloadingZip, setDownloadingZip] = useState<string | null>(null);
  const [rebuildingCpanel, setRebuildingCpanel] = useState(false);
  const [cpanelStatus, setCpanelStatus] = useState<{
    fullApp?: { sizeMb: string; lastModified: string };
    distApp?: { sizeMb: string; lastModified: string };
    timestamp?: string;
  } | null>(null);

  const fetchCpanelStatus = async () => {
    try {
      const res = await fetch('/api/cpanel-packages-status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCpanelStatus({
            fullApp: data.fullApp,
            distApp: data.distApp,
            timestamp: data.timestamp,
          });
        }
      }
    } catch (err) {
      console.warn('cPanel durum sorgulama hatası:', err);
    }
  };

  const handleRebuildCpanel = async () => {
    try {
      setRebuildingCpanel(true);
      const res = await fetch('/api/rebuild-cpanel-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          settings: siteSettings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('cPanel için tüm ürünler, siparişler ve ayarlar güncellendi, ZIP paketleri hazırlandı!');
        await fetchCpanelStatus();
      } else {
        throw new Error(data.error || 'Paketleme başarısız oldu');
      }
    } catch (err: any) {
      alert('Paket derleme hatası: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setRebuildingCpanel(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'cpanel-deploy') {
      fetchCpanelStatus();
    }
  }, [activeTab]);

  const handleDownloadZip = async (url: string, filename: string) => {
    try {
      setDownloadingZip(filename);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Sunucudan dosya alınamadı (' + res.status + ')');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
      showNotification(filename + ' başarıyla indirildi!');
    } catch (err: any) {
      console.error('İndirme hatası:', err);
      // Fallback
      window.location.href = url;
    } finally {
      setDownloadingZip(null);
    }
  };

  // ==========================================
  // TAB 1: ÜRÜN YÖNETİMİ & YENİ ÜRÜN EKLEME
  // ==========================================
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');

  // Yeni/Düzenlenen Ürün Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Product['category']>('araba');
  const [formCurrentPrice, setFormCurrentPrice] = useState('49');
  const [formOldPrice, setFormOldPrice] = useState('89');
  const [formTag, setFormTag] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAdditionalImages, setFormAdditionalImages] = useState('');
  const [formDimensionsList, setFormDimensionsList] = useState<string[]>([
    '15x10 cm',
    '20x13 cm',
    '25x16 cm',
  ]);
  const [formDimensionPrices, setFormDimensionPrices] = useState<Record<string, string>>({});
  const [newDimWidth, setNewDimWidth] = useState('');
  const [newDimHeight, setNewDimHeight] = useState('');
  const [newDimPrice, setNewDimPrice] = useState('');
  const [newDimManual, setNewDimManual] = useState('');
  const [formIsCustomText, setFormIsCustomText] = useState(false);
  const [formFreeLetterCount, setFormFreeLetterCount] = useState('10');
  const [formExtraLetterPrice, setFormExtraLetterPrice] = useState('5');
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsDiscounted, setFormIsDiscounted] = useState(false);

  const handleAddDimensionFromInputs = () => {
    let dimToAdd = '';
    if (newDimWidth.trim() && newDimHeight.trim()) {
      dimToAdd = `${newDimWidth.trim()}x${newDimHeight.trim()} cm`;
    } else if (newDimManual.trim()) {
      dimToAdd = newDimManual.trim();
      if (!dimToAdd.toLowerCase().includes('cm')) {
        dimToAdd += ' cm';
      }
    }
    if (dimToAdd && !formDimensionsList.includes(dimToAdd)) {
      setFormDimensionsList([...formDimensionsList, dimToAdd]);
      if (newDimPrice.trim()) {
        setFormDimensionPrices({
          ...formDimensionPrices,
          [dimToAdd]: newDimPrice.trim(),
        });
      }
      setNewDimWidth('');
      setNewDimHeight('');
      setNewDimPrice('');
      setNewDimManual('');
    }
  };

  const handleDimensionPriceChange = (dim: string, priceStr: string) => {
    setFormDimensionPrices({
      ...formDimensionPrices,
      [dim]: priceStr,
    });
  };

  const handleRemoveDimension = (dimToRemove: string) => {
    setFormDimensionsList(formDimensionsList.filter((d) => d !== dimToRemove));
    const nextPrices = { ...formDimensionPrices };
    delete nextPrices[dimToRemove];
    setFormDimensionPrices(nextPrices);
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('araba');
    setFormCurrentPrice('49');
    setFormOldPrice('89');
    setFormTag('YENİ ÜRÜN');
    setFormDescription('');
    setFormImageUrl('/products/IMG_1138.jpeg');
    setFormAdditionalImages('');
    setFormDimensionsList(['15x10 cm', '20x13 cm', '25x16 cm']);
    setFormDimensionPrices({
      '15x10 cm': '49',
      '20x13 cm': '69',
      '25x16 cm': '89',
    });
    setNewDimWidth('');
    setNewDimHeight('');
    setNewDimPrice('');
    setNewDimManual('');
    setFormIsCustomText(false);
    setFormFreeLetterCount('10');
    setFormExtraLetterPrice('5');
    setFormIsPopular(false);
    setFormIsDiscounted(true);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormCurrentPrice(String(prod.currentPrice));
    setFormOldPrice(String(prod.oldPrice || ''));
    setFormTag(prod.tag || '');
    setFormDescription(prod.description);
    setFormImageUrl(prod.imageUrl || '');
    setFormAdditionalImages((prod.images || []).join(', '));
    setFormDimensionsList(prod.dimensions && prod.dimensions.length > 0 ? [...prod.dimensions] : ['20x7 cm']);
    
    // Boyut fiyatlarını yükle
    const initialDimPrices: Record<string, string> = {};
    if (prod.dimensions) {
      prod.dimensions.forEach((dim) => {
        if (prod.dimensionPrices && typeof prod.dimensionPrices[dim] === 'number') {
          initialDimPrices[dim] = String(prod.dimensionPrices[dim]);
        } else {
          initialDimPrices[dim] = String(prod.currentPrice);
        }
      });
    }
    setFormDimensionPrices(initialDimPrices);

    setNewDimWidth('');
    setNewDimHeight('');
    setNewDimPrice('');
    setNewDimManual('');
    setFormIsCustomText(Boolean(prod.isCustomText));
    setFormFreeLetterCount(String(prod.freeLetterCount ?? 10));
    setFormExtraLetterPrice(String(prod.extraLetterPrice ?? 5));
    setFormIsPopular(Boolean(prod.isPopular));
    setFormIsDiscounted(Boolean(prod.isDiscounted));
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const slug = formName
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const parsedDimensions = formDimensionsList.length > 0 ? formDimensionsList : ['20x7 cm'];

    // Boyut fiyatlarını parse et
    const parsedDimPrices: Record<string, number> = {};
    const defaultPrice = parseFloat(formCurrentPrice) || 0;
    parsedDimensions.forEach((dim) => {
      const val = parseFloat(formDimensionPrices[dim]);
      parsedDimPrices[dim] = !isNaN(val) && val > 0 ? val : defaultPrice;
    });

    const parsedImages = formAdditionalImages
      .split(',')
      .map((img) => img.trim())
      .filter(Boolean);

    if (formImageUrl.trim() && !parsedImages.includes(formImageUrl.trim())) {
      parsedImages.unshift(formImageUrl.trim());
    }

    if (editingProduct) {
      // Güncelle
      const updated = products.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: formName.trim().toUpperCase(),
            category: formCategory,
            currentPrice: parseFloat(formCurrentPrice) || 0,
            oldPrice: parseFloat(formOldPrice) || 0,
            tag: formTag.trim(),
            description: formDescription.trim(),
            imageUrl: formImageUrl.trim() || undefined,
            images: parsedImages.length > 0 ? parsedImages : undefined,
            dimensions: parsedDimensions.length > 0 ? parsedDimensions : ['20x7 cm'],
            dimensionPrices: parsedDimPrices,
            isCustomText: formIsCustomText,
            freeLetterCount: formIsCustomText ? parseInt(formFreeLetterCount) || 10 : undefined,
            extraLetterPrice: formIsCustomText ? parseFloat(formExtraLetterPrice) || 0 : undefined,
            isPopular: formIsPopular,
            isDiscounted: formIsDiscounted,
          };
        }
        return p;
      });
      onUpdateProducts(updated);
      showNotification(`"${formName}" ürünü başarıyla güncellendi.`);
    } else {
      // Yeni Ekle
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim().toUpperCase(),
        slug: slug || `urun-${Date.now()}`,
        category: formCategory,
        currentPrice: parseFloat(formCurrentPrice) || 0,
        oldPrice: parseFloat(formOldPrice) || 0,
        rating: 5.0,
        reviewsCount: 0,
        tag: formTag.trim(),
        description: formDescription.trim(),
        svgType: 'logo',
        imageUrl: formImageUrl.trim() || undefined,
        images: parsedImages.length > 0 ? parsedImages : undefined,
        dimensions: parsedDimensions.length > 0 ? parsedDimensions : ['20x7 cm'],
        dimensionPrices: parsedDimPrices,
        colors: globalColors,
        finishes: ['Mat', 'Parlak'],
        isCustomText: formIsCustomText,
        freeLetterCount: formIsCustomText ? parseInt(formFreeLetterCount) || 10 : undefined,
        extraLetterPrice: formIsCustomText ? parseFloat(formExtraLetterPrice) || 0 : undefined,
        isPopular: formIsPopular,
        isDiscounted: formIsDiscounted,
      };
      onUpdateProducts([newProd, ...products]);
      showNotification(`"${formName}" ürünü kataloğa eklendi.`);
    }

    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (window.confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) {
      onUpdateProducts(products.filter((p) => p.id !== id));
      showNotification(`"${name}" ürünü silindi.`);
    }
  };

  // ==========================================
  // TAB 2: KATEGORİ YUVARLAKLARI (FOTOĞRAF VE BAŞLIK DÜZENLEME)
  // ==========================================
  const handleUpdateCategory = (
    id: CategoryCircleItem['id'],
    field: keyof CategoryCircleItem,
    value: string
  ) => {
    const updated = safeCategories.map((cat) => {
      if (cat.id === id) {
        return { ...cat, [field]: value };
      }
      return cat;
    });
    onUpdateSiteSettings({ ...siteSettings, categories: updated });
    showNotification('Kategori yuvarlakları güncellendi.');
  };

  const handleCategoryFileUpload = (catId: CategoryCircleItem['id'], file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        handleUpdateCategory(catId, 'imageUrl', result);
        showNotification('Fotoğraf yüklendi ve kategori yuvarlağına uygulandı!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProductFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormImageUrl(result);
        showNotification('Ürün görseli seçildi!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Hızlı Fiyat Güncelleme Durumu
  const [quickPriceId, setQuickPriceId] = useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<string>('');
  const [quickOldPriceVal, setQuickOldPriceVal] = useState<string>('');

  const handleStartQuickPrice = (p: Product) => {
    setQuickPriceId(p.id);
    setQuickPriceVal(String(p.currentPrice));
    setQuickOldPriceVal(String(p.oldPrice || ''));
  };

  const handleSaveQuickPrice = (prodId: string) => {
    const newPrice = parseFloat(quickPriceVal);
    if (isNaN(newPrice) || newPrice <= 0) {
      setQuickPriceId(null);
      return;
    }
    const newOld = parseFloat(quickOldPriceVal) || 0;
    const updated = products.map((p) => {
      if (p.id === prodId) {
        return {
          ...p,
          currentPrice: newPrice,
          oldPrice: newOld,
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    setQuickPriceId(null);
    showNotification('Fiyat başarıyla güncellendi!');
  };

  // ==========================================
  // TAB 3: RENKLER, STOK DURUMU & FOLYO SEÇENEKLERİ (MAT / PARLAK)
  // ==========================================
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#ff0055');
  const [newColorSupportsMat, setNewColorSupportsMat] = useState(true);
  const [newColorSupportsParlak, setNewColorSupportsParlak] = useState(true);

  const handleToggleColorStock = (colorName: string) => {
    const updated = globalColors.map((c) => {
      if (c.name === colorName) {
        return { ...c, inStock: !(c.inStock ?? true) };
      }
      return c;
    });
    onUpdateGlobalColors(updated);
    showNotification(`"${colorName}" rengi stok durumu güncellendi.`);
  };

  const handleToggleColorFinish = (colorName: string, finish: 'Mat' | 'Parlak') => {
    const updated = globalColors.map((c) => {
      if (c.name === colorName) {
        const curFinishes = c.supportedFinishes || ['Mat', 'Parlak'];
        let next: ('Mat' | 'Parlak')[];
        if (curFinishes.includes(finish)) {
          // En az 1 folyo seçeneği kalmalı
          if (curFinishes.length <= 1) {
            showNotification('Uyarı: Bir rengin en az 1 folyo tipi (Mat veya Parlak) olmalıdır.');
            return c;
          }
          next = curFinishes.filter((f) => f !== finish);
        } else {
          next = [...curFinishes, finish];
        }
        return { ...c, supportedFinishes: next };
      }
      return c;
    });
    onUpdateGlobalColors(updated);
    showNotification(`"${colorName}" için ${finish} seçeneği güncellendi.`);
  };

  const handleAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName.trim()) return;

    const finishes: ('Mat' | 'Parlak')[] = [];
    if (newColorSupportsMat) finishes.push('Mat');
    if (newColorSupportsParlak) finishes.push('Parlak');

    if (finishes.length === 0) {
      showNotification('Uyarı: Lütfen en az bir folyo tipi (Mat veya Parlak) seçin.');
      return;
    }

    const newColor: ProductColorOption = {
      name: newColorName.trim(),
      hex: newColorHex,
      inStock: true,
      supportedFinishes: finishes,
    };

    onUpdateGlobalColors([...globalColors, newColor]);
    setNewColorName('');
    showNotification(`Yeni renk "${newColor.name}" eklendi.`);
  };

  const handleDeleteColor = (name: string) => {
    if (globalColors.length <= 1) {
      showNotification('Uyarı: En az bir renk tanımlı kalmalıdır.');
      return;
    }
    if (window.confirm(`"${name}" rengini tamamen silmek istiyor musunuz?`)) {
      onUpdateGlobalColors(globalColors.filter((c) => c.name !== name));
      showNotification(`"${name}" rengi silindi.`);
    }
  };

  const handleToggleGlobalFoil = (foil: 'Mat' | 'Parlak') => {
    const current = siteSettings.availableFoilTypes || ['Mat', 'Parlak'];
    let next: ('Mat' | 'Parlak')[];
    if (current.includes(foil)) {
      if (current.length <= 1) {
        showNotification('Uyarı: En az bir folyo tipi sitede aktif kalmalıdır.');
        return;
      }
      next = current.filter((f) => f !== foil);
    } else {
      next = [...current, foil];
    }
    onUpdateSiteSettings({ ...siteSettings, availableFoilTypes: next });
    showNotification(`Genel ${foil} folyo seçeneği güncellendi.`);
  };

  // ==========================================
  // TAB 4: SİPARİŞLER (DURUM DEĞİŞTİRME & BİLDİRİM GÖNDERME)
  // ==========================================
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status'], customTrackingNo?: string) => {
    let targetOrder: Order | undefined;
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        const nextOrder = {
          ...o,
          status: newStatus,
          ...(customTrackingNo ? { trackingNumber: customTrackingNo } : {}),
        };
        targetOrder = nextOrder;
        return nextOrder;
      }
      return o;
    });
    onUpdateOrders(updated);
    showNotification(`Sipariş #${orderId} durumu "${newStatus}" olarak güncellendi.`);

    // Merkezi Host sunucusuna sipariş durumunu kaydet
    fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        ...(customTrackingNo ? { trackingNumber: customTrackingNo } : {}),
      }),
    }).catch((e) => console.warn('[HOST ORDER UPDATE ERROR]', e));

    // Eğer siparişte müşteri e-postası kayıtlıysa ilgili durum bildirimini otomatik e-posta ile gönder
    if (targetOrder && targetOrder.customerEmail && targetOrder.customerEmail.includes('@')) {
      const emailPayload = {
        orderId: targetOrder.id,
        customerName: targetOrder.customerName || 'Değerli Müşterimiz',
        customerEmail: targetOrder.customerEmail,
        customerPhone: targetOrder.customerPhone,
        shippingAddress: targetOrder.shippingAddress,
        trackingNumber: targetOrder.trackingNumber,
        carrierName: targetOrder.carrierName || 'Kargonomi / Anlaşmalı Kargo',
        items: targetOrder.items.map((i) => ({
          productName: i.productName,
          quantity: i.quantity,
          color: i.color,
          dimension: i.dimension,
          price: i.price,
        })),
        totalPrice: targetOrder.total,
      };

      try {
        if (newStatus === 'Hazırlanıyor') {
          await sendOrderPreparingEmail(emailPayload);
          showNotification(`Müşteriye "${targetOrder.customerEmail}" "Siparişiniz Hazırlanıyor" e-postası iletildi.`);
        } else if (newStatus === 'Kargoya Verildi') {
          await sendOrderShippedEmail(emailPayload);
          showNotification(`Müşteriye "${targetOrder.customerEmail}" "Siparişiniz Kargoya Verildi" e-postası iletildi.`);
        } else if (newStatus === 'Teslim Edildi') {
          await sendOrderDeliveredEmail(emailPayload);
          showNotification(`Müşteriye "${targetOrder.customerEmail}" "Siparişiniz Teslim Edildi" e-postası iletildi.`);
        }
      } catch (err) {
        console.error('E-posta bildirim hatası:', err);
      }
    }
  };

  // ==========================================
  // TAB 6: NEDEN AKUZ 4 KUTU
  // ==========================================
  const handleUpdateWhyCard = (id: string, field: 'title' | 'description', value: string) => {
    const updated = safeWhyCards.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    onUpdateSiteSettings({ ...siteSettings, whyAkuzCards: updated });
  };

  // ==========================================
  // TAB 7: HAKKIMIZDA
  // ==========================================
  const [aboutParagraphs, setAboutParagraphs] = useState<string[]>(
    safeAboutParagraphs
  );

  useEffect(() => {
    if (siteSettings?.aboutParagraphs && siteSettings.aboutParagraphs.length > 0) {
      setAboutParagraphs(siteSettings.aboutParagraphs);
    }
  }, [siteSettings?.aboutParagraphs]);

  const handleSaveAbout = () => {
    onUpdateSiteSettings({ ...siteSettings, aboutParagraphs });
    showNotification('Hakkımızda içeriği kaydedildi.');
  };

  // ==========================================
  // TAB 8: İLETİŞİM
  // ==========================================
  const [contactEmail, setContactEmail] = useState(siteSettings?.contactEmail || 'akuzstickers@gmail.com');
  const [contactPhone, setContactPhone] = useState(siteSettings?.contactPhone || '+90 546 875 86 71');
  const [contactWhatsApp, setContactWhatsApp] = useState(siteSettings?.contactWhatsApp || '+90 546 875 86 71');
  const [contactAddress, setContactAddress] = useState(siteSettings?.contactAddress || 'Üçevler Mahallesi, Küçük Sanayi Sitesi, 6. Blok No: 17/1 Nilüfer / Bursa');
  const [contactDesc, setContactDesc] = useState(siteSettings?.contactDescription || 'Sorularınız, siparişleriniz veya özel tasarım talepleriniz için bizimle iletişime geçebilirsiniz.');

  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.contactEmail) setContactEmail(siteSettings.contactEmail);
      if (siteSettings.contactPhone) setContactPhone(siteSettings.contactPhone);
      if (siteSettings.contactWhatsApp) setContactWhatsApp(siteSettings.contactWhatsApp);
      if (siteSettings.contactAddress) setContactAddress(siteSettings.contactAddress);
      if (siteSettings.contactDescription) setContactDesc(siteSettings.contactDescription);
    }
  }, [siteSettings]);

  const handleSaveContact = () => {
    onUpdateSiteSettings({
      ...siteSettings,
      contactEmail,
      contactPhone,
      contactWhatsApp,
      contactAddress,
      contactDescription: contactDesc,
    });
    showNotification('İletişim bilgileri kaydedildi.');
  };

  // ==========================================
  // TAB 9: cPanel / SMTP E-POSTA AYARLARI
  // ==========================================
  const defaultSmtp: SmtpConfig = siteSettings.smtpSettings || {
    host: 'mail.akuzstickers.com',
    port: 465,
    secure: true,
    user: 'info@akuzstickers.com',
    pass: '',
    fromName: 'AKUZ Stickers',
    fromEmail: 'info@akuzstickers.com',
    enabled: true,
  };

  const [smtpHost, setSmtpHost] = useState(defaultSmtp.host);
  const [smtpPort, setSmtpPort] = useState(String(defaultSmtp.port));
  const [smtpSecure, setSmtpSecure] = useState(defaultSmtp.secure);
  const [smtpUser, setSmtpUser] = useState(defaultSmtp.user);
  const [smtpPass, setSmtpPass] = useState(defaultSmtp.pass);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpFromName, setSmtpFromName] = useState(defaultSmtp.fromName);
  const [smtpFromEmail, setSmtpFromEmail] = useState(defaultSmtp.fromEmail);
  const [smtpEnabled, setSmtpEnabled] = useState(defaultSmtp.enabled);

  // Prop güncellendiğinde formu senkronize et
  useEffect(() => {
    if (siteSettings.smtpSettings) {
      setSmtpHost(siteSettings.smtpSettings.host || 'mail.akuzstickers.com');
      setSmtpPort(String(siteSettings.smtpSettings.port || 465));
      setSmtpSecure(siteSettings.smtpSettings.secure !== undefined ? siteSettings.smtpSettings.secure : true);
      setSmtpUser(siteSettings.smtpSettings.user || 'info@akuzstickers.com');
      if (siteSettings.smtpSettings.pass) {
        setSmtpPass(siteSettings.smtpSettings.pass);
      }
      setSmtpFromName(siteSettings.smtpSettings.fromName || 'AKUZ Stickers');
      setSmtpFromEmail(siteSettings.smtpSettings.fromEmail || siteSettings.smtpSettings.user || 'info@akuzstickers.com');
      setSmtpEnabled(siteSettings.smtpSettings.enabled !== undefined ? siteSettings.smtpSettings.enabled : true);
    }
    if (siteSettings.googleClientId !== undefined) {
      setGoogleClientId(siteSettings.googleClientId);
    }
  }, [siteSettings.smtpSettings, siteSettings.googleClientId]);

  const [googleClientId, setGoogleClientId] = useState(siteSettings.googleClientId || '');
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  const handleSaveGoogleOAuth = () => {
    onUpdateSiteSettings({
      ...siteSettings,
      googleClientId: googleClientId.trim(),
    });
    showNotification('Google OAuth 2.0 ayarları başarıyla kaydedildi.');
  };

  const [testEmailTo, setTestEmailTo] = useState('mrlulas37@gmail.com');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSaveSmtp = () => {
    const updatedSmtp: SmtpConfig = {
      host: smtpHost.trim(),
      port: parseInt(smtpPort, 10) || 465,
      secure: smtpSecure,
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
      fromName: smtpFromName.trim() || 'AKUZ Stickers',
      fromEmail: smtpFromEmail.trim() || smtpUser.trim(),
      enabled: smtpEnabled,
    };

    onUpdateSiteSettings({
      ...siteSettings,
      smtpSettings: updatedSmtp,
    });
    showNotification('cPanel SMTP e-posta ayarları başarıyla kaydedildi.');
  };

  const handleTestConnection = async () => {
    if (!smtpHost.trim() || !smtpUser.trim() || !smtpPass.trim()) {
      setTestResult({
        success: false,
        msg: 'Lütfen formdaki 3 zorunlu alanı doldurun: 1) SMTP Sunucu Adresi, 2) E-Posta Kullanıcı Adı, 3) E-Posta Hesap Şifreniz.',
      });
      return;
    }

    setIsTestingSmtp(true);
    setTestResult(null);

    const config: SmtpConfig = {
      host: smtpHost.trim(),
      port: parseInt(smtpPort, 10) || 465,
      secure: smtpSecure,
      user: smtpUser.trim(),
      pass: smtpPass.trim(),
      fromName: smtpFromName.trim(),
      fromEmail: smtpFromEmail.trim(),
      enabled: smtpEnabled,
    };

    const res = await testSmtpConnection(config);
    setIsTestingSmtp(false);
    if (res.success) {
      setTestResult({ success: true, msg: res.message });
    } else {
      setTestResult({ success: false, msg: res.message });
    }
  };

  const handleSendTestWelcomeMail = async () => {
    if (!testEmailTo.trim()) {
      setTestResult({ success: false, msg: 'Lütfen test e-postasının gönderileceği bir adres yazın.' });
      return;
    }

    setIsTestingSmtp(true);
    setTestResult(null);

    // Ayarları önce kaydet ve gönder
    handleSaveSmtp();

    const res = await sendWelcomeEmailDetailed('Değerli Kullanıcı', testEmailTo.trim());
    setIsTestingSmtp(false);
    if (res.success) {
      setTestResult({
        success: true,
        msg: `Harika! Kayıt / Hoş Geldin şablonlu test e-postası "${testEmailTo}" adresine gönderildi.`,
      });
    } else {
      setTestResult({
        success: false,
        msg: res.error ? `E-posta gönderilemedi: ${res.error}` : 'E-posta gönderilemedi. Sunucu, kullanıcı adı veya şifrenizi kontrol edin.',
      });
    }
  };

  const handleSendTestPreparingMail = async () => {
    if (!testEmailTo.trim()) {
      setTestResult({ success: false, msg: 'Lütfen test e-postasının gönderileceği bir adres yazın.' });
      return;
    }

    setIsTestingSmtp(true);
    setTestResult(null);
    handleSaveSmtp();

    const sampleOrder = {
      orderId: 'AKUZ-TEST' + Math.floor(1000 + Math.random() * 9000),
      customerName: 'Test Müşteri',
      customerEmail: testEmailTo.trim(),
      customerPhone: '0546 875 86 71',
      shippingAddress: 'Cumhuriyet Mah. Atatürk Cad. No: 42, Kadıköy / İstanbul',
      items: [
        {
          productName: 'KEMAL ATATÜRK İMZA STICKER',
          quantity: 2,
          color: 'Beyaz',
          dimension: '18x7 cm',
          finish: 'Parlak',
          price: 39.0,
        },
        {
          productName: 'KİŞİYE ÖZEL YAZI STICKER',
          quantity: 1,
          color: 'Hologramlı',
          dimension: '20x5 cm',
          finish: 'Parlak',
          customText: 'AKUZ RACING TEAM',
          price: 59.0,
        },
      ],
      totalPrice: 137.0,
    };

    const res = await sendOrderPreparingEmailDetailed(sampleOrder);
    setIsTestingSmtp(false);
    if (res.success) {
      setTestResult({
        success: true,
        msg: `Başarılı! "Siparişiniz Hazırlanıyor" bildirim şablonlu test e-postası (#${sampleOrder.orderId}) "${testEmailTo}" adresine gönderildi.`,
      });
    } else {
      setTestResult({
        success: false,
        msg: res.error ? `E-posta gönderilemedi: ${res.error}` : 'E-posta gönderilemedi. Sunucu, kullanıcı adı veya şifrenizi kontrol edin.',
      });
    }
  };

  const handleSendTestShippedMail = async () => {
    if (!testEmailTo.trim()) {
      setTestResult({ success: false, msg: 'Lütfen test e-postasının gönderileceği bir adres yazın.' });
      return;
    }

    setIsTestingSmtp(true);
    setTestResult(null);
    handleSaveSmtp();

    const sampleOrder = {
      orderId: 'AKUZ-TEST' + Math.floor(1000 + Math.random() * 9000),
      customerName: 'Test Müşteri',
      customerEmail: testEmailTo.trim(),
      customerPhone: '0546 875 86 71',
      shippingAddress: 'Cumhuriyet Mah. Atatürk Cad. No: 42, Kadıköy / İstanbul',
      trackingNumber: 'TR' + Math.floor(100000000 + Math.random() * 900000000),
      carrierName: 'MNG Kargo',
      items: [
        {
          productName: 'KEMAL ATATÜRK İMZA STICKER',
          quantity: 2,
          color: 'Beyaz',
          dimension: '18x7 cm',
          finish: 'Parlak',
          price: 39.0,
        },
      ],
      totalPrice: 78.0,
    };

    const res = await sendOrderShippedEmailDetailed(sampleOrder);
    setIsTestingSmtp(false);
    if (res.success) {
      setTestResult({
        success: true,
        msg: `Başarılı! "Siparişiniz Kargoya Verildi" bildirim şablonlu test e-postası (#${sampleOrder.orderId}) "${testEmailTo}" adresine gönderildi.`,
      });
    } else {
      setTestResult({
        success: false,
        msg: res.error ? `E-posta gönderilemedi: ${res.error}` : 'E-posta gönderilemedi. Sunucu, kullanıcı adı veya şifrenizi kontrol edin.',
      });
    }
  };

  const handleSendTestDeliveredMail = async () => {
    if (!testEmailTo.trim()) {
      setTestResult({ success: false, msg: 'Lütfen test e-postasının gönderileceği bir adres yazın.' });
      return;
    }

    setIsTestingSmtp(true);
    setTestResult(null);
    handleSaveSmtp();

    const sampleOrder = {
      orderId: 'AKUZ-TEST' + Math.floor(1000 + Math.random() * 9000),
      customerName: 'Test Müşteri',
      customerEmail: testEmailTo.trim(),
      customerPhone: '0546 875 86 71',
      shippingAddress: 'Cumhuriyet Mah. Atatürk Cad. No: 42, Kadıköy / İstanbul',
      items: [
        {
          productName: 'KEMAL ATATÜRK İMZA STICKER',
          quantity: 2,
          color: 'Beyaz',
          dimension: '18x7 cm',
          finish: 'Parlak',
          price: 39.0,
        },
      ],
      totalPrice: 78.0,
    };

    const res = await sendOrderDeliveredEmailDetailed(sampleOrder);
    setIsTestingSmtp(false);
    if (res.success) {
      setTestResult({
        success: true,
        msg: `Başarılı! "Siparişiniz Teslim Edildi" bildirim şablonlu test e-postası (#${sampleOrder.orderId}) "${testEmailTo}" adresine gönderildi.`,
      });
    } else {
      setTestResult({
        success: false,
        msg: res.error ? `E-posta gönderilemedi: ${res.error}` : 'E-posta gönderilemedi. Sunucu, kullanıcı adı veya şifrenizi kontrol edin.',
      });
    }
  };

  // ==========================================
  // TAB 10: KARGONOMİ ENTEGRASYONU
  // ==========================================
  const defaultKargonomi: KargonomiConfig = siteSettings.kargonomiSettings || {
    apiToken: 'Ly2mGS6WC2iDAuwdC2C5D9omqnsJkjBZIO4qeJMIe8175aa3',
    apiUrl: 'https://app.kargonomi.com.tr/api/v1',
    enabled: true,
    senderName: 'AKUZ Stickers',
    senderPhone: '+90 546 875 86 71',
    senderAddress: 'Cumhuriyet Cad. No: 12, Nilüfer',
    senderCity: 'Bursa',
    senderDistrict: 'Nilüfer',
    defaultCarrier: 'mng',
  };

  const [kargonomiToken, setKargonomiToken] = useState(defaultKargonomi.apiToken);
  const [kargonomiUrl, setKargonomiUrl] = useState(defaultKargonomi.apiUrl || 'https://app.kargonomi.com.tr/api/v1');
  const [kargonomiEnabled, setKargonomiEnabled] = useState(defaultKargonomi.enabled);
  const [kargonomiAutoCreate, setKargonomiAutoCreate] = useState(defaultKargonomi.autoCreateOnOrder !== false);
  const [kargonomiSenderName, setKargonomiSenderName] = useState(defaultKargonomi.senderName || 'AKUZ Stickers');
  const [kargonomiSenderPhone, setKargonomiSenderPhone] = useState(defaultKargonomi.senderPhone || '+90 546 875 86 71');
  const [kargonomiSenderAddress, setKargonomiSenderAddress] = useState(defaultKargonomi.senderAddress || 'Cumhuriyet Cad. No: 12');
  const [kargonomiSenderCity, setKargonomiSenderCity] = useState(defaultKargonomi.senderCity || 'Bursa');
  const [kargonomiSenderDistrict, setKargonomiSenderDistrict] = useState(defaultKargonomi.senderDistrict || 'Nilüfer');
  const [kargonomiCarrier, setKargonomiCarrier] = useState(defaultKargonomi.defaultCarrier || 'mng');

  // Müşteri Kargo Ücreti ve Ücretsiz Kargo Sepet Tutarı Barajı
  const [shippingFee, setShippingFee] = useState<number>(() => {
    return siteSettings.shippingFee !== undefined ? siteSettings.shippingFee : 39.9;
  });
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(() => {
    return siteSettings.freeShippingThreshold !== undefined ? siteSettings.freeShippingThreshold : 150;
  });

  useEffect(() => {
    if (siteSettings.shippingFee !== undefined) {
      setShippingFee(siteSettings.shippingFee);
    }
    if (siteSettings.freeShippingThreshold !== undefined) {
      setFreeShippingThreshold(siteSettings.freeShippingThreshold);
    }
  }, [siteSettings.shippingFee, siteSettings.freeShippingThreshold]);

  const [isTestingKargonomi, setIsTestingKargonomi] = useState(false);
  const [kargonomiTestResult, setKargonomiTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [creatingShipmentOrderId, setCreatingShipmentOrderId] = useState<string | null>(null);

  // PayTR Sanal POS Ayarları
  const defaultPaytr: PaytrConfig = siteSettings.paytrSettings || {
    merchantId: '759874',
    merchantKey: '5gGXBK84nWWo6s6r',
    merchantSalt: 'B4LSmLkCLUTUnro9',
    enabled: true,
    testMode: false,
  };

  const [paytrMerchantId, setPaytrMerchantId] = useState(defaultPaytr.merchantId);
  const [paytrMerchantKey, setPaytrMerchantKey] = useState(defaultPaytr.merchantKey);
  const [paytrMerchantSalt, setPaytrMerchantSalt] = useState(defaultPaytr.merchantSalt);
  const [paytrEnabled, setPaytrEnabled] = useState(defaultPaytr.enabled);
  const [paytrTestMode, setPaytrTestMode] = useState(defaultPaytr.testMode);

  const [isTestingPaytr, setIsTestingPaytr] = useState(false);
  const [isRunningTestTransaction, setIsRunningTestTransaction] = useState(false);
  const [paytrTestResult, setPaytrTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [isPaytrIframeModalOpen, setIsPaytrIframeModalOpen] = useState(false);
  const [paytrIframeModalUrl, setPaytrIframeModalUrl] = useState<string | null>(null);
  const [isOpeningPaytrModal, setIsOpeningPaytrModal] = useState(false);

  const handleOpenLivePaytrTestIframe = async () => {
    setIsOpeningPaytrModal(true);
    setPaytrTestResult(null);

    try {
      const res = await fetch('/api/paytr/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'TEST' + Date.now(),
          fullName: 'Murat Ulusoy (PayTR Test)',
          email: 'musteri@akuzstickers.com',
          phone: '+905468758671',
          address: 'Üçevler Mah. No:17/A, Nilüfer',
          city: 'Bursa',
          district: 'Nilüfer',
          totalAmount: 1, // 1 TL sembolik test tutarı
          testMode: true,
          items: [{ productName: 'PayTR Test Doğrulama', price: 1, quantity: 1 }],
        }),
      });

      const data = await res.json();
      setIsOpeningPaytrModal(false);

      if (data.success && data.iframeUrl) {
        setPaytrIframeModalUrl(data.iframeUrl);
        setIsPaytrIframeModalOpen(true);
      } else {
        setPaytrTestResult({
          success: false,
          msg: data.error || 'PayTR test oturumu açılamadı. Lütfen mağaza bilgilerinizi kontrol ediniz.',
        });
      }
    } catch (err: any) {
      setIsOpeningPaytrModal(false);
      setPaytrTestResult({
        success: false,
        msg: err.message || 'PayTR sunucusuna bağlanılamadı.',
      });
    }
  };

  const handleRunAutomatedTestTransaction = async () => {
    setIsRunningTestTransaction(true);
    setPaytrTestResult(null);

    try {
      const res = await fetch('/api/paytr/simulate-test-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setIsRunningTestTransaction(false);

      if (data.success) {
        setPaytrTestResult({
          success: true,
          msg: `🎉 ${data.message} (Test Sipariş No: ${data.testOid}). PayTR sistemine test kaydı işlendi!`,
        });
        showNotification('PayTR test işlemi başarıyla kaydedildi!');
      } else {
        setPaytrTestResult({
          success: false,
          msg: data.error || 'PayTR test işlemi çalıştırılamadı.',
        });
      }
    } catch (err: any) {
      setIsRunningTestTransaction(false);
      setPaytrTestResult({
        success: false,
        msg: err.message || 'Bağlantı hatası.',
      });
    }
  };

  const handleSavePaytr = () => {
    const updatedPaytr: PaytrConfig = {
      merchantId: paytrMerchantId.trim() || '759874',
      merchantKey: paytrMerchantKey.trim() || '5gGXBK84nWWo6s6r',
      merchantSalt: paytrMerchantSalt.trim() || 'B4LSmLkCLUTUnro9',
      enabled: paytrEnabled,
      testMode: paytrTestMode,
    };

    onUpdateSiteSettings({
      ...siteSettings,
      paytrSettings: updatedPaytr,
    });
    showNotification('PayTR Sanal POS ayarları başarıyla kaydedildi.');
  };

  const handleTestPaytrConnection = async () => {
    setIsTestingPaytr(true);
    setPaytrTestResult(null);

    try {
      const res = await fetch('/api/paytr/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: 'TEST' + Date.now(),
          fullName: 'PayTR Test Kontrol',
          email: 'test@akuzstickers.com',
          phone: '+905468758671',
          address: 'Test Adres',
          city: 'Bursa',
          district: 'Nilüfer',
          totalAmount: 10,
          items: [{ productName: 'Test Sticker', price: 10, quantity: 1 }],
        }),
      });

      const data = await res.json();
      setIsTestingPaytr(false);

      if (data.success && data.token) {
        setPaytrTestResult({
          success: true,
          msg: `PayTR bağlantısı başarılı! Mağaza No (#${paytrMerchantId}) aktif, token başarıyla alındı.`,
        });
      } else {
        setPaytrTestResult({
          success: false,
          msg: data.error || 'PayTR ile bağlantı kurulamadı. Bilgileri kontrol ediniz.',
        });
      }
    } catch (err: any) {
      setIsTestingPaytr(false);
      setPaytrTestResult({
        success: false,
        msg: err.message || 'Bağlantı hatası.',
      });
    }
  };

  const handleSaveShippingFee = () => {
    const fee = Math.max(0, isNaN(Number(shippingFee)) ? 0 : Number(shippingFee));
    const threshold = Math.max(0, isNaN(Number(freeShippingThreshold)) ? 0 : Number(freeShippingThreshold));

    onUpdateSiteSettings({
      ...siteSettings,
      shippingFee: fee,
      freeShippingThreshold: threshold,
    });
    showNotification(
      `Müşteri kargo ücreti ayarları kaydedildi! (Standart Kargo: ${fee === 0 ? 'Ücretsiz' : `₺${fee.toFixed(2).replace('.', ',')}`}, Ücretsiz Kargo Limiti: ₺${threshold.toFixed(2).replace('.', ',')})`
    );
  };

  const handleSaveKargonomi = () => {
    const fee = Math.max(0, isNaN(Number(shippingFee)) ? 0 : Number(shippingFee));
    const threshold = Math.max(0, isNaN(Number(freeShippingThreshold)) ? 0 : Number(freeShippingThreshold));

    const updatedKargonomi: KargonomiConfig = {
      apiToken: kargonomiToken.trim(),
      apiUrl: kargonomiUrl.trim() || 'https://app.kargonomi.com.tr/api/v1',
      enabled: kargonomiEnabled,
      autoCreateOnOrder: kargonomiAutoCreate,
      senderName: kargonomiSenderName.trim() || 'AKUZ Stickers',
      senderPhone: kargonomiSenderPhone.trim() || '+90 546 875 86 71',
      senderAddress: kargonomiSenderAddress.trim(),
      senderCity: kargonomiSenderCity.trim(),
      senderDistrict: kargonomiSenderDistrict.trim(),
      defaultCarrier: kargonomiCarrier as any,
    };

    onUpdateSiteSettings({
      ...siteSettings,
      shippingFee: fee,
      freeShippingThreshold: threshold,
      kargonomiSettings: updatedKargonomi,
    });
    showNotification('Kargo ücreti ve Kargonomi entegrasyon ayarları başarıyla kaydedildi.');
  };

  const handleTestKargonomiToken = async () => {
    setIsTestingKargonomi(true);
    setKargonomiTestResult(null);

    const res = await testKargonomiConnection(kargonomiToken.trim(), kargonomiUrl.trim());
    setIsTestingKargonomi(false);
    setKargonomiTestResult({
      success: res.success,
      msg: res.message,
    });
  };

  const handleCreateShipmentForOrder = async (order: Order) => {
    setCreatingShipmentOrderId(order.id);
    const result = await createKargonomiShipment({
      orderId: order.id,
      recipientName: order.customerName || 'Müşteri',
      recipientPhone: order.customerPhone || '05555555555',
      recipientAddress: order.shippingAddress || 'Adres belirtilmemiş',
      recipientCity: 'Bursa',
      recipientDistrict: 'Nilüfer',
      itemsDescription: order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', '),
      carrier: kargonomiCarrier,
    });
    setCreatingShipmentOrderId(null);

    if (result.success && result.trackingNumber) {
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            status: 'Kargoya Verildi' as const,
            trackingNumber: result.trackingNumber,
            carrierName: result.carrier || 'Kargonomi',
            kargonomiShipmentId: result.shipmentId,
          };
        }
        return o;
      });
      onUpdateOrders(updatedOrders);
      showNotification(`Kargonomi barkodu oluşturuldu! Takip No: ${result.trackingNumber}`);

      // Merkezi Host sunucusuna kargo takip numarasını kaydet
      fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Kargoya Verildi',
          trackingNumber: result.trackingNumber,
          carrierName: result.carrier || 'Kargonomi',
          kargonomiShipmentId: result.shipmentId,
        }),
      }).catch((e) => console.warn('[HOST ORDER UPDATE ERROR]', e));

      // Müşteriye anında Kargoya Verildi e-postası yolla
      if (order.customerEmail && order.customerEmail.includes('@')) {
        sendOrderShippedEmail({
          orderId: order.id,
          customerName: order.customerName || 'Değerli Müşterimiz',
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          shippingAddress: order.shippingAddress,
          trackingNumber: result.trackingNumber,
          carrierName: result.carrier || 'Kargonomi',
          items: order.items,
          totalPrice: order.total,
        }).catch(console.error);
        showNotification(`Müşteriye "${order.customerEmail}" kargo takip bildirim e-postası iletildi.`);
      }
    } else {
      showNotification(`Kargo oluşturulamadı: ${result.message}`);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16 flex flex-col">
      {/* 1. ÜST BEYAZ HEADER: Sadece 'AKUZ PANEL' ve 'Mağazaya Dön' */}
      <header className="sticky top-0 z-30 bg-white text-slate-900 border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Siteye Dön"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff0055]" />
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase font-display text-slate-900">
                AKUZ PANEL
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobil Menü Aç/Kapat Butonu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
              aria-label="Yönetim Menüsü"
            >
              {isMobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
              <span>{isMobileMenuOpen ? 'Menüyü Kapat' : 'Menü'}</span>
            </button>

            <button
              onClick={onNavigateHome}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Eye size={14} />
              <span>Mağazayı Gör</span>
            </button>
          </div>
        </div>
      </header>

      {/* Bildirim Toast */}
      {saveSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-emerald-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Check size={16} className="text-emerald-400" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. ANA LAYOUT: SOLDA DİKEY MENÜ PANELLERİ, SAĞDA İÇERİK ALANI */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 w-full flex-1">
        
        {/* MOBİL HIZLI SEÇİCİ BANNER (Sadece mobilde menü kapalıyken mevcut sekmeyi gösterir ve tek tıkla menüyü açar) */}
        <div className="lg:hidden mb-4 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ff0055]" />
            <span className="text-xs font-bold text-slate-500">Aktif Sekme:</span>
            <span className="text-xs font-black text-slate-900">
              {activeTab === 'products' && 'Ürünler'}
              {activeTab === 'colors-foils' && 'Renk & Folyo Stokları'}
              {activeTab === 'categories' && 'Kategori Yuvarlakları'}
              {activeTab === 'orders' && 'Siparişler'}
              {activeTab === 'paytr' && 'PayTR Sanal POS'}
              {activeTab === 'kargonomi' && 'Kargo & Kargonomi'}
              {activeTab === 'email-smtp' && 'E-posta & SMTP'}
              {activeTab === 'users' && 'Kullanıcılar'}
              {activeTab === 'why-akuz' && 'Neden Akuz'}
              {activeTab === 'about' && 'Hakkımızda'}
              {activeTab === 'contact' && 'İletişim Bilgileri'}
              {activeTab === 'cpanel-deploy' && 'cPanel Dağıtım & İndir'}
            </span>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="px-3 py-1.5 bg-[#ff0055] text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-transform"
          >
            <Menu size={13} />
            <span>{isMobileMenuOpen ? 'Menüyü Gizle' : 'Sekme Değiştir'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* SOL PANEL (DİKEY MENÜ): Mobilde sticky kaldırıldı, sadece masaüstünde lg:sticky lg:top-20; mobilde açılıp kapanabilir */}
          <aside className={`lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-1 relative lg:sticky lg:top-20 z-10 transition-all ${
            isMobileMenuOpen ? 'block' : 'hidden lg:block'
          }`}>
            <div className="flex items-center justify-between px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-2">
              <span>Yönetim Menüsü</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden text-slate-400 hover:text-slate-700 p-1"
                aria-label="Kapat"
              >
                <X size={15} />
              </button>
            </div>

            <button
              onClick={() => {
                setActiveTab('products');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#ff0055] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package size={16} />
                <span>Ürünler</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('colors-foils');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'colors-foils'
                  ? 'bg-[#ff0055] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Palette size={16} />
              <span>Renk & Folyo Stokları</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('categories');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-[#ff0055] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Layers size={16} />
              <span>Kategori Yuvarlakları</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('orders');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#ff0055] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag size={16} />
                <span>Siparişler</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('paytr');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'paytr'
                  ? 'bg-[#ff0055] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard size={16} className={activeTab === 'paytr' ? 'text-white' : 'text-emerald-600'} />
                <span>PayTR Sanal POS</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                activeTab === 'paytr' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
              }`}>
                POS
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('kargonomi');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'kargonomi'
                  ? 'bg-[#ff0055] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck size={16} className={activeTab === 'kargonomi' ? 'text-white' : 'text-blue-600'} />
                <span>Kargo & Kargonomi</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                activeTab === 'kargonomi' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
              }`}>
                Ücret & API
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('email-smtp');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === 'email-smtp'
                  ? 'bg-[#ff0055] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Mail size={16} />
              <span>E-posta & SMTP</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('users');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#ff0055] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} />
                <span>Kullanıcılar</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {users.length}
              </span>
            </button>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveTab('why-akuz');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'why-akuz'
                    ? 'bg-[#ff0055] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <HelpCircle size={15} />
                <span>Neden Akuz</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('about');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'about'
                    ? 'bg-[#ff0055] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText size={15} />
                <span>Hakkımızda</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('contact');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'contact'
                    ? 'bg-[#ff0055] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Phone size={15} />
                <span>İletişim Bilgileri</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveTab('cpanel-deploy');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'cpanel-deploy'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Archive size={15} className={activeTab === 'cpanel-deploy' ? 'text-white' : 'text-emerald-600'} />
                  <span>cPanel Dağıtım & İndir</span>
                </div>
                <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${
                  activeTab === 'cpanel-deploy' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  ZIP
                </span>
              </button>
            </div>
          </aside>

          {/* SAĞ PANEL (İÇERİK ALANI) */}
          <div className="lg:col-span-9 w-full">
            {/* ========================================================= */}
            {/* 1. ÜRÜN YÖNETİMİ & EKLEME */}
            {/* ========================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ürün adı veya kategori ara..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff0055]"
                  />
                </div>

                <button
                  onClick={openNewProductModal}
                  className="px-4 py-2.5 rounded-xl bg-[#ff0055] hover:bg-rose-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Yeni Ürün Ekle</span>
                </button>
              </div>

              {/* Ürün Listesi Tablosu */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[11px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Görsel</th>
                        <th className="py-3 px-4">Ürün Adı</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4">Fiyat</th>
                        <th className="py-3 px-4">Özellikler</th>
                        <th className="py-3 px-4 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                              {p.isCustomText ? (
                                <span className="text-[9px] font-black text-slate-800 text-center uppercase px-1">
                                  YAZINIZI YAZIN
                                </span>
                              ) : p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={20} className="text-slate-400" />
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-slate-900 uppercase truncate max-w-[200px]">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                              /{p.slug}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs uppercase">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {quickPriceId === p.id ? (
                              <div className="flex items-center gap-1.5 bg-orange-50 p-1.5 rounded-lg border border-orange-200">
                                <input
                                  type="number"
                                  value={quickPriceVal}
                                  onChange={(e) => setQuickPriceVal(e.target.value)}
                                  className="w-18 px-1.5 py-1 bg-white border border-[#ff6600] rounded text-xs font-black text-slate-900 focus:outline-none"
                                  placeholder="Yeni Fiyat"
                                  autoFocus
                                />
                                <span className="text-xs font-bold text-slate-700">TL</span>
                                <button
                                  type="button"
                                  onClick={() => handleSaveQuickPrice(p.id)}
                                  className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                                  title="Kaydet"
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setQuickPriceId(null)}
                                  className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                                  title="İptal"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 group/price">
                                <div>
                                  <span className="font-extrabold text-slate-900">{p.currentPrice} TL</span>
                                  {p.oldPrice > 0 && (
                                    <span className="text-[11px] text-slate-400 line-through ml-1.5">
                                      {p.oldPrice} TL
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleStartQuickPrice(p)}
                                  className="p-1 rounded hover:bg-orange-100 text-[#ff6600] transition-colors cursor-pointer"
                                  title="Hızlı Fiyat Güncelle"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {p.isCustomText && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-700">
                                  Özel Yazı
                                </span>
                              )}
                              {p.isPopular && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-700">
                                  Popüler
                                </span>
                              )}
                              {p.isDiscounted && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700">
                                  İndirim
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="Düzenle"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                title="Sil"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. RENKLER, STOK DURUMU & FOLYO TİPLERİ (MAT / PARLAK) */}
          {/* ========================================================= */}
          {activeTab === 'colors-foils' && (
            <div className="space-y-8">
              {/* Genel Folyo Tipi Yönetimi */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h3 className="text-sm font-black uppercase text-slate-900 mb-1 flex items-center gap-2">
                  <Sliders size={16} className="text-[#ff0055]" />
                  <span>Mağaza Genelinde Geçerli Folyo Tipleri</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Sitede müşterilerinize sunmak istediğiniz genel folyo yüzey tiplerini açıp kapatabilirsiniz.
                </p>

                <div className="flex items-center gap-4">
                  {(['Mat', 'Parlak'] as const).map((foil) => {
                    const isEnabled = (siteSettings.availableFoilTypes || ['Mat', 'Parlak']).includes(foil);
                    return (
                      <button
                        key={foil}
                        onClick={() => handleToggleGlobalFoil(foil)}
                        className={`px-4 py-2.5 rounded-xl border text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                            : 'bg-slate-100 border-slate-200 text-slate-400 opacity-60'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] ${
                            isEnabled ? 'bg-emerald-600' : 'bg-slate-400'
                          }`}
                        >
                          {isEnabled ? '✓' : '✕'}
                        </div>
                        <span>{foil} Folyo {isEnabled ? '(Aktif)' : '(Kapalı)'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Renk Bazlı Stok ve Folyo Seçeneği (İstenen Özellik: Mat/Parlak seçimi veya stokta yoksa ürünlerde gözükmesin) */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                      <Palette size={16} className="text-[#ff0055]" />
                      <span>Renk Paleti, Folyo Uyumluluğu & Stok Yönetimi</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Elinizde biten rengi <strong>"Tükendi / Stokta Yok"</strong> yapabilirsiniz. Stokta olmayan renkler ürün sayfasında müşterilere gösterilmez! Ayrıca her rengin <strong>Mat veya Parlak</strong> seçeneğini tek tek belirleyebilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {globalColors.map((color) => {
                    const inStock = color.inStock ?? true;
                    const supportedFinishes = color.supportedFinishes || ['Mat', 'Parlak'];
                    const isGradient = color.hex.includes('gradient');

                    return (
                      <div
                        key={color.name}
                        className={`p-4 rounded-2xl border transition-all ${
                          inStock
                            ? 'bg-white border-slate-200 shadow-2xs'
                            : 'bg-rose-50/40 border-rose-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-6 h-6 rounded-full border border-black/20 shadow-xs shrink-0"
                              style={{
                                background: isGradient ? color.hex : undefined,
                                backgroundColor: !isGradient ? color.hex : undefined,
                              }}
                            />
                            <div>
                              <p className="text-xs font-black text-slate-900 uppercase">
                                {color.name}
                              </p>
                              <span
                                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                                  inStock
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {inStock ? 'STOKTA VAR' : 'TÜKENDİ (GİZLİ)'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteColor(color.name)}
                            className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                            title="Rengi Sil"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Stok Aç/Kapa Butonu */}
                        <div className="mb-3">
                          <button
                            onClick={() => handleToggleColorStock(color.name)}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                              inStock
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {inStock ? 'Stokta Bitti Olarak İşaretle' : 'Stok Geldi (Yeniden Aç)'}
                          </button>
                        </div>

                        {/* Mat / Parlak Seçenekleri (Her rengin matı veya parlağı olmayabilir) */}
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[11px] font-bold text-slate-600 mb-1.5">
                            Bu Renkteki Folyo Seçenekleri:
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleToggleColorFinish(color.name, 'Mat')}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                supportedFinishes.includes('Mat')
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                            >
                              <span>{supportedFinishes.includes('Mat') ? '✓' : '✕'}</span>
                              <span>Mat Folyo</span>
                            </button>

                            <button
                              onClick={() => handleToggleColorFinish(color.name, 'Parlak')}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                supportedFinishes.includes('Parlak')
                                  ? 'bg-amber-500 text-white border-amber-600'
                                  : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                            >
                              <span>{supportedFinishes.includes('Parlak') ? '✓' : '✕'}</span>
                              <span>Parlak Folyo</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Yeni Renk Ekleme Formu */}
                <form
                  onSubmit={handleAddColor}
                  className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <div className="flex-1">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Yeni Renk Adı
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Krom Kırmızı, Karbon Siyah"
                      value={newColorName}
                      onChange={(e) => setNewColorName(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#ff0055]"
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      Hex Kodu
                    </label>
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-full h-8 p-0 bg-transparent cursor-pointer rounded-lg border border-slate-200"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-4 sm:pt-0">
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newColorSupportsMat}
                        onChange={(e) => setNewColorSupportsMat(e.target.checked)}
                      />
                      <span>Mat</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newColorSupportsParlak}
                        onChange={(e) => setNewColorSupportsParlak(e.target.checked)}
                      />
                      <span>Parlak</span>
                    </label>
                  </div>

                  <div className="pt-2 sm:pt-5">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-[#ff0055] hover:bg-rose-600 text-white rounded-lg text-xs font-black cursor-pointer transition-colors shadow-xs"
                    >
                      Renk Ekle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. KATEGORİ YUVARLAKLARI (FOTOĞRAF VE BAŞLIK DÜZENLEME) */}
          {/* ========================================================= */}
          {activeTab === 'categories' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-[#ff0055]" />
                  <span>Üst Kategori Yuvarlakları (Fotoğraf & Başlık Düzenleme)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ana sayfanın en üstünde yer alan yuvarlakların 1. ve 2. satır yazılarını ve resim bağlantılarını buradan değiştirebilirsiniz.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {safeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col gap-3.5 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    {/* Üst Önizleme Rozeti */}
                    <div className="flex items-center gap-3.5 p-2 bg-white rounded-xl border border-slate-200/80">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-md ${cat.bgGradient || 'bg-slate-900 text-white'}`}>
                        {cat.imageUrl ? (
                          <img src={cat.imageUrl} alt={cat.titleLine1} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="text-sm font-black uppercase text-white">{cat.titleLine1.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 leading-tight">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#ff6600]">
                          Canlı Önizleme
                        </span>
                        <p className="text-xs font-black text-slate-900 truncate mt-0.5">
                          {cat.titleLine1}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 truncate">
                          {cat.titleLine2}
                        </p>
                        <span className="inline-block mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                          id: {cat.id}
                        </span>
                      </div>
                    </div>

                    {/* Başlık Girişleri */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          1. Satır Başlık
                        </label>
                        <input
                          type="text"
                          value={cat.titleLine1}
                          onChange={(e) => handleUpdateCategory(cat.id, 'titleLine1', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#ff0055]"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          2. Satır Başlık
                        </label>
                        <input
                          type="text"
                          value={cat.titleLine2}
                          onChange={(e) => handleUpdateCategory(cat.id, 'titleLine2', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#ff0055]"
                        />
                      </div>
                    </div>

                    {/* Fotoğraf Yükleme & Seçme */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                        Yuvarlak Fotoğrafı (Yükle veya URL Gir)
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-[#ff6600] border border-orange-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs active:scale-[0.98]">
                          <Upload size={14} />
                          <span>Fotoğraf Yükle</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleCategoryFileUpload(cat.id, e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {cat.imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateCategory(cat.id, 'imageUrl', '');
                              showNotification('Fotoğraf kaldırıldı, varsayılan ikona dönüldü.');
                            }}
                            className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                            title="Fotoğrafı Kaldır"
                          >
                            Kaldır
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={cat.imageUrl || ''}
                        placeholder="Veya URL girin (/products/... veya https://)"
                        onChange={(e) => handleUpdateCategory(cat.id, 'imageUrl', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#ff0055]"
                      />

                      {/* Hızlı Mevcut Ürün Seçici */}
                      {products.length > 0 && (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleUpdateCategory(cat.id, 'imageUrl', e.target.value);
                              showNotification(`"${cat.titleLine1}" için ürün görseli seçildi!`);
                            }
                          }}
                          className="w-full mt-1.5 px-2 py-1 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option value="">⚡ Mevcut ürün görsellerinden seç...</option>
                          {products.filter((p) => p.imageUrl).map((p) => (
                            <option key={p.id} value={p.imageUrl}>
                              {p.name} ({p.category})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. SİPARİŞLER (GÖRME VE DURUM DEĞİŞTİRME) */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#ff0055]" />
                    <span>Gelen Siparişler</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Müşteri siparişlerini inceleyebilir ve kargo/hazırlık durumlarını yönetebilirsiniz.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  Henüz gelen bir sipariş bulunmuyor.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 sm:p-6 hover:bg-slate-50/70 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 uppercase">
                              #{order.id}
                            </span>
                            <span className="text-[11px] text-slate-400">{order.date}</span>
                          </div>
                          <p className="text-xs font-extrabold text-slate-700 mt-0.5">
                            Toplam: <span className="text-emerald-700 font-black">{order.total} TL</span>
                          </p>
                        </div>

                        {/* Durum Seçici & Kargonomi Kargo Butonu */}
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="text-xs font-bold text-slate-500">Durum:</label>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(order.id, e.target.value as Order['status'])
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-black border cursor-pointer ${
                              order.status === 'Hazırlanıyor'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : order.status === 'Kargoya Verildi'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            <option value="Hazırlanıyor">Hazırlanıyor</option>
                            <option value="Kargoya Verildi">Kargoya Verildi</option>
                            <option value="Teslim Edildi">Teslim Edildi</option>
                          </select>

                          {/* Kargonomi Kargo Oluşturma Butonu */}
                          {order.trackingNumber ? (
                            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                              <Truck size={14} className="text-blue-600" />
                              <span>Takip: {order.trackingNumber}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={creatingShipmentOrderId === order.id}
                              onClick={() => handleCreateShipmentForOrder(order)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              <Truck size={14} />
                              <span>
                                {creatingShipmentOrderId === order.id ? 'Oluşturuluyor...' : 'Kargonomi Barkodu Al'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sipariş Edilen Ürünler */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="text-slate-400">
                                ({item.color} • {item.dimension})
                              </span>
                            </div>
                            <span className="font-bold text-slate-700">{item.price} TL</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. KULLANICILARI GÖRME */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                  <Users size={16} className="text-[#ff0055]" />
                  <span>Kayıtlı Kullanıcılar ({users.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sitenize kayıt olan müşterilerin isimleri, e-posta adresleri ve kayıt tarihleri.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Kullanıcı</th>
                      <th className="py-3 px-4">E-posta</th>
                      <th className="py-3 px-4">Telefon</th>
                      <th className="py-3 px-4">Kayıtlı Adresler</th>
                      <th className="py-3 px-4">Kayıt Tarihi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-black flex items-center justify-center text-xs">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-extrabold text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">{u.email}</td>
                        <td className="py-3 px-4 text-slate-600">{u.phone || 'Girilmedi'}</td>
                        <td className="py-3 px-4 text-slate-600">
                          {u.addresses && u.addresses.length > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-xs">
                              {u.addresses.length} Adres Kayıtlı
                            </span>
                          ) : (
                            <span className="text-slate-400">Adres Yok</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. NEDEN AKUZ STICKERS (4 KUTU DÜZENLEME) */}
          {/* ========================================================= */}
          {activeTab === 'why-akuz' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                  <HelpCircle size={16} className="text-[#ff6600]" />
                  <span>"Neden AKUZ Stickers?" Bölümündeki Avantaj Kutularını Düzenle</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ana sayfada yer alan 3 avantaj kartının (Hızlı Kargo, Kalite ve Ürün Çeşitliliği) başlık ve açıklamalarını buradan güncelleyebilirsiniz.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {safeWhyCards.map((card, idx) => (
                  <div
                    key={card.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#ff0055] uppercase">
                        Kutu {idx + 1}
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Kutu Başlığı
                      </label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleUpdateWhyCard(card.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Kutu Açıklama Metni
                      </label>
                      <textarea
                        rows={3}
                        value={card.description}
                        onChange={(e) => handleUpdateWhyCard(card.id, 'description', e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-medium resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. HAKKIMIZDA DÜZENLEME */}
          {/* ========================================================= */}
          {activeTab === 'about' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-[#ff6600]" />
                  <span>"Biz Kimiz ?" Altındaki Yazıyı Düzenle</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ana sayfada ve /hakkimizda sayfasında ziyaretçilere gösterilen Biz Kimiz ? yazısı.
                </p>
              </div>

              <div className="space-y-4">
                {aboutParagraphs.map((para, idx) => (
                  <div key={idx}>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {idx + 1}. Paragraf:
                    </label>
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => {
                        const updated = [...aboutParagraphs];
                        updated[idx] = e.target.value;
                        setAboutParagraphs(updated);
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-[#ff6600]"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveAbout}
                className="px-5 py-2.5 bg-[#ff6600] hover:bg-orange-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors"
              >
                Biz Kimiz ? Yazısını Kaydet
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. İLETİŞİM DÜZENLEME (YAZI, EPOSTA, TELEFON, ADRES) */}
          {/* ========================================================= */}
          {activeTab === 'contact' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                  <Phone size={16} className="text-[#ff0055]" />
                  <span>İletişim Bölümü & Bilgileri Düzenleme</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Başlık altındaki açıklama metni, e-posta adresi, telefon numarası ve mağaza adresi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    İletişim Başlığı Altındaki Açıklama Yazısı
                  </label>
                  <input
                    type="text"
                    value={contactDesc}
                    onChange={(e) => setContactDesc(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-[#ff0055]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    E-Posta Adresi
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    WhatsApp Sipariş Hattı
                  </label>
                  <input
                    type="text"
                    value={contactWhatsApp}
                    onChange={(e) => setContactWhatsApp(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Adres / Konum
                  </label>
                  <input
                    type="text"
                    value={contactAddress}
                    onChange={(e) => setContactAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveContact}
                className="px-5 py-2.5 bg-[#ff0055] hover:bg-rose-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors"
              >
                İletişim Bilgilerini Kaydet
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. cPanel SMTP E-POSTA AYARLARI */}
          {/* ========================================================= */}
          {activeTab === 'email-smtp' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-[#ff0055]">
                        <Mail size={18} />
                      </div>
                      <h3 className="text-base font-black uppercase text-slate-900">
                        cPanel Kurumsal E-Posta & SMTP Ayarları
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Yeni üyelikler, sipariş durumu (hazırlanıyor / kargoya verildi / teslim edildi) bildirimleri bu kurumsal e-posta hesabınızdan müşterilerinize gönderilir.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        checked={smtpEnabled}
                        onChange={(e) => setSmtpEnabled(e.target.checked)}
                        className="rounded text-[#ff0055] focus:ring-[#ff0055]"
                      />
                      <span className="text-xs font-extrabold text-slate-800">
                        {smtpEnabled ? 'E-posta Sistemi Aktif' : 'E-posta Sistemi Kapalı'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Bilgilendirme Kartı */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                  <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold">E-Posta Gönderiminde Hata Alıyorsanız:</p>
                    <p className="text-[11px] text-blue-800 leading-relaxed">
                      1. cPanel paneline girip <strong>E-Posta Hesapları</strong> sayfasından <strong>{smtpUser || 'info@akuzstickers.com'}</strong> e-posta hesabınızın şifresini kontrol edin.<br />
                      2. Aşağıdaki formda <strong>cPanel E-Posta Hesap Şifreniz</strong> kutucuğuna şifrenizi yazın ve <strong>E-Posta Ayarlarını Kaydet</strong> butonuna basın.<br />
                      3. Ardından aşağıdaki <strong>Test E-Postasının Gönderileceği Adres</strong> kutusuna e-posta adresinizi girip <strong>Kayıt Testi</strong> veya <strong>Hazırlanıyor Testi</strong> butonlarına tıklayarak canlı test yapabilirsiniz.
                    </p>
                  </div>
                </div>

                {/* Form Alanları */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      SMTP Sunucu Adresi (Outgoing Server) *
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: mail.akuzstickers.com veya smtp.siteadiniz.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        SMTP Portu *
                      </label>
                      <input
                        type="number"
                        placeholder="465 veya 587"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Güvenlik (SSL)
                      </label>
                      <select
                        value={smtpSecure ? 'ssl' : 'tls'}
                        onChange={(e) => setSmtpSecure(e.target.value === 'ssl')}
                        className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                      >
                        <option value="ssl">SSL (Port 465)</option>
                        <option value="tls">TLS / STARTTLS (Port 587)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      cPanel E-Posta Kullanıcı Adı (Adresiniz) *
                    </label>
                    <input
                      type="email"
                      placeholder="info@akuzstickers.com veya siparis@akuzstickers.com"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      cPanel E-Posta Hesap Şifreniz *
                    </label>
                    <div className="relative">
                      <input
                        type={showSmtpPass ? 'text' : 'password'}
                        placeholder="cPanel e-posta şifrenizi girin"
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                      />
                      <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                        title={showSmtpPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
                      >
                        {showSmtpPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      cPanel &gt; E-Posta Hesapları bölümünde oluşturduğunuz e-posta adresinizin giriş şifresidir.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Gönderen İsmi (Gelen Kutularında Görünecek)
                    </label>
                    <input
                      type="text"
                      placeholder="AKUZ Stickers"
                      value={smtpFromName}
                      onChange={(e) => setSmtpFromName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Gönderen E-Postası (From Email)
                    </label>
                    <input
                      type="email"
                      placeholder="info@akuzstickers.com"
                      value={smtpFromEmail}
                      onChange={(e) => setSmtpFromEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:border-[#ff0055]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSmtp}
                    className="px-5 py-2.5 bg-[#ff0055] hover:bg-rose-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    <span>E-Posta Ayarlarını Kaydet</span>
                  </button>

                  <button
                    type="button"
                    disabled={isTestingSmtp}
                    onClick={handleTestConnection}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <ShieldCheck size={16} className="text-indigo-600" />
                    <span>{isTestingSmtp ? 'Bağlanıyor...' : 'SMTP Bağlantısını Sına'}</span>
                  </button>
                </div>
              </div>

              {/* CANLI TEST GÖNDERİM KUTUSU (HER BİLDİRİM İÇİN AYRI TEST BUTONU) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Send size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-900">
                      Canlı E-Posta Şablon Testleri
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Her bildirim türünü ayrı butonlarla test ederek gelen kutunuzdaki görünümünü canlı kontrol edebilirsiniz.
                    </p>
                  </div>
                </div>

                {/* Hedef Test Adresi */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Test E-Postasının Gönderileceği Adres
                  </label>
                  <input
                    type="email"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="Test edilecek e-posta adresi (örn: mrlulas37@gmail.com)"
                    className="w-full max-w-lg px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Bildirimlere Göre Ayrı Test Butonları */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* 1. Kayıt / Hoş Geldin Bildirimi */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-xs font-black uppercase text-slate-900">1. Kayıt Bildirimi</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Yeni kullanıcı kayıt olduğunda giden <strong>Hoş Geldin</strong> şablonu.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isTestingSmtp}
                      onClick={handleSendTestWelcomeMail}
                      className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Send size={13} />
                      <span>{isTestingSmtp ? 'Gönderiliyor...' : 'Kayıt Testi'}</span>
                    </button>
                  </div>

                  {/* 2. Siparişiniz Hazırlanıyor Bildirimi */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-black uppercase text-slate-900">2. Hazırlanıyor Bildirimi</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Sipariş oluşturulduğunda giden <strong>Siparişiniz Hazırlanıyor</strong> şablonu.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isTestingSmtp}
                      onClick={handleSendTestPreparingMail}
                      className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Package size={13} />
                      <span>{isTestingSmtp ? 'Gönderiliyor...' : 'Hazırlanıyor Testi'}</span>
                    </button>
                  </div>

                  {/* 3. Kargoya Verildi Bildirimi */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs font-black uppercase text-slate-900">3. Kargoya Verildi</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Sipariş kargoya verildiğinde giden <strong>Takip Kodlu Kargo</strong> şablonu.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isTestingSmtp}
                      onClick={handleSendTestShippedMail}
                      className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Truck size={13} />
                      <span>{isTestingSmtp ? 'Gönderiliyor...' : 'Kargoya Verildi Testi'}</span>
                    </button>
                  </div>

                  {/* 4. Teslim Edildi Bildirimi */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span className="text-xs font-black uppercase text-slate-900">4. Teslim Edildi</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Kargo müşteriye teslim edildiğinde giden <strong>Teslim Edildi & Yorum</strong> şablonu.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isTestingSmtp}
                      onClick={handleSendTestDeliveredMail}
                      className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <CheckCircle size={13} />
                      <span>{isTestingSmtp ? 'Gönderiliyor...' : 'Teslim Edildi Testi'}</span>
                    </button>
                  </div>
                </div>

                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 max-w-2xl ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <Check size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    )}
                    <span>{testResult.msg}</span>
                  </div>
                )}
              </div>

              {/* GOOGLE İLE GİRİŞ & OAUTH 2.0 AYARLARI KARTI */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-base font-black uppercase text-slate-900">
                        Google ile Giriş & OAuth 2.0 Entegrasyonu
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Müşterilerinizin Google hesaplarıyla 1-tıkla oturum açması ve hesap bilgilerine (adresler, geçmiş siparişler) kalıcı olarak erişmesi için yapılandırma.
                    </p>
                  </div>
                </div>

                {/* Bilgilendirme ve Origin Mismatch Çözüm Rehberi */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                    <CheckCircle size={16} className="text-blue-600 shrink-0" />
                    <span>Akıllı Google Girişi devrededir (Error 400: origin_mismatch engeli kaldırılmıştır)</span>
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Sistemimizde müşterileriniz için <strong>Yerleşik Kesintisiz Google Girişi</strong> mevcuttur. Kullanıcılar Google e-postalarını seçtiğinde ya da girdiğinde sistem hesabını otomatik hatırlar, kayıtlı teslimat adreslerini ve geçmiş tüm siparişlerini eksiksiz yükler.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Sitenizin JavaScript Kaynağı (Origin URL)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={typeof window !== 'undefined' ? window.location.origin : 'https://akuzstickers.com'}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-100 rounded-xl border border-slate-300 font-mono text-slate-700 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            navigator.clipboard.writeText(window.location.origin);
                            setCopiedOrigin(true);
                            setTimeout(() => setCopiedOrigin(false), 2000);
                          }
                        }}
                        className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedOrigin ? 'Kopyalandı!' : 'Kopyala'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Google Cloud Console'da <em>"Authorized JavaScript origins"</em> alanına bu adresi ekleyin.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Google OAuth Client ID (İsteğe Bağlı)
                    </label>
                    <input
                      type="text"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      placeholder="660437230655-...apps.googleusercontent.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ff0055] font-mono text-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Google Cloud Console'dan aldığınız Web İstemci Kimliği (Client ID).
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleSaveGoogleOAuth}
                    className="py-2.5 px-5 bg-[#ff0055] hover:bg-[#d90048] text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all active:scale-98"
                  >
                    Google Ayarlarını Kaydet
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 9. PAYTR SANAL POS ÖDEME ENTEGRASYONU */}
          {/* ========================================================= */}
          {activeTab === 'paytr' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CreditCard size={18} />
                      </div>
                      <h3 className="text-base font-black uppercase text-slate-900">
                        PayTR Sanal POS Ödeme Entegrasyonu
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Kredi kartı ve banka kartı ile 3D Secure güvenli ödeme alma altyapısı (256-Bit SSL).
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        checked={paytrEnabled}
                        onChange={(e) => setPaytrEnabled(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-600"
                      />
                      <span className="text-xs font-extrabold text-slate-800">
                        {paytrEnabled ? 'PayTR Aktif' : 'PayTR Devre Dışı'}
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-200">
                      <input
                        type="checkbox"
                        checked={paytrTestMode}
                        onChange={(e) => setPaytrTestMode(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-600"
                      />
                      <span className="text-xs font-bold text-amber-900">
                        {paytrTestMode ? 'Test Modu' : 'Canlı Mod'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Form Alanları */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Mağaza No */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      PayTR Mağaza No (Merchant ID) *
                    </label>
                    <input
                      type="text"
                      value={paytrMerchantId}
                      onChange={(e) => setPaytrMerchantId(e.target.value)}
                      placeholder="759874"
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">PayTR panelinizdeki Mağaza Numarası</p>
                  </div>

                  {/* Mağaza Parola */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      PayTR Mağaza Parola (Merchant Key) *
                    </label>
                    <input
                      type="text"
                      value={paytrMerchantKey}
                      onChange={(e) => setPaytrMerchantKey(e.target.value)}
                      placeholder="5gGXBK84nWWo6s6r"
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">API Entegrasyon anahtarı</p>
                  </div>

                  {/* Mağaza Gizli Anahtar */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      PayTR Gizli Anahtar (Merchant Salt) *
                    </label>
                    <input
                      type="password"
                      value={paytrMerchantSalt}
                      onChange={(e) => setPaytrMerchantSalt(e.target.value)}
                      placeholder="B4LSmLkCLUTUnro9"
                      className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold focus:bg-white focus:outline-none focus:border-emerald-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">HMAC SHA256 şifreleme tuzu</p>
                  </div>
                </div>

                {/* BİLDİRİM URL (CALLBACK URL) TANIMI */}
                <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-950 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-blue-900">
                      <ExternalLink size={16} className="text-blue-600" />
                      <span>PayTR Bildirim URL (Callback URL) Tanımı</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-200 text-blue-900 border border-blue-300">
                      PayTR Paneline Girilecek
                    </span>
                  </div>

                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    PayTR'ın <strong>"BİLDİRİM URL'DE SORUN VAR"</strong> uyarısını kaldırmak için; PayTR Mağaza Paneli (magaza.paytr.com) &gt; <strong>Ayarlar &gt; Bildirim URL Ayarları</strong> sayfasına aşağıdaki adresi girip kaydedin:
                  </p>

                  <div className="space-y-1.5">
                    {/* cPanel Standalone Doğrudan Callback (En Güvenilir) */}
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-blue-200 font-mono text-xs text-slate-800">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-emerald-600 font-bold block uppercase tracking-wider font-sans">1. Seçenek (Önerilen PHP Dosyası):</span>
                        <span className="truncate font-bold block">https://akuzstickers.com/paytr-callback.php</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('https://akuzstickers.com/paytr-callback.php');
                          showNotification('Önerilen Bildirim URL kopyalandı: paytr-callback.php');
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors shrink-0"
                      >
                        Kopyala
                      </button>
                    </div>

                    {/* API Router URL */}
                    <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-blue-200 font-mono text-xs text-slate-800">
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-blue-600 font-bold block uppercase tracking-wider font-sans">2. Seçenek (API Rotası):</span>
                        <span className="truncate font-bold block">https://akuzstickers.com/api/paytr/callback</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('https://akuzstickers.com/api/paytr/callback');
                          showNotification('API Bildirim URL kopyalandı: api/paytr/callback');
                        }}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors shrink-0"
                      >
                        Kopyala
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
                    <p className="font-bold text-red-600">
                      ⚠️ Neden "&lt;!doctype html&gt;" Hatası Alıyordunuz?
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      PayTR paneline Bildirim URL olarak sadece ana sayfa linki (<code>https://akuzstickers.com/</code>) veya <code>/odeme</code> yazıldığında, sunucu PayTR botuna sayfa tasarımını (HTML) gönderir. PayTR ise yalnızca <strong>"OK"</strong> metni beklediğinden hata verir. Yukarıdaki <strong>paytr-callback.php</strong> adresini kaydedip <strong>"Tekrar Kontrol Et"</strong> butonuna basınız.
                    </p>
                  </div>
                </div>

                {/* Bilgilendirme Notu */}
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <ShieldCheck size={16} className="text-emerald-700" />
                    <span>PayTR Entegrasyonu Aktif Durumda</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Müşterileriniz sepeti onayladığında resmi <strong>PayTR 3D Secure</strong> penceresi açılır. Ödeme tamamlandığında sipariş otomatik olarak <strong>Hazırlanıyor</strong> durumuna geçer ve müşteriye e-posta gönderilir.
                  </p>
                </div>

                {/* TEST İŞLEM YAPILMAMIŞ ÇÖZÜMÜ & TEST KART REHBERİ */}
                <div className="p-4 sm:p-5 bg-amber-50/90 rounded-2xl border-2 border-amber-300 text-xs text-amber-950 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-amber-950 text-xs sm:text-sm">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                      <span>PayTR "TEST İŞLEM YAPILMAMIŞ" Uyarısı ve Onay Rehberi</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                      Zorunlu Adım
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    PayTR ekibi mağazanızı canlıya almadan önce sitenizden en az 1 adet test ödemesi yapılmasını zorunlu tutar.
                    <strong> Bu finansal bir işlem değildir, kartınızdan hiçbir ücret çekilmez.</strong>
                  </p>

                  {/* Test Kart Bilgileri */}
                  <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">PayTR Resmi Test Kart Bilgileri:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText('4355084355084358');
                          showNotification('Test kart numarası kopyalandı!');
                        }}
                        className="text-[10px] font-black text-amber-700 hover:text-amber-900 underline cursor-pointer"
                      >
                        Tıkla & Kopyala
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                        <span className="text-[9px] text-slate-500 block font-sans">Kart No</span>
                        <strong className="text-[11px] text-slate-900">4355 0843 5508 4358</strong>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                        <span className="text-[9px] text-slate-500 block font-sans">SKT (Ay/Yıl)</span>
                        <strong className="text-[11px] text-slate-900">12 / 30</strong>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                        <span className="text-[9px] text-slate-500 block font-sans">CVV</span>
                        <strong className="text-[11px] text-slate-900">000</strong>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                        <span className="text-[9px] text-slate-500 block font-sans">Kart Sahibi</span>
                        <strong className="text-[11px] text-slate-900 font-sans">PAYTR TEST</strong>
                      </div>
                    </div>
                  </div>

                  {/* Test İşlemi Adımları */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isOpeningPaytrModal}
                      onClick={handleOpenLivePaytrTestIframe}
                      className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isOpeningPaytrModal ? 'animate-spin' : ''} />
                      <span>{isOpeningPaytrModal ? 'PayTR Ekranı Hazırlanıyor...' : '🚀 1. PayTR Test Ödeme Penceresini Başlat (Canlı 3D Secure)'}</span>
                    </button>

                    <a
                      href="/odeme"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>2. Ödeme Sayfasında Manuel Test Et</span>
                      <ArrowRight size={14} />
                    </a>
                  </div>

                  <p className="text-[10px] text-amber-800 italic pt-1">
                    📌 <strong>Önemli:</strong> PayTR sistemine test kaydının düşmesi için yukarıdaki butona tıklayıp açılan PayTR penceresinde test kartı ile <strong>"Ödeme Yap"</strong> butonuna ve ardından 3D Secure simülasyonunda <strong>"Gönder / Onayla"</strong> butonuna basmanız gerekmektedir. İşlem tamamlandıktan sonra PayTR Mağaza Paneli (magaza.paytr.com) &gt; Destek &amp; Kurulum &gt; Canlı Mod sayfasından <strong>"Evet, Entegrasyonu Tamamladım"</strong> butonuna tıklayınız.
                  </p>
                </div>

                {/* İşlem Butonları */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSavePaytr}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    <span>PayTR Ayarlarını Kaydet</span>
                  </button>

                  <button
                    type="button"
                    disabled={isTestingPaytr}
                    onClick={handleTestPaytrConnection}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw size={14} className={isTestingPaytr ? 'animate-spin' : ''} />
                    <span>{isTestingPaytr ? 'PayTR API Sınanıyor...' : 'PayTR API Bağlantısını Sına'}</span>
                  </button>
                </div>

                {/* Test Sonuç Bildirimi */}
                {paytrTestResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                      paytrTestResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {paytrTestResult.success ? (
                      <Check size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    )}
                    <span>{paytrTestResult.msg}</span>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ADMIN İÇİ PAYTR CANLI TEST MODAL PENCERESİ */}
          {isPaytrIframeModalOpen && paytrIframeModalUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <Lock size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm tracking-wide">PayTR Test Ödeme Simülasyonu</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          1 TL TEST
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Mağaza No: #759874 · Para Çekilmez (Test İşlemi)
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaytrIframeModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Kapat"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Hızlı Kopyalama Şeridi */}
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shrink-0">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Aşağıdaki kutucuklara test kartını girip "Ödeme Yap"a tıklayın:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-extrabold text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300">
                      4355 0843 5508 4358 · 12/30 · 000
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('4355 0843 5508 4358');
                        showNotification('Test kart numarası kopyalandı!');
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Kartı Kopyala
                    </button>
                  </div>
                </div>

                {/* iFrame Container */}
                <div className="flex-1 bg-slate-100 overflow-y-auto p-1 sm:p-3 min-h-[560px] sm:min-h-[620px]">
                  <iframe
                    src={paytrIframeModalUrl}
                    id="paytr-admin-test-iframe"
                    frameBorder={0}
                    scrolling="yes"
                    className="w-full h-[560px] sm:h-[620px] bg-white rounded-2xl shadow-xs border border-slate-200"
                    title="PayTR Canlı Test Ödeme Ekranı"
                  />
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
                  <span className="text-[11px] text-slate-500">
                    Ödemeyi ve 3D Secure onayını tamamladığınızda PayTR sistemine anında kayıt düşecektir.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaytrIframeModalOpen(false);
                      showNotification('PayTR test penceresi kapatıldı.');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 10. KARGO ÜCRETİ & KARGONOMİ ENTEGRASYONU */}
          {/* ========================================================= */}
          {activeTab === 'kargonomi' && (
            <div className="space-y-6">
              {/* ========================================================= */}
              {/* 1. MÜŞTERİNİN ÖDEYECEĞİ KARGO ÜCRETİ & ÜCRETSİZ KARGO LİMİTİ */}
              {/* ========================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Truck size={18} />
                      </div>
                      <h3 className="text-base font-black uppercase text-slate-900">
                        Müşteri Kargo Ücreti ve Ücretsiz Kargo Limiti
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Müşterilerin sepet ve ödeme adımında ödeyeceği standart kargo tutarını ve ücretsiz kargo barajını buradan belirleyin.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold rounded-xl flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Geçerli Kargo: {Number(shippingFee) === 0 ? 'Ücretsiz (0 ₺)' : `₺${Number(shippingFee).toFixed(2).replace('.', ',')}`}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Standart Kargo Ücreti */}
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-800 block mb-1">
                        Standart Kargo Ücreti (₺)
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Müşterinin siparişine eklenecek kargo bedeli. <strong className="text-slate-800">0</strong> yazarsanız tüm siparişler kargo bedava olur.
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={shippingFee}
                        onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                        placeholder="39.90"
                        className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₺</span>
                    </div>

                    {/* Hızlı Seçim Butonları */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Hızlı Seçenekler:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Ücretsiz (0 ₺)', val: 0 },
                          { label: '29.90 ₺', val: 29.9 },
                          { label: '39.90 ₺', val: 39.9 },
                          { label: '49.90 ₺', val: 49.9 },
                          { label: '59.90 ₺', val: 59.9 },
                          { label: '79.90 ₺', val: 79.9 },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => setShippingFee(btn.val)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                              Number(shippingFee) === btn.val
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Ücretsiz Kargo Sepet Barajı */}
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                    <div>
                      <label className="text-xs font-black uppercase text-slate-800 block mb-1">
                        Ücretsiz Kargo Sepet Barajı (₺)
                      </label>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Sepet tutarı bu tutara veya üzerine ulaştığında kargo ücreti 0 ₺ yapılır ve müşteriye <strong className="text-emerald-700">"Kargo Bedava"</strong> avantajı sunulur.
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={freeShippingThreshold}
                        onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                        placeholder="150"
                        className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₺</span>
                    </div>

                    {/* Hızlı Seçim Butonları */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Hızlı Seçenekler:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '100 ₺', val: 100 },
                          { label: '150 ₺', val: 150 },
                          { label: '200 ₺', val: 200 },
                          { label: '250 ₺', val: 250 },
                          { label: '500 ₺', val: 500 },
                          { label: 'Limitsiz (Hep Ücretli)', val: 999999 },
                        ].map((btn) => (
                          <button
                            key={btn.label}
                            type="button"
                            onClick={() => setFreeShippingThreshold(btn.val)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                              Number(freeShippingThreshold) === btn.val
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canlı Kural Önizleme Kutusu */}
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
                  <Truck size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black uppercase tracking-wider text-[11px] block text-blue-950 mb-0.5">
                      Canlı Müşteri Kuralı Önizlemesi:
                    </span>
                    <p className="font-medium leading-relaxed">
                      {Number(shippingFee) === 0 ? (
                        <span>Tüm sepet tutarlarında kargo <strong className="text-emerald-700 font-bold">TAMAMEN ÜCRETSİZ</strong> olarak müşteriye sunulur.</span>
                      ) : Number(freeShippingThreshold) >= 999999 ? (
                        <span>Müşteri sepet tutarından bağımsız olarak her siparişte <strong className="font-bold">₺{Number(shippingFee).toFixed(2).replace('.', ',')}</strong> kargo ücreti öder.</span>
                      ) : (
                        <span>
                          Sepet tutarı <strong>₺{Number(freeShippingThreshold).toFixed(2).replace('.', ',')}</strong> altında olan siparişlerde kargo ücreti <strong className="font-bold">₺{Number(shippingFee).toFixed(2).replace('.', ',')}</strong> olarak sepete ve ödemeye yansıtılır. 
                          <strong> ₺{Number(freeShippingThreshold).toFixed(2).replace('.', ',')} ve üzeri</strong> sepetlerde kargo müşteriye <strong className="text-emerald-700 font-bold">ÜCRETSİZ</strong> sunulur.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Kaydet Butonu */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveShippingFee}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1.5 active:scale-98"
                  >
                    <Check size={16} />
                    <span>Müşteri Kargo Ücreti Ayarlarını Kaydet</span>
                  </button>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 2. KARGONOMİ API KARGO ENTEGRASYONU */}
              {/* ========================================================= */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                        <Truck size={18} />
                      </div>
                      <h3 className="text-base font-black uppercase text-slate-900">
                        Kargonomi API Kargo Entegrasyonu
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Müşteri siparişleriniz için otomatik kargo barkodu, takip numarası ve kargo fişi oluşturur.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        checked={kargonomiEnabled}
                        onChange={(e) => setKargonomiEnabled(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-600"
                      />
                      <span className="text-xs font-extrabold text-slate-800">
                        {kargonomiEnabled ? 'Kargonomi Aktif' : 'Kargonomi Devre Dışı'}
                      </span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-blue-50/70 px-3 py-1.5 rounded-xl border border-blue-200">
                      <input
                        type="checkbox"
                        checked={kargonomiAutoCreate}
                        onChange={(e) => setKargonomiAutoCreate(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-600"
                      />
                      <span className="text-xs font-black text-blue-900">
                        Sipariş Verilince Otomatik Panele Düşür
                      </span>
                    </label>
                  </div>
                </div>

                {/* API Token ve URL */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Kargonomi Bearer API Token *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={kargonomiToken}
                        onChange={(e) => setKargonomiToken(e.target.value)}
                        placeholder="Örn: Ly2mGS6WC2iDAuwdC2C5D9omqnsJkjBZIO4qeJMIe8175aa3"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                      <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Token tanımlı: <code className="text-blue-600 font-bold">Ly2mGS6WC2iDAuwdC2C5D9omqnsJkjBZIO4qeJMIe8175aa3</code>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Kargonomi API Endpoint URL
                      </label>
                      <input
                        type="text"
                        value={kargonomiUrl}
                        onChange={(e) => setKargonomiUrl(e.target.value)}
                        placeholder="https://app.kargonomi.com.tr/api/v1"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Varsayılan Anlaşmalı Kargo Firması
                      </label>
                      <select
                        value={kargonomiCarrier}
                        onChange={(e) => setKargonomiCarrier(e.target.value as NonNullable<KargonomiConfig['defaultCarrier']>)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:bg-white focus:outline-none focus:border-blue-600"
                      >
                        <option value="mng">MNG Kargo</option>
                        <option value="yurtici">Yurtiçi Kargo</option>
                        <option value="surat">Sürat Kargo</option>
                        <option value="aras">Aras Kargo</option>
                        <option value="ptt">PTT Kargo</option>
                        <option value="sendeo">Sendeo</option>
                        <option value="hepsijet">HepsiJET</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Gönderici (Mağaza) Bilgileri */}
                <div className="pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase text-slate-800 mb-3 flex items-center gap-1.5">
                    <Truck size={14} className="text-blue-600" />
                    <span>Kargo Etiketinde Görünecek Gönderici Bilgileri</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Gönderici Ünvanı</label>
                      <input
                        type="text"
                        value={kargonomiSenderName}
                        onChange={(e) => setKargonomiSenderName(e.target.value)}
                        placeholder="AKUZ Stickers"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Gönderici Telefon</label>
                      <input
                        type="text"
                        value={kargonomiSenderPhone}
                        onChange={(e) => setKargonomiSenderPhone(e.target.value)}
                        placeholder="+90 546 875 86 71"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">Açık Adres</label>
                      <input
                        type="text"
                        value={kargonomiSenderAddress}
                        onChange={(e) => setKargonomiSenderAddress(e.target.value)}
                        placeholder="Cumhuriyet Cad. No: 12"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">İlçe</label>
                      <input
                        type="text"
                        value={kargonomiSenderDistrict}
                        onChange={(e) => setKargonomiSenderDistrict(e.target.value)}
                        placeholder="Nilüfer"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">İl</label>
                      <input
                        type="text"
                        value={kargonomiSenderCity}
                        onChange={(e) => setKargonomiSenderCity(e.target.value)}
                        placeholder="Bursa"
                        className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Butonlar */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSaveKargonomi}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    <span>Kargonomi Ayarlarını Kaydet</span>
                  </button>

                  <button
                    type="button"
                    disabled={isTestingKargonomi}
                    onClick={handleTestKargonomiToken}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <ShieldCheck size={16} className="text-blue-600" />
                    <span>{isTestingKargonomi ? 'Token Kontrol Ediliyor...' : 'API Token ve Bağlantıyı Sına'}</span>
                  </button>
                </div>

                {/* Test Sonuç Bildirimi */}
                {kargonomiTestResult && (
                  <div
                    className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      kargonomiTestResult.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {kargonomiTestResult.success ? (
                      <Check size={16} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                    )}
                    <span>{kargonomiTestResult.msg}</span>
                  </div>
                )}
              </div>

              {/* Siparişlerden Tek Tıkla Kargo Oluşturma Kartı */}
              <div className="bg-gradient-to-br from-blue-50/60 to-white rounded-2xl border border-blue-200/80 p-5 sm:p-6 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode size={18} className="text-blue-600" />
                  <h4 className="text-xs font-black uppercase text-slate-900">
                    Siparişler Sekmesinden Tek Tıkla Kargo
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Siparişler</strong> sekmesinde gelen her siparişin yanında bulunan <strong>"Kargonomi Barkodu Al"</strong> butonuna bastığınızda, alıcı bilgileri otomatik Kargonomi sistemine iletilir ve müşterinin takip numarası sisteme işlenir.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 11. CPANEL DAĞITIM & İNDİRME MERKEZİ */}
          {/* ========================================================= */}
          {activeTab === 'cpanel-deploy' && (
            <div className="space-y-6">
              {/* Başlık Banner */}
              <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-black uppercase tracking-wider">
                      <Archive size={14} />
                      <span>cPanel & Hosting Dağıtım Paketi</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black">
                      cPanel'e Tek Tıkla Yükleme ve Yayınlama
                    </h3>
                    <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                      AKUZ Stickers mağazanızın tüm kaynakları (derlenmiş Vite ön yüzü, Express sunucusu, sipariş/kullanıcı JSON veritabanı, ürün fotoğrafları ve Apache .htaccess kuralları) cPanel'e yüklenmeye hazır güncel ZIP paketleri olarak derlendi.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 rounded-full text-xs font-bold text-emerald-100">
                        <CheckCircle size={13} className="text-emerald-300" />
                        Dosyalar %100 Güncel
                      </span>
                      <span className="text-xs text-emerald-200/80">
                        {cpanelStatus?.fullApp?.lastModified
                          ? `Son derleme: ${new Date(cpanelStatus.fullApp.lastModified).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                          : 'Son sürüm hazırlandı'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
                    <button
                      type="button"
                      onClick={handleRebuildCpanel}
                      disabled={rebuildingCpanel}
                      className="px-5 py-3 bg-white text-emerald-800 hover:bg-emerald-50 disabled:opacity-60 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer"
                    >
                      {rebuildingCpanel ? (
                        <>
                          <RefreshCw size={17} className="animate-spin text-emerald-600" />
                          <span>Paketler Derleniyor...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={17} className="text-emerald-600" />
                          <span>Paketleri Şimdi Yeniden Derle</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-emerald-200/70">
                      Son değişiklikleri ZIP'lere aktarır
                    </span>
                  </div>
                </div>
              </div>

              {/* İKİ BÜYÜK İNDİRME KARTI */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. KART: FULL NODE.JS UYGULAMASI (ÖNERİLEN) */}
                <div className="bg-white rounded-3xl border-2 border-emerald-500/80 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                    ÖNERİLEN (TAM SÜRÜM)
                  </div>
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Server size={24} />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900">
                        cPanel Node.js Tam Paketi
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Dosya Adı: <span className="font-mono font-bold text-slate-700">cpanel_full_app.zip</span> ({cpanelStatus?.fullApp?.sizeMb || '19.8 MB'})
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      cPanel <strong>"Setup Node.js App"</strong> özelliğiyle çalıştırmak içindir. Sipariş alma, kullanıcı kaydı, cPanel SMTP e-posta gönderimleri ve Kargonomi kargo entegrasyonu dahil <strong>tüm özellikler eksiksiz çalışır</strong>.
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                        <span><strong>server.js</strong> (Derlenmiş hazır Express backend)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                        <span><strong>dist/</strong> (Tüm optimize edilmiş sayfalar ve resimler)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                        <span><strong>data_storage/</strong> (Kullanıcılar ve siparişler)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                        <span><strong>.htaccess</strong> (Apache SPA URL rewrite)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() => handleDownloadZip('/download-cpanel-full.zip', 'cpanel_full_app.zip')}
                      disabled={Boolean(downloadingZip) || rebuildingCpanel}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                    >
                      {downloadingZip === 'cpanel_full_app.zip' ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Paket Hazırlanıyor & İndiriliyor...</span>
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          <span>Tam Paketi İndir (.ZIP)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. KART: STATİK SİTE (PUBLIC_HTML) */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <FolderDown size={24} />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900">
                        public_html Statik Paketi
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Dosya Adı: <span className="font-mono font-bold text-slate-700">cpanel_public_html_dist.zip</span> ({cpanelStatus?.distApp?.sizeMb || '9.6 MB'})
                      </p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sitenizi yalnızca statik vitrin olarak doğrudan cPanel <strong>public_html</strong> klasörüne atıp Node.js kurulumu yapmadan anında açmak isteyenler için derlenmiş pakettir.
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-1.5 text-[11px] text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-blue-600 shrink-0" />
                        <span><strong>index.html</strong> ve optimize edilmiş güncel React arayüzü</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                        <span><strong>PayTR Sanal POS</strong> (api/index.php & paytr-callback.php dahil)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-blue-600 shrink-0" />
                        <span>Tüm orijinal ürün ve sticker görselleri</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-blue-600 shrink-0" />
                        <span><strong>.htaccess & data_storage/</strong> (Kayıtlı mağaza ayarları)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      onClick={() => handleDownloadZip('/download-cpanel-dist.zip', 'cpanel_public_html_dist.zip')}
                      disabled={Boolean(downloadingZip) || rebuildingCpanel}
                      className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                    >
                      {downloadingZip === 'cpanel_public_html_dist.zip' ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Paket Hazırlanıyor & İndiriliyor...</span>
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          <span>Statik Paketi İndir (.ZIP)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* CPANEL KURULUM ADIMLARI REHBERİ */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="p-2.5 rounded-xl bg-[#ff0055]/10 text-[#ff0055]">
                    <FileCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">
                      cPanel'e Yükleme Adımları (Resmi Kurulum Rehberi)
                    </h4>
                    <p className="text-xs text-slate-500">
                      cPanel hesabınızda 5 dakikada yayına almak için aşağıdaki adımları sırayla izleyin.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* YÖNTEM A */}
                  <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-200/60 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-900 font-black text-xs uppercase tracking-wide">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">1</span>
                      <span>Yöntem A: cPanel "Setup Node.js App" (Önerilen)</span>
                    </div>
                    <ol className="space-y-3 text-xs text-slate-700 leading-relaxed list-decimal list-inside pl-1 font-medium">
                      <li>
                        cPanel'inize giriş yapın ve <strong>"Setup Node.js App"</strong> (Yazılım bölümünde) simgesine tıklayın.
                      </li>
                      <li>
                        <strong>"Create Application"</strong> butonuna basın:
                        <ul className="list-disc list-inside pl-4 mt-1 text-slate-600 space-y-0.5">
                          <li><strong>Node.js Version:</strong> 20.x veya 22.x seçin</li>
                          <li><strong>Application mode:</strong> Production</li>
                          <li><strong>Application root:</strong> <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-bold">akuz</code> (veya dilediğiniz bir klasör)</li>
                          <li><strong>Application startup file:</strong> <code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900 font-bold">server.js</code></li>
                        </ul>
                      </li>
                      <li>
                        Yukarıdaki <strong>"Tam Paketi İndir (.ZIP)"</strong> butonuna basıp inen <code className="font-bold">cpanel_full_app.zip</code> dosyasını cPanel <strong>Dosya Yöneticisi (File Manager)</strong> ile <code className="font-bold">akuz</code> klasörüne yükleyin ve sağ tıklayıp <strong>"Extract" (Çıkar)</strong> deyin.
                      </li>
                      <li>
                        Tekrar <strong>"Setup Node.js App"</strong> sayfasına gelin, uygulamanızı düzenlemeye açıp <strong>"Run NPM Install"</strong> butonuna tıklayın.
                      </li>
                      <li>
                        Üstteki <strong>"Restart Application"</strong> butonuna tıklayın. Mağazanız ve tüm API'lar yayında!
                      </li>
                    </ol>
                  </div>

                  {/* YÖNTEM B */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wide">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                      <span>Yöntem B: Doğrudan public_html Klasörüne Atma</span>
                    </div>
                    <ol className="space-y-3 text-xs text-slate-700 leading-relaxed list-decimal list-inside pl-1 font-medium">
                      <li>
                        Yukarıdaki <strong>"Statik Paketi İndir (.ZIP)"</strong> butonuna basıp inen <code className="font-bold">cpanel_public_html_dist.zip</code> dosyasını bilgisayarınıza kaydedin.
                      </li>
                      <li>
                        cPanel'e girip <strong>Dosya Yöneticisi (File Manager)</strong> aracını açın ve <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-bold">public_html</code> klasörünün içine girin.
                      </li>
                      <li>
                        Üst menüden <strong>"Yükle" (Upload)</strong> butonuna basarak ZIP dosyasını yükleyin.
                      </li>
                      <li>
                        Yüklenen ZIP dosyasına sağ tıklayıp <strong>"Extract" (Çıkar)</strong> deyin. Dosyalar doğrudan <code className="font-bold">public_html</code> içine çıkacaktır.
                      </li>
                      <li>
                        ZIP içinde gelen <strong>.htaccess</strong> dosyasının da çıktığından emin olun (Göremiyorsanız Dosya Yöneticisi sağ üstteki Ayarlar'dan "Gizli Dosyaları Göster"i işaretleyin).
                      </li>
                      <li>
                        Tarayıcınızdan alan adınıza (örn. <code className="font-bold">akuzstickers.com</code>) girin. Siteniz anında açılacaktır!
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Önemli Güvenlik & SMTP Bilgisi */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200/80 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <div className="font-bold">cPanel E-Posta (SMTP) ve Kargonomi Ayarları Hatırlatması:</div>
                    <p className="text-amber-800 leading-relaxed">
                      Sitenizi cPanel'e yükledikten sonra Admin Panelinizdeki <strong>"E-posta & SMTP"</strong> sekmesinden cPanel e-posta hesabınızın şifresini kaydedebilirsiniz. Böylece şifre hatırlatma ve sipariş mailleri doğrudan sizin sunucunuzdan müşterilerinize gönderilir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ÜRÜN EKLEME / DÜZENLEME MODAL */}
      {/* ========================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 my-auto flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white shrink-0">
              <h3 className="text-base font-black text-slate-900 uppercase">
                {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: MAT BEYAZ KURT LOGO STICKER"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-bold uppercase focus:outline-none focus:border-[#ff0055]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Kategori *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Product['category'])}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-bold bg-white focus:outline-none focus:border-[#ff0055]"
                  >
                    <option value="ataturk">Atatürk</option>
                    <option value="araba">Araba</option>
                    <option value="motosiklet">Motosiklet</option>
                    <option value="offroad">4x4 Off-Road</option>
                    <option value="custom">Kişiye Özel</option>
                    <option value="discount">İndirimli</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Rozet / Etiket (Örn: ÇOK SATAN, YENİ ÜRÜN)
                  </label>
                  <input
                    type="text"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff0055]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Satış Fiyatı (TL) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formCurrentPrice}
                    onChange={(e) => setFormCurrentPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-black text-emerald-700 focus:outline-none focus:border-[#ff0055]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Eski / İndirimsiz Fiyat (TL)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formOldPrice}
                    onChange={(e) => setFormOldPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-bold text-slate-400 focus:outline-none focus:border-[#ff0055]"
                  />
                </div>
              </div>

              {/* KOLAY VE GÖRSEL ÖLÇÜ / BOYUT VE FİYAT YÖNETİMİ */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5 uppercase">
                    <Maximize2 size={14} className="text-[#ff0055]" />
                    <span>Ürün Boyutları ve Boyuta Özel Fiyatlar</span>
                  </label>
                  <span className="text-[11px] font-bold text-slate-400">
                    {formDimensionsList.length} ölçü seçili
                  </span>
                </div>

                {/* Seçili Ölçüler ve Fiyat Girişleri */}
                <div className="space-y-2">
                  {formDimensionsList.length === 0 ? (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-400 italic text-center">
                      Henüz ölçü eklenmedi. Aşağıdan ölçü ve fiyat girerek ekleyebilirsiniz.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {formDimensionsList.map((dim) => (
                        <div
                          key={dim}
                          className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200 shadow-2xs"
                        >
                          <span className="text-xs font-black text-slate-900 min-w-[70px]">{dim}</span>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400 font-bold">₺</span>
                            <input
                              type="number"
                              step="0.5"
                              value={formDimensionPrices[dim] ?? formCurrentPrice}
                              onChange={(e) => handleDimensionPriceChange(dim, e.target.value)}
                              placeholder="Fiyat"
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-black text-emerald-700 text-right focus:bg-white focus:outline-none focus:border-[#ff0055]"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveDimension(dim)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                              title="Bu ölçüyü kaldır"
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* En x Boy ve Fiyat ile Yeni Ölçü Ekleme Kutusu */}
                <div className="pt-2 border-t border-slate-200/80">
                  <p className="text-[11px] font-bold text-slate-600 mb-1.5">
                    Yeni Ölçü ve Özel Fiyat Ekle:
                  </p>
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 flex-1 min-w-[140px]">
                      <input
                        type="number"
                        placeholder="En (cm)"
                        value={newDimWidth}
                        onChange={(e) => setNewDimWidth(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDimensionFromInputs();
                          }
                        }}
                        className="w-full text-xs font-bold text-slate-800 focus:outline-none"
                      />
                      <span className="text-slate-400 text-xs font-black">×</span>
                      <input
                        type="number"
                        placeholder="Boy (cm)"
                        value={newDimHeight}
                        onChange={(e) => setNewDimHeight(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDimensionFromInputs();
                          }
                        }}
                        className="w-full text-xs font-bold text-slate-800 focus:outline-none"
                      />
                      <span className="text-[11px] font-bold text-slate-400">cm</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 w-28">
                      <span className="text-xs text-slate-400 font-bold">₺</span>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Fiyat"
                        value={newDimPrice}
                        onChange={(e) => setNewDimPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDimensionFromInputs();
                          }
                        }}
                        className="w-full text-xs font-black text-emerald-700 focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddDimensionFromInputs}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 transition-colors shadow-2xs shrink-0 cursor-pointer"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      <span>Boyutu Ekle</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ürün Ana Görseli (Fotoğraf Yükle veya URL Gir)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-[#ff6600] border border-orange-200 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs active:scale-[0.98]">
                    <Upload size={14} />
                    <span>Cihazdan Fotoğraf Seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleProductFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {formImageUrl && (
                    <div className="w-10 h-10 rounded-lg border border-slate-200 overflow-hidden shrink-0 shadow-2xs bg-slate-100">
                      <img src={formImageUrl} alt="Önizleme" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Veya URL girin: /products/IMG_1138.jpeg veya https://..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff0055]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ek Görseller (Virgülle ayırın)
                </label>
                <input
                  type="text"
                  placeholder="/products/IMG_1140.jpeg, /products/IMG_1141.jpeg"
                  value={formAdditionalImages}
                  onChange={(e) => setFormAdditionalImages(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff0055]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ürün Açıklaması
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ürün malzeme kalitesi, transfer bandı, kullanım yüzeyi..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#ff0055] resize-none"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsCustomText}
                      onChange={(e) => setFormIsCustomText(e.target.checked)}
                      className="rounded text-[#ff0055] focus:ring-[#ff0055]"
                    />
                    <span>Kişiye Özel Canlı Yazı Stickerı Mı?</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPopular}
                      onChange={(e) => setFormIsPopular(e.target.checked)}
                      className="rounded text-[#ff0055] focus:ring-[#ff0055]"
                    />
                    <span>Popüler Vitrinde Göster</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsDiscounted}
                      onChange={(e) => setFormIsDiscounted(e.target.checked)}
                      className="rounded text-[#ff0055] focus:ring-[#ff0055]"
                    />
                    <span>İndirimli Fırsat Ürünü</span>
                  </label>
                </div>

                {/* Kişiye Özel Yazı Ürünü İçin Harf Fiyatlandırması */}
                {formIsCustomText && (
                  <div className="p-4 bg-pink-50/70 border border-pink-200/80 rounded-xl space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <Type size={16} className="text-[#ff0055]" />
                      <h4 className="text-xs font-black uppercase text-slate-900">
                        Özel Yazı Harf Ücretlendirme Ayarları
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Müşteri belirlediğiniz adede kadar ücretsiz harf yazar, bu adetten sonraki her harf için otomatik ek ücret tahsil edilir.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Ücretsiz Harf Sayısı (Adet)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formFreeLetterCount}
                          onChange={(e) => setFormFreeLetterCount(e.target.value)}
                          placeholder="Örn: 10"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-pink-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#ff0055]"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Örn: 10 yazarsanız ilk 10 harf fiyata dahildir.
                        </span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Ücretsiz Harften Sonraki Harf Başı Ek Ücret (TL)
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={formExtraLetterPrice}
                          onChange={(e) => setFormExtraLetterPrice(e.target.value)}
                          placeholder="Örn: 5"
                          className="w-full px-3 py-2 bg-white rounded-lg border border-pink-200 text-xs sm:text-sm font-bold text-emerald-700 focus:outline-none focus:border-[#ff0055]"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Örn: 5 yazarsanız 11. harften itibaren her harf için +5 TL eklenir.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3.5 pb-1 border-t border-slate-100 bg-white sticky bottom-0 -mx-1 px-1">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#ff0055] hover:bg-rose-600 text-white text-xs font-black cursor-pointer shadow-md transition-all"
                >
                  {editingProduct ? 'Güncellemeleri Kaydet' : 'Ürünü Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
