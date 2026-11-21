import React, { useState } from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  BookOpen,
  CalendarCheck,
  ShieldCheck,
  Users,
  BookMarked,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { auth, googleProvider, buildLoginEmail } from '../lib/firebase';

interface LoginScreenProps {
  authNotice?: string | null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ authNotice }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resolvedEmail = buildLoginEmail(loginId);

  const mapAuthError = (err: any): string => {
    const code = err?.code || '';
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return 'ID Login atau password salah. Pastikan akun sudah dibuat atau terdaftar di Master Login.';
    }
    if (code === 'auth/invalid-email') {
      return 'Format ID Login atau email tidak valid. Gunakan huruf, angka, titik, strip, atau format email.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'ID Login / Email tersebut sudah terdaftar. Silakan masuk menggunakan ID dan password Anda.';
    }
    if (code === 'auth/weak-password') {
      return 'Password terlalu lemah. Gunakan minimal 6 karakter.';
    }
    if (code === 'auth/operation-not-allowed') {
      return 'Provider Email/Password belum diaktifkan pada Firebase Console. Silakan aktifkan Email/Password di Firebase Console > Authentication > Sign-in method, atau masuk sementara dengan Google.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Terlalu banyak percobaan login. Silakan tunggu beberapa menit lalu coba kembali.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Jendela login Google ditutup sebelum proses selesai. Silakan coba kembali.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Popup login diblokir oleh browser. Mohon izinkan popup untuk situs ini.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Domain aplikasi belum diizinkan pada pengaturan Firebase Authentication.';
    }
    return 'Gagal memproses autentikasi. Periksa ID, password, dan koneksi internet Anda.';
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!resolvedEmail) {
      setErrorMsg('Mohon masukkan ID Login atau email yang valid.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password harus terdiri dari minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, resolvedEmail, password);
      } else {
        if (!fullName.trim()) {
          setErrorMsg('Mohon masukkan nama lengkap pengurus.');
          setIsLoading(false);
          return;
        }
        const cred = await createUserWithEmailAndPassword(auth, resolvedEmail, password);
        await updateProfile(cred.user, { displayName: fullName.trim() });
      }
    } catch (err: any) {
      setErrorMsg(mapAuthError(err));
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setErrorMsg(mapAuthError(err));
      console.error('Google login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedError = errorMsg || authNotice || null;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Informational Panel */}
        <div className="md:col-span-5 bg-emerald-950 text-white p-8 flex flex-col justify-between gap-8">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center shadow-sm">
              <BookOpen className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div>
              <h1 className="text-2xl font-bold font-serif text-amber-100 tracking-tight">
                Buku Kas & Administrasi Majelis Taklim
              </h1>
              <p className="text-xs text-emerald-200/90 mt-2 leading-relaxed">
                Sistem terpadu pengelolaan kas pengajian, master data anggota, jadwal petugas pekanan, setoran hafalan, serta master login pengurus.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs border-t border-emerald-800/80 pt-5">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span className="text-emerald-100">Buku kas pemasukan, pengeluaran, iuran & laporan PDF/Excel</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Users className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span className="text-emerald-100">Master data anggota pengajian & manajemen akun login</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarCheck className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span className="text-emerald-100">Dasbor jadwal tugas MC, Kultum & Khutbah setiap pekan</span>
            </div>
            <div className="flex items-start gap-2.5">
              <BookMarked className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span className="text-emerald-100">Pencatatan setoran & laporan hafalan Al-Qur&apos;an, Hadits & Doa</span>
            </div>
          </div>
        </div>

        {/* Right Sign-In Card */}
        <div className="md:col-span-7 p-7 sm:p-10 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-800" />
                <span>{mode === 'login' ? 'Masuk ke Dasbor Pengurus' : 'Registrasi ID Pengurus'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'login'
                  ? 'Masukkan ID Login dan Password yang terdaftar pada Master Login.'
                  : 'Buat akun ID & Password baru untuk mulai mengelola sistem majelis.'}
              </p>
            </div>
          </div>

          {displayedError && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{displayedError}</span>
            </div>
          )}

          <form onSubmit={handleCredentialSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Wahyu Andriansyah"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">ID Login / Email *</label>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Contoh: admin atau bendahara"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              {loginId.trim() && !loginId.includes('@') && resolvedEmail && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Identitas sistem: <span className="font-mono text-slate-600">{resolvedEmail}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer disabled:opacity-60"
            >
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>
                {isLoading
                  ? 'Memproses...'
                  : mode === 'login'
                  ? 'Masuk dengan ID & Password'
                  : 'Daftar & Masuk'}
              </span>
            </button>
          </form>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setErrorMsg(null);
              }}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
            >
              {mode === 'login'
                ? 'Belum punya ID? Buat akun pengurus baru'
                : 'Sudah punya ID Login? Kembali ke halaman masuk'}
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">atau masuk dengan</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-xs border border-slate-300 transition-colors cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>Masuk dengan Akun Google</span>
          </button>

          <p className="text-[11px] text-slate-400 mt-5 text-center leading-relaxed">
            Data tersimpan aman di Firebase Cloud Firestore dan tersinkronisasi antar perangkat pengurus.
          </p>
        </div>
      </div>
    </div>
  );
};
