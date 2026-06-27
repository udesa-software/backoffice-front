import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  discardReport:       vi.fn(),
  suspendFromReports:  vi.fn(),
  resolveReports:      vi.fn(),
}));

import {
  fetchReports,
  discardReport,
  suspendFromReports,
  resolveReports,
} from '@/api/admin';

const mockFetchReports       = fetchReports       as ReturnType<typeof vi.fn>;
const mockDiscardReport      = discardReport      as ReturnType<typeof vi.fn>;
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

  it('muestra los botones de acción Suspender y Resolver caso a nivel de grupo', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText('Suspender')).toBeInTheDocument();
      expect(screen.getByText('Resolver caso')).toBeInTheDocument();
    });
  });

  it('no muestra el botón Descartar a nivel de grupo (solo aparece por denuncia individual)', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('Suspender'));

    // Descartar no debe aparecer sin expandir el acordeón
    expect(screen.queryByText('Descartar')).not.toBeInTheDocument();
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

  // ── Acción: Descartar denuncia individual ─────────────────────────────────

  it('cada denuncia individual tiene un botón Descartar cuando el acordeón está expandido', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('▶'));
    fireEvent.click(screen.getByText('▶'));

    const descartarBtns = screen.getAllByText('Descartar');
    expect(descartarBtns).toHaveLength(SAMPLE_GROUP.reports.length);
  });

  it('llama a discardReport con el id de la denuncia al hacer click en Descartar individual', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);
    mockDiscardReport.mockResolvedValue({ message: 'Denuncia descartada.' });
    mockFetchReports.mockResolvedValueOnce(SAMPLE_PAGE).mockResolvedValueOnce(EMPTY_PAGE);

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('▶'));
    fireEvent.click(screen.getByText('▶'));

    const descartarBtns = screen.getAllByText('Descartar');
    fireEvent.click(descartarBtns[0]);

    await waitFor(() => {
      expect(mockDiscardReport).toHaveBeenCalledWith('rep-1');
    });
  });

  it('el botón Descartar de una denuncia no bloquea el botón de otra denuncia', async () => {
    mockFetchReports.mockResolvedValue(SAMPLE_PAGE);
    // discardReport never resolves during this test (simulates loading)
    mockDiscardReport.mockReturnValue(new Promise(() => {}));

    render(<ReportsPage />);

    await waitFor(() => screen.getByText('▶'));
    fireEvent.click(screen.getByText('▶'));

    const descartarBtns = screen.getAllByText('Descartar');
    fireEvent.click(descartarBtns[0]);

    await waitFor(() => {
      // The second button ('rep-2') should still be enabled
      expect(descartarBtns[1]).not.toBeDisabled();
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
