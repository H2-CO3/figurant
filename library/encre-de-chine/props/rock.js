// A rock to sit on, in ink wash: a grey wash for its mass, one bold stroke
// over its shoulder, a dry one along its foot, two dabs of moss. Low and
// broad: its top is 26 above the floor. Origin: the floor, under its middle.

import { strokeShape, washShape } from '../kit.js';

export const inkRock = {
    name: 'ink-rock',
    style: 'encre-de-chine',
    shapes: [
        washShape('M -38 0 C -44 -12 -34 -24 -18 -26 C -6 -30 14 -29 26 -24 C 38 -20 42 -8 36 0 Z', 0.24),
        washShape('M -6 0 C -4 -12 10 -24 26 -24 C 38 -20 42 -8 36 0 Z', 0.16),
        strokeShape([-38, -2], [-40, -22], [-14, -27], 3.4),
        strokeShape([-14, -27], [8, -31], [28, -23], 1.8, 0.85),
        strokeShape([-34, 0], [0, 2.4], [36, 0], 1.4, 0.55),
        strokeShape([4, -20], [8, -14], [6, -6], 0.9, 0.4),
        { tag: 'circle', attrs: { cx: 18, cy: -25.5, r: 2.1, fill: '#111111', stroke: 'none', opacity: 0.55 } },
        { tag: 'circle', attrs: { cx: 23, cy: -23.6, r: 1.4, fill: '#111111', stroke: 'none', opacity: 0.4 } },
    ],
    points: { top: [-4, -26] },
};
