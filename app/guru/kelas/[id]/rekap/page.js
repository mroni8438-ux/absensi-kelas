'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SidebarDesktop from '@/components/SidebarDesktop';
import NavigasiBawah from '@/components/NavigasiBawah';
import Penjaga from '@/components/Penjaga';
import { ambilRekapBulanan, getDataAwal, getCachedDataAwal, getCachedRekapBulanan } from '@/lib/api';

export default function RekapitulasiBulananPage() {
  const router = useRouter();
  const params = useParams();
  const kelasId = params.id || 'KLS-07A';

  const [bulan, setBulan] = useState(11);
  const [tahun, setTahun] = useState(2026);
  const [rekapData, setRekapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [namaSekolah, setNamaSekolah] = useState('SMP Negeri 1 Teladan');

  // Muat profil sekolah sekali dari STATE/cache tanpa dipanggil ulang saat ganti bulan
  useEffect(() => {
    const cachedAwal = getCachedDataAwal();
    if (cachedAwal?.pengaturan?.nama_sekolah) {
      setNamaSekolah(cachedAwal.pengaturan.nama_sekolah);
      return;
    }
    getDataAwal().then((awalRes) => {
      if (awalRes.ok && awalRes.data?.pengaturan?.nama_sekolah) {
        setNamaSekolah(awalRes.data.pengaturan.nama_sekolah);
      }
    });
  }, []);

  useEffect(() => {
    let aktif = true;
    const cached = getCachedRekapBulanan(kelasId, bulan, tahun);
    if (cached) {
      setRekapData(cached);
      setLoading(false);
      return;
    }
    async function load() {
      setLoading(true);
      const rekapRes = await ambilRekapBulanan(kelasId, bulan, tahun);
      if (!aktif) return;
      if (rekapRes.ok) {
        setRekapData(rekapRes.data || []);
      }
      setLoading(false);
    }
    load();
    return () => { aktif = false; };
  }, [kelasId, bulan, tahun]);

  // Fungsi Ekspor Spreadsheet Excel (.xlsx) — dimuat dinamis hanya saat tombol diklik
  const handleExportExcel = async () => {
    if (!rekapData.length) return;
    const XLSX = await import('xlsx');

    const dataToExport = rekapData.map((row, idx) => ({
      'No': idx + 1,
      'NISN': row.nisn,
      'Nama Siswa': row.nama_lengkap,
      'Total Pertemuan': row.total_pertemuan,
      'Hadir (H)': row.hadir,
      'Sakit (S)': row.sakit,
      'Izin (I)': row.izin,
      'Alfa (A)': row.alfa,
      'Persentase Kehadiran (%)': `${row.persentase}%`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Presensi');

    XLSX.writeFile(workbook, `Rekap_Presensi_Kelas_${kelasId}_Bulan_${bulan}_${tahun}.xlsx`);
  };

  // Fungsi Ekspor File CSV
  const handleExportCSV = () => {
    if (!rekapData.length) return;

    const header = 'No,NISN,Nama Siswa,Total Pertemuan,Hadir,Sakit,Izin,Alfa,Persentase\n';
    const rows = rekapData.map((r, i) => 
      `${i + 1},"${r.nisn}","${r.nama_lengkap}",${r.total_pertemuan},${r.hadir},${r.sakit},${r.izin},${r.alfa},${r.persentase}%`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Presensi_${kelasId}_${bulan}_${tahun}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fungsi Cetak Lembar Presensi PDF (Browser Print Dialog)
  const handlePrintPDF = () => {
    window.print();
  };

  const namaBulanStr = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][bulan - 1];

  return (
    <Penjaga allowedRoles={['Guru', 'Admin']}>
      <div className="flex min-h-screen bg-page">
        <div className="no-print">
          <SidebarDesktop />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 min-w-0">
          
          {/* Header Aksi (Disembunyikan saat mencetak) */}
          <div className="no-print mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/guru')}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <h1 className="font-black text-xl text-slate-800">Rekapitulasi Bulanan</h1>
              </div>
              <p className="text-xs text-slate-500 ml-7">Kelas VII-A — Periode {namaBulanStr} {tahun}</p>
            </div>

            {/* Filter Bulan & Tombol Ekspor */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="px-3 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 outline-none shadow-sm"
              >
                {[
                  { m: 7, l: 'Juli' }, { m: 8, l: 'Agustus' }, { m: 9, l: 'September' },
                  { m: 10, l: 'Oktober' }, { m: 11, l: 'November' }, { m: 12, l: 'Desember' }
                ].map(opt => (
                  <option key={opt.m} value={opt.m}>{opt.l}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportExcel}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Unduh Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>CSV</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPDF}
                className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-soft transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>

          {/* Area Lembar Presensi Resmi (Tampil di Layar dan Dicetak ke Kertas) */}
          <div className="print-area bg-white rounded-card shadow-soft p-5 sm:p-7 border border-slate-200">
            
            {/* Kop Resmi Surat Sekolah */}
            <div className="print-header mb-6 text-center border-b-2 border-slate-900 pb-4">
              <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-wider">
                PEMERINTAH KABUPATEN / KOTA DINAS PENDIDIKAN
              </h2>
              <h3 className="text-lg sm:text-xl font-extrabold uppercase text-slate-900">
                {namaSekolah}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Alamat: Jl. Pendidikan No. 45 • Website: https://absensi-kelas.vercel.app
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200 inline-block">
                <h4 className="text-sm font-black uppercase text-slate-800">
                  REKAPITULASI KEHADIRAN SISWA BULANAN
                </h4>
                <p className="text-xs text-slate-600">
                  Kelas: VII-A • Bulan: {namaBulanStr} {tahun} • Tahun Ajaran: 2026/2027
                </p>
              </div>
            </div>

            {/* Tabel Matriks Rekapitulasi */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 border border-slate-300 text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-2 text-center w-10 border border-slate-300">No</th>
                    <th className="py-2.5 px-3 border border-slate-300">NISN</th>
                    <th className="py-2.5 px-3 border border-slate-300">Nama Siswa</th>
                    <th className="py-2.5 px-2 text-center border border-slate-300">Sesi</th>
                    <th className="py-2.5 px-2 text-center bg-emerald-50 text-emerald-800 border border-slate-300">H</th>
                    <th className="py-2.5 px-2 text-center bg-blue-50 text-blue-800 border border-slate-300">S</th>
                    <th className="py-2.5 px-2 text-center bg-yellow-50 text-yellow-800 border border-slate-300">I</th>
                    <th className="py-2.5 px-2 text-center bg-red-50 text-red-800 border border-slate-300">A</th>
                    <th className="py-2.5 px-3 text-center border border-slate-300">% Hadir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="9" className="py-8 text-center text-slate-400">
                        Menghitung rekapitulasi data kehadiran...
                      </td>
                    </tr>
                  ) : rekapData.length > 0 ? (
                    rekapData.map((row, idx) => {
                      const isLow = row.persentase < 85;
                      return (
                        <tr key={row.siswa_id} className={`hover:bg-slate-50 ${isLow ? 'bg-amber-50/50' : ''}`}>
                          <td className="py-2 px-2 text-center font-bold text-slate-500 border border-slate-300">
                            {idx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono text-xs border border-slate-300 text-slate-600">
                            {row.nisn}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 border border-slate-300">
                            {row.nama_lengkap}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-600 border border-slate-300">
                            {row.total_pertemuan}
                          </td>
                          <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/50 border border-slate-300">
                            {row.hadir}
                          </td>
                          <td className="py-2 px-2 text-center text-blue-700 border border-slate-300">
                            {row.sakit}
                          </td>
                          <td className="py-2 px-2 text-center text-amber-700 border border-slate-300">
                            {row.izin}
                          </td>
                          <td className="py-2 px-2 text-center text-red-700 border border-slate-300">
                            {row.alfa}
                          </td>
                          <td className="py-2 px-3 text-center font-black border border-slate-300">
                            <span className={isLow ? 'text-amber-600 font-extrabold' : 'text-slate-800'}>
                              {row.persentase}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-6 text-center text-slate-400">
                        Tidak ada data pertemuan pada periode ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Kolom Tanda Tangan Resmi Dokumen Sekolah */}
            <div className="signature-block mt-10 pt-6 flex justify-between text-xs text-slate-800">
              <div className="text-center w-60">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah {namaSekolah}</p>
                <div className="h-16"></div>
                <p className="font-bold underline">Drs. H. Mulyadi, M.Pd.</p>
                <p className="text-[11px] text-slate-500">NIP. 19680512 199303 1 004</p>
              </div>

              <div className="text-center w-60">
                <p>Kota Teladan, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold">Guru Wali Kelas VII-A</p>
                <div className="h-16"></div>
                <p className="font-bold underline">Budi Santoso, S.Pd.</p>
                <p className="text-[11px] text-slate-500">NIP. 19820715 200801 1 011</p>
              </div>
            </div>

          </div>
        </main>

        <div className="no-print">
          <NavigasiBawah />
        </div>
      </div>
    </Penjaga>
  );
}

