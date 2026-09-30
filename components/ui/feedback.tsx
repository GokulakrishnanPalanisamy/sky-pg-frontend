"use client";

import { TriangleAlert } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  /** When set, the action is blocked: the reason is shown and only "Close" is offered. */
  blockedReason?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  tone = "danger",
  blockedReason,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      variant="modal"
      size="sm"
      title={title}
      icon={
        <span
          className={`flex size-10 items-center justify-center rounded-xl ${
            tone === "danger" || blockedReason ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-700"
          }`}
        >
          <TriangleAlert className="size-5" aria-hidden />
        </span>
      }
      footer={
        blockedReason ? (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              onClick={handleConfirm}
              loading={busy}
            >
              {confirmLabel}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-3 px-5 py-4 text-sm leading-6 text-slate-600 md:px-6">
        <div>{description}</div>
        {blockedReason ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-amber-900">
            {blockedReason}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center ${
        compact ? "py-10" : "py-16"
      }`}
    >
      <div className="relative mb-4">
        <div className="absolute inset-0 scale-150 rounded-full bg-teal-50 blur-md" aria-hidden />
        <div className="relative flex size-12 items-center justify-center rounded-2xl border border-slate-100 bg-white text-teal-600 shadow-[var(--shadow-card)] [&_svg]:size-5">
          {icon}
        </div>
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} aria-hidden />;
}
