import * as Clipboard from 'expo-clipboard';
import { useCallback, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useToast } from '@/components/toast/toast-provider';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { ME, type Message, type MessageId, type PersonId, type Thread } from '@/data/chat/types';
import { firstName, groupByDay, messageText, personFor, threadTitle } from '@/data/chat/utils';

import { Composer } from './composer';
import { MessageActionsSheet } from './message-actions-sheet';
import { MessageBubble } from './message-bubble';
import { SelectionHeader, ThreadHeader } from './thread-header';
import { ThreadActionsSheet } from './thread-actions-sheet';
import { ThreadNotFound } from './thread-not-found';

export interface ThreadViewProps {
  thread: Thread;
  messages: Message[];
  /** Whoever is mid-message on the other side, if anyone. */
  typingId?: PersonId;
  canPost: boolean;
  /** Unread count for this thread, so its own options sheet can offer "mark unread". */
  unread: number;
  onBack: () => void;
  onSend: (text: string, replyTo?: MessageId) => void;
  onToggleReaction: (messageId: MessageId, emoji: string) => void;
  onDeleteMessages: (ids: MessageId[]) => void;
  onSetRead: (read: boolean) => void;
  onSetFlag: (flag: 'pinned' | 'muted', value: boolean) => void;
  onDeleteThread: () => void;
  onReplyPrivately: (personId: PersonId) => void;
  onCompose: () => void;
}

