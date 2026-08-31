import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { DUE_OPTIONS } from '@/data/tasks/mock';
import type { DueOptionId, Task } from '@/data/tasks/types';

import { AssigneePicker } from './assignee-picker';
import { StatusOptions } from './status-options';

export interface TaskEditSheetProps {
  visible: boolean;
  draft: Task | null;
  isNew: boolean;
  onClose: () => void;
  onChange: (patch: Partial<Task>) => void;
  onSave: () => void;
  onDelete: () => void;
}

/** The full editor — admins only (`can('tasks')`). */
export function TaskEditSheet({ visible, draft, isNew, onClose, onChange, onSave, onDelete }: TaskEditSheetProps) {
  const theme = useTheme();
  const dueMeta = draft ? DUE_OPTIONS.find((d) => d.id === draft.due) : undefined;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={isNew ? 'New task' : 'Edit task'}>
      {draft ? (
        <>
          <View style={styles.group}>
            <TextField label="Task" value={draft.title} onChangeText={(v) => onChange({ title: v })} placeholder="What needs doing?" />
          </View>

          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Assign to</Text>
            <AssigneePicker value={draft.assignee} onChange={(name) => onChange({ assignee: name })} />
          </View>

          <View style={styles.group}>
            <View style={styles.rowBetween}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Due</Text>
              <Text style={[styles.note, tabularNums, { color: theme.textSecondary }]}>{dueMeta?.note}</Text>
            </View>
            <View style={styles.optionsRow}>
              {DUE_OPTIONS.map((d) => {
                const on = draft.due === d.id;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => onChange({ due: d.id as DueOptionId })}
                    style={[
                      styles.optionButton,
                      { backgroundColor: on ? theme.accentWash : theme.surface, borderColor: on ? theme.accent : theme.border },
                    ]}
                  >
                    <Text style={[styles.optionLabel, { color: on ? theme.accentWashText : theme.textPrimary }]}>{d.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Progress</Text>
            <StatusOptions value={draft.status} onChange={(status) => onChange({ status })} />
          </View>

          <View style={styles.actions}>
            <Button label={isNew ? 'Add task' : 'Save changes'} onPress={onSave} fullWidth />
            {!isNew ? <Button label="Delete task" variant="dangerOutline" onPress={onDelete} fullWidth /> : null}
          </View>
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 10,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.14 * 10,
    textTransform: 'uppercase',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  note: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    flex: 1,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontFamily: fontFamily.semibold,
    fontSize: 13.5,
  },
  actions: {
    gap: 10,
    paddingTop: 4,
  },
});
