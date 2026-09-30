"use client";

import { DoorOpen, Eye, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { SearchInput } from "@/components/ui/field";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { PageHeader } from "@/components/ui/page-header";
import { BedLegend } from "@/components/pg/status";
import { RoomGrid, RoomGridSkeleton } from "@/components/rooms/room-grid";
import { usePgStore } from "@/context/pg-store";
import { useWorkspace } from "@/context/workspace";
import type { RoomOccupancy } from "@/lib/types";

type RoomFilter = "all" | "occupied" | "available";

const FILTERS: Record<RoomFilter, (item: RoomOccupancy) => boolean> = {
  all: () => true,
  occupied: (item) => item.occupiedBeds > 0,
  available: (item) => item.availableBeds > 0,
};

export function RoomsPage() {
  const { ready, occupancy, stats } = usePgStore();
  const { openRoom, openRoomForm, requestDeleteRoom, activeRoomId } = useWorkspace();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoomFilter>("all");

  const q = query.trim().toLowerCase().replace(/^room\s*/, "");
  const searched = occupancy.filter((item) => item.room.roomNumber.toLowerCase().includes(q));
  const visible = searched.filter(FILTERS[filter]);

  const options = (["all", "occupied", "available"] as const).map((value) => ({
    value,
    label: value === "all" ? "All rooms" : value === "occupied" ? "Occupied" : "Available",
    count: searched.filter(FILTERS[value]).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms"
        description="Manage your rooms and bed occupancy."
        actions={
          <Button onClick={() => openRoomForm()} disabled={!ready}>
            <Plus aria-hidden />
            Add room
          </Button>
        }
      />

      {!ready ? (
        <RoomGridSkeleton />
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
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterTabs label="Filter rooms" value={filter} options={options} onChange={setFilter} />
            <div className="flex items-center gap-4">
              <p className="hidden whitespace-nowrap text-sm text-slate-500 xl:block">
                <span className="font-semibold text-slate-900">{stats.availableBeds}</span> of {stats.totalBeds} beds free
              </p>
              <SearchInput
                label="Search rooms"
                placeholder="Search room number…"
                value={query}
                onValueChange={setQuery}
                className="w-full lg:w-72"
              />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              compact
              icon={<SearchX />}
              title="No matching rooms"
              description={
                q
                  ? `No ${filter === "all" ? "" : `${filter} `}rooms match “${query.trim()}”.`
                  : filter === "occupied"
                    ? "No rooms have tenants yet."
                    : "Every bed is currently occupied."
              }
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
            <RoomGrid
              items={visible}
              onOpen={openRoom}
              selectedId={activeRoomId}
              getActions={(item) => [
                { label: "View details", icon: Eye, onSelect: () => openRoom(item.room.id) },
                { label: "Edit room", icon: Pencil, onSelect: () => openRoomForm(item.room) },
                { label: "Delete room", icon: Trash2, tone: "danger", onSelect: () => requestDeleteRoom(item.room) },
              ]}
            />
          )}

          <BedLegend className="pt-1" />
        </>
      )}
    </div>
  );
}
