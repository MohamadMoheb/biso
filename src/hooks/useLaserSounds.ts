import { Audio } from 'expo-av';
import { useCallback, useEffect, useMemo, useRef } from 'react';

const LASER_HIT_SOURCE = require('../../assets/sounds/laser.wav');
const LASER_MOVE_SOURCE = require('../../assets/sounds/laser-zap.wav');

export type LaserSounds = {
  playHit: () => void;
};

type Options = {
  /** True while the laser is actively moving on the playfield. */
  zapping?: boolean;
  /** Pace 0..1ish — shortens the quiet gap between soft move ticks. */
  pace?: number;
};

/**
 * Quiet laser audio: soft catch taps + sparse move whispers.
 * No continuous buzz — that was exhausting.
 */
export function useLaserSounds(soundEnabled = true, options: Options = {}): LaserSounds {
  const { zapping = false, pace = 0.5 } = options;
  const hitPoolRef = useRef<Audio.Sound[]>([]);
  const movePoolRef = useRef<Audio.Sound[]>([]);
  const readyRef = useRef(false);
  const lastHitRef = useRef(0);
  const lastMoveRef = useRef(0);
  const enabledRef = useRef(soundEnabled);
  const zappingRef = useRef(zapping);
  const paceRef = useRef(pace);
  enabledRef.current = soundEnabled;
  zappingRef.current = zapping;
  paceRef.current = pace;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const loadPool = async (source: number, volume: number, count: number) =>
          Promise.all(
            Array.from({ length: count }, async () => {
              const { sound } = await Audio.Sound.createAsync(source, {
                volume,
                shouldPlay: false,
              });
              return sound;
            }),
          );

        const [hits, moves] = await Promise.all([
          loadPool(LASER_HIT_SOURCE, 0.45, 3),
          loadPool(LASER_MOVE_SOURCE, 0.2, 3),
        ]);
        if (!mounted) {
          await Promise.all([...hits, ...moves].map((s) => s.unloadAsync()));
          return;
        }
        hitPoolRef.current = hits;
        movePoolRef.current = moves;
        readyRef.current = true;
      } catch {
        // Optional
      }
    }

    void load();
    return () => {
      mounted = false;
      readyRef.current = false;
      const all = [...hitPoolRef.current, ...movePoolRef.current];
      hitPoolRef.current = [];
      movePoolRef.current = [];
      void Promise.all(all.map((s) => s.unloadAsync()));
    };
  }, []);

  // Occasional soft ticks while moving — never a drone.
  useEffect(() => {
    if (!soundEnabled || !zapping) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      const p = Math.min(1, Math.max(0, paceRef.current));
      const gap = 520 + (1 - p) * 520 + Math.random() * 380;
      timer = setTimeout(() => {
        if (cancelled) return;
        playMoveTick();
        schedule();
      }, gap);
    };

    const playMoveTick = () => {
      if (!readyRef.current || !enabledRef.current || !zappingRef.current) return;
      const now = Date.now();
      if (now - lastMoveRef.current < 280) return;
      lastMoveRef.current = now;
      const pool = movePoolRef.current;
      if (!pool.length) return;
      const sound = pool[Math.floor(Math.random() * pool.length)];
      if (!sound) return;
      const rate = 0.88 + Math.random() * 0.2;
      void (async () => {
        try {
          await sound.stopAsync().catch(() => undefined);
          await sound.setRateAsync(rate, true);
          await sound.setVolumeAsync(0.12 + Math.random() * 0.1);
          await sound.setPositionAsync(0);
          await sound.playAsync();
        } catch {
          void sound.replayAsync().catch(() => undefined);
        }
      })();
    };

    // First tick after a short settle so play start isn't noisy.
    timer = setTimeout(() => {
      if (cancelled) return;
      playMoveTick();
      schedule();
    }, 280);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [soundEnabled, zapping, pace]);

  const playHit = useCallback(() => {
    if (!readyRef.current || !enabledRef.current) return;
    const now = Date.now();
    if (now - lastHitRef.current < 60) return;
    lastHitRef.current = now;
    const pool = hitPoolRef.current;
    if (!pool.length) return;
    const sound = pool[Math.floor(Math.random() * pool.length)];
    if (!sound) return;
    const rate = 0.92 + Math.random() * 0.12;
    void (async () => {
      try {
        await sound.stopAsync().catch(() => undefined);
        await sound.setRateAsync(rate, true);
        await sound.setVolumeAsync(0.38 + Math.random() * 0.12);
        await sound.setPositionAsync(0);
        await sound.playAsync();
      } catch {
        void sound.replayAsync().catch(() => undefined);
      }
    })();
  }, []);

  return useMemo(() => ({ playHit }), [playHit]);
}
