import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import type { CreatureSpawn } from '../hooks/useSpawner';

type CreatureProps = {
  creature: CreatureSpawn;
  onCatch: (id: string) => void;
  onExit: (id: string) => void;
};

export function Creature({ creature, onCatch, onExit }: CreatureProps) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const caught = useSharedValue(false);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      {
        duration: creature.duration,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished && !caught.value) {
          runOnJS(onExit)(creature.id);
        }
      },
    );
  }, [creature.duration, creature.id, onExit, progress, caught]);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const wave = Math.sin(t * Math.PI * 2 * creature.bobCycles);
    const sway = Math.cos(t * Math.PI * 2 * creature.bobCycles) * creature.swayDegrees;

    const x = interpolate(t, [0, 1], [creature.startX, creature.endX]);
    const yOffset =
      wave * creature.bobAmplitude + interpolate(t, [0, 1], [0, creature.driftY]);

    return {
      transform: [
        { translateX: x },
        { translateY: yOffset },
        { scaleX: creature.facing * scale.value },
        { scaleY: scale.value },
        { rotate: `${sway}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const handlePress = () => {
    if (caught.value) return;
    caught.value = true;
    scale.value = withTiming(1.45, { duration: 100 });
    opacity.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(onCatch)(creature.id);
      }
    });
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          top: creature.y,
          width: creature.size,
          height: creature.size,
        },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handlePress}
        hitSlop={{ top: 36, bottom: 36, left: 36, right: 36 }}
        style={styles.hit}
        accessibilityRole="button"
        accessibilityLabel={`Catch ${creature.emoji}`}
      >
        <Text
          selectable={false}
          style={[styles.emoji, { fontSize: creature.size * 0.85 }]}
        >
          {creature.emoji}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hit: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-expect-error web-only: hide browser focus outline
    outlineStyle: 'none',
  },
  emoji: {
    textAlign: 'center',
    includeFontPadding: false,
    // @ts-expect-error web-only: prevent blue text selection highlight
    userSelect: 'none',
  },
});
