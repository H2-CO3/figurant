// An inkstone with its ink stick, in ink wash: the top face as a pale wash,
// the pool of ground ink at one end, one bold stroke along the near edge, and
// the stick resting across the other end. Low and heavy: it comes up to the
// calligraphy brush's ankle. Origin: the floor, under its middle.

import { strokeShape, washShape, INK } from '../kit.js';

export const inkstone = {
    name: 'inkstone',
    style: 'encre-de-chine',
    shapes: [
        // The top face, then the near side, darker.
        washShape('M -21 -8 C -21 -13.5 21 -13.5 21 -8 C 21 -3.5 -21 -3.5 -21 -8 Z', 0.12),
        washShape('M -21 -8 C -21 -3.5 21 -3.5 21 -8 L 20 -1.5 C 14 1.5 -14 1.5 -20 -1.5 Z', 0.3),
        // The pool: the brush is loaded here.
        { tag: 'path', attrs: { d: 'M -16 -8.4 C -16 -11.4 0 -11.6 1 -8.6 C 1.5 -6.2 -15.5 -5.8 -16 -8.4 Z', fill: INK, stroke: 'none', opacity: 0.93 } },
        // The near edge, in one stroke; the far rim, barely said.
        strokeShape([-21, -3], [0, 2.4], [21, -3], 3),
        strokeShape([-12, -12.2], [4, -13.6], [19, -10.4], 0.9, 0.7),
        // The ink stick, resting on the rim, its worn end in the air.
        { tag: 'path', attrs: { d: 'M 7.5 -8.2 L 26 -17.6 L 28.2 -13.6 L 9.8 -4.2 Z', fill: INK, stroke: 'none' } },
        { tag: 'path', attrs: { d: 'M 14.6 -10.4 L 21 -13.6', fill: 'none', stroke: '#f5f1e8', 'stroke-width': 0.8, 'stroke-linecap': 'round', opacity: 0.8 } },
    ],
    points: { pool: [-7.5, -8.5], top: [0, -12], stick: [18, -11] },
};
