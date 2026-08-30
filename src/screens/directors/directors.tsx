import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { HeaderAccount } from '@/components/ui/header-account';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { useDirectors } from '@/data/directors/hooks';
import { GROUPS, REGISTERED_ENTITY_LINES } from '@/data/directors/mock';
import type { Director } from '@/data/directors/types';

import { CompanyCard } from './company-card';
import { DirectorSheet } from './director-sheet';
import { ModelCard } from './model-card';
import { OfficesRow } from './offices-row';
import { PersonRow } from './person-row';

export function Directors() {
  const theme = useTheme();
  const toast = useToast();
  const { data: directors } = useDirectors();

  const [openId, setOpenId] = useState<number | null>(null);

  if (!directors) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  const open: Director | null = openId ? (directors.find((p) => p.id === openId) ?? null) : null;
  const groups = GROUPS.map((g) => ({ ...g, people: directors.filter((p) => p.group === g.key) })).filter((g) => g.people.length > 0);

  const handleCopyEmail = () => {
    toast.show({ message: open ? `Copied ${open.email}` : '', tone: 'ok' });
  };
  const handleMessage = () => {
    toast.show({ message: open ? `Message thread opened with ${open.name.split(' ')[0]}` : '', tone: 'ok' });
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Directors" subtitle={`${directors.length} leaders · 2 offices`} rightSlot={<HeaderAccount />} />

      <ScrollView contentContainerStyle={styles.content}>
        <CompanyCard />
        <ModelCard />
        <OfficesRow />

        <View style={styles.leadershipHeaderRow}>
          <Text style={[styles.leadershipEyebrow, { color: theme.textSecondary }]}>Leadership · {directors.length}</Text>
          <Text style={[styles.leadershipMeta, { color: theme.textSecondary }]}>By office</Text>
        </View>

        {groups.map((g) => (
          <View key={g.key} style={styles.groupWrap}>
            <View style={styles.groupHeaderRow}>
              <Text style={[styles.groupTitle, { color: theme.textPrimary }]}>{g.title}</Text>
              <Text style={[styles.groupMeta, tabularNums, { color: theme.textSecondary }]}>
                {g.people.length} · {g.meta}
              </Text>
            </View>
            <View style={styles.groupPeople}>
              {g.people.map((p, i) => (
                <PersonRow key={p.id} person={p} index={i} onPress={() => setOpenId(p.id)} />
              ))}
            </View>
          </View>
        ))}

        <View style={[styles.entityCard, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
          <Text style={[styles.entityTitle, { color: theme.textPrimary }]}>Registered entity</Text>
          <Text style={[styles.entityLines, { color: theme.textSecondary }]}>{REGISTERED_ENTITY_LINES.join('\n')}</Text>
        </View>
      </ScrollView>

      <DirectorSheet visible={openId !== null} director={open} onClose={() => setOpenId(null)} onCopyEmail={handleCopyEmail} onMessage={handleMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingTop: 4, paddingBottom: 110, gap: 12 },
  leadershipHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6 },
  leadershipEyebrow: { flex: 1, fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  leadershipMeta: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase', opacity: 0.85 },
  groupWrap: { gap: 9 },
  groupHeaderRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  groupTitle: { fontFamily: fontFamily.semibold, fontSize: 15, letterSpacing: -0.01 * 15 },
  groupMeta: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  groupPeople: { gap: 8 },
  entityCard: { borderRadius: 16, borderWidth: 1, padding: 15, gap: 6 },
  entityTitle: { fontSize: 13, fontWeight: '600' },
  entityLines: { fontFamily: fontFamily.mono, fontSize: 11, lineHeight: 11 * 1.65 },
});
