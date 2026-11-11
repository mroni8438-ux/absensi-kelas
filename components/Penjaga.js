'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getActiveSession, setActiveSession } from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Penjaga({ children, allowedRoles = [], peranDiizinkan = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  const rolesKey = (allowedRoles.length > 0 ? allowedRoles : peranDiizinkan).join(',');

  useEffect(() => {
    let aktif = true;

    async function periksaSesi() {
      const user = getActiveSession();

      // 1. Jika belum masuk, arahkan ke layar login
      if (!user) {
        router.replace('/masuk');
        return;
      }

      // 2. Verifikasi sesi Supabase aktif bila mode produksi aktif
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getSession();
        if (!data?.session) {
          setActiveSession(null);
          if (aktif) router.replace('/masuk');
          return;
        }
      }

      // 3. Jika akun wajib ganti sandi (P4), kunci ke layar /ganti-sandi-wajib
      if (user.wajib_ganti_sandi && pathname !== '/ganti-sandi-wajib') {
        router.replace('/ganti-sandi-wajib');
        return;
      }

      // 4. Cek peran akses jika dibatasi
      const daftarPeran = rolesKey ? rolesKey.split(',') : [];
      if (daftarPeran.length > 0 && !daftarPeran.includes(user.peran)) {
        if (user.peran === 'Guru') router.replace('/guru');
        else if (user.peran === 'Siswa') router.replace('/siswa');
        else if (user.peran === 'Admin') router.replace('/admin/kelas');
        return;
      }

      if (aktif) setAuthorized(true);
    }

    periksaSesi();
    return () => { aktif = false; };
  }, [router, pathname, rolesKey]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Memeriksa hak akses sistem...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
