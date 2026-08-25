import { EXCEPTIONS, TODAY_DAY } from './mock';
import type { DayCell } from './types';

export function num(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function npr(n: number): string {
  return `NPR ${num(n)}`;
}

export function formatHm(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/** Aug 2026: the 1st is a Saturday, so weekday = (5 + day) % 7 with 0=Sun. Saturday is Nepal's weekly off, not an absence. */
export function buildMonthDays(): DayCell[] {
  const cells: DayCell[] = [];
  for (let i = 0; i < 6; i++) cells.push({ day: null, status: null, isToday: false });
  for (let d = 1; d <= 31; d++) {
    const weekday = (5 + d) % 7;
    const isSat = weekday === 6;
    const isFuture = d > TODAY_DAY;
    const status = isSat ? 'off' : isFuture ? 'future' : (EXCEPTIONS[d] ?? 'present');
    cells.push({ day: d, status, isToday: d === TODAY_DAY });
  }
  return cells;
}
