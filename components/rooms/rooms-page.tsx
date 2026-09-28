"use client";

import { useMemo, useState } from "react";
import { BedDouble, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, EmptyState } from "@/components/ui/feedback";
import { Field, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { usePgStore } from "@/context/pg-store";
import { useToast } from "@/context/toast";
import { getRoomAvailability } from "@/lib/availability";
import type { Room } from "@/lib/types";
import { validateRoomForm, type FieldErrors } from "@/lib/validation";

const EMPTY_FORM = {
  roomNumber: "",
  bedCount: "",
};

export function RoomsPage() {
  const { rooms, tenants, addRoom, updateRoom, deleteRoom } = usePgStore();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((a, b) =>
        a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }),
      ),
    [rooms],
  );

  function startEdit(room: Room) {
    setEditingId(room.id);
    setForm({
      roomNumber: room.roomNumber,
      bedCount: String(room.bedCount),
    });
    setErrors({});
    setFormError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRoomForm(form);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      roomNumber: form.roomNumber,
      bedCount: Number(form.bedCount),
    };
    const result = editingId
      ? updateRoom(editingId, payload)
      : addRoom(payload);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    notify(editingId ? "Room updated successfully." : "Room saved successfully.");
    resetForm();
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    const result = deleteRoom(deleteTarget.id);
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    notify("Room deleted.");
    if (editingId === deleteTarget.id) {
      resetForm();
    }
    setDeleteTarget(null);
    setDeleteError("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Rooms"
        description="Add rooms and bed counts. Occupancy is calculated from tenant assignments."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            {editingId ? "Edit room" : "Add room"}
          </h2>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Room Number" error={errors.roomNumber}>
            <TextInput
              value={form.roomNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  roomNumber: event.target.value,
                }))
              }
              placeholder="101"
              error={Boolean(errors.roomNumber)}
            />
          </Field>
          <Field label="Number of Beds" error={errors.bedCount}>
            <TextInput
              type="number"
              min={1}
              max={50}
              value={form.bedCount}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bedCount: event.target.value,
                }))
              }
              placeholder="4"
              error={Boolean(errors.bedCount)}
            />
          </Field>
          {formError ? (
            <p className="sm:col-span-2 text-sm text-rose-600">{formError}</p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit">
              <Plus className="h-4 w-4" />
              {editingId ? "Update Room" : "Save Room"}
            </Button>
          </div>
        </form>
      </section>

      {sortedRooms.length === 0 ? (
        <EmptyState
          icon={<BedDouble className="h-5 w-5" />}
          title="No rooms yet"
          description="Add your first room to start tracking beds and assigning tenants."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Room Number</th>
                  <th className="px-4 py-3 font-medium">Total Beds</th>
                  <th className="px-4 py-3 font-medium">Occupied Beds</th>
                  <th className="px-4 py-3 font-medium">Available Beds</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRooms.map((room) => {
                  const availability = getRoomAvailability(room, tenants);
                  return (
                    <tr key={room.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {room.roomNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {availability.room.bedCount}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {availability.occupiedBeds}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            availability.availableBeds === 0
                              ? "bg-rose-50 text-rose-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {availability.availableBeds}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            onClick={() => startEdit(room)}
                            aria-label={`Edit room ${room.roomNumber}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => {
                              setDeleteError("");
                              setDeleteTarget(room);
                            }}
                            aria-label={`Delete room ${room.roomNumber}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete room?"
        description={
          deleteError ||
          `This will permanently remove Room ${deleteTarget?.roomNumber}. Tenants assigned to this room must be moved first.`
        }
        onClose={() => {
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
