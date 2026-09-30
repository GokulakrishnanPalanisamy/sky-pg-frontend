import type { HTMLAttributes, ReactNode } from "react";

export const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)]";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`${cardClass} ${className}`} {...props} />;
}

export function CardHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 md:px-6">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="-mr-2 flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
