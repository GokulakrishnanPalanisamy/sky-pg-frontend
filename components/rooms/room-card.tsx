"use client";

import { ChevronRight, DoorOpen } from "lucide-react";
import { useRef, useState } from "react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { BedIcon, OccupancyBar } from "@/components/pg/status";
import { RoomOccupancyPopover } from "@/components/rooms/room-occupancy-popover";
import type { RoomOccupancy } from "@/lib/types";

type Placement = { vertical: "below" | "above"; horizontal: "left" | "right" };

const HOVER_DELAY_MS = 220;
const POPOVER_WIDTH = 300;

export function roomSummary(item: RoomOccupancy) {
  return `${item.totalBeds} bed${item.totalBeds === 1 ? "" : "s"} · ${item.occupiedBeds} occupied · ${item.availableBeds} available`;
}

type RoomCardProps = {
  occupancy: RoomOccupancy;
  onOpen: (roomId: string) => void;
  selected?: boolean;
  actions?: ActionMenuItem[];
};

/**
 * Desktop: hovering shows an occupancy popover; hovering a bed highlights it.
 * Touch: there is no hover, so a tap opens the room details sheet directly.
 */
export function RoomCard({ occupancy, onOpen, selected = false, actions }: RoomCardProps) {
  const { room, beds, occupiedBeds, availableBeds, occupancyRate } = occupancy;
  const cardRef = useRef<HTMLElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [activeBedId, setActiveBedId] = useState<string | null>(null);

  function computePlacement(): Placement {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return { vertical: "below", horizontal: "left" };
    const estimatedHeight = 150 + Math.min(beds.length, 6) * 50;
    const spaceBelow = window.innerHeight - rect.bottom;
    return {
      vertical: spaceBelow < estimatedHeight && rect.top > spaceBelow ? "above" : "below",
      horizontal: rect.left + POPOVER_WIDTH > window.innerWidth - 16 ? "right" : "left",
    };
  }

  function show(immediate = false) {
    window.clearTimeout(timer.current);
    if (immediate) {
      setPlacement(computePlacement());
      return;
    }
    timer.current = window.setTimeout(() => setPlacement(computePlacement()), HOVER_DELAY_MS);
  }

  function hide() {
    window.clearTimeout(timer.current);
    setPlacement(null);
    setActiveBedId(null);
  }

  const full = availableBeds === 0 && beds.length > 0;

  return (
    <article
      ref={cardRef}
      onClick={() => {
        hide();
        onOpen(room.id);
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") show();
      }}
      onPointerLeave={hide}
      className={`group relative cursor-pointer rounded-2xl border bg-white p-4 transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] active:translate-y-0 has-[.room-trigger:focus-visible]:ring-2 has-[.room-trigger:focus-visible]:ring-teal-500 ${
        placement ? "z-20" : ""
      } ${
        selected
          ? "border-teal-500 shadow-[var(--shadow-lift)] ring-4 ring-teal-500/10"
          : "border-slate-200/80 shadow-[var(--shadow-card)] hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            full ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-700"
          }`}
          aria-hidden
        >
          <DoorOpen className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold text-slate-900">
            <button
              type="button"
              className="room-trigger text-left focus-visible:outline-none"
              aria-label={`Room ${room.roomNumber}: ${roomSummary(occupancy)}. View details`}
              onFocus={(event) => {
                if (event.currentTarget.matches(":focus-visible")) show(true);
              }}
              onBlur={hide}
            >
              Room {room.roomNumber}
            </button>
          </h3>
          <p className="text-xs text-slate-500">
            {beds.length} bed{beds.length === 1 ? "" : "s"}
          </p>
        </div>
        {actions ? (
          <div className="relative z-10 -mr-2 -mt-1.5" onClick={(event) => event.stopPropagation()}>
            <ActionMenu label={`Actions for Room ${room.roomNumber}`} items={actions} />
          </div>
        ) : (
          <ChevronRight
            className="mt-1 size-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
            aria-hidden
          />
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Beds in Room ${room.roomNumber}`}>
        {beds.map((bed) => (
          <li
            key={bed.id}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse") {
                setActiveBedId(bed.id);
                show(true);
              }
            }}
            onPointerLeave={() => setActiveBedId(null)}
          >
            <BedIcon bed={bed} highlighted={activeBedId === bed.id} />
            <span className="sr-only">
              Bed {bed.bedNumber}: {bed.status === "occupied" ? `occupied by ${bed.tenant?.name}` : "available"}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-2 text-xs">
        <p className="text-slate-600">
          <span className="font-medium text-slate-900">{occupiedBeds}</span> occupied
          <span className="mx-1.5 text-slate-300" aria-hidden>
            •
          </span>
          <span className="font-medium text-slate-900">{availableBeds}</span> available
        </p>
        <p className="font-semibold tabular-nums text-slate-700">{occupancyRate}%</p>
      </div>
      <OccupancyBar rate={occupancyRate} className="mt-2" />

      {placement ? (
        <RoomOccupancyPopover
          occupancy={occupancy}
          activeBedId={activeBedId}
          className={`${placement.vertical === "below" ? "top-full mt-2" : "bottom-full mb-2"} ${
            placement.horizontal === "left" ? "left-0" : "right-0"
          }`}
          style={{ width: POPOVER_WIDTH }}
        />
      ) : null}
    </article>
  );
}
