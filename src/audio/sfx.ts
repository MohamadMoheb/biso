import {
  createAudioPlayer,
  type AudioPlayer,
  type AudioSource,
  type AudioStatus,
} from 'expo-audio';

export type SfxPool = {
  play: (opts?: { volume?: number; rate?: number }) => void;
  dispose: () => void;
};

type PlayOpts = { volume?: number; rate?: number };

function applyOpts(player: AudioPlayer, baseVolume: number, opts?: PlayOpts) {
  player.volume = Math.min(1, opts?.volume ?? baseVolume);
  player.shouldCorrectPitch = true;
  player.playbackRate = opts?.rate ?? 1;
}

/**
 * Restart and play without awaiting seek — awaiting added a frame+ of latency
 * and dropped the first hit while assets were still decoding.
 */
function fire(player: AudioPlayer) {
  void player.seekTo(0);
  player.play();
}

function playWhenReady(player: AudioPlayer, baseVolume: number, opts?: PlayOpts) {
  applyOpts(player, baseVolume, opts);
  if (player.isLoaded) {
    fire(player);
    return;
  }

  // First plays can race createAudioPlayer's load — queue one shot instead of dropping.
  const sub = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
    if (!status.isLoaded) return;
    sub.remove();
    applyOpts(player, baseVolume, opts);
    fire(player);
  });
}

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

  const play = (opts?: PlayOpts) => {
    if (disposed || players.length === 0) return;
    const idle = players.find((p) => p.isLoaded && !p.playing);
    const loading = !idle ? players.find((p) => !p.isLoaded) : undefined;
    const player =
      idle ?? loading ?? players[Math.floor(Math.random() * players.length)]!;
    try {
      playWhenReady(player, baseVolume, opts);
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
