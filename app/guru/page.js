'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SidebarDesktop from '../../components/SidebarDesktop';
import NavigasiBawah from '../../components/NavigasiBawah';
import Penjaga from '../../components/Penjaga';
import PanelMandiriDanIzinGuru from '../../components/guru/PanelMandiriDanIzinGuru';
import { getDataAwal } from '../../lib/api';

export default function DasborGuruPage() {
  const [dataAwal, setDataAwal] = useState(null);
  const [kelasAktif, setKelasAktif] = useState('KLS-07A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const res = await getDataAwal();
      if (res.ok) {
        setDataAwal(res.data);
      }
      setLoading(false);
    }
    init();
  }, []);

  const daftarKelas = dataAwal?.daftarKelas || [
    { id: 'KLS-07A', nama_kelas: 'Kelas VII-A', total_siswa: 32, status: 'Lengkap' },
    { id: 'KLS-07B', nama_kelas: 'Kelas VII-B', total_siswa: 30, status: 'Menunggu' },
    { id: 'KLS-08A', nama_kelas: 'Kelas VIII-A', total_siswa: 32, status: 'Lengkap' },
  ];

  const daftarSiswa = (dataAwal?.daftarSiswa || []).filter(s => s.kelas_id === kelasAktif).slice(0, 8);

  return (
    <Penjaga allowedRoles={['Guru', 'Admin']}>
      <div className="flex min-h-screen bg-page">
        {/* Panel 1: Sidebar Kiri Desktop */}
        <SidebarDesktop />

        {/* Workspace Utama: Tengah & Kanan */}
        <div className="flex-1 flex flex-col lg:flex-row pb-20 lg:pb-0 min-w-0">
          
          {/* Panel 2: Konten Tengah */}
          <main className="flex-1 p-4 lg:p-6 min-w-0">
            {/* Top Bar Pencarian & Aksi Cepat */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari kelas, nama siswa, atau NISN..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white rounded-full text-xs sm:text-sm border border-slate-200 outline-none focus:border-primary shadow-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/guru/kelas/${kelasAktif}/pertemuan/baru`}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full text-xs sm:text-sm font-bold shadow-soft transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>+ Pertemuan Baru</span>
                </Link>
              </div>
            </div>

            {/* Seksi: Kelas yang Saya Ampu */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-extrabold text-base lg:text-lg text-slate-800">Kelas yang Saya Ampu</h2>
                <span className="text-xs font-bold text-primary cursor-pointer hover:underline">T.A. 2026/2027</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {daftarKelas.map((k) => {
                  const isSelected = kelasAktif === k.id;
                  return (
                    <div
                      key={k.id}
                      onClick={() => setKelasAktif(k.id)}
                      className={`cursor-pointer rounded-card p-4 transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary text-white shadow-hover scale-[1.02]'
                          : 'bg-white text-slate-800 border border-slate-200 hover:border-primary/40 shadow-soft'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {k.tingkat ? `Tingkat ${k.tingkat}` : 'Reguler'}
                        </span>
                        <span className="material-symbols-outlined text-[18px] opacity-80">folder</span>
                      </div>
                      <h3 className="font-black text-lg mb-1">{k.nama_kelas}</h3>
                      <p className={`text-xs ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {k.total_siswa || 32} Siswa Terdaftar
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seksi: Ringkasan Presensi Hari Ini */}
            <div className="bg-white rounded-card p-4 sm:p-5 shadow-soft border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Daftar Siswa — {daftarKelas.find(k => k.id === kelasAktif)?.nama_kelas}
                  </h3>
                  <p className="text-xs text-slate-500">Pratinjau presensi sesi pertemuan terbaru</p>
                </div>
                <Link
                  href={`/guru/kelas/${kelasAktif}/pertemuan/baru`}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Buka Form Input Penuh</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              {/* Tabel Siswa Ringkas */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="pb-3 px-2 w-10">No</th>
                      <th className="pb-3 px-3">Nama Siswa</th>
                      <th className="pb-3 px-3 hidden sm:table-cell">NISN</th>
                      <th className="pb-3 px-3">Status Contoh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daftarSiswa.length > 0 ? (
                      daftarSiswa.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-2 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{s.nama_lengkap}</td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-xs hidden sm:table-cell">{s.nisn}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                              Hadir
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-slate-400">
                          Memuat data siswa kelas...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tombol Aksi Cepat ke Presensi */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <Link
                  href={`/guru/kelas/${kelasAktif}/pertemuan/baru`}
                  className="w-full sm:w-auto py-2.5 px-5 bg-primary-light hover:bg-primary/20 text-primary font-bold rounded-full text-xs transition-colors text-center"
                >
                  Catat Presensi Kelas Hari Ini →
                </Link>
              </div>
            </div>

            {/* Tahap 2: Sesi Absen Mandiri (QR + Kode) & Persetujuan Izin Siswa */}
            <PanelMandiriDanIzinGuru
              kelasId={kelasAktif}
              namaKelas={daftarKelas.find(k => k.id === kelasAktif)?.nama_kelas || kelasAktif}
              daftarSiswa={daftarSiswa}
              onDataBerubah={async () => {
                const res = await getDataAwal(true);
                if (res.ok) setDataAwal(res.data);
              }}
            />
          </main>

          {/* Panel 3: Sidebar Kanan (Statistik & Rekap) */}
          <aside className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200/80 p-5 lg:min-h-screen flex flex-col justify-between">
            <div>
              <div className="mb-5">
                <h3 className="font-extrabold text-base text-slate-800">Statistik Kehadiran</h3>
                <p className="text-xs text-slate-400">Bulan November 2026</p>
              </div>

              {/* Radial Progress Ring */}
              <div className="flex flex-col items-center justify-center p-4 rounded-card bg-page/70 border border-slate-200/50 mb-5">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-primary"
                      strokeDasharray="94.2, 100"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-xl font-black text-slate-800">94.2%</span>
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Rata-rata</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span>Tingkat Presensi Sangat Baik</span>
                </p>
              </div>

              {/* 3 Counter Status */}
              <div className="flex flex-col gap-2.5 mb-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-slate-700">Hadir Hari Ini</span>
                  </div>
                  <span className="font-extrabold text-sm text-slate-800">30 Siswa</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                    <span className="text-xs font-semibold text-slate-700">Sakit / Izin</span>
                  </div>
                  <span className="font-extrabold text-sm text-slate-800">2 Siswa</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                    <span className="text-xs font-semibold text-slate-700">Tanpa Keterangan (Alfa)</span>
                  </div>
                  <span className="font-extrabold text-sm text-slate-800">0 Siswa</span>
                </div>
              </div>
            </div>

            {/* Tombol Ekspor & Rekap Laporan */}
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
              <Link
                href={`/guru/kelas/${kelasAktif}/rekap`}
                className="w-full py-3 px-4 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-bold text-center shadow-soft transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">table_chart</span>
                <span>Buka Rekap Bulanan</span>
              </Link>
            </div>
          </aside>

        </div>

        {/* Panel Navigasi Bawah Smartphone */}
        <NavigasiBawah />
      </div>
    </Penjaga>
  );
}

