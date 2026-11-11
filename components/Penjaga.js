'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getActiveSession,
  setActiveSession,
  invalidateApiCache,
  shouldVerifySupabaseSession,
  markSessionVerified,
} from '../lib/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Penjaga({ children, allowedRoles = [], peranDiizinkan = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  const rolesKey = (allowedRoles.length > 0 ? allowedRoles : peranDiizinkan).join(',');

  useEffect(() => {
    let aktif = true;
    const user = getActiveSession();

    // 1. Jika belum masuk, arahkan ke layar login
    if (!user) {
      router.replace('/masuk');
      return;
    }

    // 2. Jika akun wajib ganti sandi (P4), kunci ke layar /ganti-sandi-wajib
    if (user.wajib_ganti_sandi && pathname !== '/ganti-sandi-wajib') {
      router.replace('/ganti-sandi-wajib');
      return;
    }

    // 3. Cek peran akses segera tanpa menahan layar di balik spinner
    const daftarPeran = rolesKey ? rolesKey.split(',') : [];
    if (daftarPeran.length > 0 && !daftarPeran.includes(user.peran)) {
      if (user.peran === 'Guru') router.replace('/guru');
      else if (user.peran === 'Siswa') router.replace('/siswa');
      else if (user.peran === 'Admin') router.replace('/admin/kelas');
      return;
    }

    setAuthorized(true);

    // 4. Verifikasi sesi Supabase di latar berkala (K9: tidak mengunci navigasi antar-menu)
    if (isSupabaseConfigured && supabase && shouldVerifySupabaseSession()) {
      supabase.auth.getSession().then(({ data }) => {
        if (!aktif) return;
        if (!data?.session) {
          setActiveSession(null);
          invalidateApiCache();
          router.replace('/masuk');
        } else {
          markSessionVerified();
        }
      }).catch(() => {});
    }

    return () => { aktif = false; };
  }, [router, pathname, rolesKey]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
