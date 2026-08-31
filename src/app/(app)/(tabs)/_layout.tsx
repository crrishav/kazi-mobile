import { Tabs } from 'expo-router/js-tabs';

import { CustomTabBar } from '@/components/tab-bar/custom-tab-bar';
import { useTheme } from '@/theme/theme-provider';

export default function TabsLayout() {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.background } }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="finance" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
