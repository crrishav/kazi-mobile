import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii } from '@/theme';
import { useReleases } from '@/data/changelog/hooks';
import { CURRENT_USER } from '@/data/changelog/mock';
import { buildFilters, flattenEntries, groupByRelease } from '@/data/changelog/utils';
import type { FilterKey, FlatEntry } from '@/data/changelog/types';

import { EntryDetailSheet } from './entry-detail-sheet';
import { FilterChipsBar } from './filter-chips-bar';
import { ReleaseGroup } from './release-group';
import { ReleaseSummaryCard } from './release-summary-card';

export function Changelog() {
  const theme = useTheme();
  const toast = useToast();
  const { data: releases } = useReleases();

  const [filter, setFilter] = useState<FilterKey>('All');
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!releases) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const pool = flattenEntries(releases);
  const visible = filter === 'All' ? pool : pool.filter((e) => e.type === filter);
  const filters = buildFilters(pool, filter);
  const groups = groupByRelease(visible);
  const latest = releases[0];
  const openEntry: FlatEntry | null = pool.find((e) => e.key === openKey) ?? null;

  function handleOpenScreen(screen: string) {
    setOpenKey(null);
    toast.show({ message: `Opening ${screen}…`, tone: 'ok' });
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Changelog"
        subtitle={`${releases.length} releases · ${pool.length} changes`}
        rightSlot={<Avatar initials={CURRENT_USER.initials} tint="dark" size="sm" />}
      />
      <FilterChipsBar filters={filters} active={filter} onPick={setFilter} />

      <ScrollView contentContainerStyle={styles.content}>
        <ReleaseSummaryCard release={latest} />

        {groups.map((group, i) => (
          <ReleaseGroup key={group.title} group={group} index={i} onOpen={(entry) => setOpenKey(entry.key)} />
        ))}

        <View style={[styles.noteCard, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
          <Text style={[styles.noteTitle, { color: theme.textPrimary }]}>Older releases</Text>
          <Text style={[styles.noteBody, { color: theme.textSecondary }]}>
            v2.10 and earlier are archived.{'\n'}Ask IT for the full log or a signed release note.
          </Text>
        </View>
      </ScrollView>

      <EntryDetailSheet entry={openEntry} onClose={() => setOpenKey(null)} onOpenScreen={handleOpenScreen} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 16, paddingBottom: 40, gap: 18 },
  noteCard: { borderRadius: radii.lg, borderWidth: 1, padding: 15, gap: 6 },
  noteTitle: { fontFamily: fontFamily.semibold, fontSize: 13 },
  noteBody: { fontFamily: fontFamily.mono, fontSize: 11, lineHeight: 11 * 1.65 },
});
