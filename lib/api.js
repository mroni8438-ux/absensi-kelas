import { supabase, isSupabaseConfigured } from './supabase';
import { hitungJarakMeter, blobKeDataUrl } from './mediaHelper';

// ==============================================================================
// DATA MEMORI CONTOH (MOCK DEMO DATA) UNTUK PENGUJIAN LOKAL TANPA SUPABASE
// ==============================================================================
const SEED_DATA = {
  pengaturan: {
    nama_sekolah: 'SMP Negeri 1 Teladan',
    tahun_ajaran: '2026/2027',
    semester: 'Ganjil',
    toleransi_alfa_maks: '3',
    lokasi_sekolah_lat: '-6.200000',
    lokasi_sekolah_lng: '106.816666',
    radius_absen_meter: '150',
  },
  pengguna: [
    {
      id: 'USR-GURU-01',
      username: 'gurubudi',
      email: 'budi@sekolah.id',
      nama_lengkap: 'Budi Santoso, S.Pd.',
      nomor_hp: '081234560001',
      peran: 'Guru',
      status_aktif: 'Aktif',
      wajib_ganti_sandi: false,
    },
    {
      id: 'USR-ADMIN-01',
      username: 'adminsekolah',
      email: 'admin@sekolah.id',
      nama_lengkap: 'Dra. Hj. Siti Rahmawati',
      nomor_hp: '081234560000',
      peran: 'Admin',
      status_aktif: 'Aktif',
      wajib_ganti_sandi: false,
    },
    {
      id: 'USR-SISWA-01',
      username: '008123',
      email: 'ahmad.fauzi@siswa.id',
      nama_lengkap: 'Ahmad Fauzi',
      peran: 'Siswa',
      status_aktif: 'Aktif',
      wajib_ganti_sandi: false,
    },
    {
      id: 'USR-GURU-02',
      username: 'dewiastuti',
      email: 'dewi@sekolah.id',
      nama_lengkap: 'Dewi Astuti, M.Pd.',
      nomor_hp: '081234560002',
      peran: 'Guru',
      status_aktif: 'Aktif',
      wajib_ganti_sandi: false,
    }
  ],
  kelas: [
    { id: 'KLS-07A', nama_kelas: 'Kelas VII-A', tingkat: '7', wali_guru_id: 'USR-GURU-01', total_siswa: 32 },
    { id: 'KLS-07B', nama_kelas: 'Kelas VII-B', tingkat: '7', wali_guru_id: 'USR-GURU-02', total_siswa: 30 },
    { id: 'KLS-08A', nama_kelas: 'Kelas VIII-A', tingkat: '8', wali_guru_id: 'USR-GURU-01', total_siswa: 32 },
  ],
  siswa: [
    { id: 'SIS-001', pengguna_id: 'USR-SISWA-01', nisn: '008123', nama_lengkap: 'Ahmad Fauzi', kelas_id: 'KLS-07A', nomor_absen: 1, jenis_kelamin: 'L', nomor_hp_wali: '081234567890' },
    { id: 'SIS-002', pengguna_id: 'USR-SISWA-02', nisn: '008124', nama_lengkap: 'Annisa Putri Ramadhani', kelas_id: 'KLS-07A', nomor_absen: 2, jenis_kelamin: 'P', nomor_hp_wali: '081234567891' },
    { id: 'SIS-003', pengguna_id: 'USR-SISWA-03', nisn: '008125', nama_lengkap: 'Budi Kurniawan Pratama', kelas_id: 'KLS-07A', nomor_absen: 3, jenis_kelamin: 'L', nomor_hp_wali: '081234567892' },
    { id: 'SIS-004', pengguna_id: 'USR-SISWA-04', nisn: '008126', nama_lengkap: 'Cantika Dewi Maharani', kelas_id: 'KLS-07A', nomor_absen: 4, jenis_kelamin: 'P', nomor_hp_wali: '081234567893' },
    { id: 'SIS-005', pengguna_id: 'USR-SISWA-05', nisn: '008127', nama_lengkap: 'Dika Pratama Wicaksono', kelas_id: 'KLS-07A', nomor_absen: 5, jenis_kelamin: 'L', nomor_hp_wali: '081234567894' },
    { id: 'SIS-006', pengguna_id: 'USR-SISWA-06', nisn: '008128', nama_lengkap: 'Eka Nur Wahyuni', kelas_id: 'KLS-07A', nomor_absen: 6, jenis_kelamin: 'P', nomor_hp_wali: '081234567895' },
    { id: 'SIS-007', pengguna_id: 'USR-SISWA-07', nisn: '008129', nama_lengkap: 'Fajar Hidayatullah', kelas_id: 'KLS-07A', nomor_absen: 7, jenis_kelamin: 'L', nomor_hp_wali: '081234567896' },
    { id: 'SIS-008', pengguna_id: 'USR-SISWA-08', nisn: '008130', nama_lengkap: 'Gita Saraswati', kelas_id: 'KLS-07A', nomor_absen: 8, jenis_kelamin: 'P', nomor_hp_wali: '081234567897' },
    { id: 'SIS-009', pengguna_id: 'USR-SISWA-09', nisn: '008131', nama_lengkap: 'Hafiz Al-Farisi', kelas_id: 'KLS-07A', nomor_absen: 9, jenis_kelamin: 'L', nomor_hp_wali: '081234567898' },
    { id: 'SIS-010', pengguna_id: 'USR-SISWA-10', nisn: '008132', nama_lengkap: 'Intan Permata Sari', kelas_id: 'KLS-07A', nomor_absen: 10, jenis_kelamin: 'P', nomor_hp_wali: '081234567899' },
    { id: 'SIS-011', pengguna_id: 'USR-SISWA-11', nisn: '008133', nama_lengkap: 'Joko Susilo', kelas_id: 'KLS-07A', nomor_absen: 11, jenis_kelamin: 'L', nomor_hp_wali: '081234567800' },
    { id: 'SIS-012', pengguna_id: 'USR-SISWA-12', nisn: '008134', nama_lengkap: 'Kartika Chandra', kelas_id: 'KLS-07A', nomor_absen: 12, jenis_kelamin: 'P', nomor_hp_wali: '081234567801' },
    { id: 'SIS-013', pengguna_id: 'USR-SISWA-13', nisn: '008135', nama_lengkap: 'Lukman Hakim', kelas_id: 'KLS-07A', nomor_absen: 13, jenis_kelamin: 'L', nomor_hp_wali: '081234567802' },
    { id: 'SIS-014', pengguna_id: 'USR-SISWA-14', nisn: '008136', nama_lengkap: 'Mega Utami', kelas_id: 'KLS-07A', nomor_absen: 14, jenis_kelamin: 'P', nomor_hp_wali: '081234567803' },
    { id: 'SIS-015', pengguna_id: 'USR-SISWA-15', nisn: '008137', nama_lengkap: 'Naufal Rizky', kelas_id: 'KLS-07A', nomor_absen: 15, jenis_kelamin: 'L', nomor_hp_wali: '081234567804' },
    { id: 'SIS-016', pengguna_id: 'USR-SISWA-16', nisn: '008138', nama_lengkap: 'Olivia Zahra', kelas_id: 'KLS-07A', nomor_absen: 16, jenis_kelamin: 'P', nomor_hp_wali: '081234567805' },
    { id: 'SIS-017', pengguna_id: 'USR-SISWA-17', nisn: '008139', nama_lengkap: 'Panji Gumilang Putra', kelas_id: 'KLS-07A', nomor_absen: 17, jenis_kelamin: 'L', nomor_hp_wali: '081234567806' },
    { id: 'SIS-018', pengguna_id: 'USR-SISWA-18', nisn: '008140', nama_lengkap: 'Qanita Az-Zahra', kelas_id: 'KLS-07A', nomor_absen: 18, jenis_kelamin: 'P', nomor_hp_wali: '081234567807' },
    { id: 'SIS-019', pengguna_id: 'USR-SISWA-19', nisn: '008141', nama_lengkap: 'Raditya Dika Pratama', kelas_id: 'KLS-07A', nomor_absen: 19, jenis_kelamin: 'L', nomor_hp_wali: '081234567808' },
    { id: 'SIS-020', pengguna_id: 'USR-SISWA-20', nisn: '008142', nama_lengkap: 'Siti Nurhaliza', kelas_id: 'KLS-07A', nomor_absen: 20, jenis_kelamin: 'P', nomor_hp_wali: '081234567809' },
    { id: 'SIS-021', pengguna_id: 'USR-SISWA-21', nisn: '008143', nama_lengkap: 'Tegar Firmansyah', kelas_id: 'KLS-07A', nomor_absen: 21, jenis_kelamin: 'L', nomor_hp_wali: '081234567810' },
    { id: 'SIS-022', pengguna_id: 'USR-SISWA-22', nisn: '008144', nama_lengkap: 'Ulya Rahmawati', kelas_id: 'KLS-07A', nomor_absen: 22, jenis_kelamin: 'P', nomor_hp_wali: '081234567811' },
    { id: 'SIS-023', pengguna_id: 'USR-SISWA-23', nisn: '008145', nama_lengkap: 'Vino Bastian', kelas_id: 'KLS-07A', nomor_absen: 23, jenis_kelamin: 'L', nomor_hp_wali: '081234567812' },
    { id: 'SIS-024', pengguna_id: 'USR-SISWA-24', nisn: '008146', nama_lengkap: 'Winda Amalia', kelas_id: 'KLS-07A', nomor_absen: 24, jenis_kelamin: 'P', nomor_hp_wali: '081234567813' },
    { id: 'SIS-025', pengguna_id: 'USR-SISWA-25', nisn: '008147', nama_lengkap: 'Xavier Danendra', kelas_id: 'KLS-07A', nomor_absen: 25, jenis_kelamin: 'L', nomor_hp_wali: '081234567814' },
    { id: 'SIS-026', pengguna_id: 'USR-SISWA-26', nisn: '008148', nama_lengkap: 'Yasmin Salsabila', kelas_id: 'KLS-07A', nomor_absen: 26, jenis_kelamin: 'P', nomor_hp_wali: '081234567815' },
    { id: 'SIS-027', pengguna_id: 'USR-SISWA-27', nisn: '008149', nama_lengkap: 'Zaki Al-Ghifari', kelas_id: 'KLS-07A', nomor_absen: 27, jenis_kelamin: 'L', nomor_hp_wali: '081234567816' },
    { id: 'SIS-028', pengguna_id: 'USR-SISWA-28', nisn: '008150', nama_lengkap: 'Alya Sabrina', kelas_id: 'KLS-07A', nomor_absen: 28, jenis_kelamin: 'P', nomor_hp_wali: '081234567817' },
    { id: 'SIS-029', pengguna_id: 'USR-SISWA-29', nisn: '008151', nama_lengkap: 'Bayu Saputra', kelas_id: 'KLS-07A', nomor_absen: 29, jenis_kelamin: 'L', nomor_hp_wali: '081234567818' },
    { id: 'SIS-030', pengguna_id: 'USR-SISWA-30', nisn: '008152', nama_lengkap: 'Citra Kirana', kelas_id: 'KLS-07A', nomor_absen: 30, jenis_kelamin: 'P', nomor_hp_wali: '081234567819' },
    { id: 'SIS-031', pengguna_id: 'USR-SISWA-31', nisn: '008153', nama_lengkap: 'Danu Wijaya', kelas_id: 'KLS-07A', nomor_absen: 31, jenis_kelamin: 'L', nomor_hp_wali: '081234567820' },
    { id: 'SIS-032', pengguna_id: 'USR-SISWA-32', nisn: '008154', nama_lengkap: 'Elena Safitri', kelas_id: 'KLS-07A', nomor_absen: 32, jenis_kelamin: 'P', nomor_hp_wali: '081234567821' },
  ],
  pertemuan: [
    { id: 'PRT-20260914-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-09-14', judul_materi: 'Pertemuan 03: Struktur Teks Deskripsi', catatan: 'Diskusi kelompok' },
    { id: 'PRT-20260921-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-09-21', judul_materi: 'Pertemuan 04: Kaidah Kebahasaan', catatan: 'Penugasan individu' },
    { id: 'PRT-20261005-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-10-05', judul_materi: 'Pertemuan 05: Pengenalan Teks Fantasi', catatan: 'Kelas kondusif' },
    { id: 'PRT-20261014-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-10-14', judul_materi: 'Pertemuan 06: Evaluasi Tengah Semester', catatan: 'Ujian harian' },
    { id: 'PRT-20261022-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-10-22', judul_materi: 'Pertemuan 07: Unsur Intrinsik Cerita', catatan: 'Pembahasan soal' },
    { id: 'PRT-20261102-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-11-02', judul_materi: 'Pertemuan 08: Teks Narasi Bagian 1', catatan: 'Kelas kondusif' },
    { id: 'PRT-20261105-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-11-05', judul_materi: 'Pertemuan 09: Teks Narasi Bagian 2', catatan: 'Latihan menulis' },
    { id: 'PRT-20261109-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-11-09', judul_materi: 'Pertemuan 10: Teks Prosedur', catatan: 'Evaluasi mingguan' },
  ],
  absensi: [
    { id: 'ABS-000a', pertemuan_id: 'PRT-20260914-01', siswa_id: 'SIS-001', status: 'Hadir', catatan: '' },
    { id: 'ABS-000b', pertemuan_id: 'PRT-20260921-01', siswa_id: 'SIS-001', status: 'Hadir', catatan: '' },
    { id: 'ABS-000c', pertemuan_id: 'PRT-20261005-01', siswa_id: 'SIS-001', status: 'Izin', catatan: 'Mengikuti lomba pramuka tingkat kecamatan' },
    { id: 'ABS-000d', pertemuan_id: 'PRT-20261014-01', siswa_id: 'SIS-001', status: 'Hadir', catatan: '' },
    { id: 'ABS-000e', pertemuan_id: 'PRT-20261022-01', siswa_id: 'SIS-001', status: 'Sakit', catatan: 'Demam flu (surat keterangan orang tua)' },
    { id: 'ABS-001', pertemuan_id: 'PRT-20261102-01', siswa_id: 'SIS-001', status: 'Hadir', catatan: '' },
    { id: 'ABS-002', pertemuan_id: 'PRT-20261105-01', siswa_id: 'SIS-001', status: 'Hadir', catatan: '' },
    { id: 'ABS-003', pertemuan_id: 'PRT-20261109-01', siswa_id: 'SIS-001', status: 'Hadir', catatan: '' },
    { id: 'ABS-004', pertemuan_id: 'PRT-20261102-01', siswa_id: 'SIS-002', status: 'Hadir', catatan: '' },
    { id: 'ABS-005', pertemuan_id: 'PRT-20261105-01', siswa_id: 'SIS-002', status: 'Sakit', catatan: 'Demam flu' },
    { id: 'ABS-006', pertemuan_id: 'PRT-20261109-01', siswa_id: 'SIS-002', status: 'Hadir', catatan: '' },
    { id: 'ABS-007', pertemuan_id: 'PRT-20261102-01', siswa_id: 'SIS-004', status: 'Hadir', catatan: '' },
    { id: 'ABS-008', pertemuan_id: 'PRT-20261105-01', siswa_id: 'SIS-004', status: 'Izin', catatan: 'Acara keluarga' },
    { id: 'ABS-009', pertemuan_id: 'PRT-20261109-01', siswa_id: 'SIS-004', status: 'Hadir', catatan: '' },
  ],
  sesi_mandiri_kode: [
    {
      pertemuan_id: 'PRT-20261111-DEMO',
      kelas_id: 'KLS-07A',
      tanggal: '2026-11-11',
      judul_materi: 'Pertemuan 11: Menulis Teks Eksplanasi',
      kode_sesi: '482910',
      kode_berlaku_sampai: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      wajib_selfie: true,
      wajib_gps: false,
    },
  ],
  pengajuan_izin: [
    {
      id: 'IZN-20261022-01',
      siswa_id: 'SIS-001',
      kelas_id: 'KLS-07A',
      tanggal_mulai: '2026-10-22',
      tanggal_selesai: '2026-10-22',
      jenis: 'Sakit',
      alasan: 'Demam flu sejak semalam, istirahat di rumah.',
      bukti_path: null,
      status: 'Disetujui',
      catatan_guru: 'Semoga lekas sembuh.',
      dibuat: '2026-10-22T06:45:00Z',
    },
    {
      id: 'IZN-20261111-02',
      siswa_id: 'SIS-002',
      kelas_id: 'KLS-07A',
      tanggal_mulai: '2026-11-11',
      tanggal_selesai: '2026-11-12',
      jenis: 'Izin',
      alasan: 'Menghadiri acara pernikahan kakak kandung di luar kota.',
      bukti_path: null,
      status: 'Menunggu',
      catatan_guru: '',
      dibuat: '2026-11-11T06:30:00Z',
    },
  ],
};

