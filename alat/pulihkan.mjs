import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAdminClient, bacaEnv, TABEL } from './_bersama.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const argTarget = process.argv[2];
  if (!argTarget) {
    console.error('❌ Gunakan: node alat/pulihkan.mjs <jalur-berkas-cadangan.json>');
    process.exit(1);
  }

  const jalurBerkas = path.isAbsolute(argTarget) ? argTarget : path.resolve(process.cwd(), argTarget);
  if (!fs.existsSync(jalurBerkas)) {
    console.error(`❌ Berkas cadangan tidak ditemukan: ${jalurBerkas}`);
    process.exit(1);
  }

  console.log(`📥 Membaca berkas cadangan: ${jalurBerkas}...`);
  const rawData = fs.readFileSync(jalurBerkas, 'utf-8');
  const payload = JSON.parse(rawData);

  if (!payload.data) {
    console.error('❌ Format berkas cadangan tidak valid (bagian data tidak ada).');
    process.exit(1);
  }

  const env = bacaEnv('.env.admin');
  const admin = getAdminClient(env);

  console.log('🔄 Memulihkan data per tabel sesuai urutan relasi...');
  for (const namaTabel of TABEL) {
    const barisData = payload.data[namaTabel] || [];
    if (barisData.length === 0) {
      console.log(`   ℹ️ Tabel "${namaTabel}" kosong, lewati.`);
      continue;
    }

    console.log(`   ⏳ Mengunggah ${barisData.length} baris ke tabel "${namaTabel}"...`);
    const { error } = await admin.from(namaTabel).upsert(barisData, { onConflict: 'id' });
    if (error) {
      console.error(`   ❌ Gagal memulihkan tabel ${namaTabel}: ${error.message}`);
    } else {
      console.log(`   ✅ Berhasil memulihkan ${barisData.length} baris.`);
    }
  }

  console.log('\n🎉 Pemulihan data selesai dengan sukses!');
}

main().catch(err => {
  console.error('❌ Terjadi kesalahan saat pemulihan:', err);
  process.exit(1);
});

