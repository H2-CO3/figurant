// Everything drawn in the "neon-nuit" style. Built like every style of the library:
// characters/, props/, scenes/, kit.js (the style's drawing helpers) and this index.

import { dinerCup } from './characters/diner-cup.js';
import { cassette } from './characters/cassette.js';
import { openSign } from './props/open-sign.js';
import { jukebox } from './props/jukebox.js';
import { openingTimeDinerCup } from './scenes/diner-cup/opening-time.js';
import { rewindCassette } from './scenes/cassette/rewind.js';

import { openAllNight } from './compositions/open-all-night.js';
export const style = 'neon-nuit';
export const characters = { 'diner-cup': dinerCup, cassette };
export const props = { 'open-sign': openSign, jukebox };
export const scenes = { 'opening-time-diner-cup': openingTimeDinerCup, 'rewind-cassette': rewindCassette };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'open-all-night': openAllNight };
