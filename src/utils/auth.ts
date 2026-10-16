import { UserProfile } from '../types';

export interface RegisteredAccount {
  name: string;
  email: string;
  full_name?: string;
  address?: string;
  passwordHash?: string;
  plainPassword?: string;
  phone?: string;
  createdAt: string;
  addresses?: UserProfile['addresses'];
  cart?: any[];
  favorites?: string[];
  recentlyViewed?: string[];
}

const STORAGE_KEY = 'akuz_registered_users';
const CURRENT_USER_KEY = 'currentUser';
const LEGACY_USER_KEY = 'akuz_user';
export const API_AUTH_URL = '/api/auth.php';
export const API_GOOGLE_AUTH_URL = '/api/google_auth.php';
export const API_CART_URL = '/api/cart.php';

// Kullanıcı profil verisini frontend ile %100 uyumlu normalize eder
export const normalizeUserProfile = (raw: any): UserProfile => {
  if (!raw) {
    return { name: '', email: '', phone: '', addresses: [] };
  }
  const name = raw.full_name || raw.name || (raw.email ? raw.email.split('@')[0] : '');
  const email = (raw.email || '').trim().toLowerCase();
  const phone = raw.phone || '';
  let addresses = Array.isArray(raw.addresses) ? raw.addresses : [];
  const addressText = raw.address || raw.fullAddress || raw.full_address || '';

  if (addresses.length === 0 && addressText) {
    addresses = [
      {
        id: 'addr-default',
        title: 'Kayıtlı Adresim',
        recipientName: name,
        phone,
        city: raw.city || 'Bursa',
        district: raw.district || 'Nilüfer',
        fullAddress: addressText,
        isDefault: true,
      },
    ];
  }

  return {
    name,
    email,
    phone,
    addresses,
    address: addressText || (addresses[0]?.fullAddress ?? ''),
    full_name: name,
    cart: raw.cart,
    favorites: raw.favorites,
    recentlyViewed: raw.recentlyViewed,
  };
};

// Initial preloaded accounts (Tüm kullanıcı kayıtları temizlendi)
const INITIAL_USERS: RegisteredAccount[] = [];

// Merkezi Sunucu DB'sinden kullanıcıları çek (Admin yetkisiyle)
export const fetchCentralUsers = async (adminToken = 'akuz_admin_2026'): Promise<RegisteredAccount[]> => {
  try {
    const res = await fetch('/api/users', {
      headers: {
        'x-admin-token': adminToken,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        // Sunucu tam yetkilidir; sunucudan gelen gerçek kullanıcı listesini kaydet
        saveRegisteredUsers(data.users);
        return data.users;
      }
    }
  } catch (err) {
    console.warn('[AUTH] Host DB fetch failed:', err);
  }
  return getRegisteredUsers();
};

// Tüm kullanıcı kayıtlarını hem sunucudan hem tarayıcıdan tamamen silme
export const purgeAllRegisteredUsers = async (adminToken = 'akuz_admin_2026'): Promise<boolean> => {
  try {
    saveRegisteredUsers([]);
    localStorage.removeItem('akuz_registered_users');
    localStorage.removeItem('akuz_google_accounts_list');
    localStorage.removeItem('akuz_last_google_account');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('akuz_user');

    await fetch('/api/users/purge-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': adminToken,
      },
      body: JSON.stringify({ adminToken }),
    });
    return true;
  } catch {
    return false;
  }
};

