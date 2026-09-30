"use client";

import { UserPlus, UserPen } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { Sheet, SheetFooter } from "@/components/ui/sheet";
import { usePgStore } from "@/context/pg-store";
import { useToast } from "@/context/toast";
import { formatAadharInput } from "@/lib/aadhar";
import { addMonths, todayKey } from "@/lib/dates";
import { compareRoomNumbers, getAvailableBeds } from "@/lib/occupancy";
import type { Tenant } from "@/lib/types";
import {
  validateTenantForm,
  type FieldErrors,
  type TenantFormValues,
} from "@/lib/validation";

export type TenantFormTarget = {
  tenant?: Tenant;
  roomId?: string;
  bedId?: string;
};

export function TenantFormDialog({
  target,
  onClose,
}: {
  target: TenantFormTarget | null;
  onClose: () => void;
}) {
  const editing = Boolean(target?.tenant);
  return (
    <Sheet
      open={Boolean(target)}
      onClose={onClose}
      variant="modal"
      size="lg"
      title={editing ? "Edit tenant" : "Add tenant"}
      description={
        editing ? "Update resident details or move them to another bed." : "Register a resident and assign them an available bed."
      }
      icon={
        <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          {editing ? <UserPen className="size-5" aria-hidden /> : <UserPlus className="size-5" aria-hidden />}
        </span>
      }
    >
      {target ? <TenantForm target={target} onDone={onClose} /> : null}
    </Sheet>
  );
}

function initialValues(target: TenantFormTarget): TenantFormValues {
  const { tenant } = target;
  return {
    name: tenant?.name ?? "",
    phone: tenant?.phone ?? "",
    address: tenant?.address ?? "",
    occupation: tenant?.occupation ?? "",
    workOrStudentIn: tenant?.workOrStudentIn ?? "",
    email: tenant?.email ?? "",
    aadhar: tenant ? formatAadharInput(tenant.aadhar) : "",
    roomId: tenant?.roomId ?? target.roomId ?? "",
    bedId: tenant?.bedId ?? target.bedId ?? "",
    nextPaymentDate: tenant?.nextPaymentDate ?? addMonths(todayKey(), 1),
  };
}

