"use client";

import {
  BadgeIndianRupee,
  DoorOpen,
  LogOut,
  Pencil,
  Phone,
  SearchX,
  Trash2,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { cardClass } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/field";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar, PaymentBadge, PAYMENT_META, TenantStatusBadge } from "@/components/pg/status";
import { usePgStore } from "@/context/pg-store";
import { useWorkspace } from "@/context/workspace";
import { formatDate, formatRelativeDays } from "@/lib/dates";
import type { TenantAssignment } from "@/lib/types";

type TenantFilter = "all" | "due" | "notice";

const FILTERS: Record<TenantFilter, (item: TenantAssignment) => boolean> = {
  all: () => true,
  due: (item) => item.payment.status !== "paid",
  notice: (item) => item.tenant.status === "notice",
};

function matches(item: TenantAssignment, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  const { tenant, room } = item;
  return (
    tenant.name.toLowerCase().includes(q) ||
    tenant.email.toLowerCase().includes(q) ||
    (digits.length > 0 && tenant.phone.includes(digits)) ||
    (room ? `room ${room.roomNumber}`.includes(q) : false)
  );
}

export function TenantsPage() {
  const { ready, assignments, rooms, stats } = usePgStore();
  const workspace = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TenantFilter>("all");

  const searched = assignments.filter((item) => matches(item, query));
  const visible = searched.filter(FILTERS[filter]);
  const options = (["all", "due", "notice"] as const).map((value) => ({
    value,
    label: value === "all" ? "All tenants" : value === "due" ? "Payment due" : "On notice",
    count: searched.filter(FILTERS[value]).length,
  }));

  function actionsFor({ tenant }: TenantAssignment): ActionMenuItem[] {
    return [
      { label: "Edit tenant", icon: Pencil, onSelect: () => workspace.openTenantForm({ tenant }) },
      { label: "Record payment", icon: BadgeIndianRupee, onSelect: () => void workspace.recordPayment(tenant) },
      { label: "View room", icon: DoorOpen, onSelect: () => workspace.openRoom(tenant.roomId, tenant.bedId) },
      tenant.status === "notice"
        ? { label: "Mark as active", icon: UserCheck, onSelect: () => void workspace.toggleNotice(tenant) }
        : { label: "Mark on notice", icon: LogOut, onSelect: () => void workspace.toggleNotice(tenant) },
      { label: "Remove tenant", icon: Trash2, tone: "danger", onSelect: () => workspace.requestDeleteTenant(tenant) },
    ];
  }

  const canAdd = ready && rooms.length > 0 && stats.availableBeds > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Manage residents and their room assignments."
        actions={
          <Button onClick={() => workspace.openTenantForm()} disabled={!canAdd} title={canAdd ? undefined : "No available beds"}>
            <UserPlus aria-hidden />
            Add tenant
          </Button>
        }
      />

      {!ready ? (
        <TenantsSkeleton />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={<UsersRound />}
          title="No tenants yet"
          description={
            rooms.length === 0
              ? "Add a room first, then assign tenants to its beds."
              : "Add your first tenant and assign them an available bed."
          }
          action={
            rooms.length === 0 ? (
              <Button onClick={() => workspace.openRoomForm()}>
                <DoorOpen aria-hidden />
                Add room
              </Button>
            ) : (
              <Button onClick={() => workspace.openTenantForm()} disabled={!canAdd}>
                <UserPlus aria-hidden />
                Add tenant
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs label="Filter tenants" value={filter} options={options} onChange={setFilter} />
            <SearchInput
              label="Search tenants"
              placeholder="Search tenant name, phone number…"
              value={query}
              onValueChange={setQuery}
              className="w-full lg:w-80"
            />
          </div>

          {visible.length === 0 ? (
            <EmptyState
              compact
              icon={<SearchX />}
              title="No matching tenants"
              description="Try a different name, phone number or filter."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              <TenantTable items={visible} actionsFor={actionsFor} onOpenRoom={workspace.openRoom} />
              <ul className="grid gap-3 sm:grid-cols-2 lg:hidden" aria-label="Tenants">
                {visible.map((item) => (
                  <TenantCard key={item.tenant.id} item={item} actions={actionsFor(item)} onOpenRoom={workspace.openRoom} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

function RoomBedLabel({
  item,
  onOpenRoom,
}: {
  item: TenantAssignment;
  onOpenRoom: (roomId: string, bedId?: string) => void;
}) {
  const { room, bed, tenant } = item;
  if (!room || !bed) return <span className="text-slate-400">Unassigned</span>;
  return (
    <button
      type="button"
      onClick={() => onOpenRoom(tenant.roomId, tenant.bedId)}
      className="-mx-1.5 rounded-lg px-1.5 py-0.5 text-left text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
    >
      Room {room.roomNumber} · Bed {bed.bedNumber}
    </button>
  );
}

function NextPayment({ item }: { item: TenantAssignment }) {
  const { payment } = item;
  return (
    <div>
      <p className={`text-sm font-medium ${payment.status === "paid" ? "text-slate-800" : PAYMENT_META[payment.status].text}`}>
        {formatDate(payment.dueDate)}
      </p>
      <p className="text-xs text-slate-500">{formatRelativeDays(payment.daysUntilDue)}</p>
    </div>
  );
}

function TenantTable({
  items,
  actionsFor,
  onOpenRoom,
}: {
  items: TenantAssignment[];
  actionsFor: (item: TenantAssignment) => ActionMenuItem[];
  onOpenRoom: (roomId: string, bedId?: string) => void;
}) {
  return (
    <div className={`${cardClass} hidden overflow-hidden lg:block`}>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">Name</th>
            <th scope="col" className="px-4 py-3 font-medium">Phone</th>
            <th scope="col" className="px-4 py-3 font-medium">Room & Bed</th>
            <th scope="col" className="px-4 py-3 font-medium">Next payment</th>
            <th scope="col" className="px-4 py-3 font-medium">Payment</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="w-16 px-4 py-3 text-right font-medium">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => {
            const { tenant } = item;
            return (
              <tr key={tenant.id} className="transition-colors hover:bg-slate-50/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={tenant.name} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{tenant.name}</p>
                      <p className="truncate text-xs text-slate-500">{tenant.occupation}</p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-600">{tenant.phone}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <RoomBedLabel item={item} onOpenRoom={onOpenRoom} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <NextPayment item={item} />
                </td>
                <td className="px-4 py-3">
                  <PaymentBadge status={item.payment.status} />
                </td>
                <td className="px-4 py-3">
                  <TenantStatusBadge status={tenant.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <ActionMenu label={`Actions for ${tenant.name}`} items={actionsFor(item)} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TenantCard({
  item,
  actions,
  onOpenRoom,
}: {
  item: TenantAssignment;
  actions: ActionMenuItem[];
  onOpenRoom: (roomId: string, bedId?: string) => void;
}) {
  const { tenant } = item;
  return (
    <li className={`${cardClass} p-4`}>
      <div className="flex items-start gap-3">
        <Avatar name={tenant.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{tenant.name}</p>
          <div className="text-sm">
            <RoomBedLabel item={item} onOpenRoom={onOpenRoom} />
          </div>
        </div>
        <div className="-mr-2 -mt-1.5">
          <ActionMenu label={`Actions for ${tenant.name}`} items={actions} />
        </div>
      </div>
      <a
        href={`tel:${tenant.phone}`}
        className="mt-2 inline-flex h-9 items-center gap-2 text-sm tabular-nums text-slate-600 hover:text-teal-700"
      >
        <Phone className="size-4 text-slate-400" aria-hidden />
        {tenant.phone}
      </a>
      <div className="mt-2 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Next payment</p>
          <NextPayment item={item} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <PaymentBadge status={item.payment.status} />
          <TenantStatusBadge status={tenant.status} />
        </div>
      </div>
    </li>
  );
}

function TenantsSkeleton() {
  return (
    <div className={`${cardClass} space-y-4 p-5`} aria-busy="true" aria-label="Loading tenants">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-6 w-20 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}
