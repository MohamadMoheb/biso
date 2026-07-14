import AsyncStorage from '@react-native-async-storage/async-storage';

export type Difficulty = 'calm' | 'playful' | 'wild';

export type PlayMode = 'creatures' | 'laser';

export type Settings = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
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

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    // Count / pace / break are fixed — no homepage controls for them.
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      creatureCount: DEFAULT_SETTINGS.creatureCount,
      difficulty: DEFAULT_SETTINGS.difficulty,
      sessionMinutes: DEFAULT_SETTINGS.sessionMinutes,
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
