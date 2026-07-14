import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';

export function usePopSound() {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/pop.wav'),
        );
        if (mounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch {
        // Sound is optional — fail silently if asset or audio unavailable
      }
    }

    load();

    return () => {
      mounted = false;
      const sound = soundRef.current;
      soundRef.current = null;
      void sound?.unloadAsync();
    };
  }, []);

  const playPop = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    try {
      await sound.replayAsync();
    } catch {
      // Ignore playback races
    }
  }, []);

  return { playPop };
}
