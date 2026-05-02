import React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/utils/cn';

interface FormFieldProps {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  options?: { label: string; value: string | number }[];
  className?: string;
  required?: boolean;
  step?: string | number;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  options,
  className,
  required,
  step,
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name];

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          id={name}
          {...register(name)}
          className={cn(
            "w-full px-3 py-2 bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            error ? "border-red-500" : "border-gray-300"
          )}
        >
          <option value="">Select {label}</option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          placeholder={placeholder}
          {...register(name)}
          rows={3}
          className={cn(
            "w-full px-3 py-2 bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            error ? "border-red-500" : "border-gray-300"
          )}
        />
      ) : (
        <input
          id={name}
          type={type}
          placeholder={placeholder}
          step={step}
          {...register(name)}
          className={cn(
            "w-full px-3 py-2 bg-white border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
            error ? "border-red-500" : "border-gray-300"
          )}
        />
      )}
      
      {error && (
        <p className="text-xs text-red-500">{error.message as string}</p>
      )}
    </div>
  );
};

export const SearchBar: React.FC<{ onSearch: (val: string) => void; placeholder?: string }> = ({ 
  onSearch, 
  placeholder = "Search..." 
}) => {
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        placeholder={placeholder}
      />
    </div>
  );
};

export const LoadingSpinner: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => (
  <svg
    className={cn("animate-spin text-primary", className)}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);
