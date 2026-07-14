import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { PlayHud } from '../src/components/PlayHud';
import { SessionSummary } from '../src/components/SessionSummary';
import { useSettings } from '../src/settings/SettingsContext';
import { DIFFICULTY_META } from '../src/settings/types';

const WAND_EMOJI = '🪶';

export default function WandScreen() {
  useKeepAwake();
  const { width, height } = useWindowDimensions();
  const { settings, setSoundEnabled, recordSession } = useSettings();
  const difficulty = DIFFICULTY_META[settings.difficulty];

  const targetX = useSharedValue(width * 0.5);
  const targetY = useSharedValue(height * 0.42);
  const x = useSharedValue(width * 0.5);
  const y = useSharedValue(height * 0.42);
  const touching = useSharedValue(0);
  const autoT = useSharedValue(0);
  const frozen = useSharedValue(0);
  const speedSv = useSharedValue(difficulty.speed);

  const [paused, setPaused] = useState(false);
  const [sessionOver, setSessionOver] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [swipes, setSwipes] = useState(0);
  const recordedRef = useRef(false);

  useEffect(() => {
    frozen.value = paused || sessionOver ? 1 : 0;
  }, [paused, sessionOver, frozen]);

  useEffect(() => {
    speedSv.value = difficulty.speed;
  }, [difficulty.speed, speedSv]);

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
      recordSession(swipes, swipes);
    }
  }, [sessionOver, swipes, recordSession]);

  useFrameCallback((frame) => {
    'worklet';
    if (frozen.value > 0) return;
    const dt = (frame.timeSincePreviousFrame ?? 16) / 1000;
    if (touching.value === 0) {
      autoT.value += dt * 0.7 * speedSv.value;
      targetX.value = width * 0.5 + Math.cos(autoT.value) * width * 0.26;
      targetY.value = height * 0.42 + Math.sin(autoT.value * 1.2) * height * 0.16;
    }
    const ease = 0.12 * speedSv.value;
    x.value += (targetX.value - x.value) * Math.min(0.35, ease);
    y.value += (targetY.value - y.value) * Math.min(0.35, ease);
  });

  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin((e) => {
      touching.value = 1;
      targetX.value = e.x;
      targetY.value = e.y;
      if (!paused && !sessionOver) setSwipes((s) => s + 1);
    })
    .onChange((e) => {
      targetX.value = e.x;
      targetY.value = e.y;
    })
    .onFinalize(() => {
      touching.value = 0;
      x.value = withSpring(x.value, { damping: 18, stiffness: 120 });
    });

  const featherStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - 48 }, { translateY: y.value - 48 }],
  }));

  const exitHome = () => {
    if (!recordedRef.current && swipes > 0) {
      recordedRef.current = true;
      recordSession(swipes, swipes);
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
          <Animated.Text style={[styles.feather, featherStyle]}>{WAND_EMOJI}</Animated.Text>
        </View>
      </GestureDetector>

      <PlayHud
        catches={swipes}
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
        <Text style={styles.hint}>Drag the feather, or let it float</Text>
      ) : null}

      {paused && !sessionOver ? (
        <Pressable
          style={styles.pauseScrim}
          onPress={() => setPaused(false)}
          accessibilityRole="button"
          accessibilityLabel="Resume play"
        >
          <Text style={styles.pauseTitle}>Paused</Text>
          <Text style={styles.pauseHint}>Tap anywhere to resume</Text>
        </Pressable>
      ) : null}

      {sessionOver ? (
        <SessionSummary
          catches={swipes}
          bestStreak={swipes}
          elapsedSec={elapsedSec}
          title="Wand rest"
          subtitle="A soft cooldown keeps curiosity sharp."
          onPlayAgain={() => {
            recordedRef.current = false;
            setSwipes(0);
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
  root: { flex: 1, backgroundColor: '#1A2420' },
  bg: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#24322C',
  },
  feather: {
    position: 'absolute',
    fontSize: 96,
    width: 96,
    height: 96,
    textAlign: 'center',
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
    zIndex: 45,
  },
  pauseTitle: { color: '#fff', fontSize: 36, fontWeight: '800' },
  pauseHint: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
});
