import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type PlayHudProps = {
  elapsedSec: number;
  muted: boolean;
  paused: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onExit: () => void;
};

const HOLD_MS = 700;

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function HoldChip({
  label,
  accessibilityLabel,
  onHoldComplete,
}: {
  label: string;
  accessibilityLabel: string;
  onHoldComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const doneRef = useRef(false);

  const clear = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancel = () => {
    clear();
    doneRef.current = false;
    setProgress(0);
  };

  const begin = () => {
    cancel();
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - startRef.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1 && !doneRef.current) {
        doneRef.current = true;
        clear();
        setProgress(0);
        onHoldComplete();
      }
    }, 32);
  };

  return (
    <Pressable
      onPressIn={begin}
      onPressOut={cancel}
      hitSlop={10}
      style={styles.chip}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}. Hold to confirm`}
      accessibilityHint="Hold for about one second"
    >
      <View style={[styles.holdFill, { width: `${Math.round(progress * 100)}%` }]} />
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

export function PlayHud({
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
        <HoldChip label="<" accessibilityLabel="Exit play" onHoldComplete={onExit} />

        <Text style={styles.meta}>{formatTime(elapsedSec)}</Text>

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
          <HoldChip
            label={paused ? '>' : '||'}
            accessibilityLabel={paused ? 'Resume' : 'Pause'}
            onHoldComplete={onTogglePause}
          />
        </View>
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
    overflow: 'hidden',
  },
  holdFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  pressed: {
    opacity: 0.85,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    zIndex: 1,
  },
  meta: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: bodyFont,
    fontSize: 15,
    fontWeight: '600',
  },
});
