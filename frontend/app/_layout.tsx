import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      const hasSession = !!data.session;
      if (hasSession) {
        router.replace('/(tabs)');
      }
    });

    // Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="test-home" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="understand" />
        <Stack.Screen name="ask-suggest" />
        <Stack.Screen name="track-progress" />
        <Stack.Screen name="ask-ai" />
        <Stack.Screen name="quick-action" />
      </Stack>
    </>
  );
}