// Everything drawn in the "trait-et-or" style. Built like every style of the library:
// characters/, props/, scenes/, kit.js (the style's drawing helpers) and this index.

import { compass } from './characters/compass.js';
import { balance } from './characters/balance.js';
import { boat } from './characters/boat.js';
import { setSailBoat } from './scenes/boat/set-sail.js';
import { pocketCompass } from './props/pocket-compass.js';
import { navigateStickman } from './scenes/stickman/navigate.js';
import { stickmanNaviguant } from './compositions/stickman-naviguant.js';
import { globe } from './props/globe.js';
import { weights, weight } from './props/weights.js';
import { bearingCompass } from './scenes/compass/bearing.js';
import { weighBalance } from './scenes/balance/weigh.js';

import { cabinet } from './compositions/cabinet.js';
export const style = 'trait-et-or';
export const characters = { compass, balance, boat };
export const props = { globe, weights, weight, 'pocket-compass': pocketCompass };
export const scenes = { 'bearing-compass': bearingCompass, 'weigh-balance': weighBalance, 'set-sail-boat': setSailBoat, 'navigate-stickman': navigateStickman };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'cabinet': cabinet, 'stickman-naviguant': stickmanNaviguant };
