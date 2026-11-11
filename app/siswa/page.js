'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavigasiBawah from '../../components/NavigasiBawah';
import Penjaga from '../../components/Penjaga';
import { getActiveSession, ambilRiwayatSiswa, keluar } from '../../lib/api';
import { useRouter } from 'next/navigation';

export default function DasborSiswaPage() {
  const router = useRouter();
  const [dataSiswa, setDataSiswa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const user = getActiveSession();
      const res = await ambilRiwayatSiswa(user?.username || '008123');
      if (res.ok) {
        setDataSiswa(res.data);
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleLogout = async () => {
    await keluar();
    router.push('/masuk');
  };

  const student = dataSiswa?.siswa || {
    nama_lengkap: 'Ahmad Fauzi',
    nisn: '008123',
    nomor_absen: 1,
    kelas_id: 'KLS-07A'
  };

  const stats = dataSiswa?.ringkasan || {
    total_pertemuan: 24,
    hadir: 23,
    sakit: 1,
    izin: 0,
    alfa: 0,
    persentase: 96.8
  };

  const riwayat = dataSiswa?.riwayat || [
    { id: '1', tanggal: '2026-11-05', judul_materi: 'Pertemuan 09: Teks Narasi', status: 'Hadir', catatan: '-' },
    { id: '2', tanggal: '2026-10-22', judul_materi: 'Pertemuan 06: Evaluasi Bab 2', status: 'Sakit', catatan: 'Flu dan demam (surat dokter)' },
  ];

  return (
    <Penjaga allowedRoles={['Siswa', 'Admin', 'Guru']}>
      <div className="min-h-screen bg-page pb-24 select-none">
        
        {/* Mobile Top App Bar */}
        <header className="bg-white border-b border-slate-200/80 px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">school</span>
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-800 leading-tight">Portal Siswa & Wali</h1>
              <p className="text-[10px] text-slate-400">SMP Negeri 1 Teladan</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-100 transition-colors"
            title="Keluar"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </header>

        <main className="max-w-xl mx-auto p-4 flex flex-col gap-4">
          
          {/* Kartu Profil Siswa */}
          <div className="bg-white rounded-card p-5 shadow-soft border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-black text-xl shadow-xs">
                {student.nama_lengkap?.charAt(0) || 'A'}
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-800 leading-snug">{student.nama_lengkap}</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">NISN: {student.nisn}</p>
                <div className="flex gap-2 mt-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Kelas VII-A
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Absen #{student.nomor_absen}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kartu Metrik Persentase Kehadiran (Radial Progress) */}
          <div className="bg-white rounded-card p-5 shadow-soft border border-slate-200 flex flex-col items-center text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Akumulasi Kehadiran Semester Ini
            </p>

            <div className="relative w-32 h-32 flex items-center justify-center my-2">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary"
                  strokeDasharray={`${stats.persentase}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-800">{stats.persentase}%</span>
                <span className="block text-[10px] font-bold text-emerald-600">Terpenuhi</span>
              </div>
            </div>

            {/* 4 Counter Kotak */}
            <div className="grid grid-cols-4 gap-2 w-full mt-3">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-semibold">Total</span>
                <span className="text-base font-extrabold text-slate-800">{stats.total_pertemuan}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                <span className="text-[10px] block font-semibold">Hadir</span>
                <span className="text-base font-extrabold">{stats.hadir}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-800">
                <span className="text-[10px] block font-semibold">Sakit</span>
                <span className="text-base font-extrabold">{stats.sakit}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-800">
                <span className="text-[10px] block font-semibold">Alfa</span>
                <span className="text-base font-extrabold">{stats.alfa}</span>
              </div>
            </div>
          </div>

          {/* Riwayat Ketidakhadiran & Catatan */}
          <div className="bg-white rounded-card p-5 shadow-soft border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-800">Catatan Kehadiran Terbaru</h3>
              <span className="text-[11px] font-bold text-slate-400">Semester Ganjil</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {riwayat.map((r, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className={`material-symbols-outlined text-[18px] mt-0.5 ${
                      r.status === 'Hadir' ? 'text-emerald-500' : r.status === 'Sakit' ? 'text-blue-500' : 'text-amber-500'
                    }`}>
                      {r.status === 'Hadir' ? 'check_circle' : r.status === 'Sakit' ? 'local_hospital' : 'schedule'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{r.judul_materi}</p>
                      <p className="text-[11px] text-slate-400">{r.tanggal}</p>
                      {r.catatan && r.catatan !== '-' && (
                        <p className="text-[11px] text-slate-600 mt-1 italic bg-white px-2 py-0.5 rounded border border-slate-100 inline-block">
                          Ket: {r.catatan}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.status === 'Hadir' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Menu Pintasan Ganti Sandi */}
          <div className="flex justify-center">
            <Link
              href="/profil"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 py-2 px-4 rounded-full bg-primary-light"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Ganti PIN / Sandi Siswa</span>
            </Link>
          </div>

        </main>

        <NavigasiBawah />
      </div>
    </Penjaga>
  );
}

