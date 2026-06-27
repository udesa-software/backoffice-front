import apiClient from './apiClient';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  username: string;
  email: string;
  is_verified: boolean;
  is_suspended: boolean;
  under_review: boolean;
  deleted_at: string | null;
  created_at: string;
  last_login_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
  biography?: string | null;
  search_radius_km?: number;
  location_update_frequency?: number;
}

export interface UsersPage {
  users: AppUser[];
  total: number;
  page: number;
  limit: number;
}

export interface Metrics {
  total_users: string;
  new_this_month: string;
  new_this_week: string;
  suspended_users: string;
  deleted_users: string;
  online_now: string;
  weekly_registrations: { day: string; count: string }[];
}

export interface ServiceStatus {
  name: string;
  isUp: boolean;
}

export interface Admin {
  id: string;
  email: string;
  role: 'superadmin' | 'moderator';
  must_change_password: boolean;
  created_at: string;
  locked_until: string | null;
}

// ── Usuarios (H4, H5) ─────────────────────────────────────────────────────────

export const fetchUsers = (params: { search?: string; page?: number; limit?: number }) =>
  apiClient.get<UsersPage>('/api/admin/users', { params }).then(r => r.data);

export const fetchUser = (id: string) =>
  apiClient.get<AppUser>(`/api/admin/users/${id}`).then(r => r.data);

export const suspendUser = (id: string, reason: string) =>
  apiClient.post(`/api/admin/users/${id}/suspend`, { reason }).then(r => r.data);

export const unsuspendUser = (id: string, reason?: string) =>
  apiClient.post(`/api/admin/users/${id}/unsuspend`, { reason }).then(r => r.data);

// H9: resolver revisión automática generada por reportes de usuarios
export const resolveUserReview = (id: string, reason?: string) =>
  apiClient.post(`/api/admin/users/${id}/resolve-review`, { reason }).then(r => r.data);

// ── Métricas (H3) ─────────────────────────────────────────────────────────────

export const fetchMetrics = () =>
  apiClient.get<Metrics>('/api/admin/metrics').then(r => r.data);

// ── Health (H11) ─────────────────────────────────────────────────────────────

export const fetchServicesHealth = () =>
  apiClient.get<{ services: ServiceStatus[] }>('/api/admin/services/health').then(r => r.data);

// ── Denuncias (H7) ───────────────────────────────────────────────────────────

export interface ReportEntry {
  id: string;
  reporter_username: string;
  reason: string;
  reason_detail: string | null;
  reported_at: string;
}

export interface ReportGroup {
  reported_id: string;
  reported_username: string;
  total_reports: number;
  distinct_reporters: number;
  last_reported_at: string;
  reports: ReportEntry[];
}

export interface ReportsPage {
  groups: ReportGroup[];
  total: number;
  page: number;
  limit: number;
}

export const fetchReports = (params?: { page?: number; limit?: number }) =>
  apiClient.get<ReportsPage>('/api/admin/reports', { params }).then(r => r.data);

export const discardReports = (reportedId: string) =>
  apiClient.post(`/api/admin/reports/${reportedId}/discard`).then(r => r.data);

export const suspendFromReports = (reportedId: string, reason: string) =>
  apiClient.post(`/api/admin/reports/${reportedId}/suspend`, { reason }).then(r => r.data);

export const resolveReports = (reportedId: string) =>
  apiClient.post(`/api/admin/reports/${reportedId}/resolve`).then(r => r.data);

// ── Admins (H1) ──────────────────────────────────────────────────────────────

export const fetchAdmins = () =>
  apiClient.get<{ admins: Admin[] }>('/api/admin/admins').then(r => r.data);

export const createAdmin = (data: { email: string; role: 'superadmin' | 'moderator' }) =>
  apiClient.post('/api/admin/admins', data).then(r => r.data);

export const resetAdminPassword = (id: string) =>
  apiClient.post(`/api/admin/admins/${id}/reset-password`).then(r => r.data);
