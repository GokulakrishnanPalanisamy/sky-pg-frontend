import { addMonths, isValidDateKey, todayKey } from "@/lib/dates";
import { createId } from "@/lib/id";
import { createDemoData } from "@/lib/data/seed";
import type { PgData, Room, Tenant } from "@/lib/types";

/**
 * The only module that touches `window.localStorage`. Swapping persistence
 * for a backend means replacing `pg-service.ts`, which is the sole caller.
 */
export const STORAGE_KEY = "skypg.data.v2";

/** Keys written by the first prototype (rooms had `bedCount`, tenants had `bedNumber`). */
const LEGACY_KEYS = { rooms: "rooms", tenants: "tenants" } as const;

type LegacyRoom = { id: string; roomNumber: string; bedCount: number; createdAt?: string; updatedAt?: string };
type LegacyTenant = Omit<Tenant, "bedId" | "nextPaymentDate" | "status" | "createdAt" | "updatedAt"> & {
  bedNumber: number;
  createdAt?: string;
  updatedAt?: string;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function migrateLegacy(): PgData | null {
  const legacyRooms = readJson<LegacyRoom[]>(LEGACY_KEYS.rooms);
  const legacyTenants = readJson<LegacyTenant[]>(LEGACY_KEYS.tenants) ?? [];
  if (!Array.isArray(legacyRooms) || legacyRooms.length === 0) {
    return null;
  }

  const now = new Date().toISOString();
  const rooms: Room[] = legacyRooms.map((room) => ({
    id: room.id,
    roomNumber: room.roomNumber,
    beds: Array.from({ length: Math.max(room.bedCount, 0) }, (_, index) => ({
      id: createId(),
      bedNumber: index + 1,
    })),
    createdAt: room.createdAt ?? now,
    updatedAt: room.updatedAt ?? now,
  }));

  const defaultDue = addMonths(todayKey(), 1);
  const tenants: Tenant[] = legacyTenants.flatMap((tenant) => {
    const bed = rooms
      .find((room) => room.id === tenant.roomId)
      ?.beds.find((item) => item.bedNumber === tenant.bedNumber);
    if (!bed) return [];
    return [
      {
        id: tenant.id,
        name: tenant.name,
        phone: tenant.phone,
        address: tenant.address,
        occupation: tenant.occupation,
        workOrStudentIn: tenant.workOrStudentIn,
        email: tenant.email,
        aadhar: tenant.aadhar,
        roomId: tenant.roomId,
        bedId: bed.id,
        nextPaymentDate: defaultDue,
        status: "active" as const,
        createdAt: tenant.createdAt ?? now,
        updatedAt: tenant.updatedAt ?? now,
      },
    ];
  });

  return { rooms, tenants };
}

function isPgData(value: unknown): value is PgData {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as PgData).rooms) &&
    Array.isArray((value as PgData).tenants)
  );
}

function sanitize(data: PgData): PgData {
  const fallbackDue = addMonths(todayKey(), 1);
  return {
    rooms: data.rooms.map((room) => ({ ...room, beds: Array.isArray(room.beds) ? room.beds : [] })),
    tenants: data.tenants.map((tenant) => ({
      ...tenant,
      status: tenant.status ?? "active",
      nextPaymentDate: isValidDateKey(tenant.nextPaymentDate ?? "")
        ? tenant.nextPaymentDate
        : fallbackDue,
    })),
  };
}

/**
 * Loads persisted data. On the very first visit it migrates the old
 * prototype's data if present, otherwise seeds demo data. Once the key
 * exists, an empty list stays empty (so empty states can be shown).
 */
export function loadData(): PgData {
  const stored = readJson<unknown>(STORAGE_KEY);
  if (isPgData(stored)) {
    return sanitize(stored);
  }

  const initial = migrateLegacy() ?? createDemoData();
  saveData(initial);
  return initial;
}

export function saveData(data: PgData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or disabled (private mode). The in-memory store keeps working.
  }
}

/** Fires when another tab changes the data. */
export function subscribeToExternalChanges(listener: () => void) {
  function handle(event: StorageEvent) {
    if (event.key === STORAGE_KEY) listener();
  }
  window.addEventListener("storage", handle);
  return () => window.removeEventListener("storage", handle);
}
