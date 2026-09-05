import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { RoleHolder } from '@/data/directors/types';

const LOCATION_LABEL = { nepal: 'KTM', uk: 'UK', '': '' } as const;

export interface HolderRowProps {
  holder: RoleHolder;
  /** The sheet shows the email under the name; the cards don't have the width. */
  showEmail?: boolean;
}

/** One person under a role — the same line on a role card and inside its sheet. */
export function HolderRow({ holder, showEmail = false }: HolderRowProps) {
  const theme = useTheme();
  const secondary = showEmail ? holder.email : holder.department;

  return (
    <View style={styles.row}>
      <Avatar initials={holder.initials} tint={holder.tint} size="sm" />
      <View style={styles.textWrap}>
        <Text style={[styles.name, { color: theme.textPrimary }]} numberOfLines={1}>
          {holder.name}
        </Text>
        {secondary ? (
          <Text style={[showEmail ? styles.email : styles.dept, { color: theme.textSecondary }]} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </View>
      {holder.active ? null : (
        <View style={[styles.tag, { backgroundColor: theme.draftWash }]}>
          <Text style={[styles.tagLabel, { color: theme.draftWashText }]}>Inactive</Text>
        </View>
      )}
      {LOCATION_LABEL[holder.location] ? (
        <Text style={[styles.location, { color: theme.textSecondary }]}>{LOCATION_LABEL[holder.location]}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  textWrap: { flex: 1, gap: 2, minWidth: 0 },
  name: { fontFamily: fontFamily.semibold, fontSize: 14 },
  dept: { fontSize: 12 },
  email: { fontFamily: fontFamily.mono, fontSize: 11 },
  tag: { paddingHorizontal: 8, height: 20, borderRadius: 999, justifyContent: 'center', flexShrink: 0 },
  tagLabel: { fontSize: 10.5, fontWeight: '600' },
  location: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.1 * 10, flexShrink: 0, opacity: 0.85 },
});
