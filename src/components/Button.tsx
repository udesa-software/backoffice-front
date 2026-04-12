import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export function Button({ isLoading, children, ...props }: ButtonProps) {
  return (
    <button className="btn-submit" disabled={isLoading || props.disabled} {...props}>
      {isLoading ? 'Cargando...' : children}
    </button>
  );
}
