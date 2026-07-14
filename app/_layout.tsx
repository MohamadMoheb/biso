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
        }}
      />
    </SettingsProvider>
  );
}
