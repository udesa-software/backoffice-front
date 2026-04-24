'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/api/apiClient';
import type { ApiError } from '@/features/auth/types';

export default function ChangePassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('adminData')) router.replace('/');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post('/api/admin/auth/change-password', {
        currentPassword, newPassword, confirmPassword,
      });
      localStorage.removeItem('adminData');
      router.replace('/');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: ApiError } })?.response?.data?.error ||
        'Error al cambiar la contraseña'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F0E17]">
      <div className="bg-[#1A1A2E] rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            <span className="text-[#6C63FF]">UdeSA</span>-migos
          </h1>
          <p className="text-sm text-white/50 mt-1">Cambiá tu contraseña temporal</p>
        </div>

        {error && (
          <div className="mb-4 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { id: 'cur',  label: 'Contraseña actual',          val: currentPassword,  set: setCurrentPassword },
            { id: 'new',  label: 'Nueva contraseña',           val: newPassword,      set: setNewPassword },
            { id: 'conf', label: 'Confirmar nueva contraseña', val: confirmPassword,  set: setConfirmPassword },
          ].map(({ id, label, val, set }) => (
            <div key={id}>
              <label className="block text-sm font-medium text-white/70 mb-1">{label}</label>
              <input
                type="password"
                value={val}
                onChange={e => set(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-lg bg-white/5 border border-white/10 text-white
                           focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 text-sm font-semibold rounded-lg bg-[#6C63FF] text-white
                       hover:bg-[#5A52E0] disabled:opacity-50 transition-colors mt-2"
          >
            {isLoading ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </main>
  );
}
