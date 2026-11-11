import { supabase, isSupabaseConfigured } from './supabase';

// ==============================================================================
// DATA MEMORI CONTOH (MOCK DEMO DATA) UNTUK PENGUJIAN LOKAL TANPA SUPABASE
// ==============================================================================
const SEED_DATA = {
  pengaturan: {
    nama_sekolah: 'SMP Negeri 1 Teladan',
    tahun_ajaran: '2026/2027',
    semester: 'Ganjil',
  },
  pengguna: [
    {
      id: 'USR-GURU-01',
      username: 'gurubudi',
      email: 'budi@sekolah.id',
      nama_lengkap: 'Budi Santoso, S.Pd.',
      peran: 'Guru',
      status_aktif: 'Aktif',
      wajib_ganti_sandi: false,
    },
    {
      id: 'USR-ADMIN-01',
      username: 'adminsekolah',
      email: 'admin@sekolah.id',
      nama_lengkap: 'Dra. Hj. Siti Rahmawati',
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
    { id: 'PRT-20261102-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-11-02', judul_materi: 'Pertemuan 08: Teks Narasi Bagian 1', catatan: 'Kelas kondusif' },
    { id: 'PRT-20261105-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-11-05', judul_materi: 'Pertemuan 09: Teks Narasi Bagian 2', catatan: 'Latihan menulis' },
    { id: 'PRT-20261109-01', kelas_id: 'KLS-07A', guru_id: 'USR-GURU-01', tanggal: '2026-11-09', judul_materi: 'Pertemuan 10: Teks Prosedur', catatan: 'Evaluasi mingguan' },
  ],
  absensi: [
    { id: 'ABS-001', pertemuan_id: 'PRT-20261102-01', siswa_id: 'SIS-001', status: 'Hadir', catatan: '' },
    { id: 'ABS-002', pertemuan_id: 'PRT-20261105-01', siswa_id: 'SIS-001', status: 'Hadir', catatan: '' },
    { id: 'ABS-003', pertemuan_id: 'PRT-20261109-01', siswa_id: 'SIS-001', status: 'Hadir', catatan: '' },
    { id: 'ABS-004', pertemuan_id: 'PRT-20261102-01', siswa_id: 'SIS-002', status: 'Hadir', catatan: '' },
    { id: 'ABS-005', pertemuan_id: 'PRT-20261105-01', siswa_id: 'SIS-002', status: 'Sakit', catatan: 'Demam flu' },
    { id: 'ABS-006', pertemuan_id: 'PRT-20261109-01', siswa_id: 'SIS-002', status: 'Hadir', catatan: '' },
    { id: 'ABS-007', pertemuan_id: 'PRT-20261102-01', siswa_id: 'SIS-004', status: 'Hadir', catatan: '' },
    { id: 'ABS-008', pertemuan_id: 'PRT-20261105-01', siswa_id: 'SIS-004', status: 'Izin', catatan: 'Acara keluarga' },
    { id: 'ABS-009', pertemuan_id: 'PRT-20261109-01', siswa_id: 'SIS-004', status: 'Hadir', catatan: '' },
  ]
};

function getMockState() {
  if (typeof window === 'undefined') return SEED_DATA;
  const saved = localStorage.getItem('absensi_kelas_mock_state');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
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

      if (data.sesi) {
        await supabase.auth.setSession({
          access_token: data.sesi.access_token,
          refresh_token: data.sesi.refresh_token
        });
      }
      setActiveSession(data.pengguna);
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

  setActiveSession(user);
  return { ok: true, pengguna: user, sesi: { access_token: 'mock-token-123' } };
}

/**
 * 2. Keluar Akun
 */
export async function keluar() {
  if (isSupabaseConfigured && supabase) {
    try { await supabase.auth.signOut(); } catch (e) {}
  }
  setActiveSession(null);
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
        setActiveSession({ ...activeUser, wajib_ganti_sandi: false });
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
  return { ok: true, sandiSementara: tempPass };
}

/**
 * 5. Ambil Data Awal Pengguna Sesuai Peran
 */
export async function getDataAwal() {
  const activeUser = getActiveSession();
  if (!activeUser) {
    return { ok: false, pesan: 'Sesi belum aktif.' };
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const [profilRes, pengRes, kelasRes, siswaRes, pertemuanRes] = await Promise.all([
        supabase.from('pengguna').select('id, username, email, nama_lengkap, peran, status_aktif, wajib_ganti_sandi').eq('id', activeUser.id).single(),
        supabase.from('pengaturan').select('kunci, nilai'),
        supabase.from('kelas').select('id, nama_kelas, tingkat, wali_guru_id, tahun_ajaran').order('nama_kelas', { ascending: true }),
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

      const profilAktual = profilRes.data || activeUser;
      setActiveSession(profilAktual);

      return {
        ok: true,
        data: {
          pengguna: profilAktual,
          pengaturan: pengaturanObj,
          daftarKelas,
          daftarSiswa,
          riwayatPertemuan: pertemuanRes.data || [],
        }
      };
    } catch (err) {
      return { ok: false, pesan: formatErrorMessage(err, 'Gagal memuat data awal dari server.') };
    }
  }

  // Mode Contoh
  const state = getMockState();
  return {
    ok: true,
    data: {
      pengguna: activeUser,
      pengaturan: state.pengaturan,
      daftarKelas: state.kelas,
      daftarSiswa: state.siswa,
      riwayatPertemuan: state.pertemuan,
    }
  };
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
      return { ok: true, data, pesan: data?.pesan || 'Presensi pertemuan berhasil disimpan.' };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menyimpan transaksi presensi ke database.' };
    }
  }

  // Mode Contoh
  const state = getMockState();
  const pertemuanId = `PRT-${tanggal.replace(/-/g, '')}-${Math.floor(Math.random() * 8999 + 1000)}`;
  const user = getActiveSession() || { id: 'USR-GURU-01' };

  state.pertemuan.unshift({
    id: pertemuanId,
    kelas_id,
    guru_id: user.id,
    tanggal,
    judul_materi: judul || 'Pertemuan Baru',
    catatan: catatan || ''
  });

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
  return { ok: true, pertemuan_id: pertemuanId, pesan: 'Presensi pertemuan berhasil disimpan (Mode Contoh).' };
}

