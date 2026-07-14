import { Audio, type AVPlaybackSource } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';

type SoundKind = 'pop' | 'sneak' | 'dash' | 'hide';

const SOURCES: Record<SoundKind, AVPlaybackSource> = {
  pop: require('../../assets/sounds/pop.wav'),
  sneak: require('../../assets/sounds/sneak.wav'),
  dash: require('../../assets/sounds/dash.wav'),
  hide: require('../../assets/sounds/hide.wav'),
};

const VOLUME: Record<SoundKind, number> = {
  pop: 0.9,
  sneak: 0.28,
  dash: 0.42,
  hide: 0.34,
};

export type CreatureSounds = {
  playPop: () => void;
  playSneak: () => void;
  playDash: () => void;
  playHide: () => void;
};

/**
 * Lightweight pooled playback so multiple creatures can overlap short SFX.
 */
export function useCreatureSounds(): CreatureSounds {
  const poolsRef = useRef<Partial<Record<SoundKind, Audio.Sound[]>>>({});
  const readyRef = useRef(false);
  const lastPlayRef = useRef<Partial<Record<SoundKind, number>>>({});

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });

        const pools: Partial<Record<SoundKind, Audio.Sound[]>> = {};
        for (const kind of Object.keys(SOURCES) as SoundKind[]) {
          const copies = kind === 'sneak' || kind === 'dash' ? 3 : 2;
          const sounds: Audio.Sound[] = [];
          for (let i = 0; i < copies; i++) {
            const { sound } = await Audio.Sound.createAsync(SOURCES[kind], {
              volume: VOLUME[kind],
              shouldPlay: false,
            });
            sounds.push(sound);
          }
          pools[kind] = sounds;
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

  const play = useCallback((kind: SoundKind, minGapMs: number) => {
    if (!readyRef.current) return;
    const now = Date.now();
    const last = lastPlayRef.current[kind] ?? 0;
    if (now - last < minGapMs) return;
    lastPlayRef.current[kind] = now;

    const pool = poolsRef.current[kind];
    if (!pool?.length) return;

    const sound = pool[Math.floor(Math.random() * pool.length)];
    if (!sound) return;

    void (async () => {
      try {
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(VOLUME[kind]);
        await sound.playAsync();
      } catch {
        // Ignore playback races
      }
    })();
  }, []);

  return {
    playPop: useCallback(() => play('pop', 40), [play]),
    playSneak: useCallback(() => play('sneak', 180), [play]),
    playDash: useCallback(() => play('dash', 120), [play]),
    playHide: useCallback(() => play('hide', 160), [play]),
  };
}
