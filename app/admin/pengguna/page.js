'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Penjaga from '../../../components/Penjaga';
import SidebarDesktop from '../../../components/SidebarDesktop';
import NavigasiBawah from '../../../components/NavigasiBawah';
import { ambilDaftarPengguna, getCachedDaftarPengguna, aturUlangSandi } from '../../../lib/api';

export default function AdminPenggunaPage() {
  const [daftarPengguna, setDaftarPengguna] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [cariKata, setCariKata] = useState('');
  const [filterPeran, setFilterPeran] = useState('semua');
  
  // Modal Reset Sandi
  const [targetReset, setTargetReset] = useState(null);
  const [sandiSementara, setSandiSementara] = useState('');
  const [tersalin, setTersalin] = useState(false);
  const [sedangReset, setSedangReset] = useState(false);

  // Modal Tambah Pengguna
  const [bukaModalTambah, setBukaModalTambah] = useState(false);
  const [formPengguna, setFormPengguna] = useState({
    username: '',
    nama_lengkap: '',
    email: '',
    peran: 'Guru',
  });
  const [pesanNotif, setPesanNotif] = useState('');

  useEffect(() => {
    const cached = getCachedDaftarPengguna();
    if (cached) {
      setDaftarPengguna(cached);
      setMemuat(false);
      return;
    }
    muatPengguna();
  }, []);

  async function muatPengguna() {
    setMemuat(true);
    const res = await ambilDaftarPengguna();
    if (res.ok && res.data) {
      setDaftarPengguna(res.data);
    }
    setMemuat(false);
  }

  const penggunaFiltered = daftarPengguna.filter(p => {
    const kata = cariKata.toLowerCase();
    const cocokCari = p.nama_lengkap.toLowerCase().includes(kata) || 
                      p.username.toLowerCase().includes(kata) || 
                      p.email.toLowerCase().includes(kata);
    const cocokPeran = filterPeran === 'semua' || p.peran === filterPeran;
    return cocokCari && cocokPeran;
  });

  async function handleBukaReset(user) {
    setTargetReset(user);
    setSedangReset(true);
    const res = await aturUlangSandi(user.id);
    setSedangReset(false);
    if (res.ok) {
      setSandiSementara(res.sandiSementara);
      setTersalin(false);
      // K5: Perbarui status 1 baris pengguna langsung di state tanpa muat ulang semua akun
      setDaftarPengguna(prev => prev.map(p => p.id === user.id ? { ...p, wajib_ganti_sandi: true } : p));
    } else {
      alert(res.pesan || 'Gagal mengatur ulang sandi');
      setTargetReset(null);
    }
  }

  function handleSalinSandi() {
    if (!sandiSementara) return;
    navigator.clipboard.writeText(sandiSementara);
    setTersalin(true);
    setTimeout(() => setTersalin(false), 2000);
  }

  function handleTambahPengguna(e) {
    e.preventDefault();
    if (!formPengguna.username || !formPengguna.nama_lengkap) return;

    const baru = {
      id: `USR-${formPengguna.peran.toUpperCase()}-${Math.floor(Math.random() * 899 + 100)}`,
      username: formPengguna.username.trim().toLowerCase(),
      nama_lengkap: formPengguna.nama_lengkap.trim(),
      email: formPengguna.email.trim() || `${formPengguna.username}@sekolah.id`,
      peran: formPengguna.peran,
      status_aktif: 'Aktif',
      wajib_ganti_sandi: true
    };

    setDaftarPengguna(prev => [baru, ...prev]);
    setPesanNotif(`Akun ${baru.nama_lengkap} berhasil dibuat dengan sandi default "password123".`);
    setBukaModalTambah(false);
    setFormPengguna({ username: '', nama_lengkap: '', email: '', peran: 'Guru' });
    setTimeout(() => setPesanNotif(''), 4000);
  }

  // Statistik ringkas
  const totalAkun = daftarPengguna.length;
  const totalGuru = daftarPengguna.filter(p => p.peran === 'Guru').length;
  const totalSiswa = daftarPengguna.filter(p => p.peran === 'Siswa').length;

  return (
    <Penjaga peranDiizinkan={['Admin']}>
      <div className="min-h-screen bg-surface flex flex-col md:flex-row font-sans">
        <SidebarDesktop />

        <div className="flex-1 md:pl-64 flex flex-col pb-24 md:pb-12">
          {/* Top Bar Header */}
          <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-border-default/40 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Pusat Otoritas & Keamanan • Administrator</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/profil" className="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-container transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs">
                  AD
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-on-surface">Admin Sekolah</span>
              </Link>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
            {/* Alert Notification */}
            {pesanNotif && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                  <span className="text-sm font-semibold">{pesanNotif}</span>
                </div>
                <button onClick={() => setPesanNotif('')} className="text-emerald-700 hover:text-emerald-900 text-sm">✕</button>
              </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Pusat Keamanan & Autentikasi</span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-0.5">
                  Manajemen Pengguna & Hak Akses
                </h1>
                <p className="text-sm text-on-surface-variant mt-1">
                  Kelola akun guru, staf tata usaha, dan siswa serta pemulihan kredensial masuk.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBukaModalTambah(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Tambah Pengguna</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Metric Ribbons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-border-default/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Total Akun Terdaftar</span>
                  <p className="text-2xl font-extrabold text-on-surface tracking-tight mt-1">{totalAkun}</p>
                  <span className="text-xs font-semibold text-emerald-600 mt-1 inline-block">100% Aktif</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">manage_accounts</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-border-default/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Guru & Pendidik</span>
                  <p className="text-2xl font-extrabold text-on-surface tracking-tight mt-1">{totalGuru}</p>
                  <span className="text-xs text-outline mt-1 inline-block">Terverifikasi</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">badge</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-border-default/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Siswa Terdata</span>
                  <p className="text-2xl font-extrabold text-on-surface tracking-tight mt-1">{totalSiswa}</p>
                  <span className="text-xs text-outline mt-1 inline-block">Login Mandiri NISN</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">school</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-border-default/40 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Fitur Reset Sandi</span>
                  <p className="text-2xl font-extrabold text-primary tracking-tight mt-1">Standar P4</p>
                  <span className="text-xs text-outline mt-1 inline-block">Sandi Sekali Tampil</span>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">vpn_key</span>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-border-default/40 overflow-hidden">
              <div className="p-4 bg-surface-container-low/60 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-lg">
                  <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-outline">search</span>
                    <input
                      type="text"
                      placeholder="Cari nama pengguna, username, atau email..."
                      value={cariKata}
                      onChange={(e) => setCariKata(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest rounded-full text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 border-none shadow-sm"
                    />
                  </div>
                  <select
                    value={filterPeran}
                    onChange={(e) => setFilterPeran(e.target.value)}
                    className="h-9 px-4 rounded-full bg-surface-container-lowest text-xs font-semibold text-on-surface outline-none cursor-pointer shadow-sm"
                  >
                    <option value="semua">Semua Peran</option>
                    <option value="Admin">Admin</option>
                    <option value="Guru">Guru</option>
                    <option value="Siswa">Siswa</option>
                  </select>
                </div>
                <span className="text-xs text-on-surface-variant">
                  Menampilkan <strong>{penggunaFiltered.length}</strong> akun
                </span>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container/60 text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                      <th className="py-3 px-5">ID Akun</th>
                      <th className="py-3 px-5">Nama Pengguna</th>
                      <th className="py-3 px-5">Peran</th>
                      <th className="py-3 px-5">Status</th>
                      <th className="py-3 px-5">Kredensial</th>
                      <th className="py-3 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/30 text-sm">
                    {memuat && daftarPengguna.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 px-5 text-center text-xs font-semibold text-slate-400">
                          Memuat daftar pengguna...
                        </td>
                      </tr>
                    ) : penggunaFiltered.map((p) => {
                      const initial = p.nama_lengkap.split(' ').map(w => w[0]).slice(0, 2).join('');
                      return (
                        <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-xs font-semibold text-outline">
                            {p.id}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                                {initial}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface">{p.nama_lengkap}</span>
                                <span className="text-xs text-outline">{p.email || `${p.username}@sekolah.id`}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              p.peran === 'Admin'
                                ? 'bg-primary text-on-primary'
                                : p.peran === 'Guru'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}>
                              {p.peran}
                            </span>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              {p.status_aktif || 'Aktif'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-xs">
                            {p.wajib_ganti_sandi ? (
                              <span className="text-amber-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                Wajib Ganti Sandi
                              </span>
                            ) : (
                              <span className="text-outline">Sandi Terverifikasi</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => handleBukaReset(p)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px] text-primary">lock_reset</span>
                              <span>Atur Ulang Sandi</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        {/* MODAL RESET SANDI STANDAR P4 */}
        {targetReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-in fade-in">
            <div className="relative w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-2xl border border-border-default/40 flex flex-col gap-5">
              {/* Close Button */}
              <button
                onClick={() => setTargetReset(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                ✕
              </button>

              {/* Icon & Title */}
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <span className="material-symbols-outlined text-[28px]">vpn_key</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">Atur Ulang Sandi Pengguna</h3>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px] text-primary">person</span>
                  <span>{targetReset.nama_lengkap} ({targetReset.peran})</span>
                </div>
              </div>

              {/* Generated Temp Password */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-outline uppercase tracking-wider">Kata Sandi Sementara Dibuat</span>
                <div className="flex items-center justify-between p-3.5 bg-surface-container rounded-2xl border border-border-default/40">
                  <div className="flex flex-col">
                    <span className="font-mono text-xl font-extrabold text-primary tracking-wider select-all">
                      {sedangReset ? 'Membuat...' : sandiSementara}
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                      Aktif 24 jam • Wajib ganti saat login
                    </span>
                  </div>
                  <button
                    onClick={handleSalinSandi}
                    disabled={sedangReset}
                    className={`flex items-center gap-1 px-3.5 py-2 rounded-full font-bold text-xs transition-all shadow-sm ${
                      tersalin
                        ? 'bg-emerald-600 text-white'
                        : 'bg-surface-container-lowest text-primary hover:bg-primary hover:text-white'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {tersalin ? 'check' : 'content_copy'}
                    </span>
                    <span>{tersalin ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Warning Security Box */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 leading-relaxed">
                <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0 mt-0.5">warning</span>
                <p>
                  Serahkan sandi ini langsung kepada pengguna. Demi keamanan privasi, sandi ini <strong>hanya ditampilkan sekali ini saja</strong> dan pengguna wajib mengubahnya pada login pertama.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => setTargetReset(null)}
                  className="w-full py-2.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Selesai & Tutup</span>
                </button>
                <a
                  href={`https://wa.me/?text=Halo%20${encodeURIComponent(targetReset.nama_lengkap)},%20berikut%20adalah%20kredensial%20sementara%20Anda%20untuk%20Aplikasi%20Absensi%20Kelas:%0AUsername:%20${encodeURIComponent(targetReset.username)}%0ASandi%20Sementara:%20${encodeURIComponent(sandiSementara)}%0AHarap%20segera%20login%20dan%20buat%20sandi%20baru.`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 rounded-full bg-transparent hover:bg-surface-container text-primary font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>Kirim Kredensial via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH PENGGUNA */}
        {bukaModalTambah && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-border-default/40">
              <div className="flex items-center justify-between pb-4 border-b border-border-default/40">
                <h3 className="text-lg font-bold text-on-surface">Tambah Pengguna Baru</h3>
                <button onClick={() => setBukaModalTambah(false)} className="text-outline hover:text-on-surface text-xl">✕</button>
              </div>
              <form onSubmit={handleTambahPengguna} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Peran Pengguna</label>
                  <select
                    value={formPengguna.peran}
                    onChange={(e) => setFormPengguna({ ...formPengguna, peran: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  >
                    <option value="Guru">Guru / Tenaga Pendidik</option>
                    <option value="Admin">Administrator Tata Usaha</option>
                    <option value="Siswa">Siswa / Siswi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Username / NIP / NISN</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: guruhasnah atau 19890123"
                    value={formPengguna.username}
                    onChange={(e) => setFormPengguna({ ...formPengguna, username: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hasnah Maulida, S.Pd."
                    value={formPengguna.nama_lengkap}
                    onChange={(e) => setFormPengguna({ ...formPengguna, nama_lengkap: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Email Resmi (Opsional)</label>
                  <input
                    type="email"
                    placeholder="hasnah@sekolah.id"
                    value={formPengguna.email}
                    onChange={(e) => setFormPengguna({ ...formPengguna, email: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBukaModalTambah(false)}
                    className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md shadow-primary/20"
                  >
                    Simpan Akun
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <NavigasiBawah />
      </div>
    </Penjaga>
  );
}

