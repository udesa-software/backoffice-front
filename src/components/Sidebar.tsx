'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAccessToken, setAccessToken } from '@/api/apiClient';
import apiClient from '@/api/apiClient';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/users',     label: 'Usuarios',   icon: '👥' },
  { href: '/admins',    label: 'Admins',      icon: '🛡' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await apiClient.post('/api/admin/auth/logout');
    } catch { /* ignorar errores de red al logout */ }
    setAccessToken(null);
    localStorage.removeItem('adminData');
    router.push('/');
  }

  return (
    <aside className="w-56 min-h-screen flex flex-col bg-[#0F0E17] text-white shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <span className="text-lg font-bold tracking-tight">
          <span className="text-[#6C63FF]">UdeSA</span>-migos
        </span>
        <p className="text-xs text-white/40 mt-0.5">Backoffice</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active
                  ? 'bg-[#6C63FF] text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span>⎋</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
