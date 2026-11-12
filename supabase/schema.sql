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
-- INDEKS OPTIMALISASI KINERJA (QUERY FILTER & PENGURUTAN — K3)
-- ==============================================================================
create index if not exists idx_pengguna_username on public.pengguna(username);
create index if not exists idx_pengguna_email on public.pengguna(email);
create index if not exists idx_pengguna_lower_username on public.pengguna(lower(username));
create index if not exists idx_pengguna_lower_email on public.pengguna(lower(email));
create index if not exists idx_pengguna_auth_uid on public.pengguna(auth_uid);
create index if not exists idx_siswa_kelas_id on public.siswa(kelas_id);
create index if not exists idx_siswa_kelas_absen on public.siswa(kelas_id, nomor_absen asc);
create index if not exists idx_siswa_nisn on public.siswa(nisn);
create index if not exists idx_pertemuan_kelas_tanggal on public.pertemuan(kelas_id, tanggal desc);
create index if not exists idx_absensi_pertemuan_id on public.absensi(pertemuan_id);
create index if not exists idx_absensi_siswa_id on public.absensi(siswa_id);
create index if not exists idx_absensi_siswa_dibuat on public.absensi(siswa_id, dibuat desc);

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
-- TAHAP 2: IZIN ONLINE, ABSEN MANDIRI (QR/KODE, SELFIE, GPS) & STORAGE
-- Aman diulang (idempotent) di atas skema v1.0 yang sudah berjalan.
-- ==============================================================================

-- 1. Penambahan Kolom Opsional pada Tabel Eksisting
alter table public.pengguna add column if not exists nomor_hp text;

alter table public.pertemuan add column if not exists mode_mandiri boolean not null default false;
alter table public.pertemuan add column if not exists kode_berlaku_sampai timestamptz;
alter table public.pertemuan add column if not exists wajib_selfie boolean not null default false;
alter table public.pertemuan add column if not exists wajib_gps boolean not null default false;

alter table public.absensi add column if not exists metode text not null default 'Guru';
alter table public.absensi add column if not exists foto_selfie_path text;
alter table public.absensi add column if not exists latitude double precision;
alter table public.absensi add column if not exists longitude double precision;
alter table public.absensi add column if not exists jarak_meter int;
alter table public.absensi add column if not exists waktu_check_in timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_absensi_metode'
  ) then
    alter table public.absensi
      add constraint chk_absensi_metode check (metode in ('Guru', 'Mandiri', 'IzinOnline'));
  end if;
end $$;

-- 2. Tabel Kode Rahasia Sesi Mandiri (Hanya Guru & Admin yang bisa baca via RLS)
create table if not exists public.sesi_mandiri_kode (
  pertemuan_id text primary key references public.pertemuan(id) on delete cascade,
  kode_sesi text not null,
  dibuat_oleh text references public.pengguna(id) on delete set null,
  dibuat timestamptz not null default now()
);

create index if not exists idx_sesi_mandiri_kode_sesi on public.sesi_mandiri_kode(kode_sesi);

alter table public.sesi_mandiri_kode enable row level security;

drop policy if exists "guru_admin_kelola_kode_sesi" on public.sesi_mandiri_kode;
create policy "guru_admin_kelola_kode_sesi" on public.sesi_mandiri_kode
  for all using (public.peran_saya() in ('Admin', 'Guru'));

-- 3. Tabel Pengajuan Izin / Sakit Online Siswa
create table if not exists public.pengajuan_izin (
  id text primary key,
  siswa_id text not null references public.siswa(id) on delete cascade,
  kelas_id text not null references public.kelas(id) on delete cascade,
  tanggal_mulai date not null,
  tanggal_selesai date not null,
  jenis text not null check (jenis in ('Sakit', 'Izin')),
  alasan text not null,
  bukti_path text,
  status text not null default 'Menunggu' check (status in ('Menunggu', 'Disetujui', 'Ditolak')),
  catatan_guru text,
  diproses_oleh text references public.pengguna(id) on delete set null,
  diproses_pada timestamptz,
  dibuat timestamptz not null default now(),
  constraint chk_tanggal_izin check (tanggal_selesai >= tanggal_mulai)
);

