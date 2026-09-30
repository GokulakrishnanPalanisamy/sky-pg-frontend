import type { CSSProperties } from "react";
import { BED_TONE_META, BedIcon, getBedTone, PAYMENT_META } from "@/components/pg/status";
import { formatDate } from "@/lib/dates";
import type { RoomOccupancy } from "@/lib/types";

const MAX_ROWS = 6;

/**
 * Read-only hover summary. It is decorative for assistive tech because the
 * same information is in the card's label and the details sheet.
 */
export function RoomOccupancyPopover({
  occupancy,
  activeBedId,
  className = "",
  style,
}: {
  occupancy: RoomOccupancy;
  activeBedId: string | null;
  className?: string;
  style?: CSSProperties;
}) {
  const { room, beds, totalBeds, occupiedBeds, availableBeds } = occupancy;

  // Keep the hovered bed visible even when the list is truncated.
  const activeIndex = beds.findIndex((bed) => bed.id === activeBedId);
  const start = activeIndex >= MAX_ROWS ? activeIndex - MAX_ROWS + 1 : 0;
  const visible = beds.slice(start, start + MAX_ROWS);
  const hidden = beds.length - visible.length;

  return (
    <div
      aria-hidden
      style={style}
      className={`pointer-events-none absolute z-30 animate-pop-in rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-[var(--shadow-pop)] ${className}`}
    >
      <div className="px-1 pb-2.5">
        <p className="text-sm font-semibold text-slate-900">Room {room.roomNumber}</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
          <Stat value={totalBeds} label="Beds" />
          <Stat value={occupiedBeds} label="Occupied" tone="text-rose-600" />
          <Stat value={availableBeds} label="Available" tone="text-emerald-600" />
        </div>
      </div>
      <ul className="space-y-0.5 border-t border-slate-100 pt-2">
        {visible.map((bed) => {
          const tone = getBedTone(bed);
          const active = bed.id === activeBedId;
          return (
            <li
              key={bed.id}
              className={`flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors ${active ? "bg-slate-100" : ""}`}
            >
              <BedIcon bed={bed} size="sm" />
              <div className="min-w-0 flex-1 text-xs leading-4">
                <p className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">Bed {bed.bedNumber}</span>
                  <span className={`font-medium ${BED_TONE_META[tone].text}`}>
                    {bed.status === "available" ? "Available" : "Occupied"}
                  </span>
                </p>
                {bed.tenant && bed.payment ? (
                  <p className="mt-0.5 flex items-center justify-between gap-2 text-slate-500">
                    <span className="truncate">{bed.tenant.name}</span>
                    <span className={`shrink-0 ${PAYMENT_META[bed.payment.status].text}`}>
                      Next: {formatDate(bed.payment.dueDate)}
                    </span>
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {hidden > 0 ? (
        <p className="px-1.5 pt-1.5 text-xs text-slate-500">+{hidden} more bed{hidden === 1 ? "" : "s"}</p>
      ) : null}
      <p className="mt-2 border-t border-slate-100 px-1 pt-2 text-[11px] text-slate-400">
        Click to view details and manage beds
      </p>
    </div>
  );
}

function Stat({ value, label, tone = "text-slate-900" }: { value: number; label: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-1 py-1.5">
      <p className={`text-sm font-semibold tabular-nums ${tone}`}>{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