// Kullanıcının kayıtlı sepet ve favorilerini getirir
export const getUserSavedState = (
  email: string
): { cart: any[]; favorites: string[]; recentlyViewed: string[] } => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { cart: [], favorites: [], recentlyViewed: [] };

  let cart: any[] = [];
  let favorites: string[] = [];
  let recentlyViewed: string[] = [];

  try {
    const rawCart = localStorage.getItem(`akuz_user_cart_${cleanEmail}`);
    if (rawCart) cart = JSON.parse(rawCart);
  } catch {}

  try {
    const rawFav = localStorage.getItem(`akuz_user_favorites_${cleanEmail}`);
    if (rawFav) favorites = JSON.parse(rawFav);
  } catch {}

  try {
    const rawRecent = localStorage.getItem(`akuz_user_recent_${cleanEmail}`);
    if (rawRecent) recentlyViewed = JSON.parse(rawRecent);
  } catch {}

  // Yerel kayıtlı hesaplardan da kontrol et (yedek)
  const users = getRegisteredUsers();
  const account = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (account) {
    if (cart.length === 0 && account.cart && Array.isArray(account.cart)) cart = account.cart;
    if (favorites.length === 0 && account.favorites && Array.isArray(account.favorites)) favorites = account.favorites;
    if (recentlyViewed.length === 0 && account.recentlyViewed && Array.isArray(account.recentlyViewed)) {
      recentlyViewed = account.recentlyViewed;
    }
  }

  return { cart, favorites, recentlyViewed };
};

// Kullanıcının sepet ve favorilerini kalıcı olarak kaydeder
export const saveUserSavedState = (
  email: string,
  cart: any[],
  favorites: string[],
  recentlyViewed: string[] = []
): void => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return;

  try {
    localStorage.setItem(`akuz_user_cart_${cleanEmail}`, JSON.stringify(cart));
    localStorage.setItem(`akuz_user_favorites_${cleanEmail}`, JSON.stringify(favorites));
    localStorage.setItem(`akuz_user_recent_${cleanEmail}`, JSON.stringify(recentlyViewed));
  } catch {}

  // Kayıtlı hesap listesinde güncelle
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
  if (idx !== -1) {
    users[idx].cart = cart;
    users[idx].favorites = favorites;
    users[idx].recentlyViewed = recentlyViewed;
    saveRegisteredUsers(users);
  }

  // Sunucuya da arka planda gönder (/api/cart.php)
  try {
    fetch(API_CART_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, cart, favorites, recentlyViewed }),
    }).catch(() => {});
  } catch {}
};

export const getRegisteredUsers = (): RegisteredAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveRegisteredUsers = (users: RegisteredAccount[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save registered users', err);
  }
};

// Merkezi Host Sunucusunda e-posta kayıtlı mı detaylı kontrolü
export interface EmailCheckResult {
  exists: boolean;
  name?: string;
  email?: string;
  phone?: string;
  isGoogleUser?: boolean;
  hasPassword?: boolean;
  authMethod?: 'google' | 'password' | 'email';
}

export const checkEmailExistsDetailed = async (email: string): Promise<EmailCheckResult> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { exists: false };

  // 1. Önce Host Sunucusuna sor
  try {
    const res = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && typeof data.exists === 'boolean') {
        return {
          exists: data.exists,
          name: data.name,
          email: data.email || cleanEmail,
          phone: data.phone,
          isGoogleUser: data.isGoogleUser,
          hasPassword: data.hasPassword,
          authMethod: data.authMethod || (data.isGoogleUser ? 'google' : 'password'),
        };
      }
    }
  } catch (err) {
    console.warn('[AUTH] Host checkEmailExists failed, checking local:', err);
  }

  // 2. Çevrimdışı / Yerel bellek yedeği
  const users = getRegisteredUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (found) {
    const isGoogle = found.passwordHash === 'google_oauth_verified';
    return {
      exists: true,
      name: found.name,
      email: found.email,
      phone: found.phone,
      isGoogleUser: isGoogle,
      hasPassword: !isGoogle && !!found.passwordHash,
      authMethod: isGoogle ? 'google' : 'password',
    };
  }
  return { exists: false };
};

export const checkEmailExists = async (email: string): Promise<boolean> => {
  const res = await checkEmailExistsDetailed(email);
  return res.exists;
};

// Sunucudan kullanıcının en güncel profil ve adreslerini çeker
export const fetchUserProfileFromServer = async (email: string): Promise<UserProfile | null> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;
  try {
    const res = await fetch('/api/user/profile?email=' + encodeURIComponent(cleanEmail));
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.user) {
        return data.user;
      }
    }
  } catch (err) {
    console.warn('[AUTH] Failed to fetch user profile from server:', err);
  }
  return null;
};

