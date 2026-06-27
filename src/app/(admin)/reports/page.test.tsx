import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ReportsPage from './page';

// Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/reports',
  useRouter:   () => ({ push: vi.fn() }),
}));

// API functions
vi.mock('@/api/admin', () => ({
  fetchReports:        vi.fn(),
  discardReports:      vi.fn(),
  suspendFromReports:  vi.fn(),
  resolveReports:      vi.fn(),
}));

import {
  fetchReports,
  discardReports,
  suspendFromReports,
  resolveReports,
} from '@/api/admin';

const mockFetchReports       = fetchReports       as ReturnType<typeof vi.fn>;
const mockDiscardReports     = discardReports     as ReturnType<typeof vi.fn>;
const mockSuspendFromReports = suspendFromReports as ReturnType<typeof vi.fn>;
const mockResolveReports     = resolveReports     as ReturnType<typeof vi.fn>;

const SAMPLE_GROUP = {
  reported_id:        'uuid-reported-1',
  reported_username:  'usuario_malo',
  total_reports:      3,
  distinct_reporters: 2,
  last_reported_at:   '2026-06-25T10:00:00.000Z',
  reports: [
    {
      id:               'rep-1',
      reporter_username:'denunciante1',
      reason:           'spam',
      reason_detail:    null,
      reported_at:      '2026-06-25T10:00:00.000Z',
    },
    {
      id:               'rep-2',
      reporter_username:'denunciante2',
      reason:           'other',
      reason_detail:    'Me amenazó por privado',
      reported_at:      '2026-06-24T10:00:00.000Z',
    },
  ],
};

const EMPTY_PAGE = { groups: [], total: 0, page: 1, limit: 20 };
const SAMPLE_PAGE = { groups: [SAMPLE_GROUP], total: 1, page: 1, limit: 20 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ReportsPage', () => {
  // ── Estado vacío ──────────────────────────────────────────────────────────

  it('muestra estado vacío cuando no hay denuncias pendientes', async () => {
    mockFetchReports.mockResolvedValue(EMPTY_PAGE);

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('No hay denuncias pendientes')).toBeInTheDocument();
    });
  });

  // ── Tabla con datos ───────────────────────────────────────────────────────

  it('muestra el username del usuario denunciado en la tabla', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('@usuario_malo')).toBeInTheDocument();
    });
  });

  it('muestra la cantidad de denuncias en la tabla', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('muestra los botones de acción Descartar, Suspender y Resolver caso', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Descartar')).toBeInTheDocument();
      expect(screen.getByText('Suspender')).toBeInTheDocument();
      expect(screen.getByText('Resolver caso')).toBeInTheDocument();
    });
  });

  // ── Acordeón ─────────────────────────────────────────────────────────────

  it('expande las denuncias individuales al hacer click en el toggle', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('▶'));

    fireEvent.click(screen.getByText('▶'));

    expect(screen.getByText('@denunciante1')).toBeInTheDocument();
    expect(screen.getByText('@denunciante2')).toBeInTheDocument();
  });

  it('muestra el label en español para el motivo "spam"', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('▶'));
    fireEvent.click(screen.getByText('▶'));

    expect(screen.getByText('Spam')).toBeInTheDocument();
  });

  it('muestra reason_detail cuando reason es "other"', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('▶'));
    fireEvent.click(screen.getByText('▶'));

    expect(screen.getByText('"Me amenazó por privado"')).toBeInTheDocument();
  });

  // ── Acción: Descartar ─────────────────────────────────────────────────────

  it('llama a discardReports con el reportedId al hacer click en Descartar', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);
    mockDiscardReports.mockResolvedValue({ message: 'Descartado' });
    mockFetchReports.mockResolvedValueOnce(SAMPLE_PAGE).mockResolvedValueOnce(EMPTY_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('Descartar'));
    fireEvent.click(screen.getByText('Descartar'));

    await waitFor(() => {
      expect(mockDiscardReports).toHaveBeenCalledWith('uuid-reported-1');
    });
  });

  // ── Acción: Resolver caso ─────────────────────────────────────────────────

  it('llama a resolveReports con el reportedId al hacer click en Resolver caso', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);
    mockResolveReports.mockResolvedValue({ message: 'Resuelto' });

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('Resolver caso'));
    fireEvent.click(screen.getByText('Resolver caso'));

    await waitFor(() => {
      expect(mockResolveReports).toHaveBeenCalledWith('uuid-reported-1');
    });
  });

  // ── Acción: Suspender (modal) ─────────────────────────────────────────────

  it('abre el modal de suspensión al hacer click en Suspender', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('Suspender'));
    fireEvent.click(screen.getByText('Suspender'));

    expect(screen.getByText('Suspender cuenta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Motivo de suspensión...')).toBeInTheDocument();
  });

  it('el botón Confirmar suspensión está deshabilitado si el motivo está vacío', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('Suspender'));
    fireEvent.click(screen.getByText('Suspender'));

    const confirmBtn = screen.getByText('Confirmar suspensión');
    expect(confirmBtn).toBeDisabled();
  });

  it('llama a suspendFromReports con el id y motivo al confirmar suspensión', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);
    mockSuspendFromReports.mockResolvedValue({ message: 'Suspendido' });

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('Suspender'));
    fireEvent.click(screen.getByText('Suspender'));

    const textarea = screen.getByPlaceholderText('Motivo de suspensión...');
    fireEvent.change(textarea, { target: { value: 'Acoso reiterado' } });

    fireEvent.click(screen.getByText('Confirmar suspensión'));

    await waitFor(() => {
      expect(mockSuspendFromReports).toHaveBeenCalledWith('uuid-reported-1', 'Acoso reiterado');
    });
  });

  it('cierra el modal al hacer click en Cancelar', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('Suspender'));
    fireEvent.click(screen.getByText('Suspender'));

    expect(screen.getByText('Suspender cuenta')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancelar'));

    expect(screen.queryByText('Suspender cuenta')).not.toBeInTheDocument();
  });

  // ── Manejo de errores ─────────────────────────────────────────────────────

  it('muestra mensaje de error si fetchReports falla', async () => {
    mockFetchReports.mockRejectedValue(new Error('Network error'));

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar las denuncias.')).toBeInTheDocument();
    });
  });
});
