import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { PlayHud } from '../src/components/PlayHud';
import { SessionSummary } from '../src/components/SessionSummary';
import { useSettings } from '../src/settings/SettingsContext';
import { DIFFICULTY_META } from '../src/settings/types';

export default function LaserScreen() {
  useKeepAwake();
  const { width, height } = useWindowDimensions();
  const { settings, setSoundEnabled, recordSession } = useSettings();
  const difficulty = DIFFICULTY_META[settings.difficulty];

  const x = useSharedValue(width * 0.5);
  const y = useSharedValue(height * 0.45);
  const touching = useSharedValue(0);
  const autoAngle = useSharedValue(0);
  const glow = useSharedValue(1);
  const frozen = useSharedValue(0);

  const [paused, setPaused] = useState(false);
  const [sessionOver, setSessionOver] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [touches, setTouches] = useState(0);
  const recordedRef = useRef(false);

  useEffect(() => {
    frozen.value = paused || sessionOver ? 1 : 0;
  }, [paused, sessionOver, frozen]);

  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
      () => undefined,
    );
    return () => {
      void ScreenOrientation.unlockAsync().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    if (paused || sessionOver) return;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [paused, sessionOver]);

  const limit = settings.sessionMinutes * 60;
  useEffect(() => {
    if (limit > 0 && elapsedSec >= limit && !sessionOver) {
      setSessionOver(true);
      setPaused(true);
    }
  }, [elapsedSec, limit, sessionOver]);

  useEffect(() => {
    if (sessionOver && !recordedRef.current) {
      recordedRef.current = true;
      recordSession(touches, touches);
    }
  }, [sessionOver, touches, recordSession]);

  const speedSv = useSharedValue(difficulty.speed);
  useEffect(() => {
    speedSv.value = difficulty.speed;
  }, [difficulty.speed, speedSv]);

  useFrameCallback(() => {
    'worklet';
    if (frozen.value > 0) return;
    if (touching.value > 0) return;
    autoAngle.value += 0.016 * 0.55 * speedSv.value;
    const cx = width * 0.5;
    const cy = height * 0.48;
    x.value = cx + Math.cos(autoAngle.value) * width * 0.28;
    y.value = cy + Math.sin(autoAngle.value * 1.35) * height * 0.18;
  });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin((e) => {
      touching.value = 1;
      x.value = e.x - 14;
      y.value = e.y - 14;
      glow.value = withTiming(1.35, { duration: 80 });
      if (!paused && !sessionOver) setTouches((t) => t + 1);
    })
    .onChange((e) => {
      x.value = e.x - 14;
      y.value = e.y - 14;
    })
    .onFinalize(() => {
      touching.value = 0;
      glow.value = withTiming(1, { duration: 180 });
    });

  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: glow.value },
    ],
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - 14 },
      { translateY: y.value - 14 },
      { scale: glow.value * 2.2 },
    ],
    opacity: 0.35,
  }));

  const exitHome = () => {
    if (!recordedRef.current && touches > 0) {
      recordedRef.current = true;
      recordSession(touches, touches);
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={styles.bg} />
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.bloom, bloomStyle]} />
          <Animated.View style={[styles.dot, dotStyle]} />
        </View>
      </GestureDetector>

      <PlayHud
        catches={touches}
        streak={0}
        elapsedSec={elapsedSec}
        muted={!settings.soundEnabled}
        paused={paused || sessionOver}
        onToggleMute={() => setSoundEnabled(!settings.soundEnabled)}
        onTogglePause={() => {
          if (!sessionOver) setPaused((p) => !p);
        }}
        onExit={exitHome}
      />

      {!paused && !sessionOver ? (
        <Text style={styles.hint}>Drag for laser · auto-roams when idle</Text>
      ) : null}

      {paused && !sessionOver ? (
        <View style={styles.pauseScrim}>
          <Text style={styles.pauseTitle}>Paused</Text>
        </View>
      ) : null}

      {sessionOver ? (
        <SessionSummary
          catches={touches}
          bestStreak={touches}
          elapsedSec={elapsedSec}
          title="Laser done"
          subtitle="Eyes and whiskers earned a break."
          onPlayAgain={() => {
            recordedRef.current = false;
            setTouches(0);
            setElapsedSec(0);
            setSessionOver(false);
            setPaused(false);
          }}
          onHome={exitHome}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070B10' },
  bg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#0A1210',
  },
  bloom: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF4040',
  },
  dot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF2E2E',
  },
  hint: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    zIndex: 20,
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
  pauseTitle: { color: '#fff', fontSize: 36, fontWeight: '800' },
});