export const getLastGoogleAccount = (): { email: string; name: string } | null => {
  try {
    const raw = localStorage.getItem('akuz_last_google_account');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export interface GoogleAccountItem {
  email: string;
  name: string;
  avatarUrl?: string;
  lastUsed?: string;
}

export const getStoredGoogleAccountsList = (): GoogleAccountItem[] => {
  const accounts: GoogleAccountItem[] = [];
  try {
    const raw = localStorage.getItem('akuz_google_accounts_list');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        accounts.push(...parsed);
      }
    }
  } catch {}

  // Son Google hesabını da ekle
  const last = getLastGoogleAccount();
  if (last && !accounts.some((a) => a.email.toLowerCase() === last.email.toLowerCase())) {
    accounts.unshift({ email: last.email, name: last.name || last.email.split('@')[0] });
  }

  return accounts;
};

export const saveGoogleAccountToList = (email: string, name: string) => {
  try {
    const list = getStoredGoogleAccountsList();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const filtered = list.filter((a) => a.email.toLowerCase() !== cleanEmail);
    filtered.unshift({ email: cleanEmail, name: cleanName, lastUsed: new Date().toISOString() });
    localStorage.setItem('akuz_google_accounts_list', JSON.stringify(filtered.slice(0, 10)));
    localStorage.setItem('akuz_last_google_account', JSON.stringify({ email: cleanEmail, name: cleanName }));
  } catch {}
};

// MySQL & Host DB ile kullanıcı kaydı
export const registerUser = async (
  fullName: string,
  email: string,
  password: string,
  phone: string = '',
  address: string = ''
): Promise<{ success: boolean; message?: string; error?: string; user?: UserProfile }> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim();

  if (!cleanName) {
    return { success: false, error: 'Lütfen Ad ve Soyadınızı girin.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Lütfen geçerli bir e-posta adresi girin.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Şifreniz en az 6 karakter olmalıdır.' };
  }

  const payload = {
    action: 'register',
    email: cleanEmail,
    password,
    full_name: cleanName,
    phone: phone.trim(),
    address: address.trim(),
  };

  // 1. Kullanıcının MySQL veritabanı API'sine POST isteği at (https://akuzstickers.com/api/auth.php)
  try {
    const response = await fetch(API_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch((parseErr) => {
      console.error('[Kayıt API JSON Ayrıştırma Hatası]:', parseErr);
      return null;
    });

    if (!response.ok || (data && data.success === false)) {
      const errorMsg = (data && (data.error || data.message)) || `Kayıt işlemi başarısız (HTTP ${response.status})`;
      console.error('[Kayıt API Hatası]:', errorMsg, data);
      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log('[Kayıt Başarılı]:', data);

    // Dönen kullanıcı verisini normalize et
    const rawUser = data?.user || {
      name: cleanName,
      full_name: cleanName,
      email: cleanEmail,
      phone: phone.trim(),
      address: address.trim(),
    };
    const profile = normalizeUserProfile(rawUser);

    // Yerel kullanıcı listesini de güncelle
    const users = getRegisteredUsers();
    if (!users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      users.push({
        name: cleanName,
        email: cleanEmail,
        phone: phone.trim(),
        createdAt: new Date().toISOString(),
        addresses: profile.addresses,
      });
      saveRegisteredUsers(users);
    }

    return {
      success: true,
      message: data?.message || 'Kayıt başarılı, giriş yapabilirsiniz',
      user: profile,
    };
  } catch (err: any) {
    console.error('[Kayıt İsteği Bağlantı Hatası - https://akuzstickers.com/api/auth.php]:', err);

    // Çevrimdışı / yerel fallback
    try {
      const fallbackRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password, phone, address }),
      });
      const fbData = await fallbackRes.json();
      if (fbData.success) {
        return {
          success: true,
          message: 'Kayıt başarılı, giriş yapabilirsiniz',
          user: normalizeUserProfile(fbData.user),
        };
      }
    } catch {}

    const users = getRegisteredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın.' };
    }

    const profile: UserProfile = normalizeUserProfile({
      name: cleanName,
      full_name: cleanName,
      email: cleanEmail,
      phone: phone.trim(),
      address: address.trim(),
    });

    users.push({
      name: cleanName,
      email: cleanEmail,
      phone: phone.trim(),
      createdAt: new Date().toISOString(),
      addresses: profile.addresses,
    });
    saveRegisteredUsers(users);

    return {
      success: true,
      message: 'Kayıt başarılı, giriş yapabilirsiniz',
      user: profile,
    };
  }
};

