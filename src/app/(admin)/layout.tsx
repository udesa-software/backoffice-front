'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import apiClient, { getAccessToken, setAccessToken } from '@/api/apiClient';

// Lee el payload de un JWT sin verificar la firma.
// (la firma ya fue verificada por el servidor — acá solo leemos el contenido)
function jwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

// Layout para todas las páginas autenticadas del backoffice.
// "(admin)" es un route group de Next.js: agrupa páginas bajo un layout común
// sin cambiar la URL (ej: /dashboard, no /admin/dashboard).
//
// En cada carga de página este layout restaura la sesión ANTES de que las páginas
// hagan cualquier request, evitando el ciclo 401 → refresh → retry.
//
// Dos casos:
//   A) Login reciente → AT ya está en memoria → fast path, sin llamada de red
//   B) Page refresh  → AT perdido → recuperar con cookie RT (httpOnly, persiste)
//
// El ref `refreshing` evita la doble invocación de React Strict Mode (desarrollo),
// que correría /refresh dos veces en paralelo y rompería la rotación del RT.

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const refreshing = useRef(false); // guard contra Strict Mode double-invoke

  useEffect(() => {
    // Sin adminData en localStorage no hay sesión activa
    if (!localStorage.getItem('adminData')) {
      router.replace('/');
      return;
    }

    // ── Caso A: AT ya en memoria (login reciente en la misma pestaña) ──────────
    // No llamamos a /refresh: evitamos rotación innecesaria del RT y
    // el problema de doble invocación de Strict Mode.
    const token = getAccessToken();
    if (token) {
      const payload = jwtPayload(token);
      if (payload.must_change_password) {
        router.replace('/change-password');
      } else {
        setReady(true);
      }
      return;
    }

    // ── Caso B: AT perdido (F5 / link directo) ────────────────────────────────
    // Recuperar el AT usando la cookie httpOnly del RT que sí persiste entre cargas.
    // El ref evita que Strict Mode llame a /refresh dos veces en paralelo
    // (lo que rotaría el RT dos veces y dejaría el segundo intento con un RT inválido).
    if (refreshing.current) return;
    refreshing.current = true;

    apiClient
      .post<{ accessToken: string }>('/api/admin/auth/refresh')
      .then(({ data }) => {
        setAccessToken(data.accessToken);
        const payload = jwtPayload(data.accessToken);
        if (payload.must_change_password) {
          // Todavía tiene contraseña temporal → forzar cambio.
          // /change-password está FUERA de este layout → no causa loop.
          router.replace('/change-password');
        } else {
          setReady(true);
        }
      })
      .catch(() => {
        // RT expirado o revocado → sesión inválida, volver al login
        localStorage.removeItem('adminData');
        router.replace('/');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo en el montaje inicial

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400 animate-pulse">Cargando sesión…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
