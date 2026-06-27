import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersPage from './page';

// ── localStorage mock (jsdom sin URL no expone localStorage) ──────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: false });

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/api/admin', () => ({
  fetchUsers: vi.fn(),
  exportUsersCsv: vi.fn(),
}));

import { fetchUsers, exportUsersCsv } from '@/api/admin';

const mockFetchUsers = fetchUsers as ReturnType<typeof vi.fn>;
const mockExportUsersCsv = exportUsersCsv as ReturnType<typeof vi.fn>;

// ── Helpers ────────────────────────────────────────────────────────────────────

const MOCK_USERS = [
  { id: 'u1', username: 'alice', email: 'alice@test.com', is_verified: true, is_suspended: false, under_review: false, deleted_at: null, created_at: '2026-01-01T00:00:00Z', last_login_at: null, failed_login_attempts: 0, locked_until: null },
];

function setupStorage(role: string) {
  localStorageMock.setItem('adminData', JSON.stringify({ role }));
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('UsersPage — H8 Exportar CSV', () => {
  beforeEach(() => {
    vi.restoreAllMocks();   // restaura document.createElement y otros spies entre tests
    vi.clearAllMocks();
    localStorageMock.clear();
    mockFetchUsers.mockResolvedValue({ users: MOCK_USERS, total: 1, page: 1, limit: 20 });
  });

  // CA.2: visibilidad del botón según rol
  it('CA.2: muestra el botón "Exportar CSV" cuando el admin es superadmin', async () => {
    setupStorage('superadmin');
    render(<UsersPage />);
    expect(await screen.findByRole('button', { name: 'Exportar CSV' })).toBeInTheDocument();
  });

  it('CA.2: NO muestra el botón "Exportar CSV" cuando el admin es moderator', async () => {
    setupStorage('moderator');
    render(<UsersPage />);
    await screen.findByText('@alice');
    expect(screen.queryByRole('button', { name: 'Exportar CSV' })).not.toBeInTheDocument();
  });

  it('CA.2: NO muestra el botón si no hay adminData en localStorage (redirige al login)', async () => {
    render(<UsersPage />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
    expect(screen.queryByRole('button', { name: 'Exportar CSV' })).not.toBeInTheDocument();
  });

  // CA.1: descarga del CSV
  // No se usa spy sobre document.createElement porque React también crea <a> para <Link>,
  // y espiar todo createElement rompe el render interno. Se verifica el flujo
  // a través de URL.createObjectURL y la llamada a exportUsersCsv.

  it('CA.1: al presionar "Exportar CSV" llama a exportUsersCsv y crea una URL de objeto', async () => {
    setupStorage('superadmin');
    const blob = new Blob(['csv'], { type: 'text/csv' });
    mockExportUsersCsv.mockResolvedValue(blob);
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<UsersPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => expect(mockExportUsersCsv).toHaveBeenCalled());
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
  });

  it('CA.1: revoca la URL del objeto tras la descarga', async () => {
    setupStorage('superadmin');
    mockExportUsersCsv.mockResolvedValue(new Blob(['csv'], { type: 'text/csv' }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<UsersPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url'));
  });

  it('CA.1: pasa el search activo a exportUsersCsv', async () => {
    setupStorage('superadmin');
    mockExportUsersCsv.mockResolvedValue(new Blob(['csv'], { type: 'text/csv' }));
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<UsersPage />);
    await screen.findByRole('button', { name: 'Exportar CSV' });

    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    await waitFor(() => expect(mockExportUsersCsv).toHaveBeenCalledWith(''));
  });

  it('muestra alert si exportUsersCsv rechaza', async () => {
    setupStorage('superadmin');
    mockExportUsersCsv.mockRejectedValue(new Error('Network error'));
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UsersPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Error al exportar. Verificá tu conexión.'));
  });
});
