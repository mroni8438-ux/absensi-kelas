'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buatTautanBerkas,
  kirimAbsenMandiri,
} from '../../lib/api';
import {
  ambilLokasiGPS,
  hitungJarakMeter,
  siapkanBerkasUnggah,
} from '../../lib/mediaHelper';
import { formatTanggalIndonesia } from '../../lib/siswaHelper';
import jsQR from '../../lib/jsqr';

function ekstrakKodeDariHasilScan(rawText) {
  const txt = String(rawText || '').trim();
  if (!txt) return '';
  try {
    if (txt.includes('kode=')) {
      const url = new URL(txt.startsWith('http') ? txt : `https://dummy.local/${txt.replace(/^\//, '')}`);
      const k = url.searchParams.get('kode');
      if (k) return k.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    }
  } catch {}
  if (txt.toUpperCase().startsWith('ABSEN:')) {
    return txt.slice(6).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
  }
  const match = txt.match(/\b([A-Za-z0-9]{6})\b/);
  return (match ? match[1] : txt).toUpperCase().slice(0, 8);
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

export default function PanelAbsenMandiri({
  siswa,
  pengaturan,
  sesiAktifList = [],
  loadingSesi = false,
  isPreview = false,
  onBerhasilAbsen,
}) {
  const [bukaForm, setBukaForm] = useState(false);
  const [kodeSesi, setKodeSesi] = useState('');
  const [mengirim, setMengirim] = useState(false);
  const [pesan, setPesan] = useState(null); // { tipe: 'ok'|'err', teks }

  // GPS state
  const [lokasi, setLokasi] = useState(null); // { latitude, longitude, akurasi }
  const [mengambilLokasi, setMengambilLokasi] = useState(false);
  const [errorLokasi, setErrorLokasi] = useState('');

  // Selfie state
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  const [infoSelfie, setInfoSelfie] = useState('');
  const [kameraSelfieAktif, setKameraSelfieAktif] = useState(false);
  const videoSelfieRef = useRef(null);
  const streamSelfieRef = useRef(null);

  // QR Scanner state
  const [scannerAktif, setScannerAktif] = useState(false);
  const [infoScanner, setInfoScanner] = useState('');
  const videoQrRef = useRef(null);
  const streamQrRef = useRef(null);
  const timerQrRef = useRef(null);

  // Pratinjau foto selfie yang sudah tersimpan di sesi aktif
  const [urlSelfieTersimpan, setUrlSelfieTersimpan] = useState('');

  // Baca query ?kode= saat membuka tautan QR dari kamera HP
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qKode = params.get('kode');
    if (qKode) {
      setKodeSesi(ekstrakKodeDariHasilScan(qKode));
      setBukaForm(true);
    }
  }, []);

  // Bersihkan semua stream kamera saat komponen dilepas
  useEffect(() => {
    return () => {
      hentikanKameraSelfie();
      hentikanScannerQr();
      if (selfiePreview && selfiePreview.startsWith('blob:')) {
        URL.revokeObjectURL(selfiePreview);
      }
    };
  }, []);

  const sesiBelumAbsen = useMemo(
    () => sesiAktifList.filter((s) => !s.sudah_absen),
    [sesiAktifList]
  );

  // Tentukan kebutuhan GPS/Selfie dari sesi aktif yang belum diikuti
  const targetSesi = sesiBelumAbsen[0] || sesiAktifList[0] || null;
  const butuhSelfie = Boolean(targetSesi?.wajib_selfie);
  const butuhGps = Boolean(targetSesi?.wajib_gps);

  const latSekolah = parseFloat(pengaturan?.lokasi_sekolah_lat);
  const lngSekolah = parseFloat(pengaturan?.lokasi_sekolah_lng);
  const radiusMaks = Math.max(parseInt(pengaturan?.radius_absen_meter, 10) || 150, 20);

  const jarakMeter = useMemo(() => {
    if (!lokasi || Number.isNaN(latSekolah) || Number.isNaN(lngSekolah)) return null;
    return Math.round(hitungJarakMeter(lokasi.latitude, lokasi.longitude, latSekolah, lngSekolah));
  }, [lokasi, latSekolah, lngSekolah]);

  const diDalamRadius = jarakMeter === null ? null : jarakMeter <= radiusMaks;

  function hentikanScannerQr() {
    if (timerQrRef.current) {
      clearInterval(timerQrRef.current);
      timerQrRef.current = null;
    }
    if (streamQrRef.current) {
      streamQrRef.current.getTracks().forEach((t) => t.stop());
      streamQrRef.current = null;
    }
    setScannerAktif(false);
  }

  function hentikanKameraSelfie() {
    if (streamSelfieRef.current) {
      streamSelfieRef.current.getTracks().forEach((t) => t.stop());
      streamSelfieRef.current = null;
    }
    setKameraSelfieAktif(false);
  }

  async function mulaiScannerQr() {
    setInfoScanner('');
    setPesan(null);
    hentikanKameraSelfie();

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setInfoScanner('Kamera tidak dapat diakses pada browser ini. Anda dapat menggunakan opsi "Unggah Gambar QR" atau ketik 6 digit kode secara manual.');
      return;
    }

    try {
      // Prioritaskan kamera belakang (ideal), bila di desktop/laptop otomatis gunakan webcam yang ada
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamQrRef.current = stream;
      setScannerAktif(true);

      const decodeFn = typeof jsQR === 'function' ? jsQR : jsQR?.default;
      const offCanvas = document.createElement('canvas');

      setTimeout(async () => {
        if (videoQrRef.current && streamQrRef.current) {
          videoQrRef.current.srcObject = streamQrRef.current;
          try { await videoQrRef.current.play(); } catch {}
        }

        // Siapkan BarcodeDetector native jika browser mendukung
        let nativeDetector = null;
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            nativeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
          } catch {}
        }

        timerQrRef.current = setInterval(async () => {
          if (!videoQrRef.current || videoQrRef.current.readyState < 2) return;
          const vid = videoQrRef.current;
          const vw = vid.videoWidth;
          const vh = vid.videoHeight;
          if (!vw || !vh) return;

          // 1. Coba BarcodeDetector jika didukung perangkat
          if (nativeDetector) {
            try {
              const barcodes = await nativeDetector.detect(vid);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                const hasil = ekstrakKodeDariHasilScan(barcodes[0].rawValue);
                if (hasil) {
                  setKodeSesi(hasil);
                  hentikanScannerQr();
                  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100);
                  setPesan({ tipe: 'ok', teks: `Kode QR berhasil dipindai (${hasil})! Lengkapi data lalu kirim presensi.` });
                  return;
                }
              }
            } catch {}
          }

          // 2. Decoder jsQR murni via canvas (berjalan di desktop Chrome, Safari, Firefox, iOS, Android)
          if (decodeFn) {
            try {
              const maxDim = 640;
              const scale = Math.min(1, maxDim / Math.max(vw, vh));
              offCanvas.width = Math.max(1, Math.round(vw * scale));
              offCanvas.height = Math.max(1, Math.round(vh * scale));
              const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(vid, 0, 0, offCanvas.width, offCanvas.height);
                const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                const code = decodeFn(imgData.data, offCanvas.width, offCanvas.height);
                if (code && code.data) {
                  const hasil = ekstrakKodeDariHasilScan(code.data);
                  if (hasil) {
                    setKodeSesi(hasil);
                    hentikanScannerQr();
                    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100);
                    setPesan({ tipe: 'ok', teks: `Kode QR berhasil dipindai (${hasil})! Lengkapi data lalu kirim presensi.` });
                    return;
                  }
                }
              }
            } catch {}
          }
        }, 220);
      }, 150);
    } catch (err) {
      hentikanScannerQr();
      let pesanErr = 'Kamera scanner tidak dapat diaktifkan.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        pesanErr = 'Izin kamera diblokir di browser. Klik ikon izin/gembok di bilah alamat browser (kiri atas) lalu ubah izin Kamera menjadi "Izinkan" (Allow), atau gunakan opsi "Unggah Gambar QR" / ketik kode manual.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        pesanErr = 'Perangkat kamera tidak ditemukan. Gunakan opsi "Unggah Gambar QR" atau ketik 6 digit kode dari guru.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        pesanErr = 'Kamera sedang dipakai aplikasi lain (seperti Zoom/Teams/tab lain). Tutup aplikasi tersebut atau gunakan opsi unggah gambar QR.';
      } else {
        pesanErr = `Gagal membuka kamera scanner (${err.message || err.name}). Anda dapat memakai opsi "Unggah Gambar QR" atau ketik kode manual.`;
      }
      setInfoScanner(pesanErr);
    }
  }

  async function handleScanGambarQr(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPesan(null);
    setInfoScanner('');

    const decodeFn = typeof jsQR === 'function' ? jsQR : jsQR?.default;
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const code = decodeFn ? decodeFn(imgData.data, img.width, img.height) : null;
          if (code && code.data) {
            const hasil = ekstrakKodeDariHasilScan(code.data);
            if (hasil) {
              setKodeSesi(hasil);
              if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(100);
              setPesan({ tipe: 'ok', teks: `Kode QR berhasil terbaca dari gambar (${hasil})!` });
              return;
            }
          }
          setPesan({
            tipe: 'err',
            teks: 'Kode QR tidak dapat dideteksi pada gambar tersebut. Pastikan gambar jelas dan tegak, atau ketik 6 digit kode sesi secara manual.',
          });
        } catch {
          setPesan({ tipe: 'err', teks: 'Gagal memproses gambar QR.' });
        }
      };
      img.onerror = () => {
        setPesan({ tipe: 'err', teks: 'Format berkas gambar QR tidak valid.' });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function mulaiKameraSelfie() {
    setPesan(null);
    hentikanScannerQr();

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setPesan({
        tipe: 'err',
        teks: 'Kamera langsung tidak didukung pada browser ini. Silakan gunakan tombol "Ambil / Pilih Foto dari Perangkat".',
      });
      return;
    }

    try {
      // Prioritaskan kamera depan (ideal), bila tidak didukung webcam desktop otomatis fallback
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamSelfieRef.current = stream;
      setKameraSelfieAktif(true);

      setTimeout(async () => {
        if (videoSelfieRef.current && streamSelfieRef.current) {
          videoSelfieRef.current.srcObject = streamSelfieRef.current;
          try { await videoSelfieRef.current.play(); } catch {}
        }
      }, 150);
    } catch (err) {
      hentikanKameraSelfie();
      let pesanErr = 'Kamera selfie tidak dapat diaktifkan.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        pesanErr = 'Izin kamera diblokir di browser. Klik ikon izin/gembok di bilah alamat browser (kiri atas) lalu ubah izin Kamera menjadi "Izinkan" (Allow), atau gunakan tombol "Ambil / Pilih Foto dari Perangkat" di bawah.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        pesanErr = 'Perangkat kamera tidak ditemukan pada komputer/HP ini. Anda dapat memakai tombol "Ambil / Pilih Foto dari Perangkat".';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        pesanErr = 'Kamera sedang dipakai aplikasi lain (seperti Zoom/Teams/aplikasi lain). Tutup aplikasi tersebut atau gunakan tombol "Ambil / Pilih Foto dari Perangkat".';
      } else {
        pesanErr = `Gagal membuka kamera selfie (${err.message || err.name}). Anda tetap bisa menggunakan tombol "Ambil / Pilih Foto dari Perangkat".`;
      }
      setPesan({ tipe: 'err', teks: pesanErr });
    }
  }

  async function jepretSelfieKamera() {
    const video = videoSelfieRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement('canvas');
    const maxW = 720;
    const scale = Math.min(1, maxW / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      if (selfiePreview && selfiePreview.startsWith('blob:')) {
        URL.revokeObjectURL(selfiePreview);
      }
      setSelfieBlob(blob);
      setSelfiePreview(URL.createObjectURL(blob));
      setInfoSelfie(`Selfie siap (${Math.round(blob.size / 1024)} KB)`);
      hentikanKameraSelfie();
    }, 'image/jpeg', 0.78);
  }

  async function handlePilihFileSelfie(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const hasil = await siapkanBerkasUnggah(file, {
      maxWidth: 720,
      quality: 0.78,
      maxBytes: 2 * 1024 * 1024,
      izinkanPdf: false,
    });
    if (!hasil.ok) {
      setPesan({ tipe: 'err', teks: hasil.pesan });
      return;
    }
    if (selfiePreview && selfiePreview.startsWith('blob:')) {
      URL.revokeObjectURL(selfiePreview);
    }
    setSelfieBlob(hasil.blob);
    setSelfiePreview(URL.createObjectURL(hasil.blob));
    setInfoSelfie(`Foto terkompres (${Math.round(hasil.blob.size / 1024)} KB)`);
    setPesan(null);
  }

  async function handleAmbilGps() {
    setErrorLokasi('');
    setMengambilLokasi(true);
    const res = await ambilLokasiGPS();
    setMengambilLokasi(false);
    if (!res.ok) {
      setErrorLokasi(res.pesan);
      return;
    }
    setLokasi({
      latitude: res.latitude,
      longitude: res.longitude,
      akurasi: res.akurasi,
    });
  }

  async function handleKirimPresensi(e) {
    e.preventDefault();
    if (isPreview) return;
    setPesan(null);

    const kodeBersih = kodeSesi.trim().toUpperCase();
    if (kodeBersih.length < 4) {
      setPesan({ tipe: 'err', teks: 'Masukkan kode sesi dari guru minimal 4 karakter / 6 digit.' });
      return;
    }
    if (butuhSelfie && !selfieBlob) {
      setPesan({ tipe: 'err', teks: 'Sesi ini mewajibkan foto selfie check-in sebelum mengirim presensi.' });
      return;
    }
    if (butuhGps && !lokasi) {
      setPesan({ tipe: 'err', teks: 'Sesi ini mewajibkan verifikasi lokasi GPS sekolah terlebih dahulu.' });
      return;
    }
    if (butuhGps && diDalamRadius === false) {
      setPesan({
        tipe: 'err',
        teks: `Lokasi Anda berada di luar radius sekolah (${jarakMeter >= 1000 ? (jarakMeter / 1000).toFixed(1) + ' km' : jarakMeter + ' meter'} dari batas ${radiusMaks} meter).`,
      });
      return;
    }

    setMengirim(true);
    const res = await kirimAbsenMandiri({
      siswa_id: siswa?.id,
      kode_sesi: kodeBersih,
      latitude: lokasi?.latitude ?? null,
      longitude: lokasi?.longitude ?? null,
      selfie_blob: selfieBlob,
    });
    setMengirim(false);

    if (!res.ok) {
      setPesan({ tipe: 'err', teks: res.pesan || 'Gagal mengirim absen mandiri.' });
      return;
    }

    setPesan({ tipe: 'ok', teks: res.pesan || 'Presensi mandiri berhasil dicatat!' });
    setKodeSesi('');
    setSelfieBlob(null);
    if (selfiePreview && selfiePreview.startsWith('blob:')) URL.revokeObjectURL(selfiePreview);
    setSelfiePreview('');
    setInfoSelfie('');
    setBukaForm(false);
    hentikanKameraSelfie();
    hentikanScannerQr();
    onBerhasilAbsen?.();
  }

  return (
    <section
      id="absen-mandiri"
      className="bg-white rounded-card p-5 shadow-soft border border-slate-200 scroll-mt-20"
    >
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-extrabold text-sm text-slate-800">Absen Mandiri Siswa</h2>
              {sesiBelumAbsen.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold animate-pulse">
                  {sesiBelumAbsen.length} Sesi Dibuka
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Check-in dengan kode sesi / QR dari guru{butuhGps ? ', verifikasi GPS,' : ''}{butuhSelfie ? ' & selfie' : ''}.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setBukaForm((v) => !v)}
          className={`min-h-0 px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            bukaForm
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-primary text-white hover:bg-primary-hover shadow-sm'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {bukaForm ? 'close' : 'how_to_reg'}
          </span>
          <span>{bukaForm ? 'Tutup Panel Check-In' : 'Isi Absen Sekarang'}</span>
        </button>
      </div>

      {/* Status Sesi Aktif */}
      {loadingSesi ? (
        <div className="mt-4 h-16 rounded-2xl bg-slate-100 animate-pulse" />
      ) : sesiAktifList.length > 0 ? (
        <div className="mt-4 space-y-2.5">
          {sesiAktifList.map((s) => (
            <div
              key={s.pertemuan_id}
              className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                s.sudah_absen
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-primary-light/40 border-primary/20'
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-extrabold text-slate-800">{s.judul_materi}</p>
                  {s.wajib_selfie && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 text-[10px] font-bold">
                      Wajib Selfie
                    </span>
                  )}
                  {s.wajib_gps && (
                    <span className="px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200 text-[10px] font-bold">
                      GPS ≤ {radiusMaks}m
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {formatTanggalIndonesia(s.tanggal)} • Kode berlaku hingga {formatJamWib(s.kode_berlaku_sampai)} WIB
                </p>
              </div>

              {s.sudah_absen ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold shrink-0 self-start sm:self-auto">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  Sudah Check-In ({s.status_absen}) • {formatJamWib(s.waktu_check_in)}
                </span>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  {s.kode_demo && (
                    <button
                      type="button"
                      onClick={() => {
                        setKodeSesi(s.kode_demo);
                        setBukaForm(true);
                      }}
                      className="min-h-0 px-3 py-1.5 rounded-full bg-white border border-primary/30 text-primary text-[11px] font-bold hover:bg-primary-light transition-colors"
                    >
                      Pakai Kode Demo ({s.kode_demo})
                    </button>
                  )}
                  {!bukaForm && (
                    <button
                      type="button"
                      onClick={() => setBukaForm(true)}
                      className="min-h-0 px-3 py-1.5 rounded-full bg-primary text-white text-[11px] font-bold"
                    >
                      Check-In
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between gap-2">
          <span>Belum ada sesi presensi mandiri yang sedang aktif untuk kelas Anda saat ini.</span>
          {!bukaForm && (
            <button
              type="button"
              onClick={() => setBukaForm(true)}
              className="min-h-0 text-primary font-bold hover:underline shrink-0"
            >
              Punya Kode?
            </button>
          )}
        </div>
      )}

      {/* Notifikasi hasil */}
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

      {/* Form Check-In */}
      {bukaForm && (
        <form onSubmit={handleKirimPresensi} className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          {isPreview && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              Mode Pratinjau Admin/Guru: pengiriman check-in dinonaktifkan agar data absensi siswa tidak berubah.
            </div>
          )}

          {/* Langkah 1: Kode Sesi / QR */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Kode Sesi dari Guru (6 Digit)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                maxLength={8}
                value={kodeSesi}
                onChange={(e) => setKodeSesi(e.target.value.toUpperCase())}
                placeholder="Contoh: 482910"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-base font-black tracking-[0.2em] text-center text-slate-800 outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={scannerAktif ? hentikanScannerQr : mulaiScannerQr}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors ${
                    scannerAktif
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-primary-light border-primary/20 text-primary hover:bg-primary/15'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {scannerAktif ? 'stop_circle' : 'qr_code_scanner'}
                  </span>
                  <span>{scannerAktif ? 'Tutup Kamera QR' : 'Scan QR Guru'}</span>
                </button>
                <label className="px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm" title="Pindai gambar atau tangkapan layar QR">
                  <span className="material-symbols-outlined text-[18px] text-primary">add_photo_alternate</span>
                  <span>Unggah QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScanGambarQr}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {infoScanner && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2 leading-relaxed">
                {infoScanner}
              </p>
            )}

            {scannerAktif && (
              <div className="mt-3 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-w-sm">
                <video ref={videoQrRef} playsInline muted className="w-full h-56 object-cover" />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-40 h-40 border-2 border-emerald-400 rounded-2xl shadow-lg animate-pulse" />
                </div>
                <p className="text-[11px] text-white/90 text-center py-2 bg-slate-900/80">
                  Arahkan kamera ke QR Code di layar guru…
                </p>
              </div>
            )}
          </div>

          {/* Langkah 2: Verifikasi Lokasi GPS */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  2. Lokasi GPS Sekolah {butuhGps ? '(Wajib Sesi Ini)' : '(Opsional)'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Radius maksimal sekolah: <strong className="text-slate-700">{radiusMaks} meter</strong>
                  {!butuhGps && ' • Guru mengizinkan absen dari mana saja'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAmbilGps}
                disabled={mengambilLokasi}
                className="min-h-0 px-3.5 py-2 rounded-full bg-white border border-slate-200 hover:border-primary/40 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">my_location</span>
                <span>{mengambilLokasi ? 'Mencari GPS...' : lokasi ? 'Perbarui GPS' : 'Ambil Lokasi GPS'}</span>
              </button>
            </div>

            {lokasi && (
              <div className={`mt-2.5 p-3 rounded-xl text-xs font-semibold border ${
                butuhGps
                  ? diDalamRadius
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}>
                {jarakMeter !== null ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="material-symbols-outlined text-[17px]">
                        {butuhGps ? (diDalamRadius ? 'verified' : 'location_off') : 'my_location'}
                      </span>
                      <span>
                        {butuhGps
                          ? diDalamRadius
                            ? `Dalam Radius Presensi Sekolah (${jarakMeter} m)`
                            : `Di Luar Radius Sekolah Wajib (Batas ${radiusMaks} m)`
                          : 'Koordinat GPS Anda Berhasil Dicatat'}
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                      Jarak dari titik sekolah terdaftar:{' '}
                      <strong>{jarakMeter >= 1000 ? `${(jarakMeter / 1000).toFixed(1)} km` : `${jarakMeter} meter`}</strong>{' '}
                      (Akurasi GPS perangkat: ±{lokasi.akurasi || '?'}m).
                    </p>
                    {!butuhGps ? (
                      <p className="text-[11px] text-blue-700 font-bold">
                        ✓ Status: GPS Opsional (Sesi ini fleksibel) — Presensi Anda tetap sah dan dapat langsung dikirim.
                      </p>
                    ) : !diDalamRadius ? (
                      <p className="text-[11px] text-amber-800 bg-white/70 p-2 rounded-lg border border-amber-200/60 leading-relaxed">
                        ⚠️ Sesi ini mewajibkan radius sekolah. Jika Anda sudah berada di sekolah namun jarak terdeteksi jauh, titik koordinat sekolah di sistem mungkin masih menggunakan nilai awal Jakarta. Admin dapat memperbaruinya di menu <strong>Admin → Lokasi GPS &amp; Aturan</strong>.
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-700 font-bold">
                        ✓ Verifikasi radius sekolah terpenuhi.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    <span>Koordinat perangkat: ({lokasi.latitude.toFixed(5)}, {lokasi.longitude.toFixed(5)})</span>
                  </div>
                )}
              </div>
            )}

            {errorLokasi && (
              <p className="mt-2 text-[11px] text-red-600 font-semibold">{errorLokasi}</p>
            )}
          </div>

          {/* Langkah 3: Foto Selfie Check-In */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-700">
                  3. Foto Selfie Check-In {butuhSelfie ? '(Wajib)' : '(Opsional)'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Foto wajah dengan latar kelas untuk verifikasi guru wali.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={kameraSelfieAktif ? hentikanKameraSelfie : mulaiKameraSelfie}
                  className="min-h-0 px-3 py-2 rounded-full bg-white border border-slate-200 hover:border-primary/40 text-xs font-bold text-slate-700 flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">photo_camera</span>
                  <span>{kameraSelfieAktif ? 'Tutup Kamera' : 'Kamera Selfie'}</span>
                </button>
                <label className="min-h-0 px-3 py-2 rounded-full bg-white border border-slate-200 hover:border-primary/40 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                  <span className="material-symbols-outlined text-[16px] text-primary">upload</span>
                  <span>Ambil / Pilih Foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handlePilihFileSelfie}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {kameraSelfieAktif && (
              <div className="mt-3 max-w-xs space-y-2">
                <video
                  ref={videoSelfieRef}
                  playsInline
                  muted
                  className="w-full h-56 object-cover rounded-2xl bg-slate-900 border border-slate-200"
                />
                <button
                  type="button"
                  onClick={jepretSelfieKamera}
                  className="w-full py-2.5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">camera</span>
                  <span>Ambil Foto Ini</span>
                </button>
              </div>
            )}

            {selfiePreview && (
              <div className="mt-3 flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200 w-fit">
                <img
                  src={selfiePreview}
                  alt="Pratinjau selfie check-in"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                />
                <div className="text-xs">
                  <p className="font-bold text-emerald-700">{infoSelfie || 'Foto siap diunggah'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (selfiePreview.startsWith('blob:')) URL.revokeObjectURL(selfiePreview);
                      setSelfiePreview('');
                      setSelfieBlob(null);
                      setInfoSelfie('');
                    }}
                    className="min-h-0 text-[11px] font-bold text-red-600 hover:underline mt-1"
                  >
                    Hapus / Ulangi Foto
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tombol Kirim */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setBukaForm(false)}
              className="px-4 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={mengirim || isPreview}
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-extrabold shadow-soft transition-all disabled:opacity-50"
            >
              {mengirim ? 'Mengirim Check-In...' : 'Kirim Presensi Mandiri'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

