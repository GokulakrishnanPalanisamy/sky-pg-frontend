import type { ActionMenuItem } from "@/components/ui/action-menu";
import { Skeleton } from "@/components/ui/feedback";
import { RoomCard } from "@/components/rooms/room-card";
import type { RoomOccupancy } from "@/lib/types";

const GRID = "grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4";

export function RoomGrid({
  items,
  onOpen,
  selectedId,
  getActions,
}: {
  items: RoomOccupancy[];
  onOpen: (roomId: string) => void;
  selectedId?: string | null;
  getActions?: (item: RoomOccupancy) => ActionMenuItem[];
}) {
  return (
    <div className={GRID}>
      {items.map((item) => (
        <RoomCard
          key={item.room.id}
          occupancy={item}
          onOpen={onOpen}
          selected={selectedId === item.room.id}
          actions={getActions?.(item)}
        />
      ))}
    </div>
  );
}

export function RoomGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={GRID} aria-busy="true" aria-label="Loading rooms">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            {Array.from({ length: 4 }, (_, bed) => (
              <Skeleton key={bed} className="size-9 rounded-[10px]" />
            ))}
          </div>
          <Skeleton className="mt-4 h-3 w-36" />
          <Skeleton className="mt-2 h-1.5 w-full" />
        </div>
      ))}
    </div>
  );
}