function getMockState() {
  if (typeof window === 'undefined') return SEED_DATA;
  const saved = localStorage.getItem('absensi_kelas_mock_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...SEED_DATA,
        ...parsed,
        pengaturan: { ...SEED_DATA.pengaturan, ...(parsed.pengaturan || {}) },
        sesi_mandiri_kode: parsed.sesi_mandiri_kode || SEED_DATA.sesi_mandiri_kode,
        pengajuan_izin: parsed.pengajuan_izin || SEED_DATA.pengajuan_izin,
      };
    } catch (e) {}
  }
  localStorage.setItem('absensi_kelas_mock_state', JSON.stringify(SEED_DATA));
  return SEED_DATA;
}

function saveMockState(state) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('absensi_kelas_mock_state', JSON.stringify(state));
  }
}

function getActiveSession() {
  if (typeof window === 'undefined') return null;
  const ses = localStorage.getItem('absensi_kelas_active_user');
  if (ses) {
    try { return JSON.parse(ses); } catch (e) {}
  }
  return null;
}

function setActiveSession(user) {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('absensi_kelas_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('absensi_kelas_active_user');
    }
  }
}

// ==============================================================================
// CACHE MEMORI SESI (ATURAN KECEPATAN K1 & K5: PINDAH LAYAR = 0 PANGGILAN SERVER)
// ==============================================================================
const CACHE_TTL_MS = 5 * 60 * 1000;

const MEM_CACHE = {
  userId: null,
  dataAwal: null,
  dataAwalAt: 0,
  daftarPengguna: null,
  daftarPenggunaAt: 0,
  rekapByKey: {},
  riwayatBySiswa: {},
  inflightDataAwal: null,
  inflightPengguna: null,
  lastSessionCheckAt: 0,
};

function isCacheFresh(ts) {
  return Boolean(ts && (Date.now() - ts < CACHE_TTL_MS));
}

export function invalidateApiCache() {
  MEM_CACHE.userId = null;
  MEM_CACHE.dataAwal = null;
  MEM_CACHE.dataAwalAt = 0;
  MEM_CACHE.daftarPengguna = null;
  MEM_CACHE.daftarPenggunaAt = 0;
  MEM_CACHE.rekapByKey = {};
  MEM_CACHE.riwayatBySiswa = {};
  MEM_CACHE.inflightDataAwal = null;
  MEM_CACHE.inflightPengguna = null;
  MEM_CACHE.lastSessionCheckAt = 0;
}

export function shouldVerifySupabaseSession() {
  return Date.now() - MEM_CACHE.lastSessionCheckAt > 60 * 1000;
}

export function markSessionVerified() {
  MEM_CACHE.lastSessionCheckAt = Date.now();
}

export function getCachedDataAwal() {
  const activeUser = getActiveSession();
  if (!activeUser || MEM_CACHE.userId !== activeUser.id) return null;
  return isCacheFresh(MEM_CACHE.dataAwalAt) ? MEM_CACHE.dataAwal : null;
}

export function getCachedDaftarPengguna() {
  const activeUser = getActiveSession();
  if (!activeUser || MEM_CACHE.userId !== activeUser.id) return null;
  return isCacheFresh(MEM_CACHE.daftarPenggunaAt) ? MEM_CACHE.daftarPengguna : null;
}

export function getCachedRekapBulanan(kelasId, bulan = 11, tahun = 2026) {
  const key = `${kelasId}:${parseInt(bulan, 10) || 11}:${parseInt(tahun, 10) || 2026}`;
  const entry = MEM_CACHE.rekapByKey[key];
  return entry && isCacheFresh(entry.at) ? entry.data : null;
}

export function getCachedRiwayatSiswa(siswaId) {
  const entry = MEM_CACHE.riwayatBySiswa[siswaId];
  return entry && isCacheFresh(entry.at) ? entry.data : null;
}

