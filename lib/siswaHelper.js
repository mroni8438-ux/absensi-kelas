export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const NAMA_BULAN_SINGKAT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const HARI_KALENDER = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/**
 * Pemetaan seragam tampilan warna & ikon untuk setiap status presensi.
 */
export const STATUS_PRESENSI = {
  Hadir: {
    label: 'Hadir',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    iconClass: 'text-emerald-500',
    icon: 'check_circle',
    dotClass: 'bg-emerald-500',
    cellClass: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    boxClass: 'bg-emerald-50 border-emerald-100 text-emerald-800',
  },
  Sakit: {
    label: 'Sakit',
    badgeClass: 'bg-blue-100 text-blue-700',
    iconClass: 'text-blue-500',
    icon: 'local_hospital',
    dotClass: 'bg-blue-500',
    cellClass: 'bg-blue-50 border-blue-200 text-blue-800',
    boxClass: 'bg-blue-50 border-blue-100 text-blue-800',
  },
  Izin: {
    label: 'Izin',
    badgeClass: 'bg-amber-100 text-amber-800',
    iconClass: 'text-amber-500',
    icon: 'event_note',
    dotClass: 'bg-amber-400',
    cellClass: 'bg-amber-50 border-amber-200 text-amber-800',
    boxClass: 'bg-amber-50 border-amber-100 text-amber-800',
  },
  Alfa: {
    label: 'Alfa',
    badgeClass: 'bg-red-100 text-red-700',
    iconClass: 'text-red-500',
    icon: 'cancel',
    dotClass: 'bg-red-500',
    cellClass: 'bg-red-50 border-red-200 text-red-800',
    boxClass: 'bg-red-50 border-red-100 text-red-800',
  },
};

export function getStatusStyle(status) {
  return STATUS_PRESENSI[status] || STATUS_PRESENSI.Hadir;
}

/**
 * Format tanggal YYYY-MM-DD ke bahasa Indonesia (mis. "Selasa, 10 Nov 2026").
 */
export function formatTanggalIndonesia(dateStr) {
  if (!dateStr || dateStr === '-') return '-';
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hari = hariNames[dt.getUTCDay()];
  const bulan = NAMA_BULAN_SINGKAT[m - 1] || '';
  return `${hari}, ${d} ${bulan} ${y}`;
}

/**
 * Ambil daftar bulan unik ('YYYY-MM') terurut terbaru lebih dulu dari riwayat.
 */
export function ambilDaftarBulan(riwayat = []) {
  const keys = new Set();
  riwayat.forEach((r) => {
    if (r.tanggal && /^\d{4}-\d{2}/.test(r.tanggal)) {
      keys.add(r.tanggal.slice(0, 7));
    }
  });
  return Array.from(keys)
    .sort((a, b) => b.localeCompare(a))
    .map((key) => {
      const [y, m] = key.split('-').map(Number);
      return {
        key,
        tahun: y,
        bulan: m,
        label: `${NAMA_BULAN[m - 1] || m} ${y}`,
      };
    });
}

/**
 * Hitung tren kehadiran bulanan terurut kronologis (lama -> baru) untuk grafik.
 */
export function hitungTrenBulanan(riwayat = []) {
  const map = {};
  riwayat.forEach((r) => {
    if (!r.tanggal || !/^\d{4}-\d{2}/.test(r.tanggal)) return;
    const key = r.tanggal.slice(0, 7);
    if (!map[key]) {
      const [y, m] = key.split('-').map(Number);
      map[key] = {
        key,
        label: `${NAMA_BULAN_SINGKAT[m - 1] || m} '${String(y).slice(-2)}`,
        labelLengkap: `${NAMA_BULAN[m - 1] || m} ${y}`,
        total: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alfa: 0,
      };
    }
    map[key].total += 1;
    if (r.status === 'Hadir') map[key].hadir += 1;
    else if (r.status === 'Sakit') map[key].sakit += 1;
    else if (r.status === 'Izin') map[key].izin += 1;
    else if (r.status === 'Alfa') map[key].alfa += 1;
  });

  return Object.values(map)
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6)
    .map((item) => ({
      ...item,
      persentase: item.total > 0 ? Number(((item.hadir / item.total) * 100).toFixed(1)) : 100,
    }));
}

