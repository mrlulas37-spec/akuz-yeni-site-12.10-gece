import { UserProfile } from '../types';

export interface RegisteredAccount {
  name: string;
  email: string;
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
const CURRENT_USER_KEY = 'akuz_user';

// Initial preloaded demo account
const INITIAL_USERS: RegisteredAccount[] = [
  {
    name: 'Murat Ulusoy',
    email: 'mrlulas37@gmail.com',
    passwordHash: '123456',
    phone: '+90 546 875 86 71',
    createdAt: new Date().toISOString(),
    addresses: [
      {
        id: 'addr-1',
        title: 'Ev Adresim',
        recipientName: 'Murat Ulusoy',
        phone: '+90 546 875 86 71',
        city: 'Bursa',
        district: 'Nilüfer',
        fullAddress: 'Üçevler Mah. 10. Sokak No:17/A',
        isDefault: true,
      },
    ],
  },
];

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
        // Yerel kullanıcılarla sunucuyu birleştir, hiçbir hesap asla kaybolmasın
        const local = getRegisteredUsers();
        const merged = [...data.users];
        for (const lu of local) {
          if (!merged.some((m) => m.email.toLowerCase() === lu.email.toLowerCase())) {
            merged.push(lu);
          }
        }
        saveRegisteredUsers(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('[AUTH] Host DB fetch failed:', err);
  }
  return getRegisteredUsers();
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

  // Sunucuya da arka planda gönder
  try {
    fetch('/api/user/sync-data', {
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
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_USERS;
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

  // Varsayılan / bilinen Google hesapları (Kullanıcının tek tıkla hemen seçebilmesi için)
  const defaultAccs = [
    { email: 'mertopro123@gmail.com', name: 'Mert Ulusoy' },
  ];
  for (const def of defaultAccs) {
    if (!accounts.some((a) => a.email.toLowerCase() === def.email.toLowerCase())) {
      accounts.push(def);
    }
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

// Merkezi Host DB'ye güvenli kayıt
export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  if (!cleanName) {
    return { success: false, error: 'Lütfen Ad ve Soyadınızı girin.' };
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Lütfen geçerli bir e-posta adresi girin.' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Şifreniz en az 6 karakter olmalıdır.' };
  }

  // 1. Önce Host Merkezi API'sine kaydet
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Kayıt yapılamadı.' };
    }

    const profile: UserProfile = data.user || {
      name: cleanName,
      email: cleanEmail,
      phone: '',
      addresses: [],
    };

    // Yerel önbelleği ve aktif kullanıcıyı güncelle
    const users = getRegisteredUsers();
    if (!users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      users.push({
        name: cleanName,
        email: cleanEmail,
        phone: '',
        createdAt: new Date().toISOString(),
        addresses: [],
      });
      saveRegisteredUsers(users);
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
    return { success: true, user: profile };
  } catch (err: any) {
    console.warn('[AUTH] Host API offline fallback to local:', err);

    // Çevrimdışı / yerel yedek
    const users = getRegisteredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, error: 'Bu e-posta adresiyle kayıtlı bir hesap zaten var. Lütfen giriş yapın.' };
    }

    const newAccount: RegisteredAccount = {
      name: cleanName,
      email: cleanEmail,
      phone: '',
      createdAt: new Date().toISOString(),
      addresses: [],
    };

    users.push(newAccount);
    saveRegisteredUsers(users);

    const profile: UserProfile = {
      name: cleanName,
      email: cleanEmail,
      phone: '',
      addresses: [],
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
    return { success: true, user: profile };
  }
};

// Merkezi Host DB ile güvenli giriş
export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return { success: false, error: 'Lütfen e-posta adresinizi girin.' };
  }
  if (!password) {
    return { success: false, error: 'Lütfen şifrenizi girin.' };
  }

  // 1. Önce Host Merkezi API'sinde şifreyi güvenle doğrula
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Hatalı e-posta veya şifre.' };
    }

    const profile: UserProfile = data.user;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
    return { success: true, user: profile };
  } catch (err) {
    console.warn('[AUTH] Host login failed, trying local fallback:', err);

    // Çevrimdışı / yerel fallback
    const users = getRegisteredUsers();
    const account = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!account) {
      return {
        success: false,
        error: 'Bu e-posta adresine ait hesap bulunamadı. Lütfen kayıt olun.',
      };
    }

    if (account.passwordHash && account.passwordHash !== password) {
      return {
        success: false,
        error: 'Hatalı şifre girdiniz. Lütfen tekrar deneyin.',
      };
    }

    const profile: UserProfile = {
      name: account.name,
      email: account.email,
      phone: account.phone || '',
      addresses: account.addresses || [],
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
    return { success: true, user: profile };
  }
};