function clearRekapCacheForClass(kelasId) {
  Object.keys(MEM_CACHE.rekapByKey).forEach((k) => {
    if (!kelasId || k.startsWith(`${kelasId}:`)) {
      delete MEM_CACHE.rekapByKey[k];
    }
  });
}

async function extractFunctionError(error, defaultMessage) {
  if (!error) return { ok: false, pesan: defaultMessage };
  try {
    if (error.context && typeof error.context.json === 'function') {
      const parsed = await error.context.json();
      if (parsed && parsed.pesan) {
        return {
          ok: false,
          pesan: parsed.pesan,
          terkunci: Boolean(parsed.terkunci)
        };
      }
    }
  } catch (e) {}
  return { ok: false, pesan: defaultMessage };
}

function formatErrorMessage(error, fallback) {
  const msg = (error?.message || '').toLowerCase();
  if (msg.includes('permission') || msg.includes('policy') || msg.includes('row-level security')) {
    return 'Kamu tidak punya akses untuk ini.';
  }
  if (msg.includes('fetch') || msg.includes('network')) {
    return 'Koneksi terputus, coba lagi.';
  }
  return error?.message || fallback;
}

// ==============================================================================
// IMPLEMENTASI KONTRAK FUNGSI API
// ==============================================================================

function appendKelasToCache(newClass) {
  if (!MEM_CACHE.dataAwal || !newClass) return;
  const list = [...MEM_CACHE.dataAwal.daftarKelas, newClass].sort((a, b) =>
    (a.nama_kelas || '').localeCompare(b.nama_kelas || '')
  );
  MEM_CACHE.dataAwal = { ...MEM_CACHE.dataAwal, daftarKelas: list };
  MEM_CACHE.dataAwalAt = Date.now();
}

function appendSiswaToCache(newStudent) {
  if (!MEM_CACHE.dataAwal || !newStudent) return;
  const siswaList = [...MEM_CACHE.dataAwal.daftarSiswa, newStudent].sort((a, b) =>
    (a.nomor_absen || 0) - (b.nomor_absen || 0)
  );
  const kelasList = MEM_CACHE.dataAwal.daftarKelas.map((k) =>
    k.id === newStudent.kelas_id ? { ...k, total_siswa: (k.total_siswa || 0) + 1 } : k
  );
  MEM_CACHE.dataAwal = { ...MEM_CACHE.dataAwal, daftarSiswa: siswaList, daftarKelas: kelasList };
  MEM_CACHE.dataAwalAt = Date.now();
}

/**
 * 1. Masuk / Login Multi-Peran (P4 Standar)
 */
export async function masuk(identitas, sandi) {
  const cleanId = (identitas || '').trim().toLowerCase();
  if (!cleanId || !sandi) {
    return { ok: false, pesan: 'Harap isi ID/username/email dan PIN/password.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('masuk', {
        body: { identitas: cleanId, sandi }
      });

      if (error) {
        return await extractFunctionError(error, 'ID/username/email atau PIN/password salah.');
      }

      if (!data?.ok) {
        return {
          ok: false,
          pesan: data?.pesan || 'ID/username/email atau PIN/password salah.',
          terkunci: Boolean(data?.terkunci)
        };
      }

      invalidateApiCache();
      if (data.sesi) {
        await supabase.auth.setSession({
          access_token: data.sesi.access_token,
          refresh_token: data.sesi.refresh_token
        });
      }
      setActiveSession(data.pengguna);
      markSessionVerified();

      // Mulai muat data awal di latar saat browser transisi halaman (K4)
      if (!data.pengguna?.wajib_ganti_sandi) {
        if (data.pengguna?.peran === 'Siswa') {
          ambilRiwayatSiswa(data.pengguna.username).catch(() => {});
        } else {
          getDataAwal({ prefetchedUser: data.pengguna }).catch(() => {});
        }
      }

      return { ok: true, pengguna: data.pengguna, sesi: data.sesi };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi server autentikasi. Periksa koneksi internet.' };
    }
  }

  // MODE CONTOH (MOCK MODE)
  const state = getMockState();
  const user = state.pengguna.find(p =>
    p.username.toLowerCase() === cleanId ||
    p.email.toLowerCase() === cleanId ||
    p.id.toLowerCase() === cleanId
  );

  if (!user || (sandi !== 'password123' && sandi !== '123456')) {
    return { ok: false, pesan: 'ID/username/email atau PIN/password salah.' };
  }
  if (user.status_aktif !== 'Aktif') {
    return { ok: false, pesan: 'Akun Anda berstatus nonaktif. Hubungi Admin Sekolah.' };
  }

  invalidateApiCache();
  setActiveSession(user);
  markSessionVerified();
  return { ok: true, pengguna: user, sesi: { access_token: 'mock-token-123' } };
}

/**
 * 2. Keluar Akun
 */
export async function keluar() {
  invalidateApiCache();
  setActiveSession(null);
  if (isSupabaseConfigured && supabase) {
    try { await supabase.auth.signOut(); } catch (e) {}
  }
  return { ok: true };
}

/**
 * 3. Ganti Sandi Pribadi (Wajib Ganti Sandi & Profil)
 */
export async function gantiSandi(sandiLama, sandiBaru) {
  if (!sandiBaru || sandiBaru.length < 8) {
    return { ok: false, pesan: 'Sandi baru minimal 8 karakter.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const activeUser = getActiveSession();
      // Jika dipanggil dari menu Profil (mengisi sandiLama), periksa ulang sandi lama
      if (sandiLama && activeUser?.email) {
        const { error: cekError } = await supabase.auth.signInWithPassword({
          email: activeUser.email,
          password: sandiLama
        });
        if (cekError) {
          return { ok: false, pesan: 'Sandi lama salah.' };
        }
      }

      const { error } = await supabase.auth.updateUser({ password: sandiBaru });
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal memperbarui sandi.') };

      // Nolkan wajib_ganti_sandi di tabel pengguna melalui fungsi SQL aman
      await supabase.rpc('selesai_ganti_sandi');

      if (activeUser) {
        const updatedUser = { ...activeUser, wajib_ganti_sandi: false };
        setActiveSession(updatedUser);
        if (MEM_CACHE.dataAwal?.pengguna) {
          MEM_CACHE.dataAwal = { ...MEM_CACHE.dataAwal, pengguna: updatedUser };
        }
        if (Array.isArray(MEM_CACHE.daftarPengguna)) {
          MEM_CACHE.daftarPengguna = MEM_CACHE.daftarPengguna.map((p) =>
            p.id === activeUser.id ? { ...p, wajib_ganti_sandi: false } : p
          );
        }
      }
      return { ok: true, pesan: 'Sandi berhasil diperbarui.' };
    } catch (err) {
      return { ok: false, pesan: 'Gagal memperbarui sandi.' };
    }
  }

  // Mode Contoh
  const user = getActiveSession();
  if (user) {
    const state = getMockState();
    const idx = state.pengguna.findIndex(p => p.id === user.id);
    if (idx !== -1) {
      state.pengguna[idx].wajib_ganti_sandi = false;
      saveMockState(state);
    }
    setActiveSession({ ...user, wajib_ganti_sandi: false });
  }
  return { ok: true, pesan: 'Sandi berhasil diperbarui (Mode Contoh).' };
}

/**
 * 4. Atur Ulang Sandi Staf (Hanya Admin)
 */
export async function aturUlangSandi(idPengguna) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('atur-sandi', {
        body: { idPengguna }
      });
      if (error) {
        return await extractFunctionError(error, 'Gagal mengatur ulang sandi pengguna.');
      }
      if (!data?.ok) {
        return { ok: false, pesan: data?.pesan || 'Gagal mengatur ulang sandi pengguna.' };
      }
      if (Array.isArray(MEM_CACHE.daftarPengguna)) {
        MEM_CACHE.daftarPengguna = MEM_CACHE.daftarPengguna.map((p) =>
          p.id === idPengguna ? { ...p, wajib_ganti_sandi: true } : p
        );
      }
      return { ok: true, sandiSementara: data.sandiSementara };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi Edge Function atur-sandi.' };
    }
  }

  // Mode Contoh
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789#@!';
  let tempPass = 'Sekolah#';
  for (let i = 0; i < 4; i++) {
    tempPass += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const state = getMockState();
  const idx = state.pengguna.findIndex(p => p.id === idPengguna);
  if (idx !== -1) {
    state.pengguna[idx].wajib_ganti_sandi = true;
    saveMockState(state);
  }
  if (Array.isArray(MEM_CACHE.daftarPengguna)) {
    MEM_CACHE.daftarPengguna = MEM_CACHE.daftarPengguna.map((p) =>
      p.id === idPengguna ? { ...p, wajib_ganti_sandi: true } : p
    );
  }
  return { ok: true, sandiSementara: tempPass };
}

/**
 * 5. Ambil Data Awal Pengguna Sesuai Peran (dengan Cache STATE K1 & Limit K2)
 */
