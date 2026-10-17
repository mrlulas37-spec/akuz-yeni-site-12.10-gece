import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { CategoryBar } from './components/CategoryBar';
import { PopularProducts } from './components/PopularProducts';
import { ProductCard } from './components/ProductCard';
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
import { LogOut, Check, ShoppingBag, X } from 'lucide-react';
import { Product, CartItem, UserProfile, Order, Review, SiteSettings, ProductColorOption, CategoryCircleItem } from './types';
import {
  updateUserProfileData,
  logoutUser,
  normalizeUserProfile,
  RegisteredAccount,
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

  const incomingCats: CategoryCircleItem[] = Array.isArray(incoming.categories) && incoming.categories.length > 0
    ? incoming.categories
    : [];
  const currentCats: CategoryCircleItem[] = Array.isArray(current.categories) && current.categories.length > 0
    ? current.categories
    : INITIAL_CATEGORY_CIRCLES;

  const categories = INITIAL_CATEGORY_CIRCLES.map((baseCat) => {
    const inc = incomingCats.find((c) => c.id === baseCat.id);
    const cur = currentCats.find((c) => c.id === baseCat.id);
    const finalImageUrl = inc?.imageUrl !== undefined ? inc.imageUrl : (cur?.imageUrl !== undefined ? cur.imageUrl : baseCat.imageUrl);
    const finalCardImageUrl = inc?.cardImageUrl || cur?.cardImageUrl || baseCat.cardImageUrl;
    return {
      ...baseCat,
      ...(cur || {}),
      ...(inc || {}),
      imageUrl: finalImageUrl,
      cardImageUrl: finalCardImageUrl,
    };
  });

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

// Kullanıcı veya misafir için benzersiz ve kalıcı kimlik belirteci
export function getClientIdentifier(email?: string): string {
  if (email && email.trim()) return email.toLowerCase().trim();
  try {
    let id = localStorage.getItem('akuz_client_id');
    if (!id) {
      id = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('akuz_client_id', id);
    }
    return id;
  } catch {
    return 'client_default';
  }
}

export default function App() {

  // Kullanıcı İsteği: Yukarıdan aşağı kaydırınca veya reload atıldığında ana sayfaya atmasın, bulunulan sayfayı yenilesin
  const [currentPath, setCurrentPath] = useState<string>(() => {
    try {
      return window.location.pathname || '/';
    } catch {
      return '/';
    }
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

  // Registered Users for Admin View (Başlangıçta tamamen boş)
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredAccount[]>(() => {
    return [];
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
          const serverProducts: Product[] = data.products;
          const localSaved = localStorage.getItem('akuz_dynamic_products');
          let mergedProducts = serverProducts;
          if (localSaved) {
            try {
              const localList: Product[] = JSON.parse(localSaved);
              if (Array.isArray(localList)) {
                const missingLocals = localList.filter(
                  (lp) => !serverProducts.some((sp) => sp.id === lp.id || sp.slug === lp.slug)
                );
                if (missingLocals.length > 0) {
                  mergedProducts = [...missingLocals, ...serverProducts];
                  // Eksik yerel ürünleri sunucuya da göndererek kalıcı hale getir
                  fetch('/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ products: mergedProducts }),
                  }).catch(() => {});
                }
              }
            } catch {}
          }
          setProducts(mergedProducts);
          safeLocalStorageSet('akuz_dynamic_products', JSON.stringify(mergedProducts));
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
      const saved = localStorage.getItem('currentUser') || localStorage.getItem('akuz_user');
      return saved ? normalizeUserProfile(JSON.parse(saved)) : null;
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

  // Sunucudan yedekli sepet ve favorileri otomatik geri yükle (Dosya veya tarayıcı belleği silinse dahi sunucudan kurtarır)
  useEffect(() => {
    const id = getClientIdentifier(currentUser?.email);
    fetch(`/api/cart.php?userId=${encodeURIComponent(id)}&action=list`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success || data.status === 'success') {
          const incomingCart = data.cart || data.items;
          if (Array.isArray(incomingCart) && incomingCart.length > 0) {
            setCartItems((prev) => (prev.length === 0 ? incomingCart : prev));
          }
          if (Array.isArray(data.favorites) && data.favorites.length > 0) {
            setFavoriteIds((prev) => (prev.length === 0 ? data.favorites : Array.from(new Set([...prev, ...data.favorites]))));
          }
        }
      })
      .catch((err) => console.warn('[CART/FAV RESTORE NOTE]', err));
  }, [currentUser?.email]);

  // Admin veya kullanıcı oturumuna göre sipariş ve kullanıcı verilerini çek
  useEffect(() => {
    let isCancelled = false;

    if (currentPath === '/admin') {
      fetchCentralUsers('akuz_admin_2026').then((hostUsers) => {
        if (!isCancelled) {
          setRegisteredUsers(hostUsers || []);
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
  const [cartToast, setCartToast] = useState<{
    productName: string;
    productPrice: number;
    quantity: number;
  } | null>(null);
  const cartToastTimerRef = useRef<any>(null);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('akuz_favorites', JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    localStorage.setItem('akuz_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (currentUser && !isLoggingOutRef.current) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      localStorage.setItem('akuz_user', JSON.stringify(currentUser));
    } else if (!currentUser && isLoggingOutRef.current) {
      localStorage.removeItem('currentUser');
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
    const normalized = normalizeUserProfile(user);
    setCurrentUser(normalized);
    try {
      localStorage.setItem('currentUser', JSON.stringify(normalized));
      localStorage.setItem('akuz_user', JSON.stringify(normalized));
    } catch {}

    const savedData = getUserSavedState(normalized.email);
    const userSavedCart = (Array.isArray(user.cart) && user.cart.length > 0)
      ? user.cart
      : ((savedData.cart || []) as CartItem[]);
    const userSavedFavs = (Array.isArray(user.favorites) && user.favorites.length > 0)
      ? user.favorites
      : (savedData.favorites || []);

    let finalMergedCart: CartItem[] = [];
    let finalMergedFavs: string[] = [];

    // Sepet birleştirme (Kullanıcı giriş yapmadan önce sepete ürün eklediyse onları korur)
    setCartItems((prevGuestCart) => {
      if (userSavedCart.length === 0) {
        finalMergedCart = prevGuestCart;
        return prevGuestCart;
      }
      if (prevGuestCart.length === 0) {
        finalMergedCart = userSavedCart;
        return userSavedCart;
      }

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
      finalMergedCart = merged;
      return merged;
    });

    // Favori birleştirme
    setFavoriteIds((prevGuestFavs) => {
      const mergedFavs = Array.from(new Set([...userSavedFavs, ...prevGuestFavs]));
      finalMergedFavs = mergedFavs;
      return mergedFavs;
    });

    // Anında MySQL ve sunucuya birleşik halini kaydet
    setTimeout(() => {
      if (finalMergedCart.length > 0) {
        syncCartToServerDirectly(finalMergedCart);
      }
      if (finalMergedFavs.length > 0) {
        syncFavoritesToServerDirectly(finalMergedFavs);
      }
    }, 150);

    // Baktığı ürünleri birleştirme
    if (savedData.recentlyViewed && savedData.recentlyViewed.length > 0) {
      setRecentlyViewedIds((prev) => {
        return Array.from(new Set([...savedData.recentlyViewed, ...prev])).slice(0, 15);
      });
    }

    // Siparişleri sunucudan çek
    fetch('/api/orders?email=' + encodeURIComponent(normalized.email))
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

    // Hemen yerel depolamadaki aktif oturumu temizle (currentUser ve akuz_user sıfırla)
    logoutUser();
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('akuz_user');
      localStorage.removeItem('akuz_orders');
    } catch {}

    // 2. 2 saniye sonra hesaptan güvenle çık, state'i sıfırla ve ana sayfaya git
    setTimeout(() => {
      logoutUser();
      try {
        localStorage.removeItem('currentUser');
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

  // Sunucuya sepet senkronizasyonunu anında fırlatan fonksiyon (MySQL ve kalıcı sunucu depolaması)
  const syncCartToServerDirectly = (cartToSync: CartItem[]) => {
    const userEmail = (currentUser?.email || '').trim().toLowerCase();
    const clientId = getClientIdentifier();
    const primaryId = userEmail || clientId;

    fetch('/api/cart.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync',
        userId: primaryId,
        user_id: primaryId,
        email: userEmail,
        cart: cartToSync,
        items: cartToSync,
      }),
    }).catch((err) => console.warn('[CART SYNC ERROR]', err));

    // MySQL users tablosundaki cart sütununu anında güncellemesi için auth.php'ye de bildir
    if (userEmail) {
      fetch('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          email: userEmail,
          cart: cartToSync,
        }),
      }).catch(() => {});
    }
  };

  // Sunucuya favori senkronizasyonunu anında fırlatan fonksiyon (MySQL ve kalıcı sunucu depolaması)
  const syncFavoritesToServerDirectly = (favsToSync: string[], action = 'sync', productId?: string) => {
    const userEmail = (currentUser?.email || '').trim().toLowerCase();
    const clientId = getClientIdentifier();
    const primaryId = userEmail || clientId;

    fetch('/api/favorites.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync',
        userId: primaryId,
        user_id: primaryId,
        email: userEmail,
        favorites: favsToSync,
        items: favsToSync,
        productId,
      }),
    }).catch((err) => console.warn('[FAVORITES SYNC ERROR]', err));

    // MySQL users tablosundaki favorites sütununu anında güncellemesi için auth.php'ye de bildir
    if (userEmail) {
      fetch('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          email: userEmail,
          favorites: favsToSync,
        }),
      }).catch(() => {});
    }
  };

  // Handlers
  const handleToggleFavorite = (product: Product) => {
    setFavoriteIds((prev) => {
      const isCurrentlyFav = prev.includes(product.id);
      const updated = isCurrentlyFav
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id];
      // Favoriden ürün çıkarılırsa veya eklenirse veritabanında da direkt güncellensin
      syncFavoritesToServerDirectly(updated, isCurrentlyFav ? 'remove' : 'add', product.id);
      return updated;
    });
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

      let updated: CartItem[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx].quantity += quantity;
        updated[existingIdx].calculatedPrice = calculatedPrice;
      } else {
        updated = [
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
      // Sepete ürün eklendiğinde doğrudan sunucu veri deposuna anında kaydet
      syncCartToServerDirectly(updated);
      return updated;
    });

    if (cartToastTimerRef.current) {
      clearTimeout(cartToastTimerRef.current);
    }
    setCartToast({
      productName: product.name,
      productPrice: calculatedPrice * quantity,
      quantity,
    });
    cartToastTimerRef.current = setTimeout(() => {
      setCartToast(null);
    }, 3500);
  };

  const handleUpdateCartQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    setCartItems((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], quantity: newQty };
      }
      // Adet değiştiğinde sunucu verisinde direkt anında güncelle
      syncCartToServerDirectly(updated);
      return updated;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Sepetten ürün çıkarıldığında sunucu verisinde direkt anında güncellensin
      syncCartToServerDirectly(updated);
      return updated;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    syncCartToServerDirectly([]);
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

  const categoryTitles: Record<string, string> = {
    all: 'TÜM ÜRÜNLER',
    discount: 'İNDİRİMLİ FIRSATLAR',
    ataturk: 'ATATÜRK STİCKERLARI',
    araba: 'ARABA STİCKERLARI',
    motosiklet: 'MOTOSİKLET STİCKERLARI',
    custom: 'KİŞİYE ÖZEL STİCKERLAR',
    offroad: '4x4 OFF-ROAD STİCKERLARI',
    ayna: 'AYNA STİCKERLARI',
  };

  // Kullanıcı İsteği: Yuvarlakların hangisine tıklandıysa ayrı bir sayfada sadece onun ürünleri gözüksün (anasayfada altta çıkmasın)
  const handleSelectCategory = (cat: Product['category'] | 'all') => {
    setSelectedCategory(cat);
    navigateTo('/katalog');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // When clicking categories in header or "Tümünü Gör", redirect to /katalog instantly
  const handleSelectCategoryAndNavigate = (cat: Product['category'] | 'all') => {
    setSelectedCategory(cat);
    navigateTo('/katalog');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3ec] text-slate-800 font-sans selection:bg-[#ff6600] selection:text-white overflow-x-clip w-full">
      
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
          onSelectCategory={handleSelectCategory}
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
            onUpdateUsers={(updated) => setRegisteredUsers(updated)}
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
      ) : currentPath === '/katalog' || currentPath.startsWith('/kategori') ? (
        <main className="flex-1">
          <CatalogPage
            products={products}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
            }}
            categoriesConfig={siteSettings.categories}
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

          {/* İLETİŞİM BÖLÜMÜ - Kategoriler Sayfasının Altında (Ana Sayfadaki Gibi) */}
          <ContactSection
            description={siteSettings.contactDescription}
            email={siteSettings.contactEmail}
            whatsapp={siteSettings.contactWhatsApp}
            address={siteSettings.contactAddress}
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
          {/* KATEGORİLER VE KAMPANYALAR ÇUBUĞU (8 Adet Dairesel Kategori - Tıklanınca Ayrı Sayfada Gösterir) */}
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => handleSelectCategoryAndNavigate(cat)}
            categoriesConfig={siteSettings.categories}
          />

          {/* POPÜLER ÜRÜNLER ALANI - Ana Sayfa Vitrini */}
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

      {/* SEPETE EKLENDİ BİLDİRİMİ (Yandaki panel otomatik açılmaz, zarif floating bildirim gösterilir) */}
      {cartToast && (
        <div className="fixed bottom-5 right-4 left-4 sm:left-auto sm:right-6 z-[9990] max-w-sm w-full bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-800 p-3.5 backdrop-blur-md animate-slideUp">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
                <Check size={18} className="stroke-[3]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                    Sepete Eklendi
                  </span>
                  {cartToast.quantity > 1 && (
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-bold">
                      {cartToast.quantity} Adet
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-white truncate max-w-[190px] sm:max-w-[210px] mt-0.5">
                  {cartToast.productName}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  ₺{cartToast.productPrice.toFixed(2).replace('.', ',')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCartToast(null);
                  setIsCartDrawerOpen(true);
                }}
                className="px-3 py-1.5 bg-[#ff6600] hover:bg-[#e65c00] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <ShoppingBag size={13} />
                <span>Sepet</span>
              </button>
              <button
                type="button"
                onClick={() => setCartToast(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
