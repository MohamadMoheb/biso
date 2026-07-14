import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Creature } from '../../src/components/Creature';
import { PlayHud } from '../../src/components/PlayHud';
import { SessionSummary } from '../../src/components/SessionSummary';
import { ThemeBackground } from '../../src/components/ThemeBackground';
import { useCreatureSounds } from '../../src/hooks/useCreatureSounds';
import { useSpawner } from '../../src/hooks/useSpawner';
import { DIFFICULTY_META } from '../../src/settings/types';
import { useSettings } from '../../src/settings/SettingsContext';
import { isThemeId, THEMES } from '../../src/themes';

export default function PlayScreen() {
  useKeepAwake();
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
  const [catches, setCatches] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const lastCatchAt = useRef(0);
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
  );
  const sounds = useCreatureSounds(settings.soundEnabled);

  useEffect(() => {
    if (!valid) router.replace('/');
  }, [valid]);

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
      () => undefined,
    );
    return () => {
      void ScreenOrientation.unlockAsync().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(theme?.gradient[0] ?? '#000000');
    return () => {
      void SystemUI.setBackgroundColorAsync('#F7F2E8');
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
      recordSession(catches, bestStreak);
    }
  }, [sessionOver, catches, bestStreak, recordSession]);

  const onCatch = useCallback(
    (id: string) => {
      sounds.playPop();
      if (settings.hapticsEnabled) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      const now = Date.now();
      const nextStreak = now - lastCatchAt.current < 3200 ? streak + 1 : 1;
      lastCatchAt.current = now;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setCatches((c) => c + 1);
      removeCreature(id);
    },
    [sounds, settings.hapticsEnabled, streak, removeCreature],
  );

  const onExit = useCallback(
    (id: string) => {
      removeCreature(id);
    },
    [removeCreature],
  );

  const exitHome = useCallback(() => {
    if (!recordedRef.current && catches > 0) {
      recordedRef.current = true;
      recordSession(catches, bestStreak);
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [catches, bestStreak, recordSession]);

  const playAgain = useCallback(() => {
    recordedRef.current = false;
    setCatches(0);
    setStreak(0);
    setBestStreak(0);
    setElapsedSec(0);
    setSessionOver(false);
    setPaused(false);
  }, []);

  const comboLabel = useMemo(() => {
    if (streak >= 8) return 'Legendary!';
    if (streak >= 5) return 'On fire!';
    if (streak >= 3) return 'Nice streak!';
    return null;
  }, [streak]);

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
        catches={catches}
        streak={streak}
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

      {comboLabel && !paused && !sessionOver ? (
        <View style={styles.combo} pointerEvents="none">
          <Text style={styles.comboText}>{comboLabel}</Text>
        </View>
      ) : null}

      {paused && !sessionOver ? (
        <View style={styles.pauseScrim}>
          <Text style={styles.pauseTitle}>Paused</Text>
          <Text style={styles.pauseHint}>Tap play to resume</Text>
        </View>
      ) : null}

      {sessionOver ? (
        <SessionSummary
          catches={catches}
          bestStreak={bestStreak}
          elapsedSec={elapsedSec}
          title="Time for a stretch"
          subtitle="Short play sessions are kinder for paws and eyes."
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
  combo: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 35,
  },
  comboText: {
    color: '#FFE08A',
    fontSize: 28,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 8,
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
    zIndex: 50,
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
