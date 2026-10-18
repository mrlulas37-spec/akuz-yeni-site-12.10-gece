import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, MapPin, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
import { AkuzLogo } from './AkuzLogo';
import { UserProfile } from '../types';
import {
  loginUser,
  registerUser,
  loginWithGoogleAccount,
  checkEmailExistsDetailed,
  getLastGoogleAccount,
  triggerGoogleAccountPicker,
  saveGoogleUserToCpanel,
  triggerRegistrationWelcomeEmail,
} from '../utils/auth';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  onGoHome: () => void;
  onForgotPassword?: (email: string) => void;
  initialEmail?: string;
  currentUser?: UserProfile | null;
  returnPath?: string;
}

type AuthStep = 'email' | 'existing_password' | 'google_account_confirm' | 'google_name_prompt' | 'new_register';

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onGoHome,
  onForgotPassword,
  initialEmail = '',
  currentUser,
  returnPath = '/',
}) => {
  const [step, setStep] = useState<AuthStep>('email');

  // Kullanıcı zaten giriş yapmışsa veya oturum açılmışsa doğrudan siteye yönlendir
  useEffect(() => {
    if (currentUser) {
      onGoHome();
    }
  }, [currentUser, onGoHome]);

  // Form fields
  const [email, setEmail] = useState(initialEmail);
  const [accountName, setAccountName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields ({ action: 'register', email, password, full_name, phone, address })
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Google ile giriş doğrulama & isim-soyisim isteme state'leri
  const [googleAuthData, setGoogleAuthData] = useState<{ email: string; name: string } | null>(null);
  const [googleFullName, setGoogleFullName] = useState('');

  // Status & validation states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Last Google account
  const [lastGoogle, setLastGoogle] = useState<{ email: string; name: string } | null>(null);

  // Başarılı giriş state'i
  const [successUser, setSuccessUser] = useState<UserProfile | null>(null);

  // Başarılı girişte doğrudan "Giriş Başarılı" ekranını gösterir ve kullanıcıya soru sormadan ana sayfaya yönlendirir
  const triggerSuccessfulLogin = (user: UserProfile) => {
    setIsLoading(false);
    setErrorMessage(null);
    setSuccessUser(user);
    // Kısa süre (700ms) "GİRİŞ BAŞARILI" mesajını gösterip ana sayfaya git
    setTimeout(() => {
      onLoginSuccess(user);
      onGoHome();
    }, 700);
  };

  // Doğrudan gerçek Google açılır penceresini ve hesap seçicisini başlatır
  const handleLaunchGooglePicker = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    // 25 saniye sonra kullanıcı popup'ı kapatmışsa buton yükleme durumunu güvenle sıfırla
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 25000);

    try {
      await triggerGoogleAccountPicker(
        async (user) => {
          clearTimeout(safetyTimer);
          // Google login başarılı: cPanel'deki google_auth.php adresine POST at ve user_id'yi kaydet
          await saveGoogleUserToCpanel(user.name, user.email);

          // İsim varsa doğrudan oturumu tamamla ve yönlendir
          if (user.name && user.name.trim().length >= 2) {
            const loginRes = await loginWithGoogleAccount(user.email, user.name);
            triggerRegistrationWelcomeEmail(user.name, user.email);
            setIsLoading(false);
            setSuccessMessage(`Giriş başarılı! Hoş geldiniz, ${loginRes.user.name}`);
            setTimeout(() => {
              triggerSuccessfulLogin(loginRes.user);
            }, 350);
          } else {
            // İsim eksikse kullanıcıdan ad-soyad iste
            setGoogleAuthData({ email: user.email, name: user.name });
            setGoogleFullName(user.name || '');
            setStep('google_name_prompt');
            setIsLoading(false);
          }
        },
        (errorMsg) => {
          clearTimeout(safetyTimer);
          setIsLoading(false);
          setErrorMessage(errorMsg);
        }
      );
    } catch (err: any) {
      clearTimeout(safetyTimer);
      setIsLoading(false);
      setErrorMessage(err?.message || 'Google oturum açma penceresi açılamadı.');
    }
  };

  // Google Girişi: Kullanıcı isim ve soyismini girdiğinde oturumu tamamla
  const handleGoogleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const trimmed = googleFullName.trim();
    if (!trimmed || trimmed.length < 2) {
      setErrorMessage('Lütfen Ad ve Soyadınızı giriniz.');
      return;
    }

    const cleanEmail = (googleAuthData?.email || email).trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Google hesabı bulunamadı. Lütfen tekrar deneyin.');
      setStep('email');
      return;
    }

    setIsLoading(true);
    try {
      // cPanel'deki google_auth.php adresine isim & e-posta POST at ve dönen user_id'yi kaydet
      await saveGoogleUserToCpanel(trimmed, cleanEmail);

      const loginRes = await loginWithGoogleAccount(cleanEmail, trimmed);
      triggerRegistrationWelcomeEmail(trimmed, cleanEmail);
      setIsLoading(false);
      setSuccessMessage(`Giriş başarılı! Hoş geldiniz, ${loginRes.user.name}`);
      setTimeout(() => {
        triggerSuccessfulLogin(loginRes.user);
      }, 350);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Giriş tamamlanamadı. Lütfen tekrar deneyin.');
    }
  };

  // 1. E-posta Kontrolü: Sistemde kayıtlı mı, Google mı, şifreli mi bakar
  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await checkEmailExistsDetailed(cleanEmail);
      setIsLoading(false);

      if (result.exists) {
        if (result.name) setAccountName(result.name);
        if (result.isGoogleUser) {
          // Google ile kayıtlıysa Google ile giriş yapmasını rica et
          setStep('google_account_confirm');
        } else {
          // E-posta ile kayıtlıysa mutlaka şifre sor
          setStep('existing_password');
        }
      } else {
        setStep('new_register');
      }
    } catch {
      setIsLoading(false);
      setStep('new_register');
    }
  };

  // 2. Şifreli Giriş (Güvenlik Korumalı - Şifre Doğrulaması Şart)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!loginPassword) {
      setErrorMessage('Lütfen şifrenizi girin.');
      return;
    }

    setIsLoading(true);
    const res = await loginUser(email, loginPassword);
    setIsLoading(false);

    if (!res.success || !res.user) {
      if ((res as any).isGoogleAccount || res.error?.includes('Google')) {
        setStep('google_account_confirm');
      }
      setErrorMessage(res.error || 'Giriş yapılamadı.');
    } else {
      triggerSuccessfulLogin(res.user);
    }
  };

  // 3. Yeni Kayıt ({ action: 'register', email, password, full_name, phone, address })
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!registerName.trim()) {
      setErrorMessage('Lütfen Ad ve Soyadınızı girin.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakterden oluşmalıdır.');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('Girdiğiniz şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsLoading(true);
    console.log('[Kayıt Formu Gönderiliyor -> /api/auth.php]', {
      email,
      full_name: registerName,
      phone: registerPhone,
    });

    try {
      const res = await registerUser(
        registerName,
        email,
        registerPassword,
        registerPhone,
        '' // Adres kayıt esnasında istenmiyor, sipariş esnasında veya hesap panelinden girilecek
      );
      setIsLoading(false);

      if (!res.success) {
        console.error('[Kayıt Hatası]:', res.error);
        setErrorMessage(res.error || 'Kayıt işlemi başarısız.');
      } else {
        console.log('[Kayıt Başarılı]:', res.message || res);
        triggerRegistrationWelcomeEmail(registerName, email);
        // Kullanıcıyı bilgilendir ve giriş ekranına yönlendir
        setSuccessMessage(res.message || 'Kayıt başarılı, giriş yapabilirsiniz');
        setLoginPassword('');
        setStep('existing_password');
      }
    } catch (err: any) {
      setIsLoading(false);
      console.error('[Kayıt Formu İstek Hatası]:', err);
      setErrorMessage(err?.message || 'Kayıt işlemi sırasında bir bağlantı hatası oluştu.');
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Giriş Başarılı Ekranı (Kullanıcıya soru sormadan veya mağazaya dönmeyi beklemeden doğrudan ana sayfaya yönlendirir)
  if (successUser) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#fcfbf9] to-slate-100">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 border border-slate-200/80 text-center animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm ring-8 ring-emerald-50">
            <CheckCircle2 size={44} className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase font-display tracking-tight mb-2">
            GİRİŞ BAŞARILI!
          </h2>
          <p className="text-sm font-semibold text-slate-700 mb-1">
            Hoş geldiniz, <span className="font-bold text-slate-900">{successUser.name || successUser.email}</span>
          </p>
          <p className="text-xs text-slate-500 mb-6">
            Oturumunuz açıldı. Ana sayfaya yönlendiriliyorsunuz...
          </p>
          <div className="inline-flex items-center justify-center gap-2.5 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm">
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Ana sayfaya gidiliyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#fcfbf9] to-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-7 sm:p-9 border border-slate-200/80 relative">
        {/* Sol Üst: Geri butonu */}
        {step !== 'email' ? (
          <button
            type="button"
            onClick={handleBackToEmail}
            className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="E-posta adımına dön"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onGoHome}
            className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="Ana Sayfaya Dön"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Ana Sayfa</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <div onClick={onGoHome} className="cursor-pointer mb-2">
            <AkuzLogo size={52} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight">
            {step === 'email' && 'GİRİŞ YAP VEYA KAYIT OL'}
            {step === 'existing_password' && 'HESABINIZA GİRİŞ YAPIN'}
            {step === 'google_account_confirm' && 'GOOGLE İLE GİRİŞ YAP'}
            {step === 'google_name_prompt' && 'İSİM & SOYİSİM DOĞRULAMA'}
            {step === 'new_register' && 'HESAP OLUŞTUR'}
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs">
            {step === 'email' &&
              'AKUZ Stickers hesabınıza erişmek, adreslerinizi ve siparişlerinizi görüntülemek için e-posta adresinizi girin.'}
            {step === 'existing_password' &&
              (accountName ? `Hoş geldiniz, ${accountName}! Şifrenizi girerek hesabınıza erişin.` : 'Kayıtlı hesabınız bulundu. Şifrenizi girerek giriş yapın.')}
            {step === 'google_account_confirm' &&
              'Bu e-posta adresi Google ile kayıtlıdır. Tek tıkla hesabınıza giriş yapabilirsiniz.'}
            {step === 'google_name_prompt' &&
              'Google ile oturum açarken sipariş ve etiket işlemleriniz için lütfen Ad ve Soyadınızı girin.'}
            {step === 'new_register' && 'Yeni hesap oluşturmak için bilgilerinizi tamamlayın.'}
          </p>
        </div>

        {/* Giriş Yap / Kayıt Ol Sekmeleri */}
        {step !== 'google_name_prompt' && (
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setStep(email.trim() ? 'existing_password' : 'email');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                step !== 'new_register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setSuccessMessage(null);
                setStep('new_register');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                step === 'new_register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Kayıt Ol
            </button>
          </div>
        )}

        {/* Alert Messages */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center justify-center gap-2.5 animate-fadeIn">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. ADIM: E-POSTA ADRESİ + DEVAM ET */}
        {step === 'email' && (
          <>
            <form onSubmit={handleEmailCheck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  E-Posta Adresi
                </label>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@gmail.com"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white transition-colors"
                  />
                  <Mail size={18} className="absolute left-3.5 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-[#ff0055] hover:bg-[#d90048] disabled:opacity-70 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-98"
              >
                {isLoading ? 'Kontrol Ediliyor...' : 'Devam Et'}
              </button>
            </form>

            {/* Veya Çizgisi */}
            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                veya
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Google ile Giriş Yap */}
            <div className="space-y-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleLaunchGooglePicker}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer active:scale-98 disabled:opacity-70"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span>{isLoading ? 'Google ile Bağlanılıyor...' : 'Google ile Aç / Giriş Yap'}</span>
              </button>

              {lastGoogle && (
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(lastGoogle.email);
                      setStep('google_account_confirm');
                    }}
                    className="text-[11px] text-slate-500 hover:text-[#ff0055] transition-colors"
                  >
                    Son kullanılan: <span className="font-semibold text-slate-700 underline">{lastGoogle.email}</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* 2. ADIM (GOOGLE HESABI TESPİT EDİLDİ): KULLANICIDAN GOOGLE İLE GİRİŞ YAPMASINI RİCA ET */}
        {step === 'google_account_confirm' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200/80 text-center">
              <div className="w-12 h-12 bg-white rounded-full shadow-xs flex items-center justify-center mx-auto mb-2 text-sky-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              <h3 className="font-bold text-slate-900 text-sm">
                {accountName ? `Merhaba, ${accountName}!` : 'Google ile Kayıtlı Hesap'}
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Sayın kullanıcımız, <span className="font-bold text-slate-900">{email}</span> e-posta adresi ile daha önce <strong>Google üzerinden kayıt olunmuştur</strong>. Hesap güvenliğiniz için lütfen aşağıdaki <strong>Google ile Giriş Yap</strong> butonunu kullanarak oturum açınız.
              </p>
            </div>

            {/* Gerçek Google Doğrulama Butonu (Güvenlik Korumalı) */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleLaunchGooglePicker}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-98 disabled:opacity-70"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>{isLoading ? 'Google ile Bağlanılıyor...' : 'Google ile Giriş Yap'}</span>
            </button>

            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                onClick={handleBackToEmail}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors cursor-pointer"
              >
                ← Farklı bir e-posta ile giriş yap
              </button>
            </div>
          </div>
        )}

        {/* GOOGLE İLE GİRİŞ: İSİM VE SOYİSİM İSTEME ADIMI */}
        {step === 'google_name_prompt' && (
          <form onSubmit={handleGoogleNameSubmit} className="space-y-4 animate-fadeIn">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 text-left">
              <div className="flex items-center gap-2 mb-1.5">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                <span className="text-xs font-bold text-emerald-800">Google Hesabı Doğrulandı</span>
              </div>
              <p className="text-xs font-bold text-emerald-950 truncate">
                {googleAuthData?.email || email}
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Sipariş paketiniz, kargo teslimatı ve fatura işlemleriniz için lütfen ad ve soyadınızı belirtin.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ad Soyad (İsim Soyisim) <span className="text-[#ff0055]">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={googleFullName}
                  onChange={(e) => setGoogleFullName(e.target.value)}
                  placeholder="Örn: Mert Yılmaz"
                  className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white transition-colors"
                />
                <User size={18} className="absolute left-3.5 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Lütfen sipariş ve teslimat için geçerli ad ve soyadınızı yazın.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !googleFullName.trim()}
              className="w-full py-3.5 px-4 bg-[#ff0055] hover:bg-[#d90048] disabled:opacity-60 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-98"
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Girişi Tamamla'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setGoogleAuthData(null);
                  setErrorMessage(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
              >
                ← Farklı bir hesapla giriş yap
              </button>
            </div>
          </form>
        )}

        {/* 3. ADIM: ŞİFRELİ GİRİŞ */}
        {step === 'existing_password' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  E-Posta Adresi
                </label>
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="text-[11px] text-[#ff0055] hover:underline font-semibold cursor-pointer"
                >
                  Değiştir
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white transition-colors"
                />
                <Mail size={18} className="absolute left-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Şifre
                </label>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white transition-colors"
                />
                <Lock size={18} className="absolute left-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* SAĞ ALTINDA: ŞİFRENİZİ Mİ UNUTTUNUZ? */}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onForgotPassword) {
                      onForgotPassword(email.trim());
                    }
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-[#ff0055] hover:underline transition-colors cursor-pointer"
                >
                  Şifrenizi mi unuttunuz?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#ff0055] hover:bg-[#d90048] disabled:opacity-70 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-98"
            >
              {isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>

            <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleLaunchGooglePicker}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors cursor-pointer"
              >
                Google ile Giriş
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('new_register');
                  setErrorMessage(null);
                }}
                className="text-xs text-slate-500 hover:text-[#ff0055] font-semibold transition-colors cursor-pointer"
              >
                Yeni Hesap Oluştur
              </button>
            </div>
          </form>
        )}

        {/* 4. ADIM: YENİ KAYIT */}
        {step === 'new_register' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Google ile Hızlı Kayıt Ol Butonu */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleLaunchGooglePicker}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer active:scale-98 disabled:opacity-70"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{isLoading ? 'Google ile Bağlanılıyor...' : 'Google ile Kayıt Ol'}</span>
            </button>

            {/* ya da / veya Ayracı */}
            <div className="relative flex items-center justify-center my-3.5">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                ya da e-posta ile kayıt olun
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* E-posta ile Kayıt Formu */}
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ad Soyad
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Adınız ve Soyadınız"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white transition-colors"
                  />
                  <User size={18} className="absolute left-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    E-Posta Adresi
                  </label>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@gmail.com"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white transition-colors"
                  />
                  <Mail size={18} className="absolute left-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Telefon Numarası
                </label>
                <div className="relative flex items-center">
                  <input
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="05XX XXX XX XX (İsteğe Bağlı)"
                    className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white transition-colors"
                  />
                  <Phone size={18} className="absolute left-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Şifre
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="En az 6 karakter"
                    className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white transition-colors"
                  />
                  <Lock size={18} className="absolute left-3.5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Şifre Tekrar
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    placeholder="Şifrenizi tekrar girin"
                    className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white transition-colors"
                  />
                  <Lock size={18} className="absolute left-3.5 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showPassword ? 'Şifreyi Gizle' : 'Şifreyi Göster'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-[#ff0055] hover:bg-[#d90048] disabled:opacity-70 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-98"
              >
                {isLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
              </button>

              {/* Alt Bilgi: Temiz Giriş Yap Bağlantısı */}
              <div className="text-center pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Zaten bir hesabınız var mı?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setErrorMessage(null);
                    }}
                    className="text-[#ff0055] font-bold hover:underline cursor-pointer"
                  >
                    Giriş Yapın
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