function TenantForm({ target, onDone }: { target: TenantFormTarget; onDone: () => void }) {
  const { rooms, tenants, addTenant, updateTenant } = usePgStore();
  const { notify } = useToast();
  const tenantId = target.tenant?.id;
  const [values, setValues] = useState(() => initialValues(target));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const roomOptions = useMemo(
    () =>
      [...rooms].sort(compareRoomNumbers).map((room) => ({
        room,
        available: getAvailableBeds(room, tenants, tenantId).length,
      })),
    [rooms, tenants, tenantId],
  );

  const selectedRoom = rooms.find((room) => room.id === values.roomId);
  const availableBeds = useMemo(
    () => (selectedRoom ? getAvailableBeds(selectedRoom, tenants, tenantId) : []),
    [selectedRoom, tenants, tenantId],
  );
  const totalAvailable = roomOptions.reduce((sum, option) => sum + option.available, 0);

  function update<K extends keyof TenantFormValues>(key: K, value: TenantFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: "" }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateTenantForm(values);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) {
      const first = Object.keys(nextErrors)[0];
      event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setSaving(true);
    const result = tenantId ? await updateTenant(tenantId, values) : await addTenant(values);
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    const bed = availableBeds.find((item) => item.id === values.bedId);
    notify(
      tenantId
        ? `${values.name.trim()}'s details were updated.`
        : `${values.name.trim()} assigned to Room ${selectedRoom?.roomNumber}, Bed ${bed?.bedNumber}.`,
    );
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-6 px-5 py-5 md:px-6">
        <FormSection title="Personal details">
          <Field label="Tenant name" error={errors.name} className="sm:col-span-2">
            <TextInput
              name="name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="Full name"
              autoComplete="off"
              data-autofocus
            />
          </Field>
          <Field label="Phone number" error={errors.phone}>
            <TextInput
              name="phone"
              type="tel"
              inputMode="numeric"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit mobile"
              autoComplete="off"
            />
          </Field>
          <Field label="Email address" error={errors.email}>
            <TextInput
              name="email"
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              placeholder="name@example.com"
              autoComplete="off"
            />
          </Field>
          <Field label="Address" error={errors.address} className="sm:col-span-2">
            <TextInput
              name="address"
              value={values.address}
              onChange={(event) => update("address", event.target.value)}
              placeholder="Permanent address"
              autoComplete="off"
            />
          </Field>
        </FormSection>

        <FormSection title="Work & identity">
          <Field label="Occupation" error={errors.occupation}>
            <TextInput
              name="occupation"
              value={values.occupation}
              onChange={(event) => update("occupation", event.target.value)}
              placeholder="e.g. Software Engineer, Student"
            />
          </Field>
          <Field label="Work / Student in" error={errors.workOrStudentIn}>
            <TextInput
              name="workOrStudentIn"
              value={values.workOrStudentIn}
              onChange={(event) => update("workOrStudentIn", event.target.value)}
              placeholder="Company or college"
            />
          </Field>
          <Field label="Aadhaar number" error={errors.aadhar} className="sm:col-span-2">
            <TextInput
              name="aadhar"
              inputMode="numeric"
              value={values.aadhar}
              onChange={(event) => update("aadhar", formatAadharInput(event.target.value))}
              placeholder="XXXX-XXXX-XXXX"
              autoComplete="off"
              className="font-mono tracking-wide"
            />
          </Field>
        </FormSection>

        <FormSection
          title="Room assignment"
          description={
            rooms.length === 0
              ? "Add a room first to assign tenants."
              : `${totalAvailable} bed${totalAvailable === 1 ? "" : "s"} available across ${rooms.length} room${rooms.length === 1 ? "" : "s"}.`
          }
        >
          <Field label="Room number" error={errors.roomId}>
            <SelectInput
              name="roomId"
              value={values.roomId}
              onChange={(event) => {
                setValues((current) => ({ ...current, roomId: event.target.value, bedId: "" }));
                setErrors((current) => ({ ...current, roomId: "", bedId: "" }));
              }}
              disabled={rooms.length === 0}
            >
              <option value="">{rooms.length === 0 ? "No rooms yet" : "Select a room"}</option>
              {roomOptions.map(({ room, available }) => (
                <option key={room.id} value={room.id} disabled={available === 0}>
                  Room {room.roomNumber} — {available === 0 ? "Full" : `${available} of ${room.beds.length} available`}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field
            label="Bed number"
            error={errors.bedId}
            hint={selectedRoom ? "Only available beds are listed." : undefined}
          >
            <SelectInput
              name="bedId"
              value={values.bedId}
              onChange={(event) => update("bedId", event.target.value)}
              disabled={!selectedRoom || availableBeds.length === 0}
            >
              <option value="">
                {!selectedRoom ? "Select a room first" : availableBeds.length === 0 ? "No beds available" : "Select a bed"}
              </option>
              {availableBeds.map((bed) => (
                <option key={bed.id} value={bed.id}>
                  Bed {bed.bedNumber}
                  {bed.id === target.tenant?.bedId ? " (current)" : ""}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field
            label="Next payment date"
            error={errors.nextPaymentDate}
            hint="Used for rent reminders and due-soon alerts."
            className="sm:col-span-2"
          >
            <TextInput
              name="nextPaymentDate"
              type="date"
              value={values.nextPaymentDate}
              onChange={(event) => update("nextPaymentDate", event.target.value)}
            />
          </Field>
        </FormSection>

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
        <Button type="submit" loading={saving} disabled={rooms.length === 0}>
          {tenantId ? "Save changes" : "Add tenant"}
        </Button>
      </SheetFooter>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-slate-900">{title}</legend>
      {description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