/**
 * 7. Ambil Rekapitulasi Kehadiran Bulanan Kelas
 */
export async function ambilRekapBulanan(kelasId, bulan = 11, tahun = 2026) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc('ambil_rekap_bulanan', {
        p_kelas_id: kelasId,
        p_bulan: parseInt(bulan, 10),
        p_tahun: parseInt(tahun, 10)
      });
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal mengambil rekap bulanan.') };
      return { ok: true, data: data || [] };
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

  return { ok: true, data: rekapData };
}

/**
 * 8. Ambil Riwayat & Ringkasan Kehadiran Siswa Pribadi
 */
export async function ambilRiwayatSiswa(siswaId) {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: siswaList, error: siswaErr } = await supabase
        .from('siswa')
        .select('id, pengguna_id, nisn, nama_lengkap, kelas_id, nomor_absen')
        .or(`pengguna_id.eq.${siswaId},id.eq.${siswaId},nisn.eq.${siswaId}`)
        .limit(1);

      if (siswaErr) return { ok: false, pesan: formatErrorMessage(siswaErr, 'Gagal mengambil profil siswa.') };
      const student = siswaList?.[0];
      if (!student) {
        return {
          ok: true,
          data: {
            siswa: { nama_lengkap: 'Data Siswa Belum Tertaut', nisn: '-', kelas_id: '-' },
            ringkasan: { total_pertemuan: 0, hadir: 0, sakit: 0, izin: 0, alfa: 0, persentase: 100 },
            riwayat: []
          }
        };
      }

      const [absenRes, totalSesiRes] = await Promise.all([
        supabase
          .from('absensi')
          .select('id, status, catatan, pertemuan:pertemuan_id (tanggal, judul_materi)')
          .eq('siswa_id', student.id)
          .order('dibuat', { ascending: false })
          .limit(50),
        supabase
          .from('pertemuan')
          .select('id', { count: 'exact', head: true })
          .eq('kelas_id', student.kelas_id)
      ]);

      const rows = absenRes.data || [];
      const hadir = rows.filter(r => r.status === 'Hadir').length;
      const sakit = rows.filter(r => r.status === 'Sakit').length;
      const izin = rows.filter(r => r.status === 'Izin').length;
      const alfa = rows.filter(r => r.status === 'Alfa').length;
      const totalPertemuan = totalSesiRes.count || rows.length;
      const persentase = totalPertemuan > 0 ? Number(((hadir / totalPertemuan) * 100).toFixed(1)) : 100.0;

      const riwayat = rows.map(r => ({
        id: r.id,
        tanggal: r.pertemuan?.tanggal || '-',
        judul_materi: r.pertemuan?.judul_materi || 'Pertemuan Kelas',
        status: r.status,
        catatan: r.catatan || '-'
      }));

      return {
        ok: true,
        data: {
          siswa: student,
          ringkasan: { total_pertemuan: totalPertemuan, hadir, sakit, izin, alfa, persentase },
          riwayat
        }
      };
    } catch (err) {
      return { ok: false, pesan: formatErrorMessage(err, 'Gagal memuat riwayat siswa.') };
    }
  }

  // Mode Contoh
  const state = getMockState();
  let student = state.siswa.find(s => s.id === siswaId || s.pengguna_id === siswaId || s.nisn === siswaId);
  if (!student) student = state.siswa[0];

  const studentAttendances = state.absensi.filter(a => a.siswa_id === student.id);
  const classMeetings = state.pertemuan.filter(p => p.kelas_id === student.kelas_id);
  const totalMeetings = Math.max(classMeetings.length, 24);

  const riwayat = studentAttendances.map(a => {
    const meeting = classMeetings.find(m => m.id === a.pertemuan_id) || {};
    return {
      id: a.id,
      tanggal: meeting.tanggal || '2026-11-05',
      judul_materi: meeting.judul_materi || 'Pertemuan Kelas',
      status: a.status,
      catatan: a.catatan || '-'
    };
  });

  const hadir = studentAttendances.filter(a => a.status === 'Hadir').length || 23;
  const sakit = studentAttendances.filter(a => a.status === 'Sakit').length || 1;
  const izin = studentAttendances.filter(a => a.status === 'Izin').length || 0;
  const alfa = studentAttendances.filter(a => a.status === 'Alfa').length || 0;
  const persentase = Number(((hadir / totalMeetings) * 100).toFixed(1));

  return {
    ok: true,
    data: {
      siswa: student,
      ringkasan: {
        total_pertemuan: totalMeetings,
        hadir,
        sakit,
        izin,
        alfa,
        persentase: persentase > 0 ? persentase : 96.8
      },
      riwayat
    }
  };
}

/**
 * 9. Kelola Kelas (Admin)
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
        return { ok: true, data: { ...data, total_siswa: 0 } };
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
    return { ok: true, data: newClass };
  }
  return { ok: true };
}

/**
 * 10. Kelola Siswa (Admin)
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
    return { ok: true, data: newStudent };
  }
  return { ok: true };
}

/**
 * 11. Ambil Daftar Akun Pengguna (Admin)
 */
export async function ambilDaftarPengguna() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('pengguna')
        .select('id, username, email, nama_lengkap, peran, status_aktif, wajib_ganti_sandi')
        .order('nama_lengkap', { ascending: true })
        .limit(200);
      if (error) return { ok: false, pesan: formatErrorMessage(error, 'Gagal mengambil daftar pengguna.') };
      return { ok: true, data: data || [] };
    } catch (err) {
      return { ok: false, pesan: 'Gagal menghubungi server untuk daftar pengguna.' };
    }
  }

  const state = getMockState();
  return { ok: true, data: state.pengguna };
}

export { getActiveSession, setActiveSession };
