// A pirate captain, in line and gold: the stick figure in costume. It is the
// plain stick figure's own body (a spine, a round head, two eyes that look
// about) with clothes drawn over it: a three-cornered hat, a scarf knotted
// under it with its two ends flying, a wide lopsided smile, long loose hair with a trinket or two in
// it, a moustache and a beard in two strands, a dark line under each eye, a
// ring in one ear, a long coat open down the front, a sash across it. Nothing else changes: every
// gesture the stick figure knows, it knows. This is how a stick figure is
// given a part to play: copy this file and change the clothes.

import { shapeHead } from 'figurant';
import { GOLD, INK, PAPER } from '../kit.js';

const gold = (d, more = {}) => ({ tag: 'path', attrs: { d, stroke: GOLD, fill: PAPER, 'stroke-linejoin': 'round', ...more } });
const ink = (d, more = {}) => ({ tag: 'path', attrs: { d, stroke: INK, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...more } });

export const pirate = {
    name: 'pirate',
    style: 'trait-et-or',
    line: 3,
    head: shapeHead({
        shapes: [
            // The coat, behind the spine: two long skirts from the shoulders, a collar.
            gold('M 0 -13 L -12 -8 L -15 26 L -5 23 L -3 -4 Z'),
            gold('M 0 -13 L 12 -8 L 15 26 L 5 23 L 3 -4 Z'),
            { tag: 'line', attrs: { x1: 0, y1: -20, x2: 0, y2: 22 } },                    // spine
            ink('M -10 2 L 10 9 M -10 5 L 10 12', { 'stroke-width': 1.6 }),                // the sash
            { tag: 'circle', attrs: { cx: 4, cy: 9, r: 2.2, fill: GOLD, stroke: 'none' } }, // its buckle: the one solid gold
            // Long loose hair, behind the head: four locks of it, two of them ending in a trinket.
            ink('M -13 -36 Q -21 -24 -17 -8 M -9 -30 Q -16 -20 -13 -5 M 13 -36 Q 21 -25 18 -9 M 9 -30 Q 16 -20 14 -6', { 'stroke-width': 1.4 }),
            { tag: 'circle', attrs: { cx: -17, cy: -7, r: 1.7, fill: INK, stroke: 'none' } },
            { tag: 'circle', attrs: { cx: 14, cy: -5, r: 1.7, fill: INK, stroke: 'none' } },
            { tag: 'circle', attrs: { cx: 0, cy: -35, r: 15 }, fill: true },               // head
            // The scarf under the hat, knotted at one side, its two ends flying.
            ink('M -14.6 -39 Q 0 -35 14.6 -39 M 14.6 -39 Q 21 -37 24 -31 M 14.6 -39 Q 19 -34 19 -27', { 'stroke-width': 1.8 }),
            // The hat: three corners, the brim turned up, a low crown.
            gold('M -11 -45 Q 0 -61 11 -45 Z'),
            gold('M -25 -44 Q -13 -53 0 -47 Q 13 -53 25 -44 Q 13 -39 0 -42 Q -13 -39 -25 -44 Z'),
            // A moustache, a tuft on the chin, a ring in the ear.
            ink('M -7 -27 Q -3.5 -30 0 -27.5 Q 3.5 -30 7 -27', { 'stroke-width': 1.5 }),
            // A wide lopsided smile under it: it is in the best of moods.
            ink('M -6 -25 Q 1 -19.6 7.4 -25.8', { 'stroke-width': 1.5 }),
            // (The beard in two thin strands; a dark line under each eye.)
            ink('M -1.4 -20.4 L -2.6 -14 M 1.8 -20.6 L 3 -14.2', { 'stroke-width': 1.3 }),
            ink('M -8.2 -32.6 Q -5 -30.6 -1.8 -32.6 M 1.8 -32.6 Q 5 -30.6 8.2 -32.6', { 'stroke-width': 1.1 }),
            { tag: 'circle', attrs: { cx: -15.5, cy: -30, r: 2.3, stroke: GOLD, fill: 'none', 'stroke-width': 1.3 } },
        ],
        shoulders: [[0, -12], [0, -12]],
        hips: [[0, 22], [0, 22]],
        top: [0, -61],
        eyes: { at: [[-5, -35], [5, -35]], r: 1.9, travel: 3.2 },
    }),
};
