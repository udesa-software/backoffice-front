'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { fetchUser, suspendUser, unsuspendUser, type AppUser } from '@/api/admin';

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function SuspendModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Suspender usuario</h2>
        <p className="text-sm text-gray-500 mb-4">
          Ingresá el motivo de la suspensión. El usuario perderá acceso inmediatamente.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Motivo de la suspensión..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400/40"
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
          >
            Suspender
          </button>
        </div>
      </div>
    </div>
  );
}

function UserDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('adminData')) { router.push('/'); return; }
    if (id) {
        fetchUser(id).then(setUser).finally(() => setLoading(false));
    } else {
        setLoading(false);
    }
  }, [id, router]);

  async function handleSuspend(reason: string) {
    if (!id) return;
    setShowModal(false);
    setActionLoading(true);
    try {
      await suspendUser(id, reason);
      const updated = await fetchUser(id);
      setUser(updated);
      setMessage({ type: 'ok', text: 'Usuario suspendido. Su sesión fue invalidada.' });
    } catch {
      setMessage({ type: 'err', text: 'Error al suspender el usuario' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnsuspend() {
    if (!id) return;
    setActionLoading(true);
    try {
      await unsuspendUser(id);
      const updated = await fetchUser(id);
      setUser(updated);
      setMessage({ type: 'ok', text: 'Suspensión levantada.' });
    } catch {
      setMessage({ type: 'err', text: 'Error al levantar la suspensión' });
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-gray-400">
        Usuario no encontrado o ID inválido. <Link href="/users" className="text-[#6C63FF] hover:underline">Volver</Link>
      </div>
    );
  }

  const statusLabel = user.deleted_at ? 'Eliminado'
    : user.is_suspended ? 'Suspendido'
    : !user.is_verified ? 'Sin verificar'
    : 'Activo';

  const statusColor = user.deleted_at ? 'bg-gray-100 text-gray-500'
    : user.is_suspended ? 'bg-red-100 text-red-700'
    : !user.is_verified ? 'bg-yellow-100 text-yellow-700'
    : 'bg-green-100 text-green-700';

  return (
    <div className="space-y-5 max-w-2xl">
      {showModal && (
        <SuspendModal
          onConfirm={handleSuspend}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="flex items-center gap-3">
        <Link href="/users" className="text-sm text-gray-400 hover:text-gray-600">← Usuarios</Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm text-gray-600">@{user.username}</span>
      </div>

      {message && (
        <div className={`rounded-lg px-4 py-3 text-sm ${
          message.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">@{user.username}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <Detail label="ID" value={<span className="font-mono text-xs">{user.id}</span>} />
          <Detail label="Fecha de registro" value={formatDate(user.created_at)} />
          <Detail label="Último login" value={formatDate(user.last_login_at)} />
          <Detail label="Email verificado" value={user.is_verified ? 'Sí' : 'No'} />
          <Detail label="Intentos fallidos" value={user.failed_login_attempts} />
          <Detail label="Bloqueado hasta" value={formatDate(user.locked_until)} />
          {user.biography && (
            <div className="col-span-2">
              <Detail label="Biografía" value={user.biography} />
            </div>
          )}
        </div>

        {!user.deleted_at && (
          <div className="mt-6 pt-5 border-t border-gray-100 flex gap-3">
            {user.is_suspended ? (
              <button
                onClick={handleUnsuspend}
                disabled={actionLoading}
                className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
              >
                {actionLoading ? 'Procesando...' : 'Levantar suspensión'}
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
              >
                Suspender usuario
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserDetailClient() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 bg-gray-100 rounded-xl" />}>
      <UserDetailContent />
    </Suspense>
  );
}
