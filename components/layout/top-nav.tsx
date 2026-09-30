"use client";

import { DatabaseZap, RotateCcw, UserRound } from "lucide-react";
import Link from "next/link";
import { ActionMenu } from "@/components/ui/action-menu";
import { BrandMark } from "@/components/layout/brand";
import { GlobalSearch } from "@/components/layout/global-search";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { usePgStore } from "@/context/pg-store";
import { useToast } from "@/context/toast";
import { useWorkspace } from "@/context/workspace";

export function TopNav() {
  const { resetDemoData, clearAllData } = usePgStore();
  const { confirm } = useWorkspace();
  const { notify } = useToast();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 md:h-[72px] md:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 md:hidden" aria-label="Sky PG — Dashboard">
          <BrandMark size="sm" />
          <span className="text-[15px] font-semibold tracking-tight text-slate-900">Sky PG</span>
        </Link>
        <div className="hidden min-w-0 md:block">
          <p className="text-[15px] font-semibold tracking-tight text-slate-900">Sky PG</p>
          <p className="text-xs text-slate-500">Paying guest operations</p>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <GlobalSearch />
          <NotificationsMenu />
          <ActionMenu
            label="Profile and demo settings"
            triggerClassName="ml-1 flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
            trigger={<UserRound className="size-[18px]" aria-hidden />}
            header={
              <div>
                <p className="text-sm font-semibold text-slate-900">Sky PG</p>
                <p className="text-xs text-slate-500">Property owner · Demo mode</p>
              </div>
            }
            items={[
              {
                label: "Reset demo data",
                icon: RotateCcw,
                onSelect: () =>
                  confirm({
                    title: "Reset demo data?",
                    description:
                      "All rooms and tenants in this browser will be replaced with the sample dataset.",
                    confirmLabel: "Reset data",
                    tone: "primary",
                    onConfirm: async () => {
                      const result = await resetDemoData();
                      notify(result.ok ? "Demo data restored." : result.error, result.ok ? "success" : "error");
                      return result.ok;
                    },
                  }),
              },
              {
                label: "Clear all data",
                icon: DatabaseZap,
                tone: "danger",
                onSelect: () =>
                  confirm({
                    title: "Clear all data?",
                    description:
                      "Every room and tenant stored in this browser will be deleted. You can restore sample data from this menu later.",
                    confirmLabel: "Clear data",
                    onConfirm: async () => {
                      const result = await clearAllData();
                      notify(result.ok ? "All data cleared." : result.error, result.ok ? "success" : "error");
                      return result.ok;
                    },
                  }),
              },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
