import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast/toast-provider';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';

export interface ComposerProps {
  draft: string;
  onChangeDraft: (text: string) => void;
  onSend: () => void;
  recipientName: string;
}

export function Composer({ draft, onChangeDraft, onSend, recipientName }: ComposerProps) {
  const theme = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const hasText = draft.trim().length > 0;

  return (
    <View style={[styles.row, { paddingBottom: insets.bottom + 12, borderTopColor: theme.border, backgroundColor: theme.surfaceRaised }]}>
      <Pressable
        onPress={() => toast.show({ message: "Attachments aren't available yet", tone: 'ok' })}
        style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Icon name="plus" size={18} color={theme.textPrimary} />
      </Pressable>

      <TextInput
        value={draft}
        onChangeText={onChangeDraft}
        placeholder={`Message ${recipientName}`}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="send"
        onSubmitEditing={onSend}
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1,
    fontSize: 15,
  },
});
