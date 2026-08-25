import { Tabs } from 'expo-router/js-tabs';

import { CustomTabBar } from '@/components/tab-bar/custom-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
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
