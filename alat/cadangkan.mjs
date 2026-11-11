import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAdminClient, bacaEnv, TABEL } from './_bersama.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('📦 Memulai pencadangan data database Absensi Kelas...');
  const env = bacaEnv('.env.admin');
  const admin = getAdminClient(env);

  const folderCadangan = path.resolve(__dirname, '..', 'cadangan');
  if (!fs.existsSync(folderCadangan)) {
    fs.mkdirSync(folderCadangan, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const namaBerkas = `absensi-kelas-${timestamp}.json`;
  const jalurBerkas = path.join(folderCadangan, namaBerkas);

  const hasilCadangan = {
    metadata: {
      proyek: 'absensi-kelas',
      tanggal: new Date().toISOString(),
      versi_skema: '1.0'
    },
    data: {}
  };

  for (const namaTabel of TABEL) {
    console.log(`   ⏳ Membaca tabel "${namaTabel}"...`);
    const { data, error } = await admin.from(namaTabel).select('*');
    if (error) {
      console.warn(`   ⚠️ Gagal membaca tabel ${namaTabel}: ${error.message}`);
      hasilCadangan.data[namaTabel] = [];
    } else {
      hasilCadangan.data[namaTabel] = data || [];
      console.log(`   ✅ Tersalin ${data?.length || 0} baris.`);
    }
  }

  fs.writeFileSync(jalurBerkas, JSON.stringify(hasilCadangan, null, 2), 'utf-8');
  console.log(`\n🎉 Pencadangan selesai! Berkas tersimpan di:`);
  console.log(`   📁 ${jalurBerkas}`);

  // Simpan maksimal 14 berkas cadangan terakhir
  const daftarBerkas = fs.readdirSync(folderCadangan)
    .filter(f => f.startsWith('absensi-kelas-') && f.endsWith('.json'))
    .sort();

  if (daftarBerkas.length > 14) {
    const dihapus = daftarBerkas.slice(0, daftarBerkas.length - 14);
    for (const f of dihapus) {
      fs.unlinkSync(path.join(folderCadangan, f));
      console.log(`   🗑️ Menghapus cadangan lawas: ${f}`);
    }
  }
}

main().catch(err => {
  console.error('❌ Terjadi kesalahan saat mencadangkan:', err);
  process.exit(1);
});

