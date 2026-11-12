'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SidebarDesktop from '../../components/SidebarDesktop';
import NavigasiBawah from '../../components/NavigasiBawah';
import Penjaga from '../../components/Penjaga';
import GrafikTrenSiswa from '../../components/siswa/GrafikTrenSiswa';
import KalenderKehadiranSiswa from '../../components/siswa/KalenderKehadiranSiswa';
import LaporanCetakSiswa from '../../components/siswa/LaporanCetakSiswa';
import PanelAbsenMandiri from '../../components/siswa/PanelAbsenMandiri';
import PanelIzinSiswa from '../../components/siswa/PanelIzinSiswa';
import {
  getActiveSession,
  ambilRiwayatSiswa,
  ambilSesiAktifSiswa,
  ambilPengajuanIzinSiswa,
  buatTautanBerkas,
  hitungRingkasanKehadiran,
  keluar,
} from '../../lib/api';
import {
  ambilDaftarBulan,
  buatPesanWhatsAppWali,
  evaluasiPeringatanKehadiran,
  formatTanggalIndonesia,
  getStatusStyle,
  hitungTrenBulanan,
  NAMA_BULAN,
} from '../../lib/siswaHelper';

const FILTER_STATUS_OPSI = [
  { key: 'semua', label: 'Semua' },
  { key: 'tidak_hadir', label: 'Tidak Hadir (S/I/A)' },
  { key: 'Hadir', label: 'Hadir' },
  { key: 'Sakit', label: 'Sakit' },
  { key: 'Izin', label: 'Izin' },
  { key: 'Alfa', label: 'Alfa' },
];

const PERINGATAN_STYLE = {
  ok: {
    wrap: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: 'verified',
    iconClass: 'text-emerald-600',
    badge: 'text-emerald-600',
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: 'warning',
    iconClass: 'text-amber-600',
    badge: 'text-amber-600',
  },
  danger: {
    wrap: 'bg-red-50 border-red-200 text-red-900',
    icon: 'error',
    iconClass: 'text-red-600',
    badge: 'text-red-600',
  },
  info: {
    wrap: 'bg-slate-50 border-slate-200 text-slate-800',
    icon: 'info',
    iconClass: 'text-primary',
    badge: 'text-slate-500',
  },
};

