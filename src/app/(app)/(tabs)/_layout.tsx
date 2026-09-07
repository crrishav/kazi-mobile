import { Tabs } from 'expo-router/js-tabs';

import { CustomTabBar } from '@/components/tab-bar/custom-tab-bar';
import { tabSceneInterpolator } from '@/components/tab-bar/tab-scene-transition';
import { TabBarVisibilityProvider } from '@/components/tab-bar/tab-bar-visibility';
import { useTheme } from '@/theme/theme-provider';
import { tabTransitionSpec } from '@/theme/motion';

/**
 * Every screen that is somebody's tab is declared here — the bar itself picks
 * that person's five out of the list (see `auth/tab-layout.ts`). A screen with
 * no button for you is still routable: More and the dashboard cards link
 * straight to it, and because `(tabs)` is a route group the paths are unchanged
 * (`/production`, `/billing`, …). `/order-management` is kept as a redirect
 * for the deep links already written into old notification rows.
 *
 * The provider wraps the navigator so both the bar and the screens sit under
 * it: an open chat thread folds the bar away while it is on screen (see
 * `tab-bar-visibility.tsx`).
 */
export default function TabsLayout() {
  const theme = useTheme();
  return (
    <TabBarVisibilityProvider>
      <Tabs
        // Without this the tab router's default (`firstRoute`) sends every
        // system back press to the dashboard, from wherever you were — so a
        // module opened from More could only be left by leaving for `index`.
        // `history` makes back retrace the tabs actually visited, which is
        // what makes a module reached from More return *to* More.
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: theme.background },
          // Tab switches are otherwise a hard cut: `animation` defaults to
          // 'none'. Supplying an interpolator alone is not enough — the
          // navigator only animates when `animation` is set or a
          // `transitionSpec` is present, so both go together here.
          sceneStyleInterpolator: tabSceneInterpolator,
          transitionSpec: tabTransitionSpec,
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="chat" />
        <Tabs.Screen name="tasks" />
        <Tabs.Screen name="inventory" />
        <Tabs.Screen name="finance" />
        <Tabs.Screen name="production" />
        <Tabs.Screen name="billing" />
        <Tabs.Screen name="marketing" />
        <Tabs.Screen name="more" />
      </Tabs>
    </TabBarVisibilityProvider>
  );
}
