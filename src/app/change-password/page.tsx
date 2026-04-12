'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import type { ApiError } from '@/features/auth/types';

export default function ChangePassword() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/');
    }
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
        currentPassword,
        newPassword,
        confirmPassword,
      });

      // Cambio exitoso: limpiar sesión y volver al login para que se loguee con la nueva
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      router.push('/');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: ApiError } })?.response?.data?.error ||
        'Error al cambiar la contraseña';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page-container">
      <div className="page-content">
        <div className="auth-card">
          <h1 className="auth-title">Cambiar contraseña</h1>
          <p className="auth-subtitle">
            Debés cambiar tu contraseña temporal antes de continuar
          </p>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input
              id="currentPassword"
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              id="newPassword"
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              id="confirmPassword"
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" isLoading={isLoading}>
              Cambiar contraseña
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
