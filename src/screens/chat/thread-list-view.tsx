import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { HeaderAccount } from '@/components/ui/header-account';
import { Icon } from '@/components/ui/icon';
import { PermissionNotice } from '@/components/ui/permission-notice';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { PEOPLE } from '@/data/chat/mock';
import type { Message, ThreadId, ThreadMeta } from '@/data/chat/types';

import { ThreadRow } from './thread-row';

export interface ThreadListViewProps {
  threads: ThreadMeta[];
  messages: Partial<Record<ThreadId, Message[]>>;
  readStatus: Partial<Record<ThreadId, boolean>>;
  pulledAt: string;
  refreshing: boolean;
  onRefresh: () => void;
  onOpen: (id: ThreadId) => void;
  onCompose: () => void;
  /** Hidden compose FAB + a read-only banner when the profile can't post here. */
  canCompose?: boolean;
}

/** Native `RefreshControl` stands in for the design's own tap-to-refresh dashed slot — same deliberate simplification already used for Dashboard's pull-to-refresh. */
export function ThreadListView({ threads, messages, readStatus, pulledAt, refreshing, onRefresh, onOpen, onCompose, canCompose = true }: ThreadListViewProps) {
  const theme = useTheme();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const totalUnread = threads.reduce((n, t) => n + (readStatus[t.id] ? 0 : t.unread), 0);
  const unreadSummary = totalUnread > 0 ? `${totalUnread} unread · ${threads.length} threads` : `${threads.length} threads · all read`;

  const previewFor = (t: ThreadMeta) => {
    const list = messages[t.id] ?? [];
    const last = list[list.length - 1];
    return t.preview ?? (last ? (last.from === 'me' ? `You: ${last.text}` : last.text) : 'No messages');
  };

  const visibleThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const person = PEOPLE[t.id];
      const haystack = `${person.name} ${person.role} ${person.status} ${previewFor(t)} ${t.ref ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
    // previewFor closes over `messages`; threads/messages/query are the real inputs.
  }, [threads, messages, query]);

  const toggleSearch = () => {
    setSearching((on) => {
      if (on) setQuery('');
      return !on;
    });
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Chat"
        subtitle={unreadSummary}
        showBack={false}
        rightSlot={
          <View style={styles.headerActions}>
            <Pressable
              onPress={toggleSearch}
              style={[
                styles.searchButton,
                { backgroundColor: searching ? theme.accent : theme.surface, borderColor: searching ? theme.accent : theme.border },
              ]}
            >
              <Icon name={searching ? 'x' : 'search'} size={17} color={searching ? theme.accentText : theme.textSecondary} />
            </Pressable>
            <HeaderAccount size="sm" />
          </View>
        }
      />

      {searching ? (
        <View style={[styles.searchBarWrap, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Icon name="search" size={16} color={theme.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              placeholder="Search people or messages"
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.textPrimary, fontFamily: fontFamily.regular }]}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Icon name="x" size={14} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        <PermissionNotice section="messenger" message="View only — you can’t post in these threads." />
        {visibleThreads.map((t, i) => {
          const person = PEOPLE[t.id];
          const unread = readStatus[t.id] ? 0 : t.unread;

          return (
            <ThreadRow
              key={t.id}
              person={person}
              preview={previewFor(t)}
              unread={unread}
              time={t.time}
              index={i}
              onPress={() => onOpen(t.id)}
            />
          );
        })}
        {visibleThreads.length === 0 ? (
          <Text style={[styles.emptyNote, { color: theme.textSecondary }]}>
            No threads match “{query.trim()}”
          </Text>
        ) : null}
        <Text style={[styles.syncNote, { color: theme.textSecondary }]}>Synced {pulledAt}</Text>
      </ScrollView>

      {canCompose ? (
        <Pressable
          onPress={onCompose}
          style={[styles.fab, { backgroundColor: theme.accent, boxShadow: theme.shadows.floating }]}
        >
          <Icon name="message-circle" size={22} color={theme.accentText} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  emptyNote: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 24,
  },
  content: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 100,
    gap: 10,
  },
  syncNote: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.12 * 10,
    textTransform: 'uppercase',
    textAlign: 'center',
    paddingTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
