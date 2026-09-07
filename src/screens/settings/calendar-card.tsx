import {
  setCalendarPreference,
  useCalendarPreference,
  type DateCalendar,
} from '@/components/ui/calendar-preference';
import { Segmented, type SegmentedOption } from '@/components/ui/segmented';

import { SettingRow } from './setting-row';

const OPTIONS: SegmentedOption<DateCalendar>[] = [
  { value: 'bs', label: 'Bikram Sambat' },
  { value: 'ad', label: 'Gregorian' },
];

/**
 * Which calendar date pickers open in. The inline toggle on a date field writes
 * the same preference — this is just the place you can set it without hunting
 * for a date sheet first.
 */
export function CalendarCard() {
  const calendar = useCalendarPreference();

  return (
    <SettingRow
      label="Date entry"
      meta={
        calendar === 'bs'
          ? 'Pickers open in Bikram Sambat · dates are always stored as AD'
          : 'Pickers open in Gregorian · dates are always stored as AD'
      }
    >
      <Segmented options={OPTIONS} value={calendar} onChange={setCalendarPreference} fill />
    </SettingRow>
  );
}
