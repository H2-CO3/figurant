// The sheet on its easel, as somebody of a scene: the easel of the props
// (../props/easel.js), and on its paper what gets written, stroke after
// stroke. It has no face and no limbs; its numbers are the writing:
//   `heaven` 0 -> 4   how much of 天 is written (2.5: two strokes and half
//                     of the third);
//   `earth`  0 -> 6   the same for 地;
//   `seal`   0 -> 1   the red seal under them.
// A scene sets them, one stroke at a time (`set: { heaven: 1 }, over: 700`),
// while whoever holds the brush follows the stroke. Its place: the floor,
// under the middle of the easel.

import { easel } from '../props/easel.js';
import { INK, RED } from '../kit.js';
import { strokes, SEAL } from '../writing.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const LINE = 3;

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        for (const shape of easel.shapes) stage.el(shape.tag, group, shape.attrs);
        const ink = (d, colour, width) => stage.el('path', group, { d, fill: 'none', stroke: colour, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1, visibility: 'hidden' });
        const written = Object.fromEntries(['heaven', 'earth'].map(name => [name, strokes(name).map(stroke => ink(stroke.points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' '), INK, stroke.weight * 0.8 * LINE / 3))]));
        const seal = ink(`M ${SEAL[0]} ${SEAL[1]} l 8 0 l 0 8 l -8 0 Z m 2.2 2.4 l 3.6 0 m -1.8 0 l 0 3.6 m -2 0 l 4 0`, RED, 1.1);
        const show = (path, share) => { path.setAttribute('stroke-dashoffset', (1 - clamp(share, 0, 1)).toFixed(3)); path.setAttribute('visibility', share > 0.001 ? 'visible' : 'hidden'); };

        const frame = { hips: [[-2, -2], [2, -2]], shoulders: [[-26, -80], [26, -80]], hipY: -2, top: [0, -152] };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, heaven: 0, earth: 0, seal: 0 },
            frame: () => frame,
            draw({ state: s, matrix }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                for (const name of ['heaven', 'earth']) written[name].forEach((path, i) => show(path, s[name] - i));
                show(seal, s.seal);
            },
        };
    },
};

export const inkSheet = {
    name: 'ink-sheet',
    style: 'encre-de-chine',
    line: LINE,
    limbs: 'none',
    arms: 'none',
    sits: false,
    head,
    proportions: { thigh: 4, shin: 4, reach: 2, stride: 6, lift: 0, upper: 4, fore: 4 },
};
