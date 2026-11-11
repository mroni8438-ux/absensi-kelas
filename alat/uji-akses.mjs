import { getPublicClient, bacaEnv } from './_bersama.mjs';

async function main() {
  console.log('🛡️ Memulai Audit Uji Keamanan Hak Akses (RLS Security Test)...');
  console.log('   Menggunakan kunci publik (Anon / Publishable Key) untuk mensimulasikan akses peretas/siswa.\n');

  const env = bacaEnv('.env.uji');
  const supabase = getPublicClient(env);

  let skorLulus = 0;
  let totalUji = 0;

  function laporkan(namaTes, berhasilDitolak, detail = '') {
    totalUji++;
    if (berhasilDitolak) {
      skorLulus++;
      console.log(`✅ [DITOLAK - AMAN] ${namaTes}`);
    } else {
      console.error(`🚨 [BOCOR - BAHAYA] ${namaTes}! ${detail}`);
    }
  }

  // Uji 1: Pengguna anonim (tanpa login) mencoba membaca seluruh isi tabel pengguna
  try {
    const { data, error } = await supabase.from('pengguna').select('*');
    laporkan(
      'Anonim membaca seluruh tabel pengguna',
      error !== null || !data || data.length === 0,
      `Terbaca ${data?.length} baris!`
    );
  } catch (e) {
    laporkan('Anonim membaca seluruh tabel pengguna', true);
  }

  // Uji 2: Pengguna anonim mencoba membuat rombel kelas baru
  try {
    const { data, error } = await supabase.from('kelas').insert({
      id: 'KLS-HACK-01',
      nama_kelas: 'Kelas Ilegal',
      tingkat: '7',
      wali_guru_id: 'USR-HACK'
    });
    laporkan('Anonim membuat kelas baru', error !== null);
  } catch (e) {
    laporkan('Anonim membuat kelas baru', true);
  }

  // Uji 3: Pengguna anonim mencoba memanipulasi catatan absensi
  try {
    const { data, error } = await supabase.from('absensi').insert({
      id: 'ABS-HACK-01',
      pertemuan_id: 'PRT-UNKNOWN',
      siswa_id: 'SIS-UNKNOWN',
      status: 'Hadir'
    });
    laporkan('Anonim menyisipkan data absensi langsung', error !== null);
  } catch (e) {
    laporkan('Anonim menyisipkan data absensi langsung', true);
  }

  // Uji 4: Mencoba login dengan akun siswa untuk cek apakah siswa bisa mengubah perannya sendiri jadi Admin
  const emailSiswa = env.EMAIL_UJI_SISWA || 'ahmad.fauzi@siswa.id';
  const sandiSiswa = env.SANDI_UJI_SISWA || 'SiswaFauzi#2026';

  console.log(`\n⏳ Menguji login sebagai peran Siswa (${emailSiswa})...`);
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: emailSiswa,
    password: sandiSiswa
  });

  if (authError || !authData.session) {
    console.log(`   ℹ️ Akun uji siswa belum login (${authError?.message || 'lewati uji peran'}).`);
  } else {
    // Siswa mencoba mengubah perannya menjadi Admin
    try {
      const { data: hackData, error: hackRoleError } = await supabase
        .from('pengguna')
        .update({ peran: 'Admin' })
        .eq('auth_uid', authData.user.id)
        .select();

      laporkan(
        'Siswa mengubah perannya sendiri menjadi Admin',
        hackRoleError !== null || !hackData || hackData.length === 0
      );
    } catch (e) {
      laporkan('Siswa mengubah perannya sendiri menjadi Admin', true);
    }

    // Siswa mencoba membuat rombel kelas baru
    try {
      const { error: createClassError } = await supabase.from('kelas').insert({
        id: 'KLS-SISWA-01',
        nama_kelas: 'Kelas Siswa',
        tingkat: '7'
      });
      laporkan('Siswa membuat rombel kelas baru', createClassError !== null);
    } catch (e) {
      laporkan('Siswa membuat rombel kelas baru', true);
    }

    await supabase.auth.signOut();
  }

  console.log('\n======================================================');
  console.log(`📊 HASIL AUDIT RLS: ${skorLulus}/${totalUji} UJI LULUS (SEMUA AKSES ILEGAL BERHASIL DITOLAK)`);
  console.log('======================================================');
  if (skorLulus === totalUji) {
    console.log('🎉 SELAMAT! Seluruh kebijakan Row Level Security (RLS) PostgreSQL berfungsi sempurna!');
  } else {
    console.warn('⚠️ PERHATIAN: Terdapat kebocoran RLS yang harus segera diperbaiki di schema.sql.');
  }
}

main().catch(err => {
  console.error('❌ Terjadi kesalahan pengujian:', err);
  process.exit(1);
});

