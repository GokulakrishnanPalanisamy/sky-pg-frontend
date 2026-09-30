"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";

type ToastTone = "success" | "error";

type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  notify: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const regionRef = useRef<HTMLDivElement>(null);

  // Toasts live in the top layer (Popover API) so they stay visible above
  // open <dialog> drawers. Re-showing moves them above the newest dialog.
  useEffect(() => {
    const region = regionRef.current;
    if (!region || typeof region.showPopover !== "function") return;
    if (region.matches(":popover-open")) region.hidePopover();
    if (toasts.length > 0) region.showPopover();
  }, [toasts]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 5000 : 3200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        ref={regionRef}
        popover="manual"
        className="pointer-events-none fixed inset-auto left-4 top-4 z-[90] m-0 w-[calc(100%-2rem)] flex-col items-center gap-2 overflow-visible border-0 bg-transparent p-0 open:flex sm:left-auto sm:right-6 sm:top-5 sm:w-[24rem]"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const Icon = toast.tone === "success" ? CircleCheck : CircleAlert;
          return (
            <div
              key={toast.id}
              role={toast.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full animate-toast-in items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-[var(--shadow-pop)]"
            >
              <Icon
                className={`mt-0.5 size-[18px] shrink-0 ${toast.tone === "success" ? "text-emerald-600" : "text-rose-600"}`}
                aria-hidden
              />
              <p className="flex-1 leading-5">{toast.message}</p>
              <button
                type="button"
                className="-m-1 flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