export async function getDataAwal(options = {}) {
  const activeUser = getActiveSession() || options?.prefetchedUser;
  if (!activeUser) {
    return { ok: false, pesan: 'Sesi belum aktif.' };
  }

  const force = Boolean(options?.force);
  if (!force && MEM_CACHE.dataAwal && MEM_CACHE.userId === activeUser.id && isCacheFresh(MEM_CACHE.dataAwalAt)) {
    return { ok: true, data: MEM_CACHE.dataAwal, fromCache: true };
  }

  if (!force && MEM_CACHE.inflightDataAwal && MEM_CACHE.userId === activeUser.id) {
    return MEM_CACHE.inflightDataAwal;
  }

  MEM_CACHE.userId = activeUser.id;

  const task = (async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const profilPromise = options?.prefetchedUser
          ? Promise.resolve({ data: options.prefetchedUser })
          : supabase.from('pengguna').select('id, username, email, nama_lengkap, peran, status_aktif, wajib_ganti_sandi').eq('id', activeUser.id).single();

        const [profilRes, pengRes, kelasRes, siswaRes, pertemuanRes] = await Promise.all([
          profilPromise,
          supabase.from('pengaturan').select('kunci, nilai').limit(50),
          supabase.from('kelas').select('id, nama_kelas, tingkat, wali_guru_id, tahun_ajaran').order('nama_kelas', { ascending: true }).limit(100),
          supabase.from('siswa').select('id, pengguna_id, nisn, nama_lengkap, kelas_id, nomor_absen, jenis_kelamin, nomor_hp_wali, status_aktif').order('nomor_absen', { ascending: true }).limit(500),
          supabase.from('pertemuan').select('id, kelas_id, guru_id, tanggal, judul_materi, catatan').order('tanggal', { ascending: false }).limit(50)
        ]);

        const pengaturanObj = {
          nama_sekolah: 'SMP Negeri 1 Teladan',
          tahun_ajaran: '2026/2027',
          semester: 'Ganjil',
        };
        if (Array.isArray(pengRes.data)) {
          pengRes.data.forEach(row => {
            pengaturanObj[row.kunci] = row.nilai;
          });
        }

        const daftarSiswa = siswaRes.data || [];
        const daftarKelas = (kelasRes.data || []).map(k => ({
          ...k,
          total_siswa: daftarSiswa.filter(s => s.kelas_id === k.id).length
        }));

        const profilAktual = {
          ...(profilRes.data || activeUser),
          nomor_hp: profilRes.data?.nomor_hp ?? activeUser?.nomor_hp ?? '',
        };
        setActiveSession(profilAktual);

        const payload = {
          pengguna: profilAktual,
          pengaturan: pengaturanObj,
          daftarKelas,
          daftarSiswa,
          riwayatPertemuan: pertemuanRes.data || [],
        };
        MEM_CACHE.dataAwal = payload;
        MEM_CACHE.dataAwalAt = Date.now();

        return { ok: true, data: payload };
      } catch (err) {
        return { ok: false, pesan: formatErrorMessage(err, 'Gagal memuat data awal dari server.') };
      }
    }

    // Mode Contoh
    const state = getMockState();
    const payload = {
      pengguna: activeUser,
      pengaturan: state.pengaturan,
      daftarKelas: state.kelas,
      daftarSiswa: state.siswa,
      riwayatPertemuan: state.pertemuan,
    };
    MEM_CACHE.dataAwal = payload;
    MEM_CACHE.dataAwalAt = Date.now();
    return { ok: true, data: payload };
  })();

  MEM_CACHE.inflightDataAwal = task;
  try {
    return await task;
  } finally {
    if (MEM_CACHE.inflightDataAwal === task) {
      MEM_CACHE.inflightDataAwal = null;
    }
  }
}

/**
 * 6. Simpan Presensi Pertemuan Cepat (Batch Transaction)
 */
export async function simpanPresensiBatch({ kelas_id, tanggal, judul, catatan, items }) {
  if (!kelas_id || !tanggal || !items || !items.length) {
    return { ok: false, pesan: 'Data kelas, tanggal, dan presensi siswa wajib diisi.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('simpan_presensi_pertemuan', {
        p_kelas_id: kelas_id,
        p_tanggal: tanggal,
        p_judul: judul || '',
        p_catatan: catatan || '',
        p_items: items
      });
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal menyimpan transaksi presensi.') };
      if (data && data.ok === false) return { ok: false, pesan: data.pesan || 'Gagal menyimpan presensi.' };

      clearRekapCacheForClass(kelas_id);
      if (MEM_CACHE.dataAwal && data?.pertemuan_id) {
        MEM_CACHE.dataAwal = {
          ...MEM_CACHE.dataAwal,
          riwayatPertemuan: [
            { id: data.pertemuan_id, kelas_id, tanggal, judul_materi: judul || '', catatan: catatan || '' },
            ...(MEM_CACHE.dataAwal.riwayatPertemuan || [])
          ].slice(0, 50)
        };
      }
      return { ok: true, data, pesan: data?.pesan || 'Presensi pertemuan berhasil disimpan.' };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menyimpan transaksi presensi ke database.' };
    }
  }

  // Mode Contoh
  const state = getMockState();
  const pertemuanId = `PRT-${tanggal.replace(/-/g, '')}-${Math.floor(Math.random() * 8999 + 1000)}`;
  const user = getActiveSession() || { id: 'USR-GURU-01' };

  const newMeeting = {
    id: pertemuanId,
    kelas_id,
    guru_id: user.id,
    tanggal,
    judul_materi: judul || 'Pertemuan Baru',
    catatan: catatan || ''
  };
  state.pertemuan.unshift(newMeeting);

  items.forEach(item => {
    state.absensi.push({
      id: `ABS-${Math.floor(Math.random() * 89999 + 10000)}`,
      pertemuan_id: pertemuanId,
      siswa_id: item.siswa_id,
      status: item.status || 'Hadir',
      catatan: item.catatan || ''
    });
  });

  saveMockState(state);
  clearRekapCacheForClass(kelas_id);
  if (MEM_CACHE.dataAwal) {
    MEM_CACHE.dataAwal = {
      ...MEM_CACHE.dataAwal,
      riwayatPertemuan: [newMeeting, ...(MEM_CACHE.dataAwal.riwayatPertemuan || [])]
    };
  }
  return { ok: true, pertemuan_id: pertemuanId, pesan: 'Presensi pertemuan berhasil disimpan (Mode Contoh).' };
}

/**
 * 7. Ambil Rekapitulasi Kehadiran Bulanan Kelas (Cache per kelas+bulan+tahun)
 */
export async function ambilRekapBulanan(kelasId, bulan = 11, tahun = 2026, options = {}) {
  const b = parseInt(bulan, 10) || 11;
  const t = parseInt(tahun, 10) || 2026;
  const cacheKey = `${kelasId}:${b}:${t}`;
  const force = Boolean(options?.force);

  if (!force) {
    const cached = getCachedRekapBulanan(kelasId, b, t);
    if (cached) return { ok: true, data: cached, fromCache: true };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('ambil_rekap_bulanan', {
        p_kelas_id: kelasId,
        p_bulan: b,
        p_tahun: t
      });
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal mengambil rekap bulanan.') };
      const rows = data || [];
      MEM_CACHE.rekapByKey[cacheKey] = { data: rows, at: Date.now() };
      return { ok: true, data: rows };
    } catch (err) {
      return { ok: false, pesan: 'Koneksi terputus, gagal menghitung rekap bulanan.' };
    }
  }

  // Mode Contoh Kalkulasi Otomatis
  const state = getMockState();
  const filteredStudents = state.siswa.filter(s => s.kelas_id === kelasId);
  const classMeetings = state.pertemuan.filter(p => p.kelas_id === kelasId);
  const totalMeetings = Math.max(classMeetings.length, 1);

  const rekapData = filteredStudents.map((s, idx) => {
    const attendances = state.absensi.filter(a => a.siswa_id === s.id);
    let hadir = attendances.filter(a => a.status === 'Hadir').length;
    let sakit = attendances.filter(a => a.status === 'Sakit').length;
    let izin = attendances.filter(a => a.status === 'Izin').length;
    let alfa = attendances.filter(a => a.status === 'Alfa').length;

    if (attendances.length === 0) hadir = totalMeetings;

    const totalRecorded = hadir + sakit + izin + alfa;
    const effMeetings = Math.max(totalRecorded, totalMeetings);
    const persentase = Number(((hadir / effMeetings) * 100).toFixed(1));

    return {
      siswa_id: s.id,
      nisn: s.nisn,
      nama_lengkap: s.nama_lengkap,
      nomor_absen: s.nomor_absen || idx + 1,
      hadir,
      sakit,
      izin,
      alfa,
      total_pertemuan: effMeetings,
      persentase,
    };
  });

  MEM_CACHE.rekapByKey[cacheKey] = { data: rekapData, at: Date.now() };
  return { ok: true, data: rekapData };
}

/**
 * Hitung ringkasan H/S/I/A & persentase dari daftar riwayat presensi
 */
export function hitungRingkasanKehadiran(daftarRiwayat = [], totalPertemuanOverride = null) {
  const rows = Array.isArray(daftarRiwayat) ? daftarRiwayat : [];
  const hadir = rows.filter(r => r.status === 'Hadir').length;
  const sakit = rows.filter(r => r.status === 'Sakit').length;
  const izin = rows.filter(r => r.status === 'Izin').length;
  const alfa = rows.filter(r => r.status === 'Alfa').length;
  const totalPertemuan = totalPertemuanOverride !== null
    ? Math.max(totalPertemuanOverride, rows.length)
    : rows.length;
  const persentase = totalPertemuan > 0 ? Number(((hadir / totalPertemuan) * 100).toFixed(1)) : 100.0;
  return {
    total_pertemuan: totalPertemuan,
    hadir,
    sakit,
    izin,
    alfa,
    persentase,
  };
}

/**
 * 8. Ambil Riwayat & Ringkasan Kehadiran Siswa Pribadi (Cache per siswa)
 */
