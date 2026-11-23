// A neon arrow in its frame, the kind that points to a door. Amber arrow,
// cyan frame. Origin: the floor, under its middle; it stands on a thin post.

import { tubeShapes, CYAN, AMBER } from '../kit.js';

export const arrow = {
    name: 'arrow',
    style: 'default',
    shapes: [
        ...tubeShapes('M 0 0 L 0 -22', CYAN, 0.6),
        ...tubeShapes('M -34 -22 L 34 -22 Q 40 -22 40 -28 L 40 -54 Q 40 -60 34 -60 L -34 -60 Q -40 -60 -40 -54 L -40 -28 Q -40 -22 -34 -22 Z', CYAN, 0.9),
        ...tubeShapes('M -26 -41 L 18 -41 M 6 -52 L 20 -41 L 6 -30', AMBER, 1.1),
    ],
    points: { top: [0, -60] },
};
