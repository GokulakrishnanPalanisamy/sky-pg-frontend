"use client";

import {
  BadgeIndianRupee,
  DoorOpen,
  Pencil,
  Phone,
  Trash2,
  UserMinus,
  UserPen,
  UserPlus,
} from "lucide-react";
import { ActionMenu } from "@/components/ui/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import {
  Avatar,
  BED_TONE_META,
  BedIcon,
  getBedTone,
  OccupancyBar,
  PaymentBadge,
  PAYMENT_META,
} from "@/components/pg/status";
import { roomSummary } from "@/components/rooms/room-card";
import { formatDate, formatRelativeDays } from "@/lib/dates";
import type { BedOccupancy, Room, RoomOccupancy, Tenant } from "@/lib/types";

export type RoomDrawerHandlers = {
  onAssign: (roomId: string, bedId: string) => void;
  onEditTenant: (tenant: Tenant) => void;
  onRecordPayment: (tenant: Tenant) => void;
  onVacate: (tenant: Tenant) => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
};

export function RoomDetailsDrawer({
  occupancy,
  highlightBedId,
  onClose,
  handlers,
}: {
  occupancy: RoomOccupancy | null;
  highlightBedId?: string | null;
  onClose: () => void;
  handlers: RoomDrawerHandlers;
}) {
  const firstAvailable = occupancy?.beds.find((bed) => bed.status === "available");

  return (
    <Sheet
      open={Boolean(occupancy)}
      onClose={onClose}
      variant="drawer"
      title={occupancy ? `Room ${occupancy.room.roomNumber}` : ""}
      description={occupancy ? roomSummary(occupancy) : undefined}
      icon={
        <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <DoorOpen className="size-5" aria-hidden />
        </span>
      }
      footer={
        occupancy ? (
          <>
            <Button
              variant="ghost"
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 sm:mr-auto"
              onClick={() => handlers.onDeleteRoom(occupancy.room)}
            >
              <Trash2 aria-hidden />
              Delete room
            </Button>
            <Button variant="secondary" onClick={() => handlers.onEditRoom(occupancy.room)}>
              <Pencil aria-hidden />
              Edit room
            </Button>
            {firstAvailable ? (
              <Button onClick={() => handlers.onAssign(occupancy.room.id, firstAvailable.id)}>
                <UserPlus aria-hidden />
                Assign tenant
              </Button>
            ) : null}
          </>
        ) : null
      }
    >
      {occupancy ? (
        <div className="space-y-5 px-5 py-5 md:px-6">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
            <dl className="grid grid-cols-3 gap-3 text-center">
              <DrawerStat label="Total beds" value={occupancy.totalBeds} />
              <DrawerStat label="Occupied" value={occupancy.occupiedBeds} tone="text-rose-600" />
              <DrawerStat label="Available" value={occupancy.availableBeds} tone="text-emerald-600" />
            </dl>
            <div className="mt-4 flex items-center gap-3">
              <OccupancyBar rate={occupancy.occupancyRate} className="flex-1" />
              <span className="text-xs font-semibold tabular-nums text-slate-700">
                {occupancy.occupancyRate}% occupied
              </span>
            </div>
          </div>

          <section aria-label="Beds">
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Beds
            </h3>
            {occupancy.beds.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                This room has no beds. Edit the room to add some.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {occupancy.beds.map((bed) => (
                  <BedRow
                    key={bed.id}
                    bed={bed}
                    highlighted={bed.id === highlightBedId}
                    handlers={handlers}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Sheet>
  );
}

function DrawerStat({ label, value, tone = "text-slate-900" }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <dd className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</dd>
      <dt className="text-xs text-slate-500">{label}</dt>
    </div>
  );
}

function BedRow({
  bed,
  highlighted,
  handlers,
}: {
  bed: BedOccupancy;
  highlighted: boolean;
  handlers: RoomDrawerHandlers;
}) {
  const tone = getBedTone(bed);
  const { tenant, payment } = bed;

  return (
    <li
      ref={(node) => {
        if (node && highlighted) node.scrollIntoView({ block: "nearest" });
      }}
      className={`rounded-2xl border bg-white p-3.5 transition-shadow ${
        highlighted ? "border-teal-400 ring-4 ring-teal-500/10" : "border-slate-200/80"
      }`}
    >
      <div className="flex items-center gap-3">
        <BedIcon bed={bed} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Bed {bed.bedNumber}</p>
          <p className={`text-xs font-medium ${BED_TONE_META[tone].text}`}>
            {bed.status === "available" ? "Available" : "Occupied"}
          </p>
        </div>
        {tenant ? (
          <ActionMenu
            label={`Actions for Bed ${bed.bedNumber}`}
            items={[
              { label: "Edit tenant", icon: UserPen, onSelect: () => handlers.onEditTenant(tenant) },
              { label: "Record payment", icon: BadgeIndianRupee, onSelect: () => handlers.onRecordPayment(tenant) },
              { label: "Vacate bed", icon: UserMinus, tone: "danger", onSelect: () => handlers.onVacate(tenant) },
            ]}
          />
        ) : (
          <Button size="sm" variant="secondary" onClick={() => handlers.onAssign(bed.roomId, bed.id)}>
            <UserPlus aria-hidden />
            Assign tenant
          </Button>
        )}
      </div>

      {tenant && payment ? (
        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar name={tenant.name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{tenant.name}</p>
              <a
                href={`tel:${tenant.phone}`}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-teal-700"
                onClick={(event) => event.stopPropagation()}
              >
                <Phone className="size-3" aria-hidden />
                {tenant.phone}
              </a>
            </div>
          </div>
          <div className="flex items-start justify-between gap-2 sm:block sm:text-right">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Next payment</p>
              <p className={`text-sm font-medium ${payment.status === "paid" ? "text-slate-900" : PAYMENT_META[payment.status].text}`}>
                {formatDate(payment.dueDate)}
              </p>
              <p className="text-xs text-slate-500">{formatRelativeDays(payment.daysUntilDue)}</p>
            </div>
            <div className="sm:mt-1.5">
              <PaymentBadge status={payment.status} />
            </div>
          </div>
          {tenant.status === "notice" ? (
            <div className="sm:col-span-2">
              <Badge tone="slate">Tenant on notice</Badge>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
