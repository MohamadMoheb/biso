import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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
import { CatCam } from '../src/components/CatCam';
import { CatCamGallery } from '../src/components/CatCamGallery';
import { SessionSummary } from '../src/components/SessionSummary';
import { LaserBackground } from '../src/components/ThemeBackground';
import { useSafeKeepAwake } from '../src/hooks/useSafeKeepAwake';
import { useLaserSounds } from '../src/hooks/useLaserSounds';
import { useSettings } from '../src/settings/SettingsContext';
import { DIFFICULTY_META } from '../src/settings/types';

export default function LaserScreen() {
  useSafeKeepAwake('biso-laser');
  const { width, height } = useWindowDimensions();
  const { settings, setSoundEnabled, recordSession } = useSettings();
  const difficulty = DIFFICULTY_META[settings.difficulty];
  /** Visible laser size + cat-paw hit circle — scale with the shorter edge. */
  const DOT_SZ = Math.max(26, Math.min(36, Math.round(Math.min(width, height) * 0.075)));
  const HIT = Math.max(70, Math.min(100, Math.round(Math.min(width, height) * 0.2)));
  const BLOOM = Math.round(DOT_SZ * 1.85);

  const x = useSharedValue(width * 0.5 - DOT_SZ / 2);
  const y = useSharedValue(height * 0.45 - DOT_SZ / 2);
  const steering = useSharedValue(0);
  // Heading + wobble phase for free wander (always continues from current spot).
  const heading = useSharedValue(0.6);
  const wanderT = useSharedValue(0);
  const glow = useSharedValue(1);
  const frozen = useSharedValue(0);

  const [paused, setPaused] = useState(false);
  const [sessionOver, setSessionOver] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [hits, setHits] = useState(0);
  const [snapCount, setSnapCount] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const recordedRef = useRef(false);
  const pausedRef = useRef(false);
  const sessionOverRef = useRef(false);
  pausedRef.current = paused;
  sessionOverRef.current = sessionOver;

  const laserSounds = useLaserSounds(settings.soundEnabled, {
    zapping: !paused && !sessionOver,
    pace: difficulty.speed,
  });
  const laserSoundsRef = useRef(laserSounds);
  laserSoundsRef.current = laserSounds;

  useEffect(() => {
    frozen.value = paused || sessionOver ? 1 : 0;
  }, [paused, sessionOver, frozen]);

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

  const clampPos = (px: number, py: number) => {
    'worklet';
    const margin = 10;
    return {
      nx: Math.min(Math.max(px, margin), width - DOT_SZ - margin),
      ny: Math.min(Math.max(py, margin), height - DOT_SZ - margin),
    };
  };

  useFrameCallback(() => {
    'worklet';
    if (frozen.value > 0) return;
    if (steering.value > 0) return;

    const pace = 0.28 + 0.95 * speedSv.value;
    wanderT.value += 0.016 * pace;
    // Gentle heading drift so the path feels alive without locking to one corner.
    heading.value +=
      (Math.sin(wanderT.value * 0.9) * 0.55 + Math.sin(wanderT.value * 2.3) * 0.25) * 0.016 * pace;

    const step = (2.8 + 7.5 * pace) * (0.85 + 0.15 * Math.sin(wanderT.value * 1.7));
    const dx = Math.cos(heading.value) * step;
    const dy = Math.sin(heading.value) * step * (height / Math.max(width, 1));

    let nx = x.value + dx;
    let ny = y.value + dy;
    const margin = 10;
    const minX = margin;
    const maxX = width - DOT_SZ - margin;
    const minY = margin;
    const maxY = height - DOT_SZ - margin;

    // Bounce off edges so the laser keeps covering the whole playfield.
    if (nx < minX || nx > maxX) {
      heading.value = Math.PI - heading.value;
      nx = Math.min(Math.max(nx, minX), maxX);
    }
    if (ny < minY || ny > maxY) {
      heading.value = -heading.value;
      ny = Math.min(Math.max(ny, minY), maxY);
    }

    x.value = nx;
    y.value = ny;
  });

  const registerHit = useCallback(() => {
    if (pausedRef.current || sessionOverRef.current) return;
    setHits((h) => h + 1);
    glow.value = withSequence(
      withTiming(1.8, { duration: 70 }),
      withTiming(1, { duration: 160 }),
    );
    laserSoundsRef.current.playHit();
    if (settings.hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [settings.hapticsEnabled, glow]);

  const moveTo = (px: number, py: number) => {
    'worklet';
    const { nx, ny } = clampPos(px - DOT_SZ / 2, py - DOT_SZ / 2);
    x.value = nx;
    y.value = ny;
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

  // Drag starting on the laser also steers (owner). Use absolute coords —
  // e.x/e.y are local to the hit target and would pin the dot near the corner.
  const laserSteer = Gesture.Pan()
    .minDistance(10)
    .onBegin(() => {
      steering.value = 1;
    })
    .onUpdate((e) => {
      moveTo(e.absoluteX, e.absoluteY);
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
      { translateX: x.value + DOT_SZ / 2 - BLOOM / 2 },
      { translateY: y.value + DOT_SZ / 2 - BLOOM / 2 },
      { scale: glow.value },
    ],
    opacity: 0.32,
  }));

  const hitStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + DOT_SZ / 2 - HIT / 2 },
      { translateY: y.value + DOT_SZ / 2 - HIT / 2 },
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
      <LaserBackground lite />

      {/* Full-screen steer layer (owner) */}
      <GestureDetector gesture={steerPan}>
        <View style={styles.playfield} />
      </GestureDetector>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.bloom,
          bloomStyle,
          { width: BLOOM, height: BLOOM, borderRadius: BLOOM / 2 },
        ]}
      />

      {/* Cat hit target + owner drag-from-laser */}
      <GestureDetector gesture={laserGesture}>
        <Animated.View
          style={[styles.hit, hitStyle, { width: HIT, height: HIT, borderRadius: HIT / 2 }]}
          accessibilityLabel="Laser target"
        />
      </GestureDetector>

      {/* Visible laser dot */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.dot,
          dotStyle,
          { width: DOT_SZ, height: DOT_SZ, borderRadius: DOT_SZ / 2 },
        ]}
      />

      {settings.catCamEnabled ? (
        <CatCam
          enabled={!sessionOver}
          paused={paused || sessionOver}
          mode="laser"
          onSnap={() => setSnapCount((c) => c + 1)}
        />
      ) : null}

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
          scoreLabel={hits === 1 ? '1 catch' : `${hits} catches`}
          snapCount={snapCount}
          onViewSnaps={() => setGalleryOpen(true)}
          onPlayAgain={() => {
            recordedRef.current = false;
            setHits(0);
            setSnapCount(0);
            setElapsedSec(0);
            setSessionOver(false);
            setPaused(false);
          }}
          onHome={exitHome}
        />
      ) : null}

      <CatCamGallery visible={galleryOpen} onClose={() => setGalleryOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1C1814' },
  playfield: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  bloom: {
    position: 'absolute',
    backgroundColor: '#FF4040',
    zIndex: 1,
  },
  hit: {
    position: 'absolute',
    zIndex: 3,
    // Keep hit zone invisible but touchable
    backgroundColor: 'transparent',
  },
  dot: {
    position: 'absolute',
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
