'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { fetchMetrics, fetchServicesHealth, type Metrics, type ServiceStatus } from '@/api/admin';

// ── Métricas card ────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Badge de estado de servicio ───────────────────────────────────────────────
function ServiceBadge({ service }: { service: ServiceStatus }) {
  return (
    <div className="flex items-center justify-between py-2.5 px-4 rounded-lg bg-gray-50 border border-gray-100">
      <span className="text-sm font-medium text-gray-700 capitalize">{service.name}</span>
      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
        ${service.isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${service.isUp ? 'bg-green-500' : 'bg-red-500'}`} />
        {service.isUp ? 'En línea' : 'Caído'}
      </span>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('adminData')) {
      router.push('/');
      return;
    }
    loadAll();
  }, [router]);

  async function loadAll() {
    setLoadingMetrics(true);
    setLoadingHealth(true);
    try {
      const [m, h] = await Promise.all([
        fetchMetrics(),
        fetchServicesHealth(),
      ]);
      setMetrics(m);
      setServices(h.services);
    } catch {
      setError('Error al cargar el dashboard');
    } finally {
      setLoadingMetrics(false);
      setLoadingHealth(false);
    }
  }

  // Formatea los datos del gráfico: convierte la fecha a nombre de día
  const chartData = metrics?.weekly_registrations.map(r => ({
    day: new Date(r.day).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
    Registros: parseInt(r.count, 10),
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Métricas y estado de la plataforma</p>
        </div>
        <button
          onClick={loadAll}
          className="text-sm text-[#6C63FF] hover:underline font-medium"
        >
          ↻ Actualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* H3 — Métricas */}
      {loadingMetrics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Usuarios totales" value={metrics.total_users} />
          <MetricCard label="Altas últimos 30 días" value={metrics.new_this_month} />
          <MetricCard label="Altas esta semana" value={metrics.new_this_week} />
          <MetricCard label="Online ahora" value={metrics.online_now} sub="activos en últimos 15 min" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* H3 CA.2 — Gráfico de barras: registros última semana */}
        <div className="lg:col-span-2 self-start bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Registros últimos 7 días</h2>
          {loadingMetrics ? (
            <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="Registros" fill="#6C63FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* H11 — Estado de microservicios */}
        <div className="self-start bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Estado de servicios</h2>
          {loadingHealth ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {services.map(s => <ServiceBadge key={s.name} service={s} />)}
              {services.length === 0 && (
                <p className="text-sm text-gray-400">No hay servicios configurados</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
