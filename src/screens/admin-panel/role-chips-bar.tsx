import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { Role, RoleKey } from '@/data/admin-panel/types';

export interface RoleChipsBarProps {
  roles: Role[];
  activeRole: RoleKey;
  onPick: (role: RoleKey) => void;
}

/** Extra header content beyond title+avatar (the design's own role picker row) rendered fixed below `ScreenHeader`, per the established convention for a richer module header. */
export function RoleChipsBar({ roles, activeRole, onPick }: RoleChipsBarProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={[styles.wrap, { borderBottomColor: theme.border, backgroundColor: theme.background }]}
    >
      {roles.map((r) => {
        const on = r.key === activeRole;
        return (
          <Pressable
            key={r.key}
            onPress={() => onPick(r.key)}
            style={[
              styles.chip,
              {
                backgroundColor: on ? theme.surfaceInverted : theme.surface,
                borderColor: on ? theme.surfaceInverted : theme.border,
              },
            ]}
          >
            <Text style={[styles.label, { color: on ? theme.onDark.text : theme.textPrimary }]}>{r.label}</Text>
            <Text style={[styles.count, { color: on ? theme.onDark.textMuted : theme.textSecondary }]}>{r.people}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: 12.5,
  },
  count: {
    fontFamily: fontFamily.mono,
    fontSize: 10.5,
  },
});
