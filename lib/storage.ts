import type { Room, Tenant } from "@/lib/types";

export const STORAGE_KEYS = {
  rooms: "rooms",
  tenants: "tenants",
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadRooms(): Room[] {
  return readJson<Room[]>(STORAGE_KEYS.rooms, []);
}

export function saveRooms(rooms: Room[]) {
  writeJson(STORAGE_KEYS.rooms, rooms);
}

export function loadTenants(): Tenant[] {
  return readJson<Tenant[]>(STORAGE_KEYS.tenants, []);
}

export function saveTenants(tenants: Tenant[]) {
  writeJson(STORAGE_KEYS.tenants, tenants);
}
