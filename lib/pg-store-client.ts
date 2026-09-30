import { fetchPgData } from "@/lib/data/pg-service";
import { subscribeToExternalChanges } from "@/lib/data/local-storage";
import type { PgData } from "@/lib/types";

/** In-memory cache of the dataset, shared by every component via `useSyncExternalStore`. */
export type PgSnapshot = PgData & { ready: boolean };

const SERVER_SNAPSHOT: PgSnapshot = { rooms: [], tenants: [], ready: false };

let snapshot: PgSnapshot = SERVER_SNAPSHOT;
let loading = false;
const listeners = new Set<() => void>();
let stopExternal: (() => void) | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

async function refresh() {
  const data = await fetchPgData();
  snapshot = { ...data, ready: true };
  emit();
}

export function subscribeToPgStore(listener: () => void) {
  listeners.add(listener);
  if (!snapshot.ready && !loading) {
    loading = true;
    void refresh().finally(() => {
      loading = false;
    });
  }
  stopExternal ??= subscribeToExternalChanges(() => void refresh());
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopExternal?.();
      stopExternal = null;
    }
  };
}

export function getPgSnapshot() {
  return snapshot;
}

export function getPgServerSnapshot() {
  return SERVER_SNAPSHOT;
}

export function setPgData(data: PgData) {
  snapshot = { ...data, ready: true };
  emit();
}
