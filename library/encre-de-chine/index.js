// Everything drawn in the "encre-de-chine" style. Built like every style of the library:
// characters/, props/, scenes/, kit.js (the style's drawing helpers) and this index.

import { inkMaster } from './characters/ink-master.js';
import { inkBrush } from './props/ink-brush.js';
import { frog } from './characters/frog.js';
import { inkstone } from './props/inkstone.js';
import { lotusLeaf } from './props/lotus-leaf.js';
import { mayfly } from './props/mayfly.js';
import { easel } from './props/easel.js';
import { inkRock } from './props/rock.js';
import { inkSheet } from './characters/ink-sheet.js';
import { restingBrush } from './characters/resting-brush.js';
import { arriveInkMaster } from './scenes/ink-master/arrive.js';
import { writeInkMaster } from './scenes/ink-master/write.js';
import { saluteInkMaster } from './scenes/ink-master/salute.js';
import { appearInkSheet } from './scenes/ink-sheet/appear.js';
import { stirRestingBrush } from './scenes/resting-brush/stir.js';
import { watchFrog } from './scenes/frog/watch.js';
import { stillPondFrog } from './scenes/frog/still-pond.js';

import { heavenAndEarth } from './compositions/heaven-and-earth.js';
export const style = 'encre-de-chine';
export const characters = { 'ink-master': inkMaster, frog, 'ink-sheet': inkSheet, 'resting-brush': restingBrush };
export const props = { inkstone, 'lotus-leaf': lotusLeaf, mayfly, easel, 'ink-rock': inkRock, 'ink-brush': inkBrush };
export const scenes = { 'arrive-ink-master': arriveInkMaster, 'write-ink-master': writeInkMaster, 'salute-ink-master': saluteInkMaster, 'appear-ink-sheet': appearInkSheet, 'stir-resting-brush': stirRestingBrush, 'still-pond-frog': stillPondFrog, 'watch-frog': watchFrog };
/** Scenes: several characters, each on its track in time. */
export const compositions = { 'heaven-and-earth': heavenAndEarth };
