import { setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { createSfxPool, type SfxPool } from '../audio/sfx';
import { ENTITY_SOURCES, POP_SOURCE } from '../audio/sources';
import { type EntitySoundId, getEntityProfile } from '../entityProfiles';

const POP_VOLUME = 0.92;

/** Peak loudness per creature — tuned so soft flutter (butterfly) still sits below crab clicks. */
const ENTITY_VOLUME: Record<EntitySoundId, number> = {
  fish: 0.42,
  jelly: 0.4,
  shrimp: 0.4,
  crab: 0.46,
  lizard: 0.38,
  beetle: 0.4,
  butterfly: 0.4,
  scorpion: 0.4,
  bug: 0.34,
  bunny: 0.48,
  bird: 0.44,
  bee: 0.4,
  squirrel: 0.42,
};

/** Min gap between consecutive plays of the same entity move cue. */
const MOVE_GAP_MS: Record<EntitySoundId, number> = {
  fish: 320,
  jelly: 480,
  shrimp: 260,
  crab: 300,
  lizard: 300,
  beetle: 280,
  butterfly: 360,
  scorpion: 320,
  bug: 300,
  bunny: 240,
  bird: 340,
  bee: 220,
  squirrel: 280,
};

type PoolKey = EntitySoundId | 'pop';

export type CreatureSounds = {
  playPop: () => void;
  playMove: (emoji: string) => void;
  playBurst: (emoji: string) => void;
};

/** Global cap so many creatures do not flood the audio bridge. */
const GLOBAL_MOVE_GAP_MS = 70;

function randRate(base = 1) {
  return base * (0.93 + Math.random() * 0.14);
}

/**
 * Short-sound pools for the creatures screen. Only the sounds used by the
 * given theme's entities (plus the catch pop) are loaded — a theme needs
 * 4–5 entity cues, not the full 13-sound bank.
 */
export function useCreatureSounds(
  soundEnabled = true,
  entities: readonly string[] = [],
): CreatureSounds {
  const poolsRef = useRef<Partial<Record<PoolKey, SfxPool>>>({});
  const lastPlayRef = useRef<Partial<Record<string, number>>>({});
  const lastGlobalMoveRef = useRef(0);
  const enabledRef = useRef(soundEnabled);
  enabledRef.current = soundEnabled;

  // Stable key so a re-created array with the same emojis does not reload audio.
  const entityKey = entities.join('');

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);

    const pools: Partial<Record<PoolKey, SfxPool>> = {};
    pools.pop = createSfxPool(POP_SOURCE, POP_VOLUME, 3);

    const ids = new Set<EntitySoundId>();
    for (const emoji of entities) ids.add(getEntityProfile(emoji).sound);
    for (const id of ids) {
      // Bee/bird need an extra voice so overlapping buzzes stay smooth.
      const voices = id === 'bee' || id === 'bird' ? 4 : 3;
      pools[id] = createSfxPool(ENTITY_SOURCES[id], ENTITY_VOLUME[id], voices);
    }

    poolsRef.current = pools;
    return () => {
      poolsRef.current = {};
      for (const pool of Object.values(pools)) pool?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- entityKey stands in for entities
  }, [entityKey]);

  const playKey = useCallback(
    (key: PoolKey, rateKey: string, minGapMs: number, opts?: { rate?: number; volumeBoost?: number }) => {
      if (!enabledRef.current) return;
      const now = Date.now();
      const last = lastPlayRef.current[rateKey] ?? 0;
      if (now - last < minGapMs) return;
      lastPlayRef.current[rateKey] = now;

      const pool = poolsRef.current[key];
      if (!pool) return;
      const baseVol = key === 'pop' ? POP_VOLUME : ENTITY_VOLUME[key];
      pool.play({
        rate: opts?.rate ?? randRate(1),
        volume: baseVol * (opts?.volumeBoost ?? 1),
      });
    },
    [],
  );

  const playPop = useCallback(() => {
    playKey('pop', 'pop', 35, { rate: randRate(1), volumeBoost: 1 });
  }, [playKey]);

  const playMove = useCallback(
    (emoji: string) => {
      const now = Date.now();
      if (now - lastGlobalMoveRef.current < GLOBAL_MOVE_GAP_MS) return;
      lastGlobalMoveRef.current = now;
      const profile = getEntityProfile(emoji);
      playKey(profile.sound, `move:${profile.sound}`, MOVE_GAP_MS[profile.sound], {
        rate: randRate(1),
        volumeBoost: 0.92,
      });
    },
    [playKey],
  );

  const playBurst = useCallback(
    (emoji: string) => {
      const profile = getEntityProfile(emoji);
      playKey(profile.sound, `burst:${profile.sound}`, 140, {
        rate: randRate(1.04),
        volumeBoost: 1.12,
      });
    },
    [playKey],
  );

  return useMemo(
    () => ({ playPop, playMove, playBurst }),
    [playPop, playMove, playBurst],
  );
}
