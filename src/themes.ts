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
    gradient: ['#6A9BB5', '#78A9C1', '#8BB8CE'],
    accent: '#C8E4F0',
  },
  desert: {
    id: 'desert',
    title: 'Desert',
    subtitle: 'Chase sandy critters',
    emoji: '🦎',
    entities: ['🦎', '🪲', '🦋', '🦂', '🐞'],
    gradient: ['#D8BA88', '#E1C699', '#EBD9B0'],
    accent: '#F5EBDA',
  },
  grass: {
    id: 'grass',
    title: 'Grass',
    subtitle: 'Play in the meadow',
    emoji: '🐇',
    entities: ['🐇', '🐰', '🐦', '🦋', '🐝', '🐿️'],
    gradient: ['#7C9A62', '#8DA870', '#A0B884'],
    accent: '#D4E4C2',
  },
};

export const THEME_LIST: Theme[] = [THEMES.sea, THEMES.desert, THEMES.grass];

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'sea' || value === 'desert' || value === 'grass';
}