export async function ambilRiwayatSiswa(siswaId, options = {}) {
  const activeUser = getActiveSession();
  const targetKey = `${activeUser?.id || 'anon'}:${siswaId || 'default'}`;
  const force = Boolean(options?.force);
  if (!force) {
    const cached = getCachedRiwayatSiswa(targetKey) || getCachedRiwayatSiswa(siswaId);
    if (cached) return { ok: true, data: cached, fromCache: true };
  }

  const defaultPengaturan = {
    nama_sekolah: 'SMP Negeri 1 Teladan',
    tahun_ajaran: '2026/2027',
    semester: 'Ganjil',
    toleransi_alfa_maks: '3',
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const safeId = (siswaId || '').trim();
      let student = null;
      let isPreview = false;

      if (safeId) {
        const { data: siswaList, error: siswaErr } = await supabase
          .from('siswa')
          .select('id, pengguna_id, nisn, nama_lengkap, kelas_id, nomor_absen, jenis_kelamin, status_aktif')
          .or(`pengguna_id.eq.${safeId},id.eq.${safeId},nisn.eq.${safeId}`)
          .limit(1);

        if (siswaErr) return { ok: false, pesan: formatErrorMessage(siswaErr, 'Gagal mengambil profil siswa.') };
        student = siswaList?.[0] || null;
      }

      let daftarSiswaPratinjau = [];
      if (activeUser?.peran && activeUser.peran !== 'Siswa') {
        const { data: previewList } = await supabase
          .from('siswa')
          .select('id, pengguna_id, nisn, nama_lengkap, kelas_id, nomor_absen, jenis_kelamin, status_aktif')
          .eq('status_aktif', 'Aktif')
          .order('nomor_absen', { ascending: true })
          .limit(50);
        daftarSiswaPratinjau = previewList || [];
        if (!student && daftarSiswaPratinjau.length > 0) {
          student = daftarSiswaPratinjau[0];
          isPreview = true;
        } else if (student && student.pengguna_id !== activeUser.id) {
          isPreview = true;
        }
      }

      if (!student) {
        const emptyData = {
          siswa: { nama_lengkap: 'Data Siswa Belum Tertaut', nisn: '-', kelas_id: '-', nomor_absen: '-' },
          kelas: null,
          pengaturan: defaultPengaturan,
          wali_kelas: null,
          isPreview: false,
          daftarSiswaPratinjau,
          ringkasan: { total_pertemuan: 0, hadir: 0, sakit: 0, izin: 0, alfa: 0, persentase: 100 },
          riwayat: []
        };
        MEM_CACHE.riwayatBySiswa[targetKey] = { data: emptyData, at: Date.now() };
        return { ok: true, data: emptyData };
      }

      const [kelasRes, pengRes, absenResInit, totalSesiRes, waliRpcRes] = await Promise.all([
        supabase
          .from('kelas')
          .select('id, nama_kelas, tingkat, wali_guru_id, tahun_ajaran')
          .eq('id', student.kelas_id)
          .maybeSingle(),
        supabase
          .from('pengaturan')
          .select('kunci, nilai')
          .limit(50),
        supabase
          .from('absensi')
          .select('id, pertemuan_id, status, catatan, metode, foto_selfie_path, jarak_meter, waktu_check_in, dibuat, pertemuan:pertemuan_id (id, tanggal, judul_materi, catatan)')
          .eq('siswa_id', student.id)
          .order('dibuat', { ascending: false })
          .limit(300),
        supabase
          .from('pertemuan')
          .select('id', { count: 'exact', head: true })
          .eq('kelas_id', student.kelas_id),
        supabase.rpc('info_wali_kelas', { p_kelas_id: student.kelas_id })
      ]);

      let absenRes = absenResInit;
      // Fallback bila database belum menjalankan migrasi kolom Tahap 2
      if (absenRes.error && String(absenRes.error.message || '').toLowerCase().includes('column')) {
        absenRes = await supabase
          .from('absensi')
          .select('id, pertemuan_id, status, catatan, dibuat, pertemuan:pertemuan_id (id, tanggal, judul_materi, catatan)')
          .eq('siswa_id', student.id)
          .order('dibuat', { ascending: false })
          .limit(300);
      }

      const pengaturanObj = {
        ...defaultPengaturan,
        lokasi_sekolah_lat: '-6.200000',
        lokasi_sekolah_lng: '106.816666',
        radius_absen_meter: '150',
      };
      if (Array.isArray(pengRes.data)) {
        pengRes.data.forEach(row => {
          pengaturanObj[row.kunci] = row.nilai;
        });
      }

      const kelasObj = kelasRes.data || null;
      let waliKelas = (!waliRpcRes.error && waliRpcRes.data) ? waliRpcRes.data : null;
      if (!waliKelas && kelasObj?.wali_guru_id && activeUser?.peran === 'Admin') {
        const { data: waliData } = await supabase
          .from('pengguna')
          .select('id, nama_lengkap, email')
          .eq('id', kelasObj.wali_guru_id)
          .maybeSingle();
        if (waliData) waliKelas = waliData;
      }

      const rows = absenRes.data || [];
      const riwayat = rows
        .map(r => ({
          id: r.id,
          pertemuan_id: r.pertemuan_id || r.pertemuan?.id || null,
          tanggal: r.pertemuan?.tanggal || '-',
          judul_materi: r.pertemuan?.judul_materi || 'Pertemuan Kelas',
          catatan_pertemuan: r.pertemuan?.catatan || '',
          status: r.status,
          catatan: r.catatan || '-',
          metode: r.metode || 'Guru',
          foto_selfie_path: r.foto_selfie_path || null,
          jarak_meter: r.jarak_meter ?? null,
          waktu_check_in: r.waktu_check_in || null,
        }))
        .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

      const ringkasan = hitungRingkasanKehadiran(riwayat, totalSesiRes.count || 0);

      const payload = {
        siswa: student,
        kelas: kelasObj,
        pengaturan: pengaturanObj,
        wali_kelas: waliKelas,
        isPreview,
        daftarSiswaPratinjau,
        ringkasan,
        riwayat
      };
      MEM_CACHE.riwayatBySiswa[targetKey] = { data: payload, at: Date.now() };
      return { ok: true, data: payload };
    } catch (err) {
      return { ok: false, pesan: formatErrorMessage(err, 'Gagal memuat riwayat siswa.') };
    }
  }

  // Mode Contoh
  const state = getMockState();
  const isStaff = Boolean(activeUser?.peran && activeUser.peran !== 'Siswa');
  let student = state.siswa.find(s => s.id === siswaId || s.pengguna_id === siswaId || s.nisn === siswaId);
  let isPreview = false;
  if (!student) {
    student = state.siswa[0];
    isPreview = isStaff;
  } else if (isStaff && student.pengguna_id !== activeUser.id) {
    isPreview = true;
  }

  const kelasObj = state.kelas.find(k => k.id === student.kelas_id) || null;
  const waliGuru = kelasObj?.wali_guru_id
    ? state.pengguna.find(p => p.id === kelasObj.wali_guru_id) || null
    : null;

  const studentAttendances = state.absensi.filter(a => a.siswa_id === student.id);
  const classMeetings = state.pertemuan.filter(p => p.kelas_id === student.kelas_id);

  const riwayat = studentAttendances
    .map(a => {
      const meeting = classMeetings.find(m => m.id === a.pertemuan_id) || {};
      return {
        id: a.id,
        pertemuan_id: a.pertemuan_id,
        tanggal: meeting.tanggal || '2026-11-05',
        judul_materi: meeting.judul_materi || 'Pertemuan Kelas',
        catatan_pertemuan: meeting.catatan || '',
        status: a.status,
        catatan: a.catatan || '-',
        metode: a.metode || 'Guru',
        foto_selfie_path: a.foto_selfie_path || null,
        jarak_meter: a.jarak_meter ?? null,
        waktu_check_in: a.waktu_check_in || null,
      };
    })
    .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));

  const ringkasan = hitungRingkasanKehadiran(riwayat, riwayat.length);

  const payload = {
    siswa: student,
    kelas: kelasObj ? { ...kelasObj, tahun_ajaran: state.pengaturan?.tahun_ajaran || '2026/2027' } : null,
    pengaturan: { ...defaultPengaturan, ...(state.pengaturan || {}) },
    wali_kelas: waliGuru
      ? { id: waliGuru.id, nama_lengkap: waliGuru.nama_lengkap, email: waliGuru.email, nomor_hp: waliGuru.nomor_hp || '' }
      : null,
    isPreview,
    daftarSiswaPratinjau: isStaff ? state.siswa.slice(0, 20) : [],
    ringkasan,
    riwayat
  };
  MEM_CACHE.riwayatBySiswa[targetKey] = { data: payload, at: Date.now() };
  return { ok: true, data: payload };
}

/**
 * 9. Kelola Kelas (Admin — K5 Update Cache In-Place)
 */
export async function kelolaKelas(aksi, payload) {
  if (isSupabaseConfigured && supabase) {
    try {
      if (aksi === 'tambah') {
        const baru = {
          id: `KLS-${Date.now().toString().slice(-4)}`,
          nama_kelas: payload.nama_kelas,
          tingkat: payload.tingkat || '7',
          wali_guru_id: payload.wali_guru_id || null,
          tahun_ajaran: payload.tahun_ajaran || '2026/2027'
        };
        const { data, error } = await supabase.from('kelas').insert(baru).select().single();
        if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal menyimpan kelas.') };
        const resultClass = { ...data, total_siswa: 0 };
        appendKelasToCache(resultClass);
        return { ok: true, data: resultClass };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi server untuk menyimpan kelas.' };
    }
  }

  // Mode Contoh
  const state = getMockState();
  if (aksi === 'tambah') {
    const newClass = {
      id: `KLS-${Math.floor(Math.random() * 899 + 100)}`,
      nama_kelas: payload.nama_kelas,
      tingkat: payload.tingkat || '7',
      wali_guru_id: payload.wali_guru_id || 'USR-GURU-01',
      total_siswa: 0
    };
    state.kelas.push(newClass);
    saveMockState(state);
    appendKelasToCache(newClass);
    return { ok: true, data: newClass };
  }
  return { ok: true };
}

/**
 * 10. Kelola Siswa (Admin — K5 Update Cache In-Place)
 */
export async function kelolaSiswa(aksi, payload) {
  if (isSupabaseConfigured && supabase) {
    try {
      if (aksi === 'tambah') {
        const baru = {
          id: `SIS-${Date.now().toString().slice(-5)}`,
          nisn: payload.nisn,
          nama_lengkap: payload.nama_lengkap,
          kelas_id: payload.kelas_id,
          nomor_absen: parseInt(payload.nomor_absen, 10) || 1,
          jenis_kelamin: payload.jenis_kelamin || 'L',
          nomor_hp_wali: payload.nomor_hp_wali || '',
          status_aktif: 'Aktif'
        };
        const { data, error } = await supabase.from('siswa').insert(baru).select().single();
        if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal mendaftarkan siswa.') };
        appendSiswaToCache(data);
        clearRekapCacheForClass(data.kelas_id);
        return { ok: true, data };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi server untuk mendaftarkan siswa.' };
    }
  }

  // Mode Contoh
  const state = getMockState();
  if (aksi === 'tambah') {
    const newStudent = {
      id: `SIS-${Math.floor(Math.random() * 899 + 100)}`,
      nisn: payload.nisn,
      nama_lengkap: payload.nama_lengkap,
      kelas_id: payload.kelas_id,
      nomor_absen: parseInt(payload.nomor_absen, 10) || state.siswa.length + 1,
      jenis_kelamin: payload.jenis_kelamin || 'L',
      nomor_hp_wali: payload.nomor_hp_wali || '',
      status_aktif: 'Aktif'
    };
    state.siswa.push(newStudent);
    saveMockState(state);
    appendSiswaToCache(newStudent);
    clearRekapCacheForClass(newStudent.kelas_id);
    return { ok: true, data: newStudent };
  }
  return { ok: true };
}

/**
 * 11. Ambil Daftar Akun Pengguna (Admin — K1 Cache STATE)
 */
export async function ambilDaftarPengguna(options = {}) {
  const activeUser = getActiveSession();
  const force = Boolean(options?.force);

  if (!force && activeUser && MEM_CACHE.userId === activeUser.id && MEM_CACHE.daftarPengguna && isCacheFresh(MEM_CACHE.daftarPenggunaAt)) {
    return { ok: true, data: MEM_CACHE.daftarPengguna, fromCache: true };
  }

  if (!force && MEM_CACHE.inflightPengguna && activeUser && MEM_CACHE.userId === activeUser.id) {
    return MEM_CACHE.inflightPengguna;
  }

  if (activeUser) MEM_CACHE.userId = activeUser.id;

  const task = (async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('pengguna')
          .select('id, username, email, nama_lengkap, peran, status_aktif, wajib_ganti_sandi')
          .order('nama_lengkap', { ascending: true })
          .limit(200);
        if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal mengambil daftar pengguna.') };
        const rows = data || [];
        MEM_CACHE.daftarPengguna = rows;
        MEM_CACHE.daftarPenggunaAt = Date.now();
        return { ok: true, data: rows };
      } catch (err) {
        return { ok: false, pesan: 'Gagal menghubungi server untuk daftar pengguna.' };
      }
    }

    const state = getMockState();
    MEM_CACHE.daftarPengguna = state.pengguna;
    MEM_CACHE.daftarPenggunaAt = Date.now();
    return { ok: true, data: state.pengguna };
  })();

  MEM_CACHE.inflightPengguna = task;
  try {
    return await task;
  } finally {
    if (MEM_CACHE.inflightPengguna === task) {
      MEM_CACHE.inflightPengguna = null;
    }
  }
}

