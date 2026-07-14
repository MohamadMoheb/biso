import 'react-native-gesture-handler';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { SettingsProvider } from '../src/settings/SettingsContext';

export default function RootLayout() {
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
