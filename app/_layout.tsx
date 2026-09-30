import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import {
  NunitoSans_400Regular,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
  NunitoSans_900Black,
} from '@expo-google-fonts/nunito-sans';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { SessionProvider, useSession } from '../src/lib/session';
import { DemoSwitch } from '../src/features/DemoSwitch';
import { supabase } from '../src/lib/supabase';
import { color } from '../src/theme/tokens';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false } },
});

SplashScreen.preventAutoHideAsync().catch(() => {});

/** The demo switch when it applies, and the status-bar colour that goes with it. */
function TopBar() {
  const { data: demoLoaded } = useQuery({
    queryKey: ['demo_accounts_loaded'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.rpc('demo_accounts_loaded');
      return !!data;
    },
  });
  const { session } = useSession();
  const dark = !!demoLoaded && !!session;
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <DemoSwitch />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
    NunitoSans_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <TopBar />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.screenBg },
            }}
          />
        </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
