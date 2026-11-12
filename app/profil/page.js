'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Penjaga from '../../components/Penjaga';
import SidebarDesktop from '../../components/SidebarDesktop';
import NavigasiBawah from '../../components/NavigasiBawah';
import { getActiveSession, gantiSandi, keluar, ambilNomorHpSaya, perbaruiNomorHpSaya } from '../../lib/api';

export default function ProfilPage() {
  const router = useRouter();
  const [pengguna, setPengguna] = useState(null);
  
  // Form Ganti Sandi
  const [sandiLama, setSandiLama] = useState('');
  const [sandiBaru, setSandiBaru] = useState('');
  const [konfirmasiSandi, setKonfirmasiSandi] = useState('');
  const [pesanError, setPesanError] = useState('');
  const [pesanSukses, setPesanSukses] = useState('');
  const [sedangSimpan, setSedangSimpan] = useState(false);

  // Nomor WhatsApp Wali Kelas / Admin
  const [nomorHp, setNomorHp] = useState('');
  const [simpanHp, setSimpanHp] = useState(false);
  const [infoHp, setInfoHp] = useState(null);

  useEffect(() => {
    const user = getActiveSession();
    if (user) {
      setPengguna(user);
      setNomorHp(user.nomor_hp || '');
      if (user.peran === 'Guru' || user.peran === 'Admin') {
        ambilNomorHpSaya().then((res) => {
          if (res.ok && res.nomor_hp !== undefined) setNomorHp(res.nomor_hp);
        });
      }
    }
  }, []);

  async function handleSimpanHp(e) {
    e.preventDefault();
    setInfoHp(null);
    setSimpanHp(true);
    const res = await perbaruiNomorHpSaya(nomorHp);
    setSimpanHp(false);
    if (res.ok) {
      setNomorHp(res.nomor_hp || '');
      setPengguna((prev) => (prev ? { ...prev, nomor_hp: res.nomor_hp || '' } : prev));
      setInfoHp({ ok: true, teks: res.pesan || 'Nomor WhatsApp berhasil disimpan.' });
    } else {
      setInfoHp({ ok: false, teks: res.pesan || 'Gagal menyimpan nomor WhatsApp.' });
    }
  }

  async function handleGantiSandi(e) {
    e.preventDefault();
    setPesanError('');
    setPesanSukses('');

    if (sandiBaru.length < 8) {
      setPesanError('Sandi baru harus memiliki panjang minimal 8 karakter.');
      return;
    }

    if (sandiBaru !== konfirmasiSandi) {
      setPesanError('Konfirmasi sandi baru tidak cocok.');
      return;
    }

    setSedangSimpan(true);
    const res = await gantiSandi(sandiLama, sandiBaru);
    setSedangSimpan(false);

    if (res.ok) {
      setPesanSukses('Kata sandi berhasil diperbarui dengan aman!');
      setSandiLama('');
      setSandiBaru('');
      setKonfirmasiSandi('');
    } else {
      setPesanError(res.pesan || 'Gagal memperbarui sandi.');
    }
  }

  async function handleKeluar() {
    await keluar();
    router.replace('/masuk');
  }

  if (!pengguna) return null;

  const initial = pengguna.nama_lengkap?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'AK';

  return (
    <Penjaga peranDiizinkan={['Admin', 'Guru', 'Siswa']}>
      <div className="min-h-screen bg-surface flex flex-col md:flex-row font-sans">
        <SidebarDesktop />

        <div className="flex-1 md:pl-64 flex flex-col pb-24 md:pb-12">
          {/* Header Bar */}
          <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-border-default/40 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Profil Pengguna & Keamanan Akun</span>
            </div>
            <button
              onClick={handleKeluar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span>Keluar</span>
            </button>
          </header>

          {/* Main Container */}
          <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex flex-col gap-6">
            {/* Header Titles */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Kredensial & Otoritas</span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-0.5">
                  Pengaturan Profil & Sandi Mandiri
                </h1>
                <p className="text-sm text-on-surface-variant mt-1">
                  Kelola data pribadi Anda dan perbarui kata sandi secara berkala.
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-primary">devices</span>
                <span>Sesi Aktif: Perangkat Ini</span>
              </div>
            </div>

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Kolom Kiri: Biodata Pengguna */}
              <div className="lg:col-span-6 bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm border border-border-default/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b border-border-default/40 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[20px]">badge</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-on-surface">Biodata Profil</h2>
                      <span className="text-xs text-outline">Informasi akun terdaftar di sistem</span>
                    </div>
                  </div>

                  {/* Profile Avatar Card */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary text-on-primary font-extrabold text-xl flex items-center justify-center shadow-md">
                      {initial}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-extrabold text-on-surface truncate">
                          {pengguna.nama_lengkap}
                        </span>
                        <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                      </div>
                      <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit">
                        Peran: {pengguna.peran}
                      </span>
                      <span className="text-xs text-outline mt-1">
                        SMP Negeri 1 Teladan • Tahun 2026/2027
                      </span>
                    </div>
                  </div>

                  {/* Field Identitas Read-only */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase mb-1">
                        ID Pengguna / Username
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={pengguna.username}
                          className="w-full h-11 px-4 rounded-xl bg-surface-container text-sm font-mono text-on-surface outline-none cursor-not-allowed"
                        />
                        <span className="material-symbols-outlined absolute right-3 top-3 text-[18px] text-outline">lock</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-outline uppercase mb-1">
                        Alamat Email
                      </label>
                      <input
                        type="email"
                        readOnly
                        value={pengguna.email || `${pengguna.username}@sekolah.id`}
                        className="w-full h-11 px-4 rounded-xl bg-surface-container text-sm font-medium text-on-surface outline-none cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-outline uppercase mb-1">
                        Status Akun
                      </label>
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-800 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>Aktif & Terverifikasi (PWA Standar)</span>
                      </div>
                    </div>

                    {(pengguna.peran === 'Guru' || pengguna.peran === 'Admin') && (
                      <form onSubmit={handleSimpanHp} className="pt-2 border-t border-border-default/30 space-y-2.5">
                        <label className="block text-xs font-bold text-outline uppercase">
                          Nomor WhatsApp Aktif (Kontak Wali Kelas)
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="tel"
                            value={nomorHp}
                            onChange={(e) => setNomorHp(e.target.value)}
                            placeholder="Contoh: 081234567890"
                            className="flex-1 h-11 px-4 rounded-xl bg-surface-container-low border border-border-default/60 text-sm font-mono text-on-surface outline-none focus:border-primary"
                          />
                          <button
                            type="submit"
                            disabled={simpanHp}
                            className="px-5 h-11 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-colors disabled:opacity-60 shrink-0"
                          >
                            {simpanHp ? 'Menyimpan...' : 'Simpan No. WA'}
                          </button>
                        </div>
                        <p className="text-[11px] text-outline">
                          Nomor ini dipakai tombol &ldquo;Hubungi Wali Kelas&rdquo; di Portal Siswa &amp; Wali Murid.
                        </p>
                        {infoHp && (
                          <p className={`text-xs font-bold ${infoHp.ok ? 'text-emerald-700' : 'text-red-600'}`}>
                            {infoHp.teks}
                          </p>
                        )}
                      </form>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-border-default/40">
                  <p className="text-xs text-outline">
                    * Untuk perubahan data nama, NIP, atau mutasi rombel, harap hubungi staf Administrator Dapodik.
                  </p>
                </div>
              </div>

              {/* Kolom Kanan: Ganti Sandi Mandiri */}
              <div className="lg:col-span-6 bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-sm border border-border-default/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 pb-4 border-b border-border-default/40 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[20px]">password</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-on-surface">Keamanan & Kata Sandi</h2>
                      <span className="text-xs text-outline">Perbarui kata sandi Anda sendiri secara berkala</span>
                    </div>
                  </div>

                  {/* Feedback Banners */}
                  {pesanSukses && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-semibold flex items-center gap-2 mb-4 animate-in fade-in">
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>{pesanSukses}</span>
                    </div>
                  )}

                  {pesanError && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-800 text-xs font-semibold flex items-center gap-2 mb-4 animate-in fade-in">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      <span>{pesanError}</span>
                    </div>
                  )}

                  <form onSubmit={handleGantiSandi} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                        Kata Sandi Saat Ini
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={sandiLama}
                        onChange={(e) => setSandiLama(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                        Kata Sandi Baru
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Minimal 8 karakter"
                        value={sandiBaru}
                        onChange={(e) => setSandiBaru(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                        Konfirmasi Kata Sandi Baru
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Ulangi kata sandi baru"
                        value={konfirmasiSandi}
                        onChange={(e) => setKonfirmasiSandi(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                      />
                    </div>

                    {/* Security Checklist */}
                    <div className="p-3.5 rounded-2xl bg-surface-container-low space-y-1.5 text-xs text-on-surface-variant">
                      <span className="font-bold text-[11px] text-outline uppercase block mb-1">Persyaratan Sandi Aman:</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-[15px] ${sandiBaru.length >= 8 ? 'text-emerald-600' : 'text-outline'}`}>
                          {sandiBaru.length >= 8 ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Minimal 8 karakter</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`material-symbols-outlined text-[15px] ${sandiBaru && sandiBaru === konfirmasiSandi ? 'text-emerald-600' : 'text-outline'}`}>
                          {sandiBaru && sandiBaru === konfirmasiSandi ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Sandi baru dan konfirmasi cocok</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={sedangSimpan}
                      className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all mt-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                      <span>{sedangSimpan ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
                    </button>
                  </form>
                </div>

                <div className="mt-8 pt-4 border-t border-border-default/40 flex items-center justify-between text-xs text-outline">
                  <span>Enkripsi bcrypt Supabase Auth</span>
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">shield</span>
                </div>
              </div>
            </div>
          </main>
        </div>

        <NavigasiBawah />
      </div>
    </Penjaga>
  );
}

