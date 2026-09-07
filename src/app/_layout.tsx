import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import {
  SchibstedGrotesk_400Regular,
  SchibstedGrotesk_500Medium,
  SchibstedGrotesk_600SemiBold,
  SchibstedGrotesk_700Bold,
} from '@expo-google-fonts/schibsted-grotesk';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { ToastProvider } from '@/components/toast/toast-provider';
import { NotificationsProvider } from '@/data/notifications/context';
import { AccountInactive } from '@/screens/account/account-inactive';
import { queryClient } from '@/data/client';
import { isSupabaseConfigured } from '@/lib/supabase';
import { CurrencyProvider } from '@/lib/currency-context';
import { ThemeProvider, useTheme } from '@/theme/theme-provider';

SplashScreen.preventAutoHideAsync();

if (__DEV__) {
  // Boot diagnostic: if this logs `false`, the `.env` was not picked up —
  // restart Metro with `npx expo start --clear`. When `true`, watch for
  // `[supabase] <module>: live read OK` / `... live read FAILED` lines.
  console.log('[supabase] isSupabaseConfigured =', isSupabaseConfigured);
}

function RootNavigator() {
  const { session, profile, isLoading } = useAuth();
  const theme = useTheme();

  // Follows the *resolved* theme rather than the OS: an explicit Light/Dark
  // choice in Settings can disagree with the phone, and `userInterfaceStyle:
  // "automatic"` alone would then leave dark clock glyphs on a dark bar.
  const statusBar = <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />;

  if (isLoading) return statusBar;

  // A signed-in user whose employee record was deactivated gets a dead end,
  // not the app (reference assigns them the `inactive` role).
  if (session && profile?.status === 'Inactive') {
    return (
      <>
        {statusBar}
        <AccountInactive />
      </>
    );
  }

  return (
    <>
      {statusBar}
      {/* Signing in and out swaps the whole app, so it cross-fades rather than
          pushing — there is no spatial relationship between the two halves. */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade',
          animationDuration: 260,
        }}
      >
        <Stack.Protected guard={!session}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <CurrencyProvider>
              <AuthProvider>
                <NotificationsProvider>
                  <ToastProvider>
                    <RootNavigator />
                  </ToastProvider>
                </NotificationsProvider>
              </AuthProvider>
            </CurrencyProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
