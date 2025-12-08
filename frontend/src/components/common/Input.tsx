import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  as?: 'input' | 'textarea';
  rows?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  as = 'input',
  rows,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="label">
          {label}
        </label>
      )}
      {as === 'textarea' ? (
        <textarea
          rows={rows || 4}
          className={`input-field ${error ? 'border-status-error focus:ring-status-error focus:border-status-error' : ''} ${className}`}
          {...(props as any)}
        />
      ) : (
        <input
          className={`input-field ${error ? 'border-status-error focus:ring-status-error focus:border-status-error' : ''} ${className}`}
          {...props}
        />
      )}
      {error && (
        <p className="mt-1 text-sm text-status-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-neutral-medium">{helperText}</p>
      )}
    </div>
  );
};

