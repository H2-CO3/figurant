// A pedestal, in line and gold: a fluted column on a base, a slab on top.
// Sized for the characters of this style. Origin: the floor, under its middle.

import { goldShape, inkShape, dotShape, FINE, THREAD } from '../kit.js';

/** How high its top is. */
export const PEDESTAL = 46;

export const pedestal = {
    name: 'pedestal',
    style: 'default',
    shapes: [
        goldShape(`M -18 0 L -18 -6 L 18 -6 L 18 0 Z`, THREAD),
        goldShape(`M -13 -6 L -13 ${-PEDESTAL + 6} L 13 ${-PEDESTAL + 6} L 13 -6 Z`),
        inkShape(`M -6.5 -8 L -6.5 ${-PEDESTAL + 8} M 0 -8 L 0 ${-PEDESTAL + 8} M 6.5 -8 L 6.5 ${-PEDESTAL + 8}`, FINE),
        goldShape(`M -20 ${-PEDESTAL + 6} L -20 ${-PEDESTAL} L 20 ${-PEDESTAL} L 20 ${-PEDESTAL + 6} Z`, THREAD),
        dotShape(-13, -6, 2.2), dotShape(13, -6, 2.2), dotShape(-13, -PEDESTAL + 6, 2.2), dotShape(13, -PEDESTAL + 6, 2.2),
    ],
    points: { top: [0, -PEDESTAL] },
};
