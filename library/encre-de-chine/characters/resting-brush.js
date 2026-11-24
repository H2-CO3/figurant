// The calligraphy brush lying on the floor, as somebody of a scene: the
// brush of the props (../props/ink-brush.js), at rest, its tuft to the
// right. It has no face and no limbs. `gone` (0 -> 1) takes it away: a scene
// sets it when a hand picks the brush up, and back when it is laid down.
// `rock` (degrees) rolls it on its handle.

import { inkBrush } from '../props/ink-brush.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        for (const shape of inkBrush.shapes) stage.el(shape.tag, group, { ...(shape.weight ? { 'stroke-width': 2.4 * shape.weight } : {}), ...shape.attrs });
        const frame = { hips: [[-2, -2], [2, -2]], shoulders: [[-20, -3], [20, -3]], hipY: -2, top: [0, -8] };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, gone: 0, rock: 0 },
            frame: () => frame,
            draw({ state: s, matrix }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')}) translate(0 -3) rotate(${(-4 + s.rock).toFixed(2)})`);
                group.setAttribute('opacity', (1 - clamp(s.gone, 0, 1)).toFixed(2));
            },
        };
    },
};

export const restingBrush = {
    name: 'resting-brush',
    style: 'encre-de-chine',
    line: 2.4,
    limbs: 'none',
    arms: 'none',
    sits: false,
    head,
    proportions: { thigh: 4, shin: 4, reach: 2, stride: 6, lift: 0, upper: 4, fore: 4 },
};
