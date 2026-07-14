import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { Theme, ThemeId } from '../themes';

/** Original seamless tiles — tiled across any viewport (never stretched). */
const THEME_TILES: Record<ThemeId, number> = {
  sea: require('../../assets/backgrounds/sea-tile.png'),
  desert: require('../../assets/backgrounds/desert-tile.png'),
  grass: require('../../assets/backgrounds/grass-tile.png'),
};

/** Native tile pixels (all worlds share the same canvas size). */
const TILE_PX_W = 400;
const TILE_PX_H = 352;
/** On-screen tile size — same aspect as the PNG so nothing warps. */
const TILE_W = 260;
const TILE_H = Math.round((TILE_W * TILE_PX_H) / TILE_PX_W);
/** Overlap hides sub-pixel hairlines between adjacent Images. */
const TILE_OVERLAP = 1;

type ThemeBackgroundProps = {
  theme: Theme;
};

function Twinkle({
  left,
  top,
  delay,
  size = 3,
}: {
  left: `${number}%`;
  top: `${number}%`;
  delay: number;
  size?: number;
}) {
  const opacity = useSharedValue(0.2);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.15, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        styles.twinkle,
        { left, top, width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
}

function PatternFill({ themeId, fill }: { themeId: ThemeId; fill: string }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const source = THEME_TILES[themeId];

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    }
  }, []);

  const cols = Math.max(1, Math.ceil(size.w / TILE_W) + 1);
  const rows = Math.max(1, Math.ceil(size.h / TILE_H) + 1);
  const tiles = useMemo(() => {
    if (size.w <= 0 || size.h <= 0) return [] as { key: string; left: number; top: number }[];
    const list: { key: string; left: number; top: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          key: `${r}-${c}`,
          left: c * TILE_W - (c > 0 ? TILE_OVERLAP : 0),
          top: r * TILE_H - (r > 0 ? TILE_OVERLAP : 0),
        });
      }
    }
    return list;
  }, [cols, rows, size.w, size.h]);

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.clip]}
      pointerEvents="none"
      onLayout={onLayout}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
      {tiles.map((t) => (
        <Image
          key={t.key}
          source={source}
          style={{
            position: 'absolute',
            left: t.left,
            top: t.top,
            width: TILE_W + TILE_OVERLAP,
            height: TILE_H + TILE_OVERLAP,
          }}
          resizeMode="stretch"
          accessibilityIgnoresInvertColors
        />
      ))}
    </View>
  );
}

export function ThemeBackground({ theme }: ThemeBackgroundProps) {
  return <PatternFill themeId={theme.id} fill={theme.gradient[1]} />;
}

export function LaserBackground({ lite }: { lite?: boolean } = {}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#04060A', '#0C1018', '#081018', '#05070C']}
        locations={[0, 0.35, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,40,60,0.08)', 'transparent', 'rgba(40,80,160,0.06)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.laserVignette} />
      <View style={[styles.laserRing, styles.laserRing1]} />
      <View style={[styles.laserRing, styles.laserRing2]} />
      {!lite ? <View style={[styles.laserRing, styles.laserRing3]} /> : null}

      <Twinkle left="14%" top="18%" delay={0} size={2} />
      <Twinkle left="58%" top="16%" delay={600} size={3} />
      <Twinkle left="76%" top="34%" delay={200} size={2} />
      {!lite ? (
        <>
          <Twinkle left="32%" top="28%" delay={300} size={2} />
          <Twinkle left="88%" top="22%" delay={900} size={2} />
          <Twinkle left="22%" top="62%" delay={450} size={2} />
          <Twinkle left="48%" top="70%" delay={700} size={2} />
          <Twinkle left="68%" top="58%" delay={150} size={3} />
        </>
      ) : null}

      <View style={styles.laserFloor} />
      <View style={styles.laserFloorGlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  twinkle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  laserVignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  laserRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,70,90,0.12)',
  },
  laserRing1: {
    width: 180,
    height: 180,
    top: '28%',
    left: '24%',
  },
  laserRing2: {
    width: 280,
    height: 280,
    top: '18%',
    left: '8%',
    borderColor: 'rgba(80,120,200,0.1)',
  },
  laserRing3: {
    width: 120,
    height: 120,
    top: '48%',
    right: '10%',
    borderColor: 'rgba(255,70,90,0.08)',
  },
  laserFloor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '18%',
    backgroundColor: 'rgba(8,12,18,0.55)',
  },
  laserFloorGlow: {
    position: 'absolute',
    left: '15%',
    right: '15%',
    bottom: '10%',
    height: 40,
    borderRadius: 40,
    backgroundColor: 'rgba(255,50,70,0.06)',
  },
});
