import { getAdminClient, bacaEnv } from './_bersama.mjs';

const AKUN_AWAL = [
  {
    id: 'USR-ADMIN-01',
    username: 'adminsekolah',
    email: 'admin@sekolah.id',
    nama_lengkap: 'Dra. Hj. Siti Rahmawati',
    peran: 'Admin',
    sandi_awal: 'AdminSekolah#2026',
    status_aktif: 'Aktif',
    wajib_ganti_sandi: true,
  },
  {
    id: 'USR-GURU-01',
    username: 'gurubudi',
    email: 'budi@sekolah.id',
    nama_lengkap: 'Budi Santoso, S.Pd.',
    peran: 'Guru',
    sandi_awal: 'GuruBudi#2026',
    status_aktif: 'Aktif',
    wajib_ganti_sandi: true,
  },
  {
    id: 'USR-SISWA-01',
    username: '008123',
    email: 'ahmad.fauzi@siswa.id',
    nama_lengkap: 'Ahmad Fauzi',
    peran: 'Siswa',
    sandi_awal: 'SiswaFauzi#2026',
    status_aktif: 'Aktif',
    wajib_ganti_sandi: true,
  }
];

const SISWA_AWAL = [
  { id: 'SIS-001', pengguna_id: 'USR-SISWA-01', nisn: '008123', nama_lengkap: 'Ahmad Fauzi', kelas_id: 'KLS-07A', nomor_absen: 1, jenis_kelamin: 'L', nomor_hp_wali: '081234567890', status_aktif: 'Aktif' },
  { id: 'SIS-002', pengguna_id: null, nisn: '008124', nama_lengkap: 'Annisa Putri Ramadhani', kelas_id: 'KLS-07A', nomor_absen: 2, jenis_kelamin: 'P', nomor_hp_wali: '081234567891', status_aktif: 'Aktif' },
  { id: 'SIS-003', pengguna_id: null, nisn: '008125', nama_lengkap: 'Budi Kurniawan Pratama', kelas_id: 'KLS-07A', nomor_absen: 3, jenis_kelamin: 'L', nomor_hp_wali: '081234567892', status_aktif: 'Aktif' },
  { id: 'SIS-004', pengguna_id: null, nisn: '008126', nama_lengkap: 'Cantika Dewi Maharani', kelas_id: 'KLS-07A', nomor_absen: 4, jenis_kelamin: 'P', nomor_hp_wali: '081234567893', status_aktif: 'Aktif' },
  { id: 'SIS-005', pengguna_id: null, nisn: '008127', nama_lengkap: 'Dika Pratama Wicaksono', kelas_id: 'KLS-07A', nomor_absen: 5, jenis_kelamin: 'L', nomor_hp_wali: '081234567894', status_aktif: 'Aktif' },
];

async function main() {
  console.log('🚀 Memulai inisialisasi akun awal Absensi Kelas (Standar P4)...');
  const env = bacaEnv('.env.admin');
  const admin = getAdminClient(env);

  for (const item of AKUN_AWAL) {
    console.log(`\n⏳ Memproses akun [${item.peran}] ${item.nama_lengkap} (${item.username})...`);

    let authUid = null;

    // 1. Cek apakah akun Auth sudah pernah ada
    const { data: listData } = await admin.auth.admin.listUsers();
    const existing = listData?.users?.find(u => u.email === item.email);

    if (existing) {
      console.log(`   ℹ️ Akun Auth dengan email ${item.email} sudah terdaftar.`);
      authUid = existing.id;
      await admin.auth.admin.updateUserById(authUid, { password: item.sandi_awal });
    } else {
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: item.email,
        password: item.sandi_awal,
        email_confirm: true,
      });

      if (createError) {
        console.error(`   ❌ Gagal membuat akun Auth: ${createError.message}`);
        continue;
      }
      authUid = createData.user.id;
      console.log(`   ✅ Akun Auth dibuat (auth_uid: ${authUid})`);
    }

    // 2. Simpan atau perbarui data profil di tabel pengguna
    const { error: dbError } = await admin.from('pengguna').upsert({
      id: item.id,
      auth_uid: authUid,
      username: item.username,
      email: item.email,
      nama_lengkap: item.nama_lengkap,
      peran: item.peran,
      status_aktif: item.status_aktif,
      wajib_ganti_sandi: item.wajib_ganti_sandi,
      gagal_masuk: 0,
      terkunci_sampai: null,
    }, { onConflict: 'id' });

    if (dbError) {
      console.error(`   ❌ Gagal menyimpan profil pengguna ke tabel: ${dbError.message}`);
    } else {
      console.log(`   ✅ Profil tabel pengguna berhasil disinkronkan.`);
    }
  }

  // 3. Pastikan minimal ada 2 kelas awal
  console.log('\n⏳ Menyiapkan data awal rombel kelas...');
  const { error: klsError } = await admin.from('kelas').upsert([
    {
      id: 'KLS-07A',
      nama_kelas: 'Kelas VII-A',
      tingkat: '7',
      wali_guru_id: 'USR-GURU-01',
      tahun_ajaran: '2026/2027'
    },
    {
      id: 'KLS-07B',
      nama_kelas: 'Kelas VII-B',
      tingkat: '7',
      wali_guru_id: 'USR-GURU-01',
      tahun_ajaran: '2026/2027'
    }
  ], { onConflict: 'id' });

  if (klsError) {
    console.error(`   ❌ Gagal menyimpan kelas awal: ${klsError.message}`);
  } else {
    console.log('   ✅ Data rombel Kelas VII-A dan VII-B siap.');
  }

  // 4. Pastikan daftar siswa awal di Kelas VII-A terisi
  console.log('⏳ Menyiapkan data 5 siswa awal di Kelas VII-A...');
  const { error: sisError } = await admin.from('siswa').upsert(SISWA_AWAL, { onConflict: 'id' });
  if (sisError) {
    console.error(`   ❌ Gagal menyimpan siswa awal: ${sisError.message}`);
  } else {
    console.log('   ✅ 5 siswa awal (termasuk Ahmad Fauzi / 008123) berhasil disinkronkan.');
  }

  console.log('\n======================================================');
  console.log('🎉 AKUN & DATA AWAL BERHASIL DISIAPKAN DENGAN LENGKAP!');
  console.log('======================================================');
  console.log('1. Admin: Username: adminsekolah | Sandi: AdminSekolah#2026');
  console.log('2. Guru : Username: gurubudi     | Sandi: GuruBudi#2026');
  console.log('3. Siswa: Username: 008123       | Sandi: SiswaFauzi#2026');
  console.log('======================================================');
  console.log('⚠️ CATATAN KEAMANAN:');
  console.log('Semua akun di atas berstatus "wajib_ganti_sandi: true".');
  console.log('Pengguna akan otomatis diarahkan mengganti sandi saat login pertama.');
}

main().catch(err => {
  console.error('❌ Terjadi kesalahan fatal:', err);
  process.exit(1);
});
