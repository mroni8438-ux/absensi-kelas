'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getActiveSession } from '../lib/api';
import { useState, useEffect } from 'react';

export default function NavigasiBawah() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [activeHash, setActiveHash] = useState('');

  useEffect(() => {
    setUser(getActiveSession());
    const syncHash = () => setActiveHash(window.location.hash || '');
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const role = user?.peran || 'Guru';

  const items = [
    {
      label: role === 'Siswa' ? 'Ringkasan' : 'Dasbor',
      href: role === 'Admin' ? '/admin/kelas' : role === 'Siswa' ? '/siswa#ringkasan' : '/guru',
      icon: 'dashboard',
    },
    {
      label: role === 'Siswa' ? 'Kalender' : 'Presensi',
      href: role === 'Siswa' ? '/siswa#kalender' : '/guru/kelas/KLS-07A/pertemuan/baru',
      icon: role === 'Siswa' ? 'calendar_month' : 'edit_calendar',
    },
    {
      label: role === 'Siswa' ? 'Riwayat' : 'Rekap',
      href: role === 'Admin' ? '/guru/kelas/KLS-07A/rekap' : role === 'Siswa' ? '/siswa#riwayat' : '/guru/kelas/KLS-07A/rekap',
      icon: role === 'Siswa' ? 'history' : 'analytics',
    },
    {
      label: 'Profil',
      href: '/profil',
      icon: 'person',
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 z-50 flex justify-around items-center shadow-lg">
      {items.map((item) => {
        const [itemPath, itemHash] = item.href.split('#');
        const isActive = itemHash
          ? pathname === itemPath && (activeHash === `#${itemHash}` || (itemHash === 'ringkasan' && !activeHash))
          : pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={() => setActiveHash(itemHash ? `#${itemHash}` : '')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-primary font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${isActive ? 'scale-110' : ''}`}>
              {item.icon}
            </span>
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

