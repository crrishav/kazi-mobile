import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { CURRENT_USER, PEOPLE } from '@/data/messenger/mock';
import type { Message, ThreadId, ThreadMeta } from '@/data/messenger/types';

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
}

/** Native `RefreshControl` stands in for the design's own tap-to-refresh dashed slot — same deliberate simplification already used for Dashboard's pull-to-refresh. */
export function ThreadListView({ threads, messages, readStatus, pulledAt, refreshing, onRefresh, onOpen, onCompose }: ThreadListViewProps) {
  const theme = useTheme();
  const toast = useToast();

  const totalUnread = threads.reduce((n, t) => n + (readStatus[t.id] ? 0 : t.unread), 0);
  const unreadSummary = totalUnread > 0 ? `${totalUnread} unread · ${threads.length} threads` : `${threads.length} threads · all read`;

  return (
    <View style={styles.flex}>
      <ScreenHeader
        title="Messages"
        subtitle={unreadSummary}
        rightSlot={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => toast.show({ message: "Search isn't available yet", tone: 'ok' })}
              style={[styles.searchButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Icon name="search" size={17} color={theme.textSecondary} />
            </Pressable>
            <Avatar initials={CURRENT_USER.initials} tint="dark" size="sm" />
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
      >
        {threads.map((t, i) => {
          const person = PEOPLE[t.id];
          const list = messages[t.id] ?? [];
          const last = list[list.length - 1];
          const unread = readStatus[t.id] ? 0 : t.unread;
          const preview = t.preview ?? (last ? (last.from === 'me' ? `You: ${last.text}` : last.text) : 'No messages');

          return (
            <ThreadRow
              key={t.id}
              person={person}
              preview={preview}
              unread={unread}
              time={t.time}
              index={i}
              onPress={() => onOpen(t.id)}
            />
          );
        })}
        <Text style={[styles.syncNote, { color: theme.textSecondary }]}>Synced {pulledAt}</Text>
      </ScrollView>

      <Pressable
        onPress={onCompose}
        style={[styles.fab, { backgroundColor: theme.accent, boxShadow: theme.shadows.floating }]}
      >
        <Icon name="message-circle" size={22} color={theme.accentText} />
      </Pressable>
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
