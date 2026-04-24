'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export function LoginForm() {
  const { admin, isLoading, error, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!admin) return;
    if (admin.must_change_password) {
      router.push('/change-password');
    } else {
      router.push('/dashboard');
    }
  }, [admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  if (admin) return null;

  return (
    <div className="bg-[#1A1A2E] rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-[#6C63FF]">UdeSA</span>-migos
        </h1>
        <p className="text-sm text-white/50 mt-1">Panel de administración</p>
      </div>

      {error && (
        <div className="mb-4 text-sm bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="admin@udesa.edu.ar"
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30
                       focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full px-3 py-2.5 text-sm rounded-lg bg-white/5 border border-white/10 text-white
                       focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 text-sm font-semibold rounded-lg bg-[#6C63FF] text-white
                     hover:bg-[#5A52E0] disabled:opacity-50 transition-colors mt-2"
        >
          {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
