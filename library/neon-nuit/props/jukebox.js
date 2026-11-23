// A jukebox, in neon: only its outline and the arches of light every
// jukebox has. An amber cabinet, arches of magenta and cyan round the
// record, a magenta grille. Origin: the floor under its middle.
//
// It lights like a sign, by switching. Its `draw` is not a pen tracing it
// but a row of switches: 0.2 stands it unlit (cold glass only), 0.4 lights
// the cabinet, 0.6 the outer arch, 0.8 the inner arch, 1 the record and the
// grille. Set it, do not glide it: `prop.state.draw = 0.8`.

import { tubeShapes, CYAN, MAGENTA, AMBER } from '../kit.js';

/** The same tube, cold: what one sees of it when it is off. */
const cold = (d, colour, width) => ({ tag: 'path', attrs: { d, stroke: colour, opacity: 0.16 }, weight: width });
/** Shapes that switch on when `draw` reaches `from`, instead of being traced. */
const from = (level, shapes) => shapes.map(shape => ({ ...shape, attrs: { ...shape.attrs, pathLength: 0.01, 'stroke-dasharray': `${(1.015 - level).toFixed(3)} 10` } }));

const CABINET = 'M -46 0 L -46 -94 A 46 46 0 0 1 46 -94 L 46 0 Z M -46 -52 L 46 -52';
const OUTER = 'M -35 -62 L -35 -94 A 35 35 0 0 1 35 -94 L 35 -62';
const INNER = 'M -24 -62 L -24 -94 A 24 24 0 0 1 24 -94 L 24 -62';
// The record under the arches, and its middle.
const RECORD = 'M -13 -90 a 13 13 0 1 0 26 0 a 13 13 0 1 0 -26 0 M -2.5 -90 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0';
// The grille: a fan of bars over the loudspeaker.
const GRILLE = 'M -32 -10 L -32 -30 Q 0 -50 32 -30 L 32 -10 Z M -16 -10 L -16 -36 M 0 -10 L 0 -40 M 16 -10 L 16 -36';
const PARTS = [[CABINET, AMBER, 1.1, 0.4], [OUTER, MAGENTA, 0.9, 0.6], [INNER, CYAN, 0.9, 0.8], [RECORD, AMBER, 0.7, 1], [GRILLE, MAGENTA, 0.7, 1]];

export const jukebox = {
    name: 'jukebox',
    style: 'neon-nuit',
    shapes: [
        ...from(0.1, PARTS.map(([d, colour, width]) => cold(d, colour, width))),
        ...PARTS.flatMap(([d, colour, width, level]) => from(level, tubeShapes(d, colour, width))),
    ],
    points: { top: [0, -140], left: [-46, -62], right: [46, -62], record: [0, -90] },
};
