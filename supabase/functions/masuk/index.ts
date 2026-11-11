import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Tangani preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { identitas, sandi } = await req.json();
    const cleanId = (identitas || "").trim().toLowerCase();

    if (!cleanId || !sandi) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Harap isi ID/username/email dan kata sandi." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("KUNCI_RAHASIA") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Server belum terkonfigurasi dengan benar." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // Klien Admin (Service Role) untuk query tabel pengguna & update status kunci
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // 1. Cari baris pengguna berdasarkan username, email, atau id
    const { data: userRows, error: searchError } = await adminClient
      .from("pengguna")
      .select("*")
      .or(`username.ilike.${cleanId},email.ilike.${cleanId},id.ilike.${cleanId}`)
      .limit(1);

    if (searchError || !userRows || userRows.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, pesan: "ID/username/email atau PIN/password salah." }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const user = userRows[0];

    // 2. Cek status aktif
    if (user.status_aktif !== "Aktif") {
      return new Response(
        JSON.stringify({ ok: false, pesan: "Akun Anda berstatus nonaktif. Silakan hubungi Administrator Sekolah." }),
        { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 3. Cek penguncian akun (Brute-Force Protection 15 Menit)
    const now = new Date();
    if (user.terkunci_sampai && new Date(user.terkunci_sampai) > now) {
      const sisaMenit = Math.ceil((new Date(user.terkunci_sampai).getTime() - now.getTime()) / (1000 * 60));
      return new Response(
        JSON.stringify({
          ok: false,
          terkunci: true,
          pesan: `Akun Anda terkunci sementara karena salah memasukkan sandi 5x. Silakan coba lagi dalam ${sisaMenit} menit.`
        }),
        { status: 423, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 4. Verifikasi kredensial ke Supabase Auth menggunakan email & password
    const authClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: user.email,
      password: sandi,
    });

    if (authError || !authData.session) {
      // Login gagal: naikkan hitungan gagal_masuk
      const newGagal = (user.gagal_masuk || 0) + 1;
      let terkunciSampai: string | null = null;

      if (newGagal >= 5) {
        // Kunci akun selama 15 menit
        const lockTime = new Date(now.getTime() + 15 * 60 * 1000);
        terkunciSampai = lockTime.toISOString();
      }

      await adminClient
        .from("pengguna")
        .update({
          gagal_masuk: newGagal,
          terkunci_sampai: terkunciSampai
        })
        .eq("id", user.id);

      if (newGagal >= 5) {
        return new Response(
          JSON.stringify({
            ok: false,
            terkunci: true,
            pesan: "Akun Anda terkunci sementara selama 15 menit karena 5 kali percobaan gagal."
          }),
          { status: 423, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ ok: false, pesan: "ID/username/email atau PIN/password salah." }),
        { status: 401, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 5. Login berhasil: reset gagal_masuk dan terkunci_sampai
    await adminClient
      .from("pengguna")
      .update({
        gagal_masuk: 0,
        terkunci_sampai: null
      })
      .eq("id", user.id);

    // Kembalikan token sesi dan profil pengguna (tanpa membuka password/data rahasia)
    return new Response(
      JSON.stringify({
        ok: true,
        sesi: authData.session,
        pengguna: {
          id: user.id,
          username: user.username,
          email: user.email,
          nama_lengkap: user.nama_lengkap,
          peran: user.peran,
          status_aktif: user.status_aktif,
          wajib_ganti_sandi: user.wajib_ganti_sandi || false,
        }
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, pesan: "Terjadi kesalahan internal pada server autentikasi." }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});

