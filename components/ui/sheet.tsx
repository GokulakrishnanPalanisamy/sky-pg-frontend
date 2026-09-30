"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconButton } from "@/components/ui/button";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /**
   * `drawer`: right-side panel on desktop, bottom sheet on mobile.
   * `modal`: centered dialog on desktop, bottom sheet on mobile.
   */
  variant?: "drawer" | "modal";
  size?: "sm" | "md" | "lg";
  title: ReactNode;
  description?: ReactNode;
  /** Replaces the default icon slot left of the title. */
  icon?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

const layout = {
  drawer:
    "inset-x-0 bottom-0 top-auto max-h-[92dvh] w-full rounded-t-3xl animate-sheet-up md:inset-y-0 md:left-auto md:right-0 md:h-dvh md:max-h-none md:w-[460px] md:rounded-none md:rounded-l-3xl md:animate-sheet-left",
  modal:
    "inset-x-0 bottom-0 top-auto max-h-[94dvh] w-full rounded-t-3xl animate-sheet-up sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[min(90dvh,820px)] sm:w-[calc(100%-2rem)] sm:rounded-2xl sm:animate-pop-in",
};

const widths = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

/**
 * Built on the native `<dialog>` element, which provides focus trapping,
 * Escape handling, top-layer stacking for nested dialogs and focus restore.
 */
export function Sheet({
  open,
  onClose,
  variant = "modal",
  size = "md",
  title,
  description,
  icon,
  footer,
  children,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus the field marked `data-autofocus` (skipped on touch so the keyboard
      // doesn't cover the sheet), else the panel itself rather than the close button.
      const precise = window.matchMedia("(pointer: fine)").matches;
      const target = (precise && dialog.querySelector<HTMLElement>("[data-autofocus]")) || dialog;
      target.focus({ preventScroll: true });
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        // Only close when both press and release happened on the backdrop.
        if (pressedBackdrop.current && event.target === event.currentTarget) onClose();
        pressedBackdrop.current = false;
      }}
      className={`fixed m-0 max-w-none overflow-hidden border-0 outline-none bg-white p-0 text-slate-900 shadow-[var(--shadow-pop)] open:flex open:flex-col ${layout[variant]} ${variant === "modal" ? widths[size] : ""}`}
    >
      {open ? (
        <>
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-200 md:hidden" aria-hidden />
          <header className="flex shrink-0 items-start gap-3 border-b border-slate-100 px-5 pb-4 pt-3 md:px-6 md:pt-5">
            {icon ? <div className="shrink-0">{icon}</div> : null}
            <div className="min-w-0 flex-1 pt-0.5">
              <h2 id={titleId} className="text-lg font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
              {description ? (
                <div id={descriptionId} className="mt-0.5 text-sm text-slate-500">
                  {description}
                </div>
              ) : null}
            </div>
            <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
              <X />
            </IconButton>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer ? <footer className={`shrink-0 ${footerClass}`}>{footer}</footer> : null}
        </>
      ) : null}
    </dialog>
  );
}

const footerClass =
  "flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end md:px-6";

/** Footer rendered from inside the sheet body (e.g. by a form that owns its submit state). Stays pinned while the body scrolls. */
export function SheetFooter({ children }: { children: ReactNode }) {
  return <div className={`sticky bottom-0 z-10 ${footerClass}`}>{children}</div>;
}
