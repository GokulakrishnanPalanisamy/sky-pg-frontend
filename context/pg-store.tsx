"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import * as service from "@/lib/data/pg-service";
import type { ServiceResult } from "@/lib/data/pg-service";
import {
  getAllRoomOccupancy,
  getDashboardStats,
  getTenantAssignments,
} from "@/lib/occupancy";
import {
  getPgServerSnapshot,
  getPgSnapshot,
  setPgData,
  subscribeToPgStore,
} from "@/lib/pg-store-client";
import type {
  ActionResult,
  DashboardStats,
  Room,
  RoomInput,
  RoomOccupancy,
  Tenant,
  TenantAssignment,
  TenantInput,
  TenantStatus,
} from "@/lib/types";

type PgStoreValue = {
  /** False until data has loaded on the client; render skeletons meanwhile. */
  ready: boolean;
  rooms: Room[];
  tenants: Tenant[];
  occupancy: RoomOccupancy[];
  assignments: TenantAssignment[];
  stats: DashboardStats;
  addRoom: (input: RoomInput) => Promise<ActionResult>;
  updateRoom: (id: string, input: RoomInput) => Promise<ActionResult>;
  deleteRoom: (id: string) => Promise<ActionResult>;
  addTenant: (input: TenantInput) => Promise<ActionResult>;
  updateTenant: (id: string, input: TenantInput) => Promise<ActionResult>;
  deleteTenant: (id: string) => Promise<ActionResult>;
  recordPayment: (id: string) => Promise<ActionResult>;
  setTenantStatus: (id: string, status: TenantStatus) => Promise<ActionResult>;
  resetDemoData: () => Promise<ActionResult>;
  clearAllData: () => Promise<ActionResult>;
};

const PgStoreContext = createContext<PgStoreValue | null>(null);

async function run(operation: Promise<ServiceResult>): Promise<ActionResult> {
  try {
    const result = await operation;
    if (!result.ok) return result;
    setPgData(result.data);
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

const actions = {
  addRoom: (input: RoomInput) => run(service.createRoom(input)),
  updateRoom: (id: string, input: RoomInput) => run(service.updateRoom(id, input)),
  deleteRoom: (id: string) => run(service.deleteRoom(id)),
  addTenant: (input: TenantInput) => run(service.createTenant(input)),
  updateTenant: (id: string, input: TenantInput) => run(service.updateTenant(id, input)),
  deleteTenant: (id: string) => run(service.deleteTenant(id)),
  recordPayment: (id: string) => run(service.recordPayment(id)),
  setTenantStatus: (id: string, status: TenantStatus) =>
    run(service.setTenantStatus(id, status)),
  resetDemoData: () => run(service.resetDemoData()),
  clearAllData: () => run(service.clearAllData()),
};

export function PgStoreProvider({ children }: { children: ReactNode }) {
  const data = useSyncExternalStore(
    subscribeToPgStore,
    getPgSnapshot,
    getPgServerSnapshot,
  );

  const value = useMemo<PgStoreValue>(() => {
    const occupancy = getAllRoomOccupancy(data.rooms, data.tenants);
    const assignments = getTenantAssignments(data.rooms, data.tenants);
    return {
      ready: data.ready,
      rooms: data.rooms,
      tenants: data.tenants,
      occupancy,
      assignments,
      stats: getDashboardStats(occupancy, assignments),
      ...actions,
    };
  }, [data]);

  return (
    <PgStoreContext.Provider value={value}>{children}</PgStoreContext.Provider>
  );
}

export function usePgStore() {
  const context = useContext(PgStoreContext);
  if (!context) {
    throw new Error("usePgStore must be used within PgStoreProvider");
  }
  return context;
}
