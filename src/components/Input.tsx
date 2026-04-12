import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export function Input({ label, id, error, ...props }: InputProps) {
  return (
    <div className="form-group">
      <label className="form-label" htmlFor={id}>{label}</label>
      <input className={`form-input${error ? ' has-error' : ''}`} id={id} {...props} />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
