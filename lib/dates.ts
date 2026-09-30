const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Local calendar date as `YYYY-MM-DD` (no timezone drift). */
export function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function isValidDateKey(key: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return false;
  }
  return toDateKey(parseDateKey(key)) === key;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDays(key: string, days: number) {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Adds calendar months, clamping to the last day (Jan 31 → Feb 28). */
export function addMonths(key: string, months: number) {
  const date = parseDateKey(key);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toDateKey(date);
}

export function daysBetween(fromKey: string, toKey: string) {
  return Math.round(
    (parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / MS_PER_DAY,
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDate(key: string) {
  return dateFormatter.format(parseDateKey(key));
}

export function formatRelativeDays(days: number) {
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "1 day overdue";
  return `${Math.abs(days)} days overdue`;
}
