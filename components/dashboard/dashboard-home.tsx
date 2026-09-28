"use client";

import {
  BedDouble,
  Building2,
  CircleCheck,
  CircleX,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { useDashboardData } from "@/context/pg-store";

export function DashboardHome() {
  const { stats, availability } = useDashboardData();

  const cards = [
    {
      label: "Total Rooms",
      value: stats.totalRooms,
      icon: Building2,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Total Beds",
      value: stats.totalBeds,
      icon: BedDouble,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Occupied Beds",
      value: stats.occupiedBeds,
      icon: CircleX,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Available Beds",
      value: stats.availableBeds,
      icon: CircleCheck,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total Tenants",
      value: stats.totalTenants,
      icon: Users,
      tone: "bg-teal-50 text-teal-700",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Dashboard"
        description="Live occupancy from rooms and tenants stored in this browser."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{card.label}</p>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {card.value}
              </p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-slate-900">
          Room availability
        </h2>
        {availability.length === 0 ? (
          <EmptyState
            icon={<BedDouble className="h-5 w-5" />}
            title="No rooms to show"
            description="Create rooms and assign tenants to see occupancy here."
          />
        ) : (
          <ul className="space-y-3">
            {availability.map((item) => {
              const full = item.availableBeds === 0;
              return (
                <li
                  key={item.room.id}
                  className={`flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                    full
                      ? "border-rose-200 bg-rose-50/70"
                      : "border-emerald-200 bg-emerald-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        full ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-slate-900">
                        Room {item.room.roomNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {full ? "Fully occupied" : "Beds available"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm text-slate-700 sm:text-right">
                    <span>{item.room.bedCount} Beds</span>
                    <span>{item.occupiedBeds} Occupied</span>
                    <span className="font-medium">
                      {item.availableBeds} Available
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
