"use client";

import { DoorOpen, Search, SearchX } from "lucide-react";
import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { IconButton } from "@/components/ui/button";
import { useDismiss } from "@/components/ui/use-dismiss";
import { Avatar } from "@/components/pg/status";
import { roomSummary } from "@/components/rooms/room-card";
import { usePgStore } from "@/context/pg-store";
import { useWorkspace } from "@/context/workspace";

type Result = {
  key: string;
  kind: "room" | "tenant";
  title: string;
  subtitle: string;
  roomId: string;
  bedId?: string;
};

const LIMIT = 5;

function useSearchResults(query: string): Result[] {
  const { occupancy, assignments } = usePgStore();
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const roomQuery = q.replace(/^room\s*/, "");

    const rooms: Result[] = occupancy
      .filter((item) => item.room.roomNumber.toLowerCase().includes(roomQuery))
      .slice(0, LIMIT)
      .map((item) => ({
        key: `room-${item.room.id}`,
        kind: "room",
        title: `Room ${item.room.roomNumber}`,
        subtitle: roomSummary(item),
        roomId: item.room.id,
      }));

    const digits = q.replace(/\D/g, "");
    const tenants: Result[] = assignments
      .filter(
        ({ tenant }) =>
          tenant.name.toLowerCase().includes(q) ||
          tenant.email.toLowerCase().includes(q) ||
          (digits.length >= 3 && tenant.phone.includes(digits)),
      )
      .slice(0, LIMIT)
      .map(({ tenant, room, bed }) => ({
        key: `tenant-${tenant.id}`,
        kind: "tenant",
        title: tenant.name,
        subtitle: room && bed ? `Room ${room.roomNumber} · Bed ${bed.bedNumber} · ${tenant.phone}` : tenant.phone,
        roomId: tenant.roomId,
        bedId: tenant.bedId,
      }));

    return [...rooms, ...tenants];
  }, [assignments, occupancy, query]);
}

function SearchBox({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const { openRoom } = useWorkspace();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const results = useSearchResults(query);
  const showList = open && query.trim().length > 0;

  const close = useCallback(() => setOpen(false), []);
  useDismiss(containerRef, open, close);

  function select(result: Result) {
    openRoom(result.roomId, result.bedId);
    setQuery("");
    setOpen(false);
    onDone?.();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) return;
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((current) => (current + step + results.length) % results.length);
    } else if (event.key === "Enter" && showList && results[active]) {
      event.preventDefault();
      select(results[active]);
    } else if (event.key === "Escape") {
      if (query) setQuery("");
      else onDone?.();
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
      <input
        type="search"
        role="combobox"
        aria-label="Search rooms and tenants"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search rooms, tenants…"
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 md:h-10 [&::-webkit-search-cancel-button]:hidden"
      />
      {showList ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 animate-pop-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--shadow-pop)]">
          {results.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-5 text-sm text-slate-500">
              <SearchX className="size-4" aria-hidden />
              No rooms or tenants match “{query.trim()}”.
            </div>
          ) : (
            <ul id={listId} role="listbox" aria-label="Search results" className="max-h-[60dvh] overflow-y-auto p-1.5">
              {results.map((result, index) => (
                <li
                  key={result.key}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => select(result)}
                  onPointerMove={() => setActive(index)}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 ${
                    index === active ? "bg-slate-100" : ""
                  }`}
                >
                  {result.kind === "room" ? (
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <DoorOpen className="size-4" aria-hidden />
                    </span>
                  ) : (
                    <Avatar name={result.title} size="sm" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-900">{result.title}</span>
                    <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function GlobalSearch() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <div className="hidden w-64 md:block lg:w-80">
        <SearchBox />
      </div>
      <IconButton label="Search" className="md:hidden" onClick={() => setMobileOpen(true)}>
        <Search />
      </IconButton>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 animate-fade-in bg-navy-950/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex animate-pop-in items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
            <SearchBox autoFocus onDone={() => setMobileOpen(false)} />
            <button
              type="button"
              className="h-11 shrink-0 rounded-xl px-3 text-sm font-medium text-teal-700 hover:bg-teal-50"
              onClick={() => setMobileOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
