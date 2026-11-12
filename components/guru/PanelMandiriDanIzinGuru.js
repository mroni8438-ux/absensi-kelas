'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import QrCodeSvg from '../QrCodeSvg';
import {
  ambilPengajuanIzinKelas,
  ambilSesiMandiriGuru,
  bukaSesiMandiriGuru,
  buatTautanBerkas,
  prosesPengajuanIzin,
  tutupSesiMandiriGuru,
} from '../../lib/api';
import { formatTanggalIndonesia } from '../../lib/siswaHelper';

function getTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatJamWib(isoStr) {
  if (!isoStr) return '-';
  try {
    return new Date(isoStr).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

export default function PanelMandiriDanIzinGuru({
  kelasId,
  namaKelas,
  daftarSiswa = [],
  onDataBerubah,
}) {
  const [loading, setLoading] = useState(true);
  const [daftarSesi, setDaftarSesi] = useState([]);
  const [daftarIzin, setDaftarIzin] = useState([]);
  const [pesan, setPesan] = useState(null);

  // Form Buka Sesi Mandiri
  const [bukaFormSesi, setBukaFormSesi] = useState(false);
  const [judulSesi, setJudulSesi] = useState('Pertemuan Tatap Muka');
  const [durasiMenit, setDurasiMenit] = useState(30);
  const [wajibSelfie, setWajibSelfie] = useState(false);
  const [wajibGps, setWajibGps] = useState(false);
  const [menyimpanSesi, setMenyimpanSesi] = useState(false);
  const [menutupId, setMenutupId] = useState(null);

  // Modal Proyektor QR & Pratinjau Foto/Bukti
  const [bukaModalProyektor, setBukaModalProyektor] = useState(false);
  const [kodeTersalin, setKodeTersalin] = useState(false);
  const [pratinjauBerkas, setPratinjauBerkas] = useState(null); // { url, isPdf, judul }
  const [memuatBerkasKey, setMemuatBerkasKey] = useState(null);

  // Proses Izin
  const [filterIzin, setFilterIzin] = useState('Menunggu'); // 'Menunggu' | 'Semua'
  const [catatanMap, setCatatanMap] = useState({});
  const [prosesId, setProsesId] = useState(null);

  async function muatPanel() {
    if (!kelasId) return;
    setLoading(true);
    const [sesiRes, izinRes] = await Promise.all([
      ambilSesiMandiriGuru(kelasId),
      ambilPengajuanIzinKelas(kelasId),
    ]);
    if (sesiRes.ok) setDaftarSesi(sesiRes.data || []);
    if (izinRes.ok) setDaftarIzin(izinRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    muatPanel();
  }, [kelasId]);

  const sesiAktif = daftarSesi.find((s) => s.masih_aktif) || null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const qrPayload = sesiAktif?.kode_sesi
    ? (origin && `${origin}/siswa?kode=${sesiAktif.kode_sesi}`.length <= 100
        ? `${origin}/siswa?kode=${sesiAktif.kode_sesi}`
        : `ABSEN:${sesiAktif.kode_sesi}`)
    : '';

  const jumlahMenunggu = daftarIzin.filter((i) => i.status === 'Menunggu').length;
  const izinTampil = filterIzin === 'Menunggu'
    ? daftarIzin.filter((i) => i.status === 'Menunggu')
    : daftarIzin;

  async function handleBukaSesi(e) {
    e.preventDefault();
    setPesan(null);
    setMenyimpanSesi(true);
    const res = await bukaSesiMandiriGuru({
      kelas_id: kelasId,
      tanggal: getTodayIso(),
      judul: judulSesi.trim() || 'Pertemuan Kelas',
      durasi_menit: durasiMenit,
      wajib_selfie: wajibSelfie,
      wajib_gps: wajibGps,
    });
    setMenyimpanSesi(false);
    if (!res.ok) {
      setPesan({ tipe: 'err', teks: res.pesan || 'Gagal membuka sesi mandiri.' });
      return;
    }
    setBukaFormSesi(false);
    setPesan({ tipe: 'ok', teks: `Sesi absen mandiri dibuka! Kode: ${res.data?.kode_sesi}` });
    await muatPanel();
    onDataBerubah?.();
  }

  async function handleTutupSesi(pertemuanId) {
    setMenutupId(pertemuanId);
    const res = await tutupSesiMandiriGuru(pertemuanId);
    setMenutupId(null);
    if (!res.ok) {
      setPesan({ tipe: 'err', teks: res.pesan || 'Gagal menutup sesi.' });
      return;
    }
    setBukaModalProyektor(false);
    setPesan({ tipe: 'ok', teks: res.pesan || 'Sesi absen mandiri ditutup.' });
    await muatPanel();
    onDataBerubah?.();
  }

  async function handleSalinKode(kode) {
    try {
      await navigator.clipboard.writeText(kode);
      setKodeTersalin(true);
      setTimeout(() => setKodeTersalin(false), 1800);
    } catch {}
  }

  async function handleBukaBerkas(bucket, path, judul, key) {
    if (!path) return;
    setMemuatBerkasKey(key);
    const res = await buatTautanBerkas(bucket, path);
    setMemuatBerkasKey(null);
    if (!res.ok || !res.url) {
      setPesan({ tipe: 'err', teks: res.pesan || 'Gagal membuka file lampiran.' });
      return;
    }
    const isPdf = path.toLowerCase().endsWith('.pdf') || res.url.startsWith('data:application/pdf');
    setPratinjauBerkas({ url: res.url, isPdf, judul });
  }

  async function handleProsesIzin(izinId, keputusan) {
    setProsesId(izinId);
    setPesan(null);
    const res = await prosesPengajuanIzin(izinId, keputusan, catatanMap[izinId] || '');
    setProsesId(null);
    if (!res.ok) {
      setPesan({ tipe: 'err', teks: res.pesan || 'Gagal memproses pengajuan izin.' });
      return;
    }
    setPesan({ tipe: 'ok', teks: res.pesan || `Pengajuan izin ${keputusan.toLowerCase()}.` });
    await muatPanel();
    onDataBerubah?.();
  }

  function cariNamaSiswa(izin) {
    if (izin.siswa?.nama_lengkap) return izin.siswa.nama_lengkap;
    const found = daftarSiswa.find((s) => s.id === izin.siswa_id);
    return found?.nama_lengkap || `Siswa (${izin.siswa_id})`;
  }

  return (
    <div className="space-y-6 mt-6">
      {pesan && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border ${
            pesan.tipe === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {pesan.teks}
        </div>
      )}

      {/* KARTU 1: SESI ABSEN MANDIRI (KODE + QR) */}
      <section className="bg-white rounded-card p-5 shadow-soft border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-light text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
            </div>
            <div>
              <h2 className="font-extrabold text-sm lg:text-base text-slate-800">
                Absen Mandiri Siswa — {namaKelas}
              </h2>
              <p className="text-[11px] text-slate-400">
                Buka kode sesi / QR Code agar siswa bisa check-in langsung dari HP mereka.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={muatPanel}
              className="min-h-0 px-3 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1"
              title="Segarkan daftar check-in"
            >
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              <span>Segarkan</span>
            </button>
            {!sesiAktif && (
              <button
                type="button"
                onClick={() => setBukaFormSesi((v) => !v)}
                className="min-h-0 px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {bukaFormSesi ? 'close' : 'qr_code_scanner'}
                </span>
                <span>{bukaFormSesi ? 'Batal' : 'Buka Sesi Mandiri'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Buka Sesi */}
        {bukaFormSesi && !sesiAktif && (
          <form onSubmit={handleBukaSesi} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Pertemuan / Topik</label>
                <input
                  type="text"
                  value={judulSesi}
                  onChange={(e) => setJudulSesi(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Masa Berlaku Kode</label>
                <select
                  value={durasiMenit}
                  onChange={(e) => setDurasiMenit(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-primary"
                >
                  {[10, 15, 30, 45, 60, 90].map((m) => (
                    <option key={m} value={m}>{m} Menit</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wajibSelfie}
                  onChange={(e) => setWajibSelfie(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span>Wajib Foto Selfie Check-In</span>
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wajibGps}
                  onChange={(e) => setWajibGps(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span>Wajib GPS Dalam Radius Sekolah</span>
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={menyimpanSesi}
                className="px-5 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-extrabold shadow-sm disabled:opacity-60"
              >
                {menyimpanSesi ? 'Membuat Kode & QR...' : 'Aktifkan Sesi Sekarang'}
              </button>
            </div>
          </form>
        )}

        {/* Tampilan Sesi Aktif */}
        {loading ? (
          <div className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
        ) : sesiAktif ? (
          <div className="p-4 rounded-2xl bg-primary-light/35 border border-primary/20 space-y-4">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <QrCodeSvg value={qrPayload} size={144} />
                <button
                  type="button"
                  onClick={() => setBukaModalProyektor(true)}
                  className="min-h-0 px-3 py-1 rounded-full bg-white border border-primary/30 text-primary text-[11px] font-bold hover:bg-primary-light"
                >
                  Tampilkan Layar Penuh
                </button>
              </div>

              <div className="flex-1 min-w-0 w-full text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                    Sesi Aktif
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Berlaku hingga {formatJamWib(sesiAktif.kode_berlaku_sampai)} WIB
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-800">{sesiAktif.judul_materi}</h3>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                  <span className="font-mono text-2xl font-black tracking-[0.22em] text-primary bg-white px-4 py-1.5 rounded-2xl border border-primary/25 shadow-sm">
                    {sesiAktif.kode_sesi}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSalinKode(sesiAktif.kode_sesi)}
                    className="min-h-0 px-3 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    {kodeTersalin ? 'Kode Disalin!' : 'Salin Kode'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3 text-[11px] font-semibold text-slate-600">
                  <span>{sesiAktif.wajib_selfie ? '• Selfie Wajib' : '• Selfie Opsional'}</span>
                  <span>{sesiAktif.wajib_gps ? '• GPS Radius Wajib' : '• GPS Opsional'}</span>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                  <Link
                    href={`/guru/kelas/${kelasId}/pertemuan/baru?sesi=${sesiAktif.id}`}
                    className="btn-touch px-4 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">fact_check</span>
                    <span>Selesaikan &amp; Lengkapi Presensi ({sesiAktif.peserta?.length || 0})</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleTutupSesi(sesiAktif.id)}
                    disabled={menutupId === sesiAktif.id}
                    className="min-h-0 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold"
                  >
                    {menutupId === sesiAktif.id ? 'Menutup...' : 'Tutup Kode Sesi'}
                  </button>
                </div>
              </div>
            </div>

            {/* Daftar Check-In Live */}
            <div className="pt-3 border-t border-primary/15">
              <p className="text-xs font-extrabold text-slate-700 mb-2">
                Siswa Sudah Check-In Mandiri ({sesiAktif.peserta?.length || 0})
              </p>
              {sesiAktif.peserta?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sesiAktif.peserta.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{p.nama_lengkap}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatJamWib(p.waktu_check_in)} WIB
                          {p.jarak_meter !== null && p.jarak_meter !== undefined ? ` • ${p.jarak_meter}m` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.foto_selfie_path && (
                          <button
                            type="button"
                            onClick={() => handleBukaBerkas('foto-presensi', p.foto_selfie_path, `Selfie ${p.nama_lengkap}`, `selfie-${p.id}`)}
                            disabled={memuatBerkasKey === `selfie-${p.id}`}
                            className="min-h-0 px-2.5 py-1 rounded-full bg-primary-light text-primary text-[10px] font-bold"
                          >
                            {memuatBerkasKey === `selfie-${p.id}` ? '...' : 'Foto'}
                          </button>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">Belum ada siswa yang check-in mandiri untuk sesi ini.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-dashed border-slate-200">
            Tidak ada sesi check-in mandiri yang sedang berlangsung di {namaKelas}. Klik{' '}
            <strong className="text-slate-700">Buka Sesi Mandiri</strong> sebelum jam pelajaran dimulai.
          </p>
        )}
      </section>

      {/* KARTU 2: ANTREAN PERSETUJUAN IZIN & SAKIT SISWA */}
      <section className="bg-white rounded-card p-5 shadow-soft border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">mark_email_unread</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-sm lg:text-base text-slate-800">
                  Persetujuan Izin &amp; Sakit — {namaKelas}
                </h2>
                {jumlahMenunggu > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                    {jumlahMenunggu} Menunggu
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Pengajuan yang disetujui otomatis mengisi status Izin/Sakit pada pertemuan tanggal terkait.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {[
              { key: 'Menunggu', label: `Menunggu (${jumlahMenunggu})` },
              { key: 'Semua', label: `Semua (${daftarIzin.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterIzin(tab.key)}
                className={`min-h-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                  filterIzin === tab.key
                    ? 'bg-primary text-white border-primary'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        ) : izinTampil.length > 0 ? (
          <div className="space-y-3">
            {izinTampil.map((izin) => {
              const rentang =
                izin.tanggal_mulai === izin.tanggal_selesai
                  ? formatTanggalIndonesia(izin.tanggal_mulai)
                  : `${formatTanggalIndonesia(izin.tanggal_mulai)} s.d. ${formatTanggalIndonesia(izin.tanggal_selesai)}`;
              return (
                <div
                  key={izin.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-800">{cariNamaSiswa(izin)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          izin.jenis === 'Sakit' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {izin.jenis}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          izin.status === 'Disetujui'
                            ? 'bg-emerald-100 text-emerald-700'
                            : izin.status === 'Ditolak'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {izin.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{rentang}</p>
                    </div>

                    {izin.bukti_path && (
                      <button
                        type="button"
                        onClick={() => handleBukaBerkas('bukti-izin', izin.bukti_path, `Lampiran ${cariNamaSiswa(izin)}`, `bukti-${izin.id}`)}
                        disabled={memuatBerkasKey === `bukti-${izin.id}`}
                        className="min-h-0 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-primary text-[11px] font-bold flex items-center gap-1 self-start sm:self-auto"
                      >
                        <span className="material-symbols-outlined text-[15px]">attach_file</span>
                        <span>{memuatBerkasKey === `bukti-${izin.id}` ? 'Membuka...' : 'Lihat Surat Bukti'}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 bg-white px-3 py-2 rounded-xl border border-slate-200/70">
                    {izin.alasan}
                  </p>

                  {izin.status === 'Menunggu' ? (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Catatan guru (opsional)..."
                        value={catatanMap[izin.id] || ''}
                        onChange={(e) => setCatatanMap((prev) => ({ ...prev, [izin.id]: e.target.value }))}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 outline-none focus:border-primary"
                      />
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleProsesIzin(izin.id, 'Ditolak')}
                          disabled={prosesId === izin.id}
                          className="min-h-0 px-3.5 py-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold disabled:opacity-50"
                        >
                          Tolak
                        </button>
                        <button
                          type="button"
                          onClick={() => handleProsesIzin(izin.id, 'Disetujui')}
                          disabled={prosesId === izin.id}
                          className="min-h-0 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                        >
                          {prosesId === izin.id ? 'Menyimpan...' : 'Setujui'}
                        </button>
                      </div>
                    </div>
                  ) : izin.catatan_guru ? (
                    <p className="text-[11px] text-slate-500">Catatan Guru: {izin.catatan_guru}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            {filterIzin === 'Menunggu'
              ? 'Tidak ada pengajuan izin yang menunggu persetujuan.'
              : 'Belum ada riwayat pengajuan izin untuk kelas ini.'}
          </p>
        )}
      </section>

      {/* Modal QR Layar Penuh untuk Proyektor */}
      {bukaModalProyektor && sesiAktif && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setBukaModalProyektor(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{namaKelas}</span>
              <button
                type="button"
                onClick={() => setBukaModalProyektor(false)}
                className="min-h-0 p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h3 className="text-lg font-black text-slate-800">{sesiAktif.judul_materi}</h3>
            <div className="flex justify-center">
              <QrCodeSvg value={qrPayload} size={256} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Atau masukkan kode sesi di Portal Siswa:</p>
              <p className="font-mono text-3xl font-black tracking-[0.25em] text-primary mt-1">
                {sesiAktif.kode_sesi}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Berlaku hingga {formatJamWib(sesiAktif.kode_berlaku_sampai)} WIB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pratinjau Foto Selfie / Surat Bukti */}
      {pratinjauBerkas && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPratinjauBerkas(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-800">{pratinjauBerkas.judul}</h3>
              <button
                type="button"
                onClick={() => setPratinjauBerkas(null)}
                className="min-h-0 p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {pratinjauBerkas.isPdf ? (
              <iframe
                src={pratinjauBerkas.url}
                title={pratinjauBerkas.judul}
                className="w-full h-80 rounded-2xl border border-slate-200"
              />
            ) : (
              <img
                src={pratinjauBerkas.url}
                alt={pratinjauBerkas.judul}
                className="w-full max-h-96 object-contain rounded-2xl bg-slate-50 border border-slate-200"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

