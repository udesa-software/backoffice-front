'use client';

import { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { setAccessToken } from '@/api/apiClient';
import type { AdminUser, LoginResponse, ApiError } from '../types';

export function useAuth() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.post<LoginResponse>('/api/admin/auth/login', {
        email,
        password,
      });

      // AT en memoria, RT llega como cookie httpOnly automáticamente
      setAccessToken(data.accessToken);
      localStorage.setItem('adminData', JSON.stringify(data.admin));
      setAdmin(data.admin);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: ApiError } })?.response?.data?.error ||
        'Error al iniciar sesión';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/admin/auth/logout');
    } finally {
      setAccessToken(null);
      localStorage.removeItem('adminData');
      setAdmin(null);
    }
  };

  return { admin, isLoading, error, login, logout };
}
