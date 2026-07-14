import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { PlayHud } from '../src/components/PlayHud';
import { SessionSummary } from '../src/components/SessionSummary';
import { useSettings } from '../src/settings/SettingsContext';
import { DIFFICULTY_META } from '../src/settings/types';

const DOT = 30;
/** Cat-paw sized hit circle around the visible laser */
const HIT = 78;

export default function LaserScreen() {
  useKeepAwake();
  const { width, height } = useWindowDimensions();
  const { settings, setSoundEnabled, recordSession } = useSettings();
  const difficulty = DIFFICULTY_META[settings.difficulty];

  const x = useSharedValue(width * 0.5 - DOT / 2);
  const y = useSharedValue(height * 0.45 - DOT / 2);
  const steering = useSharedValue(0);
  const autoAngle = useSharedValue(0);
  const glow = useSharedValue(1);
  const frozen = useSharedValue(0);

  const [paused, setPaused] = useState(false);
  const [sessionOver, setSessionOver] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [hits, setHits] = useState(0);
  const recordedRef = useRef(false);
  const pausedRef = useRef(false);
  const sessionOverRef = useRef(false);
  pausedRef.current = paused;
  sessionOverRef.current = sessionOver;

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
      recordSession();
    }
  }, [sessionOver, recordSession]);

  const speedSv = useSharedValue(difficulty.speed);
  useEffect(() => {
    speedSv.value = difficulty.speed;
  }, [difficulty.speed, speedSv]);

  useFrameCallback(() => {
    'worklet';
    if (frozen.value > 0) return;
    if (steering.value > 0) return;
    autoAngle.value += 0.016 * 0.55 * speedSv.value;
    const cx = width * 0.5 - DOT / 2;
    const cy = height * 0.48 - DOT / 2;
    // Wide Lissajous path — keeps the laser near edges without leaving the playfield.
    const rx = width * 0.42;
    const ry = height * 0.34;
    x.value = cx + Math.cos(autoAngle.value) * rx + Math.sin(autoAngle.value * 0.37) * width * 0.06;
    y.value = cy + Math.sin(autoAngle.value * 1.15) * ry + Math.cos(autoAngle.value * 0.55) * height * 0.05;
  });

  const registerHit = useCallback(() => {
    if (pausedRef.current || sessionOverRef.current) return;
    setHits((h) => h + 1);
    glow.value = withSequence(
      withTiming(1.8, { duration: 70 }),
      withTiming(1, { duration: 160 }),
    );
    if (settings.hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [settings.hapticsEnabled, glow]);

  const moveTo = (px: number, py: number) => {
    'worklet';
    x.value = px - DOT / 2;
    y.value = py - DOT / 2;
  };

  // Owner steers by dragging on empty playfield (does not count as a catch).
  const steerPan = Gesture.Pan()
    .onBegin((e) => {
      steering.value = 1;
      moveTo(e.x, e.y);
    })
    .onUpdate((e) => {
      moveTo(e.x, e.y);
    })
    .onFinalize(() => {
      steering.value = 0;
    });

  // Drag starting on the laser also steers (owner), but only after movement.
  const laserSteer = Gesture.Pan()
    .minDistance(10)
    .onBegin(() => {
      steering.value = 1;
    })
    .onUpdate((e) => {
      moveTo(e.x, e.y);
    })
    .onFinalize(() => {
      steering.value = 0;
    });

  // Cat catch: a tap on the laser hit area (not a drag).
  const laserTap = Gesture.Tap()
    .maxDuration(450)
    .maxDistance(14)
    .onEnd((_e, success) => {
      if (!success) return;
      if (steering.value > 0) return;
      runOnJS(registerHit)();
    });

  const laserGesture = Gesture.Exclusive(laserSteer, laserTap);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: glow.value },
    ],
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + DOT / 2 - 28 },
      { translateY: y.value + DOT / 2 - 28 },
      { scale: glow.value },
    ],
    opacity: 0.32,
  }));

  const hitStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + DOT / 2 - HIT / 2 },
      { translateY: y.value + DOT / 2 - HIT / 2 },
    ],
  }));

  const exitHome = () => {
    if (!recordedRef.current) {
      recordedRef.current = true;
      recordSession();
    }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={styles.bg} />

      {/* Full-screen steer layer (owner) */}
      <GestureDetector gesture={steerPan}>
        <View style={styles.playfield} />
      </GestureDetector>

      {/* Soft bloom (visual only) */}
      <Animated.View pointerEvents="none" style={[styles.bloom, bloomStyle]} />

      {/* Cat hit target + owner drag-from-laser */}
      <GestureDetector gesture={laserGesture}>
        <Animated.View style={[styles.hit, hitStyle]} accessibilityLabel="Laser target" />
      </GestureDetector>

      {/* Visible laser dot */}
      <Animated.View pointerEvents="none" style={[styles.dot, dotStyle]} />

      <PlayHud
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
        <Text style={styles.hint} pointerEvents="none">
          Drag to steer - cat scores by tapping the laser
        </Text>
      ) : null}

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
          title="Time for a break"
          subtitle="Short sessions keep play fresh."
          onPlayAgain={() => {
            recordedRef.current = false;
            setHits(0);
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
  playfield: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  bloom: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF4040',
    zIndex: 1,
  },
  hit: {
    position: 'absolute',
    width: HIT,
    height: HIT,
    borderRadius: HIT / 2,
    zIndex: 3,
    // Keep hit zone invisible but touchable
    backgroundColor: 'transparent',
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    backgroundColor: '#FF2E2E',
    zIndex: 2,
  },
  hint: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    zIndex: 20,
    textAlign: 'center',
    paddingHorizontal: 24,
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
  pauseTitle: { color: '#fff', fontSize: 36, fontWeight: '800' },
  pauseHint: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
});
