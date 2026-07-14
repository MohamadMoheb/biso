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

type GaitKind = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
// 0=other 1=flyer 2=fish 3=jelly 4=shrimp 5=bunny 6=lizard 7=walker 8=bee

function gaitKind(gait: Gait): GaitKind {
  if (gait === 'bee') return 8;
  if (gait === 'butterfly' || gait === 'bird') return 1;
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

function exitSpot(
  edge: SpawnEdge,
  size: number,
  currentX: number,
  currentY: number,
  screenWidth: number,
  screenHeight: number,
): { x: number; y: number } {
  switch (edge) {
    case 'left':
      return { x: -size * 1.15, y: currentY };
    case 'right':
      return { x: screenWidth + size * 0.35, y: currentY };
    case 'top':
      return { x: currentX, y: -size * 1.15 };
    case 'bottom':
      return { x: currentX, y: screenHeight + size * 0.35 };
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
  const speedMultRef = useRef(speedMultiplier);
  const posRef = useRef({ x: start.x, y: start.y });
  const phaseRef = useRef(0);
  const soundsRef = useRef(sounds);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pauseResolversRef = useRef<Array<() => void>>([]);
  soundsRef.current = sounds;
  pausedRef.current = paused;
  speedMultRef.current = speedMultiplier;

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
        const turnScale = 1 / Math.max(0.4, speedMultRef.current);
        await wait(Math.round(rand(90, 180) * turnScale));
      }
    };

    const idleMotion = () => {
      if (pausedRef.current) return;
      if (!aliveRef.current || caught.value) return;
      if (!profile.idleDrift) {
        cancelAnimation(phase);
        phase.value = phaseRef.current;
        return;
      }
      // Bees keep a continuous buzz even while hovering.
      const cycles = gait === 'bee' ? 3.5 : 1.25;
      const baseMs = gait === 'bee' ? 420 : 1300;
      const duration = Math.round(
        baseMs / (profile.speed * Math.max(0.5, speedMultRef.current)),
      );
      const next = phaseRef.current + cycles;
      phaseRef.current = next;
      phase.value = withTiming(next, { duration, easing: Easing.linear }, (finished) => {
        if (finished && aliveRef.current && !caught.value && !pausedRef.current) {
          runOnJS(idleMotion)();
        }
      });
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
      opts?: {
        soundGap?: [number, number];
        turnPause?: boolean;
        /** travel feel: slow creep, normal, or accelerating zoom */
        feel?: 'lurk' | 'wander' | 'zoom';
      },
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
        await faceTowardX(nx, {
          turnPause: opts?.feel === 'zoom' ? false : opts?.turnPause,
        });
      }
      if (!aliveRef.current || caught.value) return;
      await waitWhilePaused();
      if (!aliveRef.current || caught.value || pausedRef.current) return;

      const dist = Math.hypot(nx - posRef.current.x, ny - posRef.current.y);
      const mult = Math.max(0.35, speedMultRef.current);
      const feel = opts?.feel ?? 'wander';
      const feelBoost = feel === 'zoom' ? rand(2.4, 3.6) : feel === 'lurk' ? rand(0.35, 0.55) : rand(0.85, 1.2);
      const speed = Math.max(28, profile.cruiseSpeed * profile.speed * mult * pace * feelBoost);
      const minDur =
        feel === 'zoom'
          ? Math.round(90 / Math.sqrt(mult))
          : feel === 'lurk'
            ? Math.round(280 / Math.sqrt(mult))
            : Math.round(150 / Math.sqrt(mult));
      const maxDur =
        feel === 'zoom'
          ? Math.round(1600 / Math.sqrt(mult))
          : feel === 'lurk'
            ? Math.round(4200 / Math.sqrt(mult))
            : Math.round(3000 / Math.sqrt(mult));
      const duration = Math.round(clamp((dist / speed) * 1000, minDur, maxDur));
      const steps = Math.max(0.8, dist / stridePx);

      const gap =
        opts?.soundGap ??
        (feel === 'zoom' ? ([80, 150] as [number, number]) : feel === 'lurk' ? [620, 980] : [420, 680]);
      const endAt = Date.now() + duration;
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

      const pathEase =
        feel === 'zoom'
          ? Easing.in(Easing.cubic)
          : feel === 'lurk'
            ? Easing.out(Easing.quad)
            : isWalker(gait)
              ? Easing.linear
              : gait === 'bunny'
                ? Easing.inOut(Easing.quad)
                : Easing.inOut(Easing.sin);

      const phaseBoost = gait === 'bee' ? 5.5 : feel === 'zoom' ? 1.6 : 1;
      setPhase(phaseRef.current + steps * phaseBoost, duration);
      await moveTo(nx, ny, duration, pathEase);
      await waitWhilePaused();
      if (!aliveRef.current || caught.value) return;
      idleMotion();
    };

    const playBounds = () => {
      const margin = Math.max(8, creature.size * 0.06);
      return {
        loX: Math.max(minX, margin),
        hiX: Math.min(maxX, screenWidth - creature.size - margin),
        loY: Math.max(minY, margin),
        hiY: Math.min(maxY, screenHeight - creature.size - margin),
      };
    };

    const edgeHidePoint = () => {
      const { loX, hiX, loY, hiY } = playBounds();
      const band = Math.max(24, creature.size * 0.55);
      const roll = Math.random();
      if (roll < 0.25) return { x: loX + rand(0, band * 0.35), y: rand(loY, hiY) };
      if (roll < 0.5) return { x: hiX - rand(0, band * 0.35), y: rand(loY, hiY) };
      if (roll < 0.75) return { x: rand(loX, hiX), y: loY + rand(0, band * 0.35) };
      return { x: rand(loX, hiX), y: hiY - rand(0, band * 0.35) };
    };

    const cornerHidePoint = () => {
      const { loX, hiX, loY, hiY } = playBounds();
      const inset = Math.max(10, creature.size * 0.2);
      const corners = [
        { x: loX + inset, y: loY + inset },
        { x: hiX - inset, y: loY + inset },
        { x: loX + inset, y: hiY - inset },
        { x: hiX - inset, y: hiY - inset },
      ];
      const pick = corners[Math.floor(Math.random() * corners.length)]!;
      return {
        x: clamp(pick.x + rand(-inset, inset), loX, hiX),
        y: clamp(pick.y + rand(-inset, inset), loY, hiY),
      };
    };

    const farDartPoint = () => {
      const { loX, hiX, loY, hiY } = playBounds();
      const cx = posRef.current.x;
      const cy = posRef.current.y;
      const span = Math.min(screenWidth, screenHeight);
      for (let i = 0; i < 10; i++) {
        const x = rand(loX, hiX);
        const y = rand(loY, hiY);
        if (Math.hypot(x - cx, y - cy) > span * 0.45) return { x, y };
      }
      return edgeHidePoint();
    };

    /** Sweep nearly edge-to-edge for a zoom streak. */
    const zoomCorridorPoint = () => {
      const { loX, hiX, loY, hiY } = playBounds();
      const axis = Math.random() < 0.55 ? 'x' : 'y';
      if (axis === 'x') {
        const toRight = posRef.current.x < (loX + hiX) / 2;
        return {
          x: toRight ? hiX - rand(0, creature.size * 0.2) : loX + rand(0, creature.size * 0.2),
          y: clamp(posRef.current.y + rand(-screenHeight * 0.2, screenHeight * 0.2), loY, hiY),
        };
      }
      const toBottom = posRef.current.y < (loY + hiY) / 2;
      return {
        x: clamp(posRef.current.x + rand(-screenWidth * 0.2, screenWidth * 0.2), loX, hiX),
        y: toBottom ? hiY - rand(0, creature.size * 0.2) : loY + rand(0, creature.size * 0.2),
      };
    };

    const fieldPoint = (preferForward = true) => {
      const { loX, hiX, loY, hiY } = playBounds();
      const dir = facing.value >= 0 ? 1 : -1;

      if (gait === 'crab') {
        return Math.random() < 0.55
          ? edgeHidePoint()
          : {
              x: rand(loX, hiX),
              y: clamp(posRef.current.y + rand(-creature.size * 0.4, creature.size * 0.4), loY, hiY),
            };
      }

      if (preferForward && (isSwimmer(gait) || isWalker(gait) || isFlyer(gait) || gait === 'bunny')) {
        const style = Math.random();
        if (style < 0.22) return edgeHidePoint();
        if (style < 0.38) return farDartPoint();

        const goForward = Math.random() < 0.7;
        const sign = goForward ? dir : -dir;
        const reachScale = 1.2 + 0.5 * Math.max(0.35, speedMultRef.current);
        const reach = creature.size * rand(2.4, 5.2) * reachScale;
        const dx = sign * reach * rand(0.65, 1);
        const dyRange =
          (isSwimmer(gait)
            ? creature.size * 1.5
            : isFlyer(gait)
              ? creature.size * 2.3
              : creature.size * 1.8) * reachScale;
        return {
          x: clamp(posRef.current.x + dx, loX, hiX),
          y: clamp(posRef.current.y + rand(-dyRange, dyRange), loY, hiY),
        };
      }

      return Math.random() < 0.45 ? edgeHidePoint() : { x: rand(loX, hiX), y: rand(loY, hiY) };
    };

    const doLurk = async () => {
      idleMotion();
      // Creep, stop, peek — small edge-local moves at crawl speed.
      const peeks = Math.round(rand(1, 3));
      for (let i = 0; i < peeks; i++) {
        if (!aliveRef.current || caught.value) return;
        const base = Math.random() < 0.7 ? edgeHidePoint() : cornerHidePoint();
        const { loX, hiX, loY, hiY } = playBounds();
        const target = {
          x: clamp(base.x + rand(-creature.size * 0.5, creature.size * 0.5), loX, hiX),
          y: clamp(base.y + rand(-creature.size * 0.5, creature.size * 0.5), loY, hiY),
        };
        await travelTo(target.x, target.y, rand(0.7, 1), {
          feel: 'lurk',
          soundGap: [700, 1100],
          turnPause: true,
        });
        if (!aliveRef.current || caught.value) return;
        await wait(Math.round(rand(280, 900) / Math.max(0.5, speedMultRef.current)));
      }
    };

    const doWander = async () => {
      const target = fieldPoint(true);
      const pace = rand(0.9, 1.25);

      if (gait === 'bunny') {
        soundsRef.current.playBurst(emoji);
        await faceTowardX(target.x);
        if (!aliveRef.current || caught.value) return;
        await waitWhilePaused();
        if (!aliveRef.current || caught.value || pausedRef.current) return;
        const apexX = (posRef.current.x + target.x) / 2;
        const apexY = Math.min(posRef.current.y, target.y) - creature.size * rand(0.35, 0.55);
        const upDist = Math.hypot(apexX - posRef.current.x, apexY - posRef.current.y);
        const hopSpeed = profile.cruiseSpeed * 1.4 * Math.max(0.4, speedMultRef.current);
        const upDur = Math.round(clamp((upDist / hopSpeed) * 1000, 110, 420));
        setPhase(phaseRef.current + 0.5, upDur);
        await moveTo(apexX, apexY, upDur, Easing.out(Easing.quad));
        if (!aliveRef.current || caught.value) return;
        await waitWhilePaused();
        if (!aliveRef.current || caught.value || pausedRef.current) return;
        await travelTo(target.x, target.y, 1.2, {
          feel: 'wander',
          soundGap: [140, 220],
          turnPause: false,
        });
        return;
      }

      if (gait === 'jelly') {
        const strokes = Math.round(rand(2, 4));
        for (let i = 0; i < strokes; i++) {
          if (!aliveRef.current || caught.value) return;
          const p = Math.random() < 0.4 ? edgeHidePoint() : fieldPoint(true);
          await travelTo(
            clamp(posRef.current.x + (p.x - posRef.current.x) * 0.55, minX, maxX),
            clamp(posRef.current.y + (p.y - posRef.current.y) * 0.55, minY, maxY),
            rand(0.9, 1.15),
            { feel: 'wander', soundGap: [320, 520] },
          );
          await wait(Math.round(rand(80, 200)));
        }
        return;
      }

      await travelTo(target.x, target.y, pace, { feel: 'wander' });
    };

    const doZoom = async () => {
      soundsRef.current.playBurst(emoji);
      // One or two consecutive full-screen sweeps — accelerate mid-path feel via easing + pace.
      const legs = Math.random() < 0.45 ? 2 : 1;
      for (let i = 0; i < legs; i++) {
        if (!aliveRef.current || caught.value) return;
        const target = i === 0 && Math.random() < 0.7 ? zoomCorridorPoint() : farDartPoint();
        await travelTo(target.x, target.y, rand(1.1, 1.4), {
          feel: 'zoom',
          soundGap: [70, 130],
          turnPause: false,
        });
        if (i < legs - 1) await wait(Math.round(rand(20, 70)));
      }
      // Soft landing after a sprint.
      if (aliveRef.current && !caught.value && Math.random() < 0.55) {
        await wait(Math.round(rand(120, 380)));
      }
    };

    const doFakeOut = async () => {
      // Feint one way, then rocket the other — unpredictable.
      const { loX, hiX, loY, hiY } = playBounds();
      const feint = {
        x: clamp(posRef.current.x + rand(-creature.size * 1.2, creature.size * 1.2), loX, hiX),
        y: clamp(posRef.current.y + rand(-creature.size * 1.2, creature.size * 1.2), loY, hiY),
      };
      await travelTo(feint.x, feint.y, 0.9, { feel: 'lurk', turnPause: false, soundGap: [400, 600] });
      if (!aliveRef.current || caught.value) return;
      await wait(Math.round(rand(60, 180)));
      if (!aliveRef.current || caught.value) return;
      soundsRef.current.playBurst(emoji);
      const bolt = zoomCorridorPoint();
      await travelTo(bolt.x, bolt.y, 1.25, {
        feel: 'zoom',
        turnPause: false,
        soundGap: [70, 120],
      });
    };

    const enterPlayfield = async () => {
      const target = Math.random() < 0.65 ? edgeHidePoint() : farDartPoint();
      await faceTowardX(target.x, { turnPause: false });

      if (gait === 'crab') {
        facing.value = facingToward(posRef.current.x, target.x);
        await travelTo(target.x, clamp(start.y, minY, maxY), 1.1, {
          feel: 'wander',
          turnPause: false,
        });
      } else if (isSwimmer(gait)) {
        await travelTo(target.x, clamp(posRef.current.y, minY, maxY), 1.15, {
          feel: Math.random() < 0.35 ? 'zoom' : 'wander',
          turnPause: false,
        });
        if (aliveRef.current && !caught.value) {
          await travelTo(target.x, target.y, 1.05, { feel: 'wander', turnPause: false });
        }
      } else {
        await travelTo(target.x, target.y, 1.15, {
          feel: Math.random() < 0.4 ? 'zoom' : 'wander',
          turnPause: false,
        });
      }
    };

    const leavePlayfield = async () => {
      const exit = exitSpot(
        creature.edge,
        creature.size,
        posRef.current.x,
        posRef.current.y,
        screenWidth,
        screenHeight,
      );
      await travelTo(exit.x, exit.y, 1.15, {
        feel: Math.random() < 0.5 ? 'zoom' : 'wander',
        turnPause: false,
      });
    };

    type Mood = 'lurk' | 'wander' | 'zoom';
    const pickMood = (prev: Mood): Mood => {
      const roll = Math.random();
      // After lurk → often explode into a zoom. After zoom → settle. Keeps rhythm surprising.
      if (prev === 'lurk') {
        if (roll < 0.55) return 'zoom';
        if (roll < 0.8) return 'wander';
        return 'lurk';
      }
      if (prev === 'zoom') {
        if (roll < 0.5) return 'lurk';
        if (roll < 0.8) return 'wander';
        return 'zoom';
      }
      if (roll < 0.28) return 'lurk';
      if (roll < 0.55) return 'zoom';
      return 'wander';
    };

    const runLife = async () => {
      await waitWhilePaused();
      await enterPlayfield();
      if (!aliveRef.current || caught.value) return;

      const mult = Math.max(0.4, speedMultRef.current);
      let mood: Mood = Math.random() < 0.45 ? 'wander' : Math.random() < 0.5 ? 'lurk' : 'zoom';
      const beats = Math.round(rand(8, 15) * (0.9 + 0.2 * mult));

      for (let i = 0; i < beats; i++) {
        if (!aliveRef.current || caught.value) return;
        await waitWhilePaused();
        if (!aliveRef.current || caught.value) return;

        // Sticky mood for 1–3 beats, then flip — variable energy, not flat cruise.
        if (i === 0 || Math.random() < 0.42) {
          mood = pickMood(mood);
        }

        if (mood === 'lurk') {
          await doLurk();
        } else if (mood === 'zoom') {
          if (Math.random() < 0.28) await doFakeOut();
          else await doZoom();
        } else if (Math.random() < 0.18) {
          // Occasional sneak tuck while wandering.
          const hide = Math.random() < 0.5 ? cornerHidePoint() : edgeHidePoint();
          await travelTo(hide.x, hide.y, rand(1.1, 1.4), { feel: 'wander', turnPause: false });
          await wait(Math.round(rand(200, 560)));
        } else {
          await doWander();
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
    } else if (k === 8) {
      // Fast wing buzz — rapid X squash reads as flapping on the emoji.
      const wing = Math.sin(cycle * 14);
      const open = wing * 0.5 + 0.5;
      squashX = 0.55 + open * 0.5;
      squashY = 1.08 - open * 0.16;
      bobY = Math.sin(cycle * 2.2) * 3.5 + wing * 1.4;
      sway = Math.sin(cycle * 1.1) * 5;
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
