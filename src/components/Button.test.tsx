import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children when not loading', () => {
    render(<Button>Guardar</Button>);

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();
  });

  it('renders loading state and disables the button', () => {
    render(<Button isLoading>Guardar</Button>);

    expect(screen.getByRole('button', { name: 'Cargando...' })).toBeDisabled();
  });
});
