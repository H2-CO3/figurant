// The reference character: a plain stick figure. It exercises the generic body
// with nothing special on top, and serves as the model to copy.

import { shapeHead } from '../heads/shape-head.js';

export const stickman = {
    name: 'stickman',
    line: 3,
    head: shapeHead({
        shapes: [
            { tag: 'line', attrs: { x1: 0, y1: -20, x2: 0, y2: 22 } },            // spine
            { tag: 'circle', attrs: { cx: 0, cy: -35, r: 15 }, fill: true },      // head
        ],
        shoulders: [[0, -12], [0, -12]],
        hips: [[0, 22], [0, 22]],
        top: [0, -50],
        eyes: { at: [[-5, -37], [5, -37]], r: 1.9, travel: 3.5 },
    }),
};
