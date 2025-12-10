'use client';

import * as React from 'react';

import { cn } from '@/lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, 'aria-label': ariaLabel, 'aria-describedby': ariaDescribedBy, required, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const labelId = label ? `${inputId}-label` : undefined;
    const describedBy = [ariaDescribedBy, errorId, labelId].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} id={labelId} className="block mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            'flex h-11 w-full rounded-lg border bg-white px-4 py-2 text-sm shadow-sm transition-all',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500',
            error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700',
            className
          )}
          ref={ref}
          aria-label={ariaLabel || (label ? undefined : 'Input field')}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          aria-required={required}
          required={required}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-500" role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
