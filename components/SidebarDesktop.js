'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getActiveSession, keluar } from '../lib/api';
import { useState, useEffect } from 'react';

export default function SidebarDesktop() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(getActiveSession());
  }, []);

  const handleLogout = async () => {
    await keluar();
    router.push('/masuk');
  };

  const role = user?.peran || 'Guru';

  const menuItems = [
    {
      label: 'Dasbor Utama',
      href: role === 'Admin' ? '/admin/kelas' : role === 'Siswa' ? '/siswa' : '/guru',
      icon: 'dashboard',
      roles: ['Admin', 'Guru', 'Siswa'],
    },
    {
      label: 'Input Presensi',
      href: '/guru/kelas/KLS-07A/pertemuan/baru',
      icon: 'edit_calendar',
      roles: ['Admin', 'Guru'],
    },
    {
      label: 'Rekap Bulanan',
      href: '/guru/kelas/KLS-07A/rekap',
      icon: 'analytics',
      roles: ['Admin', 'Guru'],
    },
    {
      label: 'Master Kelas & Siswa',
      href: '/admin/kelas',
      icon: 'groups',
      roles: ['Admin'],
    },
    {
      label: 'Kelola Pengguna',
      href: '/admin/pengguna',
      icon: 'manage_accounts',
      roles: ['Admin'],
    },
    {
      label: 'Profil & Keamanan',
      href: '/profil',
      icon: 'account_circle',
      roles: ['Admin', 'Guru', 'Siswa'],
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-surface border-r border-slate-200/80 min-h-screen p-5 justify-between select-none">
      <div>
        {/* Logo Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <svg className="w-7 h-7" viewBox="0 0 100 100" fill="none">
              <path d="M38 74 C26 74 12 70 4 64 L4 26 C14 30 26 32 38 32 Z" fill="#1E293B" />
              <path d="M42 74 C54 74 68 70 76 64 L76 26 C66 30 54 32 42 32 Z" fill="#6A76CC" />
              <rect x="38" y="31" width="4" height="43" rx="2" fill="#5863B5" />
              <path d="M40 23 C30 21 25 11 30 4 C35 9 37 16 40 23 Z" fill="#6A76CC" />
              <path d="M40 23 C50 21 55 11 50 4 C45 9 43 16 40 23 Z" fill="#48BB78" />
            </svg>
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-800 leading-tight">Absensi Kelas</h1>
            <p className="text-xs text-primary font-semibold tracking-wider">PRESENSI RESMI</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5">
          {menuItems
            .filter((item) => item.roles.includes(role))
            .map((item) => {
              const isActive = pathname === item.href || (item.href !== '/guru' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-full text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-soft font-bold'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>
      </div>

      {/* Profile & Logout Card at Base of Sidebar */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-page/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {user?.nama_lengkap?.charAt(0) || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.nama_lengkap || 'Pengguna'}</p>
              <p className="text-[11px] text-primary font-semibold truncate">{user?.peran || 'Guru'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

