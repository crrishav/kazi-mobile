import { Tabs } from 'expo-router';

import { CustomTabBarLayout } from '@/components/tab-bar/custom-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      layout={({ state, navigation, children }) => (
        <CustomTabBarLayout state={state} navigation={navigation}>
          {children}
        </CustomTabBarLayout>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="finance" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
