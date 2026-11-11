'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OfflinePage() {
  const [bukaRincian, setBukaRincian] = useState(false);
  const [sedangCek, setSedangCek] = useState(false);

  function handleCobaLagi() {
    setSedangCek(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 800);
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Periwinkle Blobs for Depth */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-100/50 blur-3xl pointer-events-none"></div>

      {/* Centered Card */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-xl border border-border-default/40 p-6 sm:p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Status Badge with Pulsing Amber Dot */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 text-amber-800 text-xs font-bold mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
          </span>
          <span>Status: Sambungan Terputus</span>
        </div>

        {/* Modern Flat Vector Illustration */}
        <div className="relative w-44 h-36 mb-6 flex items-center justify-center">
          <svg className="w-full h-full drop-shadow-sm" fill="none" viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="90" opacity="0.8" r="70" stroke="#DFE2F3" strokeDasharray="4 6" strokeWidth="2"></circle>
            <circle cx="100" cy="90" opacity="0.6" r="50" stroke="#DFE0FF" strokeWidth="1.5"></circle>
            <circle cx="160" cy="55" fill="#626EC3" r="4"></circle>
            <circle cx="45" cy="120" fill="#926F00" opacity="0.6" r="3"></circle>
            <rect fill="#E7EEFF" height="52" rx="10" width="96" x="52" y="100"></rect>
            <rect fill="#FFFFFF" height="40" rx="6" width="84" x="58" y="106"></rect>
            <rect fill="#DFE2F3" height="4" rx="2" width="36" x="68" y="116"></rect>
            <rect fill="#DFE2F3" height="4" rx="2" width="54" x="68" y="124"></rect>
            <rect fill="#626EC3" height="4" opacity="0.5" rx="2" width="24" x="68" y="132"></rect>
            <path d="M136 82C136 73.1634 128.837 66 120 66C118.895 66 117.822 66.1126 116.786 66.3267C113.664 56.6874 104.654 50 94 50C81.1895 50 70.6726 59.7997 69.5855 72.3486C68.4239 72.1197 67.2259 72 66 72C56.0589 72 48 80.0589 48 90C48 99.9411 56.0589 108 66 108H132C140.837 108 148 100.837 148 92C148 86.8227 144.537 82.4552 140 81.0504" fill="#6A76CC"></path>
            <path d="M94 54C102.5 54 109.8 59.4 112.5 67.1C114.9 66.4 117.4 66 120 66C127.2 66 133 71.8 133 79C133 79.5 132.9 80 132.8 80.5C131.2 80.2 129.6 80 128 80C116.9 80 108 88.9 108 100H66C58.3 100 52 93.7 52 86C52 79.3 56.7 73.7 63.2 72.3C65.3 62 74.5 54 85.5 54H94Z" fill="#DFE0FF" opacity="0.35"></path>
            <g filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.15))">
              <circle cx="130" cy="74" fill="#FFFFFF" r="16"></circle>
              <circle cx="130" cy="74" fill="#FFDAD6" r="13"></circle>
              <path d="M123 67L137 81" stroke="#BA1A1A" strokeLinecap="round" strokeWidth="2.5"></path>
              <path d="M137 67L123 81" stroke="#BA1A1A" strokeLinecap="round" strokeWidth="2.5"></path>
            </g>
          </svg>
        </div>

        {/* Headline */}
        <h1 className="text-2xl font-extrabold text-on-surface mb-2 tracking-tight">
          Tidak Ada Koneksi Internet
        </h1>

        {/* Body Copy */}
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mx-auto mb-6 leading-relaxed">
          Aplikasi Absensi Kelas berjalan dalam mode offline (PWA). Anda tetap dapat melihat data kehadiran yang tersimpan di cache lokal perangkat Anda.
        </p>

        {/* Info Chips */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 w-full mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span>
            <span>Data lokal tersimpan aman</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-semibold">
            <span className="material-symbols-outlined text-[15px] text-primary">sync</span>
            <span>Siap sinkron saat online</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col w-full gap-2.5 sm:max-w-xs mx-auto">
          <button
            onClick={handleCobaLagi}
            disabled={sedangCek}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md transition-all active:scale-[0.98]"
          >
            <span className={`material-symbols-outlined text-[18px] ${sedangCek ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{sedangCek ? 'Memeriksa Jaringan...' : 'Coba Hubungkan Kembali'}</span>
          </button>

          <Link
            href="/guru"
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            <span>Buka Data Tersimpan (Cache Mode)</span>
          </Link>
        </div>

        {/* Discreet Details Toggle */}
        <div className="mt-6 pt-4 w-full border-t border-border-default/40 flex items-center justify-between text-outline text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Cache: Aktif di Perangkat</span>
          </span>
          <button
            onClick={() => setBukaRincian(!bukaRincian)}
            className="hover:text-primary transition-colors flex items-center gap-0.5 font-bold"
          >
            <span>{bukaRincian ? 'Tutup Rincian' : 'Rincian'}</span>
            <span className="material-symbols-outlined text-[14px]">
              {bukaRincian ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>

        {bukaRincian && (
          <div className="mt-3 w-full bg-surface-container-low rounded-xl p-3 text-left text-[11px] text-on-surface-variant flex flex-col gap-1 border border-border-default/30 animate-in fade-in">
            <div className="flex justify-between">
              <span className="text-outline">Service Worker:</span>
              <span className="font-semibold text-emerald-700">Terdaftar & Aktif</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Penyimpanan:</span>
              <span className="font-semibold">CacheStorage & localStorage</span>
            </div>
            <div className="flex justify-between">
              <span className="text-outline">Konektivitas:</span>
              <span className="font-semibold text-amber-700">Offline (Navigator offline)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

