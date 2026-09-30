import { BedSingle, CircleAlert, Clock, CircleCheck } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { BedOccupancy, PaymentStatus, TenantStatus } from "@/lib/types";

/* ------------------------------ Payments ----------------------------- */

export const PAYMENT_META: Record<PaymentStatus, { label: string; tone: BadgeTone; text: string }> = {
  paid: { label: "Paid", tone: "green", text: "text-slate-500" },
  due_soon: { label: "Due soon", tone: "amber", text: "text-amber-700" },
  overdue: { label: "Overdue", tone: "red", text: "text-rose-600" },
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_META[status];
  const Icon = status === "paid" ? CircleCheck : status === "due_soon" ? Clock : CircleAlert;
  return (
    <Badge tone={meta.tone} icon={<Icon aria-hidden />}>
      {meta.label}
    </Badge>
  );
}

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return status === "active" ? (
    <Badge tone="teal">Active</Badge>
  ) : (
    <Badge tone="slate">On notice</Badge>
  );
}

/* -------------------------------- Beds ------------------------------- */

export type BedTone = "available" | "occupied" | "due" | "overdue";

export function getBedTone(bed: BedOccupancy): BedTone {
  if (bed.status === "available") return "available";
  if (bed.payment?.status === "due_soon") return "due";
  if (bed.payment?.status === "overdue") return "overdue";
  return "occupied";
}

export const BED_TONE_META: Record<BedTone, { label: string; tile: string; text: string }> = {
  available: {
    label: "Available",
    tile: "bg-emerald-50 text-emerald-600 ring-emerald-500/20",
    text: "text-emerald-700",
  },
  occupied: {
    label: "Occupied",
    tile: "bg-rose-50 text-rose-500 ring-rose-500/20",
    text: "text-rose-600",
  },
  due: {
    label: "Occupied · Due soon",
    tile: "bg-amber-50 text-amber-600 ring-amber-500/25",
    text: "text-amber-700",
  },
  overdue: {
    label: "Occupied · Overdue",
    tile: "bg-rose-100 text-rose-600 ring-rose-500/30",
    text: "text-rose-700",
  },
};

const BED_SIZES = {
  sm: "size-7 rounded-lg [&_svg]:size-4",
  md: "size-9 rounded-[10px] [&_svg]:size-[18px]",
  lg: "size-11 rounded-xl [&_svg]:size-5",
};

/** Colored bed tile. Always pair it with a text label nearby — color alone is not the only signal. */
export function BedIcon({
  bed,
  size = "md",
  highlighted = false,
}: {
  bed: BedOccupancy;
  size?: keyof typeof BED_SIZES;
  highlighted?: boolean;
}) {
  const tone = getBedTone(bed);
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ring-1 ring-inset transition-transform duration-150 ${BED_SIZES[size]} ${BED_TONE_META[tone].tile} ${
        highlighted ? "scale-110 ring-2" : ""
      }`}
    >
      <BedSingle aria-hidden strokeWidth={2} />
      {tone === "overdue" ? (
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-rose-600 ring-2 ring-white" aria-hidden />
      ) : null}
    </span>
  );
}

/** Legend explaining the bed colors. */
export function BedLegend({ className = "" }: { className?: string }) {
  const items: { tone: BedTone; label: string; hint: string }[] = [
    { tone: "available", label: "Available", hint: "Free for a new tenant" },
    { tone: "occupied", label: "Occupied", hint: "Rent up to date" },
    { tone: "due", label: "Due soon", hint: "Rent due within 5 days" },
    { tone: "overdue", label: "Overdue", hint: "Rent past due date" },
  ];
  return (
    <ul className={`flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 ${className}`}>
      {items.map((item) => (
        <li key={item.tone} className="flex items-center gap-2" title={item.hint}>
          <span
            className={`relative inline-flex size-5 items-center justify-center rounded-md ring-1 ring-inset [&_svg]:size-3 ${BED_TONE_META[item.tone].tile}`}
          >
            <BedSingle aria-hidden />
            {item.tone === "overdue" ? (
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-rose-600" aria-hidden />
            ) : null}
          </span>
          <span className="font-medium text-slate-600">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Misc --------------------------------- */

const AVATAR_TONES = [
  "bg-teal-50 text-teal-700",
  "bg-indigo-50 text-indigo-700",
  "bg-sky-50 text-sky-700",
  "bg-violet-50 text-violet-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-800",
];

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${AVATAR_TONES[hash % AVATAR_TONES.length]} ${
        size === "sm" ? "size-8 text-[11px]" : "size-10 text-xs"
      }`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function OccupancyBar({ rate, className = "" }: { rate: number; className?: string }) {
  const color = rate >= 100 ? "bg-rose-500" : rate >= 75 ? "bg-rose-400" : rate > 0 ? "bg-teal-500" : "bg-slate-300";
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-slate-100 ${className}`} aria-hidden>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${color}`}
        style={{ width: `${Math.max(rate, rate > 0 ? 4 : 0)}%` }}
      />
    </div>
  );
}
