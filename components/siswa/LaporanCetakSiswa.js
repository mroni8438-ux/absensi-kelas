'use client';

import { formatTanggalIndonesia } from '../../lib/siswaHelper';

/**
 * Lembar Laporan Kehadiran Individu Siswa untuk Cetak / Unduh PDF (@media print).
 * Tersembunyi di layar normal dan otomatis muncul rapi saat window.print().
 */
export default function LaporanCetakSiswa({
  siswa,
  namaKelas,
  namaWaliKelas,
  pengaturan,
  ringkasan,
  riwayat = [],
  labelPeriode = 'Semua Semester',
}) {
  const namaSekolah = pengaturan?.nama_sekolah || 'SMP Negeri 1 Teladan';
  const tahunAjaran = pengaturan?.tahun_ajaran || '2026/2027';
  const semester = pengaturan?.semester || 'Ganjil';

  return (
    <div className="hidden print-area bg-white text-slate-900 p-6">
      {/* Kop Resmi Sekolah */}
      <div className="print-header text-center border-b-2 border-slate-900 pb-3 mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
          LAPORAN RESMI PRESENSI PESERTA DIDIK
        </p>
        <h2 className="text-xl font-extrabold uppercase text-slate-900 mt-0.5">
          {namaSekolah}
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Tahun Ajaran {tahunAjaran} • Semester {semester} • Periode: {labelPeriode}
        </p>
      </div>

      {/* Biodata Siswa */}
      <div className="grid grid-cols-2 gap-4 text-xs mb-5 border border-slate-300 rounded-lg p-3">
        <div className="space-y-1">
          <p><span className="font-bold">Nama Siswa:</span> {siswa?.nama_lengkap || '-'}</p>
          <p><span className="font-bold">NISN:</span> {siswa?.nisn || '-'}</p>
          <p><span className="font-bold">Nomor Absen:</span> #{siswa?.nomor_absen || '-'}</p>
        </div>
        <div className="space-y-1">
          <p><span className="font-bold">Kelas:</span> {namaKelas || siswa?.kelas_id || '-'}</p>
          <p><span className="font-bold">Wali Kelas:</span> {namaWaliKelas || 'Wali Kelas'}</p>
          <p><span className="font-bold">Persentase Kehadiran:</span> {ringkasan?.persentase ?? 100}%</p>
        </div>
      </div>

      {/* Ringkasan Angka */}
      <table className="w-full text-xs mb-5 border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-400 py-2 px-3 text-center">Total Pertemuan</th>
            <th className="border border-slate-400 py-2 px-3 text-center">Hadir (H)</th>
            <th className="border border-slate-400 py-2 px-3 text-center">Sakit (S)</th>
            <th className="border border-slate-400 py-2 px-3 text-center">Izin (I)</th>
            <th className="border border-slate-400 py-2 px-3 text-center">Alfa (A)</th>
            <th className="border border-slate-400 py-2 px-3 text-center">Persentase</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-slate-400 py-2 px-3 text-center font-bold">{ringkasan?.total_pertemuan || 0}</td>
            <td className="border border-slate-400 py-2 px-3 text-center font-bold">{ringkasan?.hadir || 0}</td>
            <td className="border border-slate-400 py-2 px-3 text-center font-bold">{ringkasan?.sakit || 0}</td>
            <td className="border border-slate-400 py-2 px-3 text-center font-bold">{ringkasan?.izin || 0}</td>
            <td className="border border-slate-400 py-2 px-3 text-center font-bold">{ringkasan?.alfa || 0}</td>
            <td className="border border-slate-400 py-2 px-3 text-center font-extrabold">{ringkasan?.persentase ?? 100}%</td>
          </tr>
        </tbody>
      </table>

      {/* Tabel Riwayat Pertemuan */}
      <h4 className="text-xs font-extrabold uppercase text-slate-800 mb-2">
        Rincian Catatan Pertemuan ({riwayat.length} entri)
      </h4>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-400 py-1.5 px-2 text-center w-10">No</th>
            <th className="border border-slate-400 py-1.5 px-2 text-left">Tanggal</th>
            <th className="border border-slate-400 py-1.5 px-2 text-left">Materi / Sesi</th>
            <th className="border border-slate-400 py-1.5 px-2 text-center">Status</th>
            <th className="border border-slate-400 py-1.5 px-2 text-left">Catatan Guru</th>
          </tr>
        </thead>
        <tbody>
          {riwayat.length > 0 ? (
            riwayat.map((r, idx) => (
              <tr key={r.id || idx}>
                <td className="border border-slate-400 py-1.5 px-2 text-center">{idx + 1}</td>
                <td className="border border-slate-400 py-1.5 px-2">{formatTanggalIndonesia(r.tanggal)}</td>
                <td className="border border-slate-400 py-1.5 px-2">{r.judul_materi}</td>
                <td className="border border-slate-400 py-1.5 px-2 text-center font-bold">{r.status}</td>
                <td className="border border-slate-400 py-1.5 px-2">{r.catatan || '-'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="border border-slate-400 py-4 text-center text-slate-500">
                Tidak ada catatan presensi pada periode ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Blok Tanda Tangan */}
      <div className="signature-block mt-10 flex justify-between text-xs">
        <div className="text-center w-56">
          <p>Mengetahui,</p>
          <p className="font-bold">Orang Tua / Wali Murid</p>
          <div className="h-16" />
          <p className="border-t border-slate-700 pt-1">( ........................................ )</p>
        </div>

        <div className="text-center w-56">
          <p>Dicetak pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="font-bold">Wali {namaKelas || 'Kelas'}</p>
          <div className="h-16" />
          <p className="font-bold underline">{namaWaliKelas || '( ........................................ )'}</p>
        </div>
      </div>
    </div>
  );
}