export function ThreadView({
  thread,
  messages,
  typingId,
  canPost,
  unread,
  onBack,
  onSend,
  onToggleReaction,
  onDeleteMessages,
  onSetRead,
  onSetFlag,
  onDeleteThread,
  onReplyPrivately,
  onCompose,
}: ThreadViewProps) {
  const theme = useTheme();
  const toast = useToast();
  const scrollRef = useRef<ScrollView>(null);

  const [draft, setDraft] = useState('');
  const [replyToId, setReplyToId] = useState<MessageId | null>(null);
  const [sheetTarget, setSheetTarget] = useState<MessageId | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<MessageId[]>([]);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const isGroup = thread.kind === 'group';
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const days = useMemo(() => groupByDay(messages), [messages]);

  const replyTo = replyToId ? (byId.get(replyToId) ?? null) : null;
  const sheetMessage = sheetTarget ? (byId.get(sheetTarget) ?? null) : null;
  const selectedMessages = selected.map((id) => byId.get(id)).filter((m): m is Message => !!m);
  const canDeleteSelection = selectedMessages.length > 0 && selectedMessages.every((m) => m.authorId === ME && !m.deleted);

  const exitSelection = useCallback(() => {
    setSelecting(false);
    setSelected([]);
  }, []);

  const toggleSelected = (id: MessageId) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  /** Group copies carry the sender's name — a bare block of text loses who said what. */
  const copyToClipboard = async (items: Message[]) => {
    const body = items
      .map((m) => (isGroup ? `${m.authorId === ME ? 'You' : personFor(m.authorId).name}: ${messageText(m)}` : messageText(m)))
      .join('\n');
    await Clipboard.setStringAsync(body);
    toast.show({ message: items.length > 1 ? `${items.length} messages copied` : 'Message copied', tone: 'ok' });
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !canPost) return;
    onSend(text, replyToId ?? undefined);
    setDraft('');
    setReplyToId(null);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const handleBubblePress = (message: Message) => {
    if (selecting) toggleSelected(message.id);
  };

  const handleBubbleLongPress = (message: Message) => {
    if (selecting) toggleSelected(message.id);
    else setSheetTarget(message.id);
  };

  const startReply = (id: MessageId) => {
    if (!canPost) return;
    setSheetTarget(null);
    setReplyToId(id);
  };

  if (thread.missing) {
    return (
      <Animated.View entering={FadeIn.duration(180)} style={styles.flex}>
        <ThreadHeader thread={null} onBack={onBack} />
        <ThreadNotFound reference={thread.ref ?? ''} onBack={onBack} onCompose={onCompose} />
      </Animated.View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View entering={FadeIn.duration(180)} style={styles.flex}>
        {selecting ? (
          <SelectionHeader
            count={selected.length}
            canDelete={canPost && canDeleteSelection}
            onCancel={exitSelection}
            onCopy={() => {
              void copyToClipboard(selectedMessages);
              exitSelection();
            }}
            onDelete={() => {
              onDeleteMessages(selected);
              exitSelection();
            }}
          />
        ) : (
          <ThreadHeader thread={thread} onBack={onBack} onOptions={() => setOptionsOpen(true)} />
        )}

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <Text style={[styles.emptyNote, { color: theme.textSecondary }]}>
              No messages yet — say hello to {threadTitle(thread)}.
            </Text>
          ) : null}

          {days.map((day) => (
            <View key={day.key} style={styles.day}>
              <View style={[styles.dayPill, { backgroundColor: theme.background }]}>
                <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>{day.label}</Text>
              </View>

              {day.items.map((m, i) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  previous={day.items[i - 1]}
                  index={i}
                  isGroup={isGroup}
                  replyTarget={m.replyTo ? byId.get(m.replyTo) : undefined}
                  selectionMode={selecting}
                  selected={selected.includes(m.id)}
                  canPost={canPost}
                  onPress={() => handleBubblePress(m)}
                  onLongPress={() => handleBubbleLongPress(m)}
                  onReply={() => startReply(m.id)}
                  onToggleReaction={(emoji) => onToggleReaction(m.id, emoji)}
                />
              ))}
            </View>
          ))}

          {typingId ? (
            <View style={styles.typingRow}>
              <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.border }]} />
                <View style={[styles.typingDot, { backgroundColor: theme.border }]} />
              </View>
              {isGroup ? (
                <Text style={[styles.typingLabel, { color: theme.textSecondary }]}>{firstName(typingId)} is typing</Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        {selecting ? null : (
          <Composer
            draft={draft}
            onChangeDraft={setDraft}
            onSend={handleSend}
            recipientName={isGroup ? (thread.name ?? 'the group') : firstName(thread.memberIds[0])}
            replyTo={replyTo}
            onCancelReply={() => setReplyToId(null)}
            canPost={canPost}
          />
        )}

        <ThreadActionsSheet
          thread={optionsOpen ? thread : null}
          unread={unread}
          showOpen={false}
          onClose={() => setOptionsOpen(false)}
          onOpen={() => setOptionsOpen(false)}
          onSetRead={(read) => {
            onSetRead(read);
            setOptionsOpen(false);
            // Flagging the thread unread only means anything back on the list.
            if (!read) onBack();
          }}
          onTogglePin={() => {
            onSetFlag('pinned', !thread.pinned);
            setOptionsOpen(false);
          }}
          onToggleMute={() => {
            onSetFlag('muted', !thread.muted);
            setOptionsOpen(false);
          }}
          onDelete={() => {
            setOptionsOpen(false);
            onDeleteThread();
          }}
        />

        <MessageActionsSheet
          message={sheetMessage}
          thread={thread}
          canPost={canPost}
          onClose={() => setSheetTarget(null)}
          onReact={(emoji) => {
            if (sheetMessage) onToggleReaction(sheetMessage.id, emoji);
            setSheetTarget(null);
          }}
          onReply={() => sheetMessage && startReply(sheetMessage.id)}
          onReplyPrivately={() => {
            if (sheetMessage) onReplyPrivately(sheetMessage.authorId);
            setSheetTarget(null);
          }}
          onCopy={() => {
            if (sheetMessage) void copyToClipboard([sheetMessage]);
            setSheetTarget(null);
          }}
          onSelect={() => {
            if (sheetMessage) {
              setSelecting(true);
              setSelected([sheetMessage.id]);
            }
            setSheetTarget(null);
          }}
          onDelete={() => {
            if (sheetMessage) onDeleteMessages([sheetMessage.id]);
            setSheetTarget(null);
          }}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  messages: {
    padding: 18,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  day: {
    gap: 6,
  },
  dayPill: {
    alignSelf: 'center',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  dayLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.14 * 10,
    textTransform: 'uppercase',
  },
  emptyNote: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    gap: 5,
    borderRadius: 16,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
  },
  typingLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.1 * 10,
    textTransform: 'uppercase',
  },
});
