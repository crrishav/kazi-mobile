import { Stack } from 'expo-router';

// The 15 "More"-hub modules push as siblings of (tabs) here — native
// slide-from-right, tab bar hidden while one is open (primary destinations,
// not utility sheets).
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sales" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="purchases" />
      <Stack.Screen name="production" />
      <Stack.Screen name="quality-control" />
      <Stack.Screen name="accounting" />
      <Stack.Screen name="budget-requirements" />
      <Stack.Screen name="employees-hr" />
      <Stack.Screen name="attendance" />
      <Stack.Screen name="marketing" />
      <Stack.Screen name="messenger" />
      <Stack.Screen name="directors" />
      <Stack.Screen name="admin-panel" />
      <Stack.Screen name="changelog" />
    </Stack>
  );
}
