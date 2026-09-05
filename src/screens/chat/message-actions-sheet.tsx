import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { ME, QUICK_REACTIONS, type Message, type Thread } from '@/data/chat/types';
import { messageText, messageTimestamp, personFor, reactionCount } from '@/data/chat/utils';

import { ActionRow } from './action-row';

export interface MessageActionsSheetProps {
  /** The long-pressed message; null closes the sheet. */
  message: Message | null;
  thread: Thread;
  canPost: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  /** Groups only — opens (or starts) a dm with this message's author. */
  onReplyPrivately: () => void;
  onCopy: () => void;
  onSelect: () => void;
  onDelete: () => void;
}

export function MessageActionsSheet({
  message,
  thread,
  canPost,
  onClose,
  onReact,
  onReply,
  onReplyPrivately,
  onCopy,
  onSelect,
  onDelete,
}: MessageActionsSheetProps) {
  const theme = useTheme();

  const mine = message?.authorId === ME;
  const author = message ? personFor(message.authorId) : null;
  const canDelete = !!message && mine && !message.deleted;
  const reactable = !!message && canPost && !message.deleted;

  return (
    <BottomSheet visible={!!message} onClose={onClose} title="Message" maxHeight={560}>
      {message ? (
        <>
          <View style={[styles.preview, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.previewFrom, { color: theme.textSecondary }]} numberOfLines={1}>
              {mine ? 'You' : author?.name} · {messageTimestamp(message)}
              {mine && !message.deleted ? ` · ${message.read ? 'Read' : 'Sent'}` : ''}
              {reactionCount(message) > 0 ? ` · ${reactionCount(message)} reactions` : ''}
            </Text>
            <Text style={[styles.previewBody, { color: theme.textPrimary }]} numberOfLines={4}>
              {messageText(message)}
            </Text>
          </View>

          {reactable ? (
            <View style={styles.emojiRow}>
              {QUICK_REACTIONS.map((emoji) => {
                const active = message.reactions.some((r) => r.emoji === emoji && r.by.includes(ME));
                return (
                  <Pressable
                    key={emoji}
                    onPress={() => onReact(emoji)}
                    style={[
                      styles.emojiButton,
                      {
                        backgroundColor: active ? theme.accentWash : theme.surface,
                        borderColor: active ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View style={styles.actions}>
            {canPost && !message.deleted ? <ActionRow icon="corner-up-left" label="Reply" detail="Or swipe the message right" onPress={onReply} /> : null}
            {canPost && thread.kind === 'group' && !mine ? (
              <ActionRow icon="user" label={`Reply privately to ${author?.name.split(' ')[0]}`} detail="Opens a direct message" onPress={onReplyPrivately} />
            ) : null}
            {!message.deleted ? <ActionRow icon="copy" label="Copy text" onPress={onCopy} /> : null}
            <ActionRow icon="check-circle" label="Select messages" detail="Copy or delete several at once" onPress={onSelect} />
            {canDelete ? <ActionRow icon="trash-2" label="Delete message" destructive onPress={onDelete} /> : null}
          </View>
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    gap: 5,
  },
  previewFrom: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.08 * 10,
    textTransform: 'uppercase',
  },
  previewBody: {
    fontSize: 14,
    lineHeight: 14 * 1.45,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  emojiButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 22,
  },
  actions: {
    gap: 2,
  },
});
