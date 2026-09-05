import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast/toast-provider';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { ME, type Message } from '@/data/chat/types';
import { firstName, messageText } from '@/data/chat/utils';

export interface ComposerProps {
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
  recipientName: string;
  /** The message being replied to, shown as a cancellable strip above the input. */
  replyTo: Message | null;
  onCancelReply: () => void;
  /** View-only profiles get a sentence instead of an input. */
  canPost: boolean;
}

export function Composer({ draft, onChangeDraft, onSend, recipientName, replyTo, onCancelReply, canPost }: ComposerProps) {
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const hasText = draft.trim().length > 0;

  // Swiping a message to reply should land you in the input, not leave you to
  // tap it yourself.
  useEffect(() => {
    if (replyTo) inputRef.current?.focus();
  }, [replyTo]);

  if (!canPost) {
    return (
      <View style={[styles.readOnly, { paddingBottom: insets.bottom + 14, borderTopColor: theme.border, backgroundColor: theme.surfaceRaised }]}>
        <Icon name="eye" size={15} color={theme.textSecondary} />
        <Text style={[styles.readOnlyText, { color: theme.textSecondary }]}>View only — you can’t post in this thread</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + 12, borderTopColor: theme.border, backgroundColor: theme.surfaceRaised }]}>
      {replyTo ? (
        <Animated.View
          entering={FadeInDown.duration(160)}
          exiting={FadeOutDown.duration(120)}
          style={[styles.replyStrip, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={[styles.replyBar, { backgroundColor: theme.accent }]} />
          <View style={styles.replyText}>
            <Text style={[styles.replyName, { color: theme.accentDeep }]} numberOfLines={1}>
              Replying to {replyTo.authorId === ME ? 'yourself' : firstName(replyTo.authorId)}
            </Text>
            <Text style={[styles.replyBody, { color: theme.textSecondary }]} numberOfLines={1}>
              {messageText(replyTo)}
            </Text>
          </View>
          <Pressable onPress={onCancelReply} hitSlop={10}>
            <Icon name="x" size={16} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>
      ) : null}

      <View style={styles.row}>
        <Pressable
          onPress={() => toast.show({ message: "Attachments aren't available yet", tone: 'ok' })}
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Icon name="plus" size={18} color={theme.textPrimary} />
        </Pressable>

        <TextInput
          ref={inputRef}
          value={draft}
          onChangeText={onChangeDraft}
          placeholder={replyTo ? 'Type your reply' : `Message ${recipientName}`}
          placeholderTextColor={theme.textSecondary}
          returnKeyType="send"
          multiline
          onSubmitEditing={onSend}
          blurOnSubmit={false}
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.textPrimary }]}
        />

        <Pressable
          onPress={onSend}
          disabled={!hasText}
          style={[styles.iconButton, { backgroundColor: hasText ? theme.accent : theme.surfaceRaised, borderColor: hasText ? theme.accent : theme.border }]}
        >
          <Icon name="send" size={17} color={hasText ? theme.accentText : theme.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 9,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  replyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  replyBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 99,
  },
  replyText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  replyName: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
  },
  replyBody: {
    fontSize: 12.5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 13,
    borderRadius: 15,
    borderWidth: 1,
    fontSize: 15,
  },
  readOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  readOnlyText: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
  },
});
