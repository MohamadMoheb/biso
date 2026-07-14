import { useCallback, useEffect, useRef, useState } from 'react';

import type { Theme, ThemeId } from '../themes';

export type SpawnEdge = 'left' | 'right' | 'top' | 'bottom';

export type CreatureSpawn = {
  id: string;
  emoji: string;
  size: number;
  edge: SpawnEdge;
  /** Peek nest — mostly off-screen */
  nestX: number;
  nestY: number;
  themeId: ThemeId;
};

const DEFAULT_MAX_ON_SCREEN = 8;
/** Big targets are easier for cats to track and bat. */
const MIN_SIZE = 118;
const MAX_SIZE = 190;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pickEntity(entities: string[]): string {
  return entities[Math.floor(Math.random() * entities.length)] ?? entities[0] ?? '🐾';
}

function pickEdge(): SpawnEdge {
  const edges: SpawnEdge[] = ['left', 'right', 'top', 'bottom'];
  return edges[Math.floor(Math.random() * edges.length)] ?? 'left';
}

function nestForEdge(
  edge: SpawnEdge,
  size: number,
  screenWidth: number,
  screenHeight: number,
): { nestX: number; nestY: number } {
  const margin = size * 0.15;
  switch (edge) {
    case 'left':
      return {
        nestX: -size * 0.72,
        nestY: rand(margin, Math.max(margin, screenHeight - size - margin)),
      };
    case 'right':
      return {
        nestX: screenWidth - size * 0.28,
        nestY: rand(margin, Math.max(margin, screenHeight - size - margin)),
      };
    case 'top':
      return {
        nestX: rand(margin, Math.max(margin, screenWidth - size - margin)),
        nestY: -size * 0.72,
      };
    case 'bottom':
      return {
        nestX: rand(margin, Math.max(margin, screenWidth - size - margin)),
        nestY: screenHeight - size * 0.28,
      };
  }
}

function spawnIntervalForMax(maxOnScreen: number): number {
  // Fewer, bigger critters — space spawns so chaos stays readable.
  return Math.round(Math.max(900, 2200 - maxOnScreen * 80));
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

        const size = Math.round(rand(MIN_SIZE, MAX_SIZE));
        const edge = pickEdge();
        const nest = nestForEdge(edge, size, screenWidth, screenHeight);

        idRef.current += 1;
        const next: CreatureSpawn = {
          id: `creature-${idRef.current}`,
          emoji: pickEntity(theme.entities),
          size,
          edge,
          nestX: nest.nestX,
          nestY: nest.nestY,
          themeId: theme.id,
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
