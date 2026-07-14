import * as KeepAwake from 'expo-keep-awake';
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Keep the screen on during play without crashing when:
 * - the lock is denied / unsupported (web browsers), or
 * - deactivate runs before activate finishes (fast navigate back).
 */
export function useSafeKeepAwake(tag = 'biso-play') {
  useEffect(() => {
    // Web wake locks often fail without a user gesture and throw noisily.
    if (Platform.OS === 'web') return;

    let alive = true;
    let activated = false;

    void (async () => {
      try {
        const available = await KeepAwake.isAvailableAsync();
        if (!available || !alive) return;
        await KeepAwake.activateKeepAwakeAsync(tag);
        if (!alive) {
          await KeepAwake.deactivateKeepAwake(tag).catch(() => undefined);
          return;
        }
        activated = true;
      } catch {
        // Unsupported device / activity gone mid-activate — safe to ignore.
      }
    })();

    return () => {
      alive = false;
      if (!activated) return;
      void KeepAwake.deactivateKeepAwake(tag).catch(() => undefined);
    };
  }, [tag]);
}
