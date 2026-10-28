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
  Save,
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
  Camera,
  Loader2,
  ShoppingCart,
  Heart,
  MapPin,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  Activity,
  Zap,
  Car,
  Bike,
  Compass,
  MessageSquare,
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
import { processAndUploadProductImage } from '../utils/imageOptimizer';
import { RegisteredAccount, purgeAllRegisteredUsers } from '../utils/auth';
import { AdminPerformanceWidget } from './AdminPerformanceWidget';
import { AdminReviewManagement } from './AdminReviewManagement';
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
import { ThreeDDiscountCoin } from './ThreeDDiscountCoin';
import { CatalogIcon, DiscountIcon, CustomPersonalizedIcon, MirrorIcon } from './CategoryBar';

// Resmi 4 Renkli Google 'G' İkonu
const GoogleGIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

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
  onUpdateUsers?: (users: RegisteredAccount[]) => void;
  onNavigateHome: () => void;
  onNavigateToCatalog: () => void;
}

type TabType =
  | 'products'
  | 'categories'
  | 'colors-foils'
  | 'orders'
  | 'reviews'
  | 'security'
  | 'users'
  | 'why-akuz'
  | 'about'
  | 'contact'
  | 'paytr'
  | 'kargonomi'
  | 'email-smtp'
  | 'cpanel-deploy'
  | 'performance';

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
  onUpdateUsers,
  onNavigateHome,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isPurgingUsers, setIsPurgingUsers] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPerfWidgetOpen, setIsPerfWidgetOpen] = useState(false);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  // Güvenlik & Anti-Dolandırıcılık State'leri
  const [securityStats, setSecurityStats] = useState<any>(null);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false);
  const [manualIpToBlock, setManualIpToBlock] = useState('');
  const [isSimulatingAttack, setIsSimulatingAttack] = useState(false);
  const [securityFilterSeverity, setSecurityFilterSeverity] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  const fetchSecurityData = async (silent = false) => {
    if (!silent) setIsLoadingSecurity(true);
    try {
      const [statsRes, eventsRes] = await Promise.all([
        fetch('/api/admin/security/stats', { headers: { 'x-admin-token': 'akuz_admin_2026' } }),
        fetch('/api/admin/security/events?limit=150', { headers: { 'x-admin-token': 'akuz_admin_2026' } }),
      ]);
      if (statsRes.ok) {
        const sData = await statsRes.json();
        if (sData.success) setSecurityStats(sData.stats);
      }
      if (eventsRes.ok) {
        const eData = await eventsRes.json();
        if (eData.success) setSecurityEvents(eData.events || []);
      }
    } catch (err) {
      console.warn('[SECURITY FETCH ERROR]', err);
    } finally {
      setIsLoadingSecurity(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSecurityData();
      const timer = setInterval(() => fetchSecurityData(true), 15000);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  const handleBlockManualIp = async () => {
    if (!manualIpToBlock.trim()) return;
    try {
      const res = await fetch('/api/admin/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': 'akuz_admin_2026' },
        body: JSON.stringify({ ip: manualIpToBlock.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setManualIpToBlock('');
        showNotification(`${manualIpToBlock.trim()} adresi kara listeye alındı.`);
        fetchSecurityData(true);
      } else {
        showNotification(data.error || 'IP engellenemedi.');
      }
    } catch {
      showNotification('Bağlantı hatası.');
    }
  };

  const handleUnblockManualIp = async (ip: string) => {
    try {
      const res = await fetch('/api/admin/security/unblock-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': 'akuz_admin_2026' },
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`${ip} adresinin engeli kaldırıldı.`);
        fetchSecurityData(true);
      }
    } catch {
      showNotification('Bağlantı hatası.');
    }
  };

  const handleClearSecurityLogs = async () => {
    try {
      const res = await fetch('/api/admin/security/clear-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': 'akuz_admin_2026' },
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Güvenlik günlükleri sıfırlandı.');
        fetchSecurityData(true);
      }
    } catch {
      showNotification('Bağlantı hatası.');
    }
  };

  const handleSimulateAttack = async (type: 'price_tampering' | 'carding' | 'traversal') => {
    setIsSimulatingAttack(true);
    try {
      const res = await fetch('/api/admin/security/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': 'akuz_admin_2026' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message);
        fetchSecurityData(true);
      }
    } catch {
      showNotification('Simülasyon çalıştırılamadı.');
    } finally {
      setIsSimulatingAttack(false);
    }
  };

  // Kullanıcı Yönetimi State'leri
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterType, setUserFilterType] = useState<'all' | 'google' | 'normal' | 'with-cart'>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<RegisteredAccount | null>(null);
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);

  // Canlı Kullanıcı Verisini Sunucudan Yenileme
  const handleRefreshUsers = async (silent = false) => {
    setIsRefreshingUsers(true);
    try {
      const res = await fetch('/api/users', {
        headers: { 'x-admin-token': 'akuz_admin_2026' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          if (onUpdateUsers) {
            onUpdateUsers(data.users);
          }
          if (!silent) {
            showNotification(`Kullanıcı listesi güncellendi (${data.users.length} kullanıcı).`);
          }
        }
      }
    } catch {
      if (!silent) {
        showNotification('Kullanıcı listesi güncellenirken hata oluştu.');
      }
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  // Kullanıcılar sekmesi açıldığında otomatik yenile
  useEffect(() => {
    if (activeTab === 'users') {
      handleRefreshUsers(true);
    }
  }, [activeTab]);

  // Özel Onay Modalı (window.confirm iframe içinde engellendiği için özel modal)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    targetName?: string;
    imageUrl?: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const handlePurgeAllUsersClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Tüm Kullanıcıları Temizle',
      description: 'Kayıtlı TÜM kullanıcıları, teslimat adreslerini ve hesap bilgilerini kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      confirmText: 'Evet, Tümünü Temizle',
      isDestructive: true,
      onConfirm: async () => {
        setIsConfirmLoading(true);
        setIsPurgingUsers(true);
        try {
          await purgeAllRegisteredUsers('akuz_admin_2026');
          if (onUpdateUsers) {
            onUpdateUsers([]);
          }
          showNotification('Tüm kullanıcı kayıtları başarıyla silindi ve sıfırlandı.');
        } catch {
          showNotification('Kullanıcı kayıtları silinirken bir hata oluştu.');
        } finally {
          setIsPurgingUsers(false);
          setIsConfirmLoading(false);
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleDeleteUserClick = (emailToDelete: string, targetName?: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kullanıcıyı Kalıcı Olarak Sil',
      description: `"${targetName || emailToDelete}" kullanıcısının hesabı, adres bilgileri, sepeti ve tüm kayıt verileri sistemden kalıcı olarak silinecektir. Bu işlem geri alınamaz.`,
      targetName: emailToDelete,
      confirmText: 'Evet, Kullanıcıyı Sil',
      isDestructive: true,
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          await fetch(`/api/users?email=${encodeURIComponent(emailToDelete)}`, {
            method: 'DELETE',
            headers: { 'x-admin-token': 'akuz_admin_2026' },
          });
          const filtered = users.filter((u) => (u.email || '').toLowerCase() !== emailToDelete.toLowerCase() && (u.id || '') !== emailToDelete);
          if (onUpdateUsers) {
            onUpdateUsers(filtered);
          }
          if (selectedUserDetail && ((selectedUserDetail.email || '').toLowerCase() === emailToDelete.toLowerCase() || selectedUserDetail.id === emailToDelete)) {
            setSelectedUserDetail(null);
          }
          showNotification(`${emailToDelete} kullanıcısı ve tüm verileri silindi.`);
        } catch {
          showNotification('Kullanıcı silinemedi.');
        } finally {
          setIsConfirmLoading(false);
          setConfirmDialog(null);
        }
      },
    });
  };

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

  const handleRebuildCpanel = async (andDownload?: { url: string; filename: string }) => {
    try {
      setRebuildingCpanel(true);
      const res = await fetch('/api/rebuild-cpanel-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products,
          settings: siteSettings,
          globalColors,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Site dosyaları güncellendi ve en son haliyle ZIP paketlerine aktarıldı!');
        await fetchCpanelStatus();
        if (andDownload) {
          await handleDownloadZip(andDownload.url, andDownload.filename);
        }
      } else {
        throw new Error(data.error || 'Paketleme başarısız oldu');
      }
    } catch (err: any) {
      alert('Site dosyalarını güncelleme hatası: ' + (err.message || 'Bilinmeyen hata'));
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
      // Cache-buster: tarayıcının eski ZIP dosyasını disk önbelleğinden getirmesini kesin olarak engeller
      const cacheBustUrl = `${url}?t=${Date.now()}`;
      const res = await fetch(cacheBustUrl, { cache: 'no-store' });
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
      showNotification(`${filename} güncel haliyle başarıyla indirildi!`);
    } catch (err: any) {
      console.error('İndirme hatası:', err);
      // Fallback
      window.location.href = `${url}?t=${Date.now()}`;
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

  const handleDeleteProduct = (id: string, name: string, imageUrl?: string) => {
    const prod = products.find((p) => p.id === id);
    const img = imageUrl || prod?.imageUrl || (prod?.images && prod.images[0]);
    setConfirmDialog({
      isOpen: true,
      title: 'Ürünü Sil',
      description: 'Bu işlem geri alınamaz ve ürün mağaza kataloğundan kalıcı olarak kaldırılacaktır.',
      targetName: name,
      imageUrl: img,
      confirmText: 'Evet, Ürünü Sil',
      isDestructive: true,
      onConfirm: async () => {
        setIsConfirmLoading(true);
        try {
          const updated = products.filter((p) => p.id !== id && p.slug !== id);
          onUpdateProducts(updated);

          // Sunucuya doğrudan DELETE isteği
          fetch(`/api/products/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          }).catch((e) => console.warn('[DELETE API ERROR]', e));

          showNotification(`"${name}" ürünü başarıyla silindi.`);
          if (editingProduct && (editingProduct.id === id || editingProduct.slug === id)) {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }
        } finally {
          setIsConfirmLoading(false);
          setConfirmDialog(null);
        }
      },
    });
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

  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [quickUploadingProdId, setQuickUploadingProdId] = useState<string | null>(null);

  const handleCategoryFileUpload = async (
    catId: CategoryCircleItem['id'],
    file: File,
    field: 'imageUrl' | 'cardImageUrl' = 'imageUrl'
  ) => {
    if (!file) return;
    try {
      showNotification('Kategori fotoğrafı optimize ediliyor...');
      const url = await processAndUploadProductImage(file);
      const updated = safeCategories.map((cat) => {
        if (cat.id === catId) {
          const next = { ...cat, [field]: url };
          // Sadece diğer alan tamamen boşsa kolaylık sağlamak için doldur, mevcut olanı ASLA ezme
          if (field === 'cardImageUrl' && (!next.imageUrl || next.imageUrl.trim() === '')) {
            next.imageUrl = url;
          } else if (field === 'imageUrl' && (!next.cardImageUrl || next.cardImageUrl.trim() === '')) {
            next.cardImageUrl = url;
          }
          return next;
        }
        return cat;
      });
      onUpdateSiteSettings({ ...siteSettings, categories: updated });
      showNotification('Kategori görseli başarıyla yüklendi.');
    } catch (err: any) {
      console.error('[CATEGORY UPLOAD ERROR]', err);
      showNotification('Fotoğraf yüklenemedi: ' + (err.message || 'Geçersiz dosya'));
    }
  };

  const handleProductFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsUploadingProductImage(true);
      setUploadProgressText('Görsel optimize ediliyor...');
      const url = await processAndUploadProductImage(file, (msg) => {
        setUploadProgressText(msg);
      });
      setFormImageUrl(url);
      showNotification('Ürün ana görseli başarıyla seçildi ve hazırlandı!');
    } catch (err: any) {
      console.error('[PRODUCT UPLOAD ERROR]', err);
      showNotification('Fotoğraf yüklenirken hata oluştu: ' + (err.message || 'Lütfen geçerli bir resim seçin.'));
    } finally {
      setIsUploadingProductImage(false);
      setUploadProgressText('');
    }
  };

  const handleAdditionalFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setIsUploadingProductImage(true);
      setUploadProgressText('Ek görsel optimize ediliyor...');
      const url = await processAndUploadProductImage(file, (msg) => {
        setUploadProgressText(msg);
      });
      setFormAdditionalImages((prev) => {
        const list = prev ? prev.split(',').map((s) => s.trim()).filter(Boolean) : [];
        if (!list.includes(url)) list.push(url);
        return list.join(', ');
      });
      showNotification('Ek görsel başarıyla eklendi!');
    } catch (err: any) {
      console.error('[ADDITIONAL UPLOAD ERROR]', err);
      showNotification('Ek görsel yüklenirken hata: ' + (err.message || 'Geçersiz resim'));
    } finally {
      setIsUploadingProductImage(false);
      setUploadProgressText('');
    }
  };

  const handleQuickProductPhotoUpload = async (product: Product, file: File) => {
    if (!file) return;
    try {
      setQuickUploadingProdId(product.id);
      showNotification(`"${product.name}" için fotoğraf optimize ediliyor ve yükleniyor...`);
      const url = await processAndUploadProductImage(file);

      // Ürünü doğrudan güncelle
      const updated = products.map((p) => {
        if (p.id === product.id) {
          const newImages = p.images ? [...p.images] : [];
          if (!newImages.includes(url)) {
            newImages.unshift(url);
          }
          return {
            ...p,
            imageUrl: url,
            images: newImages,
          };
        }
        return p;
      });
      onUpdateProducts(updated);
      showNotification(`"${product.name}" ürününün fotoğrafı başarıyla güncellendi!`);
    } catch (err: any) {
      console.error('[QUICK UPLOAD ERROR]', err);
      showNotification('Fotoğraf güncellenirken hata oluştu: ' + (err.message || 'Geçersiz dosya.'));
    } finally {
      setQuickUploadingProdId(null);
    }
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
    setConfirmDialog({
      isOpen: true,
      title: 'Rengi Sil',
      description: 'Bu renk seçeneği tüm ürünlerden ve renk paletinden kaldırılacaktır.',
      targetName: `${name} Rengi`,
      confirmText: 'Evet, Rengi Sil',
      isDestructive: true,
      onConfirm: () => {
        onUpdateGlobalColors(globalColors.filter((c) => c.name !== name));
        showNotification(`"${name}" rengi silindi.`);
        setConfirmDialog(null);
      },
    });
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
          if (targetOrder.trackingNumber && targetOrder.trackingNumber.trim()) {
            await sendOrderShippedEmail(emailPayload);
            showNotification(`Müşteriye "${targetOrder.customerEmail}" "Siparişiniz Kargoya Verildi" e-postası iletildi.`);
          } else {
            showNotification(`Sipariş durumu "Kargoya Verildi" olarak kaydedildi. Müşteriye takip kodlu bildirim göndermek için kargo takip numarasını girip "Kaydet & Müşteriye Bildir" butonuna basabilirsiniz.`);
          }
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
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [googleJsonInput, setGoogleJsonInput] = useState('');
  const [googleJsonInfo, setGoogleJsonInfo] = useState<{
    clientId?: string;
    projectId?: string;
    redirectUris?: string[];
    javascriptOrigins?: string[];
    savedAt?: string;
  } | null>(null);
  const [isProcessingGoogleJson, setIsProcessingGoogleJson] = useState(false);
  const [googleJsonStatus, setGoogleJsonStatus] = useState<{ success: boolean; msg: string } | null>(null);
  const googleJsonFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/google-oauth-json')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.hasConfig && d.config) {
          setGoogleJsonInfo(d.config);
          if (d.config.clientId && !googleClientId) {
            setGoogleClientId(d.config.clientId);
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleParseAndApplyGoogleJson = async (content: string) => {
    setIsProcessingGoogleJson(true);
    setGoogleJsonStatus(null);
    try {
      const parsed = JSON.parse(content);
      const web = parsed.web || parsed.installed || parsed;
      const cid = (web.client_id || parsed.client_id || '').trim();
      const pid = (web.project_id || parsed.project_id || '').trim();
      const rUris = web.redirect_uris || parsed.redirect_uris || [];
      const origins = web.javascript_origins || parsed.javascript_origins || [];

      if (!cid) {
        throw new Error('JSON dosyasında "client_id" (İstemci Kimliği) bulunamadı. Lütfen Google Cloud Console > APIs & Services > Credentials üzerinden indirilen OAuth 2.0 İstemci JSON dosyasını kullanın.');
      }

      setGoogleClientId(cid);
      setGoogleJsonInfo({
        clientId: cid,
        projectId: pid,
        redirectUris: rUris,
        javascriptOrigins: origins,
      });

      // Tarayıcı ve yerel ayarlara uygula
      onUpdateSiteSettings({
        ...siteSettings,
        googleClientId: cid,
      });

      // Host sunucusuna kaydet
      const res = await fetch('/api/admin/google-oauth-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonContent: parsed }),
      });
      const data = await res.json();

      setIsProcessingGoogleJson(false);
      if (data.success) {
        setGoogleJsonStatus({
          success: true,
          msg: `Google Cloud Console JSON başarıyla entegre edildi! İstemci Kimliği (Client ID): ${cid}`,
        });
        showNotification('Google Cloud Console JSON dosyası başarıyla entegre edildi ve kaydedildi!');
      } else {
        setGoogleJsonStatus({
          success: false,
          msg: data.error || 'Sunucuya kaydedilemedi fakat tarayıcı ayarlarınıza başarıyla uygulandı.',
        });
      }
    } catch (err: any) {
      setIsProcessingGoogleJson(false);
      setGoogleJsonStatus({
        success: false,
        msg: 'JSON Okuma Hatası: ' + (err?.message || 'Geçersiz JSON'),
      });
    }
  };

  const handleGoogleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setGoogleJsonInput(text);
        handleParseAndApplyGoogleJson(text);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveGoogleOAuth = () => {
    onUpdateSiteSettings({
      ...siteSettings,
      googleClientId: googleClientId.trim(),
    });
    showNotification('Google OAuth 2.0 ayarları başarıyla kaydedildi.');
  };

  const [testEmailTo, setTestEmailTo] = useState<string>(() => {
    try {
      return localStorage.getItem('akuz_admin_test_email') || 'mertopro123@gmail.com';
    } catch {
      return 'mertopro123@gmail.com';
    }
  });

  const handleTestEmailChange = (val: string) => {
    setTestEmailTo(val);
    try {
      localStorage.setItem('akuz_admin_test_email', val);
    } catch {}
  };
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
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [sendingTrackingOrderId, setSendingTrackingOrderId] = useState<string | null>(null);

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

  const handleUpdateShippingFeeAndThreshold = (
    newFee: number,
    newThreshold: number,
    notify = false
  ) => {
    const validFee = Math.max(0, isNaN(Number(newFee)) ? 0 : Number(newFee));
    const validThreshold = Math.max(0, isNaN(Number(newThreshold)) ? 0 : Number(newThreshold));
    setShippingFee(validFee);
    setFreeShippingThreshold(validThreshold);
    onUpdateSiteSettings({
      ...siteSettings,
      shippingFee: validFee,
      freeShippingThreshold: validThreshold,
    });
    if (notify) {
      showNotification(
        `Müşteri kargo ayarları anında kaydedildi! (Standart Kargo: ${validFee === 0 ? 'Ücretsiz' : `₺${validFee.toFixed(2).replace('.', ',')}`}, Ücretsiz Kargo Sepet Barajı: ₺${validThreshold >= 999999 ? 'Limitsiz (Hep Ücretli)' : validThreshold.toFixed(2).replace('.', ',')})`
      );
    }
  };

  const handleSaveShippingFee = () => {
    handleUpdateShippingFeeAndThreshold(shippingFee, freeShippingThreshold, true);
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

    // Alıcı il ve ilçesini sipariş teslimat adresinden akıllıca ayrıştır
    let recipientCity = 'Bursa';
    let recipientDistrict = 'Nilüfer';
    if (order.shippingAddress) {
      const slashMatch = order.shippingAddress.match(/,\s*([^,\/]+)\s*\/\s*([^,\/]+)\s*$/);
      if (slashMatch) {
        recipientDistrict = slashMatch[1].trim();
        recipientCity = slashMatch[2].trim();
      } else {
        const parts = order.shippingAddress.split(',').map((p) => p.trim());
        const lastPart = parts[parts.length - 1] || '';
        if (lastPart.includes('/')) {
          const [d, c] = lastPart.split('/');
          if (d.trim()) recipientDistrict = d.trim();
          if (c.trim()) recipientCity = c.trim();
        }
      }
    }

    const result = await createKargonomiShipment({
      orderId: order.id,
      recipientName: order.customerName || 'Müşteri',
      recipientPhone: order.customerPhone || '05468758671',
      recipientAddress: order.shippingAddress || 'Adres belirtilmemiş',
      recipientCity,
      recipientDistrict,
      itemsDescription:
        order.items && order.items.length > 0
          ? order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')
          : 'AKUZ Sticker Paketi',
      carrier: kargonomiCarrier,
    });
    setCreatingShipmentOrderId(null);

    if (result.success) {
      const returnedTracking = result.trackingNumber || '';
      const updatedOrders = orders.map((o) => {
        if (o.id === order.id) {
          return {
            ...o,
            kargonomiShipmentId: result.shipmentId || o.kargonomiShipmentId,
            carrierName: result.carrier || o.carrierName || 'Kargonomi / MNG Kargo',
            ...(returnedTracking && !o.trackingNumber ? { trackingNumber: returnedTracking } : {}),
          };
        }
        return o;
      });
      onUpdateOrders(updatedOrders);

      // Takip inputunu otomatik doldur
      if (returnedTracking) {
        setTrackingInputs((prev) => ({ ...prev, [order.id]: returnedTracking }));
      }

      showNotification(
        `Sipariş #${order.id} Kargonomi'ye başarıyla iletildi (Kargonomi Gönderi No: #${result.shipmentId || ''})! Alıcıya e-posta gönderilmedi. Kargo takip kodunu girip kaydettiğinizde müşteriye bildirim iletilecektir.`
      );

      // Merkezi Host sunucusuna kargo kaydını kaydet
      fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kargonomiShipmentId: result.shipmentId,
          carrierName: result.carrier || order.carrierName || 'Kargonomi / MNG Kargo',
          ...(returnedTracking && !order.trackingNumber ? { trackingNumber: returnedTracking } : {}),
        }),
      }).catch((e) => console.warn('[HOST ORDER UPDATE ERROR]', e));
      // NOT: Müşteriye kesinlikle e-posta gönderilmez! Admin takip numarasını girip kaydettiğinde bildirim gidecektir.
    } else {
      showNotification(`Kargonomi'ye gönderilemedi: ${result.message}`);
    }
  };

  const handleSaveTrackingAndNotifyCustomer = async (order: Order, customTracking?: string) => {
    const rawVal = customTracking !== undefined ? customTracking : (trackingInputs[order.id] ?? order.trackingNumber ?? '');
    const cleanTracking = String(rawVal).trim();

    if (!cleanTracking) {
      showNotification('Lütfen geçerli bir kargo takip numarası girin.');
      return;
    }

    setSendingTrackingOrderId(order.id);

    const updatedOrders = orders.map((o) => {
      if (o.id === order.id) {
        return {
          ...o,
          status: 'Kargoya Verildi' as const,
          trackingNumber: cleanTracking,
          carrierName: o.carrierName || kargonomiCarrier || 'Kargonomi / MNG Kargo',
        };
      }
      return o;
    });
    onUpdateOrders(updatedOrders);

    // Merkezi sunucuya kaydet
    await fetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Kargoya Verildi',
        trackingNumber: cleanTracking,
        carrierName: order.carrierName || kargonomiCarrier || 'Kargonomi / MNG Kargo',
      }),
    }).catch((e) => console.warn('[HOST ORDER UPDATE ERROR]', e));

    // Müşteriye takip kodlu kargo e-postası gönder
    if (order.customerEmail && order.customerEmail.includes('@')) {
      try {
        await sendOrderShippedEmail({
          orderId: order.id,
          customerName: order.customerName || 'Değerli Müşterimiz',
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          shippingAddress: order.shippingAddress,
          trackingNumber: cleanTracking,
          carrierName: order.carrierName || kargonomiCarrier || 'Kargonomi / MNG Kargo',
          items: order.items,
          totalPrice: order.total,
        });
        showNotification(`Takip kodu (${cleanTracking}) kaydedildi ve "${order.customerEmail}" adresine kargo bildirim e-postası başarıyla iletildi!`);
      } catch (err: any) {
        console.error('[TRACKING EMAIL ERROR]', err);
        showNotification(`Takip kodu kaydedildi, ancak e-posta gönderilirken hata oluştu: ${err?.message || 'SMTP hatası'}`);
      }
    } else {
      showNotification(`Takip kodu (${cleanTracking}) kaydedildi ve sipariş durumu "Kargoya Verildi" yapıldı.`);
    }

    setSendingTrackingOrderId(null);
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

            {/* 1. Önizleme Değişikliklerini Kalıcı Kaydet & cPanel Paketle Butonu */}
            <button
              type="button"
              onClick={() => handleRebuildCpanel()}
              disabled={rebuildingCpanel}
              title="Önizlemedeki tüm düzenlemeleri kaynak kodlara kaydeder ve cPanel ZIP paketlerini en son haliyle günceller"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm hover:shadow text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-60"
            >
              {rebuildingCpanel ? (
                <>
                  <RefreshCw size={13} className="animate-spin text-white" />
                  <span className="hidden sm:inline">Paketleniyor...</span>
                  <span className="sm:hidden">Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <Save size={13} className="text-emerald-100" />
                  <span className="hidden md:inline">Önizlemeyi Kaydet & cPanel Paketle</span>
                  <span className="md:hidden">cPanel'e Kaydet</span>
                </>
              )}
            </button>

            {/* Canlı Sistem & Performans Sağlığı Widget Butonu */}
            <button
              type="button"
              onClick={() => setIsPerfWidgetOpen(!isPerfWidgetOpen)}
              title="Canlı Sistem, API Gecikmesi ve Yüklenme Süreleri Monitörü"
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                isPerfWidgetOpen
                  ? 'bg-slate-900 text-emerald-400 border-slate-900 shadow-sm'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
            >
              <Activity size={13} className="text-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Performans & Sağlık</span>
              <span className="sm:hidden">Sağlık</span>
            </button>

            {/* 2. cPanel İndirme Sekmesine Git */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('cpanel-deploy');
                setIsMobileMenuOpen(false);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Archive size={14} className="text-emerald-600" />
              <span className="hidden lg:inline">cPanel Paketleri (.ZIP)</span>
              <span className="lg:hidden">cPanel İndir</span>
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
              {activeTab === 'reviews' && 'Yorum Yönetimi'}
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
              {activeTab === 'performance' && 'Canlı Sistem & Performans Sağlığı'}
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
                setActiveTab('reviews');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-[#ff0055] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare size={16} />
                <span>Yorum Yönetimi</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-pink-50 text-[#ff0055] border border-pink-200'
              }`}>
                Yorumlar
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('security');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className={activeTab === 'security' ? 'text-white' : 'text-emerald-600'} />
                <span>Güvenlik & Kalkan</span>
              </div>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                  activeTab === 'security' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  Aktif
                </span>
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

            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              {/* CANLI SİSTEM & PERFORMANS SAĞLIĞI SEKMESİ */}
              <button
                onClick={() => {
                  setActiveTab('performance');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                  activeTab === 'performance'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity size={15} className={activeTab === 'performance' ? 'text-emerald-400 animate-pulse' : 'text-emerald-600'} />
                  <span>Sistem & API Sağlığı</span>
                </div>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  activeTab === 'performance' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Canlı
                </span>
              </button>

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
            {/* ÜSTTEN AÇILABİLİR CANLI PERFORMANS & SAĞLIK WIDGET'I (HER SEKMEYLE BİRLİKTE GÖRÜNTÜLENEBİLİR) */}
            {isPerfWidgetOpen && activeTab !== 'performance' && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-200">
                <AdminPerformanceWidget onClose={() => setIsPerfWidgetOpen(false)} />
              </div>
            )}

            {/* DEDICATED SİSTEM & PERFORMANS SAĞLIĞI SEKMESİ */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <AdminPerformanceWidget />
              </div>
            )}

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
                            <div className="relative group/thumb w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {quickUploadingProdId === p.id ? (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10">
                                  <Loader2 size={16} className="animate-spin text-orange-400" />
                                </div>
                              ) : null}
                              {p.isCustomText ? (
                                <span className="text-[9px] font-black text-slate-800 text-center uppercase px-1">
                                  YAZINIZI YAZIN
                                </span>
                              ) : p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon size={20} className="text-slate-400" />
                              )}

                              {/* Hızlı Fotoğraf Değiştirme Butonu (Doğrudan tablodan) */}
                              {!p.isCustomText && (
                                <label
                                  className="absolute inset-0 bg-black/55 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity z-10"
                                  title="Bu ürünün fotoğrafını doğrudan cihazdan güncelle"
                                >
                                  <Camera size={14} className="text-white drop-shadow" />
                                  <span className="text-[8px] font-bold mt-0.5">Değiştir</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={quickUploadingProdId === p.id}
                                    onChange={(e) => {
                                      if (e.target.files?.[0]) {
                                        handleQuickProductPhotoUpload(p, e.target.files[0]);
                                      }
                                    }}
                                  />
                                </label>
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
                                type="button"
                                onClick={() => openEditProductModal(p)}
                                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="Düzenle"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id, p.name, p.imageUrl)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {safeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col gap-4 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    {/* Üst Önizleme: Hem Yuvarlak İkon Hem Dikdörtgen Katalog Kartı */}
                    <div className="grid grid-cols-2 gap-3 p-2.5 bg-white rounded-xl border border-slate-200/80">
                      {/* 1. Yuvarlak Önizleme - Ana Sayfadaki Yuvarlak ile Birebir Aynı Canlı Görsel */}
                      <div className="flex flex-col items-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                          Yuvarlak İkon
                        </span>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden shadow-sm ${
                          cat.id === 'all'
                            ? 'bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-800 text-white border border-slate-700/50'
                            : cat.id === 'discount'
                            ? 'bg-gradient-to-tr from-rose-600 via-red-500 to-orange-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.35)]'
                            : cat.id === 'custom'
                            ? 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.35)]'
                            : cat.id === 'ataturk'
                            ? 'bg-slate-950 ring-2 ring-amber-400/80 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                            : cat.bgGradient || 'bg-slate-900 text-white'
                        }`}>
                          {cat.imageUrl && !cat.imageUrl.startsWith('/products/') ? (
                            <img
                              src={cat.imageUrl}
                              alt={cat.titleLine1}
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : cat.id === 'all' ? (
                            <CatalogIcon size={26} />
                          ) : cat.id === 'discount' ? (
                            <DiscountIcon size={34} />
                          ) : cat.id === 'custom' ? (
                            <CustomPersonalizedIcon size={22} />
                          ) : cat.id === 'ataturk' ? (
                            <img
                              src={cat.imageUrl || '/uploads/prod_1792267264910_d3639f.jpg'}
                              alt="Atatürk Stickerları"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/products/IMG_1140.jpeg';
                              }}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : cat.id === 'araba' ? (
                            cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.titleLine1} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <Car size={26} strokeWidth={2.2} className="text-white" />
                            )
                          ) : cat.id === 'motosiklet' ? (
                            cat.imageUrl && !cat.imageUrl.includes('IMG_1143') ? (
                              <img src={cat.imageUrl} alt={cat.titleLine1} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <Bike size={26} strokeWidth={2.2} className="text-orange-400" />
                            )
                          ) : cat.id === 'offroad' ? (
                            cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.titleLine1} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <Compass size={24} strokeWidth={2.2} className="text-white" />
                            )
                          ) : cat.id === 'ayna' ? (
                            cat.imageUrl ? (
                              <img src={cat.imageUrl} alt={cat.titleLine1} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <MirrorIcon size={24} />
                            )
                          ) : (
                            <span className="text-sm font-black uppercase text-white">{cat.titleLine1.charAt(0)}</span>
                          )}
                        </div>
                      </div>

                      {/* 2. Dikdörtgen Katalog Kartı Önizleme */}
                      <div className="flex flex-col items-center text-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#ff6600] mb-1">
                          Katalog Kartı Görseli
                        </span>
                        <div className="w-20 aspect-[3/4] rounded-xl overflow-hidden bg-slate-900 shadow-sm relative border border-slate-200">
                          <img
                            src={
                              cat.id === 'ataturk'
                                ? (cat.cardImageUrl || cat.imageUrl || '/uploads/prod_1792267252889_745185.jpg')
                                : cat.id === 'motosiklet'
                                ? ((!cat.cardImageUrl || cat.cardImageUrl.includes('IMG_1143')) ? '/products/IMG_1141.jpeg' : cat.cardImageUrl)
                                : (cat.cardImageUrl || cat.imageUrl || '/products/IMG_1141.jpeg')
                            }
                            alt={cat.titleLine1}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                cat.id === 'ataturk' ? '/products/IMG_1140.jpeg' : '/products/IMG_1141.jpeg';
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-1">
                            <span className="text-[8px] font-black text-white truncate leading-tight">
                              {cat.titleLine1}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Başlık ve Alt Başlık Girişleri */}
                    <div className="space-y-2">
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

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Katalog Kartı Açıklaması / Alt Başlık
                        </label>
                        <input
                          type="text"
                          value={cat.subtitle || ''}
                          placeholder="Örn: Cam, Kaporta & Tampon Vinilleri"
                          onChange={(e) => handleUpdateCategory(cat.id, 'subtitle', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#ff0055]"
                        />
                      </div>
                    </div>

                    {/* KATALOG DİKDÖRTGEN KART GÖRSELİ */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <label className="text-[11px] font-black text-slate-900 block mb-1.5 flex items-center justify-between">
                        <span>🖼️ Katalog Dikdörtgen Kart Görseli</span>
                        <span className="text-[10px] text-[#ff6600] font-bold">Katalog Vitrini</span>
                      </label>
                      <div className="flex items-center gap-2 mb-2">
                        <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs active:scale-[0.98]">
                          <Upload size={14} />
                          <span>Kart Fotoğrafı Yükle</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleCategoryFileUpload(cat.id, e.target.files[0], 'cardImageUrl');
                              }
                            }}
                          />
                        </label>

                        {cat.cardImageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateCategory(cat.id, 'cardImageUrl', '');
                              showNotification('Dikdörtgen kart fotoğrafı kaldırıldı.');
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
                        value={cat.cardImageUrl || ''}
                        placeholder="Veya URL girin (/products/... veya https://)"
                        onChange={(e) => handleUpdateCategory(cat.id, 'cardImageUrl', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:border-[#ff0055]"
                      />

                      {/* Hızlı Mevcut Ürün Seçici */}
                      {products.length > 0 && (
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleUpdateCategory(cat.id, 'cardImageUrl', e.target.value);
                              showNotification(`"${cat.titleLine1}" için kart görseli seçildi!`);
                            }
                          }}
                          className="w-full mt-1.5 px-2 py-1 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option value="">⚡ Mevcut ürün fotoğraflarından kart görseli seç...</option>
                          {products.filter((p) => p.imageUrl).map((p) => (
                            <option key={p.id} value={p.imageUrl}>
                              {p.name} ({p.category})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* YUVARLAK İKON FOTOĞRAFI */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        🔘 Yuvarlak İkon Fotoğrafı (Opsiyonel)
                      </label>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition-colors">
                          <Upload size={12} />
                          <span>İkon Fotoğrafı Yükle</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleCategoryFileUpload(cat.id, e.target.files[0], 'imageUrl');
                              }
                            }}
                          />
                        </label>
                        {cat.imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateCategory(cat.id, 'imageUrl', '');
                              showNotification('İkon fotoğrafı kaldırıldı.');
                            }}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg text-[11px] font-bold"
                          >
                            Kaldır
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={cat.imageUrl || ''}
                        placeholder="İkon URL (/products/...)"
                        onChange={(e) => handleUpdateCategory(cat.id, 'imageUrl', e.target.value)}
                        className="w-full px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-[11px] font-medium focus:outline-none"
                      />
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
                      {/* 1. ÜST BAŞLIK SATIRI */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-900 uppercase">
                              #{order.id}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">{order.date}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ödeme: {order.paymentStatus || 'Ödendi'}
                            </span>

                            {/* Güvenlik & Sahtekarlık (Fraud) Risk Rozeti */}
                            {order.fraudRiskLevel === 'Yüksek' || (order.fraudScore !== undefined && order.fraudScore >= 60) ? (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-300 flex items-center gap-1 shadow-2xs"
                                title={order.fraudRiskReasons?.join(' • ') || 'Yüksek dolandırıcılık riski tespit edildi'}
                              >
                                <ShieldAlert size={12} className="text-rose-600" />
                                <span>Yüksek Risk ({order.fraudScore ?? 85}/100)</span>
                              </span>
                            ) : order.fraudRiskLevel === 'Orta' || (order.fraudScore !== undefined && order.fraudScore >= 25) ? (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1 shadow-2xs"
                                title={order.fraudRiskReasons?.join(' • ') || 'Orta seviye risk'}
                              >
                                <AlertTriangle size={12} className="text-amber-600" />
                                <span>Orta Risk ({order.fraudScore}/100)</span>
                              </span>
                            ) : (
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-2xs"
                                title="Katalog fiyatları ve e-posta/telefon kontrolleri onaylandı"
                              >
                                <ShieldCheck size={12} className="text-emerald-600" />
                                <span>Güvenli ({order.fraudScore ?? 0}/100)</span>
                              </span>
                            )}

                            {order.priceTampered && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                                <span>🛡️ Fiyat Kalkanı Devreye Girdi</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2">
                            <span>Toplam Tutar: <strong className="text-emerald-700 font-black text-sm">{order.total} TL</strong></span>
                            {order.clientIp && (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                IP: {order.clientIp}
                              </span>
                            )}
                          </p>
                          {order.securityAlert && (
                            <p className="text-[11px] font-bold text-purple-700 mt-1 bg-purple-50/80 p-1.5 rounded-lg border border-purple-200">
                              ℹ️ {order.securityAlert}
                            </p>
                          )}
                          {order.fraudRiskReasons && order.fraudRiskReasons.length > 0 && order.fraudRiskLevel !== 'Düşük' && (
                            <div className="mt-1.5 text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-lg border border-rose-200 space-y-0.5">
                              <span className="font-extrabold block">Risk Faktörleri:</span>
                              {order.fraudRiskReasons.map((r, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[10.5px]">
                                  <span>•</span>
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Durum Seçici */}
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-500">Sipariş Durumu:</label>
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
                        </div>
                      </div>

                      {/* 2. MÜŞTERİ VE TESLİMAT BİLGİLERİ */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 my-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] font-bold uppercase block">Alıcı Müşteri</span>
                          <p className="font-extrabold text-slate-900 mt-0.5">{order.customerName || 'Müşteri İsmi Girilmedi'}</p>
                          {order.customerPhone && (
                            <p className="text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                              <Phone size={12} className="text-slate-400" />
                              <span>{order.customerPhone}</span>
                            </p>
                          )}
                          {order.customerEmail && (
                            <p className="text-slate-600 font-medium mt-0.5 flex items-center gap-1 truncate" title={order.customerEmail}>
                              <Mail size={12} className="text-slate-400" />
                              <span>{order.customerEmail}</span>
                            </p>
                          )}
                        </div>

                        <div className="sm:col-span-1 md:col-span-2">
                          <span className="text-slate-400 text-[10px] font-bold uppercase block">Teslimat Adresi</span>
                          <p className="font-medium text-slate-800 mt-0.5 leading-relaxed">
                            {order.shippingAddress || 'Adres bilgisi bulunamadı.'}
                          </p>
                        </div>
                      </div>

                      {/* 3. KARGONOMİ & KARGO TAKİP AKSİYON ALANI (Kullanıcı İsteği) */}
                      <div className="my-3 p-3.5 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 rounded-xl border border-blue-200/80">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* 1. Buton: Kargonomi'ye Siparişi Gönder (Alıcıya e-posta atmaz) */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={creatingShipmentOrderId === order.id}
                                onClick={() => handleCreateShipmentForOrder(order)}
                                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs hover:shadow-sm active:scale-95"
                              >
                                <Truck size={15} />
                                <span>
                                  {creatingShipmentOrderId === order.id
                                    ? "Kargonomi'ye Gönderiliyor..."
                                    : order.kargonomiShipmentId
                                    ? "Kargonomi'ye Siparişi Tekrar Gönder"
                                    : "Kargonomi'ye Siparişi Gönder"}
                                </span>
                              </button>

                              {order.kargonomiShipmentId && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/90 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                                  <CheckCircle size={13} className="text-emerald-600" />
                                  <span>Kargonomi Kaydı Açık (#{order.kargonomiShipmentId})</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-slate-500 font-medium">
                              Bu butona basıldığında sipariş Kargonomi'ye iletilir, <strong>alıcıya e-posta gitmez.</strong>
                            </p>
                          </div>

                          {/* 2. Takip Numarası Girişi & Müşteriye Bildirim Gönderme */}
                          <div className="w-full md:w-auto md:min-w-[320px] lg:min-w-[380px] space-y-1">
                            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block">
                              Kargo Takip Numarası
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="Takip No (Örn: MNG12345678)"
                                value={
                                  trackingInputs[order.id] !== undefined
                                    ? trackingInputs[order.id]
                                    : (order.trackingNumber || '')
                                }
                                onChange={(e) =>
                                  setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                                }
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                disabled={sendingTrackingOrderId === order.id}
                                onClick={() => handleSaveTrackingAndNotifyCustomer(order)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
                                title="Takip numarasını kaydeder ve müşteriye takip linkli e-posta bildirimi iletir"
                              >
                                <Send size={13} />
                                <span>
                                  {sendingTrackingOrderId === order.id
                                    ? 'Gönderiliyor...'
                                    : order.trackingNumber
                                    ? 'Güncelle & Bildir'
                                    : 'Kaydet & Müşteriye Bildir'}
                                </span>
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Takip numarasını buraya girip kaydettiğinizde <strong>alıcıya takip kodlu e-posta iletilir.</strong>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 4. SİPARİŞ EDİLEN ÜRÜNLER */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                          Siparişteki Ürünler ({order.items.reduce((s, i) => s + i.quantity, 0)} Adet)
                        </span>
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
          {/* 4.5. MÜŞTERİ YORUMLARI & DEĞERLENDİRME YÖNETİMİ */}
          {/* ========================================================= */}
          {activeTab === 'reviews' && (
            <AdminReviewManagement
              products={products}
              onRefreshProducts={() => {
                fetch('/api/products')
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.success && Array.isArray(d.products)) {
                      onUpdateProducts(d.products);
                    }
                  })
                  .catch(() => {});
              }}
            />
          )}

          {/* ========================================================= */}
          {/* 5. KULLANICILARI GÖRME & YÖNETME (Kayıt Şekli, Bilgileri, Silme) */}
          {/* ========================================================= */}
          {activeTab === 'users' && (() => {
            // Filtreleme ve Arama Hesaplamaları
            const cleanQuery = userSearchQuery.trim().toLowerCase();

            const checkIsGoogleUser = (u: any): boolean => {
              if (!u) return false;
              if (u.isGoogleUser === true) return true;
              if (
                u.authProvider === 'google' ||
                u.auth_provider === 'google' ||
                u.provider === 'google' ||
                u.registeredVia === 'google' ||
                u.passwordHash === 'google_oauth_verified' ||
                u.authMethod === 'google'
              ) {
                return true;
              }
              const email = (u.email || '').trim().toLowerCase();
              if (!email) return false;

              // Şifresiz Gmail hesapları otomatik Google kabul edilir
              if (
                (email.endsWith('@gmail.com') || email.endsWith('@googlemail.com')) &&
                (!u.plainPassword && (!u.passwordHash || u.passwordHash === 'google_oauth_verified' || u.passwordHash === 'guest_order_created'))
              ) {
                return true;
              }

              try {
                const rawGoogle = localStorage.getItem('akuz_google_accounts_list');
                if (rawGoogle) {
                  const parsed = JSON.parse(rawGoogle);
                  if (Array.isArray(parsed) && parsed.some((g: any) => g.email && g.email.toLowerCase() === email)) {
                    return true;
                  }
                }
                const lastGoogle = localStorage.getItem('akuz_last_google_account');
                if (lastGoogle) {
                  const parsed = JSON.parse(lastGoogle);
                  if (parsed?.email && parsed.email.toLowerCase() === email) {
                    return true;
                  }
                }
              } catch {}
              return false;
            };
            
            const googleUsersCount = users.filter((u) => checkIsGoogleUser(u)).length;
            const normalUsersCount = users.length - googleUsersCount;
            const withCartCount = users.filter((u) => Array.isArray(u.cart) && u.cart.length > 0).length;

            const filteredUsers = users.filter((u) => {
              const isGoogle = checkIsGoogleUser(u);
              
              // Kategori filtresi
              if (userFilterType === 'google' && !isGoogle) return false;
              if (userFilterType === 'normal' && isGoogle) return false;
              if (userFilterType === 'with-cart' && (!Array.isArray(u.cart) || u.cart.length === 0)) return false;

              // Arama sorgusu filtresi
              if (cleanQuery) {
                const matchName = (u.name || '').toLowerCase().includes(cleanQuery);
                const matchEmail = (u.email || '').toLowerCase().includes(cleanQuery);
                const matchPhone = (u.phone || '').toLowerCase().includes(cleanQuery);
                const matchId = (u.id || '').toLowerCase().includes(cleanQuery);
                return matchName || matchEmail || matchPhone || matchId;
              }

              return true;
            });

            return (
              <div className="space-y-6">
                
                {/* 1. ÜST ÖZET İSTATİSTİK KARTLARI */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Toplam Üye</span>
                      <Users size={18} className="text-[#ff0055]" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{users.length}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sitede kayıtlı tüm hesaplar</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Google Girişi</span>
                      <GoogleGIcon size={18} />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{googleUsersCount}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Google hesabı ile kayıt olanlar</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Normal Kayıt</span>
                      <Mail size={18} className="text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{normalUsersCount}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">E-posta & şifre ile kayıt olanlar</p>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider">Aktif Sepetliler</span>
                      <ShoppingCart size={18} className="text-amber-500" />
                    </div>
                    <div className="text-2xl font-black text-slate-900">{withCartCount}</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">Sepetinde ürün bekleyenler</p>
                  </div>
                </div>

                {/* 2. ANA LİSTE KARTI & FİLTRELER */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  
                  {/* Başlık ve Eylemler */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-black uppercase text-slate-900 flex items-center gap-2">
                        <Users size={18} className="text-[#ff0055]" />
                        <span>Kayıtlı Kullanıcılar & Üye Yönetimi ({filteredUsers.length})</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Müşterilerin kayıt yöntemi (Google veya E-posta), iletişim ve adres bilgileri, sepet durumu ve hesap silme işlemleri.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleRefreshUsers(false)}
                        disabled={isRefreshingUsers}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                        title="Verileri Sunucudan Canlı Yenile"
                      >
                        <RefreshCw size={14} className={isRefreshingUsers ? 'animate-spin text-[#ff6600]' : ''} />
                        <span>{isRefreshingUsers ? 'Yenileniyor...' : 'Yenile'}</span>
                      </button>

                      {users.length > 0 && (
                        <button
                          type="button"
                          onClick={handlePurgeAllUsersClick}
                          disabled={isPurgingUsers}
                          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          <span>{isPurgingUsers ? 'Siliniyor...' : 'Tümünü Temizle'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filtre ve Arama Çubuğu */}
                  <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Arama Inputu */}
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="İsim, e-posta veya telefon ile ara..."
                        className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff6600] text-slate-900"
                      />
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      {userSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setUserSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Filtreleme Butonları */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setUserFilterType('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          userFilterType === 'all'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Tümü ({users.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserFilterType('google')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          userFilterType === 'google'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <GoogleGIcon size={14} />
                        <span>Google ({googleUsersCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserFilterType('normal')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          userFilterType === 'normal'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <Mail size={13} className="text-blue-500" />
                        <span>Normal ({normalUsersCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserFilterType('with-cart')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          userFilterType === 'with-cart'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <ShoppingCart size={13} className="text-amber-500" />
                        <span>Sepeti Dolu ({withCartCount})</span>
                      </button>
                    </div>
                  </div>

                  {/* KULLANICI LİSTESİ TABLOSU */}
                  {users.length === 0 ? (
                    <div className="py-16 px-4 text-center">
                      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
                        <Users size={30} />
                      </div>
                      <h4 className="text-base font-black text-slate-800">Kayıtlı Kullanıcı Bulunmuyor</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        Sistemdeki tüm kayıtlı kullanıcılar temizlendi (0 üye). Siteden Google veya normal kayıt formunu dolduran müşteriler burada otomatik listelenecektir.
                      </p>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-14 px-4 text-center">
                      <p className="text-sm font-bold text-slate-700">Aramanıza veya seçili filtreye uygun kullanıcı bulunamadı.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setUserSearchQuery('');
                          setUserFilterType('all');
                        }}
                        className="mt-3 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Filtreleri Temizle
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[11px] tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Kullanıcı</th>
                            <th className="py-3 px-4">Kayıt Şekli</th>
                            <th className="py-3 px-4">E-posta & İletişim</th>
                            <th className="py-3 px-4">Kayıt Tarihi</th>
                            <th className="py-3 px-4">Adresler</th>
                            <th className="py-3 px-4">Aktif Sepet</th>
                            <th className="py-3 px-4">Favoriler</th>
                            <th className="py-3 px-4 text-right">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredUsers.map((u, i) => {
                            const isGoogle = checkIsGoogleUser(u);
                            const cartItemsCount = Array.isArray(u.cart) ? u.cart.length : 0;
                            const favsCount = Array.isArray(u.favorites) ? u.favorites.length : 0;
                            const addrCount = Array.isArray(u.addresses) ? u.addresses.length : 0;

                            let formattedDate = 'Belirtilmemiş';
                            let formattedTime = '';
                            if (u.createdAt) {
                              try {
                                const d = new Date(u.createdAt);
                                formattedDate = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                formattedTime = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                              } catch {}
                            }

                            return (
                              <tr key={u.id || u.email || i} className="hover:bg-slate-50/80 transition-colors">
                                {/* 1. Kullanıcı */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-xs shadow-xs shrink-0">
                                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-extrabold text-slate-900 block truncate max-w-[150px]">
                                        {u.name || 'İsimsiz Kullanıcı'}
                                      </span>
                                      {u.id && (
                                        <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[150px]">
                                          #{u.id}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* 2. Kayıt Şekli (Google vs Normal) */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {isGoogle ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-white text-slate-800 border border-slate-200 shadow-2xs">
                                      <GoogleGIcon size={14} />
                                      <span>Google Girişi</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                      <Mail size={13} className="text-blue-600" />
                                      <span>Normal Kayıt</span>
                                    </span>
                                  )}
                                </td>

                                {/* 3. E-posta & Telefon */}
                                <td className="py-3.5 px-4">
                                  <div className="space-y-0.5">
                                    <span className="font-semibold text-slate-900 block font-mono text-xs truncate max-w-[200px]" title={u.email}>
                                      {u.email}
                                    </span>
                                    <span className="text-slate-500 text-[11px] block">
                                      {u.phone ? `📞 ${u.phone}` : 'Telefon yok'}
                                    </span>
                                  </div>
                                </td>

                                {/* 4. Kayıt Tarihi */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  <div className="text-xs">
                                    <span className="font-semibold text-slate-800 block">{formattedDate}</span>
                                    {formattedTime && (
                                      <span className="text-[11px] text-slate-400 block">{formattedTime}</span>
                                    )}
                                  </div>
                                </td>

                                {/* 5. Kayıtlı Adresler */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {addrCount > 0 ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs inline-flex items-center gap-1">
                                      <MapPin size={12} className="text-emerald-600" />
                                      <span>{addrCount} Adres Kayıtlı</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">Adres Yok</span>
                                  )}
                                </td>

                                {/* 6. Aktif Sepet */}
                                <td className="py-3.5 px-4">
                                  {cartItemsCount > 0 ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap">
                                      <ShoppingCart size={12} className="text-amber-600" />
                                      <span>{cartItemsCount} Ürün Sepette</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">Sepet Boş</span>
                                  )}
                                </td>

                                {/* 7. Favoriler */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {favsCount > 0 ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-pink-50 border border-pink-200 text-[#ff0055] font-bold text-xs inline-flex items-center gap-1">
                                      <Heart size={12} className="text-[#ff0055] fill-[#ff0055]" />
                                      <span>{favsCount} Favori</span>
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">Favori Yok</span>
                                  )}
                                </td>

                                {/* 8. İşlemler: Detay & Silme */}
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedUserDetail(u)}
                                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-blue-100"
                                      title="Kayıt Bilgilerini ve Sepeti Görüntüle"
                                    >
                                      <Eye size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUserClick(u.email, u.name)}
                                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                                      title="Bu Kullanıcıyı Kalıcı Olarak Sil"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>

                {/* ========================================================= */}
                {/* 3. KULLANICI KAYIT DETAYLARI VE SEPET İNCELEME MODALI */}
                {/* ========================================================= */}
                {selectedUserDetail && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-scaleUp">
                      
                      {/* Modal Başlık */}
                      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white font-black text-lg shadow-inner">
                            {selectedUserDetail.name ? selectedUserDetail.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-black text-white">
                                {selectedUserDetail.name || 'İsimsiz Kullanıcı'}
                              </h3>
                              {/* Kayıt Şekli Rozeti */}
                              {checkIsGoogleUser(selectedUserDetail) ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white text-slate-900 shadow-xs">
                                  <GoogleGIcon size={13} />
                                  <span>Google ile Kayıtlı</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-200 border border-blue-400/30">
                                  <Mail size={12} className="text-blue-300" />
                                  <span>Normal E-posta Kaydı</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 font-mono">
                              {selectedUserDetail.email}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedUserDetail(null)}
                          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* Modal Gövdesi */}
                      <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-[#faf9f6]">
                        
                        {/* 1. Temel Hesap & Kayıt Bilgileri */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                            <ShieldCheck size={16} className="text-[#ff6600]" />
                            <span>Kayıt ve Hesap Bilgileri</span>
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Ad Soyad</span>
                              <span className="font-extrabold text-slate-900 text-sm">{selectedUserDetail.name || 'Belirtilmedi'}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">E-posta Adresi</span>
                              <span className="font-bold text-slate-900 font-mono text-sm break-all">{selectedUserDetail.email}</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Telefon Numarası</span>
                              <span className="font-bold text-slate-900 text-sm">
                                {selectedUserDetail.phone ? selectedUserDetail.phone : 'Belirtilmedi'}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kayıt Yöntemi (Hesap Türü)</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {checkIsGoogleUser(selectedUserDetail) ? (
                                  <span className="font-extrabold text-slate-800 flex items-center gap-1">
                                    <GoogleGIcon size={14} />
                                    <span>Google Tek Tıkla Giriş / OAuth</span>
                                  </span>
                                ) : (
                                  <span className="font-extrabold text-blue-700 flex items-center gap-1">
                                    <Mail size={13} className="text-blue-600" />
                                    <span>Normal E-posta & Şifre</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kayıt Tarihi ve Saati</span>
                              <span className="font-semibold text-slate-800 flex items-center gap-1">
                                <Clock size={13} className="text-slate-400" />
                                {selectedUserDetail.createdAt
                                  ? new Date(selectedUserDetail.createdAt).toLocaleString('tr-TR', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Belirtilmemiş'}
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kullanıcı ID / Kod</span>
                              <span className="font-mono font-bold text-slate-600 text-xs">
                                {selectedUserDetail.id || 'usr_auto'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Kayıtlı Teslimat Adresleri */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                            <MapPin size={16} className="text-emerald-600" />
                            <span>Kayıtlı Teslimat Adresleri ({selectedUserDetail.addresses?.length || 0})</span>
                          </h4>

                          {!selectedUserDetail.addresses || selectedUserDetail.addresses.length === 0 ? (
                            <p className="text-xs text-slate-500 py-2">Kullanıcı henüz bir teslimat adresi kaydetmemiş.</p>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedUserDetail.addresses.map((addr, idx) => (
                                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-slate-900">{addr.title || `Adres #${idx + 1}`}</span>
                                    {addr.isDefault && (
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                        Varsayılan
                                      </span>
                                    )}
                                  </div>
                                  <p className="font-semibold text-slate-700">{addr.recipientName || selectedUserDetail.name} • {addr.phone || selectedUserDetail.phone}</p>
                                  <p className="text-slate-600 leading-relaxed">{addr.fullAddress}</p>
                                  <p className="text-slate-500 text-[11px] font-bold">{addr.district} / {addr.city}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 3. Aktif Sepetindeki Ürünler */}
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                            <ShoppingCart size={16} className="text-amber-500" />
                            <span>Kullanıcının Sepetinde Bekleyen Ürünler ({selectedUserDetail.cart?.length || 0})</span>
                          </h4>

                          {!selectedUserDetail.cart || selectedUserDetail.cart.length === 0 ? (
                            <p className="text-xs text-slate-500 py-2">Kullanıcının sepetinde şu an ürün bulunmuyor.</p>
                          ) : (
                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                              {selectedUserDetail.cart.map((cItem: any, cIdx: number) => {
                                const pName = cItem.product?.name || cItem.name || 'Özel Sticker';
                                const pPrice = cItem.calculatedPrice || cItem.product?.price || cItem.price || 0;
                                const pQty = cItem.quantity || 1;
                                return (
                                  <div key={cIdx} className="p-3 flex items-center justify-between gap-3 text-xs">
                                    <div className="min-w-0">
                                      <span className="font-bold text-slate-900 block truncate">{pQty}x {pName}</span>
                                      <span className="text-[11px] text-slate-500 block">
                                        {cItem.selectedDimension || cItem.dimension || ''}
                                        {cItem.selectedColor ? ` • ${cItem.selectedColor}` : ''}
                                        {cItem.customText ? ` • "${cItem.customText}"` : ''}
                                      </span>
                                    </div>
                                    <span className="font-extrabold text-[#ff0055] font-price shrink-0">
                                      ₺{(pPrice * pQty).toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* 4. Kullanıcının Satın Aldığı Siparişler */}
                        {(() => {
                          const userOrders = orders.filter((o) => (o.customerEmail || '').toLowerCase() === (selectedUserDetail.email || '').toLowerCase());
                          return (
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                                <Package size={16} className="text-[#ff0055]" />
                                <span>Kullanıcının Verdiği Siparişler ({userOrders.length})</span>
                              </h4>

                              {userOrders.length === 0 ? (
                                <p className="text-xs text-slate-500 py-2">Bu kullanıcı henüz mağazamızdan sipariş vermemiş.</p>
                              ) : (
                                <div className="space-y-2">
                                  {userOrders.map((ord, oIdx) => (
                                    <div key={oIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs">
                                      <div>
                                        <span className="font-mono font-black text-slate-900 block">#{ord.id}</span>
                                        <span className="text-[11px] text-slate-500 block">{ord.date} • {ord.items.length} Kalem Ürün</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-black text-[#ff0055] font-price block">₺{ord.total.toFixed(2).replace('.', ',')}</span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                                          {ord.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      </div>

                      {/* Modal Alt Butonları */}
                      <div className="p-4 sm:p-5 bg-white border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeleteUserClick(selectedUserDetail.email, selectedUserDetail.name)}
                          className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200"
                        >
                          <Trash2 size={15} />
                          <span>Kullanıcıyı Kalıcı Sil</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedUserDetail(null)}
                          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Kapat
                        </button>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            );
          })()}

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
                    onChange={(e) => handleTestEmailChange(e.target.value)}
                    placeholder="Test edilecek e-posta adresi (örn: mertopro123@gmail.com)"
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

                {/* Google Cloud Console JSON Entegrasyonu ve Hata Önleme Kartı */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-4 shadow-lg border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                        <Upload size={18} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-white">
                          Google Cloud Console JSON Dosyası Entegrasyonu
                        </h4>
                        <p className="text-xs text-slate-400">
                          Google Console'dan indirdiğiniz <code>client_secret_...json</code> dosyasını seçin veya yapıştırın
                        </p>
                      </div>
                    </div>
                    {googleClientId && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle size={14} /> Aktif Entegre
                      </span>
                    )}
                  </div>

                  {/* Dosya Yükleme ve Yapıştırma Alanı */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Yöntem A: Dosya Yükleme */}
                    <div
                      onClick={() => googleJsonFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-[#ff0055] rounded-xl p-4 text-center cursor-pointer transition-colors bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center min-h-[120px] group"
                    >
                      <input
                        ref={googleJsonFileInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleGoogleJsonFileChange}
                        className="hidden"
                      />
                      <HardDrive size={24} className="text-slate-400 group-hover:text-[#ff0055] mb-2 transition-colors" />
                      <span className="text-xs font-bold text-white group-hover:text-[#ff0055] transition-colors">
                        JSON Dosyasını Seç (.json)
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        İndirdiğiniz Google Cloud kimlik dosyasını buraya tıklayarak yükleyin
                      </span>
                    </div>

                    {/* Yöntem B: JSON Yapıştırma */}
                    <div className="space-y-2">
                      <textarea
                        value={googleJsonInput}
                        onChange={(e) => setGoogleJsonInput(e.target.value)}
                        placeholder='Google Console JSON içeriğini buraya yapıştırın: {"web":{"client_id":"947652767285-..."}}'
                        rows={3}
                        className="w-full p-2.5 text-[11px] bg-slate-900/90 text-slate-200 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#ff0055] font-mono resize-none"
                      />
                      <button
                        type="button"
                        disabled={isProcessingGoogleJson || !googleJsonInput.trim()}
                        onClick={() => handleParseAndApplyGoogleJson(googleJsonInput)}
                        className="w-full py-2 px-3 bg-[#ff0055] hover:bg-[#d90048] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isProcessingGoogleJson ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Çözümleniyor...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Yapıştırılan JSON'u Entegre Et</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Durum Bildirimi */}
                  {googleJsonStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        googleJsonStatus.success
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                      }`}
                    >
                      {googleJsonStatus.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      <span>{googleJsonStatus.msg}</span>
                    </div>
                  )}

                  {/* Entegre Edilmiş Bilgiler Özeti */}
                  {googleJsonInfo && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400 font-sans">Tanımlı İstemci (Client ID):</span>
                        <span className="text-emerald-400 font-bold truncate max-w-[280px]">
                          {googleJsonInfo.clientId || googleClientId}
                        </span>
                      </div>
                      {googleJsonInfo.projectId && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400 font-sans">Google Proje ID:</span>
                          <span className="text-white">{googleJsonInfo.projectId}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* OAuth 2.0 Engellenme Hatasını Önleme Rehberi */}
                <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-4">
                  <div className="flex items-center gap-2 text-amber-950 font-black text-sm">
                    <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                    <span>Google OAuth 2.0 Engellenme Hatası (Error 400 / 403) Nasıl Önlenir?</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Google Cloud Console'da güvenlik kısıtlamaları nedeniyle oturum açmanın engellenmemesi için aşağıdaki 3 adımı konsolunuzda kontrol ediniz:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Kural 1: Authorized JavaScript origins */}
                    <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 space-y-2">
                      <span className="font-bold text-slate-900 block">
                        1. Yetkili JavaScript Kaynakları (Authorized JavaScript origins)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Google Cloud Console &gt; Credentials &gt; OAuth 2.0 Client &gt; Web Application düzenleyip şu adresleri ekleyin:
                      </p>
                      <div className="space-y-1 font-mono text-[11px]">
                        {[
                          'https://akuzstickers.com',
                          'https://www.akuzstickers.com',
                          'http://localhost:3000',
                          typeof window !== 'undefined' ? window.location.origin : '',
                        ]
                          .filter((v, idx, arr) => v && arr.indexOf(v) === idx)
                          .map((orig) => (
                            <div key={orig} className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                              <span className="truncate text-slate-700">{orig}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (navigator.clipboard) {
                                    navigator.clipboard.writeText(orig);
                                    setCopiedText(orig);
                                    setTimeout(() => setCopiedText(null), 1500);
                                  }
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-white rounded hover:bg-slate-700 shrink-0 cursor-pointer"
                              >
                                {copiedText === orig ? 'Kopyalandı' : 'Kopyala'}
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Kural 2: Authorized redirect URIs */}
                    <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 space-y-2">
                      <span className="font-bold text-slate-900 block">
                        2. Yetkili Yönlendirme URI'leri (Authorized redirect URIs)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Yönlendirme URI'leri listesine tam adresleri ekleyin:
                      </p>
                      <div className="space-y-1 font-mono text-[11px]">
                        {[
                          'https://akuzstickers.com',
                          'https://akuzstickers.com/api/auth.php',
                          'https://www.akuzstickers.com',
                        ].map((uri) => (
                          <div key={uri} className="flex items-center justify-between bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            <span className="truncate text-slate-700">{uri}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(uri);
                                  setCopiedText(uri);
                                  setTimeout(() => setCopiedText(null), 1500);
                                }
                              }}
                              className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-white rounded hover:bg-slate-700 shrink-0 cursor-pointer"
                            >
                              {copiedText === uri ? 'Kopyalandı' : 'Kopyala'}
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="font-bold text-slate-900 block text-[11px]">
                          3. OAuth İzin Ekranı (OAuth consent screen):
                        </span>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Yayınlama durumu "Testing" ise yalnızca eklediğiniz Test Kullanıcıları girebilir. Tüm müşteriler için <strong>"Publish App" (Uygulamayı Yayınla)</strong> butonuna basınız.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manuel Client ID ve Ayarlar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Sitenizin Geçerli JavaScript Kaynağı (Origin URL)
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
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Google OAuth Client ID (Aktif İstemci Kimliği)
                    </label>
                    <input
                      type="text"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      placeholder="947652767285-huldifd2fqu7gcdqqcq6emoufcom9h46.apps.googleusercontent.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#ff0055] font-mono text-slate-800"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Varsayılan: <code>947652767285-huldifd2fqu7gcdqqcq6emoufcom9h46.apps.googleusercontent.com</code>
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

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold rounded-lg flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Geçerli Kargo: {Number(shippingFee) === 0 ? 'Ücretsiz (0 ₺)' : `₺${Number(shippingFee).toFixed(2).replace('.', ',')}`}</span>
                    </span>
                    <span className="text-[11px] px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 font-extrabold rounded-lg">
                      Ücretsiz Barajı: {Number(freeShippingThreshold) >= 999999 ? 'Limitsiz (Hep Ücretli)' : `₺${Number(freeShippingThreshold).toFixed(2).replace('.', ',')}`}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                      ✓ Canlı Senkronize
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
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setShippingFee(isNaN(val) ? 0 : val);
                        }}
                        onBlur={() => {
                          handleUpdateShippingFeeAndThreshold(shippingFee, freeShippingThreshold, true);
                        }}
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
                            onClick={() => handleUpdateShippingFeeAndThreshold(btn.val, freeShippingThreshold, true)}
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
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setFreeShippingThreshold(isNaN(val) ? 0 : val);
                        }}
                        onBlur={() => {
                          handleUpdateShippingFeeAndThreshold(shippingFee, freeShippingThreshold, true);
                        }}
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
                            onClick={() => handleUpdateShippingFeeAndThreshold(shippingFee, btn.val, true)}
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
                  <span className="text-[11px] text-slate-500 font-medium">
                    (Değişiklikleriniz sepete ve ödeme sayfasına otomatik aktarılır)
                  </span>
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
                      Önizleme ekranında yaptığınız tüm ürün düzenlemeleri, yuvarlak kategori butonları, fotoğraflar, fiyatlar, PayTR ve mağaza ayarlarınız <strong>kalıcı olarak kaydedilir</strong>. cPanel'e atmadan önce <strong>"Şu Anki Kodlarla Güncelle & İndir"</strong> butonuna bastığınızda, önizlemedeki tüm değişiklikleriniz derlenip ZIP paketlerine işlenir.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/30 border border-emerald-400/40 rounded-full text-xs font-bold text-emerald-100">
                        <CheckCircle size={13} className="text-emerald-300" />
                        Önizleme Verileri & Kodlar %100 Senkronize
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
                      onClick={() => handleRebuildCpanel()}
                      disabled={rebuildingCpanel}
                      className="px-6 py-3.5 bg-white text-emerald-900 hover:bg-emerald-50 disabled:opacity-60 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2.5 shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer border-2 border-emerald-300/40"
                    >
                      {rebuildingCpanel ? (
                        <>
                          <RefreshCw size={18} className="animate-spin text-emerald-600" />
                          <span>Şu Anki Site Dosyaları Güncelleniyor...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={18} className="text-emerald-600" />
                          <span>Şu Anki Site Dosyalarını Güncelle</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-emerald-200/90 font-medium">
                      Tüm son kodları, ürünleri ve ayarları derleyip ZIP'leri yeniler
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
                        <span><strong>src/ & index.html</strong> (Tüm güncel kaynak kodlar)</span>
                      </div>
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
                        <span><strong>data_storage/</strong> (Kullanıcılar, ürünler ve siparişler)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                        <span><strong>.htaccess</strong> (Apache SPA URL rewrite)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-2.5">
                    {/* ÖNCELİKLİ: GÜNCELLE VE İNDİR */}
                    <button
                      type="button"
                      onClick={() => handleRebuildCpanel({ url: '/download-cpanel-full.zip', filename: 'cpanel_full_app.zip' })}
                      disabled={Boolean(downloadingZip) || rebuildingCpanel}
                      className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                    >
                      {rebuildingCpanel ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Şu Anki Kodlar Derleniyor...</span>
                        </>
                      ) : downloadingZip === 'cpanel_full_app.zip' ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>İndiriliyor...</span>
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          <span>Şu Anki Kodlarla Güncelle & İndir (.ZIP)</span>
                        </>
                      )}
                    </button>

                    {/* HIZLI İNDİR (YENİDEN DERLEMEDEN) */}
                    <button
                      type="button"
                      onClick={() => handleDownloadZip('/download-cpanel-full.zip', 'cpanel_full_app.zip')}
                      disabled={Boolean(downloadingZip) || rebuildingCpanel}
                      className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download size={14} />
                      <span>Mevcut Paketi Doğrudan İndir</span>
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

                  <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col gap-2.5">
                    {/* ÖNCELİKLİ: GÜNCELLE VE İNDİR */}
                    <button
                      type="button"
                      onClick={() => handleRebuildCpanel({ url: '/download-cpanel-dist.zip', filename: 'cpanel_public_html_dist.zip' })}
                      disabled={Boolean(downloadingZip) || rebuildingCpanel}
                      className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 transition-all cursor-pointer"
                    >
                      {rebuildingCpanel ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>Şu Anki Kodlar Derleniyor...</span>
                        </>
                      ) : downloadingZip === 'cpanel_public_html_dist.zip' ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" />
                          <span>İndiriliyor...</span>
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          <span>Şu Anki Kodlarla Güncelle & İndir (.ZIP)</span>
                        </>
                      )}
                    </button>

                    {/* HIZLI İNDİR (YENİDEN DERLEMEDEN) */}
                    <button
                      type="button"
                      onClick={() => handleDownloadZip('/download-cpanel-dist.zip', 'cpanel_public_html_dist.zip')}
                      disabled={Boolean(downloadingZip) || rebuildingCpanel}
                      className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download size={14} />
                      <span>Mevcut Paketi Doğrudan İndir</span>
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

          {/* ========================================================= */}
          {/* 13. E-TİCARET GÜVENLİK & ANTİ-DOLANDIRICILIK MERKEZİ */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* ÜST BİLGİ & DURUM BAŞLIĞI */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-emerald-900/40 relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-80 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs font-black tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>6 Katmanlı Güvenlik Kalkanı Aktif</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">256-Bit SSL · PayTR HMAC · Anti-Carding</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                      <ShieldCheck className="text-emerald-400 shrink-0" size={26} />
                      <span>E-Ticaret Güvenlik & Anti-Dolandırıcılık Merkezi</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                      İnternet alışverişlerinde yaygın yapılan <strong>fiyat manipülasyonu</strong> (tarayıcıdan fiyat düşürme), <strong>çalıntı kart deneme botları (carding)</strong>, sahte PayTR webhook bildirimleri, zararlı XSS scriptleri ve sunucu sistem dosyalarına yönelik saldırılar anlık olarak taranır ve engellenir.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => fetchSecurityData()}
                      disabled={isLoadingSecurity}
                      className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/10 cursor-pointer disabled:opacity-50"
                      title="Güvenlik verilerini yenile"
                    >
                      <RefreshCw size={14} className={isLoadingSecurity ? 'animate-spin' : ''} />
                      <span>Yenile</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSecurityLogs}
                      className="px-3 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Güvenlik günlüklerini temizle"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* 4 ÖZET İSTATİSTİK KARTI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-700/60">
                  <div className="bg-slate-800/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Aktif Kalkanlar</span>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span>6 / 6</span>
                      <span className="text-xs font-semibold text-emerald-400/80">(Devrede)</span>
                    </span>
                  </div>

                  <div className="bg-slate-800/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Engellenen Tehditler</span>
                    <span className="text-lg sm:text-xl font-black text-rose-400 mt-0.5 block">
                      {securityStats?.blockedAttacksCount ?? 0} Adet
                    </span>
                  </div>

                  <div className="bg-slate-800/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Fiyat Manipülasyon Engeli</span>
                    <span className="text-lg sm:text-xl font-black text-amber-400 mt-0.5 block">
                      {securityStats?.tamperedPriceAttemptsCount ?? 0} Girişim
                    </span>
                  </div>

                  <div className="bg-slate-800/80 backdrop-blur-xs p-3.5 rounded-2xl border border-slate-700/80">
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">Kara Listedeki IP'ler</span>
                    <span className="text-lg sm:text-xl font-black text-purple-300 mt-0.5 block">
                      {securityStats?.blockedIps?.length ?? 0} IP
                    </span>
                  </div>
                </div>
              </div>

              {/* 6 AKTİF KALKAN DETAYI */}
              <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <span>Aktif Güvenlik Kalkanları ve Savunma Katmanları</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-semibold">Tüm istekler doğrulanıyor</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Kalkan 1 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        <span>🏷️</span>
                        <span>Fiyat Doğrulama</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      İstemci tarayıcıdan sepet tutarını düşürmeye çalışırsa sunucu ürünün orijinal katalog fiyatını (boyut ve harf ücreti dahil) hesaplar ve PayTR tahsilatına gerçek tutarı zorlar.
                    </p>
                  </div>

                  {/* Kalkan 2 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        <span>🔐</span>
                        <span>PayTR 256-Bit HMAC</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      PayTR bildirimlerinde gelen SHA-256 HMAC hash imzası kontrol edilir. Sahte veya manipüle edilmiş callback istekleri kesinlikle siparişi onaylayamaz ve engellenir.
                    </p>
                  </div>

                  {/* Kalkan 3 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        <span>🤖</span>
                        <span>Anti-Carding Bot Kalkanı</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Çalıntı kredi kartı listelerini sitede hızlıca deneyen botlara karşı IP başına dakikada maksimum 6 token isteği sınırı uygulanır. Aşıldığında IP geçici olarak engellenir.
                    </p>
                  </div>

                  {/* Kalkan 4 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        <span>📁</span>
                        <span>Dizin Gezinme Koruması</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Saldırganların <code>/.env</code>, <code>/.git</code>, <code>server.ts</code> veya <code>..</code> (Directory Traversal) ile sunucu gizli verilerini taraması HTTP 403 Forbidden ile durdurulur.
                    </p>
                  </div>

                  {/* Kalkan 5 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        <span>🧠</span>
                        <span>Fraud Risk Puanlaması</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Gelen her sipariş; tek kullanımlık/sahte e-posta, geçersiz telefon, anormal sipariş adeti ve adres kalitesine göre 0-100 arası otomatik risk puanı alır ve panelde işaretlenir.
                    </p>
                  </div>

                  {/* Kalkan 6 */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        <span>🧹</span>
                        <span>Anti-XSS & Giriş Temizliği</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Müşteri formlarından veya API parametrelerinden gelen zararlı <code>&lt;script&gt;</code>, iframe ve injection kodları derhal filtrelenir, veritabanına ve ekrana yansıması engellenir.
                    </p>
                  </div>
                </div>
              </div>

              {/* SALDIRI SİMÜLASYONU & MANUEL IP KARA LİSTESİ */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Güvenlik Kalkanı Test Simülasyonu */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
                      <Zap size={16} className="text-amber-500" />
                      <span>Güvenlik Kalkanlarını Canlı Test Et (Simülasyon)</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">Güvenli Deneme</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Kalkanların nasıl çalıştığını ve anında loglara nasıl düştüğünü görmek için aşağıdaki simülasyonları başlatabilirsiniz:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={isSimulatingAttack}
                      onClick={() => handleSimulateAttack('price_tampering')}
                      className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span className="block text-amber-600 font-black text-sm mb-1">🏷️ Fiyat Hilesi</span>
                      <span className="text-[11px] text-amber-800 font-normal">350 TL yerine 1 TL gönderme denemesi simüle edilir.</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSimulatingAttack}
                      onClick={() => handleSimulateAttack('carding')}
                      className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span className="block text-rose-600 font-black text-sm mb-1">💳 Carding Botu</span>
                      <span className="text-[11px] text-rose-800 font-normal">Hızlı kart flood saldırısı ve IP engeli simüle edilir.</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSimulatingAttack}
                      onClick={() => handleSimulateAttack('traversal')}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 rounded-2xl text-left text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span className="block text-slate-700 font-black text-sm mb-1">📁 Dizin Tarama</span>
                      <span className="text-[11px] text-slate-600 font-normal">/.env ve sunucu dosyalarına erişim denemesi simüle edilir.</span>
                    </button>
                  </div>
                </div>

                {/* 2. Manuel IP Kara Liste Yönetimi */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
                      <Lock size={16} className="text-rose-600" />
                      <span>IP Kara Liste Yönetimi</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold">Manuel Blokaj</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Engellenecek IP (Örn: 185.220.101.5)"
                      value={manualIpToBlock}
                      onChange={(e) => setManualIpToBlock(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#ff0055]"
                    />
                    <button
                      type="button"
                      onClick={handleBlockManualIp}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0"
                    >
                      IP'yi Engelle
                    </button>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                      Engellenen IP Listesi ({securityStats?.blockedIps?.length ?? 0}):
                    </span>
                    {(!securityStats?.blockedIps || securityStats.blockedIps.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">Şu anda kara listede aktif bir IP bulunmuyor.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {securityStats.blockedIps.map((ip: string) => (
                          <span
                            key={ip}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-mono font-bold"
                          >
                            <span>{ip}</span>
                            <button
                              type="button"
                              onClick={() => handleUnblockManualIp(ip)}
                              className="text-rose-500 hover:text-rose-800 cursor-pointer font-black"
                              title="Engeli Kaldır"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CANLI GÜVENLİK OLAY GÜNLÜĞÜ (SECURITY AUDIT LOG) */}
              <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                      <Activity size={18} className="text-emerald-600" />
                      <span>Canlı Güvenlik & Saldırı Olay Günlüğü</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sunucuya gelen tüm şüpheli istekler, engellenen saldırılar ve fiyat manipülasyon denemeleri burada kayıt altındadır.
                    </p>
                  </div>

                  {/* Filtre */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSecurityFilterSeverity('all')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        securityFilterSeverity === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'
                      }`}
                    >
                      Tümü ({securityEvents.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecurityFilterSeverity('critical')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        securityFilterSeverity === 'critical' ? 'bg-rose-600 text-white shadow-2xs font-black' : 'text-slate-600'
                      }`}
                    >
                      Kritik Tehditler
                    </button>
                    <button
                      type="button"
                      onClick={() => setSecurityFilterSeverity('high')}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        securityFilterSeverity === 'high' ? 'bg-amber-600 text-white shadow-2xs font-black' : 'text-slate-600'
                      }`}
                    >
                      Yüksek Risk
                    </button>
                  </div>
                </div>

                {/* Tablo */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                        <th className="py-2.5 px-3">Zaman</th>
                        <th className="py-2.5 px-3">Olay Tipi</th>
                        <th className="py-2.5 px-3">Seviye</th>
                        <th className="py-2.5 px-3">İstemci IP</th>
                        <th className="py-2.5 px-3">Detay & Güvenlik Aksiyonu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {securityEvents
                        .filter((e) => {
                          if (securityFilterSeverity === 'all') return true;
                          return e.severity === securityFilterSeverity;
                        })
                        .map((evt) => {
                          const dateStr = new Date(evt.timestamp).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          });

                          const severityBadge =
                            evt.severity === 'critical' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
                                Kritik
                              </span>
                            ) : evt.severity === 'high' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300">
                                Yüksek
                              </span>
                            ) : evt.severity === 'medium' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                                Orta
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Bilgi
                              </span>
                            );

                          return (
                            <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {dateStr}
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                                <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                                  {evt.type}
                                </span>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                {severityBadge}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                                {evt.ip}
                              </td>
                              <td className="py-3 px-3 text-slate-700 font-medium leading-relaxed">
                                {evt.details}
                                {evt.orderId && (
                                  <span className="ml-1.5 px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded font-bold text-[10px]">
                                    Sipariş: #{evt.orderId}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      {securityEvents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                            Henüz kaydedilmiş bir güvenlik olayı bulunmamaktadır.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
                  <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-[#ff6600] border border-orange-200 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-[0.98] ${isUploadingProductImage ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}>
                    {isUploadingProductImage ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-[#ff6600]" />
                        <span>{uploadProgressText || 'Optimize Ediliyor...'}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        <span>Cihazdan Fotoğraf Seç</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingProductImage}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleProductFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                  {formImageUrl && (
                    <div className="relative group/prev w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 shadow-2xs bg-slate-100">
                      <img src={formImageUrl} alt="Önizleme" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="absolute inset-0 bg-red-600/80 text-white text-[10px] font-bold opacity-0 group-hover/prev:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        title="Fotoğrafı Kaldır"
                      >
                        Kaldır
                      </button>
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
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Seçilen yüksek çözünürlüklü fotoğraflar otomatik olarak optimize edilir ve web için hızlandırılır.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Ek Görseller (Varsa diğer açılar)
                  </label>
                  <label className="text-[11px] font-bold text-[#ff6600] hover:text-[#e05500] cursor-pointer flex items-center gap-1">
                    <Plus size={12} />
                    <span>Cihazdan Ek Görsel Ekle</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingProductImage}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleAdditionalFileUpload(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
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

              <div className="flex items-center justify-between gap-3 pt-3.5 pb-1 border-t border-slate-100 bg-white sticky bottom-0 -mx-1 px-1">
                {editingProduct ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteProduct(editingProduct.id, editingProduct.name, editingProduct.imageUrl);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer transition-colors flex items-center gap-1.5"
                    title="Bu ürünü kalıcı olarak sil"
                  >
                    <Trash2 size={14} />
                    <span>Ürünü Sil</span>
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex items-center gap-2">
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ÖZEL SİLME / AKSİYON ONAY MODALI */}
      {/* ========================================================= */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
                <Trash2 size={26} />
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1.5">
                {confirmDialog.title}
              </h3>

              {confirmDialog.targetName && (
                <div className="flex items-center justify-center gap-3 my-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 max-w-sm mx-auto">
                  {confirmDialog.imageUrl ? (
                    <img
                      src={confirmDialog.imageUrl}
                      alt={confirmDialog.targetName}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <Package size={18} />
                    </div>
                  )}
                  <span className="font-extrabold text-xs sm:text-sm text-slate-800 line-clamp-2 text-left">
                    {confirmDialog.targetName}
                  </span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {confirmDialog.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/80 border-t border-slate-100">
              <button
                type="button"
                disabled={isConfirmLoading}
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/70 cursor-pointer transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isConfirmLoading}
                onClick={async () => {
                  if (confirmDialog.onConfirm) {
                    await confirmDialog.onConfirm();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isConfirmLoading && <Loader2 size={14} className="animate-spin" />}
                <span>{confirmDialog.confirmText || 'Evet, Sil'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
