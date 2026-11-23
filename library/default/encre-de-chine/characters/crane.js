// A crane, in ink wash: a body laid in with one grey wash and a bold stroke
// along the back, a long neck in a single line, dark tail feathers, a touch
// of red on the crown. A bird, so a bird's body: two long legs, no arms. It
// is seen from the side and turns round to walk the other way. `wave` opens
// its wing; its neck stretches when it is startled and reaches towards what
// it looks at.

import { kit, brush, INK, RED } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        // Tail feathers, the body's wash, the stroke of the back.
        k.stroke(group, [-18, -4], [-36, -2], [-50, 10], 4.5);
        k.stroke(group, [-18, 0], [-34, 6], [-44, 18], 3.6);
        k.stroke(group, [-16, 4], [-28, 12], [-34, 22], 2.6, 0.8);
        k.wash(group, 'M -24 -6 C -14 -20 18 -18 26 -4 C 28 8 10 16 -6 14 C -20 13 -28 4 -24 -6 Z', 0.16);
        k.stroke(group, [-24, -6], [0, -24], [26, -6], 3.4);
        k.stroke(group, [-8, 13], [8, 17], [24, 2], 1.6, 0.7);
        // The wing: it lifts when the crane waves.
        const wing = stage.el('path', group, { fill: INK, stroke: 'none', opacity: 0.85 });
        // The neck, the head, the beak, and the red crown: all move together.
        const neck = stage.el('path', group, { fill: INK, stroke: 'none' });
        const skull = stage.el('g', group);
        stage.el('path', skull, { d: brush([-4, 0], [1, -6], [6, 0], 3.2), fill: INK });
        stage.el('path', skull, { d: brush([5, -0.5], [14, 0.5], [24, 3], 1.5), fill: INK });
        k.dab(skull, 0.5, -4.6, 2.6, RED);
        const eye = k.dab(skull, 2.6, -0.8, 1, '#f5f1e8');

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0 },
            // Its legs stay under the middle of its body whichever way it faces.
            frame: s => ({ hips: [[-2 * s.dir, 14], [-2 * s.dir, 14]], shoulders: [[0, 0], [0, 0]], hipY: 14, top: [0, -22], soft: 0.6 }),
            draw({ state: s, matrix, drag }) {
                const m = matrix;
                group.setAttribute('transform', `matrix(${[m[0] * s.dir, m[1] * s.dir, m[2], m[3], m[4], m[5]].map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1), look = s.gazeX * s.dir;
                // Where the head is: up on a long neck, further up when startled, forward and down to look.
                const hx = 34 + 8 * look - clamp(drag[0] * s.dir, -8, 8), hy = -46 - 10 * wide + 12 * clamp(s.gazeY, -1, 1) + 6 * (1 - clamp(s.lid, 0, 1)) + clamp(drag[1], -6, 6);
                neck.setAttribute('d', brush([22, -8], [(22 + hx) / 2 + 12, (hy - 8) / 2 - 4], [hx, hy], 2.2));
                skull.setAttribute('transform', `translate(${f(hx)} ${f(hy)})`);
                eye.setAttribute('r', f(Math.max(0.2, clamp(s.lid, 0, 1) * (1 + 0.5 * wide))));
                const up = clamp(Math.max(s.wave, wide * 0.6), 0, 1);
                wing.setAttribute('d', brush([10, -8], [-10, -4 - 26 * up], [-30, 6 - 44 * up], 5 + 3 * up));
            },
        };
    },
};

export const crane = {
    name: 'crane',
    style: 'default',
    line: 1.8,
    limbs: INK,
    head,
    arms: 'none',
    sits: false,
    proportions: { thigh: 21, shin: 25, reach: 44, foot: 8, stride: 18, lift: 14 },
};