// MySQL & Host DB ile kullanıcı girişi
export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: UserProfile; isGoogleAccount?: boolean }> => {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return { success: false, error: 'Lütfen e-posta adresinizi girin.' };
  }
  if (!password) {
    return { success: false, error: 'Lütfen şifrenizi girin.' };
  }

  const payload = {
    action: 'login',
    email: cleanEmail,
    password,
  };

  // 1. Kullanıcının MySQL API'sine doğrudan POST isteği at
  try {
    const response = await fetch(API_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data || data.success === false) {
      return {
        success: false,
        isGoogleAccount: data?.isGoogleAccount || false,
        error: (data && (data.error || data.message)) || 'Hatalı e-posta veya şifre.',
      };
    }

    // API'den dönen response.user'ı al
    const rawUser = data.user || data;
    const profile = normalizeUserProfile(rawUser);

    // KULLANICI ŞARTI: response.user localStorage.setItem('currentUser', JSON.stringify(response.user)) ile saklanır
    try {
      localStorage.setItem('currentUser', JSON.stringify(rawUser));
      localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('localStorage error:', e);
    }

    return { success: true, user: profile };
  } catch (err) {
    console.warn('[AUTH] External API login failed, checking fallback:', err);

    // Çevrimdışı / yerel fallback
    try {
      const fallbackRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const fbData = await fallbackRes.json();
      if (fbData.success && fbData.user) {
        const profile = normalizeUserProfile(fbData.user);
        localStorage.setItem('currentUser', JSON.stringify(fbData.user));
        localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(profile));
        return { success: true, user: profile };
      } else if (fbData.isGoogleAccount) {
        return {
          success: false,
          isGoogleAccount: true,
          error: fbData.error || 'Bu hesap Google ile oluşturulmuştur. Lütfen "Google ile Giriş Yap" seçeneğini kullanınız.',
        };
      }
    } catch {}

    const users = getRegisteredUsers();
    const account = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!account) {
      return {
        success: false,
        error: 'Bu e-posta adresine ait hesap bulunamadı. Lütfen kayıt olun.',
      };
    }

    if (account.passwordHash === 'google_oauth_verified') {
      return {
        success: false,
        isGoogleAccount: true,
        error: 'Bu hesap Google ile oluşturulmuştur. Lütfen "Google ile Giriş Yap" seçeneğini kullanarak oturum açınız.',
      };
    }

    if (account.passwordHash && account.passwordHash !== password) {
      return {
        success: false,
        error: 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.',
      };
    }

    const profile: UserProfile = normalizeUserProfile({
      name: account.name,
      full_name: account.name,
      email: account.email,
      phone: account.phone || '',
      addresses: account.addresses || [],
    });

    localStorage.setItem('currentUser', JSON.stringify(profile));
    localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(profile));
    return { success: true, user: profile };
  }
};

export const DEFAULT_GOOGLE_CLIENT_ID = '947652767285-huldifd2fqu7gcdqqcq6emoufcom9h46.apps.googleusercontent.com';

/**
 * Google login başarılı olduğunda (onSuccess veya callback fonksiyonu içinde),
 * gelen kullanıcı adı ve e-postasını fetch ile cPanel'deki /api/google_auth.php adresine POST atan
 * ve dönen kullanıcı ID'sini (user_id) tarayıcıda localStorage'a kaydeden fonksiyon.
 */
export const saveGoogleUserToCpanel = async (
  name: string,
  email: string
): Promise<{ user_id: string | null; data?: any }> => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

  if (!cleanEmail) {
    return { user_id: null };
  }

  try {
    const res = await fetch(API_GOOGLE_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        email: cleanEmail,
        full_name: cleanName,
      }),
    });

    const data = await res.json();
    const userId = data?.user_id || data?.id || data?.user?.id || data?.user?.user_id;
    if (userId) {
      const idStr = String(userId);
      localStorage.setItem('user_id', idStr);
      console.log('[Google Auth] cPanel veritabanına kaydedildi, user_id:', idStr);
      return { user_id: idStr, data };
    }
    return { user_id: null, data };
  } catch (err) {
    console.warn('[Google Auth] cPanel POST hatası:', err);
    return { user_id: null };
  }
};

