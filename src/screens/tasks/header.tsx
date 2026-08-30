import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderAccount } from '@/components/ui/header-account';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';

export interface TasksHeaderProps {
  openCount: number;
}

export function TasksHeader({ openCount }: TasksHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { paddingTop: insets.top + 12, backgroundColor: theme.background }]}>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Tasks</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>{openCount} open · Line 3</Text>
      </View>
      <HeaderAccount />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  textWrap: {
    gap: 3,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: 26,
    letterSpacing: -0.025 * 26,
  },
  meta: {
    fontFamily: fontFamily.mono,
    fontSize: 10,
    letterSpacing: 0.12 * 10,
    textTransform: 'uppercase',
  },
});
