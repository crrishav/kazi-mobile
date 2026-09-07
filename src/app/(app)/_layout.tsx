import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';

// The More-hub modules that are nobody's tab push as siblings of (tabs) here
// — native slide-from-right, tab bar hidden while one is open (primary
// destinations, not utility sheets). Production, Billing, Marketing and Chat
// live *inside* (tabs) because each is somebody's bottom-bar slot; for
// everyone else they behave like these pushed screens, folding the bar away
// and showing a back chevron (see `useIsOwnTab`).
export default function AppLayout() {
  const theme = useTheme();
  return (
    // contentStyle sets the card background so the slide transition doesn't
    // flash white behind screens before their own background paints.
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.background },
        // Stated rather than left to `default`, which is the platform's own
        // choice and differs by Android version — a module pushed from More
        // should travel the same way on every device. Resolves to the native
        // push on iOS, which is already this animation.
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="account" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="sales" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="purchases" />
      <Stack.Screen name="accounting" />
      <Stack.Screen name="budget-requirements" />
      <Stack.Screen name="employees-hr" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="admin-panel" />
      <Stack.Screen name="changelog" />
      <Stack.Screen name="bug-report" />
      {/* Legacy path kept alive for deep links already stored in Postgres. */}
      <Stack.Screen name="order-management" />
    </Stack>
  );
}
