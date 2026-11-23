// A mailbox on its post, in cut paper: a teal box with a paler door, a coral
// flag standing up (there is mail), a tuft of grass at
// its foot. Made for the paper house: it comes up to the house's shoulder,
// and its door faces left, towards the house. Origin: the floor, under the
// post. `paperLetter` is the letter the house takes out of it (a scene
// puts one behind the box first, peeping out of the door): origin where a
// hand holds it, at the middle of its lower edge.

import { paper, TEAL, CORAL, NAVY, WHITE, SKY, MUSTARD, SAND } from '../kit.js';

const DARK = '#2f7269';
/** A piece that stands on the floor: its shadow goes to the right only, never under the floor line. */
const standing = (d, fill, lift = 1.6) => { const [shade, piece] = paper(d, fill, lift); shade.attrs.transform = `translate(${lift * 1.3} 0)`; return [shade, piece]; };

export const paperMailbox = {
    name: 'paper-mailbox',
    style: 'papier-decoupe',
    shapes: [
        // The flag, behind the box.
        ...paper('M 6 -40 L 6.4 -66 L 9.4 -66.2 L 9.6 -40 Z', NAVY, 1),
        ...paper('M 9 -66.4 L 21 -65.4 L 20.4 -56.6 L 9.2 -57.4 Z', CORAL, 1.2),
        // The post.
        ...standing('M -3.4 0 L -2.8 -32 L 3.2 -32.2 L 3.8 0 Z', NAVY, 1.4),
        // The box, its door, its slot.
        ...paper('M -18 -29.6 L -18.4 -44 L -15 -51 L -8 -54.4 L 18.4 -54 L 19 -30 Z', TEAL, 2),
        ...paper('M -18 -29.6 L -18.4 -44 L -15 -51 L -8 -54.4 L -5.4 -54.2 L -5 -29.8 Z', SKY, 1),
        { tag: 'path', attrs: { d: 'M 1 -45 L 13.6 -45.4 L 13.8 -42.4 L 1.2 -42 Z', fill: DARK, stroke: 'none' } },
        { tag: 'circle', attrs: { cx: -11.6, cy: -34.6, r: 1.5, fill: MUSTARD, stroke: 'none' } },
        // Grass at the foot.
        ...standing('M -11 0 L -8.6 -8 L -5.6 -2.4 L -2.4 -10.4 L 0.6 -2.6 L 4 -9 L 6.4 -2 L 9.6 -6.4 L 11.4 0 Z', DARK, 1),
    ],
    points: { slot: [-19, -43], top: [0, -54] },
};

export const paperLetter = {
    name: 'paper-letter',
    style: 'papier-decoupe',
    shapes: [
        // An airmail border: a coral sheet under the white one.
        ...paper('M -11.4 1.8 L -10.8 -14.2 L 11 -14.8 L 11.6 1.4 Z', CORAL, 1.3),
        ...paper('M -9.4 0.2 L -9 -12.4 L 9.2 -12.8 L 9.6 -0.2 Z', WHITE, 0.6),
        // The flap, and its coral seal.
        ...paper('M -9 -12.4 L 9.2 -12.8 L 0.4 -5 Z', SAND, 0.8),
        { tag: 'circle', attrs: { cx: 0.4, cy: -5.6, r: 2, fill: NAVY, stroke: 'none' } },
    ],
    points: { grip: [0, 1.6], top: [0, -14.6] },
};
