// The customs officer of the harbour, in line and gold: the stick figure in
// uniform. A three-cornered hat, blue (the one colour this style allows
// itself besides its gold, and only here: a uniform must be seen), two gold
// epaulettes, a belt across the chest, two stern eyebrows. Like the pirate
// (./pirate.js), it is the plain stick figure with clothes drawn over it.

import { shapeHead } from 'figurant';
import { GOLD, INK, PAPER } from '../kit.js';

const BLUE = '#2f5d9b';
// (The uniform is drawn finer than the body, so that a hat stays a hat at this size.)
const gold = (d, more = {}) => ({ tag: 'path', attrs: { d, stroke: GOLD, fill: PAPER, 'stroke-linejoin': 'round', 'stroke-width': 1.5, ...more } });
const ink = (d, more = {}) => ({ tag: 'path', attrs: { d, stroke: INK, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...more } });

export const customsOfficer = {
    name: 'customs-officer',
    style: 'trait-et-or',
    line: 3,
    head: shapeHead({
        shapes: [
            { tag: 'line', attrs: { x1: 0, y1: -20, x2: 0, y2: 22 } },                    // spine
            // The epaulettes, and the belt across the chest with its plate.
            gold('M -13 -13 L -3 -15 L -3 -10 L -13 -8 Z'),
            gold('M 13 -13 L 3 -15 L 3 -10 L 13 -8 Z'),
            ink('M -8 -6 L 8 14', { 'stroke-width': 1.8 }),
            gold('M -2.6 1 L 2.6 1 L 2.6 6.4 L -2.6 6.4 Z'),
            { tag: 'circle', attrs: { cx: 0, cy: -35, r: 15 }, fill: true },               // head
            // The hat: blue, three corners, a gold edge and a cockade.
            { tag: 'path', attrs: { d: 'M -11 -45 Q 0 -62 11 -45 Z', fill: BLUE, stroke: GOLD, 'stroke-linejoin': 'round', 'stroke-width': 1.5 } },
            { tag: 'path', attrs: { d: 'M -25 -44 Q -13 -53 0 -47 Q 13 -53 25 -44 Q 13 -39 0 -42 Q -13 -39 -25 -44 Z', fill: BLUE, stroke: GOLD, 'stroke-linejoin': 'round', 'stroke-width': 1.5 } },
            { tag: 'circle', attrs: { cx: 0, cy: -47, r: 2.4, fill: GOLD, stroke: 'none' } },
            // Two stern eyebrows, a mouth that gives nothing away.
            ink('M -9 -40 L -2.4 -38.4 M 9 -40 L 2.4 -38.4', { 'stroke-width': 1.6 }),
            ink('M -4 -26.4 L 4 -26.4', { 'stroke-width': 1.5 }),
        ],
        shoulders: [[0, -12], [0, -12]],
        hips: [[0, 22], [0, 22]],
        top: [0, -61],
        eyes: { at: [[-5, -35], [5, -35]], r: 1.9, travel: 3.2 },
    }),
};
