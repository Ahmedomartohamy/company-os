import React, { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  placeholder?: string;
  label?: string;
  error?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, label, error, className, children, ...props },
  ref,
) {
  return (
    <div className="block">
      {label && <span className="mb-1 block text-sm font-medium text-brand">{label}</span>}
      <select
        ref={ref}
        {...props}
        className={
          'block w-full rounded-xl border-gray-200 bg-white text-sm shadow-sm focus:border-brand focus:ring-brand ' +
          (className ?? '')
        }
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options
          ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          : children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';
export { Select };
export default Select;
