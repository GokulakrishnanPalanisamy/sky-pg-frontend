"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ConfirmDialog } from "@/components/ui/feedback";
import { RoomDetailsDrawer, type RoomDrawerHandlers } from "@/components/rooms/room-details-drawer";
import { RoomFormDialog } from "@/components/rooms/room-form-dialog";
import { TenantFormDialog, type TenantFormTarget } from "@/components/tenants/tenant-form-dialog";
import { usePgStore } from "@/context/pg-store";
import { useToast } from "@/context/toast";
import { addMonths, formatDate } from "@/lib/dates";
import type { Room, Tenant } from "@/lib/types";

type ConfirmState = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  tone?: "danger" | "primary";
  blockedReason?: string;
  /** The dialog closes when this resolves, unless it resolves to `false`. */
  onConfirm: () => Promise<boolean | void>;
};

type WorkspaceValue = {
  activeRoomId: string | null;
  openRoom: (roomId: string, bedId?: string) => void;
  openRoomForm: (room?: Room) => void;
  openTenantForm: (target?: TenantFormTarget) => void;
  requestDeleteRoom: (room: Room) => void;
  requestDeleteTenant: (tenant: Tenant, mode?: "delete" | "vacate") => void;
  recordPayment: (tenant: Tenant) => Promise<void>;
  toggleNotice: (tenant: Tenant) => Promise<void>;
  confirm: (state: ConfirmState) => void;
};

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

/**
 * Owns every drawer and dialog in the app so any page (or the global
 * search) can open them, and actions behave identically everywhere.
 */
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const store = usePgStore();
  const { notify } = useToast();
  const [room, setRoom] = useState<{ id: string; bedId?: string } | null>(null);
  const [roomForm, setRoomForm] = useState<{ room: Room | null } | null>(null);
  const [tenantForm, setTenantForm] = useState<TenantFormTarget | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const { rooms, tenants, occupancy } = store;
  const { deleteRoom, deleteTenant, recordPayment: storeRecordPayment, setTenantStatus } = store;

  const openRoom = useCallback((id: string, bedId?: string) => setRoom({ id, bedId }), []);
  const openRoomForm = useCallback((target?: Room) => setRoomForm({ room: target ?? null }), []);
  const openTenantForm = useCallback((target: TenantFormTarget = {}) => setTenantForm(target), []);
  const confirm = useCallback((state: ConfirmState) => setConfirmState(state), []);

  const requestDeleteRoom = useCallback(
    (target: Room) => {
      const assigned = tenants.filter((tenant) => tenant.roomId === target.id).length;
      setConfirmState({
        title: `Delete Room ${target.roomNumber}?`,
        description: `This permanently removes Room ${target.roomNumber} and its ${target.beds.length} bed${target.beds.length === 1 ? "" : "s"}.`,
        confirmLabel: "Delete room",
        blockedReason:
          assigned > 0
            ? `${assigned} tenant${assigned === 1 ? " is" : "s are"} assigned to this room. Move or vacate ${assigned === 1 ? "that tenant" : "those tenants"} first.`
            : undefined,
        onConfirm: async () => {
          const result = await deleteRoom(target.id);
          if (!result.ok) {
            notify(result.error, "error");
            return false;
          }
          notify(`Room ${target.roomNumber} deleted.`);
          setRoom((current) => (current?.id === target.id ? null : current));
        },
      });
    },
    [deleteRoom, notify, tenants],
  );

  const requestDeleteTenant = useCallback(
    (tenant: Tenant, mode: "delete" | "vacate" = "delete") => {
      const target = rooms.find((item) => item.id === tenant.roomId);
      const bed = target?.beds.find((item) => item.id === tenant.bedId);
      const where = target && bed ? `Bed ${bed.bedNumber} in Room ${target.roomNumber}` : "their bed";
      setConfirmState({
        title: mode === "vacate" ? `Vacate ${where}?` : `Remove ${tenant.name}?`,
        description: `${tenant.name} will be removed from the tenant list and ${where} will become available.`,
        confirmLabel: mode === "vacate" ? "Vacate bed" : "Remove tenant",
        onConfirm: async () => {
          const result = await deleteTenant(tenant.id);
          if (!result.ok) {
            notify(result.error, "error");
            return false;
          }
          notify(`${tenant.name} removed. ${where.charAt(0).toUpperCase() + where.slice(1)} is now available.`);
        },
      });
    },
    [deleteTenant, notify, rooms],
  );

  const recordPayment = useCallback(
    async (tenant: Tenant) => {
      const result = await storeRecordPayment(tenant.id);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      notify(`Payment recorded for ${tenant.name}. Next due ${formatDate(addMonths(tenant.nextPaymentDate, 1))}.`);
    },
    [notify, storeRecordPayment],
  );

  const toggleNotice = useCallback(
    async (tenant: Tenant) => {
      const next = tenant.status === "notice" ? "active" : "notice";
      const result = await setTenantStatus(tenant.id, next);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      notify(next === "notice" ? `${tenant.name} marked as on notice.` : `${tenant.name} marked as active.`);
    },
    [notify, setTenantStatus],
  );

  const handlers = useMemo<RoomDrawerHandlers>(
    () => ({
      onAssign: (roomId, bedId) => openTenantForm({ roomId, bedId }),
      onEditTenant: (tenant) => openTenantForm({ tenant }),
      onRecordPayment: (tenant) => void recordPayment(tenant),
      onVacate: (tenant) => requestDeleteTenant(tenant, "vacate"),
      onEditRoom: (target) => openRoomForm(target),
      onDeleteRoom: (target) => requestDeleteRoom(target),
    }),
    [openRoomForm, openTenantForm, recordPayment, requestDeleteRoom, requestDeleteTenant],
  );

  const value = useMemo<WorkspaceValue>(
    () => ({
      activeRoomId: room?.id ?? null,
      openRoom,
      openRoomForm,
      openTenantForm,
      requestDeleteRoom,
      requestDeleteTenant,
      recordPayment,
      toggleNotice,
      confirm,
    }),
    [confirm, openRoom, openRoomForm, openTenantForm, recordPayment, requestDeleteRoom, requestDeleteTenant, room?.id, toggleNotice],
  );

  // Always read the live occupancy so the drawer updates after each action.
  const roomOccupancy = room ? (occupancy.find((item) => item.room.id === room.id) ?? null) : null;

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
      <RoomDetailsDrawer
        occupancy={roomOccupancy}
        highlightBedId={room?.bedId}
        onClose={() => setRoom(null)}
        handlers={handlers}
      />
      <RoomFormDialog open={Boolean(roomForm)} room={roomForm?.room} onClose={() => setRoomForm(null)} />
      <TenantFormDialog target={tenantForm} onClose={() => setTenantForm(null)} />
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title ?? ""}
        description={confirmState?.description ?? ""}
        confirmLabel={confirmState?.confirmLabel}
        tone={confirmState?.tone}
        blockedReason={confirmState?.blockedReason}
        onConfirm={async () => {
          if (!confirmState) return;
          const keepOpen = (await confirmState.onConfirm()) === false;
          if (!keepOpen) setConfirmState(null);
        }}
        onClose={() => setConfirmState(null)}
      />
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