// ==============================================================================
// FUNGSI TAHAP 2: IZIN ONLINE, ABSEN MANDIRI (QR/SELFIE/GPS) & STORAGE
// ==============================================================================

/**
 * 12. Unggah Berkas Privat Siswa (Foto Surat Izin / Foto Selfie) ke Supabase Storage
 */
export async function unggahBerkasSiswa(bucket, siswaId, blob, ext = 'jpg', contentType = 'image/jpeg') {
  if (!blob || !siswaId) {
    return { ok: false, pesan: 'Berkas atau identitas siswa tidak lengkap.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const filePath = `${siswaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, { contentType, upsert: false });

      if (error) {
        return { ok: false, pesan: formatErrorMessage(error, 'Gagal mengunggah berkas ke Storage.') };
      }
      return { ok: true, path: filePath };
    } catch (err) {
      return { ok: false, pesan: 'Koneksi terputus saat mengunggah berkas.' };
    }
  }

  // Mode Contoh: simpan ringkas sebagai Data URL lokal
  try {
    const dataUrl = await blobKeDataUrl(blob);
    return { ok: true, path: dataUrl };
  } catch (err) {
    return { ok: false, pesan: 'Gagal memproses berkas di browser.' };
  }
}

/**
 * 13. Buat Signed URL Privat (1 jam) untuk melihat Foto Selfie atau Bukti Surat
 */
export async function buatTautanBerkas(bucket, path) {
  if (!path) return { ok: false, pesan: 'Berkas tidak tersedia.' };
  if (path.startsWith('data:')) return { ok: true, url: path };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      if (error || !data?.signedUrl) {
        return { ok: false, pesan: formatErrorMessage(error, 'Gagal membuka tautan berkas.') };
      }
      return { ok: true, url: data.signedUrl };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi layanan Storage.' };
    }
  }

  return { ok: false, pesan: 'Berkas tidak ditemukan.' };
}

/**
 * 14. Ambil Sesi Absen Mandiri yang Sedang Aktif untuk Siswa
 */
export async function ambilSesiAktifSiswa(siswaIdHint) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('sesi_absen_aktif_siswa');
      if (error) {
        // Bila SQL Tahap 2 belum dijalankan di Supabase, kembalikan array kosong agar halaman tetap jalan
        return { ok: true, data: [], belumMigrasi: true };
      }
      return { ok: true, data: data || [] };
    } catch (err) {
      return { ok: true, data: [] };
    }
  }

  // Mode Contoh
  const state = getMockState();
  const activeUser = getActiveSession();
  const student =
    state.siswa.find(s => s.id === siswaIdHint || s.pengguna_id === siswaIdHint || s.nisn === siswaIdHint || s.pengguna_id === activeUser?.id) ||
    state.siswa[0];

  const nowMs = Date.now();
  const list = (state.sesi_mandiri_kode || [])
    .filter(s => s.kelas_id === student.kelas_id && (!s.kode_berlaku_sampai || new Date(s.kode_berlaku_sampai).getTime() >= nowMs))
    .map(s => {
      const absen = state.absensi.find(a => a.pertemuan_id === s.pertemuan_id && a.siswa_id === student.id);
      return {
        pertemuan_id: s.pertemuan_id,
        kelas_id: s.kelas_id,
        tanggal: s.tanggal,
        judul_materi: s.judul_materi,
        kode_berlaku_sampai: s.kode_berlaku_sampai,
        wajib_selfie: Boolean(s.wajib_selfie),
        wajib_gps: Boolean(s.wajib_gps),
        sudah_absen: Boolean(absen),
        status_absen: absen?.status || null,
        waktu_check_in: absen?.waktu_check_in || null,
        kode_demo: s.kode_sesi,
      };
    });

  return { ok: true, data: list };
}

/**
 * 15. Kirim Absen Mandiri Siswa (Kode Sesi/QR + Opsional Selfie & GPS)
 */
export async function kirimAbsenMandiri({ siswa_id, kode_sesi, latitude, longitude, selfie_blob }) {
  const kodeBersih = (kode_sesi || '').trim().toUpperCase();
  if (!kodeBersih) {
    return { ok: false, pesan: 'Harap masukkan kode sesi dari guru terlebih dahulu.' };
  }

  let fotoPath = null;
  if (selfie_blob && siswa_id) {
    const up = await unggahBerkasSiswa('foto-presensi', siswa_id, selfie_blob, 'jpg', 'image/jpeg');
    if (!up.ok) return up;
    fotoPath = up.path;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('absen_mandiri_siswa', {
        p_kode_sesi: kodeBersih,
        p_latitude: latitude ?? null,
        p_longitude: longitude ?? null,
        p_foto_selfie_path: fotoPath,
      });

      if (error) {
        return { ok: false, pesan: formatErrorMessage(error, 'Gagal mengirim presensi mandiri.') };
      }
      if (!data?.ok) {
        return {
          ok: false,
          pesan: data?.pesan || 'Presensi mandiri ditolak server.',
          jarak_meter: data?.jarak_meter ?? null,
        };
      }

      MEM_CACHE.riwayatBySiswa = {};
      return { ok: true, data, pesan: data.pesan || 'Presensi mandiri berhasil dicatat!' };
    } catch (err) {
      return { ok: false, pesan: 'Koneksi terputus saat mengirim presensi mandiri.' };
    }
  }

  // Mode Contoh
  const state = getMockState();
  const student = state.siswa.find(s => s.id === siswa_id) || state.siswa[0];
  const sesi = (state.sesi_mandiri_kode || []).find(
    s => s.kelas_id === student.kelas_id && s.kode_sesi.toUpperCase() === kodeBersih
  );
  if (!sesi) {
    return { ok: false, pesan: 'Kode sesi tidak cocok atau tidak ditemukan untuk kelas Anda.' };
  }
  if (sesi.kode_berlaku_sampai && new Date(sesi.kode_berlaku_sampai).getTime() < Date.now()) {
    return { ok: false, pesan: 'Batas waktu kode sesi ini sudah berakhir.' };
  }
  if (sesi.wajib_selfie && !fotoPath) {
    return { ok: false, pesan: 'Sesi ini mewajibkan foto selfie sebagai bukti kehadiran.' };
  }

  let jarakMeter = null;
  if (sesi.wajib_gps) {
    if (latitude == null || longitude == null) {
      return { ok: false, pesan: 'Sesi ini mewajibkan koordinat lokasi GPS aktif.' };
    }
    const latSek = Number(state.pengaturan?.lokasi_sekolah_lat || -6.2);
    const lngSek = Number(state.pengaturan?.lokasi_sekolah_lng || 106.816666);
    const maksRadius = Number(state.pengaturan?.radius_absen_meter || 150);
    jarakMeter = hitungJarakMeter(latitude, longitude, latSek, lngSek);
    if (jarakMeter > maksRadius) {
      return {
        ok: false,
        jarak_meter: jarakMeter,
        pesan: `Lokasi Anda berjarak ${jarakMeter} m dari sekolah (batas maksimal ${maksRadius} m).`,
      };
    }
  }

  const existingPrt = state.pertemuan.find(p => p.id === sesi.pertemuan_id);
  if (!existingPrt) {
    state.pertemuan.unshift({
      id: sesi.pertemuan_id,
      kelas_id: sesi.kelas_id,
      guru_id: 'USR-GURU-01',
      tanggal: sesi.tanggal,
      judul_materi: sesi.judul_materi,
      catatan: 'Sesi presensi mandiri',
      mode_mandiri: true,
    });
  }

  const already = state.absensi.find(a => a.pertemuan_id === sesi.pertemuan_id && a.siswa_id === student.id);
  if (already && already.status === 'Hadir') {
    return { ok: false, pesan: 'Anda sudah tercatat Hadir pada sesi pertemuan ini.' };
  }

  const nowIso = new Date().toISOString();
  const entry = {
    id: already?.id || `ABS-${Math.floor(Math.random() * 89999 + 10000)}`,
    pertemuan_id: sesi.pertemuan_id,
    siswa_id: student.id,
    status: 'Hadir',
    catatan: jarakMeter !== null ? `Check-in mandiri (${jarakMeter} m)` : 'Check-in mandiri',
    metode: 'Mandiri',
    foto_selfie_path: fotoPath,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    jarak_meter: jarakMeter,
    waktu_check_in: nowIso,
  };

  if (already) {
    state.absensi = state.absensi.map(a => (a.id === already.id ? entry : a));
  } else {
    state.absensi.unshift(entry);
  }
  saveMockState(state);
  MEM_CACHE.riwayatBySiswa = {};
  clearRekapCacheForClass(student.kelas_id);

  return {
    ok: true,
    data: { pertemuan_id: sesi.pertemuan_id, judul_materi: sesi.judul_materi, jarak_meter: jarakMeter, waktu_check_in: nowIso },
    pesan: 'Presensi mandiri berhasil dicatat (Mode Contoh)!',
  };
}

