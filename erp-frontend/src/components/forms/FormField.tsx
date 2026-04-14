import React from 'react';
import { UseFormRegisterReturn, FieldError } from 'react-hook-form';

type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'tel'
  | 'url'
  | 'search'
  | 'textarea'
  | 'select';

interface SelectOption {
  value: string | number;
  label: string;
}

interface FormFieldProps {
  label: string;
  name: string;
  register?: UseFormRegisterReturn;
  error?: FieldError | { message?: string };
  type?: InputType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  options?: SelectOption[];          // for type="select"
  rows?: number;                     // for type="textarea"
  className?: string;
  inputClassName?: string;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

const baseInputClass =
  'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ' +
  'placeholder-gray-400 shadow-sm transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ' +
  'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed';

const errorInputClass = 'border-red-400 focus:ring-red-400 focus:border-red-400';

export default function FormField({
  label,
  name,
  register,
  error,
  type = 'text',
  required = false,
  placeholder,
  hint,
  disabled = false,
  options = [],
  rows = 3,
  className = '',
  inputClassName = '',
  min,
  max,
  step,
}: FormFieldProps) {
  const errorMsg = error?.message;
  const inputClasses = `${baseInputClass} ${errorMsg ? errorInputClass : ''} ${inputClassName}`;
  const sharedProps = {
    id: name,
    disabled,
    placeholder,
    ...(register ?? {}),
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          {...sharedProps}
          rows={rows}
          className={`${inputClasses} resize-y`}
        />
      ) : type === 'select' ? (
        <select {...sharedProps} className={inputClasses}>
          <option value="">— Select —</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...sharedProps}
          type={type}
          min={min}
          max={max}
          step={step}
          className={inputClasses}
        />
      )}

      {hint && !errorMsg && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
      {errorMsg && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {errorMsg}
        </p>
      )}
    </div>
  );
}
