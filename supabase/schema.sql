-- ==============================================================================
-- SKEMA DATABASE ABSENSI KELAS (SET PRO - SUPABASE POSTGRESQL)
-- Berkas: app/supabase/schema.sql
-- Proyek: absensi-kelas (v1.0)
-- Sesuai dengan: PRD-ABSENSI-KELAS-v1.0.md & CODING-PLAN-ABSENSI-KELAS-v1.0.md
-- Aman diulang (Idempotent: IF NOT EXISTS, DROP POLICY IF EXISTS)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABEL PENGGUNA (STANDAR P4 SET PRO)
-- Catatan: Password tidak pernah disimpan sebagai kolom. Dikelola oleh Supabase Auth.
create table if not exists public.pengguna (
  id text primary key,
  auth_uid uuid unique references auth.users(id) on delete set null,
  username text unique not null,
  email text unique not null,
  nama_lengkap text not null,
  peran text not null check (peran in ('Admin', 'Guru', 'Siswa')),
  status_aktif text not null default 'Aktif' check (status_aktif in ('Aktif', 'Nonaktif')),
  gagal_masuk int not null default 0,
  terkunci_sampai timestamptz,
  wajib_ganti_sandi boolean not null default false,
  dibuat timestamptz not null default now()
);

-- 3. TABEL PENGATURAN SISTEM
create table if not exists public.pengaturan (
  kunci text primary key,
  nilai text not null
);

-- 4. TABEL KELAS
create table if not exists public.kelas (
  id text primary key,
  nama_kelas text not null,
  tingkat text not null,
  wali_guru_id text references public.pengguna(id) on delete set null,
  tahun_ajaran text not null default '2026/2027',
  dibuat timestamptz not null default now()
);

-- 5. TABEL SISWA
create table if not exists public.siswa (
  id text primary key,
  pengguna_id text unique references public.pengguna(id) on delete set null,
  nisn text unique not null,
  nama_lengkap text not null,
  kelas_id text not null references public.kelas(id) on delete cascade,
  nomor_absen int not null default 1,
  jenis_kelamin text not null check (jenis_kelamin in ('L', 'P')),
  nomor_hp_wali text,
  status_aktif text not null default 'Aktif' check (status_aktif in ('Aktif', 'Lulus', 'Pindah')),
  dibuat timestamptz not null default now()
);

-- 6. TABEL PERTEMUAN (SESI ABSENSI KELAS)
create table if not exists public.pertemuan (
  id text primary key,
  kelas_id text not null references public.kelas(id) on delete cascade,
  guru_id text not null references public.pengguna(id) on delete restrict,
  tanggal date not null default current_date,
  judul_materi text,
  catatan text,
  dibuat timestamptz not null default now()
);

-- 7. TABEL ABSENSI (ENTRI STATUS KEHADIRAN SISWA PER PERTEMUAN)
create table if not exists public.absensi (
  id text primary key,
  pertemuan_id text not null references public.pertemuan(id) on delete cascade,
  siswa_id text not null references public.siswa(id) on delete cascade,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alfa')),
  catatan text,
  dibuat timestamptz not null default now(),
  constraint uq_pertemuan_siswa unique (pertemuan_id, siswa_id)
);

-- ==============================================================================
-- INDEKS OPTIMALISASI KINERJA (QUERY FILTER & PENGURUTAN)
-- ==============================================================================
create index if not exists idx_pengguna_username on public.pengguna(username);
create index if not exists idx_pengguna_auth_uid on public.pengguna(auth_uid);
create index if not exists idx_siswa_kelas_id on public.siswa(kelas_id);
create index if not exists idx_siswa_nisn on public.siswa(nisn);
create index if not exists idx_pertemuan_kelas_tanggal on public.pertemuan(kelas_id, tanggal desc);
create index if not exists idx_absensi_pertemuan_id on public.absensi(pertemuan_id);
create index if not exists idx_absensi_siswa_id on public.absensi(siswa_id);

-- ==============================================================================
-- FUNGSI BANTU PERAN & IDENTITAS KEAMANAN (SECURITY DEFINER)
-- ==============================================================================
create or replace function public.peran_saya()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select peran from public.pengguna
  where auth_uid = auth.uid() and status_aktif = 'Aktif'
  limit 1;
$$;

create or replace function public.pengguna_id_saya()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.pengguna
  where auth_uid = auth.uid() and status_aktif = 'Aktif'
  limit 1;
$$;

create or replace function public.siswa_id_saya()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select s.id from public.siswa s
  join public.pengguna p on s.pengguna_id = p.id
  where p.auth_uid = auth.uid() and p.status_aktif = 'Aktif'
  limit 1;
