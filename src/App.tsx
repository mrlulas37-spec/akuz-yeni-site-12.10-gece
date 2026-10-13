import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { CategoryBar } from './components/CategoryBar';
import { PopularProducts } from './components/PopularProducts';
import { CatalogPage } from './components/CatalogPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { WhyAkuzSection } from './components/WhyAkuzSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { LegalModal } from './components/LegalModal';
import { SearchModal } from './components/SearchModal';
import { LoginPage } from './components/LoginPage';
import { ForgotPasswordPage } from './components/ForgotPasswordPage';
import { AccountPage } from './components/AccountPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { LegalPage, LegalDocId } from './components/LegalPage';
import { FavoritesPage } from './components/FavoritesPage';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { AdminPanel } from './components/AdminPanel';
import { PullToRefresh } from './components/PullToRefresh';
import { PageLoader } from './components/PageLoader';
import { FastAkuzLoader } from './components/FastAkuzLoader';
import { OrderTrackingPage } from './components/OrderTrackingPage';
import { PRODUCTS as INITIAL_PRODUCTS } from './data/products';
import { LogOut } from 'lucide-react';
import { Product, CartItem, UserProfile, Order, Review, SiteSettings, ProductColorOption } from './types';
import {
  updateUserProfileData,
  logoutUser,
  getRegisteredUsers,
  fetchCentralUsers,
  getUserSavedState,
  saveUserSavedState,
} from './utils/auth';
import { calculateItemUnitPrice } from './utils/pricingHelper';
import {
  getStoredSiteSettings,
  saveStoredSiteSettings,
  getStoredGlobalColors,
  saveStoredGlobalColors,
  INITIAL_SITE_SETTINGS,
  INITIAL_CATEGORY_CIRCLES,
  INITIAL_WHY_AKUZ_CARDS,
} from './utils/adminStore';
import { safeLocalStorageSet } from './utils/imageOptimizer';

function mergeSiteSettings(incoming: any, current: SiteSettings): SiteSettings {
  if (!incoming || typeof incoming !== 'object') return current;
  const categories = (Array.isArray(incoming.categories) && incoming.categories.length > 0)
    ? incoming.categories
    : (Array.isArray(current.categories) && current.categories.length > 0 ? current.categories : INITIAL_CATEGORY_CIRCLES);

  const whyAkuzCards = (Array.isArray(incoming.whyAkuzCards) && incoming.whyAkuzCards.length > 0)
    ? incoming.whyAkuzCards
    : (Array.isArray(current.whyAkuzCards) && current.whyAkuzCards.length > 0 ? current.whyAkuzCards : INITIAL_WHY_AKUZ_CARDS);

  const aboutParagraphs = (Array.isArray(incoming.aboutParagraphs) && incoming.aboutParagraphs.length > 0)
    ? incoming.aboutParagraphs
    : (Array.isArray(current.aboutParagraphs) && current.aboutParagraphs.length > 0 ? current.aboutParagraphs : INITIAL_SITE_SETTINGS.aboutParagraphs);

  return {
    ...INITIAL_SITE_SETTINGS,
    ...current,
    ...incoming,
    shippingFee:
      incoming.shippingFee !== undefined && !isNaN(Number(incoming.shippingFee))
        ? Number(incoming.shippingFee)
        : (current.shippingFee !== undefined && !isNaN(Number(current.shippingFee)) ? Number(current.shippingFee) : 39.9),
    freeShippingThreshold:
      incoming.freeShippingThreshold !== undefined && !isNaN(Number(incoming.freeShippingThreshold))
        ? Number(incoming.freeShippingThreshold)
        : (current.freeShippingThreshold !== undefined && !isNaN(Number(current.freeShippingThreshold)) ? Number(current.freeShippingThreshold) : 150),
    categories,
    whyAkuzCards,
    aboutParagraphs,
    availableFoilTypes: incoming.availableFoilTypes || current.availableFoilTypes || ['Mat', 'Parlak'],
    paytrSettings: {
      ...INITIAL_SITE_SETTINGS.paytrSettings,
      ...(current.paytrSettings || {}),
      ...(incoming.paytrSettings || {}),
    },
    kargonomiSettings: {
      ...INITIAL_SITE_SETTINGS.kargonomiSettings,
      ...(current.kargonomiSettings || {}),
      ...(incoming.kargonomiSettings || {}),
    },
    smtpSettings: {
      ...INITIAL_SITE_SETTINGS.smtpSettings,
      ...(current.smtpSettings || {}),
      ...(incoming.smtpSettings || {}),
    },
    contactEmail: 'akuzstickers@gmail.com',
  };
}