/**
 * Evaluasi status kelayakan & peringatan dini berdasarkan persentase dan toleransi Alfa.
 */
export function evaluasiPeringatanKehadiran(ringkasan, toleransiAlfaMaks = 3) {
  const total = ringkasan?.total_pertemuan || 0;
  const persentase = ringkasan?.persentase ?? 100;
  const alfa = ringkasan?.alfa || 0;
  const maksAlfa = Math.max(parseInt(toleransiAlfaMaks, 10) || 3, 1);

  if (total === 0) {
    return {
      tingkat: 'info',
      labelRingkas: 'Belum Ada Sesi',
      judul: 'Belum ada pertemuan tercatat pada periode ini',
      deskripsi: 'Statistik kehadiran akan otomatis diperbarui setelah guru mencatat presensi kelas.',
    };
  }

  if (alfa >= maksAlfa) {
    return {
      tingkat: 'danger',
      labelRingkas: 'Batas Alfa Tercapai',
      judul: `Peringatan: Jumlah Alfa (${alfa}/${maksAlfa}) mencapai batas toleransi`,
      deskripsi: 'Segera konfirmasi kepada Wali Kelas agar status kehadiran tidak menghambat syarat penilaian.',
    };
  }

  if (persentase < 85) {
    return {
      tingkat: 'warning',
      labelRingkas: 'Perlu Perhatian',
      judul: `Kehadiran ${persentase}% berada di bawah batas minimal 85%`,
      deskripsi: 'Tingkatkan kehadiran pada pertemuan berikutnya atau sertakan keterangan resmi bila berhalangan.',
    };
  }

  if (alfa > 0 && alfa >= maksAlfa - 1) {
    return {
      tingkat: 'warning',
      labelRingkas: 'Waspada Alfa',
      judul: `Pengingat: Sisa toleransi Alfa tinggal ${maksAlfa - alfa} kali (${alfa}/${maksAlfa})`,
      deskripsi: 'Harap hubungi wali kelas sebelum berhalangan hadir agar tercatat sebagai Sakit/Izin.',
    };
  }

  return {
    tingkat: 'ok',
    labelRingkas: persentase >= 95 ? 'Sangat Baik' : 'Terpenuhi',
    judul: 'Kehadiran dalam kondisi baik dan memenuhi syarat',
    deskripsi: `Persentase kehadiran ${persentase}% dengan ${alfa}/${maksAlfa} batas Alfa terpakai.`,
  };
}

/**
 * Buat draf pesan dan tautan WhatsApp untuk menghubungi Wali Kelas / Sekolah.
 */
export function buatPesanWhatsAppWali({ siswa, namaKelas, ringkasan, namaSekolah, nomorHpWali }) {
  const nama = siswa?.nama_lengkap || 'Siswa';
  const nisn = siswa?.nisn || '-';
  const kelas = namaKelas || siswa?.kelas_id || '-';
  const persen = ringkasan?.persentase ?? 100;

  const pesan =
    `Assalamu'alaikum / Selamat pagi Bapak/Ibu Wali Kelas ${kelas} (${namaSekolah || 'Sekolah'}).\n\n` +
    `Saya orang tua/wali dari siswa:\n` +
    `- Nama: ${nama}\n` +
    `- NISN: ${nisn}\n` +
    `- Kelas: ${kelas}\n` +
    `- Rekap Kehadiran Saat Ini: ${persen}% (H: ${ringkasan?.hadir || 0}, S: ${ringkasan?.sakit || 0}, I: ${ringkasan?.izin || 0}, A: ${ringkasan?.alfa || 0})\n\n` +
    `Mohon informasi atau konfirmasi terkait kehadiran ananda. Terima kasih.`;

  let digits = String(nomorHpWali || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  }

  const encoded = encodeURIComponent(pesan);
  const url = digits ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/?text=${encoded}`;

  return { pesan, url, memilikiNomor: Boolean(digits) };
}