/**
 * 16. Ambil Riwayat Pengajuan Izin / Sakit Siswa
 */
export async function ambilPengajuanIzinSiswa(siswaId) {
  if (!siswaId) return { ok: true, data: [] };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .select('id, siswa_id, kelas_id, tanggal_mulai, tanggal_selesai, jenis, alasan, bukti_path, status, catatan_guru, diproses_pada, dibuat')
        .eq('siswa_id', siswaId)
        .order('dibuat', { ascending: false })
        .limit(50);

      if (error) return { ok: true, data: [], belumMigrasi: true };
      return { ok: true, data: data || [] };
    } catch (err) {
      return { ok: true, data: [] };
    }
  }

  const state = getMockState();
  const list = (state.pengajuan_izin || [])
    .filter(p => p.siswa_id === siswaId)
    .sort((a, b) => (b.dibuat || '').localeCompare(a.dibuat || ''));
  return { ok: true, data: list };
}

/**
 * 17. Kirim Pengajuan Izin / Sakit Online dari Siswa (+ Opsional Foto Surat)
 */
export async function ajukanIzinSiswa({ siswa_id, kelas_id, tanggal_mulai, tanggal_selesai, jenis, alasan, file_bukti_info }) {
  if (!siswa_id || !kelas_id || !tanggal_mulai || !jenis || !(alasan || '').trim()) {
    return { ok: false, pesan: 'Harap lengkapi jenis, tanggal, dan alasan izin/sakit.' };
  }
  const tglSelesai = tanggal_selesai || tanggal_mulai;
  if (tglSelesai < tanggal_mulai) {
    return { ok: false, pesan: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' };
  }

  let buktiPath = null;
  if (file_bukti_info?.blob) {
    const up = await unggahBerkasSiswa(
      'bukti-izin',
      siswa_id,
      file_bukti_info.blob,
      file_bukti_info.ext || 'jpg',
      file_bukti_info.contentType || 'image/jpeg'
    );
    if (!up.ok) return up;
    buktiPath = up.path;
  }

  const idBaru = `IZN-${Date.now().toString().slice(-7)}-${Math.floor(Math.random() * 89 + 10)}`;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('pengajuan_izin')
        .insert({
          id: idBaru,
          siswa_id,
          kelas_id,
          tanggal_mulai,
          tanggal_selesai: tglSelesai,
          jenis,
          alasan: alasan.trim(),
          bukti_path: buktiPath,
          status: 'Menunggu',
        })
        .select()
        .single();

      if (error) {
        return { ok: false, pesan: formatErrorMessage(error, 'Gagal mengirim pengajuan izin.') };
      }
      return { ok: true, data, pesan: 'Pengajuan izin/sakit berhasil dikirim ke wali kelas.' };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi server untuk mengirim pengajuan izin.' };
    }
  }

  const state = getMockState();
  const baru = {
    id: idBaru,
    siswa_id,
    kelas_id,
    tanggal_mulai,
    tanggal_selesai: tglSelesai,
    jenis,
    alasan: alasan.trim(),
    bukti_path: buktiPath,
    status: 'Menunggu',
    catatan_guru: '',
    dibuat: new Date().toISOString(),
  };
  state.pengajuan_izin = [baru, ...(state.pengajuan_izin || [])];
  saveMockState(state);
  return { ok: true, data: baru, pesan: 'Pengajuan izin/sakit berhasil dikirim (Mode Contoh).' };
}

/**
 * 18. Batalkan Pengajuan Izin yang Masih Menunggu (Siswa)
 */
export async function batalkanPengajuanIzin(izinId) {
  if (!izinId) return { ok: false, pesan: 'ID pengajuan tidak ditemukan.' };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('pengajuan_izin').delete().eq('id', izinId);
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal membatalkan pengajuan.') };
      return { ok: true };
    } catch (err) {
      return { ok: false, pesan: 'Koneksi terputus saat membatalkan pengajuan.' };
    }
  }

  const state = getMockState();
  state.pengajuan_izin = (state.pengajuan_izin || []).filter(p => !(p.id === izinId && p.status === 'Menunggu'));
  saveMockState(state);
  return { ok: true };
}

/**
 * 19. Ambil Daftar Pengajuan Izin Siswa untuk Dasbor Guru / Admin
 */
export async function ambilPengajuanIzinKelas(kelasId = null) {
  if (isSupabaseConfigured && supabase) {
    try {
      let q = supabase
        .from('pengajuan_izin')
        .select('id, siswa_id, kelas_id, tanggal_mulai, tanggal_selesai, jenis, alasan, bukti_path, status, catatan_guru, dibuat, siswa:siswa_id (nama_lengkap, nisn, nomor_absen), kelas:kelas_id (nama_kelas)')
        .order('dibuat', { ascending: false })
        .limit(80);
      if (kelasId) q = q.eq('kelas_id', kelasId);
      const { data, error } = await q;
      if (error) return { ok: true, data: [], belumMigrasi: true };
      return { ok: true, data: data || [] };
    } catch (err) {
      return { ok: true, data: [] };
    }
  }

  const state = getMockState();
  const rows = (state.pengajuan_izin || [])
    .filter(p => !kelasId || p.kelas_id === kelasId)
    .map(p => {
      const s = state.siswa.find(x => x.id === p.siswa_id) || {};
      const k = state.kelas.find(x => x.id === p.kelas_id) || {};
      return {
        ...p,
        siswa: { nama_lengkap: s.nama_lengkap || 'Siswa', nisn: s.nisn || '-', nomor_absen: s.nomor_absen || '-' },
        kelas: { nama_kelas: k.nama_kelas || p.kelas_id },
      };
    })
    .sort((a, b) => (b.dibuat || '').localeCompare(a.dibuat || ''));
  return { ok: true, data: rows };
}

/**
 * 20. Setujui / Tolak Pengajuan Izin Siswa oleh Guru atau Admin
 */
export async function prosesPengajuanIzin(izinId, keputusan, catatanGuru = '') {
  if (!izinId || !['Disetujui', 'Ditolak'].includes(keputusan)) {
    return { ok: false, pesan: 'Keputusan persetujuan tidak valid.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('proses_pengajuan_izin', {
        p_pengajuan_id: izinId,
        p_keputusan: keputusan,
        p_catatan_guru: catatanGuru || '',
      });
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal memproses pengajuan izin.') };
      if (!data?.ok) return { ok: false, pesan: data?.pesan || 'Gagal memproses pengajuan izin.' };
      MEM_CACHE.riwayatBySiswa = {};
      MEM_CACHE.rekapByKey = {};
      return { ok: true, data, pesan: data.pesan };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi server untuk memproses izin.' };
    }
  }

  const state = getMockState();
  const target = (state.pengajuan_izin || []).find(p => p.id === izinId);
  if (!target) return { ok: false, pesan: 'Pengajuan izin tidak ditemukan.' };

  target.status = keputusan;
  target.catatan_guru = catatanGuru || '';
  target.diproses_pada = new Date().toISOString();

  if (keputusan === 'Disetujui') {
    const matchingMeetings = (state.pertemuan || []).filter(
      m => m.kelas_id === target.kelas_id && m.tanggal >= target.tanggal_mulai && m.tanggal <= target.tanggal_selesai
    );
    matchingMeetings.forEach(m => {
      const existing = state.absensi.find(a => a.pertemuan_id === m.id && a.siswa_id === target.siswa_id);
      if (existing) {
        existing.status = target.jenis;
        existing.catatan = target.alasan;
        existing.metode = 'IzinOnline';
      } else {
        state.absensi.push({
          id: `ABS-${Math.floor(Math.random() * 89999 + 10000)}`,
          pertemuan_id: m.id,
          siswa_id: target.siswa_id,
          status: target.jenis,
          catatan: target.alasan,
          metode: 'IzinOnline',
        });
      }
    });
  }

  saveMockState(state);
  MEM_CACHE.riwayatBySiswa = {};
  clearRekapCacheForClass(target.kelas_id);
  return { ok: true, pesan: `Pengajuan ${keputusan.toLowerCase()} (Mode Contoh).` };
}

/**
 * 21. Guru / Admin Membuka Sesi Absen Mandiri (Kode Unik / QR + Selfie + GPS)
 */
export async function bukaSesiMandiriGuru({ kelas_id, tanggal, judul, durasi_menit = 30, wajib_selfie = true, wajib_gps = true }) {
  if (!kelas_id) return { ok: false, pesan: 'Kelas belum dipilih.' };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('buka_sesi_mandiri', {
        p_kelas_id: kelas_id,
        p_tanggal: tanggal || new Date().toISOString().slice(0, 10),
        p_judul: judul || '',
        p_durasi_menit: Number(durasi_menit) || 30,
        p_wajib_selfie: Boolean(wajib_selfie),
        p_wajib_gps: Boolean(wajib_gps),
      });
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal membuka sesi absen mandiri.') };
      if (!data?.ok) return { ok: false, pesan: data?.pesan || 'Gagal membuka sesi absen mandiri.' };
      return { ok: true, data };
    } catch (err) {
      return { ok: false, pesan: 'Koneksi terputus saat membuka sesi mandiri.' };
    }
  }

  const state = getMockState();
  const tgl = tanggal || new Date().toISOString().slice(0, 10);
  const prtId = `PRT-${tgl.replace(/-/g, '')}-${Math.floor(Math.random() * 8999 + 1000)}`;
  const kode = String(Math.floor(100000 + Math.random() * 900000));
  const berlaku = new Date(Date.now() + (Number(durasi_menit) || 30) * 60000).toISOString();
  const judulFinal = (judul || '').trim() || 'Sesi Absen Mandiri';

  state.pertemuan.unshift({
    id: prtId,
    kelas_id,
    guru_id: getActiveSession()?.id || 'USR-GURU-01',
    tanggal: tgl,
    judul_materi: judulFinal,
    catatan: 'Sesi presensi mandiri siswa dibuka',
    mode_mandiri: true,
    kode_berlaku_sampai: berlaku,
    wajib_selfie: Boolean(wajib_selfie),
    wajib_gps: Boolean(wajib_gps),
  });
  state.sesi_mandiri_kode = [
    {
      pertemuan_id: prtId,
      kelas_id,
      tanggal: tgl,
      judul_materi: judulFinal,
      kode_sesi: kode,
      kode_berlaku_sampai: berlaku,
      wajib_selfie: Boolean(wajib_selfie),
      wajib_gps: Boolean(wajib_gps),
    },
    ...(state.sesi_mandiri_kode || []),
  ];
  saveMockState(state);

  return {
    ok: true,
    data: {
      pertemuan_id: prtId,
      kode_sesi: kode,
      kode_berlaku_sampai: berlaku,
      wajib_selfie: Boolean(wajib_selfie),
      wajib_gps: Boolean(wajib_gps),
      pesan: 'Sesi absen mandiri dibuka (Mode Contoh).',
    },
  };
}

