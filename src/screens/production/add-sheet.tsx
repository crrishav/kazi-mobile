import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { DUE_OPTIONS, PEOPLE, STAGES, stageRampDark, stageRampLight } from '@/data/production/mock';
import type { BatchDraft } from '@/data/production/types';

export interface AddSheetProps {
  visible: boolean;
  draft: BatchDraft;
  onClose: () => void;
  onChange: (patch: Partial<BatchDraft>) => void;
  onCreate: () => void;
}

export function AddSheet({ visible, draft, onClose, onChange, onCreate }: AddSheetProps) {
  const theme = useTheme();
  const ramp = theme.scheme === 'dark' ? stageRampDark : stageRampLight;

  return (
    <BottomSheet visible={visible} onClose={onClose} title="New batch">
      <TextField label="Product" value={draft.product} onChangeText={(v) => onChange({ product: v })} placeholder="e.g. Terry fabric hoodies" />

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField label="Quantity" value={draft.qty} onChangeText={(v) => onChange({ qty: v })} placeholder="2,400 pcs" />
        </View>
        <View style={styles.flex}>
          <TextField label="PO ref" value={draft.ref} onChangeText={(v) => onChange({ ref: v })} placeholder="PO-2295" compact />
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Start stage</Text>
        <View style={styles.stageGrid}>
          {STAGES.map((s, i) => {
            const on = draft.stage === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => onChange({ stage: s.key })}
                style={[styles.stageButton, { backgroundColor: on ? theme.accentWash : theme.surface, borderColor: on ? theme.accent : theme.border }]}
              >
                <View style={[styles.stageDot, { backgroundColor: ramp[i] }]} />
                <Text style={[styles.stageLabel, { color: on ? theme.accentWashText : theme.textPrimary }]} numberOfLines={1}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Due</Text>
        <View style={styles.dueRow}>
          {DUE_OPTIONS.map((d) => {
            const on = draft.due === d.id;
            return (
              <Pressable
                key={d.id}
                onPress={() => onChange({ due: d.id })}
                style={[styles.dueButton, { backgroundColor: on ? theme.accentWash : theme.surface, borderColor: on ? theme.accent : theme.border }]}
              >
                <Text style={[styles.dueLabel, { color: on ? theme.accentWashText : theme.textPrimary }]}>{d.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Supervisor</Text>
        <View style={styles.peopleRow}>
          {PEOPLE.map((p) => {
            const on = draft.person === p.id;
            return (
              <Pressable key={p.id} onPress={() => onChange({ person: p.id })} style={styles.personButton}>
                <Avatar initials={p.initials} tint={p.tint} size="lg" borderColor={on ? theme.accent : undefined} />
                <Text style={[styles.personName, { color: on ? theme.textPrimary : theme.textSecondary, fontFamily: on ? fontFamily.semibold : fontFamily.regular }]}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        onPress={() => onChange({ photo: !draft.photo })}
        style={[styles.photoZone, { backgroundColor: draft.photo ? theme.accentWash : theme.surface, borderColor: draft.photo ? theme.accent : theme.border }]}
      >
        <Icon name="camera" size={20} color={theme.accentDeep} />
        <Text style={[styles.photoLabel, { color: theme.accentDeep }]}>{draft.photo ? 'Reference photo attached' : 'Take or upload a photo'}</Text>
      </Pressable>

      <Button label="Create batch" onPress={onCreate} fullWidth style={styles.createButton} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  group: { gap: 10 },
  label: { fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 0.14 * 10, textTransform: 'uppercase' },
  stageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stageButton: { width: '47%', flexGrow: 1, height: 46, borderRadius: 13, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  stageDot: { width: 7, height: 7, borderRadius: 99 },
  stageLabel: { fontFamily: fontFamily.semibold, fontSize: 13 },
  dueRow: { flexDirection: 'row', gap: 8 },
  dueButton: { flex: 1, height: 46, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dueLabel: { fontFamily: fontFamily.semibold, fontSize: 13.5 },
  peopleRow: { flexDirection: 'row', gap: 10 },
  personButton: { width: 56, alignItems: 'center', gap: 6 },
  personName: { fontSize: 11 },
  photoZone: { height: 88, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  photoLabel: { fontSize: 13.5, fontWeight: '600' },
  createButton: { height: 54 },
});
