"use client";

import { EllipsisVertical } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type ActionMenuItem = {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onSelect: () => void;
  tone?: "danger";
  disabled?: boolean;
};

type Position = { top?: number; bottom?: number; right: number };

const ITEM_HEIGHT = 44;
const MENU_WIDTH = 224;

/**
 * Kebab menu rendered with fixed positioning so it is never clipped by a
 * scrolling table or card, and flips upward near the bottom of the screen.
 */
export function ActionMenu({
  label,
  items,
  className = "",
  trigger,
  triggerClassName,
  header,
}: {
  label: string;
  items: ActionMenuItem[];
  className?: string;
  /** Custom trigger content; defaults to a vertical ellipsis. */
  trigger?: ReactNode;
  triggerClassName?: string;
  /** Non-interactive content shown above the items. */
  header?: ReactNode;
}) {
  const [position, setPosition] = useState<Position | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const open = position !== null;

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const height = items.length * ITEM_HEIGHT + (header ? 64 : 12);
    const right = Math.max(window.innerWidth - rect.right, 8);
    const fitsBelow = window.innerHeight - rect.bottom > height + 12;
    setPosition(
      fitsBelow
        ? { top: rect.bottom + 6, right }
        : { bottom: window.innerHeight - rect.top + 6, right },
    );
  }

  function close(restoreFocus = true) {
    setPosition(null);
    if (restoreFocus) buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setPosition(null);
      }
    }
    function onDismiss() {
      setPosition(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onDismiss);
    window.addEventListener("scroll", onDismiss, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onDismiss);
      window.removeEventListener("scroll", onDismiss, true);
    };
  }, [open]);

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [],
    );
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      buttons[(index + step + buttons.length) % buttons.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      buttons[event.key === "Home" ? 0 : buttons.length - 1]?.focus();
    } else if (event.key === "Escape") {
      // Keep Escape from also closing an enclosing <dialog>.
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") {
      close(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close() : openMenu())}
        className={
          triggerClassName ??
          `flex size-11 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 sm:size-9 ${
            open ? "bg-slate-100 text-slate-700" : ""
          }`
        }
      >
        {trigger ?? <EllipsisVertical className="size-[18px]" aria-hidden />}
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKeyDown}
          style={{ ...position, width: MENU_WIDTH }}
          className="fixed z-[60] animate-pop-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-[var(--shadow-pop)]"
        >
          {header ? (
            <div className="mb-1 border-b border-slate-100 px-2.5 pb-2.5 pt-1.5">{header}</div>
          ) : null}
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  close(false);
                  item.onSelect();
                }}
                className={`flex h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 ${
                  item.tone === "danger"
                    ? "text-rose-600 hover:bg-rose-50 focus-visible:bg-rose-50"
                    : "text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-50"
                }`}
              >
                {Icon ? <Icon className="size-4 shrink-0 opacity-80" /> : null}
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
