import { Tabs } from 'expo-router/js-tabs';

import { CustomTabBar } from '@/components/tab-bar/custom-tab-bar';
import { useTheme } from '@/theme/theme-provider';

/**
 * Every screen that is somebody's tab is declared here — the bar itself picks
 * that person's five out of the list (see `auth/tab-layout.ts`). A screen with
 * no button for you is still routable: More and the dashboard cards link
 * straight to it, and because `(tabs)` is a route group the paths are unchanged
 * (`/order-management`, `/billing`, …), so every existing deep link still resolves.
 */
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.background } }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="finance" />
      <Tabs.Screen name="order-management" />
      <Tabs.Screen name="billing" />
      <Tabs.Screen name="marketing" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
