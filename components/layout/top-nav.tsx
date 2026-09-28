"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Menu, UserRound } from "lucide-react";

type TopNavProps = {
  onMenuClick: () => void;
};

export function TopNav({ onMenuClick }: TopNavProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-900">Sky PG</p>
          <p className="hidden text-xs text-slate-500 sm:block">
            Paying guest operations
          </p>
        </div>
      </div>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Open profile menu"
        >
          <UserRound className="h-5 w-5" />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
