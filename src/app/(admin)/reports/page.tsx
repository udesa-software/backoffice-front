'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  fetchReports,
  suspendFromReports,
  resolveReports,
  discardReport,
  ReportGroup,
} from '@/api/admin';

const REASON_LABELS: Record<string, string> = {
  inappropriate_content: 'Contenido inapropiado',
  harassment: 'Acoso o comportamiento abusivo',
  spam: 'Spam',
  fake_profile: 'Perfil falso',
  other: 'Otro',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Modal para pedir motivo al suspender
function SuspendModal({
  username,
  onConfirm,
  onCancel,
}: {
  username: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-white font-semibold text-lg mb-1">Suspender cuenta</h2>
        <p className="text-white/50 text-sm mb-4">
          Ingresá el motivo de suspensión para <span className="text-white font-medium">@{username}</span>.
        </p>
        <textarea
          className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
          rows={3}
          maxLength={500}
          placeholder="Motivo de suspensión..."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3 mt-4 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim()}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Confirmar suspensión
          </button>
        </div>
      </div>
    </div>
  );
}

// Fila expandible de un grupo de denuncias
function ReportRow({
  group,
  onAction,
  onDiscardReport,
  discardingReportIds,
}: {
  group: ReportGroup;
  onAction: (reportedId: string, action: 'suspend' | 'resolve') => void;
  onDiscardReport: (reportId: string) => void;
  discardingReportIds: Set<string>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
        {/* Acordeón toggle */}
        <td className="px-4 py-3 w-8">
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-white/40 hover:text-white transition-colors text-xs"
            title={expanded ? 'Colapsar' : 'Ver denuncias'}
          >
            {expanded ? '▼' : '▶'}
          </button>
        </td>

        {/* Usuario denunciado */}
        <td className="px-4 py-3">
          <span className="text-white font-medium">@{group.reported_username}</span>
        </td>

        {/* Severidad */}
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-400 font-bold text-sm">
            {group.total_reports}
          </span>
        </td>

        {/* Denunciantes distintos */}
        <td className="px-4 py-3 text-center text-white/70 text-sm">
          {group.distinct_reporters}
        </td>

        {/* Última denuncia */}
        <td className="px-4 py-3 text-white/50 text-sm">
          {formatDate(group.last_reported_at)}
        </td>

        {/* Acciones */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction(group.reported_id, 'suspend')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/40 hover:text-red-300 transition-colors"
            >
              Suspender
            </button>
            <button
              onClick={() => onAction(group.reported_id, 'resolve')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/40 hover:text-green-300 transition-colors"
            >
              Resolver caso
            </button>
          </div>
        </td>
      </tr>

      {/* Detalle expandido: denuncias individuales */}
      {expanded && (
        <tr className="bg-white/[0.02]">
          <td colSpan={6} className="px-8 py-3">
            <div className="space-y-2">
              {group.reports.map(r => (
                <div
                  key={r.id}
                  className="flex items-start gap-4 text-sm text-white/60 border-l-2 border-white/10 pl-3"
                >
                  <span className="shrink-0 text-white/40 w-36">{formatDate(r.reported_at)}</span>
                  <span className="shrink-0 text-white/70">@{r.reporter_username}</span>
                  <span className="shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">
                      {REASON_LABELS[r.reason] ?? r.reason}
                    </span>
                  </span>
                  {r.reason_detail && (
                    <span className="text-white/50 italic">"{r.reason_detail}"</span>
                  )}
                  <button
                    onClick={() => onDiscardReport(r.id)}
                    disabled={discardingReportIds.has(r.id)}
                    className="ml-auto shrink-0 px-2 py-0.5 rounded text-xs bg-white/10 text-white/50 hover:bg-white/20 hover:text-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {discardingReportIds.has(r.id) ? '...' : 'Descartar'}
                  </button>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ReportsPage() {
  const [groups, setGroups]     = useState<ReportGroup[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [discardingReportIds, setDiscardingReportIds] = useState<Set<string>>(new Set());

  // Modal de suspensión
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; username: string } | null>(null);

  const LIMIT = 20;

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await fetchReports({ page: p, limit: LIMIT });
      setGroups(data.groups);
      setTotal(data.total);
      setPage(p);
    } catch {
      setActionError('Error al cargar las denuncias.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const handleAction = useCallback((reportedId: string, action: 'suspend' | 'resolve') => {
    if (action === 'suspend') {
      const group = groups.find(g => g.reported_id === reportedId);
      setSuspendTarget({ id: reportedId, username: group?.reported_username ?? reportedId });
      return;
    }
    executeAction(reportedId, action);
  }, [groups]);

  async function executeAction(reportedId: string, action: 'suspend' | 'resolve', reason?: string) {
    setActionError(null);
    try {
      if (action === 'suspend')  await suspendFromReports(reportedId, reason!);
      if (action === 'resolve')  await resolveReports(reportedId);
      await load(page);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Error al ejecutar la acción.';
      setActionError(msg);
    }
  }

  const handleDiscardReport = useCallback(async (reportId: string) => {
    setDiscardingReportIds(prev => new Set(prev).add(reportId));
    setActionError(null);
    try {
      await discardReport(reportId);
      await load(page);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Error al descartar la denuncia.';
      setActionError(msg);
    } finally {
      setDiscardingReportIds(prev => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }
  }, [load, page]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Gestión de Denuncias</h1>
      <p className="text-gray-500 text-sm mb-6">
        Casos pendientes ordenados por severidad (cantidad de reportes recibidos).
      </p>

      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <span className="text-4xl mb-3">🎉</span>
          <p className="text-lg font-medium text-gray-700">No hay denuncias pendientes</p>
          <p className="text-sm mt-1 text-gray-500">Todos los casos han sido resueltos o descartados.</p>
        </div>
      ) : (
        <>
          <div className="bg-[#1A1A2E] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3 text-left">Usuario denunciado</th>
                  <th className="px-4 py-3 text-center">Denuncias</th>
                  <th className="px-4 py-3 text-center">Denunciantes</th>
                  <th className="px-4 py-3 text-left">Última denuncia</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(group => (
                  <ReportRow
                    key={group.reported_id}
                    group={group}
                    onAction={handleAction}
                    onDiscardReport={handleDiscardReport}
                    discardingReportIds={discardingReportIds}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-white/40">
              <span>{total} casos pendientes</span>
              <div className="flex gap-2">
                <button
                  onClick={() => load(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <span className="px-3 py-1.5 text-white/60">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => load(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de suspensión */}
      {suspendTarget && (
        <SuspendModal
          username={suspendTarget.username}
          onConfirm={async reason => {
            setSuspendTarget(null);
            await executeAction(suspendTarget.id, 'suspend', reason);
          }}
          onCancel={() => setSuspendTarget(null)}
        />
      )}
    </div>
  );
}
