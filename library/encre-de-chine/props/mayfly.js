// A mayfly, in ink wash: a body in one small stroke, two pale wings held up,
// two hairs for a tail. Tiny: what a frog watches. Origin: where it stands.

import { strokeShape, washShape } from '../kit.js';

export const mayfly = {
    name: 'mayfly',
    style: 'encre-de-chine',
    shapes: [
        washShape('M 0 -2 C -3 -8 -1 -13 3 -14 C 5 -10 3 -5 0 -2 Z', 0.3),
        washShape('M 0.5 -2 C 1 -7 5 -10 8 -10 C 8 -6 4 -3 0.5 -2 Z', 0.2),
        strokeShape([-4.5, -1.2], [0, -3.4], [4.5, -2.4], 1.7),
        strokeShape([-4.5, -1.2], [-8, -1.6], [-11, -4], 0.5, 0.8),
        strokeShape([-4.5, -1.2], [-8.5, 0], [-11.5, -0.6], 0.5, 0.8),
    ],
    points: { body: [0, -2] },
};
