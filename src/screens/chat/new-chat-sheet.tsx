import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { PEOPLE } from '@/data/chat/mock';
import type { PersonId } from '@/data/chat/types';

import { ActionRow } from './action-row';

export interface NewChatSheetProps {
  visible: boolean;
  onClose: () => void;
  onStartDm: (personId: PersonId) => void;
  onCreateGroup: (name: string, memberIds: PersonId[]) => void;
  busy: boolean;
}

type Mode = 'pick' | 'group';

/**
 * Two modes in one sheet: pick a person to message, or gather several into a
 * new group. The caller remounts it on each open (see its `key`), so this
 * state starts clean without an effect resetting it mid-exit-animation.
 */
export function NewChatSheet({ visible, onClose, onStartDm, onCreateGroup, busy }: NewChatSheetProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<Mode>('pick');
  const [query, setQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [picked, setPicked] = useState<PersonId[]>([]);

  const people = useMemo(() => {
    const list = Object.values(PEOPLE).sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name));
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => `${p.name} ${p.role} ${p.status}`.toLowerCase().includes(q));
  }, [query]);

  const toggle = (id: PersonId) => setPicked((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  // A "group" of one is just a dm, so the second member is what unlocks Create.
  const canCreate = groupName.trim().length > 0 && picked.length >= 2;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={mode === 'pick' ? 'New message' : 'New group'} maxHeight={680}>
      {mode === 'pick' ? (
        <ActionRow icon="users" label="New group" detail="Pick two or more people" onPress={() => setMode('group')} />
      ) : (
        <>
          <TextField label="Group name" value={groupName} onChangeText={setGroupName} placeholder="e.g. Line 4 leads" autoCapitalize="sentences" />
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            Members · {picked.length} selected
          </Text>
        </>
      )}

      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Icon name="search" size={16} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search people"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.textPrimary, fontFamily: fontFamily.regular }]}
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Icon name="x" size={14} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {people.map((person) => {
          const selected = picked.includes(person.id);
          return (
            <Pressable
              key={person.id}
              onPress={() => (mode === 'pick' ? onStartDm(person.id) : toggle(person.id))}
              style={({ pressed }) => [
                styles.person,
                {
                  backgroundColor: selected ? theme.accentWash : pressed ? theme.background : theme.surface,
                  borderColor: selected ? theme.accent : theme.border,
                },
              ]}
            >
              <Avatar initials={person.initials} tint={person.avatarTint} size="md" online={person.online} />
              <View style={styles.personText}>
                <Text style={[styles.personName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {person.name}
                </Text>
                <Text style={[styles.personRole, { color: theme.textSecondary }]} numberOfLines={1}>
                  {person.role} · {person.status}
                </Text>
              </View>
              <Icon
                name={mode === 'pick' ? 'chevron-right' : selected ? 'check-circle' : 'circle'}
                size={18}
                color={selected ? theme.accentWashText : theme.textSecondary}
              />
            </Pressable>
          );
        })}
        {people.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No one matches “{query.trim()}”</Text>
        ) : null}
      </View>

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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  list: {
    gap: 8,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 16,
    borderWidth: 1,
    padding: 11,
  },
  personText: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  personName: {
    fontFamily: fontFamily.semibold,
    fontSize: 14.5,
  },
  personRole: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.08 * 10,
    textTransform: 'uppercase',
  },
  empty: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 20,
  },
  footer: {
    gap: 8,
  },
});
