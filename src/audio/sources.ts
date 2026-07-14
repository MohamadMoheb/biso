import type { AudioSource } from 'expo-audio';

import type { EntitySoundId } from '../entityProfiles';

export const ENTITY_SOURCES: Record<EntitySoundId, AudioSource> = {
  fish: require('../../assets/sounds/entities/fish.wav'),
  jelly: require('../../assets/sounds/entities/jelly.wav'),
  shrimp: require('../../assets/sounds/entities/shrimp.wav'),
  crab: require('../../assets/sounds/entities/crab.wav'),
  lizard: require('../../assets/sounds/entities/lizard.wav'),
  beetle: require('../../assets/sounds/entities/beetle.wav'),
  butterfly: require('../../assets/sounds/entities/butterfly.wav'),
  scorpion: require('../../assets/sounds/entities/scorpion.wav'),
  bug: require('../../assets/sounds/entities/bug.wav'),
  bunny: require('../../assets/sounds/entities/bunny.wav'),
  bird: require('../../assets/sounds/entities/bird.wav'),
  bee: require('../../assets/sounds/entities/bee.wav'),
  squirrel: require('../../assets/sounds/entities/squirrel.wav'),
};

export const POP_SOURCE: AudioSource = require('../../assets/sounds/pop.wav');
export const LASER_HIT_SOURCE: AudioSource = require('../../assets/sounds/laser.wav');
export const LASER_MOVE_SOURCE: AudioSource = require('../../assets/sounds/laser-zap.wav');

/** Every short SFX the app can fire — preloaded at startup. */
export const ALL_SFX_SOURCES: AudioSource[] = [
  POP_SOURCE,
  LASER_HIT_SOURCE,
  LASER_MOVE_SOURCE,
  ...Object.values(ENTITY_SOURCES),
];
