import type {
  DashboardStats,
  Room,
  RoomAvailability,
  Tenant,
} from "@/lib/types";

export function getOccupiedBedNumbers(
  tenants: Tenant[],
  roomId: string,
  excludeTenantId?: string,
) {
  return tenants
    .filter(
      (tenant) =>
        tenant.roomId === roomId &&
        tenant.id !== excludeTenantId,
    )
    .map((tenant) => tenant.bedNumber)
    .sort((a, b) => a - b);
}

export function getRoomAvailability(
  room: Room,
  tenants: Tenant[],
  excludeTenantId?: string,
): RoomAvailability {
  const occupiedBedNumbers = getOccupiedBedNumbers(
    tenants,
    room.id,
    excludeTenantId,
  );
  const occupiedBeds = occupiedBedNumbers.length;
  return {
    room,
    occupiedBeds,
    availableBeds: Math.max(room.bedCount - occupiedBeds, 0),
    occupiedBedNumbers,
  };
}

export function getAvailableBedNumbers(
  room: Room,
  tenants: Tenant[],
  excludeTenantId?: string,
) {
  const occupied = new Set(
    getOccupiedBedNumbers(tenants, room.id, excludeTenantId),
  );
  return Array.from({ length: room.bedCount }, (_, index) => index + 1).filter(
    (bed) => !occupied.has(bed),
  );
}

export function getAllRoomAvailability(rooms: Room[], tenants: Tenant[]) {
  return rooms
    .map((room) => getRoomAvailability(room, tenants))
    .sort((a, b) =>
      a.room.roomNumber.localeCompare(b.room.roomNumber, undefined, {
        numeric: true,
      }),
    );
}

export function getDashboardStats(
  rooms: Room[],
  tenants: Tenant[],
): DashboardStats {
  const availability = getAllRoomAvailability(rooms, tenants);
  const totalBeds = availability.reduce(
    (sum, item) => sum + item.room.bedCount,
    0,
  );
  const occupiedBeds = availability.reduce(
    (sum, item) => sum + item.occupiedBeds,
    0,
  );

  return {
    totalRooms: rooms.length,
    totalBeds,
    occupiedBeds,
    availableBeds: totalBeds - occupiedBeds,
    totalTenants: tenants.length,
  };
}
