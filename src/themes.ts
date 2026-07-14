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
    gradient: ['#02182A', '#0A4660', '#1B8FA8'],
    accent: '#7EF0E8',
  },
  desert: {
    id: 'desert',
    title: 'Desert',
    subtitle: 'Chase sandy critters',
    emoji: '🦎',
    entities: ['🦎', '🪲', '🦋', '🦂', '🐞'],
    gradient: ['#F2A65A', '#E8904A', '#D4A574'],
    accent: '#FFE7A8',
  },
  grass: {
    id: 'grass',
    title: 'Grass',
    subtitle: 'Play in the meadow',
    emoji: '🐇',
    entities: ['🐇', '🐰', '🐦', '🦋', '🐝', '🐿️'],
    gradient: ['#7EC8E3', '#A8D5A2', '#4F9B6A'],
    accent: '#E8F7B0',
  },
};

export const THEME_LIST: Theme[] = [THEMES.sea, THEMES.desert, THEMES.grass];

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'sea' || value === 'desert' || value === 'grass';
}