create index if not exists idx_pengajuan_izin_siswa on public.pengajuan_izin(siswa_id, dibuat desc);
create index if not exists idx_pengajuan_izin_kelas_status on public.pengajuan_izin(kelas_id, status, dibuat desc);

alter table public.pengajuan_izin enable row level security;

drop policy if exists "baca_izin_sesuai_hak" on public.pengajuan_izin;
create policy "baca_izin_sesuai_hak" on public.pengajuan_izin
  for select using (
    public.peran_saya() in ('Admin', 'Guru') or
    siswa_id = public.siswa_id_saya()
  );

drop policy if exists "siswa_ajukan_izin" on public.pengajuan_izin;
create policy "siswa_ajukan_izin" on public.pengajuan_izin
  for insert with check (
    public.peran_saya() = 'Siswa' and
    siswa_id = public.siswa_id_saya() and
    status = 'Menunggu' and
    kelas_id = (select kelas_id from public.siswa where id = public.siswa_id_saya() limit 1)
  );

drop policy if exists "guru_admin_kelola_izin" on public.pengajuan_izin;
create policy "guru_admin_kelola_izin" on public.pengajuan_izin
  for update using (public.peran_saya() in ('Admin', 'Guru'));

drop policy if exists "batal_izin_menunggu" on public.pengajuan_izin;
create policy "batal_izin_menunggu" on public.pengajuan_izin
  for delete using (
    public.peran_saya() = 'Admin' or
    (public.peran_saya() = 'Siswa' and siswa_id = public.siswa_id_saya() and status = 'Menunggu')
  );

-- 4. Supabase Storage Buckets Privat (`bukti-izin` & `foto-presensi`) + RLS
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('bukti-izin', 'bukti-izin', false, 3145728, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('foto-presensi', 'foto-presensi', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "siswa_unggah_berkas_sendiri" on storage.objects;
create policy "siswa_unggah_berkas_sendiri" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('bukti-izin', 'foto-presensi') and
    (storage.foldername(name))[1] = public.siswa_id_saya()
  );

drop policy if exists "baca_berkas_presensi_sesuai_hak" on storage.objects;
create policy "baca_berkas_presensi_sesuai_hak" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('bukti-izin', 'foto-presensi') and
    (
      public.peran_saya() in ('Admin', 'Guru') or
      (storage.foldername(name))[1] = public.siswa_id_saya()
    )
  );

-- 5. Fungsi SQL Aman Tahap 2

-- 5a. Ambil Nama & Nomor WA Wali Kelas tanpa membuka tabel pengguna
create or replace function public.info_wali_kelas(p_kelas_id text)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_peran text;
  v_siswa_id text;
  v_boleh boolean := false;
  v_wali record;
begin
  v_peran := public.peran_saya();
  if v_peran in ('Admin', 'Guru') then
    v_boleh := true;
  elsif v_peran = 'Siswa' then
    v_siswa_id := public.siswa_id_saya();
    select exists(
      select 1 from public.siswa where id = v_siswa_id and kelas_id = p_kelas_id
    ) into v_boleh;
  end if;

  if not v_boleh then
    return null;
  end if;

  select p.id, p.nama_lengkap, p.nomor_hp
  into v_wali
  from public.kelas k
  join public.pengguna p on p.id = k.wali_guru_id
  where k.id = p_kelas_id
  limit 1;

  if not found then
    return null;
  end if;

  return json_build_object(
    'id', v_wali.id,
    'nama_lengkap', v_wali.nama_lengkap,
    'nomor_hp', v_wali.nomor_hp
  );
end;
$$;

