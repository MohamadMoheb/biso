import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

import { getEntityProfile, type Gait } from '../entityProfiles';
import type { CreatureSounds } from '../hooks/useCreatureSounds';
import type { CreatureSpawn, SpawnEdge } from '../hooks/useSpawner';

type CreatureProps = {
  creature: CreatureSpawn;
  screenWidth: number;
  screenHeight: number;
  sounds: CreatureSounds;
  speedMultiplier?: number;
  paused?: boolean;
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

function offscreenSpot(
  edge: SpawnEdge,
  size: number,
  nestX: number,
  nestY: number,
): { x: number; y: number } {
  switch (edge) {
    case 'left':
      return { x: -size * 1.15, y: nestY };
    case 'right':
      return { x: nestX + size * 0.7, y: nestY };
    case 'top':
      return { x: nestX, y: -size * 1.15 };
    case 'bottom':
      return { x: nestX, y: nestY + size * 0.7 };
  }
}

function isFlyer(gait: Gait): boolean {
  return gait === 'butterfly' || gait === 'bird' || gait === 'bee';
}

function isSwimmer(gait: Gait): boolean {
  return gait === 'fish' || gait === 'jelly' || gait === 'shrimp';
}

function isWalker(gait: Gait): boolean {
  return (
    gait === 'lizard' ||
    gait === 'beetle' ||
    gait === 'crab' ||
    gait === 'scorpion' ||
    gait === 'ladybug' ||
    gait === 'squirrel'
  );
}

export function Creature({
  creature,
  screenWidth,
  screenHeight,
  sounds,
  speedMultiplier = 1,
  paused = false,
  onCatch,
  onExit,
}: CreatureProps) {
  const profile = getEntityProfile(creature.emoji);
  const gait = profile.gait;
  const start = offscreenSpot(creature.edge, creature.size, creature.nestX, creature.nestY);

  const x = useSharedValue(start.x);
  const y = useSharedValue(start.y);
  const facing = useSharedValue<number>(creature.edge === 'right' ? -1 : 1);
  const phase = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const caught = useSharedValue(false);

  const aliveRef = useRef(true);
  const pausedRef = useRef(paused);
  const posRef = useRef({ x: start.x, y: start.y });
  const phaseRef = useRef(0);
  const soundsRef = useRef(sounds);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  soundsRef.current = sounds;
  pausedRef.current = paused;

  const pad = Math.max(16, creature.size * 0.12);
  const minX = pad;
  const maxX = Math.max(pad, screenWidth - creature.size - pad);
  const minY = pad;
  const maxY = Math.max(pad, screenHeight - creature.size - pad);

  useEffect(() => {
    aliveRef.current = true;
    const emoji = creature.emoji;
    const stridePx = Math.max(28, creature.size * profile.stride);

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        if (!aliveRef.current || caught.value) {
          resolve();
          return;
        }
        let left = ms;
        const step = () => {
          if (!aliveRef.current || caught.value) {
            resolve();
            return;
          }
          if (pausedRef.current) {
            const t = setTimeout(step, 100);
            timersRef.current.push(t);
            return;
          }
          const slice = Math.min(100, left);
          left -= slice;
          if (left <= 0) {
            resolve();
            return;
          }
          const t = setTimeout(step, slice);
          timersRef.current.push(t);
        };
        step();
      });

    const setPhase = (next: number, duration: number) => {
      phaseRef.current = next;
      phase.value = withTiming(next, { duration, easing: Easing.linear });
    };

    const idleMotion = () => {
      if (!profile.idleDrift) {
        cancelAnimation(phase);
        phase.value = phaseRef.current;
        return;
      }
      setPhase(phaseRef.current + 1.25, Math.round(1300 / profile.speed));
    };

    const moveTo = (
      nx: number,
      ny: number,
      duration: number,
      easing: (v: number) => number,
      opts?: { flipFacing?: boolean },
    ) =>
      new Promise<void>((resolve) => {
        if (!aliveRef.current || caught.value) {
          resolve();
          return;
        }
        if (opts?.flipFacing !== false && gait !== 'crab') {
          facing.value = facingToward(posRef.current.x, nx);
        }
        posRef.current = { x: nx, y: ny };
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        x.value = withTiming(nx, { duration, easing }, () => {
          runOnJS(finish)();
        });
        y.value = withTiming(ny, { duration, easing });
      });

    const travelTo = async (
      nx: number,
      ny: number,
      pace: number,
      opts?: { flipFacing?: boolean; soundGap?: [number, number] },
    ) => {
      if (!aliveRef.current || caught.value) return;

      const dist = Math.hypot(nx - posRef.current.x, ny - posRef.current.y);
      const speed = Math.max(32, profile.cruiseSpeed * profile.speed * speedMultiplier * pace);
      const duration = Math.round(clamp((dist / speed) * 1000, 520, 4000));
      const steps = Math.max(0.8, dist / stridePx);

      const gap = opts?.soundGap ?? [260, 420];
      const endAt = Date.now() + duration;
      void (async () => {
        while (aliveRef.current && !caught.value && Date.now() < endAt) {
          soundsRef.current.playMove(emoji);
          await wait(rand(gap[0], gap[1]));
        }
      })();

      const pathEase = isWalker(gait)
        ? Easing.linear
        : gait === 'bunny'
          ? Easing.inOut(Easing.quad)
          : Easing.inOut(Easing.sin);

      setPhase(phaseRef.current + steps, duration);
      await moveTo(nx, ny, duration, pathEase, opts);
      idleMotion();
    };

    const fieldPoint = () => {
      const insetX = screenWidth * 0.14;
      const insetY = screenHeight * 0.14;
      const loX = Math.max(minX, insetX);
      const hiX = Math.min(maxX, screenWidth - insetX - creature.size);
      const loY = Math.max(minY, insetY);
      const hiY = Math.min(maxY, screenHeight - insetY - creature.size);

      if (gait === 'crab') {
        return {
          x: rand(loX, hiX),
          y: clamp(posRef.current.y + rand(-creature.size * 0.2, creature.size * 0.2), loY, hiY),
        };
      }
      if (isSwimmer(gait)) {
        return {
          x: rand(loX, hiX),
          y: clamp(posRef.current.y + rand(-creature.size * 0.85, creature.size * 0.85), loY, hiY),
        };
      }
      if (isWalker(gait)) {
        const heading = rand(0, Math.PI * 2);
        const reach = creature.size * rand(1.5, 2.8);
        return {
          x: clamp(posRef.current.x + Math.cos(heading) * reach, loX, hiX),
          y: clamp(posRef.current.y + Math.sin(heading) * reach * 0.8, loY, hiY),
        };
      }
      return { x: rand(loX, hiX), y: rand(loY, hiY) };
    };

    const doPause = async () => {
      idleMotion();
      await wait(
        Math.round(
          gait === 'bee' || gait === 'shrimp' || gait === 'squirrel'
            ? rand(350, 850)
            : rand(550, 1400),
        ),
      );
    };

    const doCruise = async () => {
      const target = fieldPoint();
      const pace = isWalker(gait)
        ? rand(0.8, 1.05)
        : isSwimmer(gait)
          ? rand(0.9, 1.15)
          : rand(0.85, 1.15);

      if (gait === 'crab') {
        facing.value = target.x >= posRef.current.x ? 1 : -1;
        await travelTo(target.x, target.y, pace, { flipFacing: false, soundGap: [200, 340] });
        return;
      }

      if (gait === 'bunny') {
        soundsRef.current.playBurst(emoji);
        const apexX = (posRef.current.x + target.x) / 2;
        const apexY = Math.min(posRef.current.y, target.y) - creature.size * rand(0.35, 0.55);
        const upDist = Math.hypot(apexX - posRef.current.x, apexY - posRef.current.y);
        const upDur = Math.round(clamp((upDist / (profile.cruiseSpeed * 1.15)) * 1000, 240, 500));
        setPhase(phaseRef.current + 0.5, upDur);
        await moveTo(apexX, apexY, upDur, Easing.out(Easing.quad));
        if (!aliveRef.current || caught.value) return;
        await travelTo(target.x, target.y, 1.1, { soundGap: [180, 280] });
        return;
      }

      if (gait === 'jelly') {
        const strokes = Math.round(rand(3, 5));
        for (let i = 0; i < strokes; i++) {
          if (!aliveRef.current || caught.value) return;
          const p = fieldPoint();
          await travelTo(
            clamp(posRef.current.x + (p.x - posRef.current.x) * 0.4, minX, maxX),
            clamp(posRef.current.y + (p.y - posRef.current.y) * 0.4, minY, maxY),
            0.85,
            { soundGap: [400, 650] },
          );
          await wait(Math.round(rand(180, 360)));
        }
        return;
      }

      await travelTo(target.x, target.y, pace);
    };

    const doBurst = async () => {
      soundsRef.current.playBurst(emoji);
      const target = fieldPoint();
      const pace = rand(1.35, 1.75);
      if (gait === 'crab') {
        facing.value = target.x >= posRef.current.x ? 1 : -1;
        await travelTo(target.x, target.y, pace, { flipFacing: false, soundGap: [140, 240] });
        return;
      }
      await travelTo(target.x, target.y, pace, { soundGap: [150, 260] });
    };

    const enterPlayfield = async () => {
      const insetX = screenWidth * 0.18;
      const insetY = screenHeight * 0.18;
      const target = {
        x: rand(Math.max(minX, insetX), Math.min(maxX, screenWidth - insetX - creature.size)),
        y: rand(Math.max(minY, insetY), Math.min(maxY, screenHeight - insetY - creature.size)),
      };
      if (gait === 'crab') {
        facing.value = target.x >= posRef.current.x ? 1 : -1;
        await travelTo(target.x, clamp(start.y, minY, maxY), 0.95, { flipFacing: false });
      } else if (isSwimmer(gait)) {
        await travelTo(target.x, clamp(posRef.current.y, minY, maxY), 1);
        if (aliveRef.current && !caught.value) await travelTo(target.x, target.y, 0.9);
      } else {
        await travelTo(target.x, target.y, 0.95);
      }
    };

    const leavePlayfield = async () => {
      const exit = offscreenSpot(creature.edge, creature.size, creature.nestX, creature.nestY);
      await travelTo(exit.x, exit.y, 0.95, { flipFacing: gait !== 'crab' });
    };

    const runLife = async () => {
      await enterPlayfield();
      if (!aliveRef.current || caught.value) return;

      const actions = Math.round(rand(7, 13));
      for (let i = 0; i < actions; i++) {
        if (!aliveRef.current || caught.value) return;
        const roll = Math.random();
        if (gait === 'bunny' || gait === 'bee') {
          if (roll < 0.28) await doPause();
          else await doCruise();
        } else if (isWalker(gait) || isSwimmer(gait)) {
          if (roll < 0.2) await doPause();
          else if (roll < 0.85) await doCruise();
          else await doBurst();
        } else if (roll < 0.22) {
          await doPause();
        } else if (roll < 0.8) {
          await doCruise();
        } else {
          await doBurst();
        }
      }

      if (!aliveRef.current || caught.value) return;
      await leavePlayfield();
      if (aliveRef.current && !caught.value) {
        runOnJS(onExit)(creature.id);
      }
    };

    idleMotion();
    void runLife();

    return () => {
      aliveRef.current = false;
      for (const t of timersRef.current) clearTimeout(t);
      timersRef.current = [];
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(phase);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creature.id]);

  const wrapStyle = useAnimatedStyle(() => {
    const cycle = phase.value * Math.PI * 2;
    let bobY = 0;
    let sway = 0;
    let squashX = 1;
    let squashY = 1;

    if (isFlyer(gait)) {
      // Wing flap read: rapid horizontal squash + soft loft.
      const flap = 0.72 + (Math.sin(cycle) * 0.5 + 0.5) * 0.28;
      squashX = flap;
      squashY = 1 + (1 - flap) * 0.12;
      bobY = Math.sin(cycle * 0.5) * 5;
      sway = Math.sin(cycle * 0.35) * 8;
    } else if (gait === 'fish') {
      // Swim: side-to-side body wave, soft vertical drift.
      sway = Math.sin(cycle) * 10;
      bobY = Math.sin(cycle * 0.5) * 4;
      squashX = 1 + Math.sin(cycle) * 0.04;
    } else if (gait === 'jelly') {
      const pulse = (Math.sin(cycle) + 1) / 2;
      squashX = 0.88 + pulse * 0.2;
      squashY = 1.12 - pulse * 0.22;
      bobY = Math.sin(cycle) * 6;
    } else if (gait === 'shrimp') {
      sway = Math.sin(cycle) * 12;
      squashX = 1 + Math.sin(cycle) * 0.06;
    } else if (gait === 'bunny') {
      const hop = Math.max(0, Math.sin(cycle));
      bobY = hop * 10;
      squashX = 1 + hop * 0.08;
      squashY = 1 - hop * 0.1;
    } else if (isWalker(gait)) {
      // Walk: alternating step bob + slight roll (reads as leg cadence on an emoji).
      bobY = Math.abs(Math.sin(cycle)) * (gait === 'lizard' ? 7 : 5);
      sway = Math.sin(cycle) * (gait === 'lizard' ? 9 : 6);
      squashY = 1 - Math.abs(Math.sin(cycle)) * 0.04;
    } else {
      bobY = Math.sin(cycle) * 3;
      sway = Math.sin(cycle) * 4;
    }

    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value + bobY },
        { scaleX: facing.value * scale.value * squashX },
        { scaleY: scale.value * squashY },
        { rotate: `${sway}deg` },
      ],
      opacity: opacity.value,
    };
  });

  const handlePress = () => {
    if (caught.value) return;
    caught.value = true;
    aliveRef.current = false;
    cancelAnimation(x);
    cancelAnimation(y);
    cancelAnimation(phase);
    scale.value = withTiming(1.4, { duration: 110 });
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
        wrapStyle,
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

const webHitStyle =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as object) : null;
const webEmojiStyle =
  Platform.OS === 'web' ? ({ userSelect: 'none' } as unknown as object) : null;

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
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
