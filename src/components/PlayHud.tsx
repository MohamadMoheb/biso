import { Ionicons } from '@expo/vector-icons';
import { useRef, useState, type ComponentProps } from 'react';
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

type IconName = ComponentProps<typeof Ionicons>['name'];

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function HoldChip({
  icon,
  accessibilityLabel,
  onHoldComplete,
}: {
  icon: IconName;
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
      <Ionicons name={icon} size={22} color="#FFFFFF" style={styles.chipIcon} />
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
        <HoldChip
          icon="chevron-back"
          accessibilityLabel="Exit play"
          onHoldComplete={onExit}
        />

        <View style={styles.metaPill}>
          <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.meta}>{formatTime(elapsedSec)}</Text>
        </View>

        <View style={styles.rightCluster}>
          <HoldChip
            icon={muted ? 'volume-mute' : 'volume-high'}
            accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            onHoldComplete={onToggleMute}
          />
          <HoldChip
            icon={paused ? 'play' : 'pause'}
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
  chipIcon: {
    zIndex: 1,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  meta: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: bodyFont,
    fontSize: 15,
    fontWeight: '600',
    minWidth: 36,
  },
});
