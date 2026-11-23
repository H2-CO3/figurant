// A lotus leaf on its stem, in ink wash: the stem in one rising stroke, the
// leaf seen from the side as a tilted dish (a wash, a bold stroke for its
// near rim, two veins), and a smaller leaf lying low beside it. It stands as
// high as the frog's mouth. Origin: the floor, at the foot of the stem.

import { strokeShape, washShape } from '../kit.js';

export const lotusLeaf = {
    name: 'lotus-leaf',
    style: 'encre-de-chine',
    shapes: [
        // The stem leans, as stems do, and thins towards the leaf.
        strokeShape([1, 0], [-7, -20], [3, -35], 2.3),
        // The leaf: its hollow as a wash, darker towards the near rim.
        washShape('M -29 -37 C -22 -47 22 -50 31 -41 C 24 -30 -18 -27 -29 -37 Z', 0.14),
        washShape('M -29 -37 C -14 -35 14 -36 31 -41 C 24 -30 -18 -27 -29 -37 Z', 0.16),
        // The near rim in one stroke; the far rim only at one end.
        strokeShape([-29.5, -37], [2, -22], [31.5, -41.5], 3.6),
        strokeShape([-29, -37.5], [-22, -44.5], [-8, -46.5], 1),
        // Two veins running to the heart of the leaf.
        strokeShape([3, -35.5], [-8, -39], [-17, -41], 0.9, 0.6),
        strokeShape([3, -35.5], [12, -40], [20, -43.5], 0.9, 0.6),
        // A young leaf, flat on the water.
        washShape('M 20 -3.5 C 26 -7.5 44 -7.5 49 -3.5 C 43 0.5 26 0.5 20 -3.5 Z', 0.13),
        strokeShape([20, -3.5], [34, 2.2], [49, -3.5], 2),
    ],
    points: { rim: [-29.5, -37], heart: [3, -36], top: [2, -47] },
};