export default function App() {
  // "reload attığında ana sayfaya gelsin"
  // Kullanıcı adres çubuğuna /admin yazdığında doğrudan Admin Paneline girer
  // Normal sayfalarda sayfa yenilendiğinde (F5 veya reload) doğrudan ana sayfaya ('/') gelir
  const [currentPath, setCurrentPath] = useState<string>(() => {
    try {
      const pathname = window.location.pathname || '/';
      // Eğer kullanıcı /admin adresindeyse doğrudan Admin Paneline girsin (asla ana sayfaya zorlamaz)
      if (pathname === '/admin') {
        return '/admin';
      }

      const navEntries = performance.getEntriesByType('navigation');
      const isReload = (navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload')
        || Boolean(sessionStorage.getItem('akuz_force_home_reload'));

      if (isReload) {
        sessionStorage.removeItem('akuz_force_home_reload');
        if (pathname !== '/') {
          window.history.replaceState({}, '', '/');
        }
        return '/';
      }
    } catch {}
    return window.location.pathname || '/';
  });

  // Global Site Settings (Neden Akuz 4 kutu, Hakkımızda metni, İletişim, Kategori yuvarlakları)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    return getStoredSiteSettings();
  });

  // Global Colors (Stok durumu & Mat/Parlak folyo tipi yeteneği)
  const [globalColors, setGlobalColors] = useState<ProductColorOption[]>(() => {
    return getStoredGlobalColors();
  });

  // Dynamic Products state (persisted in localStorage so Admin additions/edits persist)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('akuz_dynamic_products');
      if (saved) {
        const parsed: Product[] = JSON.parse(saved);
        // Otomatik migrasyon: Eski /IMG_ veya /phonto yollarını /products/ altına çevir
        return parsed.map((p) => ({
          ...p,
          imageUrl: p.imageUrl?.startsWith('/IMG_') || p.imageUrl?.startsWith('/phonto') || p.imageUrl?.startsWith('/AkuzStickers_')
            ? `/products${p.imageUrl}`
            : p.imageUrl,
          images: p.images?.map((img) =>
            img.startsWith('/IMG_') || img.startsWith('/phonto') || img.startsWith('/AkuzStickers_')
              ? `/products${img}`
              : img
          ),
        }));
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Registered Users for Admin View
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    return getRegisteredUsers();
  });

  // Reviews state (persisted in localStorage, initially empty so all products start at 0)
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem('akuz_reviews');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Listen to browser popstate (back / forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentPath(path);
      if (path === '/') {
        setSelectedCategory('all');
        setSearchQuery('');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Host Merkezi Veritabanı ile senkronizasyon (Ürünler ve Ayarlar)
  useEffect(() => {
    // 1. Host DB'deki ürünleri çek
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      })
      .catch((e) => console.warn('[HOST DB] Ürünler çekilemedi, varsayılanlar kullanılıyor:', e));

    // 2. Host DB'deki ayarları çek
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSiteSettings((prev) => {
            const merged = mergeSiteSettings(data.settings, prev);
            saveStoredSiteSettings(merged);
            return merged;
          });
        }
      })
      .catch((e) => console.warn('[HOST DB] Ayarlar çekilemedi:', e));
  }, []);

  // Favorites state (persisted in localStorage)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('akuz_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Cart state (persisted in localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('akuz_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('akuz_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Orders state
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('akuz_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Admin veya kullanıcı oturumuna göre sipariş ve kullanıcı verilerini çek
  useEffect(() => {
    let isCancelled = false;

    if (currentPath === '/admin') {
      fetchCentralUsers('akuz_admin_2026').then((hostUsers) => {
        if (!isCancelled && hostUsers && hostUsers.length > 0) {
          setRegisteredUsers(hostUsers);
        }
      });

      fetch('/api/orders', {
        headers: { 'x-admin-token': 'akuz_admin_2026' },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled && data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
          }
        })
        .catch((e) => console.warn('[HOST DB] Admin siparişler çekilemedi:', e));
    } else if (currentUser?.email && !isLoggingOut && !isLoggingOutRef.current) {
      const emailToSync = currentUser.email.toLowerCase().trim();

      // 1. Profil ve kayıtlı teslimat adreslerini sunucudan senkronize et
      fetch('/api/user/profile?email=' + encodeURIComponent(emailToSync))
        .then((res) => res.json())
        .then((data) => {
          if (isCancelled || isLoggingOutRef.current) return;
          if (data.success && data.user) {
            setCurrentUser((prev) => {
              // Oturumu kapatılmış veya çıkış işlemi süren hesabı ASLA tekrar canlandırma
              if (!prev || isLoggingOutRef.current || prev.email.toLowerCase().trim() !== emailToSync) {
                return null;
              }
              const mergedAddresses = [...(data.user.addresses || [])];
              if (prev.addresses && Array.isArray(prev.addresses)) {
                for (const a of prev.addresses) {
                  if (!mergedAddresses.some((m) => m.fullAddress === a.fullAddress)) {
                    mergedAddresses.push(a);
                  }
                }
              }
              const updated = {
                ...prev,
                ...data.user,
                addresses: mergedAddresses,
                phone: data.user.phone || prev.phone,
              };
              try {
                localStorage.setItem('akuz_user', JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        })
        .catch((e) => console.warn('[HOST DB] Kullanıcı profili çekilemedi:', e));

      // 2. Müşteri siparişlerini sunucudan çek
      fetch('/api/orders?email=' + encodeURIComponent(emailToSync))
        .then((res) => res.json())
        .then((data) => {
          if (isCancelled || isLoggingOutRef.current) return;
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders);
            try {
              localStorage.setItem('akuz_orders', JSON.stringify(data.orders));
            } catch {}
          }
        })
        .catch((e) => console.warn('[HOST DB] Müşteri siparişleri çekilemedi:', e));
    }

    return () => {
      isCancelled = true;
    };
  }, [currentPath, currentUser?.email]);

  // Giriş yapıldıktan sonra dönülecek sayfa (varsayılan '/')
  const [returnPath, setReturnPath] = useState<string>(() => {
    try {
      return sessionStorage.getItem('akuz_auth_return_url') || '/';
    } catch {
      return '/';
    }
  });

  const navigateTo = (path: string) => {
    // Kullanıcı giriş veya şifre sayfasına giderken geldiği sayfayı kaydet
    if (path === '/giris' || path === '/login') {
      if (
        currentPath !== '/giris' &&
        currentPath !== '/login' &&
        currentPath !== '/hesap' &&
        currentPath !== '/sifre-yenile' &&
        currentPath !== '/sifremi-unuttum'
      ) {
        setReturnPath(currentPath);
        try {
          sessionStorage.setItem('akuz_auth_return_url', currentPath);
        } catch {}
      }
    }
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    if (path === '/') {
      setSearchQuery('');
      setSelectedCategory('all');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reload öncesi bayrağı kaydet
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('akuz_force_home_reload', 'true');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Aşağı çekince sayfayı ve verileri yenileme (Pull to Refresh) - Ana sayfaya ('/') döner
  const handlePullRefresh = async () => {
    navigateTo('/');
    try {
      // 1. Sunucudan en güncel ürünleri çek
      const prodRes = await fetch('/api/products').catch(() => null);
      if (prodRes && prodRes.ok) {
        const prodData = await prodRes.json().catch(() => null);
        if (prodData && prodData.success && Array.isArray(prodData.products) && prodData.products.length > 0) {
          setProducts(prodData.products);
          localStorage.setItem('akuz_dynamic_products', JSON.stringify(prodData.products));
        }
      }

      // 2. Sunucudan en güncel site ayarlarını çek
      const setRes = await fetch('/api/settings').catch(() => null);
      if (setRes && setRes.ok) {
        const setData = await setRes.json().catch(() => null);
        if (setData && setData.success && setData.settings) {
          setSiteSettings((prev) => {
            const merged = mergeSiteSettings(setData.settings, prev);
            saveStoredSiteSettings(merged);
            return merged;
          });
        }
      }

      // 3. Renk ve stokları yeniden oku
      setGlobalColors(getStoredGlobalColors());

      // 4. Oturuma göre siparişleri senkronize et
      if (currentPath === '/admin') {
        const ordRes = await fetch('/api/orders', {
          headers: { 'x-admin-token': 'akuz_admin_2026' },
        }).catch(() => null);
        if (ordRes && ordRes.ok) {
          const ordData = await ordRes.json().catch(() => null);
          if (ordData && ordData.success && Array.isArray(ordData.orders)) {
            setOrders(ordData.orders);
          }
        }
      } else if (currentUser?.email) {
        const ordRes = await fetch('/api/orders?email=' + encodeURIComponent(currentUser.email)).catch(() => null);
        if (ordRes && ordRes.ok) {
          const ordData = await ordRes.json().catch(() => null);
          if (ordData && ordData.success && Array.isArray(ordData.orders)) {
            setOrders(ordData.orders);
          }
        }
      }
    } catch (e) {
      console.warn('[PULL REFRESH FAILED]', e);
    }
  };

  // Logo tıklandığında veya dış tetiklemede arka planda sessiz veri yenileme
  useEffect(() => {
    const handleRefreshData = () => {
      handlePullRefresh();
    };
    window.addEventListener('akuz:refresh-data', handleRefreshData);
    return () => window.removeEventListener('akuz:refresh-data', handleRefreshData);
  }, [currentPath, currentUser]);

  // Search and Category state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Product['category'] | 'all'>('all');
  const [authPrefillEmail, setAuthPrefillEmail] = useState<string>('');

  // Recently Viewed Products state
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('akuz_recently_viewed');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals state (quick view modal removed as requested)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<string | null>(null);
  const [isFastLoading, setIsFastLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLoggingOutRef = useRef(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('akuz_favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem('akuz_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (currentUser && !isLoggingOutRef.current) {
      localStorage.setItem('akuz_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('akuz_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('akuz_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('akuz_recently_viewed', JSON.stringify(recentlyViewedIds));
  }, [recentlyViewedIds]);

  useEffect(() => {
    localStorage.setItem('akuz_reviews', JSON.stringify(reviews));
  }, [reviews]);

  // Oturum açmış kullanıcının sepet, favori ve baktığı ürünlerini hesabına kalıcı olarak senkronize et
  useEffect(() => {
    if (currentUser?.email && !isLoggingOut && !isLoggingOutRef.current) {
      saveUserSavedState(currentUser.email, cartItems, favoriteIds, recentlyViewedIds);
    }
  }, [cartItems, favoriteIds, recentlyViewedIds, currentUser?.email, isLoggingOut]);

  // Giriş yapan kullanıcının önceki kayıtlı sepet ve favorilerini yükle ve birleştir
  const handleUserLoggedIn = (user: UserProfile) => {
    setCurrentUser(user);

    const savedData = getUserSavedState(user.email);

    // Sepet birleştirme (Kullanıcı giriş yapmadan önce sepete ürün eklediyse onları korur)
    setCartItems((prevGuestCart) => {
      const userSavedCart = (savedData.cart || []) as CartItem[];
      if (userSavedCart.length === 0) return prevGuestCart;
      if (prevGuestCart.length === 0) return userSavedCart;

      const merged = [...userSavedCart];
      for (const gItem of prevGuestCart) {
        const existingIdx = merged.findIndex(
          (m) =>
            m.product.id === gItem.product.id &&
            m.selectedColor === gItem.selectedColor &&
            m.selectedDimension === gItem.selectedDimension &&
            m.selectedFinish === gItem.selectedFinish &&
            (m.customText || '') === (gItem.customText || '')
        );
        if (existingIdx !== -1) {
          merged[existingIdx].quantity += gItem.quantity;
        } else {
          merged.push(gItem);
        }
      }
      return merged;
    });

    // Favori birleştirme
    setFavoriteIds((prevGuestFavs) => {
      const userSavedFavs = savedData.favorites || [];
      return Array.from(new Set([...userSavedFavs, ...prevGuestFavs]));
    });

    // Baktığı ürünleri birleştirme
    if (savedData.recentlyViewed && savedData.recentlyViewed.length > 0) {
      setRecentlyViewedIds((prev) => {
        return Array.from(new Set([...savedData.recentlyViewed, ...prev])).slice(0, 15);
      });
    }

    // Siparişleri sunucudan çek
    fetch('/api/orders?email=' + encodeURIComponent(user.email))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
          localStorage.setItem('akuz_orders', JSON.stringify(data.orders));
        }
      })
      .catch((e) => console.warn('Could not fetch user orders on login', e));

    try {
      sessionStorage.removeItem('akuz_auth_return_url');
    } catch {}

    setReturnPath('/');
    navigateTo('/');
  };

  // Hesaptan çıkış: 2 saniyelik bildirim, verileri güvenle kaydet ve çıkış yap
  const handleLogout = () => {
    if (isLoggingOut || isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setIsLoggingOut(true);

    const userEmail = currentUser?.email;

    // 1. Kullanıcının mevcut sepet, favori ve baktığı ürünlerini çıkış yapmadan önce hesaba kalıcı olarak kaydet
    if (userEmail) {
      saveUserSavedState(userEmail, cartItems, favoriteIds, recentlyViewedIds);
    }

    // Hemen yerel depolamadaki aktif oturumu temizle (arka plan istekleri canlandıramasın)
    logoutUser();
    try {
      localStorage.removeItem('akuz_user');
      localStorage.removeItem('akuz_orders');
    } catch {}

    // 2. 2 saniye sonra hesaptan güvenle çık, state'i sıfırla ve ana sayfaya git
    setTimeout(() => {
      logoutUser();
      try {
        localStorage.removeItem('akuz_user');
        localStorage.removeItem('akuz_orders');
      } catch {}
      setCurrentUser(null);
      setCartItems([]);
      setFavoriteIds([]);
      setOrders([]);
      setIsLoggingOut(false);
      isLoggingOutRef.current = false;
      navigateTo('/');
    }, 2000);
  };

  const handleAddReview = (
    productId: string,
    userName: string,
    rating: number,
    comment: string
  ) => {
    const newRev: Review = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId,
      userName,
      rating,
      comment,
      date: new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
    setReviews((prev) => [newRev, ...prev]);
  };

  // Synchronize dynamic products and settings to storage
  useEffect(() => {
    safeLocalStorageSet('akuz_dynamic_products', JSON.stringify(products));
  }, [products]);

  const handleUpdateProducts = (updated: Product[]) => {
    setProducts(updated);
    safeLocalStorageSet('akuz_dynamic_products', JSON.stringify(updated));
    // Host merkezi veritabanına kaydet
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: updated }),
    }).catch((e) => console.warn('[HOST DB] Ürünler sunucuya kaydedilemedi:', e));
  };

  const handleUpdateSiteSettings = (settings: SiteSettings) => {
    setSiteSettings(settings);
    saveStoredSiteSettings(settings);
    // Host merkezi veritabanına ayarları kaydet
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    }).catch((e) => console.warn('[HOST DB] Ayarlar sunucuya kaydedilemedi:', e));
  };

  const handleUpdateGlobalColors = (colors: ProductColorOption[]) => {
    setGlobalColors(colors);
    saveStoredGlobalColors(colors);
    // Ürünlerdeki renk seçeneklerini de global renklerle senkronize et
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        colors: colors,
      }))
    );
  };

  // Determine current active product by slug if URL is /:slug
  const activeProductSlug = useMemo(() => {
    const reservedPaths = [
      '/',
      '/admin',
      '/katalog',
      '/favoriler',
      '/favorilerim',
      '/hesap',
      '/hesabim',
      '/siparislerim',
      '/giris',
      '/login',
      '/sifre-yenile',
      '/sifremi-unuttum',
      '/hakkimizda',
      '/iletisim',
      '/kvkk',
      '/gizlilik-politikasi',
      '/gizlilik',
      '/kullanim-kosullari',
      '/kullanim',
      '/mesafeli-satis-sozlesmesi',
      '/mesafeli-satis',
      '/iptal-ve-iade',
      '/iade',
      '/cerez-politikasi',
      '/cerez',
    ];
    if (reservedPaths.includes(currentPath) || currentPath.startsWith('/yasal')) {
      return null;
    }
    // e.g. "/akuz-orijinal-logo-sticker" or "/ataturk-imza"
    return currentPath.replace(/^\//, '');
  }, [currentPath]);

  const currentProduct = useMemo(() => {
    if (!activeProductSlug) return null;
    return (
      products.find((p) => p.slug === activeProductSlug) ||
      products.find((p) => p.id === activeProductSlug) ||
      products[0] // fallback if route doesn't match
    );
  }, [activeProductSlug, products]);

  // Record viewed product into recentlyViewedIds
  useEffect(() => {
    if (currentProduct) {
      setRecentlyViewedIds((prev) => {
        const filtered = prev.filter((id) => id !== currentProduct.id);
        return [currentProduct.id, ...filtered].slice(0, 10);
      });
    }
  }, [currentProduct]);

  // Recently viewed product models
  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [recentlyViewedIds, products]);

  // Popular products always shown on Home page (independent of catalog filter)
  const popularProducts = useMemo(() => {
    return products.filter((p) => p.isPopular);
  }, [products]);

  // Filter products by category and search query for Home page fallback/search
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category filter
      if (selectedCategory === 'discount') {
        if (!product.isDiscounted) return false;
      } else if (selectedCategory !== 'all') {
        if (product.category !== selectedCategory) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory) return false;
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Favorite products list
  const favoriteProducts = useMemo(() => {
    return products.filter((p) => favoriteIds.includes(p.id));
  }, [favoriteIds, products]);

  // Handlers
  const handleToggleFavorite = (product: Product) => {
    setFavoriteIds((prev) =>
      prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
    );
  };

  const handleAddToCart = (
    product: Product,
    quantity = 1,
    color?: string,
    dimension?: string,
    finish?: 'Mat' | 'Parlak',
    customText?: string,
    customFont?: string
  ) => {
    const selectedColor = color || product.colors[0]?.name || 'Orijinal Renkli';
    const selectedDimension = dimension || product.dimensions[0] || 'Standart';
    const selectedFinish = finish || 'Parlak';
    const calculatedPrice = calculateItemUnitPrice(product, selectedDimension, customText);

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedDimension === selectedDimension &&
          item.selectedFinish === selectedFinish &&
          item.customText === customText &&
          item.customFont === customFont
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        updated[existingIdx].calculatedPrice = calculatedPrice;
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity,
            selectedColor,
            selectedDimension,
            selectedFinish,
            customText,
            customFont,
            calculatedPrice,
          },
        ];
      }
    });

    // Open Cart Drawer
    setIsCartDrawerOpen(true);
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleOpenFavorites = () => {
    navigateTo('/favoriler');
  };

  const handleScrollToTop = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    if (currentPath !== '/') {
      navigateTo('/');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigates directly to the dedicated product URL page instantly
  const handleSelectProduct = (product: Product) => {
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== product.id);
      return [product.id, ...filtered].slice(0, 15);
    });
    navigateTo(`/${product.slug}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // When clicking categories in header or "Tümünü Gör", redirect to /katalog instantly
  const handleSelectCategoryAndNavigate = (cat: Product['category'] | 'all') => {
    setSelectedCategory(cat);
    navigateTo('/katalog');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ec] text-slate-800 font-sans selection:bg-[#ff0055] selection:text-white overflow-x-clip w-full">
      
      {/* 0. GİRİŞ YÜKLENME ANİMASYONU (Renksizden su dolar gibi renklenen logo animasyonu) */}
      <PageLoader />

      {/* 0.0 HIZLI AKUZ YÜKLENME SİMGESİ (1 sn, akuz yazısı, ürün veya yuvarlak tıklandığında) */}
      <FastAkuzLoader
        isVisible={isFastLoading}
        onFinished={() => setIsFastLoading(false)}
        message="AKUZ Yükleniyor..."
      />

      {/* 0.1 PULL TO REFRESH (Aşağı çekince sayfayı yenileme özelliği) */}
      <PullToRefresh
        onRefresh={handlePullRefresh}
        disabled={isSearchModalOpen || isCartDrawerOpen || Boolean(legalDocType) || isFastLoading}
      />

      {/* 1. ÜST PANEL (HEADER - Admin panelindeyken mağaza üst çubuğu gizlenir) */}
      {currentPath !== '/admin' && (
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          favoritesCount={favoriteIds.length}
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          currentUser={currentUser}
          onOpenAuth={() => navigateTo('/giris')}
          onOpenAccount={(tab?: 'orders' | 'profile' | 'addresses' | 'password') => {
            if (tab === 'addresses') navigateTo('/adreslerim');
            else if (tab === 'password') navigateTo('/sifre-degistir');
            else if (tab === 'orders') navigateTo('/siparislerim');
            else navigateTo('/hesap');
          }}
          onOpenOrders={() => {
            navigateTo('/siparislerim');
          }}
          onOpenOrderTracking={() => {
            navigateTo('/siparis-sorgula');
          }}
          onLogout={handleLogout}
          onOpenFavorites={handleOpenFavorites}
          onOpenCart={() => setIsCartDrawerOpen(true)}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onScrollToTop={() => {
            if (currentPath !== '/') {
              navigateTo('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              handleScrollToTop();
              window.dispatchEvent(new CustomEvent('akuz:play-loader'));
            }
          }}
          currentPath={currentPath}
          onNavigateToCatalog={(q) => {
            if (q) setSearchQuery(q);
            navigateTo('/katalog');
          }}
          products={products}
          recentlyViewedProducts={recentlyViewedProducts}
          onSelectProduct={handleSelectProduct}
          onSelectCategory={handleSelectCategoryAndNavigate}
          siteSettings={siteSettings}
        />
      )}

      {/* 2. SAYFA İÇERİĞİ: ADMİN PANELİ / SEPET / ÖDEME / HESAP / KATALOG / DETAY vb. */}
      {currentPath === '/admin' ? (
        <main className="flex-1">
          <AdminPanel
            products={products}
            onUpdateProducts={handleUpdateProducts}
            siteSettings={siteSettings}
            onUpdateSiteSettings={handleUpdateSiteSettings}
            globalColors={globalColors}
            onUpdateGlobalColors={handleUpdateGlobalColors}
            orders={orders}
            onUpdateOrders={(updated) => setOrders(updated)}
            users={registeredUsers}
            onNavigateHome={() => navigateTo('/')}
            onNavigateToCatalog={() => navigateTo('/katalog')}
          />
        </main>
      ) : currentPath === '/sepet' || currentPath === '/sepetim' ? (
        <main className="flex-1">
          <CartPage
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateCartQty}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onProceedToCheckout={() => navigateTo('/odeme')}
            onGoHome={() => navigateTo('/')}
            onNavigateToCatalog={() => navigateTo('/katalog')}
            allProducts={products}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectProduct={handleSelectProduct}
            reviews={reviews}
            siteSettings={siteSettings}
          />
        </main>
      ) : currentPath === '/odeme' || currentPath === '/kargo' || currentPath === '/teslimat' ? (
        <main className="flex-1">
          <CheckoutPage
            cartItems={cartItems}
            currentUser={currentUser}
            siteSettings={siteSettings}
            onGoBackToCart={() => navigateTo('/sepet')}
            onGoHome={() => navigateTo('/')}
            onViewOrders={() => navigateTo(currentUser ? '/hesap' : '/giris')}
            onOpenAuth={() => navigateTo('/giris')}
            onPlaceOrder={(newOrder) => {
              setOrders((prev) => [newOrder, ...prev]);
              setCartItems([]);
            }}
          />
        </main>
      ) : currentPath === '/hesap' || currentPath === '/hesabim' || currentPath === '/siparislerim' || currentPath === '/adreslerim' || currentPath === '/sifre-degistir' ? (
        <main className="flex-1">
          <AccountPage
            user={currentUser}
            initialTab={
              currentPath === '/siparislerim'
                ? 'orders'
                : currentPath === '/adreslerim'
                ? 'addresses'
                : currentPath === '/sifre-degistir'
                ? 'password'
                : 'profile'
            }
            onUpdateUser={(updated) => {
              setCurrentUser(updated);
              updateUserProfileData(updated);
            }}
            onLogout={handleLogout}
            orders={orders}
            onGoHome={() => navigateTo('/')}
          />
        </main>
      ) : currentPath === '/sifre-yenile' || currentPath === '/sifremi-unuttum' ? (
        <main className="flex-1">
          <ForgotPasswordPage
            initialEmail={authPrefillEmail}
            onBackToLogin={() => navigateTo('/giris')}
            onGoHome={() => navigateTo('/')}
          />
        </main>
      ) : currentPath === '/giris' || currentPath === '/login' ? (
        <main className="flex-1">
          <LoginPage
            currentUser={currentUser}
            returnPath={returnPath}
            initialEmail={authPrefillEmail}
            onLoginSuccess={handleUserLoggedIn}
            onGoHome={() => navigateTo('/')}
            onForgotPassword={(email) => {
              setAuthPrefillEmail(email);
              navigateTo('/sifre-yenile');
            }}
          />
        </main>
      ) : currentPath === '/hakkimizda' ? (
        <main className="flex-1">
          <AboutPage
            onGoHome={() => navigateTo('/')}
            onNavigateToCatalog={() => navigateTo('/katalog')}
          />
        </main>
      ) : currentPath === '/iletisim' ? (
        <main className="flex-1">
          <ContactPage
            onGoHome={() => navigateTo('/')}
            email={siteSettings.contactEmail}
            whatsapp={siteSettings.contactWhatsApp}
            address={siteSettings.contactAddress}
          />
        </main>
      ) : currentPath === '/siparis-sorgula' || currentPath === '/siparis-takip' ? (
        <main className="flex-1">
          <OrderTrackingPage
            orders={orders}
            onGoHome={() => navigateTo('/')}
            onNavigateToCatalog={() => navigateTo('/katalog')}
          />
        </main>
      ) : currentPath === '/kvkk' ? (
        <main className="flex-1">
          <LegalPage
            docId="kvkk"
            onGoHome={() => navigateTo('/')}
          />
        </main>
      ) : currentPath === '/gizlilik-politikasi' || currentPath === '/gizlilik' ? (
        <main className="flex-1">
          <LegalPage
            docId="gizlilik"
            onGoHome={() => navigateTo('/')}
          />
        </main>
      ) : currentPath === '/kullanim-kosullari' || currentPath === '/kullanim' ? (
        <main className="flex-1">
          <LegalPage
            docId="kullanim"
            onGoHome={() => navigateTo('/')}
          />
        </main>
      ) : currentPath === '/mesafeli-satis-sozlesmesi' || currentPath === '/mesafeli-satis' ? (
        <main className="flex-1">
          <LegalPage
            docId="mesafeli_satis"
            onGoHome={() => navigateTo('/')}
          />
        </main>
      ) : currentPath === '/iptal-ve-iade' || currentPath === '/iade' ? (
        <main className="flex-1">
          <LegalPage
            docId="iade"
            onGoHome={() => navigateTo('/')}
          />
        </main>
      ) : currentPath === '/cerez-politikasi' || currentPath === '/cerez' ? (
        <main className="flex-1">
          <LegalPage
            docId="cerez"
            onGoHome={() => navigateTo('/')}
          />
        </main>
      ) : currentPath.startsWith('/yasal') ? (
        <main className="flex-1">
          <LegalPage
            docId={
              (currentPath.split('/')[2] as LegalDocId) || 'kvkk'
            }
            onGoHome={() => navigateTo('/')}
          />
        </main>
      ) : currentProduct && activeProductSlug ? (
        <main className="flex-1">
          <ProductDetailPage
            product={currentProduct}
            allProducts={products}
            favoriteIds={favoriteIds}
            recentlyViewedProducts={recentlyViewedProducts}
            reviews={reviews}
            currentUser={currentUser}
            onOpenAuth={() => navigateTo('/giris')}
            isFavorite={favoriteIds.includes(currentProduct.id)}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onAddReview={handleAddReview}
            onSelectProduct={handleSelectProduct}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                navigateTo('/katalog');
              }
            }}
          />
        </main>
      ) : currentPath === '/katalog' ? (
        <main className="flex-1">
          <CatalogPage
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
            }}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectProduct={handleSelectProduct}
            onGoHome={() => {
              setSelectedCategory('all');
              navigateTo('/');
            }}
          />
        </main>
      ) : currentPath === '/favoriler' || currentPath === '/favorilerim' ? (
        <main className="flex-1">
          <FavoritesPage
            favoriteProducts={favoriteProducts}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onRemoveFavorite={(id) => {
              const product = products.find((p) => p.id === id);
              if (product) handleToggleFavorite(product);
            }}
            onAddToCart={handleAddToCart}
            onSelectProduct={handleSelectProduct}
            onGoHome={() => navigateTo('/')}
            onNavigateToCatalog={() => navigateTo('/katalog')}
          />
        </main>
      ) : (
        <main className="flex-1">
          {/* KATEGORİLER VE KAMPANYALAR ÇUBUĞU */}
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => handleSelectCategoryAndNavigate(cat)}
            categoriesConfig={siteSettings.categories}
          />

          {/* POPÜLER ÜRÜNLER ALANI - Her zaman Popüler Ürünler Listesi */}
          <PopularProducts
            products={popularProducts}
            favoriteIds={favoriteIds}
            reviews={reviews}
            onToggleFavorite={handleToggleFavorite}
            onSelectProduct={handleSelectProduct}
            onViewAllClick={() => handleSelectCategoryAndNavigate('all')}
            title="POPÜLER ÜRÜNLER"
          />

          {/* NEDEN AKUZ STICKERS? (4 Kutu) */}
          <WhyAkuzSection cards={siteSettings.whyAkuzCards} />

          {/* HAKKIMIZDA BÖLÜMÜ */}
          <AboutSection paragraphs={siteSettings.aboutParagraphs} />

          {/* İLETİŞİM BÖLÜMÜ */}
          <ContactSection
            description={siteSettings.contactDescription}
            email={siteSettings.contactEmail}
            whatsapp={siteSettings.contactWhatsApp}
            address={siteSettings.contactAddress}
          />
        </main>
      )}

      {/* 3. EN ALT KISIM (FOOTER - Admin panelindeyken gizlenir) */}
      {currentPath !== '/admin' && (
        <Footer
          onOpenLegal={(type) => setLegalDocType(type)}
          onScrollToTop={handleScrollToTop}
          onNavigateToCatalog={() => navigateTo('/katalog')}
          onNavigate={(path) => navigateTo(path)}
        />
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={products}
        recentlyViewedProducts={recentlyViewedProducts}
        onSelectProduct={(p) => {
          setIsSearchModalOpen(false);
          handleSelectProduct(p);
        }}
        onViewAllProducts={(customQuery) => {
          if (customQuery !== undefined) {
            setSearchQuery(customQuery);
          }
          navigateTo('/katalog');
        }}
      />

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        siteSettings={siteSettings}
        onGoToCartPage={() => {
          setIsCartDrawerOpen(false);
          navigateTo('/sepet');
        }}
      />

      {legalDocType && (
        <LegalModal
          isOpen={true}
          onClose={() => setLegalDocType(null)}
          documentType={legalDocType}
        />
      )}

      {/* HESAPTAN ÇIKIŞ YAPILIYOR BİLDİRİMİ (2 Saniye Ekranda Kalır) */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md px-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 transform animate-scaleUp">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 animate-pulse">
              <LogOut size={30} className="translate-x-0.5 text-white" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1.5">
              Çıkış Yapılıyor...
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
              Hesabınızdan güvenle çıkış yapılıyor, sepetiniz ve favorileriniz hesabınıza kaydedildi. Lütfen bekleyin...
            </p>

            {/* 2 Saniyelik Animasyonlu İlerleme Çubuğu */}
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-[#ff0055] via-[#ff6600] to-amber-500 rounded-full animate-logout-progress" />
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-[11px] font-bold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              <span>Oturum sonlandırılıyor</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
