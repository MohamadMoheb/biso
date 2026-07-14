import { setAudioModeAsync } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { createSfxPool, type SfxPool } from '../audio/sfx';
import { LASER_HIT_SOURCE, LASER_MOVE_SOURCE } from '../audio/sources';

export type LaserSounds = {
  playHit: () => void;
  /** Fired from the laser worklet when it has moved far enough — speed ~0.2..2.5 */
  playMove: (speed: number) => void;
};

type Options = {
  /** True while the laser is actively auto-wandering on the playfield. */
  zapping?: boolean;
};

/**
 * Laser SFX driven by movement, not a timer — playMove is called from the
 * frame worklet when the dot travels a fixed distance so ticks match pace.
 */
export function useLaserSounds(soundEnabled = true, options: Options = {}): LaserSounds {
  const { zapping = false } = options;
  const hitPoolRef = useRef<SfxPool | null>(null);
  const movePoolRef = useRef<SfxPool | null>(null);
  const lastHitRef = useRef(0);
  const lastMoveRef = useRef(0);
  const enabledRef = useRef(soundEnabled);
  const zappingRef = useRef(zapping);
  enabledRef.current = soundEnabled;
  zappingRef.current = zapping;

  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
    const hits = createSfxPool(LASER_HIT_SOURCE, 0.45, 3);
    const moves = createSfxPool(LASER_MOVE_SOURCE, 0.2, 4);
    hitPoolRef.current = hits;
    movePoolRef.current = moves;
    return () => {
      hitPoolRef.current = null;
      movePoolRef.current = null;
      hits.dispose();
      moves.dispose();
    };
  }, []);

  const playMove = useCallback((speed: number) => {
    if (!enabledRef.current || !zappingRef.current) return;
    const norm = Math.min(2.2, Math.max(0.2, speed));
    const now = Date.now();
    const minGap = Math.max(70, 300 - norm * 110);
    if (now - lastMoveRef.current < minGap) return;
    lastMoveRef.current = now;
    movePoolRef.current?.play({
      rate: 0.72 + norm * 0.38,
      volume: 0.08 + norm * 0.16,
    });
  }, []);

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

  return useMemo(() => ({ playHit, playMove }), [playHit, playMove]);
}
