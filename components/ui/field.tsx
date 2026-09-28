import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  error?: string;
  children: ReactNode;
};

export function Field({ label, error, children }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="block text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

const controlClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-50 disabled:text-slate-500";

export function TextInput({
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={`${controlClass} ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : ""} ${className}`}
      {...props}
    />
  );
}

export function SelectInput({
  error,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className={`${controlClass} ${error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100" : ""} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
