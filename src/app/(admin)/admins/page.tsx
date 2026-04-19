'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAdmins, createAdmin, resetAdminPassword, type Admin } from '@/api/admin';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Formulario para crear nuevo admin (H1) ────────────────────────────────────
function CreateAdminForm({ onCreated }: { onCreated: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'superadmin' | 'moderator'>('moderator');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ tempPassword?: string; error?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const data = await createAdmin({ email: email.trim(), role });
      setResult({ tempPassword: data.admin?.temp_password ?? '(ver email)' });
      setEmail('');
      onCreated();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear admin';
      setResult({ error: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">Nuevo administrador</h2>

      {result?.error && (
        <div className="mb-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
          {result.error}
        </div>
      )}
      {result?.tempPassword && (
        <div className="mb-3 text-sm bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2">
          Admin creado. Contraseña temporal: <strong>{result.tempPassword}</strong>
          <br /><span className="text-xs text-green-600">Se envió por email. Expira en 24 horas.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email@udesa.edu.ar"
          required
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40"
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value as 'superadmin' | 'moderator')}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/40"
        >
          <option value="moderator">Moderador</option>
          <option value="superadmin">SuperAdmin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg bg-[#6C63FF] text-white hover:bg-[#5A52E0] disabled:opacity-40"
        >
          {loading ? 'Creando...' : 'Crear admin'}
        </button>
      </form>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentAdminRole, setCurrentAdminRole] = useState<string>('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchAdmins();
      setAdmins(data.admins);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Error al cargar los administradores';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem('adminData');
    if (!stored) { router.push('/'); return; }
    setCurrentAdminRole(JSON.parse(stored).role);
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleReset(id: string, email: string) {
    if (!confirm(`¿Regenerar contraseña temporal de ${email}?`)) return;
    try {
      const data = await resetAdminPassword(id);
      setResetMsg(`Nueva contraseña temporal para ${email}: ${data.temp_password}`);
    } catch {
      setResetMsg('Error al regenerar la contraseña');
    }
  }

  const isSuperAdmin = currentAdminRole === 'superadmin';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administradores</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestión del equipo de backoffice</p>
      </div>

      {/* H1 CA.2: solo superadmin puede crear admins */}
      {isSuperAdmin && <CreateAdminForm onCreated={load} />}

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
          {loadError}
          <button onClick={load} className="ml-3 text-red-500 hover:underline text-xs font-medium">Reintentar</button>
        </div>
      )}

      {resetMsg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm">
          {resetMsg}
          <button onClick={() => setResetMsg(null)} className="ml-3 text-blue-500 hover:underline text-xs">Cerrar</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-5 py-3 font-medium">Email</th>
              <th className="text-left px-5 py-3 font-medium">Rol</th>
              <th className="text-left px-5 py-3 font-medium">Estado</th>
              <th className="text-left px-5 py-3 font-medium">Creado</th>
              {isSuperAdmin && <th className="px-5 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  {[...Array(4)].map((_, j) => (
                    <td key={j} className="px-5 py-3.5">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : admins.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5 font-medium text-gray-900">{a.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                    ${a.role === 'superadmin' ? 'bg-[#EEF0FF] text-[#6C63FF]' : 'bg-gray-100 text-gray-600'}`}>
                    {a.role === 'superadmin' ? 'SuperAdmin' : 'Moderador'}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  {a.must_change_password ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Pendiente cambio de contraseña
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Activo
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-gray-500">{formatDate(a.created_at)}</td>
                {isSuperAdmin && (
                  <td className="px-5 py-3.5 text-right">
                    {a.must_change_password && (
                      <button
                        onClick={() => handleReset(a.id, a.email)}
                        className="text-xs text-[#6C63FF] hover:underline font-medium"
                      >
                        Regenerar contraseña
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
