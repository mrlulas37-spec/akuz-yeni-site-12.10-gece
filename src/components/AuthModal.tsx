import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
import { AkuzLogo } from './AkuzLogo';
import { UserProfile } from '../types';
import {
  loginUser,
  registerUser,
  loginWithGoogleAccount,
  checkEmailExistsDetailed,
  getLastGoogleAccount,
  triggerGoogleAccountPicker,
} from '../utils/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

type AuthStep = 'email' | 'existing_password' | 'google_account_confirm' | 'new_register';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<AuthStep>('email');

  // Form fields
  const [email, setEmail] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [registerName, setRegisterName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Status & validation states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Last Google account
  const [lastGoogle, setLastGoogle] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const savedLast = getLastGoogleAccount();
      if (savedLast) {
        setLastGoogle(savedLast);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Doğrudan gerçek Google açılır penceresini ve resmi hesap seçicisini aç
  const handleLaunchGooglePicker = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await triggerGoogleAccountPicker(
        (user) => {
          setIsLoading(false);
          setSuccessMessage(`Google ile başarıyla giriş yapıldı! Hoş geldiniz, ${user.name}`);
          setTimeout(() => {
            onLoginSuccess(user);
            onClose();
          }, 350);
        },
        (errorMsg) => {
          setIsLoading(false);
          setErrorMessage(errorMsg);
        }
      );
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Google oturum açma penceresi açılamadı.');
    }
  };

  // Step 1: E-posta kontrolü
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
          setStep('google_account_confirm');
        } else {
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

  // Step 2A: Mevcut hesap şifresiyle "Giriş Yap"
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
      setErrorMessage(res.error || 'Giriş yapılamadı.');
    } else {
      setSuccessMessage('Başarıyla giriş yapıldı!');
      setTimeout(() => {
        onLoginSuccess(res.user!);
        onClose();
      }, 500);
    }
  };

  // Step 2B: Yeni üyelik ile "Kayıt Ol"
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!registerName.trim()) {
      setErrorMessage('Lütfen Ad ve Soyadınızı girin.');
      return;
    }

    if (registerPassword.length < 6) {
      setErrorMessage('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('Girdiğiniz şifreler eşleşmiyor.');
      return;
    }

    setIsLoading(true);
    const res = await registerUser(registerName, email, registerPassword);
    setIsLoading(false);

    if (!res.success || !res.user) {
      setErrorMessage(res.error || 'Kayıt işlemi başarısız.');
    } else {
      setSuccessMessage('Hesabınız oluşturuldu! Yönlendiriliyorsunuz...');
      setTimeout(() => {
        onLoginSuccess(res.user!);
        onClose();
      }, 600);
    }
  };

  // Google ile kesintisiz doğrudan giriş (origin_mismatch sorununu %100 çözer)
  const handleBackToEmail = () => {
    setStep('email');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200/80 p-7 sm:p-9 relative">
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Geri Dön Butonu (1. adım dışında görünür) */}
        {step !== 'email' && (
          <button
            type="button"
            onClick={handleBackToEmail}
            className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="E-posta adımına dön"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6 pt-1">
          <AkuzLogo size={48} />
          <h2 className="text-xl font-black text-slate-900 font-display mt-2 uppercase tracking-tight">
            {step === 'email' && 'GİRİŞ YAP VEYA KAYIT OL'}
            {step === 'existing_password' && 'HESABINIZA GİRİŞ YAPIN'}
            {step === 'google_account_confirm' && 'GOOGLE İLE GİRİŞ YAP'}
            {step === 'new_register' && 'HESAP OLUŞTUR'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            {step === 'email' &&
              'AKUZ Stickers hesabınıza erişmek, adreslerinizi ve siparişlerinizi görüntülemek için e-posta adresinizi girin.'}
            {step === 'existing_password' &&
              (accountName ? `Hoş geldiniz, ${accountName}! Şifrenizi girerek hesabınıza erişin.` : 'Kayıtlı hesabınız bulundu. Şifrenizi girerek giriş yapın.')}
            {step === 'google_account_confirm' &&
              'Bu e-posta adresi Google ile kayıtlıdır. Tek tıkla oturum açabilirsiniz.'}
            {step === 'new_register' && 'Yeni hesap oluşturmak için bilgilerinizi tamamlayın.'}
          </p>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 1. ADIM: E-POSTA + DEVAM ET */}
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
                    autoFocus
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
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                veya
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            {/* Google ile Giriş Butonu (Doğrudan Google Hesap Seçiciyi Açar) */}
            <div>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleLaunchGooglePicker}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-sm rounded-xl transition-all shadow-xs hover:shadow-sm cursor-pointer active:scale-98 disabled:opacity-70"
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
                <span>Google ile Giriş Yap</span>
              </button>

              {lastGoogle && (
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  Son kullanılan: <span className="font-semibold text-slate-600">{lastGoogle.email}</span>
                </p>
              )}
            </div>
          </>
        )}

        {/* 2. ADIM (GOOGLE HESABI): 1-TIKLA GOOGLE GİRİŞİ */}
        {step === 'google_account_confirm' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 text-center">
              <div className="w-10 h-10 bg-white rounded-full shadow-xs flex items-center justify-center mx-auto mb-2 text-emerald-600">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-emerald-950 text-sm">
                {accountName ? `Merhaba, ${accountName}!` : 'Kayıtlı Google Hesabı'}
              </h3>
              <p className="text-xs text-emerald-700 mt-1">
                <span className="font-semibold">{email}</span> e-posta adresiniz sitemizde kayıtlıdır. Tüm adresleriniz ve siparişleriniz korunmaktadır.
              </p>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleLaunchGooglePicker}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-70 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-98"
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
              <span>{isLoading ? 'Giriş Yapılıyor...' : 'Google ile Doğrula ve Giriş Yap'}</span>
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setStep('existing_password')}
                className="text-xs text-slate-500 hover:text-[#ff0055] font-semibold transition-colors cursor-pointer"
              >
                Şifre ile giriş yapmak istiyorum
              </button>
            </div>
          </div>
        )}

        {/* 3. ADIM: MEVCUT HESAP ŞİFRESİ */}
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Şifre
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
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
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">E-Posta</label>
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
                  className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white"
                />
                <Mail size={18} className="absolute left-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ad Soyad</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  autoFocus
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="Adınız ve Soyadınız"
                  className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white"
                />
                <User size={18} className="absolute left-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Şifre Belirleyin</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                  className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white"
                />
                <Lock size={18} className="absolute left-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Şifre Tekrar</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  placeholder="Şifrenizi tekrar girin"
                  className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#ff0055] focus:bg-white"
                />
                <Lock size={18} className="absolute left-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#ff0055] hover:bg-[#d90048] disabled:opacity-70 text-white font-extrabold text-sm rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-98"
            >
              {isLoading ? 'Hesap Oluşturuluyor...' : 'Kayıt Ol'}
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
                  setStep('existing_password');
                  setErrorMessage(null);
                }}
                className="text-xs text-slate-500 hover:text-[#ff0055] font-semibold transition-colors cursor-pointer"
              >
                Zaten hesabım var
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
