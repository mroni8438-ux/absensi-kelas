'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { masuk } from '../../lib/api';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function LayarMasukPage() {
  const router = useRouter();
  const [identitas, setIdentitas] = useState(isSupabaseConfigured ? '' : 'gurubudi');
  const [sandi, setSandi] = useState(isSupabaseConfigured ? '' : 'password123');
  const [tampilkanSandi, setTampilkanSandi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await masuk(identitas, sandi);
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.pesan || 'ID/username/email atau PIN/password salah.');
      return;
    }

    if (res.pengguna?.wajib_ganti_sandi) {
      router.push('/ganti-sandi-wajib');
    } else if (res.pengguna?.peran === 'Admin') {
      router.push('/admin/kelas');
    } else if (res.pengguna?.peran === 'Siswa') {
      router.push('/siswa');
    } else {
      router.push('/guru');
    }
  };

  const handleQuickFill = (userType) => {
    if (userType === 'guru') {
      setIdentitas('gurubudi');
      setSandi('password123');
    } else if (userType === 'admin') {
      setIdentitas('adminsekolah');
      setSandi('password123');
    } else if (userType === 'siswa') {
      setIdentitas('008123');
      setSandi('password123');
    }
  };

  return (
    <main className="w-full min-h-screen relative flex flex-col justify-center items-center p-4 overflow-hidden select-none">
      {/* Background Gambar Gerbang Sekolah Modern (L6 Latar Penuh — Responsif HP & Desktop) */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center scale-105 transition-all duration-700 bg-login-sekolah"
      >
        {/* Fallback warna jika gambar lambat dimuat */}
        <div className="absolute inset-0 bg-page/90 backdrop-blur-[4px]"></div>
      </div>

      {/* Ambient Glow Orbs */}
      <div className="absolute -top-12 -left-12 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -right-12 w-96 h-96 bg-growth/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Glassmorphism Login Container (L6 Tengah) */}
      <div className="relative w-full max-w-[460px] glass-card p-6 sm:p-8 flex flex-col z-10 shadow-glass border border-white/60">
        
        {/* Status Bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/70 rounded-full border border-slate-200/50 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">T.A. 2026/2027</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary font-semibold">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Resmi Sekolah</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white/90 shadow-md flex items-center justify-center mb-3 border border-slate-100">
            {/* SVG Logo Simbol Buku & Tunas */}
            <svg className="w-10 h-10" viewBox="0 0 100 100" fill="none">
              <path d="M38 74 C26 74 12 70 4 64 L4 26 C14 30 26 32 38 32 Z" fill="#1E293B" />
              <path d="M42 74 C54 74 68 70 76 64 L76 26 C66 30 54 32 42 32 Z" fill="#6A76CC" />
              <rect x="38" y="31" width="4" height="43" rx="2" fill="#5863B5" />
              <path d="M40 23 C30 21 25 11 30 4 C35 9 37 16 40 23 Z" fill="#6A76CC" />
              <path d="M40 23 C50 21 55 11 50 4 C45 9 43 16 40 23 Z" fill="#48BB78" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Absensi <span className="text-primary">Kelas</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            SISTEM PRESENSI & REKAPITULASI OTOMATIS
          </p>
        </div>

        {/* Section Heading */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-800">Masuk Sistem Presensi</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gunakan NIP, NISN, atau Username terdaftar</p>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Input 1: ID / Username / Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex justify-between" htmlFor="identity">
              <span>ID / Username / Email</span>
              <span className="text-slate-400 font-normal">NIP / NISN</span>
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-slate-400 pointer-events-none text-[20px]">
                badge
              </span>
              <input
                id="identity"
                type="text"
                value={identitas}
                onChange={(e) => setIdentitas(e.target.value)}
                placeholder="Masukkan NIP, NISN, atau Username"
                required
                className="w-full pl-11 pr-4 py-3 bg-white/90 rounded-full text-sm text-slate-800 placeholder:text-slate-400 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Input 2: PIN / Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700" htmlFor="password">
                PIN / Password
              </label>
              <span className="text-[11px] text-slate-400">Min. 6 digit</span>
            </div>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-slate-400 pointer-events-none text-[20px]">
                lock
              </span>
              <input
                id="password"
                type={tampilkanSandi ? 'text' : 'password'}
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-11 pr-20 py-3 bg-white/90 rounded-full text-sm text-slate-800 tracking-wider placeholder:text-slate-400 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setTampilkanSandi(!tampilkanSandi)}
                className="absolute right-2 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex items-center gap-1 font-semibold"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {tampilkanSandi ? 'visibility_off' : 'visibility'}
                </span>
                <span>{tampilkanSandi ? 'Tutup' : 'Lihat'}</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-soft hover:shadow-hover transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Memeriksa Akun...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Switcher (Hanya Tampil di Mode Contoh Lokal) */}
        {!isSupabaseConfigured && (
          <div className="mt-6 pt-4 border-t border-slate-200/60">
            <p className="text-[11px] font-bold text-slate-400 uppercase text-center mb-2 tracking-wider">
              Uji Coba Akun Demo Cepat
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('guru')}
                className="py-1.5 px-2 bg-white/80 hover:bg-primary-light border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors text-center"
              >
                👨‍🏫 Guru
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="py-1.5 px-2 bg-white/80 hover:bg-primary-light border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors text-center"
              >
                🏢 Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('siswa')}
                className="py-1.5 px-2 bg-white/80 hover:bg-primary-light border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors text-center"
              >
                🎓 Siswa
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              Sandi demo bawaan: <code className="bg-slate-100 px-1 rounded">password123</code>
            </p>
          </div>
        )}

      </div>
    </main>
  );
}

