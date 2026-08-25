import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii } from '@/theme';
import { DashboardIcon, FinanceIcon, InventoryIcon, MoreIcon, TasksIcon, type NavIconProps } from '@/components/ui/icon';

// Rendered via `Tabs`' `tabBar` prop, which replaces React Navigation's
// default bar entirely (unlike `layout`, which wraps the whole navigator
// output — content AND the default bar — and left both stacked on screen).

export type CustomTabBarProps = BottomTabBarProps;

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

export function CustomTabBar({ state, navigation, insets }: CustomTabBarProps) {
  const theme = useTheme();

  return (
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
  );
}

const styles = StyleSheet.create({
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