export const loginWithGoogleAccount = async (
  googleEmail: string,
  googleName: string
): Promise<{ success: boolean; user: UserProfile }> => {
  const cleanEmail = googleEmail.trim().toLowerCase();
  const cleanName = googleName.trim() || cleanEmail.split('@')[0];

  let profile: UserProfile;

  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, name: cleanName }),
    });
    const data = await res.json();
    if (data.success && data.user) {
      profile = data.user;
    } else {
      // Yerel fallback
      const users = getRegisteredUsers();
      const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existing) {
        profile = {
          name: existing.name || cleanName,
          email: cleanEmail,
          phone: existing.phone || '',
          addresses: existing.addresses || [],
        };
      } else {
        profile = {
          name: cleanName,
          email: cleanEmail,
          phone: '',
          addresses: [],
        };
      }
    }
  } catch (err) {
    console.warn('[AUTH] Google host auth error, using local fallback:', err);
    const users = getRegisteredUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      profile = {
        name: existing.name || cleanName,
        email: cleanEmail,
        phone: existing.phone || '',
        addresses: existing.addresses || [],
      };
    } else {
      profile = {
        name: cleanName,
        email: cleanEmail,
        phone: '',
        addresses: [],
      };
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

  if (idx === -1) {
    users.push({
      name: profile.name,
      email: cleanEmail,
      phone: profile.phone || '',
      createdAt: new Date().toISOString(),
      addresses: profile.addresses || [],
    });
    saveRegisteredUsers(users);
  } else {
    users[idx].addresses = profile.addresses;
    users[idx].phone = profile.phone || users[idx].phone;
    users[idx].name = profile.name || users[idx].name;
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

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));

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

// Google resmi hesap seçicisini (Account Picker) anında açar - kullanıcıdan isim ve mail sormaz
export const triggerGoogleAccountPicker = async (
  onSuccess: (user: UserProfile) => void,
  onError: (errorMsg: string) => void
): Promise<void> => {
  // Google Client ID'yi ayarlardan veya varsayılandan al
  let clientId = '660437230655-lnnq4tut79r9o865iiingv01ot5gvdfg.apps.googleusercontent.com';
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
        const loginRes = await loginWithGoogleAccount(
          data.email,
          data.name || data.given_name || data.email.split('@')[0]
        );
        onSuccess(loginRes.user);
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

  // 1. Google'ın Resmi OAuth 2.0 Politikalarına Uygun Modern Token Client
  // Google'ın yasakladığı eski "response_type=token" yerine resmi Google Identity Services (GIS) kullanılır
  if (g?.accounts?.oauth2?.initTokenClient) {
    try {
      const tokenClient = g.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
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
              `Google Yetki Uyarısı (origin_mismatch): Bu adres (${currentOrigin}) Google Cloud Konsolu Client ID ayarlarındaki "Yetkili JavaScript Kaynakları" listesinde kayıtlı olmalıdır. Google Cloud Konsolunda bu adresi ekleyebilir veya e-posta ile giriş yapabilirsiniz.`
            );
          } else {
            tryGISPrompt();
          }
        },
      });
      tokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (err: any) {
      console.warn('[GOOGLE TOKEN CLIENT FAILED]', err);
      const errStr = String(err?.message || err);
      if (errStr.includes('origin_mismatch')) {
        onError(
          `Google Yetki Uyarısı (origin_mismatch): Bu adres (${currentOrigin}) Google Cloud Konsolu Client ID ayarlarındaki "Yetkili JavaScript Kaynakları" listesinde kayıtlı olmalıdır.`
        );
        return;
      }
    }
  }

  // 2. Google Identity Services ID Credential / OneTap
  function tryGISPrompt() {
    if (g?.accounts?.id?.initialize) {
      try {
        g.accounts.id.initialize({
          client_id: clientId,
          use_fedcm_for_prompt: false,
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
                  const loginRes = await loginWithGoogleAccount(
                    payload.email,
                    payload.name || payload.email.split('@')[0]
                  );
                  onSuccess(loginRes.user);
                  return;
                }
              } catch (e) {
                console.warn('[JWT PARSE ERROR]', e);
              }
            }
          },
          auto_select: false,
        });
        g.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            onError('Google hesap seçici açılamadı. Lütfen e-posta adresinizi girerek devam ediniz.');
          }
        });
        return;
      } catch (err) {
        console.warn('[GSI ID FAILED]', err);
      }
    }
    onError('Google oturum açma kütüphanesi yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.');
  }

  tryGISPrompt();
};

export const updateUserProfileData = (updated: UserProfile): void => {
  // Host API'ye kaydet
  fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  }).catch((e) => console.warn('[AUTH] Profile sync error:', e));

  // Local storage'a da yaz
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
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated));
};

export const logoutUser = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
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

// Şifre Değiştirme (Hesap Bilgileri panelinden)
export const changeUserPassword = async (
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  const cleanEmail = email.trim().toLowerCase();

  try {
    const res = await fetch('/api/user/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Şifre güncellenemedi.' };
    }

    return { success: true, message: data.message || 'Şifreniz başarıyla değiştirildi.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Sunucu bağlantı hatası.' };
  }
};