export default function DasborSiswaPage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState(null);
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [dataSiswa, setDataSiswa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Interaksi UI
  const [periodeAktif, setPeriodeAktif] = useState('semua'); // 'semua' | 'YYYY-MM'
  const [filterStatus, setFilterStatus] = useState('semua');
  const [bulanKalender, setBulanKalender] = useState('2026-11');
  const [tanggalTerpilih, setTanggalTerpilih] = useState(null);
  const [jumlahTampil, setJumlahTampil] = useState(15);

  // Modal WhatsApp Wali Kelas
  const [bukaModalWA, setBukaModalWA] = useState(false);
  const [pesanTersalin, setPesanTersalin] = useState(false);

  // Tahap 2: Sesi Absen Mandiri, Pengajuan Izin, & Pratinjau Foto Selfie
  const [sesiAktifList, setSesiAktifList] = useState([]);
  const [loadingSesi, setLoadingSesi] = useState(true);
  const [daftarIzin, setDaftarIzin] = useState([]);
  const [loadingIzin, setLoadingIzin] = useState(true);
  const [pratinjauSelfie, setPratinjauSelfie] = useState(null);
  const [memuatSelfieId, setMemuatSelfieId] = useState(null);

  async function muatSesiDanIzin(siswaIdAktual) {
    if (!siswaIdAktual) {
      setSesiAktifList([]);
      setDaftarIzin([]);
      setLoadingSesi(false);
      setLoadingIzin(false);
      return;
    }
    setLoadingSesi(true);
    setLoadingIzin(true);
    const [sesiRes, izinRes] = await Promise.all([
      ambilSesiAktifSiswa(siswaIdAktual),
      ambilPengajuanIzinSiswa(siswaIdAktual),
    ]);
    if (sesiRes.ok) setSesiAktifList(sesiRes.data || []);
    if (izinRes.ok) setDaftarIzin(izinRes.data || []);
    setLoadingSesi(false);
    setLoadingIzin(false);
  }

  async function muatData(targetId, force = false) {
    if (force) setRefreshing(true);
    else setLoading(true);

    const user = getActiveSession();
    setSessionUser(user);

    const idToFetch = targetId || user?.id || user?.username || '008123';
    const res = await ambilRiwayatSiswa(idToFetch, { force });
    if (res.ok && res.data) {
      setDataSiswa(res.data);
      const daftarBln = ambilDaftarBulan(res.data.riwayat || []);
      if (daftarBln.length > 0) {
        setBulanKalender(daftarBln[0].key);
      } else {
        const now = new Date();
        setBulanKalender(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      }
      await muatSesiDanIzin(res.data.siswa?.id);
    } else {
      setLoadingSesi(false);
      setLoadingIzin(false);
    }

    setLoading(false);
    setRefreshing(false);
  }

  async function handleLihatSelfie(row) {
    if (!row?.foto_selfie_path) return;
    setMemuatSelfieId(row.id);
    const res = await buatTautanBerkas('foto-presensi', row.foto_selfie_path);
    setMemuatSelfieId(null);
    if (res.ok && res.url) {
      setPratinjauSelfie({
        url: res.url,
        judul: `Selfie Check-In (${formatTanggalIndonesia(row.tanggal)})`,
      });
    }
  }

  useEffect(() => {
    muatData(selectedSiswaId || undefined, false);
  }, [selectedSiswaId]);

  const handleLogout = async () => {
    await keluar();
    router.push('/masuk');
  };

  const student = dataSiswa?.siswa || {
    nama_lengkap: 'Memuat...',
    nisn: '-',
    nomor_absen: '-',
    kelas_id: '-',
  };
  const kelasInfo = dataSiswa?.kelas || null;
  const pengaturan = dataSiswa?.pengaturan || {
    nama_sekolah: 'SMP Negeri 1 Teladan',
    tahun_ajaran: '2026/2027',
    semester: 'Ganjil',
    toleransi_alfa_maks: '3',
  };
  const namaKelas = kelasInfo?.nama_kelas || student.kelas_id || '-';
  const namaWaliKelas = dataSiswa?.wali_kelas?.nama_lengkap || null;
  const semuaRiwayat = dataSiswa?.riwayat || [];

  const daftarBulan = useMemo(() => ambilDaftarBulan(semuaRiwayat), [semuaRiwayat]);
  const trenBulanan = useMemo(() => hitungTrenBulanan(semuaRiwayat), [semuaRiwayat]);

  const riwayatPeriode = useMemo(() => {
    if (periodeAktif === 'semua') return semuaRiwayat;
    return semuaRiwayat.filter((r) => r.tanggal && r.tanggal.startsWith(periodeAktif));
  }, [semuaRiwayat, periodeAktif]);

  const stats = useMemo(() => {
    if (periodeAktif === 'semua' && dataSiswa?.ringkasan) {
      return dataSiswa.ringkasan;
    }
    return hitungRingkasanKehadiran(riwayatPeriode);
  }, [periodeAktif, dataSiswa, riwayatPeriode]);

  const riwayatTersaring = useMemo(() => {
    return riwayatPeriode.filter((r) => {
      if (tanggalTerpilih && r.tanggal !== tanggalTerpilih) return false;
      if (filterStatus === 'semua') return true;
      if (filterStatus === 'tidak_hadir') return r.status !== 'Hadir';
      return r.status === filterStatus;
    });
  }, [riwayatPeriode, filterStatus, tanggalTerpilih]);

  const riwayatPaginasi = riwayatTersaring.slice(0, jumlahTampil);
  const sisaRiwayat = Math.max(riwayatTersaring.length - riwayatPaginasi.length, 0);

  const peringatan = evaluasiPeringatanKehadiran(stats, pengaturan.toleransi_alfa_maks);
  const gayaPeringatan = PERINGATAN_STYLE[peringatan.tingkat] || PERINGATAN_STYLE.info;
  const maksAlfa = Math.max(parseInt(pengaturan.toleransi_alfa_maks, 10) || 3, 1);

  const labelPeriode = useMemo(() => {
    if (periodeAktif === 'semua') {
      return `Semester ${pengaturan.semester || 'Ganjil'} ${pengaturan.tahun_ajaran || '2026/2027'}`;
    }
    const [y, m] = periodeAktif.split('-').map(Number);
    return `${NAMA_BULAN[(m || 1) - 1]} ${y}`;
  }, [periodeAktif, pengaturan]);

  const infoWA = useMemo(() => buatPesanWhatsAppWali({
    siswa: student,
    namaKelas,
    ringkasan: stats,
    namaSekolah: pengaturan.nama_sekolah,
    nomorHpWali: dataSiswa?.wali_kelas?.nomor_hp || '',
  }), [student, namaKelas, stats, pengaturan.nama_sekolah, dataSiswa?.wali_kelas?.nomor_hp]);

  const handlePilihPeriode = (val) => {
    setPeriodeAktif(val);
    setTanggalTerpilih(null);
    setJumlahTampil(15);
    if (val !== 'semua') {
      setBulanKalender(val);
    }
  };

  const handleSalinPesanWA = async () => {
    try {
      await navigator.clipboard.writeText(infoWA.pesan);
      setPesanTersalin(true);
      setTimeout(() => setPesanTersalin(false), 2500);
    } catch (e) {}
  };

  // Ringkasan jumlah tiap chip filter pada periode terpilih
  const jumlahPerFilter = {
    semua: riwayatPeriode.length,
    tidak_hadir: riwayatPeriode.filter((r) => r.status !== 'Hadir').length,
    Hadir: riwayatPeriode.filter((r) => r.status === 'Hadir').length,
    Sakit: riwayatPeriode.filter((r) => r.status === 'Sakit').length,
    Izin: riwayatPeriode.filter((r) => r.status === 'Izin').length,
    Alfa: riwayatPeriode.filter((r) => r.status === 'Alfa').length,
  };

  return (
    <Penjaga allowedRoles={['Siswa', 'Admin', 'Guru']}>
      {/* Tampilan Layar Interaktif (Disembunyikan saat Print PDF) */}
      <div className="no-print flex min-h-screen bg-page">
        {/* Panel 1: Sidebar Kiri Desktop */}
        <SidebarDesktop />

        {/* Workspace Utama: Tengah & Kanan */}
        <div className="flex-1 flex flex-col lg:flex-row pb-24 lg:pb-0 min-w-0">

          {/* Panel 2: Konten Tengah */}
          <main className="flex-1 flex flex-col min-w-0">
            {/* Mobile Top App Bar */}
            <header className="lg:hidden bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">school</span>
                </div>
                <div className="min-w-0">
                  <h1 className="font-extrabold text-sm text-slate-800 leading-tight truncate">
                    Portal Siswa & Wali
                  </h1>
                  <p className="text-[10px] text-slate-400 truncate">
                    {pengaturan.nama_sekolah} • {pengaturan.tahun_ajaran}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-0 p-2 text-primary hover:bg-primary-light rounded-full transition-colors"
                  title="Cetak / Unduh PDF"
                >
                  <span className="material-symbols-outlined text-[19px]">print</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="min-h-0 p-2 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
                  title="Keluar"
                >
                  <span className="material-symbols-outlined text-[19px]">logout</span>
                </button>
              </div>
            </header>

            <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-4xl w-full mx-auto">
              {/* Desktop Header Bar */}
              <div className="hidden lg:flex items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    {pengaturan.nama_sekolah} • T.A. {pengaturan.tahun_ajaran} ({pengaturan.semester})
                  </span>
                  <h1 className="font-black text-2xl text-slate-800 tracking-tight">
                    Portal Pantau Kehadiran Siswa
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => muatData(selectedSiswaId || undefined, true)}
                    disabled={refreshing}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                    <span>{refreshing ? 'Memperbarui...' : 'Segarkan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-soft transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">print</span>
                    <span>Cetak / Unduh PDF</span>
                  </button>
                </div>
              </div>

              {/* Banner Pratinjau Khusus Admin / Guru */}
              {dataSiswa?.isPreview && (
                <div className="bg-primary-light/70 border border-primary/25 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">visibility</span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        Mode Pratinjau Staf ({sessionUser?.peran})
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Anda sedang melihat tampilan Portal Siswa sebagai contoh siswa.
                      </p>
                    </div>
                  </div>
                  {dataSiswa.daftarSiswaPratinjau?.length > 0 && (
                    <select
                      value={student.id || ''}
                      onChange={(e) => setSelectedSiswaId(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-primary/30 rounded-full text-xs font-bold text-slate-700 outline-none"
                    >
                      {dataSiswa.daftarSiswaPratinjau.map((s) => (
                        <option key={s.id} value={s.id}>
                          #{s.nomor_absen} — {s.nama_lengkap} ({s.nisn})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Kartu Profil Siswa Lengkap */}
              <section id="ringkasan" className="bg-white rounded-card p-5 shadow-soft border border-slate-200 scroll-mt-20">
                {loading ? (
                  <div className="flex items-center gap-4 animate-pulse">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-44 bg-slate-200 rounded" />
                      <div className="h-3 w-32 bg-slate-100 rounded" />
                      <div className="h-5 w-52 bg-slate-100 rounded-full" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                        {student.nama_lengkap?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <h2 className="font-extrabold text-lg text-slate-800 leading-snug">
                          {student.nama_lengkap}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          NISN: {student.nisn}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {namaKelas}
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Absen #{student.nomor_absen || '-'}
                          </span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Semester {pengaturan.semester}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end gap-1">
                      <span className="text-[11px] font-semibold text-slate-400">Wali Kelas</span>
                      <span className="text-xs font-extrabold text-slate-700">
                        {namaWaliKelas || `Wali ${namaKelas}`}
                      </span>
                      <span className="hidden sm:inline text-[11px] text-slate-400">
                        T.A. {kelasInfo?.tahun_ajaran || pengaturan.tahun_ajaran}
                      </span>
                    </div>
                  </div>
                )}
              </section>

              {/* Banner Peringatan Dini Kehadiran */}
              {!loading && (
                <div className={`rounded-2xl p-4 border flex items-start gap-3 ${gayaPeringatan.wrap}`}>
                  <span className={`material-symbols-outlined text-[22px] mt-0.5 shrink-0 ${gayaPeringatan.iconClass}`}>
                    {gayaPeringatan.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold">{peringatan.judul}</p>
                    <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">{peringatan.deskripsi}</p>
                  </div>
                </div>
              )}

              {/* Tahap 2: Absen Mandiri Siswa (Kode / QR + GPS + Selfie) */}
              {!loading && student.id && (
                <PanelAbsenMandiri
                  siswa={student}
                  pengaturan={pengaturan}
                  sesiAktifList={sesiAktifList}
                  loadingSesi={loadingSesi}
                  isPreview={Boolean(dataSiswa?.isPreview)}
                  onBerhasilAbsen={() => muatData(selectedSiswaId || undefined, true)}
                />
              )}

              {/* Ringkasan Mobile (Radial + 5 Counter — tampil di bawah lg, di desktop pindah ke Panel Kanan) */}
              <div className="lg:hidden bg-white rounded-card p-5 shadow-soft border border-slate-200 flex flex-col items-center text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Kehadiran • {labelPeriode}
                </p>

                <div className="relative w-32 h-32 flex items-center justify-center my-1">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={stats.persentase < 85 ? 'text-amber-500' : 'text-primary'}
                      strokeDasharray={`${Math.min(stats.persentase, 100)}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-slate-800">{stats.persentase}%</span>
                    <span className={`block text-[10px] font-bold ${gayaPeringatan.badge}`}>
                      {peringatan.labelRingkas}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 w-full mt-3">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-semibold">Total</span>
                    <span className="text-sm font-extrabold text-slate-800">{stats.total_pertemuan}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                    <span className="text-[10px] block font-semibold">Hadir</span>
                    <span className="text-sm font-extrabold">{stats.hadir}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-800">
                    <span className="text-[10px] block font-semibold">Sakit</span>
                    <span className="text-sm font-extrabold">{stats.sakit}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
                    <span className="text-[10px] block font-semibold">Izin</span>
                    <span className="text-sm font-extrabold">{stats.izin}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-red-50 border border-red-100 text-red-800">
                    <span className="text-[10px] block font-semibold">Alfa</span>
                    <span className="text-sm font-extrabold">{stats.alfa}</span>
                  </div>
                </div>

                {/* Tombol Aksi Mobile */}
                <div className="grid grid-cols-2 gap-2 w-full mt-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBukaModalWA(true)}
                    className="py-2.5 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    <span>Chat Wali Kelas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="py-2.5 px-3 rounded-full bg-primary-light hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Unduh PDF</span>
                  </button>
                </div>
              </div>

              {/* Filter Periode */}
              <div className="bg-white rounded-card p-4 shadow-soft border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">filter_list</span>
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Filter Periode Kehadiran</p>
                    <p className="text-[11px] text-slate-400">Menampilkan: {labelPeriode}</p>
                  </div>
                </div>

                <select
                  value={periodeAktif}
                  onChange={(e) => handlePilihPeriode(e.target.value)}
                  className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-700 outline-none focus:border-primary"
                >
                  <option value="semua">Semua Semester ({semuaRiwayat.length} sesi)</option>
                  {daftarBulan.map((b) => (
                    <option key={b.key} value={b.key}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grafik Tren Kehadiran Bulanan */}
              <GrafikTrenSiswa
                trenBulanan={trenBulanan}
                periodeAktif={periodeAktif}
                onPilihBulan={handlePilihPeriode}
              />

              {/* Kalender Kehadiran Bulanan */}
              <KalenderKehadiranSiswa
                riwayat={semuaRiwayat}
                bulanKalender={bulanKalender}
                onUbahBulanKalender={setBulanKalender}
                tanggalTerpilih={tanggalTerpilih}
                onPilihTanggal={(tgl) => {
                  setTanggalTerpilih(tgl);
                  setJumlahTampil(15);
                }}
              />

              {/* Tahap 2: Pengajuan Izin & Sakit Online */}
              {!loading && student.id && (
                <PanelIzinSiswa
                  siswa={student}
                  kelasId={kelasInfo?.id || student.kelas_id}
                  daftarPengajuan={daftarIzin}
                  loadingIzin={loadingIzin}
                  isPreview={Boolean(dataSiswa?.isPreview)}
                  onBerhasilAjukan={() => muatData(selectedSiswaId || undefined, true)}
                />
              )}

              {/* Daftar Riwayat Kehadiran dengan Tab Filter Status */}
              <section id="riwayat" className="bg-white rounded-card p-5 shadow-soft border border-slate-200 scroll-mt-20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                      <span>Riwayat Pertemuan & Ketidakhadiran</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Menampilkan {riwayatTersaring.length} catatan ({labelPeriode})
                      {tanggalTerpilih ? ` pada ${formatTanggalIndonesia(tanggalTerpilih)}` : ''}
                    </p>
                  </div>

                  {tanggalTerpilih && (
                    <button
                      type="button"
                      onClick={() => setTanggalTerpilih(null)}
                      className="min-h-0 px-3 py-1 rounded-full bg-primary-light text-primary text-[11px] font-bold self-start sm:self-auto"
                    >
                      Reset tanggal terpilih ×
                    </button>
                  )}
                </div>

                {/* Chip Filter Status */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {FILTER_STATUS_OPSI.map((opsi) => {
                    const aktif = filterStatus === opsi.key;
                    const count = jumlahPerFilter[opsi.key] ?? 0;
                    return (
                      <button
                        key={opsi.key}
                        type="button"
                        onClick={() => {
                          setFilterStatus(opsi.key);
                          setJumlahTampil(15);
                        }}
                        className={`min-h-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                          aktif
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opsi.label} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* Daftar Kartu Riwayat */}
                {loading ? (
                  <div className="space-y-2.5 animate-pulse">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-16 rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : riwayatPaginasi.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {riwayatPaginasi.map((r, i) => {
                      const st = getStatusStyle(r.status);
                      return (
                        <div
                          key={r.id || i}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${st.iconClass}`}>
                              {st.icon}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-slate-800">{r.judul_materi}</p>
                                {r.metode && r.metode !== 'Guru' && (
                                  <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500">
                                    {r.metode === 'Mandiri' ? 'Check-In Mandiri' : 'Izin Online'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {formatTanggalIndonesia(r.tanggal)}
                                {r.jarak_meter !== null && r.jarak_meter !== undefined ? ` • ${r.jarak_meter}m dari sekolah` : ''}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                {r.catatan && r.catatan !== '-' && (
                                  <p className="text-[11px] text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 inline-block">
                                    Ket: {r.catatan}
                                  </p>
                                )}
                                {r.foto_selfie_path && (
                                  <button
                                    type="button"
                                    onClick={() => handleLihatSelfie(r)}
                                    disabled={memuatSelfieId === r.id}
                                    className="min-h-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-primary/40 text-[10px] font-bold text-primary inline-flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                                    <span>{memuatSelfieId === r.id ? 'Membuka...' : 'Lihat Selfie'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${st.badgeClass}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}

                    {sisaRiwayat > 0 && (
                      <button
                        type="button"
                        onClick={() => setJumlahTampil((prev) => prev + 15)}
                        className="mt-2 py-2.5 px-4 rounded-full bg-primary-light hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                      >
                        Muat Lebih Banyak ({sisaRiwayat} catatan lagi)
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                    <span className="material-symbols-outlined text-[28px] text-slate-300">event_available</span>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      Tidak ada catatan kehadiran untuk filter yang dipilih.
                    </p>
                    {filterStatus !== 'semua' && (
                      <button
                        type="button"
                        onClick={() => {
                          setFilterStatus('semua');
                          setTanggalTerpilih(null);
                        }}
                        className="min-h-0 mt-2 text-xs font-bold text-primary hover:underline"
                      >
                        Reset filter status
                      </button>
                    )}
                  </div>
                )}
              </section>
            </div>
          </main>

          {/* Panel 3: Sidebar Statistik & Aksi Kanan Desktop */}
          <aside className="hidden lg:flex w-80 bg-white border-l border-slate-200/80 p-5 min-h-screen flex-col justify-between shrink-0">
            <div>
              <div className="mb-4">
                <h3 className="font-extrabold text-base text-slate-800">Ringkasan Kehadiran</h3>
                <p className="text-xs text-slate-400">{labelPeriode}</p>
              </div>

              {/* Radial Progress Ring */}
              <div className="flex flex-col items-center justify-center p-4 rounded-card bg-page/70 border border-slate-200/60 mb-4">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={stats.persentase < 85 ? 'text-amber-500' : 'text-primary'}
                      strokeDasharray={`${Math.min(stats.persentase, 100)}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-slate-800">{stats.persentase}%</span>
                    <span className={`block text-[10px] font-bold ${gayaPeringatan.badge}`}>
                      {peringatan.labelRingkas}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  Batas Alfa Sekolah: <strong className="text-slate-700">{stats.alfa} / {maksAlfa}</strong>
                </p>
              </div>

              {/* 5 Counter Status Lengkap */}
              <div className="flex flex-col gap-2 mb-5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Total Pertemuan</span>
                  <span className="font-extrabold text-sm text-slate-800">{stats.total_pertemuan} Sesi</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                    <span className="text-[11px] font-semibold block">Hadir</span>
                    <span className="text-lg font-black">{stats.hadir}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-800">
                    <span className="text-[11px] font-semibold block">Sakit</span>
                    <span className="text-lg font-black">{stats.sakit}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-800">
                    <span className="text-[11px] font-semibold block">Izin</span>
                    <span className="text-lg font-black">{stats.izin}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-800">
                    <span className="text-[11px] font-semibold block">Alfa</span>
                    <span className="text-lg font-black">{stats.alfa}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aksi Cepat Panel Kanan */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 px-4 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-soft transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                <span>Cetak / Unduh Rekap PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setBukaModalWA(true)}
                className="w-full py-2.5 px-4 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Hubungi Wali Kelas (WA)</span>
              </button>

              <Link
                href="/profil"
                className="w-full py-2.5 px-4 rounded-full bg-primary-light hover:bg-primary/20 text-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>Ganti PIN / Sandi Siswa</span>
              </Link>
            </div>
          </aside>
        </div>

        <NavigasiBawah />
      </div>

      {/* Modal Pratinjau Pesan WhatsApp ke Wali Kelas */}
      {bukaModalWA && (
        <div className="no-print fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-5 shadow-hover border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800">Hubungi Wali Kelas</h3>
                  <p className="text-[11px] text-slate-400">
                    {namaWaliKelas || `Wali ${namaKelas}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBukaModalWA(false)}
                className="min-h-0 p-1.5 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {!infoWA.memilikiNomor && (
              <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3">
                Nomor WhatsApp Wali Kelas belum tersimpan otomatis di sistem. Setelah klik{' '}
                <strong>Buka WhatsApp</strong>, pilih kontak Wali Kelas Anda; isi pesan sudah disiapkan otomatis.
              </p>
            )}

            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Pratinjau Pesan
            </label>
            <textarea
              readOnly
              rows={7}
              value={infoWA.pesan}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 outline-none resize-none"
            />

            <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={handleSalinPesanWA}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span>{pesanTersalin ? 'Tersalin!' : 'Salin Pesan'}</span>
              </button>
              <a
                href={infoWA.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-touch px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                <span>Buka WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pratinjau Selfie Check-In */}
      {pratinjauSelfie && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 no-print"
          onClick={() => setPratinjauSelfie(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-800">{pratinjauSelfie.judul}</h3>
              <button
                type="button"
                onClick={() => setPratinjauSelfie(null)}
                className="min-h-0 p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <img
              src={pratinjauSelfie.url}
              alt={pratinjauSelfie.judul}
              className="w-full max-h-80 object-cover rounded-2xl border border-slate-200"
            />
          </div>
        </div>
      )}

      {/* Lembar Cetak Formal PDF (Muncul hanya saat window.print()) */}
      <LaporanCetakSiswa
        siswa={student}
        namaKelas={namaKelas}
        namaWaliKelas={namaWaliKelas}
        pengaturan={pengaturan}
        ringkasan={stats}
        riwayat={riwayatTersaring}
        labelPeriode={labelPeriode}
      />
    </Penjaga>
  );
}
