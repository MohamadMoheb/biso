import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CatCam } from '../../src/components/CatCam';
import { CatCamGallery } from '../../src/components/CatCamGallery';
import { Creature } from '../../src/components/Creature';
import { PlayHud } from '../../src/components/PlayHud';
import { SessionSummary } from '../../src/components/SessionSummary';
import { ThemeBackground } from '../../src/components/ThemeBackground';
import { useCreatureSounds } from '../../src/hooks/useCreatureSounds';
import { useSafeKeepAwake } from '../../src/hooks/useSafeKeepAwake';
import { useSpawner } from '../../src/hooks/useSpawner';
import { DIFFICULTY_META } from '../../src/settings/types';
import { useSettings } from '../../src/settings/SettingsContext';
import { isThemeId, THEMES } from '../../src/themes';

export default function PlayScreen() {
  useSafeKeepAwake('biso-creatures');
  const { settings, setSoundEnabled, recordSession } = useSettings();
  const difficulty = DIFFICULTY_META[settings.difficulty];

  const { theme: themeParam, count: countParam } = useLocalSearchParams<{
    theme: string;
    count?: string;
  }>();
  const valid = isThemeId(themeParam);
  const theme = valid ? THEMES[themeParam] : null;
  const parsedCount = Number.parseInt(
    Array.isArray(countParam) ? countParam[0] : (countParam ?? ''),
    10,
  );
  const maxOnScreen = Number.isFinite(parsedCount)
    ? Math.max(1, Math.min(24, parsedCount))
    : settings.creatureCount;

  const { width, height } = useWindowDimensions();
  const [paused, setPaused] = useState(false);
  const [sessionOver, setSessionOver] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const recordedRef = useRef(false);

  const muted = !settings.soundEnabled;
  const playActive = valid && !paused && !sessionOver;
  const { creatures, removeCreature } = useSpawner(
    theme,
    playActive,
    width,
    height,
    maxOnScreen,
    difficulty.sizeBoost,
    difficulty.speed,
  );
  const sounds = useCreatureSounds(settings.soundEnabled);
  const playPopRef = useRef(sounds.playPop);
  playPopRef.current = sounds.playPop;

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme?.gradient[1] ?? '#000000');
    return () => {
      void SystemUI.setBackgroundColorAsync('#06080A');
    };
  }, [theme]);

  useEffect(() => {
    if (paused || sessionOver) return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, sessionOver]);

  const sessionLimitSec = settings.sessionMinutes * 60;
  useEffect(() => {
    if (sessionLimitSec > 0 && elapsedSec >= sessionLimitSec && !sessionOver) {
      setSessionOver(true);
      setPaused(true);
    }
  }, [elapsedSec, sessionLimitSec, sessionOver]);

  useEffect(() => {
    if (sessionOver && !recordedRef.current) {
      recordedRef.current = true;
      recordSession();
    }
  }, [sessionOver, recordSession]);

  const onCatch = useCallback(
    (id: string) => {
      playPopRef.current();
      if (settings.hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      removeCreature(id);
    },
    [settings.hapticsEnabled, removeCreature],
  );

  const onExit = useCallback(
    (id: string) => {
      removeCreature(id);
    },
    [removeCreature],
  );

  const exitHome = useCallback(() => {
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordSession();
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [recordSession]);

  const playAgain = useCallback(() => {
    recordedRef.current = false;
    setElapsedSec(0);
    setSessionOver(false);
    setPaused(false);
  }, []);

  if (!valid || !theme) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.root}>
      <ThemeBackground theme={theme} />

      <View style={styles.game} collapsable={false}>
        {creatures.map((creature) => (
          <Creature
            key={creature.id}
            creature={creature}
            screenWidth={width}
            screenHeight={height}
            sounds={sounds}
            speedMultiplier={difficulty.speed}
            paused={paused || sessionOver}
            onCatch={onCatch}
            onExit={onExit}
          />
        ))}
      </View>

      <PlayHud
        elapsedSec={elapsedSec}
        muted={muted}
        paused={paused || sessionOver}
        onToggleMute={() => setSoundEnabled(!settings.soundEnabled)}
        onTogglePause={() => {
          if (sessionOver) return;
          setPaused((p) => !p);
        }}
        onExit={exitHome}
      />

      {paused && !sessionOver ? (
        <Pressable
          style={styles.pauseScrim}
          onLongPress={() => setPaused(false)}
          delayLongPress={700}
          accessibilityRole="button"
          accessibilityLabel="Resume play"
          accessibilityHint="Hold to resume"
        >
          <Text style={styles.pauseTitle}>Paused</Text>
          <Text style={styles.pauseHint}>Hold to resume</Text>
        </Pressable>
      ) : null}

      {sessionOver ? (
        <SessionSummary
          elapsedSec={elapsedSec}
          title="Time for a stretch"
          subtitle={theme.subtitle}
          onPlayAgain={playAgain}
          onHome={exitHome}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  game: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  pauseScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 45,
  },
  pauseTitle: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
  },
  pauseHint: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
});
