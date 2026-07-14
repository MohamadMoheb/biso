import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { saveCatSnap, type CatSnap } from '../catcam/storage';
import { useUiScale } from '../utils/layout';

export type CatCamProps = {
  enabled: boolean;
  paused: boolean;
  mode: CatSnap['mode'];
  onSnap?: (snap: CatSnap) => void;
};

const MIN_GAP_MS = 9000;
const MAX_GAP_MS = 22000;
const MAX_PER_SESSION = 6;

function nextGap() {
  return MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
}

/**
 * Front camera for surprise POV selfies during play (native only).
 * Sits tiny in a corner so gameplay stays clear; snaps at random intervals.
 */
export function CatCam({ enabled, paused, mode, onSnap }: CatCamProps) {
  const ui = useUiScale();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const flash = useSharedValue(0);
  const capturingRef = useRef(false);
  const pausedRef = useRef(paused);
  const enabledRef = useRef(enabled);
  const countRef = useRef(0);
  pausedRef.current = paused;
  enabledRef.current = enabled;
  countRef.current = sessionCount;

  useEffect(() => {
    if (!enabled) return;
    if (!permission?.granted) {
      void requestPermission();
    }
  }, [enabled, permission?.granted, requestPermission]);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
  }));

  const takeSnap = useCallback(async () => {
    if (
      !enabledRef.current ||
      pausedRef.current ||
      capturingRef.current ||
      !ready ||
      !cameraRef.current ||
      countRef.current >= MAX_PER_SESSION
    ) {
      return;
    }
    capturingRef.current = true;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.55,
        skipProcessing: true,
        shutterSound: false,
      });
      if (!photo?.uri) return;
      const snap = await saveCatSnap(photo.uri, mode);
      if (!snap) return;
      setSessionCount((c) => c + 1);
      flash.value = withSequence(
        withTiming(0.55, { duration: 50 }),
        withTiming(0, { duration: 280 }),
      );
      onSnap?.(snap);
    } catch {
      // Camera busy / permission revoked — ignore
    } finally {
      capturingRef.current = false;
    }
  }, [flash, mode, onSnap, ready]);

  useEffect(() => {
    if (!enabled || !permission?.granted) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      timer = setTimeout(() => {
        void (async () => {
          if (!cancelled && !pausedRef.current) await takeSnap();
          if (!cancelled) schedule();
        })();
      }, nextGap());
    };

    // First snap after a short warm-up so the preview is ready.
    timer = setTimeout(() => {
      void (async () => {
        if (!cancelled && !pausedRef.current) await takeSnap();
        if (!cancelled) schedule();
      })();
    }, 4500 + Math.random() * 3500);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, permission?.granted, takeSnap]);

  if (!enabled) return null;
  if (!permission?.granted) return null;

  const camW = ui.s(72);
  const camH = ui.s(96);

  return (
    <View
      style={[
        styles.wrap,
        {
          right: ui.padX,
          bottom: Math.max(ui.insets.bottom, 8) + ui.s(64),
          width: camW,
          height: camH,
          borderRadius: ui.s(14),
        },
      ]}
      pointerEvents="none"
    >
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        mirror
        mode="picture"
        animateShutter={false}
        onCameraReady={() => setReady(true)}
      />
      <View style={styles.badge}>
        <View style={styles.dot} />
        <Text style={styles.badgeText}>Cat Cam</Text>
      </View>
      <Animated.View style={[styles.flash, flashStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    zIndex: 50,
    backgroundColor: '#0A0A0A',
  },
  camera: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  badge: {
    position: 'absolute',
    left: 6,
    top: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4D5A',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  flash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
});
