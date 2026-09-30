"use client";

import { ChevronDown, Search, X } from "lucide-react";
import {
  createContext,
  useContext,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

type FieldContextValue = { id: string; messageId: string; invalid: boolean };

const FieldContext = createContext<FieldContextValue | null>(null);

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
};

/** Wires label, hint and error text to the control inside it for screen readers. */
export function Field({ label, error, hint, className = "", children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;
  return (
    <FieldContext.Provider value={{ id, messageId, invalid: Boolean(error) }}>
      <div className={`space-y-1.5 ${className}`}>
        <label htmlFor={id} className="block text-[13px] font-medium text-slate-700">
          {label}
        </label>
        {children}
        {message ? (
          <p
            id={messageId}
            className={`text-xs ${error ? "text-rose-600" : "text-slate-500"}`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

const controlClass =
  "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm shadow-slate-900/[0.02] outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function stateClass(invalid: boolean) {
  return invalid
    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
    : "border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-teal-500/15";
}

function useFieldProps() {
  const field = useContext(FieldContext);
  if (!field) return {};
  return {
    id: field.id,
    "aria-invalid": field.invalid || undefined,
    "aria-describedby": field.messageId,
  };
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const fieldProps = useFieldProps();
  return (
    <input
      {...fieldProps}
      className={`${controlClass} ${stateClass(Boolean(fieldProps["aria-invalid"]))} ${className}`}
      {...props}
    />
  );
}

export function SelectInput({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldProps = useFieldProps();
  return (
    <div className="relative">
      <select
        {...fieldProps}
        className={`${controlClass} ${stateClass(Boolean(fieldProps["aria-invalid"]))} appearance-none pr-10 ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
    </div>
  );
}

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
};

export function SearchInput({
  value,
  onValueChange,
  label,
  className = "",
  ...props
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={`${controlClass} ${stateClass(false)} pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden`}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange("")}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
