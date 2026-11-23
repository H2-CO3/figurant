// A rock, in ink wash: a grey wash, two bold strokes for its near edges, a few
// dry marks of moss. Origin: the floor, under its middle.

import { strokeShape, washShape } from '../kit.js';

export const rock = {
    name: 'rock',
    style: 'default',
    shapes: [
        washShape('M -30 0 C -32 -18 -16 -30 -2 -26 C 12 -36 30 -20 28 0 Z', 0.16),
        strokeShape([-30, 0], [-30, -24], [-2, -26], 3.2),
        strokeShape([-2, -26], [22, -32], [28, 0], 2.4),
        strokeShape([-12, -2], [-8, -14], [0, -16], 1.4, 0.6),
        strokeShape([8, -4], [14, -12], [18, -10], 1.2, 0.6),
    ],
    points: { top: [0, -28] },
};
