'use client';

import { useState } from 'react';
import {
  ajukanIzinSiswa,
  batalkanPengajuanIzin,
  buatTautanBerkas,
} from '../../lib/api';
import { siapkanBerkasUnggah } from '../../lib/mediaHelper';
import { formatTanggalIndonesia } from '../../lib/siswaHelper';

function getTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const BADGE_STATUS_IZIN = {
  Menunggu: 'bg-amber-100 text-amber-800 border-amber-200',
  Disetujui: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Ditolak: 'bg-red-100 text-red-700 border-red-200',
};

export default function PanelIzinSiswa({
  siswa,
  kelasId,
  daftarPengajuan = [],
  loadingIzin = false,
  isPreview = false,
  onBerhasilAjukan,
}) {
  const hariIni = getTodayIso();
  const [bukaForm, setBukaForm] = useState(false);
  const [jenis, setJenis] = useState('Izin');
  const [tanggalMulai, setTanggalMulai] = useState(hariIni);
  const [tanggalSelesai, setTanggalSelesai] = useState(hariIni);
  const [alasan, setAlasan] = useState('');
  const [berkasSiap, setBerkasSiap] = useState(null); // { blob, ext, contentType, namaAsli }
  const [sedangProsesBerkas, setSedangProsesBerkas] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [pesan, setPesan] = useState(null);

  // Konfirmasi batal tanpa dialog bawaan browser
  const [konfirmasiBatalId, setKonfirmasiBatalId] = useState(null);
  const [membatalkanId, setMembatalkanId] = useState(null);

  // Pratinjau lampiran bukti
  const [pratinjauBukti, setPratinjauBukti] = useState(null); // { url, isPdf, judul }
  const [memuatBuktiId, setMemuatBuktiId] = useState(null);

  async function handlePilihBerkas(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPesan(null);
    setSedangProsesBerkas(true);
    const res = await siapkanBerkasUnggah(file, {
      maxWidth: 1280,
      quality: 0.78,
      maxBytes: 3 * 1024 * 1024,
      izinkanPdf: true,
    });
    setSedangProsesBerkas(false);
    if (!res.ok) {
      setPesan({ tipe: 'err', teks: res.pesan });
      return;
    }
    setBerkasSiap({
      blob: res.blob,
      ext: res.ext,
      contentType: res.contentType,
      namaAsli: file.name,
      ukuranKb: Math.round(res.blob.size / 1024),
    });
  }

  async function handleKirimPengajuan(e) {
    e.preventDefault();
    if (isPreview) return;
    setPesan(null);

    if (!tanggalMulai || !tanggalSelesai || tanggalSelesai < tanggalMulai) {
      setPesan({ tipe: 'err', teks: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' });
      return;
    }
    if (alasan.trim().length < 5) {
      setPesan({ tipe: 'err', teks: 'Tuliskan alasan izin / sakit minimal 5 karakter.' });
      return;
    }

    setMengirim(true);
    const res = await ajukanIzinSiswa({
      siswa_id: siswa?.id,
      kelas_id: kelasId,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      jenis,
      alasan: alasan.trim(),
      file_bukti_info: berkasSiap,
    });
    setMengirim(false);

    if (!res.ok) {
      setPesan({ tipe: 'err', teks: res.pesan || 'Gagal mengirim pengajuan izin.' });
      return;
    }

    setPesan({ tipe: 'ok', teks: res.pesan || 'Pengajuan izin berhasil dikirim.' });
    setAlasan('');
    setBerkasSiap(null);
    setBukaForm(false);
    onBerhasilAjukan?.();
  }

  async function handleBatalkan(izinId) {
    setMembatalkanId(izinId);
    const res = await batalkanPengajuanIzin(izinId);
    setMembatalkanId(null);
    setKonfirmasiBatalId(null);
    if (!res.ok) {
      setPesan({ tipe: 'err', teks: res.pesan || 'Gagal membatalkan pengajuan.' });
      return;
    }
    setPesan({ tipe: 'ok', teks: 'Pengajuan izin berhasil dibatalkan.' });
    onBerhasilAjukan?.();
  }

  async function handleBukaBukti(item) {
    if (!item?.bukti_path) return;
    setMemuatBuktiId(item.id);
    const res = await buatTautanBerkas('bukti-izin', item.bukti_path);
    setMemuatBuktiId(null);
    if (!res.ok || !res.url) {
      setPesan({ tipe: 'err', teks: res.pesan || 'Gagal membuka lampiran bukti izin.' });
      return;
    }
    const isPdf = item.bukti_path.toLowerCase().endsWith('.pdf') || res.url.startsWith('data:application/pdf');
    setPratinjauBukti({
      url: res.url,
      isPdf,
      judul: `Bukti ${item.jenis} (${formatTanggalIndonesia(item.tanggal_mulai)})`,
    });
  }

  return (
    <section
      id="pengajuan-izin"
      className="bg-white rounded-card p-5 shadow-soft border border-slate-200 scroll-mt-20"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">mail</span>
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-800">Pengajuan Izin &amp; Sakit</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Kirim surat keterangan beserta bukti foto/PDF ke guru wali kelas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setBukaForm((v) => !v);
            setPesan(null);
          }}
          className={`min-h-0 px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            bukaForm
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-primary-light text-primary hover:bg-primary/20'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {bukaForm ? 'close' : 'add'}
          </span>
          <span>{bukaForm ? 'Tutup Form' : 'Ajukan Izin / Sakit'}</span>
        </button>
      </div>

      {/* Pesan Feedback */}
      {pesan && (
        <div
          className={`mt-4 p-3.5 rounded-2xl text-xs font-bold border ${
            pesan.tipe === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {pesan.teks}
        </div>
      )}

      {/* Form Pengajuan Baru */}
      {bukaForm && (
        <form onSubmit={handleKirimPengajuan} className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          {isPreview && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              Mode Pratinjau Admin/Guru: pengajuan baru hanya aktif saat siswa login sendiri.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Ketidakhadiran</label>
              <div className="grid grid-cols-2 gap-2">
                {['Izin', 'Sakit'].map((opsi) => (
                  <button
                    key={opsi}
                    type="button"
                    onClick={() => setJenis(opsi)}
                    className={`py-2 rounded-xl text-xs font-extrabold border transition-colors ${
                      jenis === opsi
                        ? opsi === 'Sakit'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opsi}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Dari Tanggal</label>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => {
                  setTanggalMulai(e.target.value);
                  if (tanggalSelesai < e.target.value) setTanggalSelesai(e.target.value);
                }}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Sampai Tanggal</label>
              <input
                type="date"
                min={tanggalMulai}
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Alasan Lengkap</label>
            <textarea
              rows={2}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Demam sejak semalam / Menghadiri acara keluarga di luar kota..."
              className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 outline-none focus:border-primary"
              required
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-slate-700">Lampiran Surat Dokter / Orang Tua (Opsional)</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {berkasSiap
                  ? `Siap unggah: ${berkasSiap.namaAsli} (${berkasSiap.ukuranKb} KB)`
                  : 'Format JPG/PNG/WebP/PDF, foto kamera otomatis diperkecil (< 3 MB).'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {berkasSiap && (
                <button
                  type="button"
                  onClick={() => setBerkasSiap(null)}
                  className="min-h-0 px-3 py-1.5 rounded-full bg-red-50 text-red-600 text-[11px] font-bold"
                >
                  Hapus
                </button>
              )}
              <label className="min-h-0 px-4 py-2 rounded-full bg-white border border-slate-200 hover:border-primary/40 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                <span className="material-symbols-outlined text-[16px] text-primary">attach_file</span>
                <span>{sedangProsesBerkas ? 'Memproses...' : berkasSiap ? 'Ganti File' : 'Pilih Foto / PDF'}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handlePilihBerkas}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBukaForm(false)}
              className="px-4 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mengirim || sedangProsesBerkas || isPreview}
              className="px-6 py-2 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-extrabold shadow-soft transition-all disabled:opacity-50"
            >
              {mengirim ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan'}
            </button>
          </div>
        </form>
      )}

      {/* Daftar Pengajuan Izin Siswa */}
      <div className="mt-4 space-y-2.5">
        {loadingIzin ? (
          <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
        ) : daftarPengajuan.length > 0 ? (
          daftarPengajuan.map((item) => {
            const rentang =
              item.tanggal_mulai === item.tanggal_selesai
                ? formatTanggalIndonesia(item.tanggal_mulai)
                : `${formatTanggalIndonesia(item.tanggal_mulai)} s.d. ${formatTanggalIndonesia(item.tanggal_selesai)}`;
            const badgeCls = BADGE_STATUS_IZIN[item.status] || BADGE_STATUS_IZIN.Menunggu;

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-extrabold text-slate-700">
                      {item.jenis}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{rentang}</span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-extrabold ${badgeCls}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{item.alasan}</p>
                  {item.catatan_guru && (
                    <p className="text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                      Catatan Guru: {item.catatan_guru}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.bukti_path && (
                    <button
                      type="button"
                      onClick={() => handleBukaBukti(item)}
                      disabled={memuatBuktiId === item.id}
                      className="min-h-0 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-primary/40 text-xs font-bold text-primary flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      <span>{memuatBuktiId === item.id ? 'Membuka...' : 'Lihat Bukti'}</span>
                    </button>
                  )}

                  {item.status === 'Menunggu' && !isPreview && (
                    konfirmasiBatalId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleBatalkan(item.id)}
                          disabled={membatalkanId === item.id}
                          className="min-h-0 px-3 py-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold"
                        >
                          {membatalkanId === item.id ? '...' : 'Ya, Batalkan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setKonfirmasiBatalId(null)}
                          className="min-h-0 px-2.5 py-1.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold"
                        >
                          Tidak
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setKonfirmasiBatalId(item.id)}
                        className="min-h-0 px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold"
                      >
                        Batalkan
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[11px] text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            Belum ada riwayat pengajuan izin/sakit online.
          </p>
        )}
      </div>

      {/* Modal Pratinjau Bukti */}
      {pratinjauBukti && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPratinjauBukti(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 max-w-lg w-full shadow-2xl border border-slate-200 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-slate-800">{pratinjauBukti.judul}</h3>
              <button
                type="button"
                onClick={() => setPratinjauBukti(null)}
                className="min-h-0 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {pratinjauBukti.isPdf ? (
              <div className="space-y-3">
                <iframe
                  src={pratinjauBukti.url}
                  title={pratinjauBukti.judul}
                  className="w-full h-80 rounded-2xl border border-slate-200"
                />
                <a
                  href={pratinjauBukti.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span>Buka Dokumen PDF di Tab Baru</span>
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                </a>
              </div>
            ) : (
              <img
                src={pratinjauBukti.url}
                alt={pratinjauBukti.judul}
                className="w-full max-h-96 object-contain rounded-2xl bg-slate-50 border border-slate-200"
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

