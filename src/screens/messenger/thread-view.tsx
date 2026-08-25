import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { Message, Person, ThreadMeta } from '@/data/messenger/types';

import { Composer } from './composer';
import { MessageBubble } from './message-bubble';
import { ThreadHeader } from './thread-header';
import { ThreadNotFound } from './thread-not-found';

export interface ThreadViewProps {
  thread: ThreadMeta;
  person: Person | null;
  messages: Message[];
  typing: boolean;
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
  onBack: () => void;
  onCompose: () => void;
}

export function ThreadView({ thread, person, messages, typing, draft, onChangeDraft, onSend, onBack, onCompose }: ThreadViewProps) {
  const theme = useTheme();

  if (thread.missing) {
    return (
      <Animated.View entering={FadeIn.duration(180)} style={styles.flex}>
        <ThreadHeader person={null} onBack={onBack} />
        <ThreadNotFound reference={thread.ref ?? ''} onBack={onBack} onCompose={onCompose} />
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.flex}>
      <ThreadHeader person={person} onBack={onBack} />

      <ScrollView contentContainerStyle={styles.messages}>
        <View style={[styles.dayPill, { backgroundColor: theme.background }]}>
          <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>Today</Text>
        </View>

        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} index={i} />
        ))}

        {typing ? (
          <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.typingDot, { backgroundColor: theme.textSecondary }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.border }]} />
            <View style={[styles.typingDot, { backgroundColor: theme.border }]} />
          </View>
        ) : null}
      </ScrollView>

      <Composer draft={draft} onChangeDraft={onChangeDraft} onSend={onSend} recipientName={person?.name.split(' ')[0] ?? ''} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  messages: {
    padding: 18,
    paddingTop: 16,
    gap: 10,
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
  typingBubble: {
    alignSelf: 'flex-start',
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
});
