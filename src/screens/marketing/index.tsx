import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { useAddEntry, useEntries, useRemoveEntry, useRestoreEntry, useUpdateEntry } from '@/data/marketing/hooks';
import { MONTHS_SHORT, TODAY } from '@/data/marketing/mock';
import type { CalendarEntry, KindFilter, MarketingView, MonthCursor, SelectedDay } from '@/data/marketing/types';

import { DayPanel } from './day-panel';
import { EntrySheet } from './entry-sheet';
import { ListView } from './list-view';
import { MonthGrid } from './month-grid';

export function Marketing() {
  const theme = useTheme();
  const toast = useToast();

  const { data: entries } = useEntries();
  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();
  const removeEntry = useRemoveEntry();
  const restoreEntry = useRestoreEntry();

  const [view, setView] = useState<MarketingView>('calendar');
  const [cursor, setCursor] = useState<MonthCursor>({ y: TODAY.y, m: TODAY.m });
  const [selected, setSelected] = useState<SelectedDay>({ y: TODAY.y, m: TODAY.m, d: TODAY.d });
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [sheetMode, setSheetMode] = useState<'new' | 'edit' | null>(null);
  const [draft, setDraft] = useState<CalendarEntry | null>(null);

  if (!entries) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const monthEntries = entries.filter((e) => e.y === cursor.y && e.m === cursor.m);
  const dayEntries = entries.filter((e) => e.y === selected.y && e.m === selected.m && e.d === selected.d);

  const shiftMonth = (n: number) => {
    setCursor((c) => {
      const t = c.m + n;
      return { y: c.y + Math.floor(t / 12), m: ((t % 12) + 12) % 12 };
    });
  };

  const openEntry = (e: CalendarEntry) => {
    setSheetMode('edit');
    setDraft({ ...e });
  };

  const newEntry = () => {
    setSheetMode('new');
    setDraft({ id: `e${Date.now()}`, y: selected.y, m: selected.m, d: selected.d, kind: 'post', title: '', notes: '', person: 'pt' });
  };

  const closeSheet = () => {
    setSheetMode(null);
    setDraft(null);
  };

  const patchDraft = (patch: Partial<CalendarEntry>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const handleSave = () => {
    if (!draft) return;
    const next: CalendarEntry = { ...draft, title: draft.title.trim() || 'Untitled entry', notes: draft.notes.trim() };
    const exists = entries.some((e) => e.id === next.id);
    if (exists) updateEntry.mutate({ id: next.id, updates: next });
    else addEntry.mutate(next);
    setSelected({ y: next.y, m: next.m, d: next.d });
    setCursor({ y: next.y, m: next.m });
    closeSheet();
  };

  const handleDelete = () => {
    if (!draft) return;
    const removed = draft;
    removeEntry.mutate(removed.id);
    closeSheet();
    toast.show({ message: 'Entry deleted', tone: 'ok', action: { label: 'Undo', onPress: () => restoreEntry.mutate(removed) } });
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Marketing"
        subtitle={`${monthEntries.length} planned · ${MONTHS_SHORT[cursor.m]} ${cursor.y}`}
        rightSlot={
          <View style={styles.headerRight}>
            <View style={[styles.viewTabs, { backgroundColor: theme.draftWash, borderColor: theme.border }]}>
              <Pressable
                onPress={() => setView('calendar')}
                style={[styles.viewTab, { backgroundColor: view === 'calendar' ? theme.surface : 'transparent' }]}
              >
                <Text style={[styles.viewTabLabel, { color: view === 'calendar' ? theme.textPrimary : theme.textSecondary }]}>Month</Text>
              </Pressable>
              <Pressable onPress={() => setView('list')} style={[styles.viewTab, { backgroundColor: view === 'list' ? theme.surface : 'transparent' }]}>
                <Text style={[styles.viewTabLabel, { color: view === 'list' ? theme.textPrimary : theme.textSecondary }]}>List</Text>
              </Pressable>
            </View>
            <Avatar initials="PT" tint="dark" size="md" />
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {view === 'calendar' ? (
          <>
            <MonthGrid
              entries={entries}
              cursor={cursor}
              selected={selected}
              onPrevMonth={() => shiftMonth(-1)}
              onNextMonth={() => shiftMonth(1)}
              onSelectDay={(day) => setSelected({ y: cursor.y, m: cursor.m, d: day })}
            />
            <DayPanel selected={selected} entries={dayEntries} onOpen={openEntry} onNewEntry={newEntry} />
          </>
        ) : (
          <ListView entries={entries} cursor={cursor} kindFilter={kindFilter} onFilterChange={setKindFilter} onOpen={openEntry} />
        )}
      </ScrollView>

      <Pressable
        onPress={newEntry}
        style={[styles.fab, { backgroundColor: theme.accent, boxShadow: theme.scheme === 'light' ? '0 12px 26px -12px rgba(20,122,87,0.95)' : undefined }]}
      >
        <Icon name="plus" size={24} color={theme.accentText} />
      </Pressable>

      <EntrySheet visible={!!sheetMode} mode={sheetMode} draft={draft} onClose={closeSheet} onChange={patchDraft} onSave={handleSave} onDelete={handleDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 100, gap: 16 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewTabs: { flexDirection: 'row', padding: 3, borderRadius: 13, borderWidth: 1, gap: 2 },
  viewTab: { height: 32, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  viewTabLabel: { fontFamily: fontFamily.semibold, fontSize: 12.5 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
