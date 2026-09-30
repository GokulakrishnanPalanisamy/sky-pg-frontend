"use client";

import { BedSingle, DoorOpen, Minus, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { usePgStore } from "@/context/pg-store";
import { useToast } from "@/context/toast";
import type { Room } from "@/lib/types";
import {
  MAX_BEDS_PER_ROOM,
  validateRoomForm,
  type FieldErrors,
  type RoomFormValues,
} from "@/lib/validation";

export function RoomFormDialog({
  open,
  room,
  onClose,
}: {
  open: boolean;
  /** Edit this room; omit to create a new one. */
  room?: Room | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      variant="modal"
      size="sm"
      title={room ? `Edit Room ${room.roomNumber}` : "Add room"}
      description={
        room ? "Update the room number or bed count." : "Beds are created automatically and start as available."
      }
      icon={
        <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <DoorOpen className="size-5" aria-hidden />
        </span>
      }
    >
      <RoomForm room={room ?? null} onDone={onClose} />
    </Sheet>
  );
}

function RoomForm({ room, onDone }: { room: Room | null; onDone: () => void }) {
  const { addRoom, updateRoom, tenants } = usePgStore();
  const { notify } = useToast();
  const [values, setValues] = useState<RoomFormValues>({
    roomNumber: room?.roomNumber ?? "",
    bedCount: room ? String(room.beds.length) : "4",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const occupiedBedNumbers = new Set(
    room
      ? room.beds
          .filter((bed) => tenants.some((tenant) => tenant.bedId === bed.id))
          .map((bed) => bed.bedNumber)
      : [],
  );
  const occupied = occupiedBedNumbers.size;
  const count = Number(values.bedCount);
  const previewCount = Number.isInteger(count) ? Math.min(Math.max(count, 0), MAX_BEDS_PER_ROOM) : 0;

  function setBedCount(next: number) {
    setValues((current) => ({
      ...current,
      bedCount: String(Math.min(Math.max(next, 1), MAX_BEDS_PER_ROOM)),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRoomForm(values);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    const input = { roomNumber: values.roomNumber, bedCount: Number(values.bedCount) };
    const result = room ? await updateRoom(room.id, input) : await addRoom(input);
    setSaving(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    notify(
      room
        ? `Room ${input.roomNumber.trim()} updated.`
        : `Room ${input.roomNumber.trim()} added with ${input.bedCount} bed${input.bedCount === 1 ? "" : "s"}.`,
    );
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-5 px-5 py-5 md:px-6">
        <Field label="Room number" error={errors.roomNumber}>
          <TextInput
            value={values.roomNumber}
            onChange={(event) => setValues((current) => ({ ...current, roomNumber: event.target.value }))}
            placeholder="e.g. 101"
            autoComplete="off"
            data-autofocus
          />
        </Field>

        <Field
          label="Number of beds"
          error={errors.bedCount}
          hint={occupied > 0 ? `${occupied} bed${occupied === 1 ? " is" : "s are"} occupied. Occupied beds can't be removed.` : `Up to ${MAX_BEDS_PER_ROOM} beds per room.`}
        >
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="w-11 px-0"
              aria-label="Remove a bed"
              onClick={() => setBedCount((Number(values.bedCount) || 1) - 1)}
            >
              <Minus aria-hidden />
            </Button>
            <TextInput
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_BEDS_PER_ROOM}
              value={values.bedCount}
              onChange={(event) => setValues((current) => ({ ...current, bedCount: event.target.value }))}
              className="text-center tabular-nums"
            />
            <Button
              variant="secondary"
              className="w-11 px-0"
              aria-label="Add a bed"
              onClick={() => setBedCount((Number(values.bedCount) || 0) + 1)}
            >
              <Plus aria-hidden />
            </Button>
          </div>
        </Field>

        {previewCount > 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4" aria-hidden>
            <p className="mb-3 text-xs font-medium text-slate-500">Preview</p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: previewCount }, (_, index) => (
                <span
                  key={index}
                  className={`inline-flex size-9 items-center justify-center rounded-[10px] ring-1 ring-inset ${
                    occupiedBedNumbers.has(index + 1)
                      ? "bg-rose-50 text-rose-500 ring-rose-500/20"
                      : "bg-emerald-50 text-emerald-600 ring-emerald-500/20"
                  }`}
                >
                  <BedSingle className="size-[18px]" />
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {formError ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
            {formError}
          </p>
        ) : null}
      </div>
      <SheetFooter>
        <Button variant="secondary" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {room ? "Save changes" : "Add room"}
        </Button>
      </SheetFooter>
    </form>
  );
}