$$;

-- ==============================================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS) DI SEMUA TABEL
-- ==============================================================================
alter table public.pengguna enable row level security;
alter table public.pengaturan enable row level security;
alter table public.kelas enable row level security;
alter table public.siswa enable row level security;
alter table public.pertemuan enable row level security;
alter table public.absensi enable row level security;

-- ==============================================================================
-- POLICY RLS PER TABEL
-- ==============================================================================

-- A. Policy Tabel `pengguna`
drop policy if exists "pengguna_baca_sendiri" on public.pengguna;
create policy "pengguna_baca_sendiri" on public.pengguna
  for select using (auth_uid = auth.uid() or public.peran_saya() = 'Admin');

drop policy if exists "admin_kelola_pengguna" on public.pengguna;
create policy "admin_kelola_pengguna" on public.pengguna
  for all using (public.peran_saya() = 'Admin');

-- B. Policy Tabel `pengaturan`
drop policy if exists "semua_baca_pengaturan" on public.pengaturan;
create policy "semua_baca_pengaturan" on public.pengaturan
  for select using (auth.role() = 'authenticated');

drop policy if exists "admin_kelola_pengaturan" on public.pengaturan;
create policy "admin_kelola_pengaturan" on public.pengaturan
  for all using (public.peran_saya() = 'Admin');

-- C. Policy Tabel `kelas`
drop policy if exists "guru_admin_baca_kelas" on public.kelas;
create policy "guru_admin_baca_kelas" on public.kelas
  for select using (
    public.peran_saya() in ('Admin', 'Guru') or
    id in (select kelas_id from public.siswa where id = public.siswa_id_saya())
  );

drop policy if exists "admin_kelola_kelas" on public.kelas;
create policy "admin_kelola_kelas" on public.kelas
  for all using (public.peran_saya() = 'Admin');

-- D. Policy Tabel `siswa`
drop policy if exists "baca_siswa_sesuai_hak" on public.siswa;
create policy "baca_siswa_sesuai_hak" on public.siswa
  for select using (
    public.peran_saya() = 'Admin' or
    public.peran_saya() = 'Guru' or
    id = public.siswa_id_saya()
  );

drop policy if exists "admin_kelola_siswa" on public.siswa;
create policy "admin_kelola_siswa" on public.siswa
  for all using (public.peran_saya() = 'Admin');

-- E. Policy Tabel `pertemuan`
drop policy if exists "baca_pertemuan_sesuai_hak" on public.pertemuan;
create policy "baca_pertemuan_sesuai_hak" on public.pertemuan
  for select using (
    public.peran_saya() in ('Admin', 'Guru') or
    kelas_id in (select kelas_id from public.siswa where id = public.siswa_id_saya())
  );

drop policy if exists "guru_admin_kelola_pertemuan" on public.pertemuan;
create policy "guru_admin_kelola_pertemuan" on public.pertemuan
  for all using (
    public.peran_saya() = 'Admin' or
    (public.peran_saya() = 'Guru' and guru_id = public.pengguna_id_saya())
  );

-- F. Policy Tabel `absensi`
drop policy if exists "baca_absensi_sesuai_hak" on public.absensi;
create policy "baca_absensi_sesuai_hak" on public.absensi
  for select using (
    public.peran_saya() in ('Admin', 'Guru') or
    siswa_id = public.siswa_id_saya()
  );

drop policy if exists "guru_admin_kelola_absensi" on public.absensi;
create policy "guru_admin_kelola_absensi" on public.absensi
  for all using (public.peran_saya() in ('Admin', 'Guru'));

-- ==============================================================================
-- FUNGSI SERVER SQL: REKAPITULASI & PENYIMPANAN BATCH (RPC)
-- ==============================================================================

