"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  getAllRoomAvailability,
  getAvailableBedNumbers,
  getDashboardStats,
  getOccupiedBedNumbers,
} from "@/lib/availability";
import { createId } from "@/lib/id";
import { digitsOnly, formatAadharInput } from "@/lib/aadhar";
import {
  getPgServerSnapshot,
  getPgSnapshot,
  replaceRooms,
  replaceTenants,
  subscribeToPgStore,
} from "@/lib/pg-store-client";
import type { ActionResult, Room, Tenant } from "@/lib/types";

type RoomInput = {
  roomNumber: string;
  bedCount: number;
};

type TenantInput = {
  name: string;
  phone: string;
  address: string;
  occupation: string;
  workOrStudentIn: string;
  email: string;
  aadhar: string;
  roomId: string;
  bedNumber: number;
};

type PgStoreValue = {
  rooms: Room[];
  tenants: Tenant[];
  addRoom: (input: RoomInput) => ActionResult;
  updateRoom: (id: string, input: RoomInput) => ActionResult;
  deleteRoom: (id: string) => ActionResult;
  addTenant: (input: TenantInput) => ActionResult;
  updateTenant: (id: string, input: TenantInput) => ActionResult;
  deleteTenant: (id: string) => ActionResult;
};

const PgStoreContext = createContext<PgStoreValue | null>(null);

function normalizeRoomNumber(value: string) {
  return value.trim();
}

