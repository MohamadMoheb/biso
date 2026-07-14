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
};

const MAX_ON_SCREEN = 10;
const SPAWN_INTERVAL_MS = 700;
const MIN_SIZE = 42;
const MAX_SIZE = 72;
const MIN_DURATION = 2800;
const MAX_DURATION = 6500;
const EDGE_PAD = 80;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickEntity(entities: string[]): string {
  return entities[Math.floor(Math.random() * entities.length)] ?? entities[0] ?? '🐾';
}

export function useSpawner(theme: Theme | null, active: boolean, screenWidth: number, screenHeight: number) {
  const [creatures, setCreatures] = useState<CreatureSpawn[]>([]);
  const idRef = useRef(0);

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
        if (prev.length >= MAX_ON_SCREEN) return prev;

        const goRight = Math.random() >= 0.5;
        const startX = goRight ? -EDGE_PAD : screenWidth + EDGE_PAD;
        const endX = goRight ? screenWidth + EDGE_PAD : -EDGE_PAD;
        const size = Math.round(rand(MIN_SIZE, MAX_SIZE));
        const y = rand(size * 0.5, Math.max(size, screenHeight - size * 1.5));

        idRef.current += 1;
        const next: CreatureSpawn = {
          id: `creature-${idRef.current}`,
          emoji: pickEntity(theme.entities),
          size,
          y,
          startX,
          endX,
          duration: Math.round(rand(MIN_DURATION, MAX_DURATION)),
        };
        return [...prev, next];
      });
    };

    spawn();
    const timer = setInterval(spawn, SPAWN_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [active, theme, screenWidth, screenHeight]);

  useEffect(() => {
    if (!active) {
      setCreatures([]);
    }
  }, [active]);

  return { creatures, removeCreature };
}
