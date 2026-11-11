'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { gantiSandi, getActiveSession } from '../../lib/api';

export default function GantiSandiWajibPage() {
  const router = useRouter();
  const [sandiBaru, setSandiBaru] = useState('');
  const [ulangiSandi, setUlangiSandi] = useState('');
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState('');
  const [sukses, setSukses] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPesan('');

    if (sandiBaru.length < 8) {
      setPesan('Sandi baru minimal 8 karakter.');
      return;
    }
    if (sandiBaru !== ulangiSandi) {
      setPesan('Konfirmasi sandi baru tidak cocok.');
      return;
    }

    setLoading(true);
    const res = await gantiSandi('', sandiBaru);
    setLoading(false);

    if (!res.ok) {
      setPesan(res.pesan || 'Gagal memperbarui sandi.');
      return;
    }

    setSukses(true);
    setTimeout(() => {
      const user = getActiveSession();
      if (user?.peran === 'Admin') router.push('/admin/kelas');
      else if (user?.peran === 'Siswa') router.push('/siswa');
      else router.push('/guru');
    }, 1200);
  };

  return (
    <main className="w-full min-h-screen flex flex-col justify-center items-center p-4 bg-page select-none">
      <div className="w-full max-w-[440px] bg-white rounded-card shadow-soft p-6 sm:p-8 border border-slate-200">
        
        {/* Security Icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[32px]">lock_reset</span>
          </div>
          <h1 className="text-xl font-bold text-slate-800">Buat Sandi Baru Anda</h1>
          <p className="text-xs text-slate-500 mt-1">
            Demi keamanan akun sekolah, perbarui sandi sementara Anda sebelum melanjutkan ke sistem.
          </p>
        </div>

        {/* Alert Notification */}
        {pesan && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-xs flex items-center gap-2 border border-red-200">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{pesan}</span>
          </div>
        )}
        {sukses && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-200">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Sandi berhasil diubah! Mengarahkan ke sistem...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700" htmlFor="new-pass">
              Sandi Baru (Min. 8 Karakter)
            </label>
            <input
              id="new-pass"
              type="password"
              value={sandiBaru}
              onChange={(e) => setSandiBaru(e.target.value)}
              placeholder="Masukkan sandi baru"
              required
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-primary focus:bg-white outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700" htmlFor="confirm-pass">
              Ulangi Sandi Baru
            </label>
            <input
              id="confirm-pass"
              type="password"
              value={ulangiSandi}
              onChange={(e) => setUlangiSandi(e.target.value)}
              placeholder="Ketik ulang sandi baru"
              required
              className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border border-slate-200 focus:border-primary focus:bg-white outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || sukses}
            className="w-full mt-2 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Menyimpan Sandi...</span>
            ) : (
              <>
                <span>Simpan Sandi & Masuk</span>
                <span className="material-symbols-outlined text-[18px]">check</span>
              </>
            )}
          </button>
        </form>

      </div>
    </main>
  );
}

