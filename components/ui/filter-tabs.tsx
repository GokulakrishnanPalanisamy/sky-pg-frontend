"use client";

type FilterOption<T extends string> = { value: T; label: string; count: number };

/** Segmented filter chips. Scrolls horizontally on narrow screens instead of wrapping. */
export function FilterTabs<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div role="group" aria-label={label} className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`flex h-10 items-center gap-2 whitespace-nowrap rounded-lg px-3.5 text-sm font-medium transition-all sm:h-9 ${
                active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {option.label}
              <span
                className={`min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold leading-5 tabular-nums ${
                  active ? "bg-teal-600 text-white" : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {option.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
