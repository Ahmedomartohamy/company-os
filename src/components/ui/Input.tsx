import React, { forwardRef } from "react";
export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-brand">{children}</label>;
}
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  return (
    <input ref={ref} {...props} className={"block w-full rounded-xl border-gray-200 bg-white text-sm shadow-sm focus:border-brand focus:ring-brand " + (props.className ?? "")} />
  );
});
export { Input };
export default Input;
