import { memo, useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

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

/** World facing: 1 = looking/moving right, -1 = left. */
function facingToward(fromX: number, toX: number): 1 | -1 {
  return toX >= fromX ? 1 : -1;
}

/**
 * Most animal emoji glyphs face left in their artwork.
 * Display uses scaleX = DISPLAY_FACE * facing so they look the way they travel.
 */
const DISPLAY_FACE = -1;
const FACE_FLIP_MIN_DX = 10;

type GaitKind = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
// 0=other 1=flyer 2=fish 3=jelly 4=shrimp 5=bunny 6=lizard 7=walker

function gaitKind(gait: Gait): GaitKind {
  if (gait === 'butterfly' || gait === 'bird' || gait === 'bee') return 1;
  if (gait === 'fish') return 2;
  if (gait === 'jelly') return 3;
  if (gait === 'shrimp') return 4;
  if (gait === 'bunny') return 5;
  if (gait === 'lizard') return 6;
  if (
    gait === 'beetle' ||
    gait === 'crab' ||
    gait === 'scorpion' ||
    gait === 'ladybug' ||
    gait === 'squirrel'
  ) {
    return 7;
  }
  return 0;
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

function CreatureComponent({
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
  const kind = gaitKind(gait);
  const start = offscreenSpot(creature.edge, creature.size, creature.nestX, creature.nestY);

  const x = useSharedValue(start.x);
  const y = useSharedValue(start.y);
  const facing = useSharedValue<number>(creature.edge === 'right' ? -1 : 1);
  const phase = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const caught = useSharedValue(false);
  const frozen = useSharedValue(paused ? 1 : 0);
  const kindSv = useSharedValue<GaitKind>(kind);

  const aliveRef = useRef(true);
  const pausedRef = useRef(paused);
  const posRef = useRef({ x: start.x, y: start.y });
  const phaseRef = useRef(0);
  const soundsRef = useRef(sounds);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pauseResolversRef = useRef<Array<() => void>>([]);
  soundsRef.current = sounds;
  pausedRef.current = paused;

  // Freeze in-flight motion when paused; wake waiters on resume.
  useEffect(() => {
    frozen.value = paused ? 1 : 0;
    if (paused) {
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(phase);
      posRef.current = { x: x.value, y: y.value };
      return;
    }
    const resolvers = pauseResolversRef.current.splice(0);
    for (const resolve of resolvers) resolve();
  }, [paused, frozen, phase, x, y]);

  const pad = Math.max(16, creature.size * 0.12);
  const minX = pad;
  const maxX = Math.max(pad, screenWidth - creature.size - pad);
  const minY = pad;
  const maxY = Math.max(pad, screenHeight - creature.size - pad);

  useEffect(() => {
    aliveRef.current = true;
    const emoji = creature.emoji;
    const stridePx = Math.max(28, creature.size * profile.stride);

    const waitWhilePaused = () =>
      new Promise<void>((resolve) => {
        if (!aliveRef.current || caught.value || !pausedRef.current) {
          resolve();
          return;
        }
        pauseResolversRef.current.push(resolve);
      });

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        if (!aliveRef.current || caught.value) {
          resolve();
          return;
        }
        const t = setTimeout(() => {
          void waitWhilePaused().then(resolve);
        }, ms);
        timersRef.current.push(t);
      });

    const setPhase = (next: number, duration: number) => {
      if (pausedRef.current) return;
      phaseRef.current = next;
      phase.value = withTiming(next, { duration, easing: Easing.linear });
    };

    const faceTowardX = async (nx: number, opts?: { turnPause?: boolean }) => {
      await waitWhilePaused();
      if (!aliveRef.current || caught.value) return;
      const dx = nx - posRef.current.x;
      if (Math.abs(dx) < FACE_FLIP_MIN_DX) return;
      const next = facingToward(posRef.current.x, nx);
      if (next === facing.value) return;
      facing.value = next;
      if (opts?.turnPause !== false) {
        await wait(Math.round(rand(90, 180)));
      }
    };

    const idleMotion = () => {
      if (pausedRef.current) return;
      if (!profile.idleDrift) {
        cancelAnimation(phase);
        phase.value = phaseRef.current;
        return;
      }
      setPhase(phaseRef.current + 1.25, Math.round(1300 / profile.speed));
    };

    const moveTo = (nx: number, ny: number, duration: number, easing: (v: number) => number) =>
      new Promise<void>((resolve) => {
        if (!aliveRef.current || caught.value || pausedRef.current) {
          resolve();
          return;
        }
        let settled = false;
        const finish = (finished: boolean) => {
          if (settled) return;
          settled = true;
          if (finished) {
            posRef.current = { x: nx, y: ny };
          } else {
            posRef.current = { x: x.value, y: y.value };
          }
          resolve();
        };
        x.value = withTiming(nx, { duration, easing }, (finished) => {
          runOnJS(finish)(finished !== false);
        });
        y.value = withTiming(ny, { duration, easing });
      });

    const travelTo = async (
      nx: number,
      ny: number,
      pace: number,
      opts?: { soundGap?: [number, number]; turnPause?: boolean },
    ) => {
      if (!aliveRef.current || caught.value) return;
      await waitWhilePaused();
      if (!aliveRef.current || caught.value) return;

      // Turn to face the destination before moving — never moonwalk.
      if (gait === 'crab') {
        const dx = nx - posRef.current.x;
        if (Math.abs(dx) >= FACE_FLIP_MIN_DX) {
          facing.value = facingToward(posRef.current.x, nx);
        }
      } else {
        await faceTowardX(nx, { turnPause: opts?.turnPause });
      }
      if (!aliveRef.current || caught.value) return;
      await waitWhilePaused();
      if (!aliveRef.current || caught.value || pausedRef.current) return;

      const dist = Math.hypot(nx - posRef.current.x, ny - posRef.current.y);
      const speed = Math.max(32, profile.cruiseSpeed * profile.speed * speedMultiplier * pace);
      const duration = Math.round(clamp((dist / speed) * 1000, 520, 4000));
      const steps = Math.max(0.8, dist / stridePx);

      const gap = opts?.soundGap ?? [480, 720];
      const endAt = Date.now() + duration;
      // Sparse move sounds — global throttle in the sound hook also helps.
      void (async () => {
        while (aliveRef.current && !caught.value && Date.now() < endAt) {
          if (pausedRef.current) {
            await waitWhilePaused();
            continue;
          }
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
      await moveTo(nx, ny, duration, pathEase);
      await waitWhilePaused();
      if (!aliveRef.current || caught.value) return;
      idleMotion();
    };

    const fieldPoint = (preferForward = true) => {
      const insetX = screenWidth * 0.14;
      const insetY = screenHeight * 0.14;
      const loX = Math.max(minX, insetX);
      const hiX = Math.min(maxX, screenWidth - insetX - creature.size);
      const loY = Math.max(minY, insetY);
      const hiY = Math.min(maxY, screenHeight - insetY - creature.size);
      const dir = facing.value >= 0 ? 1 : -1;

      if (gait === 'crab') {
        return {
          x: rand(loX, hiX),
          y: clamp(posRef.current.y + rand(-creature.size * 0.2, creature.size * 0.2), loY, hiY),
        };
      }

      // Bias destinations ahead of current facing so most motion is forward.
      if (preferForward && (isSwimmer(gait) || isWalker(gait) || isFlyer(gait) || gait === 'bunny')) {
        const goForward = Math.random() < 0.8;
        const sign = goForward ? dir : -dir;
        const reach = creature.size * rand(1.4, 3.2);
        const dx = sign * reach * rand(0.55, 1);
        const dyRange = isSwimmer(gait)
          ? creature.size * 0.85
          : isFlyer(gait)
            ? creature.size * 1.6
            : creature.size * 1.1;
        return {
          x: clamp(posRef.current.x + dx, loX, hiX),
          y: clamp(posRef.current.y + rand(-dyRange, dyRange), loY, hiY),
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
      const target = fieldPoint(true);
      const pace = isWalker(gait)
        ? rand(0.8, 1.05)
        : isSwimmer(gait)
          ? rand(0.9, 1.15)
          : rand(0.85, 1.15);

      if (gait === 'bunny') {
        soundsRef.current.playBurst(emoji);
        await faceTowardX(target.x);
        if (!aliveRef.current || caught.value) return;
        await waitWhilePaused();
        if (!aliveRef.current || caught.value || pausedRef.current) return;
        const apexX = (posRef.current.x + target.x) / 2;
        const apexY = Math.min(posRef.current.y, target.y) - creature.size * rand(0.35, 0.55);
        const upDist = Math.hypot(apexX - posRef.current.x, apexY - posRef.current.y);
        const upDur = Math.round(clamp((upDist / (profile.cruiseSpeed * 1.15)) * 1000, 240, 500));
        setPhase(phaseRef.current + 0.5, upDur);
        // Hop apex without flipping facing mid-jump.
        await moveTo(apexX, apexY, upDur, Easing.out(Easing.quad));
        if (!aliveRef.current || caught.value) return;
        await waitWhilePaused();
        if (!aliveRef.current || caught.value || pausedRef.current) return;
        await travelTo(target.x, target.y, 1.1, { soundGap: [180, 280], turnPause: false });
        return;
      }

      if (gait === 'jelly') {
        const strokes = Math.round(rand(3, 5));
        for (let i = 0; i < strokes; i++) {
          if (!aliveRef.current || caught.value) return;
          const p = fieldPoint(true);
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
      const target = fieldPoint(true);
      await travelTo(target.x, target.y, rand(1.35, 1.75), { soundGap: [140, 240] });
    };

    const enterPlayfield = async () => {
      const insetX = screenWidth * 0.18;
      const insetY = screenHeight * 0.18;
      const target = {
        x: rand(Math.max(minX, insetX), Math.min(maxX, screenWidth - insetX - creature.size)),
        y: rand(Math.max(minY, insetY), Math.min(maxY, screenHeight - insetY - creature.size)),
      };

      await faceTowardX(target.x, { turnPause: false });

      if (gait === 'crab') {
        facing.value = facingToward(posRef.current.x, target.x);
        await travelTo(target.x, clamp(start.y, minY, maxY), 0.95, { turnPause: false });
      } else if (isSwimmer(gait)) {
        // Horizontal first (already facing that way), then depth.
        await travelTo(target.x, clamp(posRef.current.y, minY, maxY), 1, { turnPause: false });
        if (aliveRef.current && !caught.value) {
          await travelTo(target.x, target.y, 0.9, { turnPause: false });
        }
      } else {
        await travelTo(target.x, target.y, 0.95, { turnPause: false });
      }
    };

    const leavePlayfield = async () => {
      const exit = offscreenSpot(creature.edge, creature.size, creature.nestX, creature.nestY);
      await travelTo(exit.x, exit.y, 0.95);
    };

    const runLife = async () => {
      await waitWhilePaused();
      await enterPlayfield();
      if (!aliveRef.current || caught.value) return;

      const actions = Math.round(rand(7, 13));
      for (let i = 0; i < actions; i++) {
        if (!aliveRef.current || caught.value) return;
        await waitWhilePaused();
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
      await waitWhilePaused();
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
      const resolvers = pauseResolversRef.current.splice(0);
      for (const resolve of resolvers) resolve();
      cancelAnimation(x);
      cancelAnimation(y);
      cancelAnimation(phase);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creature.id]);

  const wrapStyle = useAnimatedStyle(() => {
    if (frozen.value) {
      return {
        transform: [
          { translateX: x.value },
          { translateY: y.value },
          { scaleX: DISPLAY_FACE * facing.value * scale.value },
          { scaleY: scale.value },
          { rotate: '0deg' },
        ],
        opacity: opacity.value,
      };
    }

    const cycle = phase.value * Math.PI * 2;
    const k = kindSv.value;
    let bobY = 0;
    let sway = 0;
    let squashX = 1;
    let squashY = 1;

    if (k === 1) {
      const flap = 0.72 + (Math.sin(cycle) * 0.5 + 0.5) * 0.28;
      squashX = flap;
      squashY = 1 + (1 - flap) * 0.12;
      bobY = Math.sin(cycle * 0.5) * 5;
      sway = Math.sin(cycle * 0.35) * 6;
    } else if (k === 2) {
      const s = Math.sin(cycle);
      sway = s * 5;
      bobY = Math.sin(cycle * 0.5) * 3;
      squashX = 1 + s * 0.04;
    } else if (k === 3) {
      const pulse = (Math.sin(cycle) + 1) / 2;
      squashX = 0.88 + pulse * 0.2;
      squashY = 1.12 - pulse * 0.22;
      bobY = Math.sin(cycle) * 6;
    } else if (k === 4) {
      const s = Math.sin(cycle);
      sway = s * 6;
      squashX = 1 + s * 0.06;
    } else if (k === 5) {
      const hop = Math.max(0, Math.sin(cycle));
      bobY = hop * 10;
      squashX = 1 + hop * 0.08;
      squashY = 1 - hop * 0.1;
    } else if (k === 6) {
      const s = Math.sin(cycle);
      bobY = Math.abs(s) * 7;
      sway = s * 6;
      squashY = 1 - Math.abs(s) * 0.04;
    } else if (k === 7) {
      const s = Math.sin(cycle);
      bobY = Math.abs(s) * 5;
      sway = s * 4;
      squashY = 1 - Math.abs(s) * 0.04;
    } else {
      const s = Math.sin(cycle);
      bobY = s * 3;
      sway = s * 3;
    }

    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value + bobY },
        { scaleX: DISPLAY_FACE * facing.value * scale.value * squashX },
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

export const Creature = memo(CreatureComponent);
