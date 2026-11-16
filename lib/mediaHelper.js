/**
 * Helper kompresi foto di browser (Selfie & Surat Izin) serta kalkulasi jarak GPS (Haversine).
 */

/**
 * Kompres file gambar di browser agar hemat kuota Storage (maxWidth default 960px, JPEG).
 * Jika file PDF, dikembalikan apa adanya selama <= 2 MB.
 */
export async function siapkanBerkasUnggah(file, options = {}) {
  if (!file) return { ok: false, pesan: 'Berkas belum dipilih.' };

  const maxBytes = options.maxBytes || 3 * 1024 * 1024;
  if (file.size > maxBytes && !file.type.startsWith('image/')) {
    return { ok: false, pesan: `Ukuran berkas melebihi ${Math.round(maxBytes / (1024 * 1024))} MB.` };
  }

  if (file.type === 'application/pdf') {
    if (options.izinkanPdf === false) {
      return { ok: false, pesan: 'Berkas foto harus berformat gambar (JPG/PNG/WebP).' };
    }
    return { ok: true, blob: file, ext: 'pdf', contentType: 'application/pdf' };
  }

  if (!file.type.startsWith('image/')) {
    return { ok: false, pesan: 'Format berkas harus gambar (JPG/PNG/WebP) atau PDF.' };
  }

  const maxWidth = options.maxWidth || 960;
  const quality = options.quality || 0.75;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve({ ok: false, pesan: 'Gagal membaca file gambar.' });
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve({ ok: false, pesan: 'Berkas gambar tidak valid.' });
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.max(Math.round(img.width * scale), 1);
        const h = Math.max(Math.round(img.height * scale), 1);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ ok: true, blob: file, ext: 'jpg', contentType: file.type || 'image/jpeg' });
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ ok: false, pesan: 'Gagal mengompresi gambar.' });
              return;
            }
            resolve({ ok: true, blob, ext: 'jpg', contentType: 'image/jpeg' });
          },
          'image/jpeg',
          quality
        );
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function blobKeDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Gagal membaca data gambar.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Rumus Haversine: hitung jarak antara dua koordinat GPS dalam meter.
 */
export function hitungJarakMeter(lat1, lng1, lat2, lng2) {
  const r = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(Number(lat2) - Number(lat1));
  const dLng = toRad(Number(lng2) - Number(lng1));
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(Number(lat1))) *
      Math.cos(toRad(Number(lat2))) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(r * c);
}

/**
 * Ambil lokasi GPS perangkat dengan pesan error ramah bahasa Indonesia.
 * Mendukung fallback otomatis dari GPS akurasi tinggi ke jaringan WiFi/IP.
 */
export function ambilLokasiGPS() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, pesan: 'Perangkat atau browser ini tidak mendukung fitur lokasi GPS.' });
      return;
    }

    const sukses = (pos) => {
      resolve({
        ok: true,
        latitude: Number(pos.coords.latitude.toFixed(6)),
        longitude: Number(pos.coords.longitude.toFixed(6)),
        akurasi: Math.round(pos.coords.accuracy || 0),
      });
    };

    // Percobaan pertama: Akurasi tinggi (satelit GPS / sensor HP)
    navigator.geolocation.getCurrentPosition(
      sukses,
      (err) => {
        if (err.code === 1) {
          resolve({
            ok: false,
            pesan: 'Izin lokasi ditolak di browser. Klik ikon gembok / setelan situs di samping alamat URL lalu izinkan akses Lokasi.',
          });
          return;
        }

        // Percobaan kedua jika timeout / akurasi tinggi tidak tersedia (seperti di laptop/PC)
        navigator.geolocation.getCurrentPosition(
          sukses,
          (errKedua) => {
            if (errKedua.code === 1) {
              resolve({ ok: false, pesan: 'Izin lokasi ditolak di browser. Aktifkan izin lokasi untuk absen GPS.' });
            } else if (errKedua.code === 2) {
              resolve({ ok: false, pesan: 'Sinyal lokasi tidak tersedia. Pastikan fitur Lokasi/GPS pada perangkat telah aktif.' });
            } else {
              resolve({ ok: false, pesan: 'Waktu pengambilan lokasi habis. Silakan coba lagi atau pastikan jaringan internet stabil.' });
            }
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
    );
  });
}

