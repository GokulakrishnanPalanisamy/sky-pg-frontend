import type { ReactNode } from "react";

export type BadgeTone = "green" | "red" | "amber" | "slate" | "teal" | "indigo";

const tones: Record<BadgeTone, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  red: "bg-rose-50 text-rose-700 ring-rose-600/15",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15",
  teal: "bg-teal-50 text-teal-700 ring-teal-600/15",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
};

const dots: Record<BadgeTone, string> = {
  green: "bg-emerald-500",
  red: "bg-rose-500",
  amber: "bg-amber-500",
  slate: "bg-slate-400",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
};

export function Badge({
  tone,
  children,
  icon,
  dot = !icon,
}: {
  tone: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset [&_svg]:size-3 ${tones[tone]}`}
    >
      {dot ? <span className={`size-1.5 rounded-full ${dots[tone]}`} aria-hidden /> : null}
      {icon}
      {children}
    </span>
  );
}
