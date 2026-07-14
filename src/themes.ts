export type ThemeId = 'sea' | 'desert' | 'grass';

export type Theme = {
  id: ThemeId;
  title: string;
  subtitle: string;
  emoji: string;
  entities: string[];
  gradient: [string, string, string];
  accent: string;
};

export const THEMES: Record<ThemeId, Theme> = {
  sea: {
    id: 'sea',
    title: 'Sea',
    subtitle: 'Swim with ocean friends',
    emoji: '🐠',
    entities: ['🐠', '🐟', '🐡', '🪼', '🦐', '🦀'],
    gradient: ['#0A4D68', '#088395', '#05BFDB'],
    accent: '#00FFD1',
  },
  desert: {
    id: 'desert',
    title: 'Desert',
    subtitle: 'Chase sandy critters',
    emoji: '🦎',
    entities: ['🦎', '🪲', '🦋', '🦂', '🐞'],
    gradient: ['#C2703D', '#E8A87C', '#F5D5AE'],
    accent: '#FFB347',
  },
  grass: {
    id: 'grass',
    title: 'Grass',
    subtitle: 'Play in the meadow',
    emoji: '🐇',
    entities: ['🐇', '🐰', '🐦', '🦋', '🐝', '🐿️'],
    gradient: ['#2D6A4F', '#52B788', '#95D5B2'],
    accent: '#B7F564',
  },
};

export const THEME_LIST: Theme[] = [THEMES.sea, THEMES.desert, THEMES.grass];

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'sea' || value === 'desert' || value === 'grass';
}