-- 1. Fungsi Simpan Presensi Pertemuan Cepat (Batch Transaction)
create or replace function public.simpan_presensi_pertemuan(
  p_kelas_id text,
  p_tanggal date,
  p_judul text,
  p_catatan text,
  p_items jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pertemuan_id text;
  v_guru_id text;
  v_item jsonb;
  v_absensi_id text;
  v_count int := 0;
begin
  -- Verifikasi pemanggil wajib berstatus Guru atau Admin
  if public.peran_saya() not in ('Guru', 'Admin') then
    return json_build_object('ok', false, 'pesan', 'Hanya Guru atau Admin yang berhak menyimpan presensi.');
  end if;

  v_guru_id := public.pengguna_id_saya();
  v_pertemuan_id := 'PRT-' || to_char(p_tanggal, 'YYYYMMDD') || '-' || substring(md5(random()::text) from 1 for 6);

  -- 1. Buat Baris Pertemuan
  insert into public.pertemuan (id, kelas_id, guru_id, tanggal, judul_materi, catatan)
  values (v_pertemuan_id, p_kelas_id, v_guru_id, p_tanggal, p_judul, p_catatan);

  -- 2. Masukkan Entri Absensi Setiap Siswa
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_absensi_id := 'ABS-' || substring(md5(random()::text) from 1 for 10);
    insert into public.absensi (id, pertemuan_id, siswa_id, status, catatan)
    values (
      v_absensi_id,
      v_pertemuan_id,
      v_item->>'siswa_id',
      v_item->>'status',
      nullif(v_item->>'catatan', '')
    )
    on conflict (pertemuan_id, siswa_id)
    do update set
      status = excluded.status,
      catatan = excluded.catatan;
    v_count := v_count + 1;
  end loop;

  return json_build_object(
    'ok', true,
    'pertemuan_id', v_pertemuan_id,
    'jumlah_siswa', v_count,
    'pesan', 'Presensi pertemuan berhasil disimpan.'
  );
exception
  when others then
    return json_build_object('ok', false, 'pesan', SQLERRM);
end;
$$;

-- 2. Fungsi Hitung Rekapitulasi Bulanan Kelas (Bebas Galat Hitung Manual)
create or replace function public.ambil_rekap_bulanan(
  p_kelas_id text,
  p_bulan int,
  p_tahun int
)
returns table (
  siswa_id text,
  nisn text,
  nama_lengkap text,
  nomor_absen int,
  hadir bigint,
  sakit bigint,
  izin bigint,
  alfa bigint,
  total_pertemuan bigint,
  persentase numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with total_sesi as (
    select count(id) as total from public.pertemuan
    where kelas_id = p_kelas_id
      and extract(month from tanggal) = p_bulan
      and extract(year from tanggal) = p_tahun
  )
  select 
    s.id as siswa_id,
    s.nisn,
    s.nama_lengkap,
    s.nomor_absen,
    coalesce(sum(case when a.status = 'Hadir' then 1 else 0 end), 0)::bigint as hadir,
    coalesce(sum(case when a.status = 'Sakit' then 1 else 0 end), 0)::bigint as sakit,
    coalesce(sum(case when a.status = 'Izin' then 1 else 0 end), 0)::bigint as izin,
    coalesce(sum(case when a.status = 'Alfa' then 1 else 0 end), 0)::bigint as alfa,
    ts.total::bigint as total_pertemuan,
    case 
      when ts.total > 0 then 
        round((coalesce(sum(case when a.status = 'Hadir' then 1 else 0 end), 0)::numeric / ts.total::numeric) * 100, 1)
      else 100.0
    end as persentase
  from public.siswa s
  cross join total_sesi ts
  left join public.pertemuan p on p.kelas_id = s.kelas_id 
    and extract(month from p.tanggal) = p_bulan 
    and extract(year from p.tanggal) = p_tahun
  left join public.absensi a on a.pertemuan_id = p.id and a.siswa_id = s.id
  where s.kelas_id = p_kelas_id and s.status_aktif = 'Aktif'
  group by s.id, s.nisn, s.nama_lengkap, s.nomor_absen, ts.total
  order by s.nomor_absen asc;
$$;

-- 3. Fungsi Tandai Selesai Wajib Ganti Sandi (P4 Keamanan)
create or replace function public.selesai_ganti_sandi()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pengguna
  set wajib_ganti_sandi = false
  where auth_uid = auth.uid();
  return true;
end;
$$;

-- Berikan izin eksekusi kepada authenticated users
grant execute on function public.simpan_presensi_pertemuan to authenticated;
grant execute on function public.ambil_rekap_bulanan to authenticated;
grant execute on function public.selesai_ganti_sandi to authenticated;

-- ==============================================================================
-- DATA AWAL SISTEM (SEED DATA)
-- ==============================================================================
insert into public.pengaturan (kunci, nilai) values
  ('nama_sekolah', 'SMP Negeri 1 Teladan'),
  ('tahun_ajaran', '2026/2027'),
  ('semester', 'Ganjil'),
  ('toleransi_alfa_maks', '3')
on conflict (kunci) do update set nilai = excluded.nilai;

-- Akun awal contoh dan kelas contoh akan dibuat secara otomatis
-- oleh skrip `node alat/buat-akun-awal.mjs` menggunakan Supabase Auth Admin.

