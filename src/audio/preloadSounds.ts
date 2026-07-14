import { preload, setAudioModeAsync } from 'expo-audio';

import { ALL_SFX_SOURCES } from './sources';

/**
 * Kick off buffering as soon as the bundle evaluates — before play screens
 * mount — so createAudioPlayer can start near-instantly (expo-audio preload).
 */
let started = false;

export function preloadSounds() {
  if (started) return;
  started = true;

  void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);

  for (const source of ALL_SFX_SOURCES) {
    try {
      void Promise.resolve(preload(source)).catch(() => undefined);
    } catch {
      // Native module missing / web without Audio — ignore.
    }
  }
}

preloadSounds();
