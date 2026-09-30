import { digitsOnly, formatAadharInput } from "@/lib/aadhar";
import { addMonths } from "@/lib/dates";
import { createId } from "@/lib/id";
import { getAvailableBeds } from "@/lib/occupancy";
import { createDemoData } from "@/lib/data/seed";
import { loadData, saveData } from "@/lib/data/local-storage";
import type {
  PgData,
  Room,
  RoomInput,
  Tenant,
  TenantInput,
  TenantStatus,
} from "@/lib/types";

/**
 * The data API used by the app. Every function is async and returns the
 * full updated dataset, matching the shape a REST/GraphQL backend would
 * give. To move to a real backend, replace the bodies with `fetch` calls;
 * nothing in `context/` or `components/` needs to change.
 */
export type ServiceResult =
  | { ok: true; data: PgData }
  | { ok: false; error: string };

function fail(error: string): ServiceResult {
  return { ok: false, error };
}

function commit(data: PgData): ServiceResult {
  saveData(data);
  return { ok: true, data };
}

function sameRoomNumber(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export async function fetchPgData(): Promise<PgData> {
  return loadData();
}

/* ------------------------------- Rooms ------------------------------- */

export async function createRoom(input: RoomInput): Promise<ServiceResult> {
  const data = loadData();
  const roomNumber = input.roomNumber.trim();
  if (data.rooms.some((room) => sameRoomNumber(room.roomNumber, roomNumber))) {
    return fail(`Room ${roomNumber} already exists.`);
  }

  const now = new Date().toISOString();
  const room: Room = {
    id: createId(),
    roomNumber,
    beds: Array.from({ length: input.bedCount }, (_, index) => ({
      id: createId(),
      bedNumber: index + 1,
    })),
    createdAt: now,
    updatedAt: now,
  };
  return commit({ ...data, rooms: [...data.rooms, room] });
}

export async function updateRoom(id: string, input: RoomInput): Promise<ServiceResult> {
  const data = loadData();
  const room = data.rooms.find((item) => item.id === id);
  if (!room) return fail("Room not found.");

  const roomNumber = input.roomNumber.trim();
  if (data.rooms.some((item) => item.id !== id && sameRoomNumber(item.roomNumber, roomNumber))) {
    return fail(`Room ${roomNumber} already exists.`);
  }

  const occupiedBedIds = new Set(
    data.tenants.filter((tenant) => tenant.roomId === id).map((tenant) => tenant.bedId),
  );
  const removed = room.beds.filter((bed) => bed.bedNumber > input.bedCount);
  const blocked = removed.filter((bed) => occupiedBedIds.has(bed.id));
  if (blocked.length > 0) {
    const names = blocked.map((bed) => `Bed ${bed.bedNumber}`).join(", ");
    return fail(
      `${names} ${blocked.length === 1 ? "is" : "are"} occupied. Move ${blocked.length === 1 ? "that tenant" : "those tenants"} before reducing the bed count.`,
    );
  }

  const kept = room.beds.filter((bed) => bed.bedNumber <= input.bedCount);
  const added = Array.from({ length: Math.max(input.bedCount - kept.length, 0) }, (_, index) => ({
    id: createId(),
    bedNumber: kept.length + index + 1,
  }));

  const updated: Room = {
    ...room,
    roomNumber,
    beds: [...kept, ...added],
    updatedAt: new Date().toISOString(),
  };
  return commit({
    ...data,
    rooms: data.rooms.map((item) => (item.id === id ? updated : item)),
  });
}

export async function deleteRoom(id: string): Promise<ServiceResult> {
  const data = loadData();
  const assigned = data.tenants.filter((tenant) => tenant.roomId === id).length;
  if (assigned > 0) {
    return fail(
      `This room has ${plural(assigned, "tenant")} assigned. Move or remove them before deleting the room.`,
    );
  }
  return commit({ ...data, rooms: data.rooms.filter((room) => room.id !== id) });
}

/* ------------------------------ Tenants ------------------------------ */

function validateAssignment(data: PgData, input: TenantInput, tenantId?: string) {
  const room = data.rooms.find((item) => item.id === input.roomId);
  if (!room) return "Select a valid room.";

  const bed = room.beds.find((item) => item.id === input.bedId);
  if (!bed) return "Select a valid bed for this room.";

  const available = getAvailableBeds(room, data.tenants, tenantId);
  if (!available.some((item) => item.id === bed.id)) {
    return available.length === 0
      ? `Room ${room.roomNumber} is fully occupied.`
      : `Bed ${bed.bedNumber} in Room ${room.roomNumber} is already occupied.`;
  }
  return null;
}

function normalizeTenantInput(input: TenantInput) {
  return {
    name: input.name.trim(),
    phone: digitsOnly(input.phone),
    address: input.address.trim(),
    occupation: input.occupation.trim(),
    workOrStudentIn: input.workOrStudentIn.trim(),
    email: input.email.trim(),
    aadhar: formatAadharInput(input.aadhar),
    roomId: input.roomId,
    bedId: input.bedId,
    nextPaymentDate: input.nextPaymentDate,
  };
}

export async function createTenant(input: TenantInput): Promise<ServiceResult> {
  const data = loadData();
  const error = validateAssignment(data, input);
  if (error) return fail(error);

  const now = new Date().toISOString();
  const tenant: Tenant = {
    id: createId(),
    ...normalizeTenantInput(input),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  return commit({ ...data, tenants: [...data.tenants, tenant] });
}

function patchTenant(
  data: PgData,
  id: string,
  patch: (tenant: Tenant) => Partial<Tenant>,
): ServiceResult {
  const tenant = data.tenants.find((item) => item.id === id);
  if (!tenant) return fail("Tenant not found.");
  const updatedAt = new Date().toISOString();
  return commit({
    ...data,
    tenants: data.tenants.map((item) =>
      item.id === id ? { ...item, ...patch(item), updatedAt } : item,
    ),
  });
}

export async function updateTenant(id: string, input: TenantInput): Promise<ServiceResult> {
  const data = loadData();
  const error = validateAssignment(data, input, id);
  if (error) return fail(error);
  return patchTenant(data, id, () => normalizeTenantInput(input));
}

export async function deleteTenant(id: string): Promise<ServiceResult> {
  const data = loadData();
  return commit({ ...data, tenants: data.tenants.filter((tenant) => tenant.id !== id) });
}

/** Demo-only: records this cycle's rent by moving the due date one month forward. */
export async function recordPayment(id: string): Promise<ServiceResult> {
  return patchTenant(loadData(), id, (tenant) => ({
    nextPaymentDate: addMonths(tenant.nextPaymentDate, 1),
  }));
}

export async function setTenantStatus(id: string, status: TenantStatus): Promise<ServiceResult> {
  return patchTenant(loadData(), id, () => ({ status }));
}

/* ------------------------------- Demo -------------------------------- */

export async function resetDemoData(): Promise<ServiceResult> {
  return commit(createDemoData());
}

export async function clearAllData(): Promise<ServiceResult> {
  return commit({ rooms: [], tenants: [] });
}
