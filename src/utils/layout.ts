import { useMemo } from 'react';
import { PixelRatio, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Design reference — iPhone 14-class width. */
const BASE_W = 390;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Mobile-first layout metrics: scales typography/controls with screen size
 * and exposes safe-area insets so chrome clears notches and home indicators.
 */
export function useUiScale() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const shortest = Math.min(width, height);
    const scale = clamp(shortest / BASE_W, 0.82, 1.18);
    const compactH = height < 720;
    const narrow = width < 370;

    const s = (n: number) => Math.round(n * scale);
    const font = (n: number) =>
      Math.max(11, Math.round(PixelRatio.roundToNearestPixel(n * scale)));
    /** Minimum comfortable finger target. */
    const tap = Math.max(44, s(44));

    return {
      width,
      height,
      insets,
      scale,
      compactH,
      narrow,
      s,
      font,
      tap,
      /** Horizontal page padding */
      padX: narrow ? 12 : s(16),
      /** Dock / card bottom clearance above home indicator */
      dockBottom: Math.max(insets.bottom, 8) + (compactH ? 4 : 8),
    };
  }, [width, height, insets]);
}
