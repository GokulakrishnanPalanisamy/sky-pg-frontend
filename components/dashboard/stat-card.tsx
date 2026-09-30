import type { ComponentType } from "react";
import { cardClass } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/feedback";

export type StatTone = "indigo" | "violet" | "green" | "red" | "teal";

const tones: Record<StatTone, { tile: string; context: string }> = {
  indigo: { tile: "bg-indigo-50 text-indigo-600", context: "text-slate-500" },
  violet: { tile: "bg-violet-50 text-violet-600", context: "text-slate-500" },
  green: { tile: "bg-emerald-50 text-emerald-600", context: "text-emerald-700" },
  red: { tile: "bg-rose-50 text-rose-600", context: "text-rose-600" },
  teal: { tile: "bg-teal-50 text-teal-700", context: "text-slate-500" },
};

export function StatCard({
  label,
  value,
  context,
  icon: Icon,
  tone,
  className = "",
}: {
  label: string;
  value: number;
  context: string;
  icon: ComponentType<{ className?: string }>;
  tone: StatTone;
  className?: string;
}) {
  return (
    <article className={`${cardClass} flex items-start gap-3 p-4 sm:gap-4 sm:p-5 ${className}`}>
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 ${tones[tone].tile}`} aria-hidden>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-xs font-medium text-slate-500 sm:text-[13px]">{label}</h3>
        <p className="mt-1 text-2xl font-semibold leading-none tracking-tight text-slate-900 tabular-nums sm:text-[28px]">
          {value}
        </p>
        <p className={`mt-2 text-xs leading-4 ${tones[tone].context}`}>{context}</p>
      </div>
    </article>
  );
}

export function StatCardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`${cardClass} flex items-start gap-4 p-4 sm:p-5 ${className}`} aria-hidden>
      <Skeleton className="size-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-10" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}
