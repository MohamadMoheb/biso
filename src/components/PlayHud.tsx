import Ionicons from '@react-native-vector-icons/ionicons';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useUiScale } from '../utils/layout';
import { formatTime } from '../utils/formatTime';

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

function HoldChip({
  icon,
  accessibilityLabel,
  onHoldComplete,
  size,
  iconSize,
}: {
  icon: IconName;
  accessibilityLabel: string;
  onHoldComplete: () => void;
  size: number;
  iconSize: number;
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

  useEffect(() => () => clear(), []);

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
      hitSlop={12}
      style={[
        styles.chip,
        {
          minWidth: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          paddingHorizontal: Math.round(size * 0.22),
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}. Hold to confirm`}
      accessibilityHint="Hold for about one second"
    >
      <View style={[styles.holdFill, { width: `${Math.round(progress * 100)}%` }]} />
      <Ionicons name={icon} size={iconSize} color="#FFFFFF" style={styles.chipIcon} />
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
  const ui = useUiScale();
  const chip = ui.tap;
  const icon = ui.s(22);

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingTop: ui.insets.top + ui.s(8),
          paddingHorizontal: ui.padX,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.topRow}>
        <HoldChip
          icon="chevron-back"
          accessibilityLabel="Exit play"
          onHoldComplete={onExit}
          size={chip}
          iconSize={icon}
        />

        <View
          style={[
            styles.metaPill,
            {
              minHeight: Math.max(32, ui.s(32)),
              paddingHorizontal: ui.s(10),
              borderRadius: ui.s(12),
              gap: ui.s(6),
            },
          ]}
        >
          <Ionicons
            name="time-outline"
            size={ui.s(14)}
            color="rgba(255,255,255,0.85)"
          />
          <Text style={[styles.meta, { fontSize: ui.font(15), minWidth: ui.s(36) }]}>
            {formatTime(elapsedSec)}
          </Text>
        </View>

        <View style={[styles.rightCluster, { gap: ui.s(8) }]}>
          <HoldChip
            icon={muted ? 'volume-mute' : 'volume-high'}
            accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            onHoldComplete={onToggleMute}
            size={chip}
            iconSize={icon}
          />
          <HoldChip
            icon={paused ? 'play' : 'pause'}
            accessibilityLabel={paused ? 'Resume' : 'Pause'}
            onHoldComplete={onTogglePause}
            size={chip}
            iconSize={icon}
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
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightCluster: {
    flexDirection: 'row',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
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
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  meta: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: bodyFont,
    fontWeight: '600',
  },
});
