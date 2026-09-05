import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, tintFromSeed } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii } from '@/theme';
import { RECORDS_TIER, type AccessCounts, type PersonRow, type RoleRow } from '@/data/admin-panel/types';
import { initialsOf, scopeBucket } from '@/data/admin-panel/utils';

import { AccessBar, AccessLegend } from './access-bar';

export interface RoleSummaryCardProps {
  role: RoleRow;
  /** What the meter shows: the draft as it stands, not what is saved. */
  counts: AccessCounts;
  isSuperAdmin: boolean;
  dirty: boolean;
  changeCount: number;
  holders: PersonRow[];
  onOpenPeople: () => void;
}

/** The one inverted card on the screen — who the role is, what it reaches, and who holds it. */
export function RoleSummaryCard({
  role,
  counts,
  isSuperAdmin,
  dirty,
  changeCount,
  holders,
  onOpenPeople,
}: RoleSummaryCardProps) {
  const theme = useTheme();
  const allRecords = !isSuperAdmin && scopeBucket(role.tier) === RECORDS_TIER;

  return (
    <View style={[styles.card, { backgroundColor: theme.surfaceInverted }]}>
      <View style={styles.headRow}>
        <Avatar initials={initialsOf(role.label)} size="md" tint={tintFromSeed(role.id)} />
        <View style={styles.headText}>
          <Text style={[styles.roleName, { color: theme.onDark.text }]} numberOfLines={1}>
            {role.label}
          </Text>
          <Text style={[styles.roleId, { color: theme.onDark.textMuted }]} numberOfLines={1}>
            {role.id}
          </Text>
        </View>
        <View
          style={[
            styles.stateChip,
            { backgroundColor: dirty ? theme.onDark.warningWash : theme.onDark.accentWash },
          ]}
        >
          <View style={[styles.stateDot, { backgroundColor: dirty ? theme.onDark.warningWashText : theme.onDark.accentWashText }]} />
          <Text style={[styles.stateLabel, { color: dirty ? theme.onDark.warningWashText : theme.onDark.accentWashText }]}>
            {dirty ? `${changeCount} unsaved` : 'In effect'}
          </Text>
        </View>
      </View>

      {isSuperAdmin || allRecords || role.description ? (
        <View style={styles.chipsRow}>
          {isSuperAdmin ? (
            <View style={[styles.chip, { backgroundColor: theme.onDark.warningWash }]}>
              <Icon name="lock" size={10} color={theme.onDark.warningWashText} />
              <Text style={[styles.chipLabel, { color: theme.onDark.warningWashText }]}>super admin</Text>
            </View>
          ) : null}
          {allRecords ? (
            <View style={[styles.chip, { backgroundColor: theme.onDark.accentWash }]}>
              <Text style={[styles.chipLabel, { color: theme.onDark.accentWashText }]}>all records</Text>
            </View>
          ) : null}
          {role.description ? (
            <Text style={[styles.description, { color: theme.onDark.textMuted }]} numberOfLines={2}>
              {role.description}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.meter}>
        <AccessBar counts={counts} height={6} onDark />
        <AccessLegend counts={counts} onDark />
        {isSuperAdmin ? (
          <View style={styles.lockNote}>
            <Icon name="lock" size={11} color={theme.onDark.textMuted} />
            <Text style={[styles.lockNoteText, { color: theme.onDark.textMuted }]}>
              Locked while super admin is on.
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={onOpenPeople}
        style={({ pressed }) => [styles.peopleRow, { borderColor: theme.onDark.textMuted, opacity: pressed ? 0.75 : 1 }]}
      >
        {holders.length === 0 ? (
          <Text style={[styles.peopleEmpty, { color: theme.onDark.textMuted }]} numberOfLines={1}>
            Nobody holds this role yet
          </Text>
        ) : (
          <>
            <View style={styles.stack}>
              {holders.slice(0, 4).map((h, i) => (
                <View key={h.id} style={i > 0 ? styles.stacked : null}>
                  <Avatar
                    initials={initialsOf(h.name)}
                    size="sm"
                    tint={tintFromSeed(h.id)}
                    borderColor={theme.surfaceInverted}
                  />
                </View>
              ))}
            </View>
            <Text style={[styles.peopleText, { color: theme.onDark.text }]} numberOfLines={1}>
              {holders.slice(0, 2).map((h) => h.name).join(', ')}
              {holders.length > 2 ? ` +${holders.length - 2}` : ''}
            </Text>
          </>
        )}
        <Icon name="chevron-right" size={15} color={theme.onDark.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 17,
    gap: 14,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headText: { flex: 1, gap: 3, minWidth: 0 },
  roleName: { fontFamily: fontFamily.semibold, fontSize: 17, letterSpacing: -0.01 * 17 },
  roleId: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  stateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  stateDot: { width: 6, height: 6, borderRadius: 99 },
  stateLabel: { fontFamily: fontFamily.semibold, fontSize: 11.5 },
  chipsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  chipLabel: { fontFamily: fontFamily.mono, fontSize: 10 },
  description: { flex: 1, fontFamily: fontFamily.mono, fontSize: 10.5, lineHeight: 10.5 * 1.5, minWidth: 120 },
  meter: { gap: 9 },
  lockNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockNoteText: { fontFamily: fontFamily.mono, fontSize: 10.5 },
  peopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  stack: { flexDirection: 'row' },
  stacked: { marginLeft: -12 },
  peopleText: { flex: 1, fontFamily: fontFamily.regular, fontSize: 13 },
  peopleEmpty: { flex: 1, fontFamily: fontFamily.mono, fontSize: 11 },
});
