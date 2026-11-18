/** Studio payroll: 8h day × 26 days = 208h month. */

export const WORK_HOURS_PER_DAY = 8;
export const WORK_DAYS_PER_MONTH = 26;
export const HOURS_PER_MONTH = WORK_HOURS_PER_DAY * WORK_DAYS_PER_MONTH; // 208

export function hourlyRupeesFromMonthly(monthlyRupees: number | string): number {
  const n = typeof monthlyRupees === 'string' ? Number(monthlyRupees) : monthlyRupees;
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round((n / HOURS_PER_MONTH) * 100) / 100;
}

export function hourlyPaiseFromMonthly(monthlyPaise: number | null | undefined): number | null {
  if (monthlyPaise == null) return null;
  if (monthlyPaise <= 0) return 0;
  return Math.round(monthlyPaise / HOURS_PER_MONTH);
}

export function formatLeaveHoursDays(hours: number, days: number): string {
  const h = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  const d = Number.isInteger(days) ? String(days) : days.toFixed(1);
  return `${h}h (${d}d)`;
}
