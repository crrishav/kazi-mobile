import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { Person, PersonId } from '@/data/chat/types';

import { ActionRow } from './action-row';
import { PeoplePicker } from './people-picker';

export interface NewChatSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Everyone on staff but you — already resolved by the caller from the live directory. */
  people: Person[];
  onStartDm: (personId: PersonId) => void;
  onCreateGroup: (name: string, memberIds: PersonId[]) => void;
  /** False when this person's position has no "create groups" grant; the row is then shown as refused, not hidden. */
  canCreateGroup: boolean;
  busy: boolean;
  error?: string | null;
}

type Mode = 'pick' | 'group';

/**
 * Two modes in one sheet: pick a person to message, or gather several into a
 * new group. The caller remounts it on each open (see its `key`), so this
 * state starts clean without an effect resetting it mid-exit-animation.
 */
export function NewChatSheet({
  visible,
  onClose,
  people,
  onStartDm,
  onCreateGroup,
  canCreateGroup,
  busy,
  error,
}: NewChatSheetProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('pick');
  const [groupName, setGroupName] = useState('');
  const [picked, setPicked] = useState<PersonId[]>([]);

  const toggle = (id: PersonId) => setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  // A "group" of one is just a dm, so the second member is what unlocks Create.
  const canCreate = groupName.trim().length > 0 && picked.length >= 2;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={mode === 'pick' ? 'New message' : 'New group'} maxHeight={680}>
      {mode === 'pick' ? (
        // Shown either way. A position that cannot start groups is told so
        // here rather than being left to wonder where the option went — and
        // the database would refuse the write regardless.
        <ActionRow
          icon="users"
          label="New group"
          detail={canCreateGroup ? 'Pick two or more people' : 'Your role can’t start groups'}
          onPress={() => canCreateGroup && setMode('group')}
        />
      ) : (
        <>
          <TextField label="Group name" value={groupName} onChangeText={setGroupName} placeholder="e.g. Line 4 leads" autoCapitalize="sentences" />
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Members · {picked.length} selected
          </Text>
        </>
      )}

      <PeoplePicker
        people={people}
        mode={mode === 'pick' ? 'select' : 'check'}
        picked={picked}
        onPress={(id) => (mode === 'pick' ? onStartDm(id) : toggle(id))}
        emptyNote="No colleagues on the staff list yet"
      />

      {error ? <Text style={[styles.error, { color: theme.dangerWashText }]}>{error}</Text> : null}

      {mode === 'group' ? (
        <View style={styles.footer}>
          <Button
            label={busy ? 'Creating…' : 'Create group'}
            variant="primary"
            fullWidth
            disabled={!canCreate}
            loading={busy}
            onPress={() => onCreateGroup(groupName.trim(), picked)}
          />
          <Button label="Back to people" variant="ghost" fullWidth onPress={() => setMode('pick')} />
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.12 * 10,
    textTransform: 'uppercase',
    marginBottom: -8,
  },
  error: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 11 * 1.5,
  },
  footer: {
    gap: 8,
  },
});
