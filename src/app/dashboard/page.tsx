'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/api/apiClient';
import { setAccessToken } from '@/api/apiClient';
import type { AdminUser } from '@/features/auth/types';

export default function Dashboard() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Intentar recuperar sesión: si hay cookie de RT, pedir un AT nuevo
    const stored = localStorage.getItem('adminData');
    if (!stored) {
      router.push('/');
      return;
    }

    setAdmin(JSON.parse(stored) as AdminUser);
    setLoading(false);
  }, [router]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/admin/auth/logout');
    } finally {
      setAccessToken(null);
      localStorage.removeItem('adminData');
      router.push('/');
    }
  };

  if (loading || !admin) return null;

  return (
    <main className="page-container">
      <div className="dashboard-card">
        <div className="dashboard-header">
          <div>
            <h1 className="auth-title">Panel de administración</h1>
            <p className="auth-subtitle">
              {admin.email} — <span className="role-badge">{admin.role}</span>
            </p>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
