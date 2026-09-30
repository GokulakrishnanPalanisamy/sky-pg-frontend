import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-teal-600 text-white shadow-sm shadow-teal-900/10 hover:bg-teal-700 active:bg-teal-800 disabled:bg-teal-300",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm shadow-slate-900/[0.03] hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400",
  ghost:
    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 disabled:text-slate-400",
  danger:
    "bg-rose-600 text-white shadow-sm shadow-rose-900/10 hover:bg-rose-700 active:bg-rose-800 disabled:bg-rose-300",
};

/* Touch targets are 44px on small screens, 40px/36px with a precise pointer. */
const sizes: Record<Size, string> = {
  sm: "h-10 px-3 text-sm sm:h-9",
  md: "h-11 px-4 text-sm sm:h-10",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 disabled:cursor-not-allowed [&_svg]:size-4 [&_svg]:shrink-0 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  tone?: "default" | "inverse";
  children: ReactNode;
};

/** Square icon-only button. `label` becomes the accessible name. */
export function IconButton({
  label,
  tone = "default",
  className = "",
  children,
  ...props
}: IconButtonProps) {
  const toneClass =
    tone === "inverse"
      ? "text-slate-400 hover:bg-white/10 hover:text-white"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`relative inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 sm:size-9 [&_svg]:size-[18px] ${toneClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
