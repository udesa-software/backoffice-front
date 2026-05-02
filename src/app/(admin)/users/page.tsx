'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchUsers, type AppUser } from '@/api/admin';

// ── Badge de estado de cuenta ─────────────────────────────────────────────────
function StatusBadge({ user }: { user: AppUser }) {
  if (user.deleted_at)
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Eliminado</span>;
  if (user.is_suspended)
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Suspendido</span>;
  if (!user.is_verified)
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">Sin verificar</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Activo</span>;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const LIMIT = 20;

  const load = useCallback(async (q: string, p: number) => {
    setLoading(true);
    try {
      const data = await fetchUsers({ search: q, page: p, limit: LIMIT });
      setUsers(data.users);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('adminData')) { router.push('/'); return; }
    load(search, page);
  }, [router, load, search, page]);

  // Debounce: espera 400ms después de escribir para no spamear peticiones
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} usuarios registrados</p>
        </div>
      </div>

      {/* H4 CA.2: búsqueda parcial */}
      <input
        type="search"
        placeholder="Buscar por email o username..."
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        className="w-full max-w-sm px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40"
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Usuario</th>
              <th className="text-left px-5 py-3 font-medium">Email</th>
              <th className="text-left px-5 py-3 font-medium">Estado</th>
              <th className="text-left px-5 py-3 font-medium">Registro</th>
              {/* H9 CA.2 */}
              <th className="text-left px-5 py-3 font-medium">Último login</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">@{u.username}</td>
                <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5"><StatusBadge user={u} /></td>
                <td className="px-5 py-3.5 text-gray-500">{formatDate(u.created_at)}</td>
                <td className="px-5 py-3.5 text-gray-500">{formatDate(u.last_login_at)}</td>
                <td className="px-5 py-3.5 text-right">
                  <Link
                    href={`/users/detail?id=${u.id}`}
                    className="text-[#6C63FF] text-xs font-medium hover:underline"
                  >
                    Ver detalle →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* H4 CA.3: paginación */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="text-gray-500">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
