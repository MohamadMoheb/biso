import { createAudioPlayer, type AudioPlayer, type AudioSource } from 'expo-audio';

export type SfxPool = {
  play: (opts?: { volume?: number; rate?: number }) => void;
  dispose: () => void;
};

/**
 * Small pool of pre-created players for one short sound effect so rapid
 * retriggers overlap instead of cutting each other off. Prefers an idle
 * player; falls back to stealing a random voice when all are busy.
 */
export function createSfxPool(source: AudioSource, baseVolume: number, size = 3): SfxPool {
  const players: AudioPlayer[] = [];
  try {
    for (let i = 0; i < size; i++) {
      const player = createAudioPlayer(source);
      player.volume = baseVolume;
      players.push(player);
    }
  } catch {
    // Audio is optional — missing native module / web autoplay limits.
  }

  let disposed = false;

  const play = (opts?: { volume?: number; rate?: number }) => {
    if (disposed || players.length === 0) return;
    const idle = players.find((p) => p.isLoaded && !p.playing);
    const player = idle ?? players[Math.floor(Math.random() * players.length)]!;
    if (!player.isLoaded) return;
    try {
      player.volume = Math.min(1, opts?.volume ?? baseVolume);
      player.shouldCorrectPitch = true;
      player.playbackRate = opts?.rate ?? 1;
      void player
        .seekTo(0)
        .then(() => {
          if (!disposed) player.play();
        })
        .catch(() => undefined);
    } catch {
      // Player released mid-call — ignore.
    }
  };

  const dispose = () => {
    disposed = true;
    for (const player of players) {
      try {
        player.remove();
      } catch {
        // Already released.
      }
    }
    players.length = 0;
  };

  return { play, dispose };
}