// Global erişim için window nesnesine de bağla
if (typeof window !== 'undefined') {
  (window as any).saveGoogleUserToCpanel = saveGoogleUserToCpanel;
  (window as any).onGoogleLoginSuccess = saveGoogleUserToCpanel;
}

export const loginWithGoogleAccount = async (
  googleEmail: string,
  googleName: string
): Promise<{ success: boolean; user: UserProfile }> => {
  const cleanEmail = googleEmail.trim().toLowerCase();
  const cleanName = googleName.trim() || cleanEmail.split('@')[0];

  let profile: UserProfile;

  // 1. Google login başarılı olduğunda cPanel'deki google_auth.php adresine POST at ve user_id'yi localStorage'a kaydet
  const { user_id: receivedUserId, data } = await saveGoogleUserToCpanel(cleanName, cleanEmail);

  // 2. Unified auth.php API'ye de bildirim gönder
  try {
    fetch(API_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'google',
        email: cleanEmail,
        full_name: cleanName,
        name: cleanName,
      }),
    }).catch(() => {});
  } catch {}

  try {
    if (data?.success && data?.user) {
      profile = normalizeUserProfile({
        ...data.user,
        id: receivedUserId || data.user.id,
        user_id: receivedUserId || data.user.user_id,
        name: cleanName || data.user.name,
        full_name: cleanName || data.user.full_name,
      });
    } else {
      // Yerel fallback
      const users = getRegisteredUsers();
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        profile = normalizeUserProfile({
          name: cleanName || existing.name,
          full_name: cleanName || existing.full_name,
          email: cleanEmail,
          phone: existing.phone || '',
          addresses: existing.addresses || [],
        });
      } else {
        profile = normalizeUserProfile({
          name: cleanName,
          full_name: cleanName,
          email: cleanEmail,
          phone: '',
          addresses: [],
        });
      }
    }
  } catch (err) {
    console.warn('[AUTH] Google host auth error, using local fallback:', err);
    const users = getRegisteredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      profile = normalizeUserProfile({
        name: cleanName || existing.name,
        full_name: cleanName || existing.full_name,
        email: cleanEmail,
        phone: existing.phone || '',
        addresses: existing.addresses || [],
      });
    } else {
      profile = normalizeUserProfile({
        name: cleanName,
        full_name: cleanName,
        email: cleanEmail,
        phone: '',
        addresses: [],
      });
    }
  }

  // Yerel kullanıcı listesini senkronize tut ve adresleri birleştir
  const users = getRegisteredUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);

  // Sunucudan gelen adreslerle yerel adresleri birleştir (hiçbir kayıtlı adres kaybolmasın)
  const mergedAddresses = [...(profile.addresses || [])];
  if (idx !== -1 && users[idx].addresses && Array.isArray(users[idx].addresses)) {
    for (const a of users[idx].addresses) {
      if (!mergedAddresses.some((m) => m.fullAddress === a.fullAddress)) {
        mergedAddresses.push(a);
      }
    }
  }
  profile.addresses = mergedAddresses;
  if (idx !== -1 && users[idx].phone && !profile.phone) {
    profile.phone = users[idx].phone;
  }
  profile.name = cleanName;
  profile.full_name = cleanName;

  if (idx === -1) {
    users.push({
      name: cleanName,
      full_name: cleanName,
      email: cleanEmail,
      phone: profile.phone || '',
      createdAt: new Date().toISOString(),
      addresses: profile.addresses || [],
    });
    saveRegisteredUsers(users);
  } else {
    users[idx].name = cleanName;
    users[idx].full_name = cleanName;
    users[idx].addresses = profile.addresses;
    users[idx].phone = profile.phone || users[idx].phone;
    saveRegisteredUsers(users);
  }

  // Son başarılı Google hesabını hızlı giriş için hatırla
  try {
    localStorage.setItem(
      'akuz_last_google_account',
      JSON.stringify({ email: cleanEmail, name: profile.name })
    );
  } catch (e) {
    console.warn('Could not store last google account', e);
  }

  // Kullanıcı bilgilerini localStorage'da sakla (currentUser & legacy key)
  localStorage.setItem('currentUser', JSON.stringify(profile));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(profile));

  // Kullanıcının siparişlerini de hemen arka planda çek ve önbelleğe al
  try {
    fetch('/api/orders?email=' + encodeURIComponent(cleanEmail))
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.orders)) {
          localStorage.setItem('akuz_orders', JSON.stringify(d.orders));
        }
      })
      .catch((e) => console.warn('Could not sync user orders after google login', e));
  } catch {}

  return { success: true, user: profile };
};

