import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { useAuth } from '@/auth/auth-context';
import { tabLayoutFor } from '@/auth/tab-layout';
import { useTheme } from '@/theme/theme-provider';
import { fontFamily, radii } from '@/theme';
import {
  BillingIcon,
  ChatIcon,
  DashboardIcon,
  FinanceIcon,
  InventoryIcon,
  MarketingIcon,
  MoreIcon,
  OrdersIcon,
  ProductionIcon,
  TasksIcon,
  type NavIconProps,
} from '@/components/ui/icon';

// Rendered via `Tabs`' `tabBar` prop, which replaces React Navigation's
// default bar entirely (unlike `layout`, which wraps the whole navigator
// output — content AND the default bar — and left both stacked on screen).
//
// The navigator declares every screen that could be somebody's tab; this bar
// decides which of them that person actually sees, and in what order, from
// `tabLayoutFor(positionId)`. A screen with no button is still reachable (from
// More or a dashboard card) — it just isn't one of your five.

export type CustomTabBarProps = BottomTabBarProps;

const TAB_ICONS: Record<string, (props: NavIconProps) => React.JSX.Element> = {
  index: DashboardIcon,
  chat: ChatIcon,
  tasks: TasksIcon,
  inventory: InventoryIcon,
  finance: FinanceIcon,
  production: ProductionIcon,
  'order-management': OrdersIcon,
  billing: BillingIcon,
  marketing: MarketingIcon,
  more: MoreIcon,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Dashboard',
  chat: 'Chat',
  tasks: 'Tasks',
  inventory: 'Inventory',
  finance: 'Finance',
  production: 'Production',
  'order-management': 'Orders',
  billing: 'Billing',
  marketing: 'Marketing',
  more: 'More',
};

export function CustomTabBar({ state, navigation, insets }: CustomTabBarProps) {
  const theme = useTheme();
  const { canView, profile, role } = useAuth();

  const activeName = state.routes[state.index]?.name;

  // The layout names the slots; `canView` decides which survive; the navigator
  // supplies the route key to navigate to. A slot whose screen isn't declared
  // (or isn't permitted) simply drops out, and the bar closes up around it.
  const slots = tabLayoutFor(profile?.positionId, role)
    .filter((slot) => canView(slot.section))
    .map((slot) => ({ ...slot, route: state.routes.find((r) => r.name === slot.name) }))
    .filter((slot): slot is typeof slot & { route: NonNullable<typeof slot.route> } => !!slot.route);

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
      {slots.map(({ name, route }) => {
        const isFocused = name === activeName;
        // Chat is the team's main channel and sits in the middle of every
        // layout, so it reads as the primary action rather than one of five
        // equals — filled pill, accent ground, always.
        const isChat = name === 'chat';
        const IconComponent = TAB_ICONS[name] ?? MoreIcon;
        const label = TAB_LABELS[name] ?? name;
        const color = isChat
          ? theme.accentText
          : isFocused
            ? theme.accentWashText
            : theme.textSecondary;

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
            style={({ pressed }) => [
              styles.cell,
              isChat && [styles.chatCell, { backgroundColor: theme.accent }],
              !isChat && isFocused && { backgroundColor: theme.accentWash },
              pressed && styles.pressed,
            ]}
          >
            <IconComponent size={isChat ? 23 : 22} color={color} />
            <Text
              style={[
                styles.label,
                { color, fontFamily: isFocused || isChat ? fontFamily.semibold : fontFamily.medium },
              ]}
            >
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
    alignItems: 'flex-end',
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
  chatCell: {
    paddingVertical: 10,
    borderRadius: radii.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 10.5,
  },
});
