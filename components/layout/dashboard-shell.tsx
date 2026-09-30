import type { ReactNode } from "react";
import { MobileTabBar, Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav />
        <main
          id="main"
          className="flex-1 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5 md:px-6 md:pb-10 md:pt-7 lg:px-8"
        >
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
