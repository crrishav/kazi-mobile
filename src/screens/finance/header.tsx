import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

export interface FinanceHeaderProps {
  title: string;
  subtitle: string;
  onBack?: () => void;
}

/** Shared top chrome for all three Finance views — overview shows an avatar, years/ledger show a back button. */
export function FinanceHeader({ title, subtitle, onBack }: FinanceHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + 12, backgroundColor: theme.background, borderBottomColor: theme.border, borderBottomWidth: onBack ? StyleSheet.hairlineWidth : 0 }]}>
      {onBack ? (
        <Pressable onPress={onBack} style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icon name="chevron-left" size={18} color={theme.textPrimary} />
        </Pressable>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.textPrimary, fontSize: onBack ? 18 : 26 }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {!onBack ? <Avatar initials="AK" tint="dark" size="lg" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontFamily: fontFamily.semibold,
    letterSpacing: -0.02 * 20,
  },
  subtitle: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.12 * 10,
    textTransform: 'uppercase',
  },
});
