import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://absensi-kelas-hotd.vercel.app",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function buatSandiAcak(panjang = 10): string {
  // Karakter aman tanpa huruf ambigu (menghilangkan O, 0, I, l, 1)
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789#@!";
  const randomBytes = new Uint8Array(panjang);
  crypto.getRandomValues(randomBytes);
  let result = "Sekolah#";
  for (let i = 0; i < 4; i++) {
    result += charset[randomBytes[i] % charset.length];
  }
  return result;
}

serve(async (req: Request) => {
  const CORS_HEADERS = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Token autentikasi tidak ditemukan." }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("KUNCI_RAHASIA") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Server belum terkonfigurasi dengan benar." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 1. Verifikasi token pemanggil
    const { data: userData, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Sesi tidak valid atau telah berakhir." }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 2. Cek apakah pemanggil memiliki peran Admin di tabel pengguna
    const { data: callerRows, error: callerError } = await adminClient
      .from("pengguna")
      .select("id, peran, status_aktif")
      .eq("auth_uid", userData.user.id)
      .limit(1);

    if (callerError || !callerRows || callerRows.length === 0 || callerRows[0].peran !== "Admin" || callerRows[0].status_aktif !== "Aktif") {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Akses ditolak: Hanya Administrator yang berwenang mengatur ulang sandi staf." }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const callerId = callerRows[0].id;

    // 3. Baca idPengguna yang ingin direset
    const { idPengguna } = await req.json();
    if (!idPengguna) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "ID pengguna target wajib disertakan." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    if (idPengguna === callerId) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Administrator tidak dapat mengatur ulang sandinya sendiri melalui tombol ini. Gunakan menu Profil > Ganti Sandi." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 4. Cari pengguna target
    const { data: targetRows, error: targetError } = await adminClient
      .from("pengguna")
      .select("id, auth_uid, email, nama_lengkap")
      .eq("id", idPengguna)
      .limit(1);

    if (targetError || !targetRows || targetRows.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Pengguna target tidak ditemukan di database." }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const targetUser = targetRows[0];
    if (!targetUser.auth_uid) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Akun target belum memiliki auth_uid Supabase." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 5. Buat sandi sementara baru & perbarui ke Supabase Auth
    const sandiSementara = buatSandiAcak();

    const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(
      targetUser.auth_uid,
      { password: sandiSementara }
    );

    if (updateAuthError) {
      return new Response(
        JSON.stringify({ ok: false, pesan: `Gagal memperbarui sandi Auth: ${updateAuthError.message}` }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 6. Tandai wajib_ganti_sandi = true dan reset kunci akun
    await adminClient
      .from("pengguna")
      .update({
        wajib_ganti_sandi: true,
        gagal_masuk: 0,
        terkunci_sampai: null
      })
      .eq("id", targetUser.id);

    // Kembalikan sandi sementara SEKALI SAJA ke Admin
    return new Response(
      JSON.stringify({
        ok: true,
        sandiSementara,
        pesan: "Kata sandi sementara berhasil dibuat. Serahkan langsung ke pengguna."
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, pesan: "Terjadi kesalahan internal saat mengatur ulang sandi." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});

