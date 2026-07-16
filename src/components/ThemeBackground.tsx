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

/**
 * Full landscape scene per world (rasterized from SVG at 4800x3000). Rendered as
 * a wide, flat-design horizon: the artwork sits in the middle, its top sky colour
 * extends up and its bottom ground colour extends down, so it fills any portrait
 * screen edge-to-edge without cropping the sun / tree / cacti.
 */
const SCENE_SOURCES: Record<ThemeId, number> = {
  sea: require('../../assets/backgrounds/sea-scene.png'),
  desert: require('../../assets/backgrounds/desert-scene.png'),
  grass: require('../../assets/backgrounds/grass-scene.png'),
};

/** Scene viewBox aspect (h / w) — 2400 x 1500. */
const SCENE_RATIO = 1500 / 2400;

/** Top sky colour of each scene — extended above the art, seamless with its top edge. */
const SCENE_SKY: Record<ThemeId, string> = {
  sea: '#bfd9d2',
  desert: '#f5ead8',
  grass: '#f5ead8',
};

/** Bottom ground colour of each scene — extended below the art, seamless with its bottom edge. */
const SCENE_GROUND: Record<ThemeId, string> = {
  sea: '#46796c',
  desert: '#c1955e',
  grass: '#66774e',
};

/**
 * Where each scene's horizon (sky → ground) sits within its own height. Used to
 * line the artwork up with the on-screen horizon so the colour fills stay seamless.
 */
const SCENE_HORIZON: Record<ThemeId, number> = {
  sea: 0.5,
  desert: 0.427, // dunes begin at y=640 / 1500
  grass: 0.467, // hills begin at y=700 / 1500
};

/** Screen height fraction the horizon is anchored to. */
const HORIZON_ON_SCREEN = 0.42;

/**
 * Blow the full-width scene up a touch so it reads as an immersive backdrop rather
 * than a thin strip. 1.35x keeps every focal element (sun, tree, cacti) on screen
 * while trimming only the far empty edges.
 */
const SCENE_ZOOM = 1.35;

const LASER_FLOOR_TILE = require('../../assets/backgrounds/laser-floor-tile.png');
const LASER_SHEET = require('../../assets/backgrounds/laser-floor.png');
const ALL_ASSETS = [...Object.values(SCENE_SOURCES), LASER_FLOOR_TILE, LASER_SHEET];

const LASER_TILE_PX_W = 512;
const LASER_TILE_PX_H = 448;

type ThemeBackgroundProps = {
  theme: Theme;
};

/** Decode all world scenes once so theme / mode switches are instant. */
let tilesPrefetched = false;
export function prefetchBackgroundTiles() {
  if (tilesPrefetched) return;
  tilesPrefetched = true;
  void Asset.loadAsync(ALL_ASSETS).catch(() => undefined);
  for (const source of ALL_ASSETS) {
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

export function ThemeBackground({ theme }: ThemeBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const id = theme.id;

  // Wide landscape, centred and zoomed; overflow is clipped by the parent stage.
  const sceneW = Math.round(width * SCENE_ZOOM);
  const sceneH = Math.round(sceneW * SCENE_RATIO);
  const left = Math.round((width - sceneW) / 2);
  const horizonY = Math.round(height * HORIZON_ON_SCREEN);
  const sceneTop = Math.round(horizonY - sceneH * SCENE_HORIZON[id]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.clip]} pointerEvents="none">
      {/* Sky fills everything; ground overlays from the horizon down. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: SCENE_SKY[id] }]} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: horizonY,
          bottom: 0,
          backgroundColor: SCENE_GROUND[id],
        }}
      />
      {/* Full landscape, top edge blends into the sky, bottom edge into the ground. */}
      <Image
        source={SCENE_SOURCES[id]}
        style={{ position: 'absolute', top: sceneTop, left, width: sceneW, height: sceneH }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
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
      {Platform.OS !== 'web' ? (
        <Image
          source={LASER_SHEET}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <TiledFill source={LASER_FLOOR_TILE} tileW={tileW} tileH={tileH} />
      )}

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
