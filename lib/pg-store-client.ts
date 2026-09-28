import { loadRooms, loadTenants, saveRooms, saveTenants } from "@/lib/storage";
import type { Room, Tenant } from "@/lib/types";

export type PgSnapshot = {
  rooms: Room[];
  tenants: Tenant[];
};

const EMPTY_SNAPSHOT: PgSnapshot = { rooms: [], tenants: [] };

let snapshot: PgSnapshot = EMPTY_SNAPSHOT;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function loadIfNeeded() {
  if (loaded || typeof window === "undefined") {
    return;
  }
  snapshot = {
    rooms: loadRooms(),
    tenants: loadTenants(),
  };
  loaded = true;
}

export function subscribeToPgStore(listener: () => void) {
  listeners.add(listener);
  queueMicrotask(() => {
    loadIfNeeded();
    emit();
  });
  return () => listeners.delete(listener);
}

export function getPgSnapshot() {
  return snapshot;
}

export function getPgServerSnapshot() {
  return EMPTY_SNAPSHOT;
}

export function replaceRooms(rooms: Room[]) {
  loadIfNeeded();
  snapshot = { ...snapshot, rooms };
  saveRooms(rooms);
  emit();
}

export function replaceTenants(tenants: Tenant[]) {
  loadIfNeeded();
  snapshot = { ...snapshot, tenants };
  saveTenants(tenants);
  emit();
}
