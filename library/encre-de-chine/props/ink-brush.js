// A calligraphy brush, in ink wash, to lie on the floor or be held: a long
// bamboo handle in two strokes with a node between them, a ferrule, a full
// tuft drawn to a point, a loop of red cord at its end (its one touch of
// red). It lies along its own length, the tuft to the right. Origin: where
// a hand holds it, a third of the way up the handle from the ferrule.

import { strokeShape, RED } from '../kit.js';

export const inkBrush = {
    name: 'ink-brush',
    style: 'encre-de-chine',
    shapes: [
        strokeShape([-44, 0], [-27, -0.6], [-11, 0], 1.7, 0.78),
        strokeShape([-9, 0], [2, 0.5], [13, 0], 1.9, 0.78),
        strokeShape([-10.4, -2.4], [-9.8, 0], [-10.4, 2.6], 0.8),
        strokeShape([13.6, -3.2], [15.2, 0], [13.6, 3.2], 1.6),
        { tag: 'path', attrs: { d: 'M 15.4 -3.6 Q 24 -5.4 33 0 Q 24 5.4 15.4 3.6 Z', fill: '#111111', stroke: 'none', opacity: 0.22 } },
        { tag: 'path', attrs: { d: 'M 22 -3.6 Q 28 -3 33 0 Q 28 3 22 3.6 Q 24 0 22 -3.6 Z', fill: '#111111', stroke: 'none', opacity: 0.94 } },
        { tag: 'path', attrs: { d: 'M -44 0 q -6 -4 -9 0 q 3 4 9 0', fill: 'none', stroke: RED, 'stroke-linecap': 'round' }, weight: 0.5 },
    ],
    points: { grip: [0, 0], tip: [33, 0] },
};