/**
 * 22. Tutup Sesi Absen Mandiri Lebih Awal (Guru / Admin)
 */
export async function tutupSesiMandiriGuru(pertemuanId) {
  if (!pertemuanId) return { ok: false, pesan: 'ID pertemuan tidak valid.' };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('tutup_sesi_mandiri', { p_pertemuan_id: pertemuanId });
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal menutup sesi.') };
      return { ok: true, pesan: data?.pesan || 'Sesi ditutup.' };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi server.' };
    }
  }

  const state = getMockState();
  const nowIso = new Date(Date.now() - 1000).toISOString();
  state.sesi_mandiri_kode = (state.sesi_mandiri_kode || []).map(s =>
    s.pertemuan_id === pertemuanId ? { ...s, kode_berlaku_sampai: nowIso } : s
  );
  state.pertemuan = (state.pertemuan || []).map(p =>
    p.id === pertemuanId ? { ...p, kode_berlaku_sampai: nowIso } : p
  );
  saveMockState(state);
  return { ok: true, pesan: 'Sesi absen mandiri ditutup (Mode Contoh).' };
}

/**
 * 23. Ambil Daftar Sesi Mandiri & Siswa yang Sudah Check-In (Guru / Admin)
 */
export async function ambilSesiMandiriGuru(kelasId) {
  if (!kelasId) return { ok: true, data: [] };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: prtList, error } = await supabase
        .from('pertemuan')
        .select('id, kelas_id, tanggal, judul_materi, kode_berlaku_sampai, wajib_selfie, wajib_gps, dibuat, sesi_mandiri_kode (kode_sesi)')
        .eq('kelas_id', kelasId)
        .eq('mode_mandiri', true)
        .order('dibuat', { ascending: false })
        .limit(10);

      if (error) return { ok: true, data: [], belumMigrasi: true };
      const rows = prtList || [];
      if (rows.length === 0) return { ok: true, data: [] };

      const prtIds = rows.map(r => r.id);
      const { data: absenList } = await supabase
        .from('absensi')
        .select('id, pertemuan_id, siswa_id, status, metode, foto_selfie_path, jarak_meter, waktu_check_in, siswa:siswa_id (nama_lengkap, nisn, nomor_absen)')
        .in('pertemuan_id', prtIds);

      const enriched = rows.map(r => {
        const kodeObj = Array.isArray(r.sesi_mandiri_kode) ? r.sesi_mandiri_kode[0] : r.sesi_mandiri_kode;
        return {
          pertemuan_id: r.id,
          kelas_id: r.kelas_id,
          tanggal: r.tanggal,
          judul_materi: r.judul_materi,
          kode_sesi: kodeObj?.kode_sesi || '-',
          kode_berlaku_sampai: r.kode_berlaku_sampai,
          wajib_selfie: Boolean(r.wajib_selfie),
          wajib_gps: Boolean(r.wajib_gps),
          peserta: (absenList || []).filter(a => a.pertemuan_id === r.id),
        };
      });
      return { ok: true, data: enriched };
    } catch (err) {
      return { ok: true, data: [] };
    }
  }

  const state = getMockState();
  const list = (state.sesi_mandiri_kode || [])
    .filter(s => s.kelas_id === kelasId)
    .map(s => {
      const peserta = state.absensi
        .filter(a => a.pertemuan_id === s.pertemuan_id)
        .map(a => {
          const siswa = state.siswa.find(st => st.id === a.siswa_id) || {};
          return {
            ...a,
            siswa: { nama_lengkap: siswa.nama_lengkap || 'Siswa', nisn: siswa.nisn || '-', nomor_absen: siswa.nomor_absen || '-' },
          };
        });
      return { ...s, peserta };
    });
  return { ok: true, data: list };
}

/**
 * 24. Finalisasi / Simpan Presensi Batch pada Sesi Mandiri yang Sudah Ada
 */
export async function simpanPresensiSesiAktif(pertemuanId, kelasId, items) {
  if (!pertemuanId || !items?.length) {
    return { ok: false, pesan: 'Data sesi atau siswa tidak valid.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('simpan_presensi_sesi_aktif', {
        p_pertemuan_id: pertemuanId,
        p_items: items,
      });
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal menyimpan presensi sesi.') };
      if (!data?.ok) return { ok: false, pesan: data?.pesan || 'Gagal menyimpan presensi sesi.' };
      clearRekapCacheForClass(kelasId);
      return { ok: true, data, pesan: data.pesan };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi server.' };
    }
  }

  const state = getMockState();
  items.forEach(item => {
    const existing = state.absensi.find(a => a.pertemuan_id === pertemuanId && a.siswa_id === item.siswa_id);
    if (existing) {
      existing.status = item.status || existing.status;
      if (item.catatan) existing.catatan = item.catatan;
    } else {
      state.absensi.push({
        id: `ABS-${Math.floor(Math.random() * 89999 + 10000)}`,
        pertemuan_id: pertemuanId,
        siswa_id: item.siswa_id,
        status: item.status || 'Hadir',
        catatan: item.catatan || '',
        metode: item.metode || 'Guru',
      });
    }
  });
  saveMockState(state);
  clearRekapCacheForClass(kelasId);
  return { ok: true, pesan: 'Presensi sesi berhasil diperbarui (Mode Contoh).' };
}

/**
 * 25. Simpan Pengaturan Lokasi Sekolah & Radius GPS (Admin) / Nomor WA Profil Guru
 */
export async function simpanPengaturanSekolah({ lokasi_sekolah_lat, lokasi_sekolah_lng, radius_absen_meter, toleransi_alfa_maks }) {
  const pasangan = [
    { kunci: 'lokasi_sekolah_lat', nilai: String(lokasi_sekolah_lat ?? '-6.200000') },
    { kunci: 'lokasi_sekolah_lng', nilai: String(lokasi_sekolah_lng ?? '106.816666') },
    { kunci: 'radius_absen_meter', nilai: String(radius_absen_meter ?? '150') },
  ];
  if (toleransi_alfa_maks !== undefined && toleransi_alfa_maks !== '') {
    pasangan.push({ kunci: 'toleransi_alfa_maks', nilai: String(toleransi_alfa_maks) });
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('pengaturan').upsert(pasangan, { onConflict: 'kunci' });
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal menyimpan pengaturan lokasi sekolah.') };
      invalidateApiCache();
      return { ok: true, pesan: 'Pengaturan lokasi & radius absen berhasil disimpan.' };
    } catch (err) {
      return { ok: false, pesan: 'Koneksi terputus saat menyimpan pengaturan.' };
    }
  }

  const state = getMockState();
  pasangan.forEach(p => {
    state.pengaturan[p.kunci] = p.nilai;
  });
  saveMockState(state);
  invalidateApiCache();
  return { ok: true, pesan: 'Pengaturan lokasi & radius absen disimpan (Mode Contoh).' };
}

/**
 * 26. Ambil & Perbarui Nomor WhatsApp / HP Saya (Wali Kelas / Admin di halaman Profil)
 */
export async function ambilNomorHpSaya() {
  const activeUser = getActiveSession();
  if (!activeUser) return { ok: false, nomor_hp: '' };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('pengguna')
        .select('nomor_hp')
        .eq('id', activeUser.id)
        .maybeSingle();

      if (!error && data) {
        const hp = data.nomor_hp || '';
        setActiveSession({ ...activeUser, nomor_hp: hp });
        return { ok: true, nomor_hp: hp };
      }
    } catch {}
    return { ok: true, nomor_hp: activeUser.nomor_hp || '' };
  }

  const state = getMockState();
  const userObj = state.pengguna.find(p => p.id === activeUser.id);
  return { ok: true, nomor_hp: userObj?.nomor_hp || activeUser.nomor_hp || '' };
}

export async function perbaruiNomorHpSaya(nomorHp) {
  const activeUser = getActiveSession();
  if (!activeUser) return { ok: false, pesan: 'Sesi pengguna belum aktif.' };

  const bersih = String(nomorHp || '').replace(/[^0-9+]/g, '').slice(0, 24);
  const hanyaDigit = bersih.replace(/[^0-9]/g, '');
  if (bersih && hanyaDigit.length < 8) {
    return { ok: false, pesan: 'Nomor WhatsApp minimal 8 digit angka (contoh: 081234567890).' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('simpan_nomor_hp_saya', {
        p_nomor_hp: bersih,
      });
      if (error) {
        return {
          ok: false,
          pesan: formatErrorMessage(
            error,
            'Gagal menyimpan nomor WhatsApp. Pastikan SQL Tahap 2 sudah dijalankan.'
          ),
        };
      }
      if (data && !data.ok) return data;

      const updated = { ...activeUser, nomor_hp: data?.nomor_hp ?? bersih };
      setActiveSession(updated);
      invalidateApiCache();
      return { ok: true, nomor_hp: updated.nomor_hp || '', pesan: data?.pesan || 'Nomor WhatsApp berhasil diperbarui.' };
    } catch {
      return { ok: false, pesan: 'Koneksi terputus saat menyimpan nomor WhatsApp.' };
    }
  }

  const state = getMockState();
  const idx = state.pengguna.findIndex(p => p.id === activeUser.id);
  if (idx !== -1) {
    state.pengguna[idx].nomor_hp = bersih;
    saveMockState(state);
  }
  const updated = { ...activeUser, nomor_hp: bersih };
  setActiveSession(updated);
  invalidateApiCache();
  return { ok: true, nomor_hp: bersih, pesan: 'Nomor WhatsApp berhasil diperbarui (Mode Contoh).' };
}

export { getActiveSession, setActiveSession };
