import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/auth-context';
import type { SectionId } from '@/auth/permissions';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily } from '@/theme';
import { MORE_MODULES } from '@/constants';

import { CurrencyToggle } from './currency-toggle';
import { ModuleCard } from './module-card';
import { RoleSwitcher } from './role-switcher';

export function More() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { canView } = useAuth();

  const modules = useMemo(() => MORE_MODULES.filter((m) => canView(m.id as SectionId)), [canView]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>More</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>{modules.length} modules</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <RoleSwitcher />
        <CurrencyToggle />
        <View style={styles.grid}>
          {modules.map((m) => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  content: {
    padding: 20,
    paddingBottom: 32,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
