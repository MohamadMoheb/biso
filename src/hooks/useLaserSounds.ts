import { setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { createSfxPool, type SfxPool } from '../audio/sfx';
import { LASER_HIT_SOURCE, LASER_MOVE_SOURCE } from '../audio/sources';

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
  const hitPoolRef = useRef<SfxPool | null>(null);
  const movePoolRef = useRef<SfxPool | null>(null);
  const lastHitRef = useRef(0);
  const lastMoveRef = useRef(0);
  const enabledRef = useRef(soundEnabled);
  const zappingRef = useRef(zapping);
  const paceRef = useRef(pace);
  enabledRef.current = soundEnabled;
  zappingRef.current = zapping;
  paceRef.current = pace;

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    const hits = createSfxPool(LASER_HIT_SOURCE, 0.45, 3);
    const moves = createSfxPool(LASER_MOVE_SOURCE, 0.2, 3);
    hitPoolRef.current = hits;
    movePoolRef.current = moves;
    return () => {
      hitPoolRef.current = null;
      movePoolRef.current = null;
      hits.dispose();
      moves.dispose();
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
      if (!enabledRef.current || !zappingRef.current) return;
      const now = Date.now();
      if (now - lastMoveRef.current < 280) return;
      lastMoveRef.current = now;
      movePoolRef.current?.play({
        rate: 0.88 + Math.random() * 0.2,
        volume: 0.12 + Math.random() * 0.1,
      });
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
    if (!enabledRef.current) return;
    const now = Date.now();
    if (now - lastHitRef.current < 60) return;
    lastHitRef.current = now;
    hitPoolRef.current?.play({
      rate: 0.92 + Math.random() * 0.12,
      volume: 0.38 + Math.random() * 0.12,
    });
  }, []);

  return useMemo(() => ({ playHit }), [playHit]);
}
