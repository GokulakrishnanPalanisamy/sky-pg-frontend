"use client";

import {
  ArrowRight,
  BedDouble,
  Building2,
  CalendarClock,
  CircleCheck,
  DoorOpen,
  Plus,
  UserPlus,
  UserRound,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { Avatar, BedLegend, PaymentBadge, PAYMENT_META } from "@/components/pg/status";
import { RoomGrid, RoomGridSkeleton } from "@/components/rooms/room-grid";
import { usePgStore } from "@/context/pg-store";
import { useWorkspace } from "@/context/workspace";
import { formatDate, formatRelativeDays } from "@/lib/dates";
import { percentOf } from "@/lib/occupancy";

const UPCOMING_LIMIT = 6;

export function DashboardHome() {
  const { ready, stats, occupancy, assignments, tenants } = usePgStore();
  const { openRoom, openRoomForm, openTenantForm, activeRoomId } = useWorkspace();

  const onNotice = tenants.filter((tenant) => tenant.status === "notice").length;
  const upcoming = [...assignments]
    .sort((a, b) => a.payment.daysUntilDue - b.payment.daysUntilDue)
    .slice(0, UPCOMING_LIMIT);

  const cards = [
    {
      label: "Total Rooms",
      value: stats.totalRooms,
      context: "Across the property",
      icon: Building2,
      tone: "indigo" as const,
    },
    {
      label: "Total Beds",
      value: stats.totalBeds,
      context: "All rooms combined",
      icon: BedDouble,
      tone: "violet" as const,
    },
    {
      label: "Available Beds",
      value: stats.availableBeds,
      context: `${percentOf(stats.availableBeds, stats.totalBeds)}% available`,
      icon: CircleCheck,
      tone: "green" as const,
    },
    {
      label: "Occupied Beds",
      value: stats.occupiedBeds,
      context: `${percentOf(stats.occupiedBeds, stats.totalBeds)}% occupied`,
      icon: UserRound,
      tone: "red" as const,
    },
    {
      label: "Total Tenants",
      value: stats.totalTenants,
      context: onNotice ? `${onNotice} on notice` : "Active residents",
      icon: UsersRound,
      tone: "teal" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live occupancy and rent status across your rooms."
        actions={
          <>
            <Button variant="secondary" onClick={() => openTenantForm()} disabled={!ready}>
              <UserPlus aria-hidden />
              Add tenant
            </Button>
            <Button onClick={() => openRoomForm()} disabled={!ready}>
              <Plus aria-hidden />
              Add room
            </Button>
          </>
        }
      />

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, index) =>
          ready ? (
            <StatCard key={card.label} {...card} className={index === 4 ? "col-span-2 md:col-span-1" : ""} />
          ) : (
            <StatCardSkeleton key={card.label} className={index === 4 ? "col-span-2 md:col-span-1" : ""} />
          ),
        )}
      </section>

      <Card aria-label="Room overview">
        <CardHeader
          title="Room Overview"
          description={
            <>
              <span className="pointer-coarse:hidden">Click a room to view details. Hover to see occupancy.</span>
              <span className="hidden pointer-coarse:inline">Tap a room to see who is in each bed.</span>
            </>
          }
          actions={
            <Link
              href="/rooms"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
            >
              View all
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <div className="p-5 pt-4 md:p-6 md:pt-4">
          {!ready ? (
            <RoomGridSkeleton count={4} />
          ) : occupancy.length === 0 ? (
            <EmptyState
              icon={<DoorOpen />}
              title="No rooms yet"
              description="Create your first room to start managing occupancy."
              action={
                <Button onClick={() => openRoomForm()}>
                  <Plus aria-hidden />
                  Add room
                </Button>
              }
            />
          ) : (
            <RoomGrid items={occupancy} onOpen={openRoom} selectedId={activeRoomId} />
          )}
        </div>
        {ready && occupancy.length > 0 ? (
          <div className="border-t border-slate-100 px-5 py-4 md:px-6">
            <BedLegend />
          </div>
        ) : null}
      </Card>

      <Card aria-label="Upcoming payments">
        <CardHeader
          title="Upcoming payments"
          description={
            stats.paymentsOverdue || stats.paymentsDueSoon
              ? `${stats.paymentsOverdue} overdue · ${stats.paymentsDueSoon} due in the next 5 days`
              : "All rent payments are on track."
          }
          actions={
            <Link
              href="/tenants"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
            >
              All tenants
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <div className="p-3 pt-3 md:p-4">
          {!ready ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <EmptyState
              compact
              icon={<CalendarClock />}
              title="No tenants yet"
              description="Payment reminders appear here once tenants are assigned to beds."
              action={
                <Button variant="secondary" onClick={() => openTenantForm()} disabled={occupancy.length === 0}>
                  <UserPlus aria-hidden />
                  Add tenant
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-1 lg:grid-cols-2 lg:gap-x-4">
              {upcoming.map(({ tenant, room, bed, payment }) => (
                <li key={tenant.id}>
                  <button
                    type="button"
                    onClick={() => openRoom(tenant.roomId, tenant.bedId)}
                    className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <Avatar name={tenant.name} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{tenant.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {room && bed ? `Room ${room.roomNumber} · Bed ${bed.bedNumber}` : "Unassigned"}
                        <span className="sm:hidden"> · {formatDate(payment.dueDate)}</span>
                      </span>
                    </span>
                    <span className="hidden text-right sm:block">
                      <span className="block text-sm font-medium text-slate-900">{formatDate(payment.dueDate)}</span>
                      <span className={`block text-xs ${PAYMENT_META[payment.status].text}`}>
                        {formatRelativeDays(payment.daysUntilDue)}
                      </span>
                    </span>
                    <span className="w-[84px] shrink-0 text-right">
                      <PaymentBadge status={payment.status} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
