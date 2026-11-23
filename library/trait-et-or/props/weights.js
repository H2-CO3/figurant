// A set of weights on its case, in line and gold, for the scales: two weights
// standing, and the empty place of a third. Sized so that the scales, bending
// a little, take the missing one from its place. `weight` is that third one,
// held by its knob. Origin of the case: the floor, under its middle.

import { goldShape, inkShape, dotShape, FINE, THREAD } from '../kit.js';

/** The height of the case, and where the missing weight stands on it (from its middle). */
export const CASE = { height: 20, place: 12 };
/** How tall the loose weight is, knob included. */
export const WEIGHT = 10.5;

/** A weight standing at (x, y): a knob on a short drum, `w` wide and `h` tall. */
const drum = (x, y, w, h) => `M ${x - w / 2} ${y} L ${x - w / 2} ${y - h + 4} Q ${x - w / 2} ${y - h + 2.4} ${x - 1.5} ${y - h + 2.4} L ${x - 1.9} ${y - h} L ${x + 1.9} ${y - h} L ${x + 1.5} ${y - h + 2.4} Q ${x + w / 2} ${y - h + 2.4} ${x + w / 2} ${y - h + 4} L ${x + w / 2} ${y} Z`;
const top = -CASE.height;

export const weights = {
    name: 'weights',
    style: 'trait-et-or',
    shapes: [
        goldShape(`M -20 0 L -20 ${top + 4} L 20 ${top + 4} L 20 0 Z`),
        goldShape(`M -22 ${top + 4} L -22 ${top} L 22 ${top} L 22 ${top + 4} Z`, THREAD),
        inkShape(`M -15 -4 L -15 ${top + 8} L 15 ${top + 8} L 15 -4 Z`, FINE),
        goldShape(drum(-12, top, 11, 14), THREAD),
        goldShape(drum(0.5, top, 9, 12), THREAD),
        inkShape(`M ${CASE.place - 4} ${top - 1.6} L ${CASE.place + 4} ${top - 1.6}`, FINE),
        dotShape(-20, top + 4, 2.2), dotShape(20, top + 4, 2.2), dotShape(0, -10, 1.6),
    ],
    points: { place: [CASE.place, top], top: [0, top] },
};

export const weight = {
    name: 'weight',
    style: 'trait-et-or',
    shapes: [goldShape(drum(0, WEIGHT, 8, WEIGHT), THREAD)],
    points: { grip: [0, 0], foot: [0, WEIGHT] },
};
