import * as React from 'react';
type Props = React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };
export function FileUpload({ label, error, className='', ...props }: Props) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm">{label}</span>}
      <input type="file" className={"w-full rounded-xl border px-3 py-2 " + className} {...props} />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
