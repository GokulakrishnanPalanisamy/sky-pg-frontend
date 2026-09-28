"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  Building2,
  LayoutDashboard,
  Users,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rooms", label: "Rooms", icon: BedDouble },
  { href: "/tenants", label: "Tenants", icon: Users },
];

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        className={`fixed inset-0 z-30 bg-slate-900/40 lg:hidden ${open ? "block" : "hidden"}`}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-slate-950 text-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500">
              <Building2 className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">Sky PG</span>
              <span className="block text-[11px] text-slate-400">Management</span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-teal-500 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500">
          Frontend demo · localStorage
        </div>
      </aside>
    </>
  );
}
