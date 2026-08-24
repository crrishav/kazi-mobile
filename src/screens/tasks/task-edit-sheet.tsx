import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, tabularNums } from '@/theme';
import { DUE_OPTIONS, PEOPLE, STATUS_LABEL, STATUS_ORDER } from '@/data/tasks/mock';
import type { DueOptionId, Task, TaskStatus } from '@/data/tasks/types';

export interface TaskEditSheetProps {
  visible: boolean;
  draft: Task | null;
  isNew: boolean;
  onClose: () => void;
  onChange: (patch: Partial<Task>) => void;
  onSave: () => void;
  onDelete: () => void;
}

export function TaskEditSheet({ visible, draft, isNew, onClose, onChange, onSave, onDelete }: TaskEditSheetProps) {
  const theme = useTheme();
  const dueMeta = draft ? DUE_OPTIONS.find((d) => d.id === draft.due) : undefined;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={isNew ? 'New task' : 'Edit task'}>
      {draft ? (
        <>
          <View style={styles.group}>
            <TextField label="Task" value={draft.title} onChangeText={(v) => onChange({ title: v })} placeholder="What needs doing?" />
            <TextField value={draft.ref} onChangeText={(v) => onChange({ ref: v })} placeholder="Reference · PO-2291" compact />
          </View>

          <View style={styles.group}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Assignee</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleRow}>
              {PEOPLE.map((p) => {
                const on = draft.personId === p.id;
                return (
                  <Pressable key={p.id} onPress={() => onChange({ personId: p.id })} style={styles.personCell}>
                    <View style={on ? [styles.personRing, { borderColor: theme.accent }] : undefined}>
                      <Avatar initials={p.initials} tint={p.tint} size="lg" />
                    </View>
                    <Text
                      style={[
                        styles.personName,
                        { color: on ? theme.textPrimary : theme.textSecondary, fontFamily: on ? fontFamily.semibold : fontFamily.regular },
                      ]}
                    >
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
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
            <Text style={[styles.label, { color: theme.textSecondary }]}>Status</Text>
            <View style={styles.statusGrid}>
              {STATUS_ORDER.map((s) => (
                <StatusOption key={s} status={s} selected={draft.status === s} onPress={() => onChange({ status: s })} />
              ))}
            </View>
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

function StatusOption({ status, selected, onPress }: { status: TaskStatus; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  const dotColor: Record<TaskStatus, string> = {
    blocked: theme.danger,
    progress: theme.accent,
    inactive: theme.draftDot,
    done: theme.onDark.accent,
  };
  const washBg: Record<TaskStatus, string> = {
    blocked: theme.dangerWash,
    progress: theme.accentWash,
    inactive: theme.draftWash,
    done: theme.surfaceInverted,
  };
  const washFg: Record<TaskStatus, string> = {
    blocked: theme.dangerWashText,
    progress: theme.accentWashText,
    inactive: theme.draftWashText,
    done: theme.onDark.avatarText,
  };

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.statusOption,
        { backgroundColor: selected ? washBg[status] : theme.surface, borderColor: selected ? dotColor[status] : theme.border },
      ]}
    >
      <View style={[styles.statusDot, { backgroundColor: dotColor[status] }]} />
      <Text style={[styles.optionLabel, { color: selected ? washFg[status] : theme.textPrimary }]}>{STATUS_LABEL[status]}</Text>
    </Pressable>
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
  peopleRow: {
    gap: 10,
  },
  personCell: {
    alignItems: 'center',
    gap: 6,
    width: 56,
  },
  personRing: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 2,
  },
  personName: {
    fontSize: 11,
    textAlign: 'center',
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
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    width: '47.5%',
    flexGrow: 1,
    height: 46,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
  },
  actions: {
    gap: 10,
    paddingTop: 4,
  },
});
