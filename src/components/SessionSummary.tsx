import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useUiScale } from '../utils/layout';
import { formatTime } from '../utils/formatTime';

type Props = {
  elapsedSec: number;
  title?: string;
  subtitle?: string;
  /** Optional score line (e.g. laser taps). */
  scoreLabel?: string;
  /** Cat Cam snaps taken this session */
  snapCount?: number;
  onViewSnaps?: () => void;
  onPlayAgain: () => void;
  onHome: () => void;
};

export function SessionSummary({
  elapsedSec,
  title = 'Time for a break',
  subtitle = 'Short sessions keep play fresh.',
  scoreLabel,
  snapCount = 0,
  onViewSnaps,
  onPlayAgain,
  onHome,
}: Props) {
  const ui = useUiScale();

  return (
    <View
      style={[
        styles.overlay,
        {
          paddingHorizontal: ui.padX + 8,
          paddingTop: ui.insets.top + 16,
          paddingBottom: ui.insets.bottom + 16,
        },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            maxWidth: Math.min(360, ui.width - ui.padX * 2),
            borderRadius: ui.s(28),
            padding: ui.compactH ? ui.s(18) : ui.s(24),
          },
        ]}
      >
        <Text style={[styles.title, { fontSize: ui.font(ui.compactH ? 28 : 34) }]}>{title}</Text>
        <Text style={[styles.subtitle, { fontSize: ui.font(15), lineHeight: ui.font(22) }]}>
          {subtitle}
        </Text>
        <Text
          style={[
            styles.time,
            { fontSize: ui.font(22), marginTop: ui.s(16) },
            !scoreLabel && snapCount <= 0 && { marginBottom: ui.s(20) },
          ]}
        >
          {formatTime(elapsedSec)}
        </Text>
        {scoreLabel ? (
          <Text style={[styles.score, { fontSize: ui.font(16), marginBottom: ui.s(18) }]}>
            {scoreLabel}
          </Text>
        ) : null}
        {snapCount > 0 ? (
          <Text style={[styles.score, { fontSize: ui.font(16), marginBottom: ui.s(18) }]}>
            {snapCount === 1 ? '1 Cat Cam snap' : `${snapCount} Cat Cam snaps`}
          </Text>
        ) : null}
        {snapCount > 0 && onViewSnaps ? (
          <Pressable
            onPress={onViewSnaps}
            style={({ pressed }) => [
              styles.secondary,
              { borderRadius: ui.s(16), paddingVertical: ui.s(13), marginBottom: ui.s(4) },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.secondaryText, { fontSize: ui.font(16) }]}>See Cat Cam</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onPlayAgain}
          style={({ pressed }) => [
            styles.primary,
            { borderRadius: ui.s(16), paddingVertical: ui.s(14), minHeight: ui.tap },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.primaryText, { fontSize: ui.font(17) }]}>Play again</Text>
        </Pressable>
        <Pressable
          onPress={onHome}
          style={({ pressed }) => [
            styles.secondary,
            { borderRadius: ui.s(16), paddingVertical: ui.s(13), marginTop: ui.s(10), minHeight: ui.tap },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={[styles.secondaryText, { fontSize: ui.font(16) }]}>Back home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const displayFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'Georgia',
});
const bodyFont = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  default: 'System',
});

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 18, 16, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  card: {
    width: '100%',
    backgroundColor: '#F7F2E8',
  },
  title: {
    fontFamily: displayFont,
    fontWeight: '700',
    color: '#1C2A24',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 6,
    fontFamily: bodyFont,
    color: '#4A5A52',
    textAlign: 'center',
  },
  time: {
    marginBottom: 8,
    fontFamily: bodyFont,
    fontWeight: '700',
    color: '#1C2A24',
    textAlign: 'center',
  },
  score: {
    fontFamily: bodyFont,
    fontWeight: '600',
    color: '#4A5A52',
    textAlign: 'center',
  },
  primary: {
    backgroundColor: '#1C2A24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#F7F2E8',
    fontFamily: bodyFont,
    fontWeight: '700',
  },
  secondary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(28,42,36,0.08)',
  },
  secondaryText: {
    color: '#1C2A24',
    fontFamily: bodyFont,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
  },
});
