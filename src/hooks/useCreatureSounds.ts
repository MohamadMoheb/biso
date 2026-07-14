import { Audio, type AVPlaybackSource } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';

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

const ENTITY_VOLUME: Record<EntitySoundId, number> = {
  fish: 0.32,
  jelly: 0.28,
  shrimp: 0.3,
  crab: 0.34,
  lizard: 0.3,
  beetle: 0.28,
  butterfly: 0.26,
  scorpion: 0.3,
  bug: 0.26,
  bunny: 0.36,
  bird: 0.34,
  bee: 0.3,
  squirrel: 0.32,
};

type PoolKey = EntitySoundId | 'pop';

export type CreatureSounds = {
  playPop: () => void;
  /** Soft locomotion loop beat for this emoji */
  playMove: (emoji: string) => void;
  /** Stronger call for a sudden burst / hop / takeoff */
  playBurst: (emoji: string) => void;
};

export function useCreatureSounds(soundEnabled = true): CreatureSounds {
  const poolsRef = useRef<Partial<Record<PoolKey, Audio.Sound[]>>>({});
  const readyRef = useRef(false);
  const lastPlayRef = useRef<Partial<Record<string, number>>>({});
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

        const { sound: popA } = await Audio.Sound.createAsync(POP_SOURCE, {
          volume: 0.9,
          shouldPlay: false,
        });
        const { sound: popB } = await Audio.Sound.createAsync(POP_SOURCE, {
          volume: 0.9,
          shouldPlay: false,
        });
        pools.pop = [popA, popB];

        for (const id of Object.keys(ENTITY_SOURCES) as EntitySoundId[]) {
          const copies = 2;
          const sounds: Audio.Sound[] = [];
          for (let i = 0; i < copies; i++) {
            const { sound } = await Audio.Sound.createAsync(ENTITY_SOURCES[id], {
              volume: ENTITY_VOLUME[id],
              shouldPlay: false,
            });
            sounds.push(sound);
          }
          pools[id] = sounds;
        }

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

  const playKey = useCallback((key: PoolKey, rateKey: string, minGapMs: number, volume: number) => {
    if (!readyRef.current || !enabledRef.current) return;
    const now = Date.now();
    const last = lastPlayRef.current[rateKey] ?? 0;
    if (now - last < minGapMs) return;
    lastPlayRef.current[rateKey] = now;

    const pool = poolsRef.current[key];
    if (!pool?.length) return;
    const sound = pool[Math.floor(Math.random() * pool.length)];
    if (!sound) return;

    void (async () => {
      try {
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(volume);
        await sound.playAsync();
      } catch {
        // Ignore playback races
      }
    })();
  }, []);

  const playPop = useCallback(() => {
    playKey('pop', 'pop', 40, 0.9);
  }, [playKey]);

  const playMove = useCallback(
    (emoji: string) => {
      const profile = getEntityProfile(emoji);
      playKey(profile.sound, `move:${profile.sound}`, 220, ENTITY_VOLUME[profile.sound] * 0.85);
    },
    [playKey],
  );

  const playBurst = useCallback(
    (emoji: string) => {
      const profile = getEntityProfile(emoji);
      playKey(profile.sound, `burst:${profile.sound}`, 140, Math.min(0.7, ENTITY_VOLUME[profile.sound] * 1.25));
    },
    [playKey],
  );

  return { playPop, playMove, playBurst };
}
