import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  type LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
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

/** Wrap-safe motif tiles — tiled across any viewport (never stretched unevenly). */
const THEME_TILES: Record<ThemeId, number> = {
  sea: require('../../assets/backgrounds/sea-tile.png'),
  desert: require('../../assets/backgrounds/desert-tile.png'),
  grass: require('../../assets/backgrounds/grass-tile.png'),
};

const LASER_FLOOR_TILE = require('../../assets/backgrounds/laser-floor-tile.png');

/** Native tile pixels (all worlds share the same canvas size). */
const TILE_PX_W = 512;
const TILE_PX_H = 448;
const LASER_TILE_PX_W = 512;
const LASER_TILE_PX_H = 448;

type ThemeBackgroundProps = {
  theme: Theme;
};

/** Atmosphere over each world — depth via value + cool/warm falloff (ch09). */
const ATMOS: Record<
  ThemeId,
  {
    sky: [string, string, string];
    wash: [string, string, string];
    vignette: string;
  }
> = {
  sea: {
    sky: ['#7EC4D8', '#4A9BB8', '#2A6F8E'],
    wash: ['rgba(190,236,248,0.28)', 'transparent', 'rgba(12,48,72,0.38)'],
    vignette: 'rgba(8,30,48,0.34)',
  },
  desert: {
    sky: ['#F0D9A8', '#E2BC7A', '#C9964E'],
    wash: ['rgba(255,236,200,0.32)', 'transparent', 'rgba(110,70,30,0.28)'],
    vignette: 'rgba(70,42,18,0.28)',
  },
  grass: {
    sky: ['#B7D087', '#7FAA58', '#4F7A38'],
    wash: ['rgba(220,240,180,0.26)', 'transparent', 'rgba(30,52,18,0.32)'],
    vignette: 'rgba(20,40,12,0.3)',
  },
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

function PatternFill({ themeId }: { themeId: ThemeId }) {
  const { width: winW } = useWindowDimensions();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const source = THEME_TILES[themeId];

  // Larger tiles = fewer repeats in view → pattern reads as texture, not wallpaper.
  const tileW = Math.max(380, Math.min(560, Math.round(winW * 0.72)));
  const tileH = Math.round((tileW * TILE_PX_H) / TILE_PX_W);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    }
  }, []);

  const cols = Math.max(1, Math.ceil(size.w / tileW) + 1);
  const rows = Math.max(1, Math.ceil(size.h / tileH) + 1);
  const tiles = useMemo(() => {
    if (size.w <= 0 || size.h <= 0) return [] as { key: string; left: number; top: number }[];
    const list: { key: string; left: number; top: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          key: `${r}-${c}`,
          left: Math.round(c * tileW),
          top: Math.round(r * tileH),
        });
      }
    }
    return list;
  }, [cols, rows, size.w, size.h, tileW, tileH]);

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.clip]}
      pointerEvents="none"
      onLayout={onLayout}
    >
      {tiles.map((t) => (
        <Image
          key={t.key}
          source={source}
          style={{
            position: 'absolute',
            left: t.left,
            top: t.top,
            width: tileW,
            height: tileH,
            opacity: 0.72,
          }}
          resizeMode="stretch"
          accessibilityIgnoresInvertColors
        />
      ))}
    </View>
  );
}

export function ThemeBackground({ theme }: ThemeBackgroundProps) {
  const atmos = ATMOS[theme.id];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={atmos.sky}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      <PatternFill themeId={theme.id} />
      <LinearGradient
        colors={atmos.wash}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Soft edge vignette — frames playfield without muddying the center */}
      <LinearGradient
        colors={[atmos.vignette, 'transparent', 'transparent', atmos.vignette]}
        locations={[0, 0.18, 0.78, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[atmos.vignette, 'transparent', 'transparent', atmos.vignette]}
        locations={[0, 0.12, 0.88, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export function LaserBackground({ lite }: { lite?: boolean } = {}) {
  const { width: winW } = useWindowDimensions();
  const [size, setSize] = useState({ w: 0, h: 0 });

  const tileW = Math.max(420, Math.min(640, Math.round(winW * 0.85)));
  const tileH = Math.round((tileW * LASER_TILE_PX_H) / LASER_TILE_PX_W);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize((prev) => (prev.w === width && prev.h === height ? prev : { w: width, h: height }));
    }
  }, []);

  const cols = Math.max(1, Math.ceil(size.w / tileW) + 1);
  const rows = Math.max(1, Math.ceil(size.h / tileH) + 1);
  const tiles = useMemo(() => {
    if (size.w <= 0 || size.h <= 0) return [] as { key: string; left: number; top: number }[];
    const list: { key: string; left: number; top: number }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        list.push({
          key: `${r}-${c}`,
          left: Math.round(c * tileW),
          top: Math.round(r * tileH),
        });
      }
    }
    return list;
  }, [cols, rows, size.w, size.h, tileW, tileH]);

  // Dark hardwood playfloor — cool charcoal oak so the red laser dominates (ch09).
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      <View style={[StyleSheet.absoluteFill, styles.laserBase]} />
      <View style={[StyleSheet.absoluteFill, styles.clip]}>
        {tiles.map((t) => (
          <Image
            key={t.key}
            source={LASER_FLOOR_TILE}
            style={{
              position: 'absolute',
              left: t.left,
              top: t.top,
              width: tileW,
              height: tileH,
            }}
            resizeMode="stretch"
            accessibilityIgnoresInvertColors
          />
        ))}
      </View>

      {/* Lamp spill from the far corner */}
      <LinearGradient
        colors={['rgba(255,200,140,0.18)', 'rgba(255,150,80,0.05)', 'transparent']}
        start={{ x: 0.08, y: 0 }}
        end={{ x: 0.75, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Depth falloff toward the near edge */}
      <LinearGradient
        colors={['rgba(255,230,200,0.06)', 'transparent', 'rgba(0,0,0,0.45)']}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.4)']}
        locations={[0, 0.14, 0.86, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {!lite ? (
        <>
          <Twinkle left="22%" top="20%" delay={0} size={2} />
          <Twinkle left="68%" top="16%" delay={700} size={2} />
          <Twinkle left="48%" top="42%" delay={350} size={2} />
        </>
      ) : (
        <>
          <Twinkle left="20%" top="22%" delay={0} size={2} />
          <Twinkle left="70%" top="18%" delay={600} size={2} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  twinkle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,230,190,0.85)',
  },
  laserBase: {
    backgroundColor: '#1C1814',
  },
});
