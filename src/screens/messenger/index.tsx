import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useToast } from '@/components/toast/toast-provider';
import { useTheme } from '@/theme/theme-provider';
import { useMarkRead, useMessages, useReadStatus, useSendMessage } from '@/data/messenger/hooks';
import { PEOPLE, THREADS } from '@/data/messenger/mock';
import type { MessengerView, ThreadId } from '@/data/messenger/types';

import { ThreadListView } from './thread-list-view';
import { ThreadView } from './thread-view';

export function Messenger() {
  const theme = useTheme();
  const toast = useToast();

  const { data: messages, refetch: refetchMessages } = useMessages();
  const { data: readStatus, refetch: refetchReadStatus } = useReadStatus();
  const sendMessage = useSendMessage();
  const markRead = useMarkRead();

  const [view, setView] = useState<MessengerView>('list');
  const [activeId, setActiveId] = useState<ThreadId | null>(null);
  const [draft, setDraft] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [pulledAt, setPulledAt] = useState('07:44');

  if (!messages || !readStatus) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  function handleOpen(id: ThreadId) {
    setActiveId(id);
    setDraft('');
    setView('thread');
    if (!readStatus?.[id]) markRead.mutate(id);
  }

  function handleBack() {
    setView('list');
    setActiveId(null);
    setDraft('');
  }

  function handleCompose() {
    toast.show({ message: 'Pick someone on shift to message', tone: 'ok' });
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !activeId) return;
    sendMessage.mutate({ threadId: activeId, text });
    setDraft('');
  }

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([refetchMessages(), refetchReadStatus()]);
    setPulledAt('just now');
    setRefreshing(false);
  }

  if (view === 'thread' && activeId) {
    const thread = THREADS.find((t) => t.id === activeId)!;
    const person = PEOPLE[activeId];
    const typing = !thread.missing && activeId === 'ak';

    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <ThreadView
          thread={thread}
          person={person}
          messages={messages[activeId] ?? []}
          typing={typing}
          draft={draft}
          onChangeDraft={setDraft}
          onSend={handleSend}
          onBack={handleBack}
          onCompose={handleCompose}
        />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ThreadListView
        threads={THREADS}
        messages={messages}
        readStatus={readStatus}
        pulledAt={pulledAt}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onOpen={handleOpen}
        onCompose={handleCompose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
