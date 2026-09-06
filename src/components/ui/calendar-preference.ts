import { useSyncExternalStore } from 'react';

/** Which calendar dates are entered in. The stored value is always AD. */
export type DateCalendar = 'bs' | 'ad';

/**
 * One preference for the whole session, exactly as the reference's
 * `DualDateInput` behaves once you flip it: someone who works in Gregorian
 * shouldn't have to re-switch on every sheet.
 *
 * A module-level store rather than a context, so no screen has to thread a
 * provider through to reach it.
 */
let calendar: DateCalendar = 'bs';
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function setCalendarPreference(next: DateCalendar) {
  if (next === calendar) return;
  calendar = next;
  listeners.forEach((fn) => fn());
}

export function useCalendarPreference(): DateCalendar {
  return useSyncExternalStore(
    subscribe,
    () => calendar,
    () => calendar,
  );
}
