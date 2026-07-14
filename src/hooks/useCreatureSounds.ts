import { Audio, type AVPlaybackSource } from 'expo-av';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { type EntitySoundId, getEntityProfile } from '../entityProfiles';

const ENTITY_SOURCES: Record<EntitySoundId, AVPlaybackSource> = {
  fish: require('../../assets/sounds/entities/fish.wav'),
  jelly: require('../../assets/sounds/entities/jelly.wav'),
  shrimp: require('../../assets/sounds/entities/shrimp.wav'),
  crab: require('../../assets/sounds/entities/crab.wav'),
  lizard: require('../../assets/sounds/entities/lizard.wav'),
  beetle: require('../../assets/sounds/entities/beetle.wav'),
  butterfly: require('../../assets/sounds/entities/butterfly.wav'),
  scorpion: require('../../assets/sounds/entities/scorpion.wav'),
  bug: require('../../assets/sounds/entities/bug.wav'),
  bunny: require('../../assets/sounds/entities/bunny.wav'),
  bird: require('../../assets/sounds/entities/bird.wav'),
  bee: require('../../assets/sounds/entities/bee.wav'),
  squirrel: require('../../assets/sounds/entities/squirrel.wav'),
};

const POP_SOURCE = require('../../assets/sounds/pop.wav');

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

export function useCreatureSounds(soundEnabled = true): CreatureSounds {
  const poolsRef = useRef<Partial<Record<PoolKey, Audio.Sound[]>>>({});
  const readyRef = useRef(false);
  const lastPlayRef = useRef<Partial<Record<string, number>>>({});
  const lastGlobalMoveRef = useRef(0);
  const enabledRef = useRef(soundEnabled);
  enabledRef.current = soundEnabled;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });

        const pools: Partial<Record<PoolKey, Audio.Sound[]>> = {};

        const loadOne = async (source: AVPlaybackSource, volume: number) => {
          const { sound } = await Audio.Sound.createAsync(source, {
            volume,
            shouldPlay: false,
            isLooping: false,
          });
          return sound;
        };

        const [popA, popB, popC] = await Promise.all([
          loadOne(POP_SOURCE, 0.92),
          loadOne(POP_SOURCE, 0.92),
          loadOne(POP_SOURCE, 0.92),
        ]);
        pools.pop = [popA, popB, popC];

        const ids = Object.keys(ENTITY_SOURCES) as EntitySoundId[];
        await Promise.all(
          ids.map(async (id) => {
            const vol = ENTITY_VOLUME[id];
            // Bee needs an extra voice so overlapping buzzes stay smooth.
            const count = id === 'bee' || id === 'bird' ? 4 : 3;
            const sounds = await Promise.all(
              Array.from({ length: count }, () => loadOne(ENTITY_SOURCES[id], vol)),
            );
            pools[id] = sounds;
          }),
        );

        if (!mounted) {
          await Promise.all(
            Object.values(pools)
              .flat()
              .map((s) => s.unloadAsync()),
          );
          return;
        }

        poolsRef.current = pools;
        readyRef.current = true;
      } catch {
        // Audio is optional
      }
    }

    void load();

    return () => {
      mounted = false;
      readyRef.current = false;
      const pools = poolsRef.current;
      poolsRef.current = {};
      void Promise.all(
        Object.values(pools)
          .flat()
          .map((s) => s.unloadAsync()),
      );
    };
  }, []);

  const playKey = useCallback(
    (key: PoolKey, rateKey: string, minGapMs: number, opts?: { rate?: number; volumeBoost?: number }) => {
      if (!readyRef.current || !enabledRef.current) return;
      const now = Date.now();
      const last = lastPlayRef.current[rateKey] ?? 0;
      if (now - last < minGapMs) return;
      lastPlayRef.current[rateKey] = now;

      const pool = poolsRef.current[key];
      if (!pool?.length) return;
      const sound = pool[Math.floor(Math.random() * pool.length)];
      if (!sound) return;

      const rate = opts?.rate ?? randRate(1);
      const baseVol = key === 'pop' ? 0.92 : ENTITY_VOLUME[key as EntitySoundId] ?? 0.4;
      const volume = Math.min(1, baseVol * (opts?.volumeBoost ?? 1));

      void (async () => {
        try {
          await sound.stopAsync().catch(() => undefined);
          await sound.setRateAsync(rate, true);
          await sound.setVolumeAsync(volume);
          await sound.setPositionAsync(0);
          await sound.playAsync();
        } catch {
          void sound.replayAsync().catch(() => {
            void sound.playFromPositionAsync(0).catch(() => undefined);
          });
        }
      })();
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
