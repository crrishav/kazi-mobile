import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import type { Message } from '@/data/chat/types';

export interface MessageBubbleProps {
  message: Message;
  index: number;
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const theme = useTheme();
  const mine = message.from === 'me';

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 6) * 30).duration(200)}
      style={[styles.wrap, { alignItems: mine ? 'flex-end' : 'flex-start' }]}
    >
      <View
        style={[
          styles.bubble,
          mine
            ? { backgroundColor: theme.surfaceInverted, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 6, borderBottomLeftRadius: 16 }
            : {
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                borderBottomRightRadius: 16,
                borderBottomLeftRadius: 6,
              },
        ]}
      >
        <Text style={[styles.text, { color: mine ? theme.onDark.text : theme.textPrimary }]}>{message.text}</Text>
      </View>
      <Text style={[styles.meta, { color: theme.textSecondary }]}>{message.meta}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  bubble: {
    maxWidth: '80%',
    paddingVertical: 11,
    paddingHorizontal: 14,
    boxShadow: '0 1px 2px rgba(15,36,29,0.04)',
  },
  text: {
    fontSize: 14.5,
    lineHeight: 14.5 * 1.45,
  },
  meta: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    paddingHorizontal: 4,
  },
});
