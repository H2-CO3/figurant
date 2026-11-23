// A painter's easel with a tall sheet of paper on it, in ink wash: three legs
// in three strokes, a ledge, the sheet as the palest of washes with one edge
// said. Origin: the floor, under its middle. The sheet is 52 wide and 116
// tall, its foot 20 above the floor: `points.sheet` is its top left corner.

import { strokeShape, washShape } from '../kit.js';

export const easel = {
    name: 'easel',
    style: 'encre-de-chine',
    shapes: [
        // The back leg, pale; the two front legs, pressed at the foot.
        strokeShape([4, -150], [16, -70], [30, 0], 1.6, 0.4),
        strokeShape([-3, -152], [-20, -74], [-34, 0], 2.4),
        strokeShape([3, -152], [14, -70], [22, -18], 2.2, 0.85),
        // The bar at the top.
        strokeShape([-12, -147], [0, -145.4], [13, -147.4], 1.5, 0.8),
        // The sheet, in front of the legs: the paper itself, then the palest wash, and its left edge in one long thin stroke.
        { tag: 'path', attrs: { d: 'M -26 -20 L 26 -20 L 26 -136 L -26 -136 Z', fill: 'var(--fig-paper, #f5f1e8)', stroke: 'none' } },
        washShape('M -26 -20 L 26 -20 L 26 -136 L -26 -136 Z', 0.05),
        // The ledge the sheet stands on.
        strokeShape([-34, -19], [0, -16.5], [36, -19.5], 3.2),
        strokeShape([-26, -136], [-26.9, -78], [-26, -20], 0.8, 0.6),
        strokeShape([-26, -136], [0, -136.8], [26, -136], 0.6, 0.45),
    ],
    points: { sheet: [-26, -136], foot: [0, -20] },
};
