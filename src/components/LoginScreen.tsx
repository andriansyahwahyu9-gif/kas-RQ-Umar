import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  Lock,
  User,
  UserCheck,
} from 'lucide-react';
import { AppSessionUser } from '../types';
import {
  authenticateWithIdPassword,
  checkHasPasswordAccount,
  createFirstAdminAccount,
  normalizeLoginId,
} from '../services/kasService';

interface LoginScreenProps {
  authNotice?: string | null;
  initialLoginId?: string;
  initialRememberMe?: boolean;
  onLoginSuccess: (user: AppSessionUser, rememberId: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  authNotice,
  initialLoginId = '',
  initialRememberMe = true,
  onLoginSuccess,
}) => {
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsInitialAdmin, setNeedsInitialAdmin] = useState(false);

  const [loginId, setLoginId] = useState(initialLoginId);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(initialRememberMe);
  const [showForgotHelp, setShowForgotHelp] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const checkSetup = async () => {
      try {
        const hasAccount = await checkHasPasswordAccount();
        if (active) {
          setNeedsInitialAdmin(!hasAccount);
        }
      } catch {
        if (active) {
          setNeedsInitialAdmin(false);
        }
      } finally {
        if (active) {
          setCheckingSetup(false);
        }
      }
    };
    checkSetup();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (loginId.includes('@')) {
      setErrorMsg('Login hanya menggunakan ID Login dari Admin, tidak menggunakan email.');
      return;
    }

    const normalized = normalizeLoginId(loginId);
    if (!normalized) {
      setErrorMsg(
        'ID Login tidak valid. Gunakan 2–50 karakter huruf, angka, titik (.), garis bawah (_), atau tanda hubung (-) tanpa spasi.'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password harus terdiri dari minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      if (needsInitialAdmin) {
        if (!fullName.trim()) {
          setErrorMsg('Nama lengkap Admin wajib diisi.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Konfirmasi password tidak cocok.');
          setIsLoading(false);
          return;
        }
        const adminUser = await createFirstAdminAccount({
          loginId: loginId.trim(),
          namaLengkap: fullName.trim(),
          password,
        });
        onLoginSuccess(adminUser, rememberMe);
      } else {
        const sessionUser = await authenticateWithIdPassword(loginId, password);
        onLoginSuccess(sessionUser, rememberMe);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal masuk. Periksa kembali ID Login dan Password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const displayedError = errorMsg || authNotice || null;

  return (
    <div className="min-h-screen bg-[#DFECFA] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[340px]">
        {checkingSetup ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#136EC2] border-t-transparent animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#0F5DA8]">Memuat halaman login...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Circular Blue User Avatar Emblem matching reference */}
            <div className="w-24 h-24 rounded-full border-[2.5px] border-[#136EC2] flex items-center justify-center mb-4 bg-[#DFECFA]">
              <svg
                viewBox="0 0 64 64"
                className="w-16 h-16 text-[#136EC2]"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="32" cy="21" r="10.5" />
                <path d="M13 50.5c0-9.6 8.5-16.5 19-16.5s19 6.9 19 16.5c0 1.4-1.1 2.5-2.5 2.5h-33c-1.4 0-2.5-1.1-2.5-2.5z" />
              </svg>
            </div>

            {needsInitialAdmin && (
              <div className="text-center mb-4">
                <h1 className="text-base font-bold text-[#0E4D8A]">Buat Akun Admin Pertama</h1>
                <p className="text-xs text-[#136EC2] mt-0.5">
                  Atur ID Login dan Password Admin utama majelis
                </p>
              </div>
            )}

            {displayedError && (
              <div className="w-full mb-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{displayedError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full space-y-3.5">
              {/* ID Login Input */}
              <div className="relative flex items-center">
                <User className="w-5 h-5 text-[#136EC2] fill-[#136EC2] absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoComplete={rememberMe ? 'username' : 'off'}
                  aria-label="ID Login"
                  placeholder={needsInitialAdmin ? 'ID Login Admin' : 'ID Login'}
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full pl-11 pr-3.5 py-2.5 rounded-lg border-[1.5px] border-[#136EC2] bg-[#E8F2FC]/85 text-[#0E4D8A] placeholder:text-[#1D74C5] text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136EC2]/40 transition-colors"
                />
              </div>

              {/* Full Name (only on first-run Admin setup) */}
              {needsInitialAdmin && (
                <div className="relative flex items-center">
                  <UserCheck className="w-5 h-5 text-[#136EC2] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    required
                    aria-label="Nama Lengkap Admin"
                    placeholder="Nama Lengkap Admin"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-3.5 py-2.5 rounded-lg border-[1.5px] border-[#136EC2] bg-[#E8F2FC]/85 text-[#0E4D8A] placeholder:text-[#1D74C5] text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136EC2]/40 transition-colors"
                  />
                </div>
              )}

              {/* Password Input */}
              <div className="relative flex items-center">
                <Lock className="w-5 h-5 text-[#136EC2] absolute left-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={needsInitialAdmin ? 'new-password' : 'current-password'}
                  aria-label="Password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-2.5 rounded-lg border-[1.5px] border-[#136EC2] bg-[#E8F2FC]/85 text-[#0E4D8A] placeholder:text-[#1D74C5] text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136EC2]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-[#136EC2] hover:text-[#0E4D8A] p-1 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>

              {/* Confirm Password (only on first-run Admin setup) */}
              {needsInitialAdmin && (
                <div className="relative flex items-center">
                  <Lock className="w-5 h-5 text-[#136EC2] absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    aria-label="Konfirmasi Password"
                    placeholder="Konfirmasi Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-3.5 py-2.5 rounded-lg border-[1.5px] border-[#136EC2] bg-[#E8F2FC]/85 text-[#0E4D8A] placeholder:text-[#1D74C5] text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#136EC2]/40 transition-colors"
                  />
                </div>
              )}

              {/* Remember me & Lupa password row */}
              {!needsInitialAdmin && (
                <div className="flex items-center justify-between pt-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className="inline-flex items-center gap-2 text-[#0F5DA8] hover:text-[#0B4680] font-medium cursor-pointer select-none whitespace-nowrap"
                  >
                    <span
                      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                        rememberMe
                          ? 'bg-[#136EC2] border-[#136EC2] text-white'
                          : 'bg-white/70 border-[#136EC2] text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span>Remember me</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowForgotHelp(!showForgotHelp)}
                    className="text-[#0F5DA8] hover:text-[#0B4680] hover:underline font-medium cursor-pointer whitespace-nowrap"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {showForgotHelp && !needsInitialAdmin && (
                <div className="p-2.5 rounded-lg bg-white/70 border border-[#136EC2]/30 text-[#0E4D8A] text-[11px] flex items-start gap-2 leading-relaxed">
                  <HelpCircle className="w-3.5 h-3.5 text-[#136EC2] shrink-0 mt-0.5" />
                  <span>
                    Silakan hubungi <strong>Admin Majelis</strong> untuk mengatur ulang password akun Anda melalui menu <strong>Master Login</strong>.
                  </span>
                </div>
              )}

              {/* Primary LOGIN Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg bg-[#136EC2] hover:bg-[#0F5DA8] active:scale-[0.99] text-white font-semibold tracking-wider text-base shadow-sm transition-all cursor-pointer disabled:opacity-60 mt-1"
              >
                {isLoading
                  ? 'MEMPROSES...'
                  : needsInitialAdmin
                  ? 'SIMPAN ADMIN & LOGIN'
                  : 'LOGIN'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
