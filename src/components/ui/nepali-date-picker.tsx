import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BS_MONTHS_EN, bsFromAD, bsToAD, formatAD, type BSParts } from '@/lib/nepaliDate';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';

import { BottomSheet } from './bottom-sheet';
import { Button } from './button';

export interface NepaliDatePickerProps {
  visible: boolean;
  onClose: () => void;
  /** Currently selected date as an AD ISO string (`YYYY-MM-DD`). */
  value: string;
  /** Called with the chosen AD ISO string when the user confirms. */
  onChange: (adISO: string) => void;
  title?: string;
  /** BS years offered around the current selection. Default 4 back / 1 forward. */
  yearsBack?: number;
  yearsForward?: number;
}

function daysInBSMonth(year: number, month: number): number {
  const start = new Date(`${bsToAD({ year, month, date: 1 })}T12:00:00`);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const next = new Date(`${bsToAD({ year: nextYear, month: nextMonth, date: 1 })}T12:00:00`);
  return Math.round((next.getTime() - start.getTime()) / 86_400_000);
}

/** BS date picker (year / month / day) — mirrors the reference `DualDateInput` picker; emits an AD ISO string. */
export function NepaliDatePicker({
  visible,
  onClose,
  value,
  onChange,
  title = 'Pick a date',
  yearsBack = 4,
  yearsForward = 1,
}: NepaliDatePickerProps) {
  const theme = useTheme();
  const initial = useMemo<BSParts>(() => bsFromAD(value || new Date().toISOString().slice(0, 10)), [value]);
  const [draft, setDraft] = useState<BSParts>(initial);

  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = initial.year - yearsBack; y <= initial.year + yearsForward; y++) out.push(y);
    return out;
  }, [initial.year, yearsBack, yearsForward]);

  const maxDay = daysInBSMonth(draft.year, draft.month);
  const days = useMemo(() => Array.from({ length: maxDay }, (_, i) => i + 1), [maxDay]);

  const setPart = (patch: Partial<BSParts>) => {
    setDraft((d) => {
      const merged = { ...d, ...patch };
      const cap = daysInBSMonth(merged.year, merged.month);
      return { ...merged, date: Math.min(merged.date, cap) };
    });
  };

  const resultISO = bsToAD(draft);

  const column = (
    items: (number | string)[],
    isActive: (item: number | string, index: number) => boolean,
    onPick: (index: number) => void,
    label: string,
    flex: number,
  ) => (
    <View style={[styles.col, { flex }]}>
      <Text style={[styles.colLabel, { color: theme.textSecondary }]}>{label}</Text>
      <ScrollView style={styles.colScroll} contentContainerStyle={styles.colContent} showsVerticalScrollIndicator={false}>
        {items.map((item, index) => {
          const on = isActive(item, index);
          return (
            <Pressable
              key={`${item}`}
              onPress={() => onPick(index)}
              style={[styles.cell, on && { backgroundColor: theme.surfaceInverted }]}
            >
              <Text
                style={[styles.cellText, tabularNums, { color: on ? theme.onDark.text : theme.textPrimary }]}
                numberOfLines={1}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} maxHeight={560}>
      <View style={styles.columns}>
        {column(years, (y) => y === draft.year, (i) => setPart({ year: years[i] }), 'Year', 1)}
        {column(
          BS_MONTHS_EN.map((m) => m),
          (_, i) => i + 1 === draft.month,
          (i) => setPart({ month: i + 1 }),
          'Month',
          1.4,
        )}
        {column(days, (d) => d === draft.date, (i) => setPart({ date: days[i] }), 'Day', 0.8)}
      </View>

      <View style={[styles.preview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.previewBS, { color: theme.textPrimary }]}>
          {draft.date} {BS_MONTHS_EN[draft.month - 1]} {draft.year}
        </Text>
        <Text style={[styles.previewAD, tabularNums, { color: theme.textSecondary }]}>{formatAD(resultISO)}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => setDraft(bsFromAD(new Date().toISOString().slice(0, 10)))}>
          <Text style={[styles.today, { color: theme.link }]}>Today</Text>
        </Pressable>
        <Button
          label="Set date"
          onPress={() => {
            onChange(resultISO);
            onClose();
          }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: 10, height: 240 },
  col: { gap: 8 },
  colLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 9.5,
    letterSpacing: 0.11 * 9.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  colScroll: { flex: 1 },
  colContent: { gap: 4, paddingVertical: 2 },
  cell: { height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cellText: { fontSize: 13.5, fontWeight: '600' },
  preview: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 3, alignItems: 'center' },
  previewBS: { fontSize: 16, fontWeight: '600' },
  previewAD: { fontFamily: fontFamily.mono, fontSize: 11 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  today: { fontSize: 13.5, fontWeight: '600' },
});
