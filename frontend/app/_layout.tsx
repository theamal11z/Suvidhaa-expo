import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { supabase } from '../lib/supabase';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [initialRouteHandled, setInitialRouteHandled] = useState(false);

  // Handle initial navigation logic
  useEffect(() => {
    if (!isNavigationReady || initialRouteHandled) return;

    const handleInitialNavigation = async () => {
      try {
        // Check if we're already on a specific route (like deep linking)
        const currentRoute = segments.join('/');
        if (currentRoute && !['', 'index'].includes(currentRoute)) {
          setInitialRouteHandled(true);
          return;
        }

        // Show splash screen first
        router.replace('/splash');
        
        // Add delay to show splash screen
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check onboarding status
        const onboarded = await AsyncStorage.getItem('suvidhaa-onboarding-complete');
        if (!onboarded) {
          router.replace('/onboarding');
        } else {
          // Check session
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            router.replace('/(tabs)');
          } else {
            router.replace('/login');
          }
        }
        
        setInitialRouteHandled(true);
      } catch (error) {
        console.error('Navigation error:', error);
        router.replace('/login');
        setInitialRouteHandled(true);
      }
    };

    handleInitialNavigation();
  }, [isNavigationReady, initialRouteHandled, router, segments]);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only handle auth changes after initial route is handled
      if (!initialRouteHandled) return;
      
      if (event === 'SIGNED_IN' && session) {
        router.replace('/(tabs)');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, initialRouteHandled]);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack 
        screenOptions={{ headerShown: false }}
        onReady={() => setIsNavigationReady(true)}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="email-verification" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="password-reset-sent" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="test-home" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="understand" />
        <Stack.Screen name="ask-suggest" />
        <Stack.Screen name="track-progress" />
        <Stack.Screen name="ask-ai" />
        <Stack.Screen name="quick-action" />
      </Stack>
    </SafeAreaProvider>
  );
}
