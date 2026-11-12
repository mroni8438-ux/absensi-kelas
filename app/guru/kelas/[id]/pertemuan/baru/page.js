'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SidebarDesktop from '@/components/SidebarDesktop';
import NavigasiBawah from '@/components/NavigasiBawah';
import Penjaga from '@/components/Penjaga';
import {
  ambilPengajuanIzinKelas,
  ambilSesiMandiriGuru,
  getDataAwal,
  simpanPresensiBatch,
  simpanPresensiSesiAktif,
  tutupSesiMandiriGuru,
} from '@/lib/api';

function getTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function InputPresensiPertemuanPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id || 'KLS-07A';

  const [namaKelas, setNamaKelas] = useState(kelasId);
  const [tanggal, setTanggal] = useState(getTodayIso());
  const [judulMateri, setJudulMateri] = useState('');
  const [catatanUmum, setCatatanUmum] = useState('');
  const [daftarSiswa, setDaftarSiswa] = useState([]);
  const [presensiItems, setPresensiItems] = useState({});
  const [izinDisetujui, setIzinDisetujui] = useState([]);
  const [sesiMandiri, setSesiMandiri] = useState(null);
  const [tutupKodeSetelahSimpan, setTutupKodeSetelahSimpan] = useState(true);
  const [jumlahAutoIzin, setJumlahAutoIzin] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    async function init() {
      const sesiParam =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('sesi') : null;

      const [res, izinRes, sesiRes] = await Promise.all([
        getDataAwal(),
        ambilPengajuanIzinKelas(kelasId),
        sesiParam ? ambilSesiMandiriGuru(kelasId) : Promise.resolve({ ok: false, data: [] }),
      ]);

      const disetujui = (izinRes.ok ? izinRes.data || [] : []).filter(
        (item) => item.status === 'Disetujui'
      );
      setIzinDisetujui(disetujui);

      let targetSesi = null;
      if (sesiParam && sesiRes.ok) {
        targetSesi = (sesiRes.data || []).find((s) => s.id === sesiParam) || null;
        setSesiMandiri(targetSesi);
        if (targetSesi) {
          setTanggal(targetSesi.tanggal || getTodayIso());
          setJudulMateri(targetSesi.judul_materi || '');
        }
      }

      const tglEfektif = targetSesi?.tanggal || getTodayIso();

      if (res.ok && res.data?.daftarSiswa) {
        const kelasInfo = (res.data.daftarKelas || []).find((k) => k.id === kelasId);
        if (kelasInfo?.nama_kelas) setNamaKelas(kelasInfo.nama_kelas);

        const kelasSiswa = res.data.daftarSiswa.filter((s) => s.kelas_id === kelasId);
        setDaftarSiswa(kelasSiswa);

        const pesertaMap = {};
        if (targetSesi?.peserta) {
          targetSesi.peserta.forEach((p) => {
            pesertaMap[p.siswa_id] = p;
          });
        }

        let hitungIzin = 0;
        const initialMap = {};
        kelasSiswa.forEach((s) => {
          const checkIn = pesertaMap[s.id];
          if (checkIn) {
            initialMap[s.id] = {
              status: checkIn.status || 'Hadir',
              catatan: checkIn.catatan || 'Check-in Mandiri Siswa',
              dariMandiri: true,
            };
            return;
          }
          const izinMatch = disetujui.find(
            (iz) =>
              iz.siswa_id === s.id &&
              iz.tanggal_mulai <= tglEfektif &&
              iz.tanggal_selesai >= tglEfektif
          );
          if (izinMatch) {
            hitungIzin++;
            initialMap[s.id] = {
              status: izinMatch.jenis === 'Sakit' ? 'Sakit' : 'Izin',
              catatan: `Disetujui online: ${izinMatch.alasan}`,
              dariIzin: true,
            };
          } else {
            initialMap[s.id] = { status: 'Hadir', catatan: '' };
          }
        });
        setJumlahAutoIzin(hitungIzin);
        setPresensiItems(initialMap);
      }
      setLoading(false);
    }
    init();
  }, [kelasId]);

  const handleTanggalChange = (tglBaru) => {
    setTanggal(tglBaru);
    if (!tglBaru || daftarSiswa.length === 0) return;
    let hitungIzin = 0;
    setPresensiItems((prev) => {
      const next = { ...prev };
      daftarSiswa.forEach((s) => {
        if (next[s.id]?.dariMandiri) return;
        const izinMatch = izinDisetujui.find(
          (iz) =>
            iz.siswa_id === s.id &&
            iz.tanggal_mulai <= tglBaru &&
            iz.tanggal_selesai >= tglBaru
        );
        if (izinMatch) {
          hitungIzin++;
          next[s.id] = {
            status: izinMatch.jenis === 'Sakit' ? 'Sakit' : 'Izin',
            catatan: `Disetujui online: ${izinMatch.alasan}`,
            dariIzin: true,
          };
        } else if (next[s.id]?.dariIzin) {
          next[s.id] = { status: 'Hadir', catatan: '' };
        }
      });
      return next;
    });
    setJumlahAutoIzin(hitungIzin);
  };

  const handleStatusChange = (siswaId, status) => {
    setPresensiItems(prev => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], status }
    }));
  };

  const handleCatatanChange = (siswaId, catatan) => {
    setPresensiItems(prev => ({
      ...prev,
      [siswaId]: { ...prev[siswaId], catatan }
    }));
  };

  const handleTandaiSemuaHadir = () => {
    setPresensiItems(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        updated[id].status = 'Hadir';
      });
      return updated;
    });
  };

  const handleSimpan = async () => {
    setSaving(true);
    setNotif(null);

    const items = daftarSiswa.map(s => ({
      siswa_id: s.id,
      status: presensiItems[s.id]?.status || 'Hadir',
      catatan: presensiItems[s.id]?.catatan || '',
    }));

    const res = sesiMandiri
      ? await simpanPresensiSesiAktif(sesiMandiri.id, kelasId, items)
      : await simpanPresensiBatch({
          kelas_id: kelasId,
          tanggal,
          judul: judulMateri,
          catatan: catatanUmum,
          items,
        });

    if (res.ok && sesiMandiri && tutupKodeSetelahSimpan) {
      await tutupSesiMandiriGuru(sesiMandiri.id);
    }

    setSaving(false);

    if (res.ok) {
      setNotif({
        type: 'success',
        text: sesiMandiri
          ? 'Presensi sesi mandiri berhasil dilengkapi dan disimpan!'
          : 'Presensi pertemuan berhasil disimpan ke database!',
      });
      setTimeout(() => {
        router.push(`/guru/kelas/${kelasId}/rekap`);
      }, 450);
    } else {
      setNotif({ type: 'error', text: res.pesan || 'Gagal menyimpan presensi.' });
    }
  };

  // Ringkasan Cepat
  const counts = { Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0 };
  Object.values(presensiItems).forEach(item => {
    if (counts[item.status] !== undefined) counts[item.status]++;
  });

  return (
    <Penjaga allowedRoles={['Guru', 'Admin']}>
      <div className="flex min-h-screen bg-page">
        <SidebarDesktop />

        <main className="flex-1 p-4 lg:p-6 pb-28 min-w-0">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.back()}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <h1 className="font-black text-xl text-slate-800">
                  {sesiMandiri ? 'Lengkapi Presensi Sesi Mandiri' : 'Input Presensi Pertemuan'}
                </h1>
              </div>
              <p className="text-xs text-slate-500 ml-7">
                {namaKelas} ({daftarSiswa.length} Siswa Terdaftar)
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTandaiSemuaHadir}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">done_all</span>
                <span>Tandai Semua Hadir</span>
              </button>
            </div>
          </div>

          {/* Banner Sesi Mandiri / Izin Otomatis */}
          {(sesiMandiri || jumlahAutoIzin > 0) && (
            <div className="mb-4 p-3.5 rounded-2xl bg-primary-light/60 border border-primary/25 text-xs text-slate-700 space-y-1">
              {sesiMandiri && (
                <p className="font-bold text-primary">
                  Melengkapi sesi absen mandiri ({sesiMandiri.peserta?.length || 0} siswa sudah check-in otomatis).
                </p>
              )}
              {jumlahAutoIzin > 0 && (
                <p className="font-semibold">
                  {jumlahAutoIzin} siswa memiliki izin/sakit yang disetujui pada {tanggal} dan statusnya sudah diisi otomatis.
                </p>
              )}
            </div>
          )}

          {/* Notifikasi Status */}
          {notif && (
            <div className={`mb-4 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              notif.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {notif.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{notif.text}</span>
            </div>
          )}

          {/* Informasi Sesi Pertemuan */}
          <div className="bg-white rounded-card p-4 sm:p-5 shadow-soft border border-slate-200 mb-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Informasi Sesi Pertemuan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Tanggal Pertemuan</label>
                <input
                  type="date"
                  value={tanggal}
                  disabled={Boolean(sesiMandiri)}
                  onChange={(e) => handleTanggalChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-primary disabled:opacity-70"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Pokok Bahasan / Materi (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Bab 3 - Menulis Teks Prosedur"
                  value={judulMateri}
                  disabled={Boolean(sesiMandiri)}
                  onChange={(e) => setJudulMateri(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-primary disabled:opacity-70"
                />
              </div>
            </div>

            {sesiMandiri && (
              <label className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tutupKodeSetelahSimpan}
                  onChange={(e) => setTutupKodeSetelahSimpan(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span>Tutup kode absen mandiri setelah menyimpan presensi</span>
              </label>
            )}

            {/* Quick Live Counters */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                Hadir: <b>{counts.Hadir}</b>
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                Sakit: <b>{counts.Sakit}</b>
              </span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                Izin: <b>{counts.Izin}</b>
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                Alfa: <b>{counts.Alfa}</b>
              </span>
            </div>
          </div>

          {/* Tabel Presensi Siswa */}
          <div className="bg-white rounded-card shadow-soft border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800">Daftar Presensi Seluruh Siswa</h3>
              <span className="text-xs text-slate-400">Total: {daftarSiswa.length} Siswa</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-3 w-12 text-center">No</th>
                    <th className="py-3 px-3">Nama Lengkap & NISN</th>
                    <th className="py-3 px-3 min-w-[280px]">Status Kehadiran</th>
                    <th className="py-3 px-3 min-w-[160px]">Keterangan Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-400">
                        Memuat data siswa...
                      </td>
                    </tr>
                  ) : (
                    daftarSiswa.map((s, idx) => {
                      const currentStatus = presensiItems[s.id]?.status || 'Hadir';
                      const currentCatatan = presensiItems[s.id]?.catatan || '';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-slate-800">{s.nama_lengkap}</p>
                              {presensiItems[s.id]?.dariMandiri && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                  Mandiri
                                </span>
                              )}
                              {presensiItems[s.id]?.dariIzin && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  Izin Disetujui
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono">NISN: {s.nisn}</p>
                          </td>
                          <td className="py-3 px-3">
                            {/* Segmented Button Group H / S / I / A */}
                            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 select-none">
                              {['Hadir', 'Sakit', 'Izin', 'Alfa'].map((st) => {
                                const isSelected = currentStatus === st;
                                let activeClass = '';
                                if (isSelected) {
                                  if (st === 'Hadir') activeClass = 'bg-emerald-500 text-white shadow-sm';
                                  else if (st === 'Sakit') activeClass = 'bg-blue-500 text-white shadow-sm';
                                  else if (st === 'Izin') activeClass = 'bg-amber-400 text-slate-900 shadow-sm';
                                  else if (st === 'Alfa') activeClass = 'bg-red-500 text-white shadow-sm';
                                } else {
                                  activeClass = 'text-slate-600 hover:text-slate-900';
                                }

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleStatusChange(s.id, st)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeClass}`}
                                  >
                                    {st}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              placeholder="Keterangan..."
                              value={currentCatatan}
                              onChange={(e) => handleCatatanChange(s.id, e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-primary focus:bg-white"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sticky Bottom Bar Simpan Presensi */}
          <div className="fixed bottom-0 lg:bottom-4 left-0 lg:left-72 right-0 lg:right-6 p-4 bg-white/90 lg:bg-white/95 backdrop-blur-md lg:rounded-2xl border-t lg:border border-slate-200/80 shadow-2xl flex items-center justify-between z-40">
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800">
                Total: {daftarSiswa.length} Siswa ({counts.Hadir} Hadir, {counts.Sakit + counts.Izin + counts.Alfa} Berhalangan)
              </p>
              <p className="text-[11px] text-slate-400">Pastikan status presensi sudah akurat sebelum disimpan.</p>
            </div>
            <button
              type="button"
              onClick={handleSimpan}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan ke Server...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Simpan Presensi Pertemuan ({daftarSiswa.length} Siswa)</span>
                </>
              )}
            </button>
          </div>
        </main>

        <NavigasiBawah />
      </div>
    </Penjaga>
  );
}

