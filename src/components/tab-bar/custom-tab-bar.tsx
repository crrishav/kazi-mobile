import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii } from '@/theme';
import { DashboardIcon, FinanceIcon, InventoryIcon, MoreIcon, TasksIcon, type NavIconProps } from '@/components/ui/icon';

// expo-router's `Tabs` has no `tabBar` render prop (verified against the
// installed version's types) — bespoke tab bar UI is built via its `layout`
// prop instead, which hands us {state, navigation, children} and expects the
// screen content composed alongside our own bar.

interface TabBarRoute {
  key: string;
  name: string;
}

interface TabBarState {
  index: number;
  routes: TabBarRoute[];
}

interface TabBarNavigation {
  // React Navigation's real `emit`/`navigate` types are deeply generic over
  // the app's full route map; we only ever call them with a plain object and
  // a route name, so a loose structural type is safer here than fighting
  // those generics for an internal-only component.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (event: any) => { defaultPrevented?: boolean };
  navigate: (name: string) => void;
}

export interface CustomTabBarLayoutProps {
  state: TabBarState;
  navigation: TabBarNavigation;
  children: ReactNode;
}

const TAB_ICONS: Record<string, (props: NavIconProps) => React.JSX.Element> = {
  index: DashboardIcon,
  tasks: TasksIcon,
  inventory: InventoryIcon,
  finance: FinanceIcon,
  more: MoreIcon,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Dashboard',
  tasks: 'Tasks',
  inventory: 'Inventory',
  finance: 'Finance',
  more: 'More',
};

export function CustomTabBarLayout({ state, navigation, children }: CustomTabBarLayoutProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={styles.content}>{children}</View>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + 10,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const IconComponent = TAB_ICONS[route.name] ?? MoreIcon;
          const label = TAB_LABELS[route.name] ?? route.name;
          const color = isFocused ? theme.accentWashText : theme.textSecondary;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              style={[styles.cell, isFocused && { backgroundColor: theme.accentWash }]}
            >
              <IconComponent size={22} color={color} />
              <Text style={[styles.label, { color, fontFamily: isFocused ? fontFamily.semibold : fontFamily.medium }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  label: {
    fontSize: 10.5,
  },
});
