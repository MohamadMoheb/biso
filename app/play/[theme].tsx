import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { Creature } from '../../src/components/Creature';
import { ThemeBackground } from '../../src/components/ThemeBackground';
import { usePopSound } from '../../src/hooks/usePopSound';
import { useSpawner } from '../../src/hooks/useSpawner';
import { isThemeId, THEMES } from '../../src/themes';

export default function PlayScreen() {
  useKeepAwake();

  const { theme: themeParam } = useLocalSearchParams<{ theme: string }>();
  const valid = isThemeId(themeParam);
  const theme = valid ? THEMES[themeParam] : null;

  const { width, height } = useWindowDimensions();
  const { creatures, removeCreature } = useSpawner(theme, valid, width, height);
  const { playPop } = usePopSound();

  useEffect(() => {
    if (!valid) {
      router.replace('/');
    }
  }, [valid]);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme?.gradient[0] ?? '#000000');
    return () => {
      void SystemUI.setBackgroundColorAsync('#F7F2E8');
    };
  }, [theme]);

  const onCatch = useCallback(
    (id: string) => {
      void playPop();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      removeCreature(id);
    },
    [playPop, removeCreature],
  );

  const onExit = useCallback(
    (id: string) => {
      removeCreature(id);
    },
    [removeCreature],
  );

  if (!theme) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <ThemeBackground theme={theme} />

      <View style={styles.game} collapsable={false}>
        {creatures.map((creature) => (
          <Creature
            key={creature.id}
            creature={creature}
            onCatch={onCatch}
            onExit={onExit}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.back}
        hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        accessibilityRole="button"
        accessibilityLabel="Back to menu"
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  game: {
    ...StyleSheet.absoluteFill,
  },
  back: {
    position: 'absolute',
    top: 48,
    left: 18,
    padding: 8,
    opacity: 0.28,
    zIndex: 20,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
});
