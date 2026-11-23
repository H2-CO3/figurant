// A small library of props. Each is plain data: copy one to make your own.
// Units are character units; furniture has its origin on the floor.

import { DEFAULT_PROPORTIONS } from '../body/body.js';

// A seat a default character can sit on with its feet flat on the ground.
const SEAT = DEFAULT_PROPORTIONS.shin;

/** A chair seen from the side. The sitter faces right; flip it to face left. */
export const chair = {
    name: 'chair',
    shapes: [
        { tag: 'path', attrs: { d: `M -11 0 L -11 ${-SEAT - 34}` } },        // back leg and backrest
        { tag: 'path', attrs: { d: `M -11 ${-SEAT} L 12 ${-SEAT} L 12 0` } }, // seat and front leg
    ],
    points: { seat: [-1, -SEAT], back: [-11, -SEAT - 30] },
};

/** A couch seen from the front, long enough for one figure to lie on. */
export const couch = {
    name: 'couch',
    shapes: [
        { tag: 'path', attrs: { d: 'M -52 -4 L -52 -40 Q -52 -48 -44 -48 L 44 -48 Q 52 -48 52 -40 L 52 -4' }, fill: true }, // back
        { tag: 'path', attrs: { d: 'M -60 -4 L -60 -30 Q -60 -36 -54 -36 Q -48 -36 -48 -30 L -48 -22 L 48 -22 L 48 -30 Q 48 -36 54 -36 Q 60 -36 60 -30 L 60 -4 Z' }, fill: true }, // arms and seat
        { tag: 'path', attrs: { d: 'M -54 -4 L -54 0 M 54 -4 L 54 0' } }, // feet
    ],
    points: { seat: [0, -22], left: [-36, -22], right: [36, -22] },
};

/** A notebook held open. Origin: where the hand holds it. */
export const notebook = {
    name: 'notebook',
    shapes: [
        { tag: 'path', attrs: { d: 'M -1 -15 L 11 -15 L 11 1 L -1 1 Z' }, fill: true },
        { tag: 'path', attrs: { d: 'M 2 -11 L 8 -11 M 2 -7 L 8 -7' }, weight: 0.4 },
    ],
    points: { grip: [0, 0], page: [5, -4] },
};

/** A pen. Origin: where the fingers hold it; the tip is what writes. */
export const pen = {
    name: 'pen',
    shapes: [{ tag: 'path', attrs: { d: 'M 0 -9 L 0 3' }, weight: 0.75 }],
    points: { grip: [0, 0], tip: [0, 3] },
};
