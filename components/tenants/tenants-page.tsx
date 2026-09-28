"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, EmptyState } from "@/components/ui/feedback";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { usePgStore } from "@/context/pg-store";
import { useToast } from "@/context/toast";
import { formatAadharInput, maskAadhar } from "@/lib/aadhar";
import { getAvailableBedNumbers } from "@/lib/availability";
import type { Tenant } from "@/lib/types";
import {
  validateTenantForm,
  type FieldErrors,
  type TenantFormValues,
} from "@/lib/validation";

const EMPTY_FORM: TenantFormValues = {
  name: "",
  phone: "",
  address: "",
  occupation: "",
  workOrStudentIn: "",
  email: "",
  aadhar: "",
  roomId: "",
  bedNumber: "",
};

export function TenantsPage() {
  const { rooms, tenants, addTenant, updateTenant, deleteTenant } =
    usePgStore();
  const { notify } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((a, b) =>
        a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }),
      ),
    [rooms],
  );

  const selectedRoom = rooms.find((room) => room.id === form.roomId);
  const availableBeds = useMemo(
    () =>
      selectedRoom
        ? getAvailableBedNumbers(selectedRoom, tenants, editingId ?? undefined)
        : [],
    [editingId, selectedRoom, tenants],
  );

  const sortedTenants = useMemo(
    () =>
      [...tenants].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [tenants],
  );

  function startEdit(tenant: Tenant) {
    setEditingId(tenant.id);
    setForm({
      name: tenant.name,
      phone: tenant.phone,
      address: tenant.address,
      occupation: tenant.occupation,
      workOrStudentIn: tenant.workOrStudentIn,
      email: tenant.email,
      aadhar: formatAadharInput(tenant.aadhar),
      roomId: tenant.roomId,
      bedNumber: String(tenant.bedNumber),
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
    const nextErrors = validateTenantForm(form);
    setErrors(nextErrors);
    setFormError("");
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      name: form.name,
      phone: form.phone,
      address: form.address,
      occupation: form.occupation,
      workOrStudentIn: form.workOrStudentIn,
      email: form.email,
      aadhar: form.aadhar,
      roomId: form.roomId,
      bedNumber: Number(form.bedNumber),
    };

    const result = editingId
      ? updateTenant(editingId, payload)
      : addTenant(payload);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    notify(
      editingId ? "Tenant updated successfully." : "Tenant saved successfully.",
    );
    resetForm();
  }

  function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    deleteTenant(deleteTarget.id);
    notify("Tenant deleted.");
    if (editingId === deleteTarget.id) {
      resetForm();
    }
    setDeleteTarget(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Tenants"
        description="Assign residents to a room and available bed. Occupancy updates automatically."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">
            {editingId ? "Edit tenant" : "Add tenant"}
          </h2>
          {editingId ? (
            <Button type="button" variant="ghost" onClick={resetForm}>
              Cancel edit
            </Button>
          ) : null}
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="Tenant Name" error={errors.name}>
            <TextInput
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="John Doe"
              error={Boolean(errors.name)}
            />
          </Field>
          <Field label="Phone Number" error={errors.phone}>
            <TextInput
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              placeholder="9876543210"
              inputMode="numeric"
              error={Boolean(errors.phone)}
            />
          </Field>
          <Field label="Address" error={errors.address}>
            <TextInput
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  address: event.target.value,
                }))
              }
              placeholder="Chennai"
              error={Boolean(errors.address)}
            />
          </Field>
          <Field label="Occupation" error={errors.occupation}>
            <TextInput
              value={form.occupation}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  occupation: event.target.value,
                }))
              }
              placeholder="Software Developer"
              error={Boolean(errors.occupation)}
            />
          </Field>
          <Field label="Work / Student In" error={errors.workOrStudentIn}>
            <TextInput
              value={form.workOrStudentIn}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  workOrStudentIn: event.target.value,
                }))
              }
              placeholder="Chennai"
              error={Boolean(errors.workOrStudentIn)}
            />
          </Field>
          <Field label="Email Address" error={errors.email}>
            <TextInput
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="john@example.com"
              error={Boolean(errors.email)}
            />
          </Field>
          <Field label="Aadhar Number" error={errors.aadhar}>
            <TextInput
              value={form.aadhar}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  aadhar: formatAadharInput(event.target.value),
                }))
              }
              placeholder="XXXX-XXXX-1234"
              error={Boolean(errors.aadhar)}
            />
          </Field>
          <Field label="Room Number" error={errors.roomId}>
            <SelectInput
              value={form.roomId}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  roomId: event.target.value,
                  bedNumber: "",
                }))
              }
              error={Boolean(errors.roomId)}
              disabled={sortedRooms.length === 0}
            >
              <option value="">
                {sortedRooms.length === 0
                  ? "Add a room first"
                  : "Select a room"}
              </option>
              {sortedRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} ({room.bedCount} beds)
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Bed Number" error={errors.bedNumber}>
            <SelectInput
              value={form.bedNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bedNumber: event.target.value,
                }))
              }
              error={Boolean(errors.bedNumber)}
              disabled={!selectedRoom}
            >
              <option value="">
                {!selectedRoom
                  ? "Select a room first"
                  : availableBeds.length === 0
                    ? "No beds available"
                    : "Select a bed"}
              </option>
              {availableBeds.map((bed) => (
                <option key={bed} value={bed}>
                  Bed {bed}
                </option>
              ))}
            </SelectInput>
          </Field>
          {formError ? (
            <p className="md:col-span-2 text-sm text-rose-600">{formError}</p>
          ) : null}
          <div className="md:col-span-2">
            <Button type="submit" disabled={rooms.length === 0}>
              <Plus className="h-4 w-4" />
              {editingId ? "Update Tenant" : "Save Tenant"}
            </Button>
          </div>
        </form>
      </section>

      {sortedTenants.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No tenants yet"
          description="Save a tenant and assign an available bed to see occupancy update on the dashboard."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Tenant Name</th>
                  <th className="px-4 py-3 font-medium">Phone Number</th>
                  <th className="px-4 py-3 font-medium">Occupation</th>
                  <th className="px-4 py-3 font-medium">Work / Student In</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Aadhar</th>
                  <th className="px-4 py-3 font-medium">Room Number</th>
                  <th className="px-4 py-3 font-medium">Bed Number</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedTenants.map((tenant) => (
                  <tr key={tenant.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {tenant.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{tenant.phone}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {tenant.occupation}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {tenant.workOrStudentIn}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{tenant.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {maskAadhar(tenant.aadhar)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {tenant.roomNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {tenant.bedNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          onClick={() => startEdit(tenant)}
                          aria-label={`Edit ${tenant.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => setDeleteTarget(tenant)}
                          aria-label={`Delete ${tenant.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete tenant?"
        description={`This will remove ${deleteTarget?.name} and free Bed ${deleteTarget?.bedNumber} in Room ${deleteTarget?.roomNumber}.`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
