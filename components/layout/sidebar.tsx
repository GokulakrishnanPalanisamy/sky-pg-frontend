"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/layout/brand";
import { isActivePath, NAV_ITEMS } from "@/components/layout/nav-items";

/**
 * Desktop (lg+): full sidebar with labels.
 * Tablet (md–lg): compact icon rail; labels stay available to screen readers.
 * Mobile: hidden — the bottom tab bar takes over.
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col bg-navy-950 text-white md:flex lg:w-64">
      <Link
        href="/"
        className="flex h-[72px] items-center justify-center gap-3 px-4 lg:justify-start lg:px-5"
        aria-label="Sky PG Management — Dashboard"
      >
        <BrandMark />
        <span className="hidden lg:block">
          <span className="block text-[15px] font-semibold tracking-tight">Sky PG</span>
          <span className="block text-xs text-slate-400">Management</span>
        </span>
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 px-3 pt-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={active ? "page" : undefined}
              className={`group relative flex h-11 items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors lg:justify-start ${
                active
                  ? "bg-linear-to-r from-teal-500/20 to-teal-500/5 text-white ring-1 ring-inset ring-teal-400/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {active ? (
                <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-r-full bg-teal-400" aria-hidden />
              ) : null}
              <Icon className={`size-5 shrink-0 ${active ? "text-teal-300" : ""}`} aria-hidden />
              <span className="sr-only lg:not-sr-only">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div className="flex items-center justify-center gap-3 rounded-xl bg-white/5 p-2.5 ring-1 ring-inset ring-white/5 lg:justify-start">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-100"
            aria-hidden
          >
            S
          </span>
          <span className="hidden min-w-0 lg:block">
            <span className="block truncate text-sm font-medium">Sky PG</span>
            <span className="block truncate text-xs text-slate-400">Property owner</span>
          </span>
        </div>
      </div>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? "text-teal-700" : "text-slate-500 active:text-slate-900"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-teal-50" : ""
                  }`}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
