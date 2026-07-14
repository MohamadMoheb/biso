import { Platform } from 'react-native';
import { setAudioModeAsync } from 'expo-audio';

/**
 * Web (and some browsers) gate audio until a user gesture. Call this from the
 * Play press so SFX on the next screen aren't blocked by autoplay policy.
 *
 * Uses a tiny silent data-URI so we do not consume expo-audio's preload cache
 * (iOS clears a preloaded source on the first createAudioPlayer).
 */
let unlocked = false;

/** Minimal silent WAV (44-byte header, no samples). */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;

  void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);

  if (Platform.OS !== 'web') return;

  try {
    // eslint-disable-next-line no-undef -- web-only HTMLAudioElement
    const audio = new Audio(SILENT_WAV);
    audio.volume = 0;
    void audio
      .play()
      .then(() => {
        audio.pause();
      })
      .catch(() => {
        unlocked = false;
      });
  } catch {
    unlocked = false;
  }
}
