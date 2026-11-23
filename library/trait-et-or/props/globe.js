// A globe on its stand, in line and gold: a sphere leaning on its axis, held
// by a half ring, on a turned foot. Sized for the compass: its middle comes
// up to the compass's hand. Origin: the floor, under its middle.

import { goldShape, inkShape, dotShape, GOLD, FINE, THREAD } from '../kit.js';

/** The height of the sphere's middle, its radius, the lean of its axis (degrees). */
export const GLOBE = { height: 62, r: 24, lean: 23 };
const { height: H, r: R, lean: LEAN } = GLOBE;
const RING = R + 4.5, a = LEAN * Math.PI / 180;
const pole = [RING * Math.sin(a), -H - RING * Math.cos(a)], foot = [-RING * Math.sin(a), -H + RING * Math.cos(a)];
const leaning = shape => ({ ...shape, attrs: { ...shape.attrs, transform: `rotate(${LEAN} 0 ${-H})` } });
const n = v => v.toFixed(2);

export const globe = {
    name: 'globe',
    style: 'trait-et-or',
    shapes: [
        goldShape('M -18 0 L -18 -5 L 18 -5 L 18 0 Z', THREAD),
        goldShape(`M -3.2 -5 Q -2.2 -14 -1.8 ${-H + RING} L 1.8 ${-H + RING} Q 2.2 -14 3.2 -5 Z`, THREAD),
        // The half ring, from one pole round the back to the foot of the stand.
        { tag: 'path', attrs: { d: `M ${n(pole[0])} ${n(pole[1])} A ${RING} ${RING} 0 1 0 0 ${-H + RING}`, stroke: GOLD }, weight: THREAD },
        { tag: 'circle', attrs: { cx: 0, cy: -H, r: R, stroke: GOLD, fill: 'var(--fig-paper, #fdfcf8)' }, weight: 1.6 },
        leaning(inkShape(`M ${-R + 2} ${-H + 1} Q 0 ${-H + 10} ${R - 2} ${-H + 1}`, FINE)),
        leaning(inkShape(`M 0 ${-H - R + 2} Q ${-R * 0.9} ${-H} 0 ${-H + R - 2} M 0 ${-H - R + 2} Q ${R * 0.9} ${-H} 0 ${-H + R - 2}`, FINE)),
        dotShape(pole[0], pole[1], 2.2), dotShape(foot[0], foot[1], 2.2), dotShape(0, -5, 2),
    ],
    points: { top: [0, -H - R], middle: [0, -H], near: [-R, -H] },
};
