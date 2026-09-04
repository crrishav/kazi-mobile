import { Stack } from 'expo-router';

import { useTheme } from '@/theme/theme-provider';

// The More-hub modules that are nobody's tab push as siblings of (tabs) here
// — native slide-from-right, tab bar hidden while one is open (primary
// destinations, not utility sheets). Production, Orders, Billing, Marketing
// and Chat moved *into* (tabs) because each is somebody's bottom-bar slot;
// their paths did not change, since (tabs) is a route group.
export default function AppLayout() {
  const theme = useTheme();
  return (
    // contentStyle sets the card background so the slide transition doesn't
    // flash white behind screens before their own background paints.
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="account" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="sales" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="purchases" />
      <Stack.Screen name="quality-control" />
      <Stack.Screen name="accounting" />
      <Stack.Screen name="budget-requirements" />
      <Stack.Screen name="employees-hr" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="directors" />
      <Stack.Screen name="admin-panel" />
      <Stack.Screen name="changelog" />
      <Stack.Screen name="bug-report" />
    </Stack>
  );
}
