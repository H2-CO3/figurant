// Everything drawn in the "neon-nuit" style. Built like every style of the library:
// characters/, props/, scenes/, kit.js (the style's drawing helpers) and this index.

import { dinerCup } from './characters/diner-cup.js';
import { cassette } from './characters/cassette.js';
import { openSign } from './props/open-sign.js';
import { jukebox } from './props/jukebox.js';
import { openingTimeDinerCup } from './scenes/diner-cup/opening-time.js';
import { rewindCassette } from './scenes/cassette/rewind.js';

import { neonRider } from './characters/neon-rider.js';
import { neonCircuit } from './characters/neon-circuit.js';
import { surgeNeonRider } from './scenes/neon-rider/surge.js';
import { climbNeonRider } from './scenes/neon-rider/climb.js';
import { surgeNeonCircuit } from './scenes/neon-circuit/surge.js';

import { openAllNight } from './compositions/open-all-night.js';
import { neonRide } from './compositions/neon-ride.js';
export const style = 'neon-nuit';
export const characters = { 'diner-cup': dinerCup, cassette, 'neon-rider': neonRider, 'neon-circuit': neonCircuit };
export const props = { 'open-sign': openSign, jukebox };
export const scenes = { 'opening-time-diner-cup': openingTimeDinerCup, 'rewind-cassette': rewindCassette, 'surge-neon-rider': surgeNeonRider, 'climb-neon-rider': climbNeonRider, 'surge-neon-circuit': surgeNeonCircuit };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'open-all-night': openAllNight, 'neon-ride': neonRide };
