import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { AkuzLogo } from './AkuzLogo';
import { requestPasswordRecovery } from '../utils/auth';

interface ForgotPasswordPageProps {
  initialEmail?: string;
  onBackToLogin: () => void;
  onGoHome: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  initialEmail = '',
  onBackToLogin,
  onGoHome,
}) => {
  const [email, setEmail] = useState<string>(initialEmail);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSent, setIsSent] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setIsLoading(true);
    const res = await requestPasswordRecovery(cleanEmail);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Şifreniz e-posta adresinize başarıyla gönderildi!');
      setIsSent(true);
    } else {
      setErrorMessage(res.error || 'Şifre gönderilemedi. Lütfen e-posta adresinizi kontrol edin.');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#fcfbf9] to-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-7 sm:p-9 border border-slate-200/80 relative">
        
        {/* Sol Üst Geri Butonu */}
        <button
          type="button"
          onClick={onBackToLogin}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title="Giriş Ekranına Dön"
        >
          <ArrowLeft size={18} />
          <span>Giriş Yap</span>
        </button>

        {/* Logo & Başlık */}
        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <div onClick={onGoHome} className="cursor-pointer mb-2">
            <AkuzLogo size={52} />
          </div>
          <div className="w-12 h-12 bg-pink-50 text-[#ff0055] rounded-2xl flex items-center justify-center mb-3 border border-pink-100">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 font-display uppercase tracking-tight">
            ŞİFREMİ UNUTTUM
          </h1>
          <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
            Hesabınıza bağlı e-posta adresinizi onaylayın, kayıtlı şifrenizi e-posta adresinize hemen gönderelim.
          </p>
        </div>

        {/* Hata Bildirimi */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Başarı Bildirimi */}
        {successMessage && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>Şifreniz Gönderildi!</span>
            </div>
            <p className="text-[12px] text-emerald-700 leading-relaxed">
              {successMessage}
            </p>
            <p className="text-[11px] text-emerald-600">
              Gelen kutunuzu ve gerekirse spam/gereksiz klasörünü kontrol ederek gelen şifre ile giriş yapabilirsiniz.
            </p>
          </div>
        )}

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kayıtlı E-Posta Adresiniz
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
              {isLoading ? 'Şifre Gönderiliyor...' : 'Şifremi E-Posta ile Gönder'}
            </button>
          </form>
        ) : (
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl transition-all shadow-md cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} />
              <span>Giriş Yap Ekranına Dön</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSent(false);
                setSuccessMessage(null);
              }}
              className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Farklı bir e-posta adresi dene
            </button>
          </div>
        )}

        <div className="text-center pt-5 mt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-slate-500 hover:text-[#ff0055] font-semibold transition-colors cursor-pointer"
          >
            ← Giriş Yap
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="text-slate-400 hover:text-slate-700 font-medium transition-colors cursor-pointer"
          >
            Ana Sayfa
          </button>
        </div>

      </div>
    </div>
  );
};
