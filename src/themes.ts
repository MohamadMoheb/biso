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
    gradient: ['#4A9BB8', '#5AA8C4', '#7EC4D8'],
    accent: '#C8E4F0',
  },
  desert: {
    id: 'desert',
    title: 'Desert',
    subtitle: 'Chase sandy critters',
    emoji: '🦎',
    entities: ['🦎', '🪲', '🦋', '🦂', '🐞'],
    gradient: ['#C9964E', '#E2BC7A', '#F0D9A8'],
    accent: '#F5EBDA',
  },
  grass: {
    id: 'grass',
    title: 'Grass',
    subtitle: 'Play in the meadow',
    emoji: '🐇',
    entities: ['🐇', '🐰', '🐦', '🦋', '🐝', '🐿️'],
    gradient: ['#4F7A38', '#7FAA58', '#B7D087'],
    accent: '#D4E4C2',
  },
};

export const THEME_LIST: Theme[] = [THEMES.sea, THEMES.desert, THEMES.grass];

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'sea' || value === 'desert' || value === 'grass';
}
