// An "OPEN" sign, the kind that hangs in a diner's window: four magenta tube
// letters in a cyan frame, on two chains under a rail. Origin: the floor
// under its middle; it hangs above head height.
//
// It lights like a sign, by switching. Its `draw` is not a pen tracing it
// but a row of switches: 0.2 hangs it unlit (cold glass only), 0.4 lights
// the frame and the O, 0.6 the P, 0.8 the E, 1 the N. Set it, do not glide
// it: `prop.state.draw = 0.6`.

import { tubeShapes, CYAN, MAGENTA } from '../kit.js';

/** The same tube, cold: what one sees of it when it is off. */
const cold = (d, colour, width) => ({ tag: 'path', attrs: { d, stroke: colour, opacity: 0.16 }, weight: width });
/** Shapes that switch on when `draw` reaches `from`, instead of being traced. */
const from = (level, shapes) => shapes.map(shape => ({ ...shape, attrs: { ...shape.attrs, pathLength: 0.01, 'stroke-dasharray': `${(1.015 - level).toFixed(3)} 10` } }));

const FRAME = 'M -40 -150 L 40 -150 Q 47 -150 47 -143 L 47 -111 Q 47 -104 40 -104 L -40 -104 Q -47 -104 -47 -111 L -47 -143 Q -47 -150 -40 -150 Z';
const HANG = 'M -40 -166 L 40 -166 M -30 -166 L -30 -150 M 30 -166 L 30 -150';
const letter = {
    O: x => `M ${x - 6} -132 Q ${x - 6} -138 ${x} -138 Q ${x + 6} -138 ${x + 6} -132 L ${x + 6} -122 Q ${x + 6} -116 ${x} -116 Q ${x - 6} -116 ${x - 6} -122 Z`,
    P: x => `M ${x - 6} -116 L ${x - 6} -138 L ${x + 1} -138 Q ${x + 7} -138 ${x + 7} -132 Q ${x + 7} -126 ${x + 1} -126 L ${x - 6} -126`,
    E: x => `M ${x + 6} -138 L ${x - 6} -138 L ${x - 6} -116 L ${x + 6} -116 M ${x - 6} -127 L ${x + 3} -127`,
    N: x => `M ${x - 6} -116 L ${x - 6} -138 L ${x + 6} -116 L ${x + 6} -138`,
};
const LETTERS = [['O', -30], ['P', -10], ['E', 10], ['N', 30]].map(([name, x]) => letter[name](x));

export const openSign = {
    name: 'open-sign',
    style: 'neon-nuit',
    shapes: [
        ...from(0.1, [cold(HANG, CYAN, 0.5), cold(FRAME, CYAN, 0.9), ...LETTERS.map(d => cold(d, MAGENTA, 1))]),
        ...from(0.4, [...tubeShapes(HANG, CYAN, 0.5), ...tubeShapes(FRAME, CYAN, 0.9)]),
        ...LETTERS.flatMap((d, i) => from(0.4 + 0.2 * i, tubeShapes(d, MAGENTA, 1))),
    ],
    points: { top: [0, -166], corner: [47, -104], middle: [0, -127] },
};
