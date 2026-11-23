// Everything drawn in the "encre-de-chine" style. Built like every style of the library:
// characters/, props/, scenes/, kit.js (the style's drawing helpers) and this index.

import { calligraphyBrush } from './characters/calligraphy-brush.js';
import { frog } from './characters/frog.js';
import { inkstone } from './props/inkstone.js';
import { lotusLeaf } from './props/lotus-leaf.js';
import { mayfly } from './props/mayfly.js';
import { oneStrokeCalligraphyBrush } from './scenes/calligraphy-brush/one-stroke.js';
import { stillPondFrog } from './scenes/frog/still-pond.js';

import { pond } from './compositions/pond.js';
export const style = 'encre-de-chine';
export const characters = { 'calligraphy-brush': calligraphyBrush, frog };
export const props = { inkstone, 'lotus-leaf': lotusLeaf, mayfly };
export const scenes = { 'one-stroke-calligraphy-brush': oneStrokeCalligraphyBrush, 'still-pond-frog': stillPondFrog };
/** Scenes: several characters, each on its track in time. */
export const compositions = { pond };
