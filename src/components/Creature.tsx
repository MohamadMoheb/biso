import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

import type { CreatureSounds } from '../hooks/useCreatureSounds';
import type { CreatureSpawn, SpawnEdge } from '../hooks/useSpawner';

type CreatureProps = {
  creature: CreatureSpawn;
  screenWidth: number;
  screenHeight: number;
  sounds: CreatureSounds;
  onCatch: (id: string) => void;
  onExit: (id: string) => void;
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function facingToward(fromX: number, toX: number): 1 | -1 {
  return toX >= fromX ? 1 : -1;
}

function peekSpot(
  edge: SpawnEdge,
  size: number,
  nestX: number,
  nestY: number,
): { x: number; y: number } {
  switch (edge) {
    case 'left':
      return { x: -size * 0.38, y: nestY };
    case 'right':
      return { x: nestX - size * 0.12, y: nestY };
    case 'top':
      return { x: nestX, y: -size * 0.38 };
    case 'bottom':
      return { x: nestX, y: nestY - size * 0.12 };
  }
}

function hideSpot(
  edge: SpawnEdge,
  size: number,
  nestX: number,
  nestY: number,
): { x: number; y: number } {
  switch (edge) {
    case 'left':
      return { x: -size * 1.05, y: nestY };
    case 'right':
      return { x: nestX + size * 0.55, y: nestY };
    case 'top':
      return { x: nestX, y: -size * 1.05 };
    case 'bottom':
      return { x: nestX, y: nestY + size * 0.55 };
  }
}

export function Creature({
  creature,
  screenWidth,
  screenHeight,
  sounds,
  onCatch,
  onExit,
}: CreatureProps) {
  const peek = peekSpot(creature.edge, creature.size, creature.nestX, creature.nestY);
  const hide = hideSpot(creature.edge, creature.size, creature.nestX, creature.nestY);

  const x = useSharedValue(hide.x);
  const y = useSharedValue(hide.y);
  const facing = useSharedValue<number>(creature.edge === 'right' ? -1 : 1);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const bob = useSharedValue(0);
  const sway = useSharedValue(0);
  const caught = useSharedValue(false);

  const aliveRef = useRef(true);
  const posRef = useRef({ x: hide.x, y: hide.y });
  const soundsRef = useRef(sounds);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  soundsRef.current = sounds;

  const pad = creature.size * 0.08;
  const minX = pad;
  const maxX = Math.max(pad, screenWidth - creature.size - pad);
  const minY = pad;
  const maxY = Math.max(pad, screenHeight - creature.size - pad);

  useEffect(() => {
    aliveRef.current = true;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        if (!aliveRef.current || caught.value) {
          resolve();
          return;
        }
        const t = setTimeout(() => {
          timersRef.current = timersRef.current.filter((id) => id !== t);
          resolve();
        }, ms);
        timersRef.current.push(t);
      });

    const moveTo = (
      nx: number,
      ny: number,
      duration: number,
      easing: (v: number) => number,
    ) =>
      new Promise<void>((resolve) => {
        if (!aliveRef.current || caught.value) {
          resolve();
          return;
        }
        facing.value = facingToward(posRef.current.x, nx);
        posRef.current = { x: nx, y: ny };
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        // Always settle the promise so cancelled animations cannot stall the loop.
        x.value = withTiming(nx, { duration, easing }, () => {
          runOnJS(finish)();
        });
        y.value = withTiming(ny, { duration, easing });
      });

    const startIdleMotion = (themeId: CreatureSpawn['themeId']) => {
      const amp = themeId === 'sea' ? 7 : 4;
      const period = themeId === 'sea' ? 900 : 700;
      bob.value = withRepeat(
        withSequence(
          withTiming(amp, { duration: period, easing: Easing.inOut(Easing.sin) }),
          withTiming(-amp, { duration: period, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      sway.value = withRepeat(
        withSequence(
          withTiming(themeId === 'sea' ? 8 : 5, {
            duration: period * 1.1,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(themeId === 'sea' ? -8 : -5, {
            duration: period * 1.1,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        true,
      );
    };

    const stopIdleMotion = () => {
      cancelAnimation(bob);
      cancelAnimation(sway);
      bob.value = withTiming(0, { duration: 120 });
      sway.value = withTiming(0, { duration: 120 });
    };

    const playSneakWhile = async (duration: number) => {
      const end = Date.now() + duration;
      while (aliveRef.current && !caught.value && Date.now() < end) {
        soundsRef.current.playSneak();
        await wait(rand(280, 480));
      }
    };

    const doPeek = async () => {
      stopIdleMotion();
      soundsRef.current.playHide();
      await moveTo(peek.x, peek.y, Math.round(rand(380, 620)), Easing.out(Easing.cubic));
      startIdleMotion(creature.themeId);
      // Hold partial visibility — classic cat tease.
      await wait(Math.round(rand(700, 1800)));
      if (Math.random() < 0.45) {
        soundsRef.current.playHide();
        stopIdleMotion();
        await moveTo(hide.x, hide.y, Math.round(rand(280, 480)), Easing.in(Easing.cubic));
        await wait(Math.round(rand(400, 1100)));
        soundsRef.current.playHide();
        await moveTo(peek.x, peek.y, Math.round(rand(320, 560)), Easing.out(Easing.cubic));
        startIdleMotion(creature.themeId);
        await wait(Math.round(rand(500, 1200)));
      }
    };

    const doFreeze = async () => {
      startIdleMotion(creature.themeId);
      // Sudden stillness after motion holds feline attention.
      await wait(Math.round(rand(900, 2600)));
    };

    const doSneak = async () => {
      stopIdleMotion();
      const nx = clamp(posRef.current.x + rand(-creature.size * 1.6, creature.size * 1.6), minX, maxX);
      const ny = clamp(
        posRef.current.y +
          rand(
            creature.themeId === 'sea' ? -creature.size * 1.1 : -creature.size * 0.55,
            creature.themeId === 'sea' ? creature.size * 1.1 : creature.size * 0.55,
          ),
        minY,
        maxY,
      );
      const duration = Math.round(rand(1400, 2600));
      void playSneakWhile(duration);
      const glide =
        creature.themeId === 'sea'
          ? Easing.inOut(Easing.sin)
          : Easing.linear;
      await moveTo(nx, ny, duration, glide);
    };

    const doDash = async () => {
      stopIdleMotion();
      soundsRef.current.playDash();
      const leap = creature.size * rand(1.8, 3.2);
      const angle = rand(0, Math.PI * 2);
      const nx = clamp(posRef.current.x + Math.cos(angle) * leap, minX, maxX);
      const ny = clamp(
        posRef.current.y + Math.sin(angle) * leap * (creature.themeId === 'grass' ? 1.15 : 0.85),
        minY,
        maxY,
      );
      const duration = Math.round(rand(280, 520));
      // Snappy acceleration, cats love the pop of speed.
      await moveTo(nx, ny, duration, Easing.out(Easing.quad));
      // Micro-pause after the dash before next decision.
      startIdleMotion(creature.themeId);
      await wait(Math.round(rand(250, 700)));
    };

    const enterPlayfield = async () => {
      stopIdleMotion();
      soundsRef.current.playSneak();
      const targetX = clamp(
        creature.edge === 'left'
          ? rand(minX, screenWidth * 0.35)
          : creature.edge === 'right'
            ? rand(screenWidth * 0.55, maxX)
            : rand(minX, maxX),
        minX,
        maxX,
      );
      const targetY = clamp(
        creature.edge === 'top'
          ? rand(minY, screenHeight * 0.35)
          : creature.edge === 'bottom'
            ? rand(screenHeight * 0.55, maxY)
            : rand(minY, maxY),
        minY,
        maxY,
      );
      await moveTo(targetX, targetY, Math.round(rand(900, 1600)), Easing.out(Easing.cubic));
    };

    const retreatAndLeave = async () => {
      stopIdleMotion();
      soundsRef.current.playHide();
      await moveTo(peek.x, peek.y, Math.round(rand(500, 900)), Easing.inOut(Easing.quad));
      await wait(Math.round(rand(300, 800)));
      soundsRef.current.playHide();
      await moveTo(hide.x, hide.y, Math.round(rand(320, 560)), Easing.in(Easing.cubic));
    };

    const runLife = async () => {
      // Arrive peeking from a corner — never just pop into the middle.
      await doPeek();
      if (!aliveRef.current || caught.value) return;

      if (Math.random() < 0.18) {
        // Occasional pure tease: peek only, then vanish.
        await retreatAndLeave();
        if (aliveRef.current && !caught.value) {
          runOnJS(onExit)(creature.id);
        }
        return;
      }

      await enterPlayfield();
      if (!aliveRef.current || caught.value) return;

      const actions = Math.round(rand(5, 11));
      for (let i = 0; i < actions; i++) {
        if (!aliveRef.current || caught.value) return;

        const roll = Math.random();
        // Weighted toward freeze ↔ dash (strongest cat trigger).
        if (roll < 0.28) {
          await doFreeze();
        } else if (roll < 0.5) {
          await doDash();
        } else if (roll < 0.72) {
          await doSneak();
        } else if (roll < 0.86) {
          await doFreeze();
          if (!aliveRef.current || caught.value) return;
          await doDash();
        } else {
          // Mid-life corner peek from current edge or a new nest-like side dart.
          await doPeek();
          if (!aliveRef.current || caught.value) return;
          if (Math.random() < 0.4) {
            await enterPlayfield();
          }
        }
      }

      if (!aliveRef.current || caught.value) return;
      await retreatAndLeave();
      if (aliveRef.current && !caught.value) {
        runOnJS(onExit)(creature.id);
      }
    };

    void runLife();

    return () => {
      aliveRef.current = false;
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(bob);
      cancelAnimation(sway);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
    // Intentionally once per spawn id — screen size & creature identity are stable for this instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creature.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value + bob.value },
      { scaleX: facing.value * scale.value },
      { scaleY: scale.value },
      { rotate: `${sway.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    if (caught.value) return;
    caught.value = true;
    aliveRef.current = false;
    cancelAnimation(x);
    cancelAnimation(y);
    cancelAnimation(bob);
    cancelAnimation(sway);
    scale.value = withTiming(1.55, { duration: 110 });
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
          width: creature.size,
          height: creature.size,
        },
        animatedStyle,
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={handlePress}
        hitSlop={{ top: 28, bottom: 28, left: 28, right: 28 }}
        style={[styles.hit, webHitStyle]}
        accessibilityRole="button"
        accessibilityLabel={`Catch ${creature.emoji}`}
      >
        <Text
          selectable={false}
          style={[styles.emoji, webEmojiStyle, { fontSize: creature.size * 0.82 }]}
        >
          {creature.emoji}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const webHitStyle = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as const) : null;
const webEmojiStyle = Platform.OS === 'web' ? ({ userSelect: 'none' } as const) : null;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hit: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
