export type EntitySoundId =
  | 'fish'
  | 'jelly'
  | 'shrimp'
  | 'crab'
  | 'lizard'
  | 'beetle'
  | 'butterfly'
  | 'scorpion'
  | 'bug'
  | 'bunny'
  | 'bird'
  | 'bee'
  | 'squirrel';

export type Gait =
  | 'fish'
  | 'jelly'
  | 'shrimp'
  | 'crab'
  | 'lizard'
  | 'beetle'
  | 'butterfly'
  | 'scorpion'
  | 'ladybug'
  | 'bunny'
  | 'bird'
  | 'bee'
  | 'squirrel';

export type EntityColors = {
  body: string;
  belly: string;
  accent: string;
  limb: string;
};

export type EntityProfile = {
  gait: Gait;
  sound: EntitySoundId;
  speed: number;
  /** World units per second while walking/cruising */
  cruiseSpeed: number;
  /** Stride length as a fraction of creature size */
  stride: number;
  /** Continues residual phase motion while idle (fins / hover) */
  idleDrift: boolean;
  colors: EntityColors;
};

const PROFILES: Record<string, EntityProfile> = {
  '🐠': {
    gait: 'fish',
    sound: 'fish',
    speed: 1,
    cruiseSpeed: 95,
    stride: 0.55,
    idleDrift: true,
    colors: { body: '#FF8A3D', belly: '#FFE6B3', accent: '#FF4D6D', limb: '#FFB347' },
  },
  '🐟': {
    gait: 'fish',
    sound: 'fish',
    speed: 1,
    cruiseSpeed: 100,
    stride: 0.55,
    idleDrift: true,
    colors: { body: '#5B8DEF', belly: '#D6E6FF', accent: '#2F5FCC', limb: '#89B4FF' },
  },
  '🐡': {
    gait: 'fish',
    sound: 'fish',
    speed: 0.75,
    cruiseSpeed: 70,
    stride: 0.45,
    idleDrift: true,
    colors: { body: '#F0C75E', belly: '#FFF1C2', accent: '#E8942A', limb: '#F5D78A' },
  },
  '🪼': {
    gait: 'jelly',
    sound: 'jelly',
    speed: 0.55,
    cruiseSpeed: 45,
    stride: 0.7,
    idleDrift: true,
    colors: { body: '#E8A0FF', belly: '#F6D9FF', accent: '#B86BFF', limb: '#D9A8FF' },
  },
  '🦐': {
    gait: 'shrimp',
    sound: 'shrimp',
    speed: 1.15,
    cruiseSpeed: 120,
    stride: 0.4,
    idleDrift: false,
    colors: { body: '#FF7A62', belly: '#FFD2C8', accent: '#E4573D', limb: '#FF9B88' },
  },
  '🦀': {
    gait: 'crab',
    sound: 'crab',
    speed: 0.9,
    cruiseSpeed: 75,
    stride: 0.5,
    idleDrift: false,
    colors: { body: '#E85D4C', belly: '#FFC7B8', accent: '#B83228', limb: '#F07868' },
  },
  '🦎': {
    gait: 'lizard',
    sound: 'lizard',
    speed: 1,
    cruiseSpeed: 85,
    stride: 0.42,
    idleDrift: false,
    colors: { body: '#6FBF4B', belly: '#D7F0A8', accent: '#3E8C2B', limb: '#5AA83D' },
  },
  '🪲': {
    gait: 'beetle',
    sound: 'beetle',
    speed: 0.75,
    cruiseSpeed: 55,
    stride: 0.35,
    idleDrift: false,
    colors: { body: '#2F6B4F', belly: '#7CB89A', accent: '#1D4030', limb: '#3F7A5C' },
  },
  '🦋': {
    gait: 'butterfly',
    sound: 'butterfly',
    speed: 0.9,
    cruiseSpeed: 80,
    stride: 0.6,
    idleDrift: true,
    colors: { body: '#2C2A32', belly: '#5A5564', accent: '#FF7A1A', limb: '#5EC8FF' },
  },
  '🦂': {
    gait: 'scorpion',
    sound: 'scorpion',
    speed: 0.8,
    cruiseSpeed: 60,
    stride: 0.38,
    idleDrift: false,
    colors: { body: '#8A5A32', belly: '#C4935E', accent: '#5C3A1E', limb: '#A56D3E' },
  },
  '🐞': {
    gait: 'ladybug',
    sound: 'bug',
    speed: 0.65,
    cruiseSpeed: 48,
    stride: 0.28,
    idleDrift: false,
    colors: { body: '#E5243B', belly: '#FFB3BC', accent: '#1A1A1A', limb: '#2A2A2A' },
  },
  '🐇': {
    gait: 'bunny',
    sound: 'bunny',
    speed: 1.05,
    cruiseSpeed: 95,
    stride: 0.7,
    idleDrift: false,
    colors: { body: '#F3EDE4', belly: '#FFFFFF', accent: '#E8B4B8', limb: '#E7DFD4' },
  },
  '🐰': {
    gait: 'bunny',
    sound: 'bunny',
    speed: 1,
    cruiseSpeed: 90,
    stride: 0.65,
    idleDrift: false,
    colors: { body: '#F6D7B0', belly: '#FFF6EA', accent: '#E8A0A8', limb: '#E8C89A' },
  },
  '🐦': {
    gait: 'bird',
    sound: 'bird',
    speed: 1.15,
    cruiseSpeed: 110,
    stride: 0.65,
    idleDrift: true,
    colors: { body: '#5FA8FF', belly: '#D9ECFF', accent: '#F0A202', limb: '#4B85CC' },
  },
  '🐝': {
    gait: 'bee',
    sound: 'bee',
    speed: 1.1,
    cruiseSpeed: 100,
    stride: 0.45,
    idleDrift: true,
    colors: { body: '#F5C400', belly: '#FFF1A8', accent: '#1A1A1A', limb: '#F0E6A8' },
  },
  '🐿️': {
    gait: 'squirrel',
    sound: 'squirrel',
    speed: 1.25,
    cruiseSpeed: 115,
    stride: 0.4,
    idleDrift: false,
    colors: { body: '#C47A3A', belly: '#F0D0A8', accent: '#8A4E22', limb: '#B86A30' },
  },
};

const FALLBACK: EntityProfile = PROFILES['🐞']!;

export function getEntityProfile(emoji: string): EntityProfile {
  return PROFILES[emoji] ?? FALLBACK;
}
