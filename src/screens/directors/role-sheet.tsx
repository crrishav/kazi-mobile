import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import type { Role, RoleSection } from '@/data/directors/types';

import { HolderRow } from './holder-row';

export interface RoleSheetProps {
  visible: boolean;
  role: Role | null;
  onClose: () => void;
}

function Chips({ sections, editable }: { sections: RoleSection[]; editable: boolean }) {
  const theme = useTheme();

  if (!sections.length) {
    return <Text style={[styles.none, { color: theme.textSecondary }]}>None</Text>;
  }
  return (
    <View style={styles.chips}>
      {sections.map((s) => (
        <View
          key={s.id}
          style={[
            styles.chip,
            editable
              ? { backgroundColor: theme.accentWash }
              : { borderWidth: 1, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.chipLabel, { color: editable ? theme.accentWashText : theme.textSecondary }]}>
            {s.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** What a role means: its remit in words, the people in it, and the screens it opens. */
export function RoleSheet({ visible, role, onClose }: RoleSheetProps) {
  const theme = useTheme();

  return (
    <BottomSheet visible={visible && role !== null} onClose={onClose} title={role?.label ?? ''}>
      {role ? (
        <>
          {role.description ? (
            <View style={styles.block}>
              <Text style={[styles.body, { color: theme.textPrimary }]}>{role.description}</Text>
            </View>
          ) : null}

          <View style={styles.block}>
            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
              People · {role.holders.length}
            </Text>
            {role.holders.length ? (
              <View style={styles.holders}>
                {role.holders.map((h) => (
                  <HolderRow key={h.id} holder={h} showEmail />
                ))}
              </View>
            ) : (
              <Text style={[styles.none, { color: theme.textSecondary }]}>Nobody holds this role.</Text>
            )}
          </View>

          <View style={styles.block}>
            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>Can edit</Text>
            <Chips sections={role.sections.filter((s) => s.canEdit)} editable />
          </View>

          <View style={styles.block}>
            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>View only</Text>
            <Chips sections={role.sections.filter((s) => !s.canEdit)} editable={false} />
          </View>

          <Text style={[styles.footnote, tabularNums, { color: theme.textSecondary }]}>
            Role id {role.id} · edited in the admin panel
          </Text>
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  block: { gap: 10 },
  eyebrow: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.12 * 10, textTransform: 'uppercase' },
  body: { fontSize: 14, lineHeight: 14 * 1.55 },
  holders: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { height: 28, paddingHorizontal: 11, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 12, fontWeight: '600' },
  none: { fontSize: 13, opacity: 0.85 },
  footnote: { fontFamily: fontFamily.mono, fontSize: 10.5, opacity: 0.8 },
});
