import 'react-native-gesture-handler';

import { loadAsync } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { preloadSounds } from '../src/audio/preloadSounds';
import { prefetchBackgroundTiles } from '../src/components/ThemeBackground';
import { SettingsProvider } from '../src/settings/SettingsContext';

export default function RootLayout() {
  useEffect(() => {
    void loadAsync({
      Ionicons: require('@react-native-vector-icons/ionicons/fonts/Ionicons.ttf'),
    }).catch(() => undefined);

    preloadSounds();
    prefetchBackgroundTiles();
  }, []);

  return (
    <SettingsProvider>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          orientation: 'portrait',
          contentStyle: { backgroundColor: '#06080A' },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="play/[theme]" options={{ gestureEnabled: false }} />
        <Stack.Screen name="laser" options={{ gestureEnabled: false }} />
        <Stack.Screen name="settings" />
      </Stack>
    </SettingsProvider>
  );
}
