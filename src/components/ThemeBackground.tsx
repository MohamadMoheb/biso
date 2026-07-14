import { Asset } from 'expo-asset';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
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
const ALL_TILES = [...Object.values(THEME_TILES), LASER_FLOOR_TILE];

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

/** Decode all world tiles once so theme / mode switches are instant. */
let tilesPrefetched = false;
export function prefetchBackgroundTiles() {
  if (tilesPrefetched) return;
  tilesPrefetched = true;
  void Asset.loadAsync(ALL_TILES).catch(() => undefined);
  for (const source of ALL_TILES) {
    try {
      const uri = Asset.fromModule(source).uri;
      if (uri) void Image.prefetch(uri).catch(() => undefined);
    } catch {
      // Asset registry may not be ready yet during hot reload.
    }
  }
}

/**
 * One decode, GPU/CSS tiling — was previously a grid of separate Image views
 * that each waited on layout + their own load (especially painful on web).
 */
function TiledFill({
  source,
  tileW,
  tileH,
  opacity = 1,
}: {
  source: number;
  tileW: number;
  tileH: number;
  opacity?: number;
}) {
  if (Platform.OS === 'web') {
    let uri: string | null = null;
    try {
      uri = Asset.fromModule(source).uri;
    } catch {
      uri = null;
    }
    if (!uri) {
      // Fallback: single Image with native-css repeat at intrinsic size.
      return (
        <Image
          source={source}
          style={[StyleSheet.absoluteFill, { opacity }]}
          resizeMode="repeat"
          accessibilityIgnoresInvertColors
        />
      );
    }
    const webStyle = {
      opacity,
      backgroundImage: `url("${uri}")`,
      backgroundRepeat: 'repeat',
      backgroundSize: `${tileW}px ${tileH}px`,
    } as ViewStyle;
    return (
      <View style={[StyleSheet.absoluteFill, styles.clip, webStyle]} pointerEvents="none" />
    );
  }

  // Native: one Image with repeat — keeps size/aspect, covers the frame.
  return (
    <Image
      source={source}
      style={[StyleSheet.absoluteFill, styles.clip, { opacity }]}
      resizeMode="repeat"
      accessibilityIgnoresInvertColors
    />
  );
}

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
    return () => cancelAnimation(opacity);
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
  // Larger tiles = fewer repeats in view → pattern reads as texture, not wallpaper.
  const tileW = Math.max(380, Math.min(560, Math.round(winW * 0.72)));
  const tileH = Math.round((tileW * TILE_PX_H) / TILE_PX_W);

  return (
    <TiledFill source={THEME_TILES[themeId]} tileW={tileW} tileH={tileH} opacity={0.72} />
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
  const tileW = Math.max(420, Math.min(640, Math.round(winW * 0.85)));
  const tileH = Math.round((tileW * LASER_TILE_PX_H) / LASER_TILE_PX_W);

  // Dark hardwood playfloor — cool charcoal oak so the red laser dominates (ch09).
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, styles.laserBase]} />
      <TiledFill source={LASER_FLOOR_TILE} tileW={tileW} tileH={tileH} />

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