// Google resmi hesap seçicisini (Account Picker) açar
export const triggerGoogleAccountPicker = async (
  onSuccess: (user: UserProfile) => void,
  onError: (errorMsg: string) => void,
  onAccountSelect?: (info: { email: string; name: string }) => void
): Promise<void> => {
  // Google Client ID'yi ayarlardan veya varsayılandan al
  let clientId = DEFAULT_GOOGLE_CLIENT_ID;
  try {
    const raw = localStorage.getItem('akuz_site_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.googleClientId) clientId = parsed.googleClientId.trim();
    }
  } catch {}

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  // 1. Google UserInfo Yanıtını İşleme (Google Identity Services Access Token ile)
  async function handleUserInfoResponse(accessToken: string) {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data && data.email) {
        const email = data.email;
        const suggestedName = data.name || data.given_name || email.split('@')[0];

        // Google login başarılı olduğunda cPanel'deki google_auth.php adresine POST atıp user_id'yi kaydet
        await saveGoogleUserToCpanel(suggestedName, email);

        if (onAccountSelect) {
          onAccountSelect({ email, name: suggestedName });
        } else {
          const loginRes = await loginWithGoogleAccount(email, suggestedName);
          onSuccess(loginRes.user);
        }
      } else {
        onError('Google hesap bilgileri alınamadı.');
      }
    } catch (err: any) {
      onError('Google ile oturum açılırken bir sorun oluştu: ' + (err?.message || ''));
    }
  }

  // Google Identity Services betiğinin yüklü olduğundan emin ol
  const getGoogleObj = async () => {
    let g = (window as any).google;
    if (g?.accounts) return g;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 100));
      g = (window as any).google;
      if (g?.accounts) return g;
    }
    return (window as any).google;
  };

  const g = await getGoogleObj();

  // 1. Google Identity Services ID Credential dinleyicisini de hazırla (One Tap veya resmi buton yanıtları için)
  if (g?.accounts?.id?.initialize) {
    try {
      g.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp: any) => {
          if (resp && resp.credential) {
            try {
              const base64Url = resp.credential.split('.')[1];
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const payload = JSON.parse(jsonPayload);
              if (payload && payload.email) {
                const email = payload.email;
                const suggestedName = payload.name || payload.given_name || email.split('@')[0];

                // Google login başarılı olduğunda cPanel'deki google_auth.php adresine POST atıp user_id'yi kaydet
                await saveGoogleUserToCpanel(suggestedName, email);

                if (onAccountSelect) {
                  onAccountSelect({ email, name: suggestedName });
                } else {
                  const loginRes = await loginWithGoogleAccount(email, suggestedName);
                  onSuccess(loginRes.user);
                }
                return;
              }
            } catch (e) {
              console.warn('[JWT PARSE ERROR]', e);
            }
          }
        },
        auto_select: false,
      });
    } catch (err) {
      console.warn('[GSI ID INIT FAILED]', err);
    }
  }

  // 2. Kullanıcı butona bastığında doğrudan Google OAuth 2.0 Token Client (Popup Hesap Seçici) aç
  if (g?.accounts?.oauth2?.initTokenClient) {
    try {
      const tokenClient = g.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile',
        prompt: 'select_account',
        callback: (resp: any) => {
          if (resp && resp.access_token) {
            handleUserInfoResponse(resp.access_token);
          } else if (resp && resp.error) {
            console.warn('[GOOGLE OAUTH]', resp.error);
            if (resp.error === 'access_denied') {
              onError('Google hesap seçimi iptal edildi.');
            } else {
              onError(`Google yetkilendirme yanıtı: ${resp.error}`);
            }
          }
        },
        error_callback: (err: any) => {
          console.warn('[GOOGLE GIS ERROR]', err);
          const errStr = typeof err === 'object' ? JSON.stringify(err) : String(err);
          if (errStr.includes('origin_mismatch') || err?.type === 'origin_mismatch') {
            onError(
              `Google Yetki Uyarısı (origin_mismatch): Bu adres (${currentOrigin}) Google Cloud Konsolu Client ID ayarlarındaki "Yetkili JavaScript Kaynakları" listesinde kayıtlı olmalıdır.`
            );
          } else {
            onError('Google hesap seçici açılamadı. Lütfen e-posta ile giriş yapın.');
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (err: any) {
      console.warn('[GOOGLE TOKEN CLIENT FAILED]', err);
    }
  }

  // 3. Token client yoksa One Tap prompt dene
  if (g?.accounts?.id?.prompt) {
    try {
      g.accounts.id.prompt();
      return;
    } catch (e) {
      console.warn('[PROMPT FAILED]', e);
    }
  }

  onError('Google oturum açma kütüphanesi yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.');
};

export const getCurrentUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem('currentUser') || localStorage.getItem(LEGACY_USER_KEY);
    if (!raw) return null;
    return normalizeUserProfile(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const updateUserProfileData = (updated: UserProfile): void => {
  const payload = {
    ...updated,
    action: 'update_profile',
    fullname: updated.name,
    name: updated.name,
    phone: updated.phone,
    addresses: updated.addresses,
  };

  // 1. Host API ve cPanel endpoint'ine güncelleme isteği gönder
  fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((e) => console.warn('[AUTH] Profile sync error (/api/user/profile):', e));

  // 2. cPanel PHP auth.php endpoint'ine de gönder (MySQL veritabanında fullname, phone, addresses güncellensin)
  fetch('/api/auth.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((e) => console.warn('[AUTH] Profile sync error (/api/auth.php):', e));

  // 3. Local storage'a da yaz
  const users = getRegisteredUsers();
  const index = users.findIndex((u) => u.email.toLowerCase() === updated.email.toLowerCase());
  if (index !== -1) {
    users[index] = {
      ...users[index],
      name: updated.name,
      phone: updated.phone,
      addresses: updated.addresses,
    };
    saveRegisteredUsers(users);
  }
  try {
    localStorage.setItem('currentUser', JSON.stringify(updated));
    localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(updated));
  } catch {}
};

export const logoutUser = (): void => {
  try {
    localStorage.removeItem('currentUser');
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {}
};

// Şifremi Unuttum: Kayıtlı şifreyi e-posta adresine gönder
export const requestPasswordRecovery = async (
  email: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Lütfen geçerli bir e-posta adresi girin.' };
  }

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Şifre gönderilemedi.' };
    }

    return {
      success: true,
      message: data.message || `Şifreniz "${cleanEmail}" adresinize başarıyla gönderildi.`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Sunucuya bağlanırken bir hata oluştu.',
    };
  }
};

// Şifre Değiştirme (Hesap Bilgileri panelinden - MySQL veritabanında da güncellenir)
export const changeUserPassword = async (
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const payload = {
      action: 'change_password',
      email: cleanEmail,
      currentPassword,
      newPassword,
    };

    // cPanel MySQL ve API endpoint'lerine paralel istek at
    const [res1, res2] = await Promise.allSettled([
      fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      fetch('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    ]);

    let data: any = null;
    if (res1.status === 'fulfilled' && res1.value.ok) {
      data = await res1.value.json();
    } else if (res2.status === 'fulfilled' && res2.value.ok) {
      data = await res2.value.json();
    }

    if (!data || (!data.success && data.status !== 'success')) {
      return { success: false, error: data?.error || data?.message || 'Şifre güncellenemedi.' };
    }

    return { success: true, message: data.message || 'Şifreniz başarıyla değiştirildi.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sunucu bağlantı hatası.' };
  }
};

