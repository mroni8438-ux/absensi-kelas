'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getActiveSession } from '../lib/api';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getActiveSession();
    if (!user) {
      router.replace('/masuk');
    } else if (user.wajib_ganti_sandi) {
      router.replace('/ganti-sandi-wajib');
    } else if (user.peran === 'Admin') {
      router.replace('/admin/kelas');
    } else if (user.peran === 'Siswa') {
      router.replace('/siswa');
    } else {
      router.replace('/guru');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-page">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