export function PgStoreProvider({ children }: { children: ReactNode }) {
  const data = useSyncExternalStore(
    subscribeToPgStore,
    getPgSnapshot,
    getPgServerSnapshot,
  );

  const rooms = data.rooms;
  const tenants = data.tenants;

  const addRoom = useCallback(
    (input: RoomInput): ActionResult => {
      const roomNumber = normalizeRoomNumber(input.roomNumber);
      const exists = rooms.some(
        (room) => room.roomNumber.toLowerCase() === roomNumber.toLowerCase(),
      );
      if (exists) {
        return { ok: false, error: "A room with this number already exists." };
      }

      const now = new Date().toISOString();
      replaceRooms([
        ...rooms,
        {
          id: createId(),
          roomNumber,
          bedCount: input.bedCount,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      return { ok: true };
    },
    [rooms],
  );

  const updateRoom = useCallback(
    (id: string, input: RoomInput): ActionResult => {
      const room = rooms.find((item) => item.id === id);
      if (!room) {
        return { ok: false, error: "Room not found." };
      }

      const roomNumber = normalizeRoomNumber(input.roomNumber);
      const duplicate = rooms.some(
        (item) =>
          item.id !== id &&
          item.roomNumber.toLowerCase() === roomNumber.toLowerCase(),
      );
      if (duplicate) {
        return { ok: false, error: "A room with this number already exists." };
      }

      const occupiedCount = getOccupiedBedNumbers(tenants, id).length;
      if (input.bedCount < occupiedCount) {
        return {
          ok: false,
          error: `This room already has ${occupiedCount} occupied bed${occupiedCount === 1 ? "" : "s"}. Increase the bed count or reassign tenants first.`,
        };
      }

      const invalidBeds = getOccupiedBedNumbers(tenants, id).filter(
        (bed) => bed > input.bedCount,
      );
      if (invalidBeds.length > 0) {
        return {
          ok: false,
          error: "Some assigned bed numbers are higher than the new bed count.",
        };
      }

      replaceRooms(
        rooms.map((item) =>
          item.id === id
            ? {
                ...item,
                roomNumber,
                bedCount: input.bedCount,
                updatedAt: new Date().toISOString(),
              }
            : item,
        ),
      );

      if (room.roomNumber !== roomNumber) {
        replaceTenants(
          tenants.map((tenant) =>
            tenant.roomId === id
              ? { ...tenant, roomNumber, updatedAt: new Date().toISOString() }
              : tenant,
          ),
        );
      }

      return { ok: true };
    },
    [rooms, tenants],
  );

  const deleteRoom = useCallback(
    (id: string): ActionResult => {
      const assigned = tenants.filter((tenant) => tenant.roomId === id);
      if (assigned.length > 0) {
        return {
          ok: false,
          error: `Cannot delete this room while ${assigned.length} tenant${assigned.length === 1 ? " is" : "s are"} assigned. Move or delete those tenants first.`,
        };
      }

      replaceRooms(rooms.filter((room) => room.id !== id));
      return { ok: true };
    },
    [rooms, tenants],
  );

  const assignTenant = useCallback(
    (input: TenantInput, tenantId?: string): ActionResult => {
      const room = rooms.find((item) => item.id === input.roomId);
      if (!room) {
        return { ok: false, error: "Select a valid room." };
      }

      if (input.bedNumber < 1 || input.bedNumber > room.bedCount) {
        return { ok: false, error: "Select a valid bed for this room." };
      }

      const availableBeds = getAvailableBedNumbers(room, tenants, tenantId);
      if (!availableBeds.includes(input.bedNumber)) {
        if (availableBeds.length === 0) {
          return {
            ok: false,
            error: `Room ${room.roomNumber} is fully occupied.`,
          };
        }
        return {
          ok: false,
          error: `Bed ${input.bedNumber} in Room ${room.roomNumber} is already occupied.`,
        };
      }

      return { ok: true };
    },
    [rooms, tenants],
  );

  const addTenant = useCallback(
    (input: TenantInput): ActionResult => {
      const assignment = assignTenant(input);
      if (!assignment.ok) {
        return assignment;
      }

      const room = rooms.find((item) => item.id === input.roomId);
      if (!room) {
        return { ok: false, error: "Select a valid room." };
      }

      const now = new Date().toISOString();
      replaceTenants([
        ...tenants,
        {
          id: createId(),
          name: input.name.trim(),
          phone: digitsOnly(input.phone),
          address: input.address.trim(),
          occupation: input.occupation.trim(),
          workOrStudentIn: input.workOrStudentIn.trim(),
          email: input.email.trim(),
          aadhar: formatAadharInput(input.aadhar),
          roomId: room.id,
          roomNumber: room.roomNumber,
          bedNumber: input.bedNumber,
          createdAt: now,
          updatedAt: now,
        },
      ]);
      return { ok: true };
    },
    [assignTenant, rooms, tenants],
  );

  const updateTenant = useCallback(
    (id: string, input: TenantInput): ActionResult => {
      const existing = tenants.find((tenant) => tenant.id === id);
      if (!existing) {
        return { ok: false, error: "Tenant not found." };
      }

      const assignment = assignTenant(input, id);
      if (!assignment.ok) {
        return assignment;
      }

      const room = rooms.find((item) => item.id === input.roomId);
      if (!room) {
        return { ok: false, error: "Select a valid room." };
      }

      replaceTenants(
        tenants.map((tenant) =>
          tenant.id === id
            ? {
                ...tenant,
                name: input.name.trim(),
                phone: digitsOnly(input.phone),
                address: input.address.trim(),
                occupation: input.occupation.trim(),
                workOrStudentIn: input.workOrStudentIn.trim(),
                email: input.email.trim(),
                aadhar: formatAadharInput(input.aadhar),
                roomId: room.id,
                roomNumber: room.roomNumber,
                bedNumber: input.bedNumber,
                updatedAt: new Date().toISOString(),
              }
            : tenant,
        ),
      );
      return { ok: true };
    },
    [assignTenant, rooms, tenants],
  );

  const deleteTenant = useCallback(
    (id: string): ActionResult => {
      replaceTenants(tenants.filter((tenant) => tenant.id !== id));
      return { ok: true };
    },
    [tenants],
  );

  const value = useMemo<PgStoreValue>(
    () => ({
      rooms,
      tenants,
      addRoom,
      updateRoom,
      deleteRoom,
      addTenant,
      updateTenant,
      deleteTenant,
    }),
    [
      addRoom,
      addTenant,
      deleteRoom,
      deleteTenant,
      rooms,
      tenants,
      updateRoom,
      updateTenant,
    ],
  );

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

export function useDashboardData() {
  const { rooms, tenants } = usePgStore();
  return {
    rooms,
    tenants,
    stats: getDashboardStats(rooms, tenants),
    availability: getAllRoomAvailability(rooms, tenants),
  };
}
