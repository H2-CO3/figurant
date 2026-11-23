// A bush with berries, in cut paper: three rounds of teal paper, a darker one
// behind, coral berries. Origin: the floor, under its middle.

import { paper, TEAL, CORAL, NAVY } from '../kit.js';

export const bush = {
    name: 'bush',
    style: 'default',
    shapes: [
        ...paper('M -34 0 C -44 -6 -42 -26 -26 -26 C -24 -44 6 -46 10 -30 C 28 -40 44 -18 34 0 Z', '#2f7269', 2.2),
        ...paper('M -28 0 C -36 -6 -32 -20 -20 -18 C -16 -32 8 -32 10 -18 C 24 -24 34 -8 26 0 Z', TEAL),
        ...[[-14, -12], [2, -20], [14, -8], [-2, -6]].flatMap(([x, y]) => [
            { tag: 'circle', attrs: { cx: x + 0.8, cy: y + 1, r: 3.2, fill: NAVY, stroke: 'none', opacity: 0.2 } },
            { tag: 'circle', attrs: { cx: x, cy: y, r: 3.2, fill: CORAL, stroke: 'none' } },
        ]),
    ],
    points: { top: [0, -40] },
};
