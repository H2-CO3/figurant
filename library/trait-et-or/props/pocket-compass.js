// A pocket compass, in line and gold, to hold in a hand: a small gold case,
// its ring, and a needle in solid gold. Origin: the hand, under the case.

import { goldShape, inkShape, dotShape, GOLD, FINE, THREAD } from '../kit.js';

const R = 8.5, CY = -R - 1;
const circle = (r, cy) => `M ${-r} ${cy} A ${r} ${r} 0 1 0 ${r} ${cy} A ${r} ${r} 0 1 0 ${-r} ${cy} Z`;

export const pocketCompass = {
    name: 'pocket-compass',
    style: 'trait-et-or',
    shapes: [
        { tag: 'path', attrs: { d: `M -2 ${CY - R - 0.6} A 2.6 2.6 0 1 1 2 ${CY - R - 0.6}`, stroke: GOLD }, weight: FINE },
        goldShape(circle(R, CY), THREAD),
        inkShape(circle(R - 2.6, CY), FINE),
        { tag: 'path', attrs: { d: `M 0 ${CY - 5.2} L 1.9 ${CY} L -1.9 ${CY} Z`, fill: GOLD, stroke: 'none' }, accent: true },
        inkShape(`M -1.9 ${CY} L 0 ${CY + 5.2} L 1.9 ${CY}`, FINE),
        dotShape(0, CY, 1.1),
    ],
    points: { grip: [0, 0], top: [0, CY - R] },
};
