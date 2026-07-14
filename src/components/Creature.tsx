import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
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
  const translateX = useSharedValue(creature.startX);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const caught = useSharedValue(false);

  useEffect(() => {
    translateX.value = withTiming(
      creature.endX,
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
  }, [creature.duration, creature.endX, creature.id, creature.startX, onExit, translateX, caught]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (caught.value) return;
    caught.value = true;
    scale.value = withTiming(1.35, { duration: 90 });
    opacity.value = withTiming(0, { duration: 160 }, (finished) => {
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
