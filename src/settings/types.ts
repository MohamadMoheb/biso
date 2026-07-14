import AsyncStorage from '@react-native-async-storage/async-storage';

export type Difficulty = 'calm' | 'playful' | 'wild';

export type PlayMode = 'creatures' | 'laser';

export type Settings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  /** Front-camera surprise selfies during play */
  catCamEnabled: boolean;
  difficulty: Difficulty;
  /** 0 = no limit */
  sessionMinutes: 0 | 5 | 10 | 15;
  creatureCount: number;
  tipSeen: boolean;
  sessionsPlayed: number;
};

export const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  hapticsEnabled: true,
  catCamEnabled: false,
  difficulty: 'playful',
  sessionMinutes: 0,
  creatureCount: 2,
  tipSeen: false,
  sessionsPlayed: 0,
};

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; blurb: string; speed: number; sizeBoost: number }
> = {
  calm: { label: 'Calm', blurb: 'Slow & easy - great for kittens', speed: 0.48, sizeBoost: 1.18 },
  playful: { label: 'Playful', blurb: 'Balanced chase for most cats', speed: 1, sizeBoost: 1 },
  wild: { label: 'Wild', blurb: 'Fast targets for energetic hunters', speed: 1.9, sizeBoost: 0.88 },
};

const KEY = 'biso.settings.v1';

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    const stored = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>;
    // Field-by-field validation: storage contents are untrusted (corruption, old versions).
    // Count / pace / break are fixed — no homepage controls for them.
    return {
      soundEnabled: asBool(stored.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
      hapticsEnabled: asBool(stored.hapticsEnabled, DEFAULT_SETTINGS.hapticsEnabled),
      catCamEnabled: asBool(stored.catCamEnabled, DEFAULT_SETTINGS.catCamEnabled),
      difficulty: DEFAULT_SETTINGS.difficulty,
      sessionMinutes: DEFAULT_SETTINGS.sessionMinutes,
      creatureCount: DEFAULT_SETTINGS.creatureCount,
      tipSeen: asBool(stored.tipSeen, DEFAULT_SETTINGS.tipSeen),
      sessionsPlayed:
        typeof stored.sessionsPlayed === 'number' &&
        Number.isFinite(stored.sessionsPlayed) &&
        stored.sessionsPlayed >= 0
          ? Math.floor(stored.sessionsPlayed)
          : DEFAULT_SETTINGS.sessionsPlayed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Persistence is best-effort
  }
}
