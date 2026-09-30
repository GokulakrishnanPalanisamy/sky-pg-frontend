"use client";

import { Bell, CircleCheck } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { IconButton } from "@/components/ui/button";
import { useDismiss } from "@/components/ui/use-dismiss";
import { PaymentBadge, PAYMENT_META } from "@/components/pg/status";
import { usePgStore } from "@/context/pg-store";
import { useWorkspace } from "@/context/workspace";
import { formatDate, formatRelativeDays } from "@/lib/dates";

/** Rent reminders derived from tenants whose payment is overdue or due soon. */
export function NotificationsMenu() {
  const { assignments } = usePgStore();
  const { openRoom } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const alerts = assignments
    .filter((item) => item.payment.status !== "paid")
    .sort((a, b) => a.payment.daysUntilDue - b.payment.daysUntilDue);

  return (
    <div ref={ref} className="relative">
      <IconButton
        label={alerts.length ? `Notifications, ${alerts.length} payment alerts` : "Notifications"}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={open ? "bg-slate-100 text-slate-900" : ""}
      >
        <Bell />
        {alerts.length ? (
          <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold leading-4 text-white ring-2 ring-white sm:right-0.5 sm:top-0.5">
            {alerts.length}
          </span>
        ) : null}
      </IconButton>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Payment alerts"
          className="fixed inset-x-3 top-[68px] z-50 animate-pop-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-pop)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Payment alerts</p>
            <span className="text-xs text-slate-500">{alerts.length} pending</span>
          </div>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-8 text-center">
              <CircleCheck className="mb-2 size-6 text-emerald-500" aria-hidden />
              <p className="text-sm font-medium text-slate-900">All caught up</p>
              <p className="text-xs text-slate-500">No payments are due in the next few days.</p>
            </div>
          ) : (
            <ul className="max-h-[60dvh] overflow-y-auto p-1.5">
              {alerts.map(({ tenant, room, bed, payment }) => (
                <li key={tenant.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openRoom(tenant.roomId, tenant.bedId);
                    }}
                    className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50"
                  >
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${payment.status === "overdue" ? "bg-rose-500" : "bg-amber-500"}`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{tenant.name}</span>
                      <span className="block text-xs text-slate-500">
                        {room && bed ? `Room ${room.roomNumber} · Bed ${bed.bedNumber} · ` : ""}
                        <span className={PAYMENT_META[payment.status].text}>
                          {formatDate(payment.dueDate)} ({formatRelativeDays(payment.daysUntilDue)})
                        </span>
                      </span>
                    </span>
                    <PaymentBadge status={payment.status} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
