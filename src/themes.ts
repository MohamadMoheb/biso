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
    gradient: ['#021526', '#063A52', '#0E7A8F'],
    accent: '#7EF0E8',
  },
  desert: {
    id: 'desert',
    title: 'Desert',
    subtitle: 'Chase sandy critters',
    emoji: '🦎',
    entities: ['🦎', '🪲', '🦋', '🦂', '🐞'],
    gradient: ['#E8913A', '#D4783C', '#C49A6C'],
    accent: '#FFE7A8',
  },
  grass: {
    id: 'grass',
    title: 'Grass',
    subtitle: 'Play in the meadow',
    emoji: '🐇',
    entities: ['🐇', '🐰', '🐦', '🦋', '🐝', '🐿️'],
    gradient: ['#5BB4DC', '#7EC99A', '#3F8F5C'],
    accent: '#E8F7B0',
  },
};

export const THEME_LIST: Theme[] = [THEMES.sea, THEMES.desert, THEMES.grass];

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'sea' || value === 'desert' || value === 'grass';
}