-- 5b. Guru/Admin Membuka Sesi Absen Mandiri (Kode Unik/QR + Selfie + GPS)
create or replace function public.buka_sesi_mandiri(
  p_kelas_id text,
  p_tanggal date default current_date,
  p_judul text default '',
  p_durasi_menit int default 30,
  p_wajib_selfie boolean default true,
  p_wajib_gps boolean default true
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_guru_id text;
  v_pertemuan_id text;
  v_kode text;
  v_berlaku timestamptz;
begin
  if public.peran_saya() not in ('Guru', 'Admin') then
    return json_build_object('ok', false, 'pesan', 'Hanya Guru atau Admin yang berhak membuka sesi absen mandiri.');
  end if;

  v_guru_id := public.pengguna_id_saya();
  v_pertemuan_id := 'PRT-' || to_char(coalesce(p_tanggal, current_date), 'YYYYMMDD') || '-' || substring(md5(random()::text) from 1 for 6);
  v_kode := lpad((floor(random() * 900000) + 100000)::int::text, 6, '0');
  v_berlaku := now() + (greatest(coalesce(p_durasi_menit, 30), 5) || ' minutes')::interval;

  insert into public.pertemuan (
    id, kelas_id, guru_id, tanggal, judul_materi, catatan,
    mode_mandiri, kode_berlaku_sampai, wajib_selfie, wajib_gps
  )
  values (
    v_pertemuan_id,
    p_kelas_id,
    v_guru_id,
    coalesce(p_tanggal, current_date),
    coalesce(nullif(trim(p_judul), ''), 'Sesi Absen Mandiri'),
    'Sesi presensi mandiri siswa dibuka',
    true,
    v_berlaku,
    coalesce(p_wajib_selfie, true),
    coalesce(p_wajib_gps, true)
  );

  insert into public.sesi_mandiri_kode (pertemuan_id, kode_sesi, dibuat_oleh)
  values (v_pertemuan_id, v_kode, v_guru_id);

  return json_build_object(
    'ok', true,
    'pertemuan_id', v_pertemuan_id,
    'kode_sesi', v_kode,
    'kode_berlaku_sampai', v_berlaku,
    'wajib_selfie', coalesce(p_wajib_selfie, true),
    'wajib_gps', coalesce(p_wajib_gps, true),
    'pesan', 'Sesi absen mandiri berhasil dibuka.'
  );
exception
  when others then
    return json_build_object('ok', false, 'pesan', SQLERRM);
end;
$$;

-- 5c. Tutup Sesi Absen Mandiri lebih awal oleh Guru/Admin
create or replace function public.tutup_sesi_mandiri(p_pertemuan_id text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.peran_saya() not in ('Guru', 'Admin') then
    return json_build_object('ok', false, 'pesan', 'Tidak berhak menutup sesi.');
  end if;

  update public.pertemuan
  set kode_berlaku_sampai = now()
  where id = p_pertemuan_id;

  return json_build_object('ok', true, 'pesan', 'Sesi absen mandiri ditutup.');
end;
$$;

-- 5d. Daftar Sesi Absen Mandiri yang Sedang Aktif untuk Siswa (tanpa bocorkan kode_sesi)
create or replace function public.sesi_absen_aktif_siswa()
returns table (
  pertemuan_id text,
  kelas_id text,
  tanggal date,
  judul_materi text,
  kode_berlaku_sampai timestamptz,
  wajib_selfie boolean,
  wajib_gps boolean,
  sudah_absen boolean,
  status_absen text,
  waktu_check_in timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as pertemuan_id,
    p.kelas_id,
    p.tanggal,
    p.judul_materi,
    p.kode_berlaku_sampai,
    p.wajib_selfie,
    p.wajib_gps,
    (a.id is not null) as sudah_absen,
    a.status as status_absen,
    a.waktu_check_in
  from public.siswa s
  join public.pertemuan p on p.kelas_id = s.kelas_id
  left join public.absensi a on a.pertemuan_id = p.id and a.siswa_id = s.id
  where s.id = public.siswa_id_saya()
    and p.mode_mandiri = true
    and (p.kode_berlaku_sampai is null or p.kode_berlaku_sampai >= now())
    and p.tanggal >= current_date - interval '1 day'
  order by p.dibuat desc
  limit 10;
$$;

-- 5e. Simpan Check-In Absen Mandiri Siswa (Validasi Kode, Selfie, & Haversine GPS)
create or replace function public.absen_mandiri_siswa(
  p_kode_sesi text,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_foto_selfie_path text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_siswa record;
  v_pertemuan record;
  v_lat_sekolah double precision;
  v_lng_sekolah double precision;
  v_radius_maks int;
  v_dlat double precision;
  v_dlng double precision;
  v_a double precision;
  v_jarak int := null;
  v_absensi_id text;
  v_existing record;
begin
  if public.peran_saya() <> 'Siswa' then
    return json_build_object('ok', false, 'pesan', 'Hanya akun Siswa yang dapat melakukan absen mandiri.');
  end if;

  select id, kelas_id, nama_lengkap
  into v_siswa
  from public.siswa
  where id = public.siswa_id_saya()
  limit 1;

  if not found then
    return json_build_object('ok', false, 'pesan', 'Profil siswa belum tertaut dengan akun ini.');
  end if;

  if nullif(trim(p_kode_sesi), '') is null then
    return json_build_object('ok', false, 'pesan', 'Harap masukkan kode sesi dari guru.');
  end if;

  select p.id, p.judul_materi, p.tanggal, p.kode_berlaku_sampai, p.wajib_selfie, p.wajib_gps
  into v_pertemuan
  from public.pertemuan p
  join public.sesi_mandiri_kode k on k.pertemuan_id = p.id
  where p.kelas_id = v_siswa.kelas_id
    and p.mode_mandiri = true
    and upper(trim(k.kode_sesi)) = upper(trim(p_kode_sesi))
  order by p.dibuat desc
  limit 1;

  if not found then
    return json_build_object('ok', false, 'pesan', 'Kode sesi tidak ditemukan atau bukan untuk kelas Anda.');
  end if;

  if v_pertemuan.kode_berlaku_sampai is not null and v_pertemuan.kode_berlaku_sampai < now() then
    return json_build_object('ok', false, 'pesan', 'Waktu absen mandiri untuk kode sesi ini sudah berakhir.');
  end if;

  select id, status into v_existing
  from public.absensi
  where pertemuan_id = v_pertemuan.id and siswa_id = v_siswa.id
  limit 1;

  if found and v_existing.status = 'Hadir' then
    return json_build_object('ok', false, 'pesan', 'Anda sudah tercatat Hadir pada sesi pertemuan ini.');
  end if;

  if v_pertemuan.wajib_selfie and nullif(trim(p_foto_selfie_path), '') is null then
    return json_build_object('ok', false, 'pesan', 'Sesi ini mewajibkan foto selfie sebagai bukti kehadiran.');
  end if;

  if v_pertemuan.wajib_gps then
    if p_latitude is null or p_longitude is null then
      return json_build_object('ok', false, 'pesan', 'Sesi ini mewajibkan lokasi GPS. Pastikan izin lokasi aktif.');
    end if;

    select coalesce(max(case when kunci = 'lokasi_sekolah_lat' then nilai end), '-6.200000')::double precision,
           coalesce(max(case when kunci = 'lokasi_sekolah_lng' then nilai end), '106.816666')::double precision,
           coalesce(max(case when kunci = 'radius_absen_meter' then nilai end), '150')::int
    into v_lat_sekolah, v_lng_sekolah, v_radius_maks
    from public.pengaturan;

    v_dlat := radians(p_latitude - v_lat_sekolah);
    v_dlng := radians(p_longitude - v_lng_sekolah);
    v_a := power(sin(v_dlat / 2), 2) +
           cos(radians(v_lat_sekolah)) * cos(radians(p_latitude)) * power(sin(v_dlng / 2), 2);
    v_jarak := round(6371000 * 2 * asin(least(1.0, sqrt(v_a))))::int;

    if v_jarak > greatest(v_radius_maks, 20) then
      return json_build_object(
        'ok', false,
        'jarak_meter', v_jarak,
        'radius_maks', v_radius_maks,
        'pesan', format('Lokasi Anda berjarak %s m dari sekolah (batas maksimal %s m).', v_jarak, v_radius_maks)
      );
    end if;
  end if;

  v_absensi_id := 'ABS-' || substring(md5(random()::text) from 1 for 10);

  insert into public.absensi (
    id, pertemuan_id, siswa_id, status, catatan,
    metode, foto_selfie_path, latitude, longitude, jarak_meter, waktu_check_in
  )
  values (
    v_absensi_id,
    v_pertemuan.id,
    v_siswa.id,
    'Hadir',
    case when v_jarak is not null then format('Check-in mandiri (%s m)', v_jarak) else 'Check-in mandiri' end,
    'Mandiri',
    nullif(trim(p_foto_selfie_path), ''),
    p_latitude,
    p_longitude,
    v_jarak,
    now()
  )
  on conflict (pertemuan_id, siswa_id)
  do update set
    status = 'Hadir',
    catatan = excluded.catatan,
    metode = 'Mandiri',
    foto_selfie_path = coalesce(excluded.foto_selfie_path, public.absensi.foto_selfie_path),
    latitude = coalesce(excluded.latitude, public.absensi.latitude),
    longitude = coalesce(excluded.longitude, public.absensi.longitude),
    jarak_meter = coalesce(excluded.jarak_meter, public.absensi.jarak_meter),
    waktu_check_in = now();

  return json_build_object(
    'ok', true,
    'pertemuan_id', v_pertemuan.id,
    'judul_materi', v_pertemuan.judul_materi,
    'jarak_meter', v_jarak,
    'waktu_check_in', now(),
    'pesan', 'Presensi mandiri berhasil dicatat!'
  );
exception
  when others then
    return json_build_object('ok', false, 'pesan', SQLERRM);
end;
$$;

-- 5f. Guru/Admin Menyetujui atau Menolak Pengajuan Izin/Sakit
create or replace function public.proses_pengajuan_izin(
  p_pengajuan_id text,
  p_keputusan text,
  p_catatan_guru text default ''
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_izin record;
  v_guru_id text;
  v_prt record;
  v_absensi_id text;
  v_sinkron int := 0;
begin
  if public.peran_saya() not in ('Guru', 'Admin') then
    return json_build_object('ok', false, 'pesan', 'Hanya Guru atau Admin yang berhak memproses pengajuan izin.');
  end if;

  if p_keputusan not in ('Disetujui', 'Ditolak') then
    return json_build_object('ok', false, 'pesan', 'Keputusan harus Disetujui atau Ditolak.');
  end if;

  select * into v_izin from public.pengajuan_izin where id = p_pengajuan_id limit 1;
  if not found then
    return json_build_object('ok', false, 'pesan', 'Data pengajuan izin tidak ditemukan.');
  end if;

  v_guru_id := public.pengguna_id_saya();

  update public.pengajuan_izin
  set
    status = p_keputusan,
    catatan_guru = nullif(trim(p_catatan_guru), ''),
    diproses_oleh = v_guru_id,
    diproses_pada = now()
  where id = p_pengajuan_id;

  -- Jika disetujui, sinkronkan otomatis ke sesi pertemuan yang ada di rentang tanggal izin
  if p_keputusan = 'Disetujui' then
    for v_prt in
      select id from public.pertemuan
      where kelas_id = v_izin.kelas_id
        and tanggal between v_izin.tanggal_mulai and v_izin.tanggal_selesai
    loop
      v_absensi_id := 'ABS-' || substring(md5(random()::text) from 1 for 10);
      insert into public.absensi (id, pertemuan_id, siswa_id, status, catatan, metode)
      values (v_absensi_id, v_prt.id, v_izin.siswa_id, v_izin.jenis, v_izin.alasan, 'IzinOnline')
      on conflict (pertemuan_id, siswa_id)
      do update set
        status = excluded.status,
        catatan = excluded.catatan,
        metode = 'IzinOnline';
      v_sinkron := v_sinkron + 1;
    end loop;
  end if;

  return json_build_object(
    'ok', true,
    'status', p_keputusan,
    'tersinkron', v_sinkron,
    'pesan', format('Pengajuan %s (%s).', lower(p_keputusan), case when v_sinkron > 0 then format('%s pertemuan diperbarui', v_sinkron) else 'siap diterapkan pada pertemuan tanggal terkait' end)
  );
exception
  when others then
    return json_build_object('ok', false, 'pesan', SQLERRM);
end;
$$;

-- 5g. Perbarui presensi batch pada sesi pertemuan yang sudah dibuat (mis. setelah Absen Mandiri)
create or replace function public.simpan_presensi_sesi_aktif(
  p_pertemuan_id text,
  p_items jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_absensi_id text;
  v_count int := 0;
begin
  if public.peran_saya() not in ('Guru', 'Admin') then
    return json_build_object('ok', false, 'pesan', 'Hanya Guru atau Admin yang berhak memperbarui presensi.');
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_absensi_id := 'ABS-' || substring(md5(random()::text) from 1 for 10);
    insert into public.absensi (id, pertemuan_id, siswa_id, status, catatan, metode)
    values (
      v_absensi_id,
      p_pertemuan_id,
      v_item->>'siswa_id',
      v_item->>'status',
      nullif(v_item->>'catatan', ''),
      coalesce(nullif(v_item->>'metode', ''), 'Guru')
    )
    on conflict (pertemuan_id, siswa_id)
    do update set
      status = excluded.status,
      catatan = coalesce(excluded.catatan, public.absensi.catatan);
    v_count := v_count + 1;
  end loop;

  return json_build_object('ok', true, 'jumlah_siswa', v_count, 'pesan', 'Presensi sesi berhasil diperbarui.');
end;
$$;

-- RPC 8: Simpan Nomor WhatsApp / HP Saya (untuk Guru / Admin agar tampil di Portal Siswa)
create or replace function public.simpan_nomor_hp_saya(p_nomor_hp text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pengguna public.pengguna%rowtype;
  v_bersih text;
begin
  select * into v_pengguna
  from public.pengguna
  where auth_uid = auth.uid() and status_aktif = true
  limit 1;

  if not found then
    return json_build_object('ok', false, 'pesan', 'Sesi pengguna tidak valid atau akun nonaktif.');
  end if;

  v_bersih := regexp_replace(coalesce(p_nomor_hp, ''), '[^0-9+]', '', 'g');
  if length(v_bersih) > 0 and length(regexp_replace(v_bersih, '[^0-9]', '', 'g')) < 8 then
    return json_build_object('ok', false, 'pesan', 'Nomor WhatsApp minimal 8 digit angka.');
  end if;

  update public.pengguna
  set nomor_hp = nullif(left(v_bersih, 24), '')
  where id = v_pengguna.id;

  return json_build_object(
    'ok', true,
    'nomor_hp', nullif(left(v_bersih, 24), ''),
    'pesan', 'Nomor WhatsApp berhasil diperbarui.'
  );
end;
$$;

grant execute on function public.info_wali_kelas to authenticated;
grant execute on function public.buka_sesi_mandiri to authenticated;
grant execute on function public.tutup_sesi_mandiri to authenticated;
grant execute on function public.sesi_absen_aktif_siswa to authenticated;
grant execute on function public.absen_mandiri_siswa to authenticated;
grant execute on function public.proses_pengajuan_izin to authenticated;
grant execute on function public.simpan_presensi_sesi_aktif to authenticated;
grant execute on function public.simpan_nomor_hp_saya to authenticated;

-- ==============================================================================
-- DATA AWAL SISTEM (SEED DATA)
-- ==============================================================================
insert into public.pengaturan (kunci, nilai) values
  ('nama_sekolah', 'SMP Negeri 1 Teladan'),
  ('tahun_ajaran', '2026/2027'),
  ('semester', 'Ganjil'),
  ('toleransi_alfa_maks', '3')
on conflict (kunci) do update set nilai = excluded.nilai;

insert into public.pengaturan (kunci, nilai) values
  ('lokasi_sekolah_lat', '-6.200000'),
  ('lokasi_sekolah_lng', '106.816666'),
  ('radius_absen_meter', '150')
on conflict (kunci) do nothing;

-- Akun awal contoh dan kelas contoh akan dibuat secara otomatis
-- oleh skrip `node alat/buat-akun-awal.mjs` menggunakan Supabase Auth Admin.

