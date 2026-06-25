import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('connects label and input by id', () => {
    render(<Input id="email" label="Email" />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'email');
  });

  it('renders validation errors', () => {
    render(<Input id="password" label="Password" error="Requerido" />);

    expect(screen.getByText('Requerido')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveClass('has-error');
  });
});
