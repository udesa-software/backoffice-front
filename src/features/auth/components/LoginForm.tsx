'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export function LoginForm() {
  const { admin, isLoading, error, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  // Redirigir según si debe cambiar contraseña o no
  if (admin) {
    if (admin.must_change_password) {
      router.push('/change-password');
    } else {
      router.push('/dashboard');
    }
    return null;
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">Backoffice</h1>
      <p className="auth-subtitle">Iniciá sesión con tu cuenta de administrador</p>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          id="password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Button type="submit" isLoading={isLoading}>
          Iniciar sesión
        </Button>
      </form>
    </div>
  );
}
