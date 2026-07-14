import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type PlayHudProps = {
  catches: number;
  streak: number;
  elapsedSec: number;
  muted: boolean;
  paused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onExit: () => void;
};

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayHud({
  catches,
  streak,
  elapsedSec,
  muted,
  paused,
  onToggleMute,
  onTogglePause,
  onExit,
}: PlayHudProps) {
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.topRow}>
        <Pressable
          onPress={onExit}
          hitSlop={12}
          style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Exit play"
        >
          <Text style={styles.chipText}>{'<'}</Text>
        </Pressable>

        <View style={styles.stats}>
          <Text style={styles.statMain}>{catches}</Text>
          <Text style={styles.statLabel}>caught</Text>
        </View>

        <View style={styles.rightCluster}>
          <Pressable
            onPress={onToggleMute}
            hitSlop={10}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={muted ? 'Unmute' : 'Mute'}
          >
            <Text style={styles.chipText}>{muted ? 'Off' : 'Snd'}</Text>
          </Pressable>
          <Pressable
            onPress={onTogglePause}
            hitSlop={10}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={paused ? 'Resume' : 'Pause'}
          >
            <Text style={styles.chipText}>{paused ? '>' : '||'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>{formatTime(elapsedSec)}</Text>
        {streak >= 2 ? <Text style={styles.streak}>Streak {streak}</Text> : null}
      </View>
    </View>
  );
}

const bodyFont = Platform.select({
  ios: 'Avenir Next',
  android: 'sans-serif',
  default: 'System',
});

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 60,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightCluster: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    minWidth: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  stats: {
    alignItems: 'center',
  },
  statMain: {
    color: '#FFFFFF',
    fontFamily: bodyFont,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: bodyFont,
    fontSize: 12,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  meta: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '600',
  },
  streak: {
    color: '#FFE08A',
    fontFamily: bodyFont,
    fontSize: 14,
    fontWeight: '700',
  },
});
