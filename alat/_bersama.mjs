import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Urutan tabel mengikuti ketergantungan relasi database (induk -> anak)
export const TABEL = [
  'pengaturan',
  'pengguna',
  'kelas',
  'siswa',
  'pertemuan',
  'absensi'
];

/**
 * Membaca konfigurasi berkas env (.env.admin atau .env.uji)
 */
export function bacaEnv(namaBerkas = '.env.admin') {
  const envPath = path.resolve(__dirname, '..', namaBerkas);
  if (!fs.existsSync(envPath)) {
    return {};
  }
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      env[key] = val;
    }
  }
  return env;
}

/**
 * Membuat klien Supabase Admin (Service Role / Kunci Rahasia)
 */
export function getAdminClient(env = bacaEnv('.env.admin')) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.KUNCI_RAHASIA;

  if (!url || !key) {
    console.error('❌ Galat: NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib ada di .env.admin');
    process.exit(1);
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/**
 * Membuat klien Supabase Publik (Publishable / Anon Key) untuk uji akses RLS
 */
export function getPublicClient(env = bacaEnv('.env.uji')) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ Galat: NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY wajib ada di .env.uji atau .env');
    process.exit(1);
  }

  return createClient(url, key);
}

