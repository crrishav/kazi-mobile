import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { useToast } from '@/components/toast/toast-provider';
import { isBlocked, ScreenGate } from '@/components/ui/screen-gate';
import { useTheme } from '@/theme/theme-provider';
import {
  useCreateThread,
  useDeleteMessages,
  useDeleteThread,
  useMessages,
  useSendMessage,
  useSetThreadFlag,
  useSetThreadRead,
  useThreads,
  useToggleReaction,
  useUnread,
} from '@/data/chat/hooks';
import { TYPING_IN } from '@/data/chat/mock';
import type { ChatView, Message, MessageId, PersonId, ThreadId } from '@/data/chat/types';
import { sortThreads, threadTitle } from '@/data/chat/utils';

import { NewChatSheet } from './new-chat-sheet';
import { ThreadListView } from './thread-list-view';
import { ThreadView } from './thread-view';

export function Chat() {
  const theme = useTheme();
  const toast = useToast();
  const { can } = useAuth();
  const canPost = can('messenger');

  const threadsQuery = useThreads();
  const messagesQuery = useMessages();
  const unreadQuery = useUnread();
  const { data: threads } = threadsQuery;
  const { data: messages, refetch: refetchMessages } = messagesQuery;
  const { data: unread, refetch: refetchUnread } = unreadQuery;

  const sendMessage = useSendMessage();
  const toggleReaction = useToggleReaction();
  const deleteMessages = useDeleteMessages();
  const setThreadRead = useSetThreadRead();
  const setThreadFlag = useSetThreadFlag();
  const deleteThread = useDeleteThread();
  const createThread = useCreateThread();

  const [view, setView] = useState<ChatView>('list');
  const [activeId, setActiveId] = useState<ThreadId | null>(null);
  const [composing, setComposing] = useState(false);
  /** Bumped on every open so `NewChatSheet` remounts with fresh state instead of resetting it in an effect. */
  const [composeSession, setComposeSession] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [pulledAt, setPulledAt] = useState('07:44');

  /** Last message per thread — drives both the preview and the list's recency order. */
  const lastByThread = useMemo(() => {
    const out: Record<ThreadId, Message | undefined> = {};
    for (const [id, list] of Object.entries(messages ?? {})) out[id] = list[list.length - 1];
    return out;
  }, [messages]);

  const ordered = useMemo(() => {
    const lastAt: Record<ThreadId, number> = {};
    for (const [id, m] of Object.entries(lastByThread)) lastAt[id] = m?.at ?? 0;
    return sortThreads(threads ?? [], lastAt);
  }, [threads, lastByThread]);

  if (isBlocked(threadsQuery, messagesQuery, unreadQuery) || !threads || !messages || !unread) {
    return <ScreenGate queries={[threadsQuery, messagesQuery, unreadQuery]} />;
  }

  function openThread(id: ThreadId) {
    setActiveId(id);
    setView('thread');
    if ((unread?.[id] ?? 0) > 0) setThreadRead.mutate({ threadId: id, read: true });
  }

  function handleBack() {
    setView('list');
    setActiveId(null);
  }

  /** Shared by the list's FAB and the deleted-thread screen's "Start a new message". */
  function openCompose() {
    if (!canPost) return;
    setComposeSession((n) => n + 1);
    setComposing(true);
  }

  /** Both compose paths — pick a person, or "reply privately" from a group message. */
  function startDm(personId: PersonId) {
    setComposing(false);
    createThread.mutate({ kind: 'dm', personId }, { onSuccess: (thread) => openThread(thread.id) });
  }

  function createGroup(name: string, memberIds: PersonId[]) {
    setComposing(false);
    createThread.mutate(
      { kind: 'group', name, memberIds },
      {
        onSuccess: (thread) => {
          openThread(thread.id);
          toast.show({ message: `${thread.name} created with ${memberIds.length} others`, tone: 'ok' });
        },
      },
    );
  }

  function handleDeleteThread(threadId: ThreadId) {
    const gone = threads?.find((t) => t.id === threadId);
    deleteThread.mutate(threadId);
    if (activeId === threadId) handleBack();
    if (gone) toast.show({ message: `${threadTitle(gone)} deleted`, tone: 'ok' });
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([threadsQuery.refetch(), refetchMessages(), refetchUnread()]);
    setPulledAt('just now');
    setRefreshing(false);
  }

  const activeThread = activeId ? threads.find((t) => t.id === activeId) : undefined;

  const composeSheet = (
    <NewChatSheet
      key={composeSession}
      visible={composing}
      busy={createThread.isPending}
      onClose={() => setComposing(false)}
      onStartDm={startDm}
      onCreateGroup={createGroup}
    />
  );

  if (view === 'thread' && activeThread) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ThreadView
          // Keyed by thread so the draft, reply and selection reset when you
          // move between conversations rather than leaking across them.
          key={activeThread.id}
          thread={activeThread}
          messages={messages[activeThread.id] ?? []}
          typingId={activeThread.missing ? undefined : TYPING_IN[activeThread.id]}
          canPost={canPost}
          unread={unread[activeThread.id] ?? 0}
          onBack={handleBack}
          onSend={(text, replyTo) => sendMessage.mutate({ threadId: activeThread.id, text, replyTo, thread: activeThread })}
          onToggleReaction={(messageId, emoji) => toggleReaction.mutate({ threadId: activeThread.id, messageId, emoji })}
          onDeleteMessages={(ids: MessageId[]) => deleteMessages.mutate({ threadId: activeThread.id, ids })}
          onSetRead={(read) => setThreadRead.mutate({ threadId: activeThread.id, read })}
          onSetFlag={(flag, value) => setThreadFlag.mutate({ threadId: activeThread.id, flag, value })}
          onDeleteThread={() => handleDeleteThread(activeThread.id)}
          onReplyPrivately={startDm}
          onCompose={() => {
            handleBack();
            openCompose();
          }}
        />
        {composeSheet}
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ThreadListView
        threads={ordered}
        lastByThread={lastByThread}
        unread={unread}
        pulledAt={pulledAt}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onOpen={openThread}
        canCompose={canPost}
        onCompose={openCompose}
        onSetRead={(threadId, read) => setThreadRead.mutate({ threadId, read })}
        onSetFlag={(threadId, flag, value) => setThreadFlag.mutate({ threadId, flag, value })}
        onDeleteThread={handleDeleteThread}
      />
      {composeSheet}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
