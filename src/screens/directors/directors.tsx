import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { HeaderAccount } from '@/components/ui/header-account';
import { isBlocked, ScreenGate } from '@/components/ui/screen-gate';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { useRoleDirectory } from '@/data/directors/hooks';
import type { Role } from '@/data/directors/types';

import { HolderRow } from './holder-row';
import { RoleCard } from './role-card';
import { RoleSheet } from './role-sheet';

/**
 * The role register: every position the database defines, what it is for, and
 * who currently holds it.
 *
 * This replaced a hand-written "leadership board" of invented directors and
 * office addresses, which described a company that doesn't exist. Roles now
 * live in `positions` / `position_permissions`, so the screen reads them
 * instead of inventing them, and a role added in the admin panel appears here
 * with no code change.
 */
export function Directors() {
  const theme = useTheme();
  const directoryQuery = useRoleDirectory();
  const { data: directory } = directoryQuery;

  const [openId, setOpenId] = useState<string | null>(null);

  if (isBlocked(directoryQuery) || !directory) return <ScreenGate queries={[directoryQuery]} />;

  const { roles, unassigned } = directory;
  const people = roles.reduce((n, r) => n + r.holders.length, 0) + unassigned.length;
  const open: Role | null = openId ? (roles.find((r) => r.id === openId) ?? null) : null;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Roles"
        subtitle={`${roles.length} roles · ${people} people`}
        rightSlot={<HeaderAccount />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.intro, { color: theme.textSecondary }]}>
          Every role the system defines, what it covers and who holds it. Tap a role to see the
          screens it opens.
        </Text>

        <View style={styles.cards}>
          {roles.map((role, i) => (
            <RoleCard key={role.id} role={role} index={i} onPress={() => setOpenId(role.id)} />
          ))}
        </View>

        {unassigned.length ? (
          <View style={[styles.unassignedCard, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
            <Text style={[styles.unassignedTitle, { color: theme.textPrimary }]}>
              No role assigned · {unassigned.length}
            </Text>
            <Text style={[styles.unassignedNote, { color: theme.textSecondary }]}>
              These people have no position on their record, so they get no section grants at all.
            </Text>
            <View style={styles.unassignedPeople}>
              {unassigned.map((h) => (
                <HolderRow key={h.id} holder={h} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <RoleSheet visible={openId !== null} role={open} onClose={() => setOpenId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 110, gap: 16 },
  intro: { fontSize: 13, lineHeight: 13 * 1.55 },
  cards: { gap: 10, paddingTop: 2 },
  unassignedCard: { borderRadius: 16, borderWidth: 1, padding: 15, gap: 10 },
  unassignedTitle: { fontSize: 13.5, fontWeight: '600' },
  unassignedNote: { fontSize: 12.5, lineHeight: 12.5 * 1.5 },
  unassignedPeople: { gap: 10, paddingTop: 2 },
});
