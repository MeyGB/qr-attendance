import type { AttendanceRecord } from "../types";

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameDate(dateValue: string, isoDate: string): boolean {
  return dateValue.slice(0, 10) === isoDate;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatLongDate(date: Date = new Date()): string {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(value: string): string {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatDateBadge(dateStr: string): {
  day: string;
  month: string;
} {
  const d = dateStr.includes("T")
    ? new Date(dateStr)
    : new Date(`${dateStr}T00:00:00`);
  return {
    day: d.toLocaleDateString([], { day: "2-digit" }),
    month: d.toLocaleDateString([], { month: "short" }).toUpperCase(),
  };
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

export function getMonthLabel(monthKey: string): string {
  const d = new Date(`${monthKey}-01T00:00:00`);
  return d.toLocaleDateString([], { month: "long", year: "numeric" });
}

export function groupByMonth(
  records: AttendanceRecord[],
): Array<[string, AttendanceRecord[]]> {
  const groups = new Map<string, AttendanceRecord[]>();
  for (const r of records) {
    const key = getMonthKey(r.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  return Array.from(groups.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export function monthStats(records: AttendanceRecord[]) {
  const currentMonth = todayISO().slice(0, 7);
  const thisMonth = records.filter((r) => getMonthKey(r.date) === currentMonth);
  return {
    present: thisMonth.filter((r) => r.status === "present").length,
    late: thisMonth.filter((r) => r.status === "late").length,
    absent: thisMonth.filter((r) => r.status === "absent").length,
  };
}
