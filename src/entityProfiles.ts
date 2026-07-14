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
};

const PROFILES: Record<string, EntityProfile> = {
  '🐠': { gait: 'fish', sound: 'fish', speed: 1.1, cruiseSpeed: 125, stride: 0.55, idleDrift: true },
  '🐟': { gait: 'fish', sound: 'fish', speed: 1.1, cruiseSpeed: 130, stride: 0.55, idleDrift: true },
  '🐡': { gait: 'fish', sound: 'fish', speed: 0.85, cruiseSpeed: 95, stride: 0.45, idleDrift: true },
  '🪼': { gait: 'jelly', sound: 'jelly', speed: 0.7, cruiseSpeed: 70, stride: 0.7, idleDrift: true },
  '🦐': { gait: 'shrimp', sound: 'shrimp', speed: 1.3, cruiseSpeed: 155, stride: 0.4, idleDrift: false },
  '🦀': { gait: 'crab', sound: 'crab', speed: 1.05, cruiseSpeed: 105, stride: 0.5, idleDrift: false },
  '🦎': { gait: 'lizard', sound: 'lizard', speed: 1.15, cruiseSpeed: 120, stride: 0.42, idleDrift: false },
  '🪲': { gait: 'beetle', sound: 'beetle', speed: 0.9, cruiseSpeed: 85, stride: 0.35, idleDrift: false },
  '🦋': { gait: 'butterfly', sound: 'butterfly', speed: 1.05, cruiseSpeed: 110, stride: 0.6, idleDrift: true },
  '🦂': { gait: 'scorpion', sound: 'scorpion', speed: 0.95, cruiseSpeed: 95, stride: 0.38, idleDrift: false },
  '🐞': { gait: 'ladybug', sound: 'bug', speed: 0.85, cruiseSpeed: 80, stride: 0.28, idleDrift: false },
  '🐇': { gait: 'bunny', sound: 'bunny', speed: 1.2, cruiseSpeed: 135, stride: 0.7, idleDrift: false },
  '🐰': { gait: 'bunny', sound: 'bunny', speed: 1.15, cruiseSpeed: 125, stride: 0.65, idleDrift: false },
  '🐦': { gait: 'bird', sound: 'bird', speed: 1.3, cruiseSpeed: 145, stride: 0.65, idleDrift: true },
  '🐝': { gait: 'bee', sound: 'bee', speed: 1.25, cruiseSpeed: 140, stride: 0.45, idleDrift: true },
  '🐿️': { gait: 'squirrel', sound: 'squirrel', speed: 1.4, cruiseSpeed: 155, stride: 0.4, idleDrift: false },
};

const FALLBACK: EntityProfile = PROFILES['🐞']!;

export function getEntityProfile(emoji: string): EntityProfile {
  return PROFILES[emoji] ?? FALLBACK;
}
