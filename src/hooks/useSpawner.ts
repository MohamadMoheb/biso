import { useCallback, useEffect, useRef, useState } from 'react';

import type { Theme } from '../themes';

export type CreatureSpawn = {
  id: string;
  emoji: string;
  size: number;
  y: number;
  startX: number;
  endX: number;
  duration: number;
  /** +1 facing right, -1 facing left */
  facing: 1 | -1;
  bobAmplitude: number;
  bobCycles: number;
  swayDegrees: number;
  driftY: number;
};

const DEFAULT_MAX_ON_SCREEN = 8;
const MIN_SIZE = 42;
const MAX_SIZE = 72;
const MIN_DURATION = 3200;
const MAX_DURATION = 7800;
const EDGE_PAD = 80;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickEntity(entities: string[]): string {
  return entities[Math.floor(Math.random() * entities.length)] ?? entities[0] ?? '🐾';
}

function spawnIntervalForMax(maxOnScreen: number): number {
  // Fill the screen faster when more creatures are allowed.
  return Math.round(Math.max(280, 1100 - maxOnScreen * 45));
}

export function useSpawner(
  theme: Theme | null,
  active: boolean,
  screenWidth: number,
  screenHeight: number,
  maxOnScreen: number = DEFAULT_MAX_ON_SCREEN,
) {
  const [creatures, setCreatures] = useState<CreatureSpawn[]>([]);
  const idRef = useRef(0);
  const cappedMax = Math.max(1, Math.min(24, Math.round(maxOnScreen)));

  const removeCreature = useCallback((id: string) => {
    setCreatures((prev) => prev.filter((c) => c.id !== id));
  }, []);

  useEffect(() => {
    if (!active || !theme || screenWidth <= 0 || screenHeight <= 0) {
      setCreatures([]);
      return;
    }

    const spawn = () => {
      setCreatures((prev) => {
        if (prev.length >= cappedMax) return prev;

        const goRight = Math.random() >= 0.5;
        const startX = goRight ? -EDGE_PAD : screenWidth + EDGE_PAD;
        const endX = goRight ? screenWidth + EDGE_PAD : -EDGE_PAD;
        const size = Math.round(rand(MIN_SIZE, MAX_SIZE));
        const lanePad = size * 1.2;
        const y = rand(lanePad, Math.max(lanePad, screenHeight - lanePad));
        const bobAmplitude = rand(size * 0.22, size * 0.55);
        const bobCycles = rand(1.2, 3.4);
        // Soft vertical travel so paths aren't flat lanes.
        const driftY = rand(-size * 0.9, size * 0.9);

        idRef.current += 1;
        const next: CreatureSpawn = {
          id: `creature-${idRef.current}`,
          emoji: pickEntity(theme.entities),
          size,
          y,
          startX,
          endX,
          duration: Math.round(rand(MIN_DURATION, MAX_DURATION)),
          facing: goRight ? 1 : -1,
          bobAmplitude,
          bobCycles,
          swayDegrees: rand(6, 14),
          driftY,
        };
        return [...prev, next];
      });
    };

    spawn();
    const timer = setInterval(spawn, spawnIntervalForMax(cappedMax));
    return () => clearInterval(timer);
  }, [active, theme, screenWidth, screenHeight, cappedMax]);

  useEffect(() => {
    if (!active) {
      setCreatures([]);
    }
  }, [active]);

  useEffect(() => {
    setCreatures((prev) => (prev.length > cappedMax ? prev.slice(0, cappedMax) : prev));
  }, [cappedMax]);

  return { creatures, removeCreature };
}
