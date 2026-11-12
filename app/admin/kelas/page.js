'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Penjaga from '../../../components/Penjaga';
import SidebarDesktop from '../../../components/SidebarDesktop';
import NavigasiBawah from '../../../components/NavigasiBawah';
import { getDataAwal, getCachedDataAwal, kelolaKelas, kelolaSiswa, simpanPengaturanSekolah } from '../../../lib/api';
import { ambilLokasiGPS } from '../../../lib/mediaHelper';

export default function AdminKelasPage() {
  const [tabAktif, setTabAktif] = useState('kelas'); // 'kelas' | 'siswa' | 'lokasi'
  const [daftarKelas, setDaftarKelas] = useState([]);
  const [daftarSiswa, setDaftarSiswa] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [sedangSimpan, setSedangSimpan] = useState(false);
  const [cariKata, setCariKata] = useState('');
  const [filterTingkat, setFilterTingkat] = useState('semua');
  const [filterKelasSiswa, setFilterKelasSiswa] = useState('semua');
  
  // Modal states
  const [bukaModalKelas, setBukaModalKelas] = useState(false);
  const [bukaModalSiswa, setBukaModalSiswa] = useState(false);
  const [pesanNotif, setPesanNotif] = useState('');

  // Form states
  const [formKelas, setFormKelas] = useState({ nama_kelas: '', tingkat: '7', ruangan: 'Ruang 202 - Gedung A' });
  const [formSiswa, setFormSiswa] = useState({ nisn: '', nama_lengkap: '', kelas_id: 'KLS-07A', jenis_kelamin: 'L', nomor_hp_wali: '' });
  const [formLokasi, setFormLokasi] = useState({
    lokasi_sekolah_lat: '-6.200000',
    lokasi_sekolah_lng: '106.816666',
    radius_absen_meter: '150',
    toleransi_alfa_maks: '3',
  });
  const [mengambilGps, setMengambilGps] = useState(false);
  const [pesanLokasi, setPesanLokasi] = useState(null);

  useEffect(() => {
    const cached = getCachedDataAwal();
    if (cached) {
      setDaftarKelas(cached.daftarKelas || []);
      setDaftarSiswa(cached.daftarSiswa || []);
      if (cached.pengaturan) {
        setFormLokasi({
          lokasi_sekolah_lat: String(cached.pengaturan.lokasi_sekolah_lat ?? '-6.200000'),
          lokasi_sekolah_lng: String(cached.pengaturan.lokasi_sekolah_lng ?? '106.816666'),
          radius_absen_meter: String(cached.pengaturan.radius_absen_meter ?? '150'),
          toleransi_alfa_maks: String(cached.pengaturan.toleransi_alfa_maks ?? '3'),
        });
      }
      setMemuat(false);
      return;
    }
    muatData();
  }, []);

  async function muatData() {
    setMemuat(true);
    const res = await getDataAwal();
    if (res.ok && res.data) {
      setDaftarKelas(res.data.daftarKelas || []);
      setDaftarSiswa(res.data.daftarSiswa || []);
      if (res.data.pengaturan) {
        setFormLokasi({
          lokasi_sekolah_lat: String(res.data.pengaturan.lokasi_sekolah_lat ?? '-6.200000'),
          lokasi_sekolah_lng: String(res.data.pengaturan.lokasi_sekolah_lng ?? '106.816666'),
          radius_absen_meter: String(res.data.pengaturan.radius_absen_meter ?? '150'),
          toleransi_alfa_maks: String(res.data.pengaturan.toleransi_alfa_maks ?? '3'),
        });
      }
    }
    setMemuat(false);
  }

  async function handleAmbilGpsSekolah() {
    setPesanLokasi(null);
    setMengambilGps(true);
    const res = await ambilLokasiGPS();
    setMengambilGps(false);
    if (!res.ok) {
      setPesanLokasi({ ok: false, teks: res.pesan });
      return;
    }
    setFormLokasi((prev) => ({
      ...prev,
      lokasi_sekolah_lat: res.latitude.toFixed(6),
      lokasi_sekolah_lng: res.longitude.toFixed(6),
    }));
    setPesanLokasi({
      ok: true,
      teks: `Koordinat perangkat diambil (akurasi ±${res.akurasi || '?'}m). Klik "Simpan Lokasi & Aturan" untuk menerapkan.`,
    });
  }

  async function handleSimpanLokasi(e) {
    e.preventDefault();
    setPesanLokasi(null);
    const lat = parseFloat(formLokasi.lokasi_sekolah_lat);
    const lng = parseFloat(formLokasi.lokasi_sekolah_lng);
    const rad = parseInt(formLokasi.radius_absen_meter, 10);
    const alfa = parseInt(formLokasi.toleransi_alfa_maks, 10);

    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setPesanLokasi({ ok: false, teks: 'Latitude (-90..90) atau Longitude (-180..180) tidak valid.' });
      return;
    }
    if (Number.isNaN(rad) || rad < 20 || rad > 5000) {
      setPesanLokasi({ ok: false, teks: 'Radius absen harus antara 20 sampai 5000 meter.' });
      return;
    }
    if (Number.isNaN(alfa) || alfa < 1 || alfa > 30) {
      setPesanLokasi({ ok: false, teks: 'Toleransi Alfa maksimal harus antara 1 sampai 30 pertemuan.' });
      return;
    }

    setSedangSimpan(true);
    const res = await simpanPengaturanSekolah(formLokasi);
    setSedangSimpan(false);
    if (res.ok) {
      setPesanLokasi({ ok: true, teks: res.pesan || 'Pengaturan lokasi & aturan berhasil disimpan.' });
    } else {
      setPesanLokasi({ ok: false, teks: res.pesan || 'Gagal menyimpan pengaturan.' });
    }
  }

  const kelasFiltered = daftarKelas.filter(k => {
    const cocokCari = k.nama_kelas.toLowerCase().includes(cariKata.toLowerCase());
    const cocokTingkat = filterTingkat === 'semua' || k.tingkat === filterTingkat;
    return cocokCari && cocokTingkat;
  });

  const siswaFiltered = daftarSiswa.filter(s => {
    const cocokCari = s.nama_lengkap.toLowerCase().includes(cariKata.toLowerCase()) || s.nisn.includes(cariKata);
    const cocokKelas = filterKelasSiswa === 'semua' || s.kelas_id === filterKelasSiswa;
    return cocokCari && cocokKelas;
  });

  async function handleSimpanKelas(e) {
    e.preventDefault();
    if (!formKelas.nama_kelas || sedangSimpan) return;
    setSedangSimpan(true);
    const res = await kelolaKelas('tambah', formKelas);
    setSedangSimpan(false);
    if (res.ok && res.data) {
      setDaftarKelas(prev => [...prev, res.data].sort((a, b) => (a.nama_kelas || '').localeCompare(b.nama_kelas || '')));
      setPesanNotif('Kelas baru berhasil ditambahkan!');
      setBukaModalKelas(false);
      setFormKelas({ nama_kelas: '', tingkat: '7', ruangan: 'Ruang 202 - Gedung A' });
      setTimeout(() => setPesanNotif(''), 3000);
    } else if (!res.ok) {
      alert(res.pesan || 'Gagal menyimpan kelas.');
    }
  }

  async function handleSimpanSiswa(e) {
    e.preventDefault();
    if (!formSiswa.nama_lengkap || !formSiswa.nisn || sedangSimpan) return;
    setSedangSimpan(true);
    const res = await kelolaSiswa('tambah', formSiswa);
    setSedangSimpan(false);
    if (res.ok && res.data) {
      setDaftarSiswa(prev => [...prev, res.data]);
      setDaftarKelas(prev => prev.map(k =>
        k.id === res.data.kelas_id ? { ...k, total_siswa: (k.total_siswa || 0) + 1 } : k
      ));
      setPesanNotif('Siswa baru berhasil didaftarkan!');
      setBukaModalSiswa(false);
      setFormSiswa({ nisn: '', nama_lengkap: '', kelas_id: 'KLS-07A', jenis_kelamin: 'L', nomor_hp_wali: '' });
      setTimeout(() => setPesanNotif(''), 3000);
    } else if (!res.ok) {
      alert(res.pesan || 'Gagal mendaftarkan siswa.');
    }
  }

  return (
    <Penjaga peranDiizinkan={['Admin']}>
      <div className="min-h-screen bg-surface flex flex-col md:flex-row font-sans">
        <SidebarDesktop />

        <div className="flex-1 md:pl-64 flex flex-col pb-24 md:pb-12">
          {/* Top Bar Header */}
          <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-xl border-b border-border-default/40 px-4 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Tahun Ajaran 2026/2027 • Administrator</span>
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

            {/* Header Title Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-[16px]">domain_verification</span>
                  <span>Pusat Administrasi Akademik</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                  Master Data Kelas & Siswa
                </h1>
                <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
                  Kelola rombongan belajar, alokasi wali kelas, dan pendaftaran peserta didik secara mandiri.
                </p>
              </div>

              {/* Quick Metrics Ribbon */}
              <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-full shadow-sm border border-border-default/40 self-start md:self-auto">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  <span className="text-xs font-bold text-on-surface">{daftarKelas.length} Rombel Terdata</span>
                </div>
                <span className="text-outline text-xs">/</span>
                <span className="text-xs text-on-surface-variant">
                  Total <strong className="text-on-surface">{daftarSiswa.length} Siswa</strong>
                </span>
              </div>
            </div>

            {/* Multi Tab Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setTabAktif('kelas')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm ${
                  tabAktif === 'kelas'
                    ? 'bg-primary text-on-primary shadow-primary/20'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                <span>Data Kelas</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  tabAktif === 'kelas' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {daftarKelas.length}
                </span>
              </button>

              <button
                onClick={() => setTabAktif('siswa')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm ${
                  tabAktif === 'siswa'
                    ? 'bg-primary text-on-primary shadow-primary/20'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">groups</span>
                <span>Data Siswa</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  tabAktif === 'siswa' ? 'bg-white/20 text-white' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {daftarSiswa.length}
                </span>
              </button>

              <button
                onClick={() => setTabAktif('lokasi')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm ${
                  tabAktif === 'lokasi'
                    ? 'bg-primary text-on-primary shadow-primary/20'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span>Lokasi GPS &amp; Aturan</span>
              </button>
            </div>

            {/* Filter and Action Toolbar */}
            {tabAktif !== 'lokasi' && (
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-border-default/40 flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="w-full md:max-w-md relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-outline">search</span>
                <input
                  type="text"
                  placeholder={tabAktif === 'kelas' ? 'Cari nama rombel / kelas...' : 'Cari nama siswa atau NISN...'}
                  value={cariKata}
                  onChange={(e) => setCariKata(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-full text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 border-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {tabAktif === 'kelas' ? (
                  <>
                    <select
                      value={filterTingkat}
                      onChange={(e) => setFilterTingkat(e.target.value)}
                      className="h-10 px-4 rounded-full bg-surface-container text-xs font-semibold text-on-surface outline-none cursor-pointer"
                    >
                      <option value="semua">Semua Tingkat</option>
                      <option value="7">Tingkat Kelas 7</option>
                      <option value="8">Tingkat Kelas 8</option>
                      <option value="9">Tingkat Kelas 9</option>
                    </select>

                    <button
                      onClick={() => setBukaModalKelas(true)}
                      className="h-10 px-5 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      <span>Tambah Kelas</span>
                    </button>
                  </>
                ) : (
                  <>
                    <select
                      value={filterKelasSiswa}
                      onChange={(e) => setFilterKelasSiswa(e.target.value)}
                      className="h-10 px-4 rounded-full bg-surface-container text-xs font-semibold text-on-surface outline-none cursor-pointer"
                    >
                      <option value="semua">Semua Kelas</option>
                      {daftarKelas.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setBukaModalSiswa(true)}
                      className="h-10 px-5 rounded-full bg-primary hover:bg-primary/90 text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                      <span>Tambah Siswa</span>
                    </button>
                  </>
                )}
              </div>
            </div>
            )}

            {/* TAB 1: DATA KELAS */}
            {tabAktif === 'kelas' && (
              memuat && daftarKelas.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-44 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60" />
                  ))}
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {kelasFiltered.map((k) => (
                  <div
                    key={k.id}
                    className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-border-default/40 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                            Tingkat {k.tingkat}
                          </span>
                          <h3 className="text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                            {k.nama_kelas}
                          </h3>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
                          {k.total_siswa || 0} Siswa
                        </span>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                          <span>Ruang 201 - Gedung A</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low">
                          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                            BS
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-outline uppercase font-semibold">Wali Kelas</span>
                            <span className="text-xs font-bold text-on-surface truncate">Budi Santoso, S.Pd.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border-default/40 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                        <span>96.5% Rata Kehadiran</span>
                      </div>
                      <Link
                        href={`/guru/kelas/${k.id}/rekap`}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
                      >
                        Rekap <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              )
            )}

            {/* TAB 2: DATA SISWA */}
            {tabAktif === 'siswa' && (
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-border-default/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container/60 text-on-surface-variant text-xs font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">NISN</th>
                        <th className="py-3 px-4">Nama Lengkap</th>
                        <th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-4 text-center">L/P</th>
                        <th className="py-3 px-4">No. HP Orang Tua / Wali</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/30 text-sm">
                      {siswaFiltered.map((s, idx) => {
                        const namaKelas = daftarKelas.find(k => k.id === s.kelas_id)?.nama_kelas || s.kelas_id;
                        return (
                          <tr key={s.id} className="hover:bg-surface-container-low/50 transition-colors">
                            <td className="py-3 px-4 text-outline font-mono text-xs">{idx + 1}</td>
                            <td className="py-3 px-4 font-mono text-xs font-semibold text-primary">{s.nisn}</td>
                            <td className="py-3 px-4 font-bold text-on-surface">{s.nama_lengkap}</td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface-variant">
                                {namaKelas}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-xs text-outline">{s.jenis_kelamin}</td>
                            <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">{s.nomor_hp_wali || '-'}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Aktif
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: LOKASI GPS & ATURAN ABSENSI */}
            {tabAktif === 'lokasi' && (
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border-default/40 max-w-2xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-default/40">
                  <div>
                    <h2 className="text-base font-extrabold text-on-surface">Titik Koordinat Sekolah &amp; Aturan Alfa</h2>
                    <p className="text-xs text-outline mt-0.5">
                      Digunakan untuk validasi radius GPS saat siswa melakukan Absen Mandiri dan batas peringatan dini siswa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAmbilGpsSekolah}
                    disabled={mengambilGps}
                    className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[16px]">my_location</span>
                    <span>{mengambilGps ? 'Mengambil...' : 'Ambil GPS Perangkat Ini'}</span>
                  </button>
                </div>

                {pesanLokasi && (
                  <div className={`p-3.5 rounded-2xl text-xs font-bold border ${
                    pesanLokasi.ok
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {pesanLokasi.teks}
                  </div>
                )}

                <form onSubmit={handleSimpanLokasi} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                        Latitude Sekolah
                      </label>
                      <input
                        type="text"
                        value={formLokasi.lokasi_sekolah_lat}
                        onChange={(e) => setFormLokasi((p) => ({ ...p, lokasi_sekolah_lat: e.target.value }))}
                        placeholder="-6.200000"
                        className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-mono font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                        Longitude Sekolah
                      </label>
                      <input
                        type="text"
                        value={formLokasi.lokasi_sekolah_lng}
                        onChange={(e) => setFormLokasi((p) => ({ ...p, lokasi_sekolah_lng: e.target.value }))}
                        placeholder="106.816666"
                        className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-mono font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                        Radius Absen Maksimal (Meter)
                      </label>
                      <input
                        type="number"
                        min={20}
                        max={5000}
                        value={formLokasi.radius_absen_meter}
                        onChange={(e) => setFormLokasi((p) => ({ ...p, radius_absen_meter: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                        required
                      />
                      <p className="text-[11px] text-outline mt-1">Rekomendasi sekolah: 100 – 250 meter.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                        Batas Toleransi Alfa (Semester)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={formLokasi.toleransi_alfa_maks}
                        onChange={(e) => setFormLokasi((p) => ({ ...p, toleransi_alfa_maks: e.target.value }))}
                        className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-bold text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
                        required
                      />
                      <p className="text-[11px] text-outline mt-1">Menentukan peringatan merah di Portal Siswa.</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={sedangSimpan}
                      className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-on-primary text-xs font-extrabold shadow-md shadow-primary/20 disabled:opacity-60"
                    >
                      {sedangSimpan ? 'Menyimpan...' : 'Simpan Lokasi & Aturan'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </main>
        </div>

        {/* MODAL TAMBAH KELAS */}
        {bukaModalKelas && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-border-default/40">
              <div className="flex items-center justify-between pb-4 border-b border-border-default/40">
                <h3 className="text-lg font-bold text-on-surface">Tambah Kelas Baru</h3>
                <button onClick={() => setBukaModalKelas(false)} className="text-outline hover:text-on-surface text-xl">✕</button>
              </div>
              <form onSubmit={handleSimpanKelas} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Nama Rombel / Kelas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kelas VII-C"
                    value={formKelas.nama_kelas}
                    onChange={(e) => setFormKelas({ ...formKelas, nama_kelas: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Tingkat</label>
                  <select
                    value={formKelas.tingkat}
                    onChange={(e) => setFormKelas({ ...formKelas, tingkat: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  >
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Ruangan</label>
                  <input
                    type="text"
                    placeholder="Ruang 203 - Gedung B"
                    value={formKelas.ruangan}
                    onChange={(e) => setFormKelas({ ...formKelas, ruangan: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBukaModalKelas(false)}
                    className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={sedangSimpan}
                    className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md shadow-primary/20 disabled:opacity-60"
                  >
                    {sedangSimpan ? 'Menyimpan...' : 'Simpan Rombel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH SISWA */}
        {bukaModalSiswa && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-border-default/40">
              <div className="flex items-center justify-between pb-4 border-b border-border-default/40">
                <h3 className="text-lg font-bold text-on-surface">Tambah Siswa Baru</h3>
                <button onClick={() => setBukaModalSiswa(false)} className="text-outline hover:text-on-surface text-xl">✕</button>
              </div>
              <form onSubmit={handleSimpanSiswa} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">NISN (Nomor Induk Siswa Nasional)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 008199"
                    value={formSiswa.nisn}
                    onChange={(e) => setFormSiswa({ ...formSiswa, nisn: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Nama Lengkap Siswa</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Raihan Pratama"
                    value={formSiswa.nama_lengkap}
                    onChange={(e) => setFormSiswa({ ...formSiswa, nama_lengkap: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Kelas</label>
                    <select
                      value={formSiswa.kelas_id}
                      onChange={(e) => setFormSiswa({ ...formSiswa, kelas_id: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                    >
                      {daftarKelas.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kelas}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Jenis Kelamin</label>
                    <select
                      value={formSiswa.jenis_kelamin}
                      onChange={(e) => setFormSiswa({ ...formSiswa, jenis_kelamin: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">No. WhatsApp / HP Orang Tua</label>
                  <input
                    type="tel"
                    placeholder="081234567890"
                    value={formSiswa.nomor_hp_wali}
                    onChange={(e) => setFormSiswa({ ...formSiswa, nomor_hp_wali: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-surface-container-low text-sm font-medium border-none focus:ring-2 focus:ring-primary/40 outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBukaModalSiswa(false)}
                    className="flex-1 py-2.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-xs"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={sedangSimpan}
                    className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-md shadow-primary/20 disabled:opacity-60"
                  >
                    {sedangSimpan ? 'Menyimpan...' : 'Daftarkan Siswa'}
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

