import { daysBetween, todayKey } from "@/lib/dates";
import type {
  BedOccupancy,
  DashboardStats,
  Payment,
  PaymentStatus,
  Room,
  RoomOccupancy,
  Tenant,
  TenantAssignment,
} from "@/lib/types";

/** A payment within this many days is flagged as "due soon". */
export const DUE_SOON_DAYS = 5;

export function compareRoomNumbers(a: Room, b: Room) {
  return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
}

export function getPaymentStatus(daysUntilDue: number): PaymentStatus {
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= DUE_SOON_DAYS) return "due_soon";
  return "paid";
}

export function getPayment(tenant: Tenant, today = todayKey()): Payment {
  const daysUntilDue = daysBetween(today, tenant.nextPaymentDate);
  return {
    dueDate: tenant.nextPaymentDate,
    daysUntilDue,
    status: getPaymentStatus(daysUntilDue),
  };
}

/**
 * Occupancy is always derived from tenant assignments so bed status can
 * never drift out of sync with who actually lives there.
 */
export function getRoomOccupancy(
  room: Room,
  tenants: Tenant[],
  today = todayKey(),
): RoomOccupancy {
  const tenantByBed = new Map(
    tenants
      .filter((tenant) => tenant.roomId === room.id)
      .map((tenant) => [tenant.bedId, tenant]),
  );

  const beds: BedOccupancy[] = [...room.beds]
    .sort((a, b) => a.bedNumber - b.bedNumber)
    .map((bed) => {
      const tenant = tenantByBed.get(bed.id);
      return tenant
        ? {
            ...bed,
            roomId: room.id,
            status: "occupied",
            tenant,
            payment: getPayment(tenant, today),
          }
        : { ...bed, roomId: room.id, status: "available" };
    });

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((bed) => bed.status === "occupied").length;

  return {
    room,
    beds,
    totalBeds,
    occupiedBeds,
    availableBeds: totalBeds - occupiedBeds,
    occupancyRate: totalBeds ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
  };
}

export function getAllRoomOccupancy(rooms: Room[], tenants: Tenant[]) {
  const today = todayKey();
  return [...rooms]
    .sort(compareRoomNumbers)
    .map((room) => getRoomOccupancy(room, tenants, today));
}

/** Beds a tenant can be assigned to. Pass `tenantId` when editing so their current bed stays selectable. */
export function getAvailableBeds(
  room: Room,
  tenants: Tenant[],
  tenantId?: string,
) {
  const taken = new Set(
    tenants
      .filter((tenant) => tenant.roomId === room.id && tenant.id !== tenantId)
      .map((tenant) => tenant.bedId),
  );
  return [...room.beds]
    .sort((a, b) => a.bedNumber - b.bedNumber)
    .filter((bed) => !taken.has(bed.id));
}

export function getTenantAssignments(
  rooms: Room[],
  tenants: Tenant[],
): TenantAssignment[] {
  const today = todayKey();
  const roomById = new Map(rooms.map((room) => [room.id, room]));
  return [...tenants]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
    .map((tenant) => {
      const room = roomById.get(tenant.roomId);
      return {
        tenant,
        room,
        bed: room?.beds.find((bed) => bed.id === tenant.bedId),
        payment: getPayment(tenant, today),
      };
    });
}

export function getDashboardStats(
  occupancy: RoomOccupancy[],
  assignments: TenantAssignment[],
): DashboardStats {
  const totalBeds = occupancy.reduce((sum, item) => sum + item.totalBeds, 0);
  const occupiedBeds = occupancy.reduce((sum, item) => sum + item.occupiedBeds, 0);

  return {
    totalRooms: occupancy.length,
    totalBeds,
    occupiedBeds,
    availableBeds: totalBeds - occupiedBeds,
    totalTenants: assignments.length,
    paymentsDueSoon: assignments.filter((a) => a.payment.status === "due_soon").length,
    paymentsOverdue: assignments.filter((a) => a.payment.status === "overdue").length,
  };
}

export function percentOf(part: number, total: number) {
  return total ? Math.round((part / total) * 100) : 0;
}
