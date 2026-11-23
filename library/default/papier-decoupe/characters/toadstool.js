// A toadstool, in cut paper: a coral cap with white dots on a sand-coloured
// stem, a darker gill line under the cap. What is its own: the cap sits
// loose. It tips towards what it looks at, lifts off when it is startled,
// and lands a moment after the stem does.

import { kit, CORAL, WHITE, SAND, NAVY, MUSTARD } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        // The stem, with a skirt; its face.
        k.piece(group, 'M -13 -6 C -15 12 -19 30 -17 40 Q 0 46 17 40 C 19 30 15 12 13 -6 Z', SAND);
        k.piece(group, 'M -17 2 Q 0 10 17 2 Q 0 5 -17 2 Z', WHITE, 1);
        stage.el('ellipse', group, { cx: -10, cy: 24, rx: 3.6, ry: 2.4, fill: CORAL, opacity: 0.6 });
        stage.el('ellipse', group, { cx: 10, cy: 24, rx: 3.6, ry: 2.4, fill: CORAL, opacity: 0.6 });
        const eyes = [[-6.5, 16], [6.5, 16]].map(() => stage.el('ellipse', group, { fill: NAVY, stroke: 'none' }));
        const mouth = stage.el('path', group, { fill: 'none', stroke: NAVY, 'stroke-width': 1.7, 'stroke-linecap': 'round' });
        // The cap, on top of everything.
        const cap = stage.el('g', group);
        k.piece(cap, 'M -40 -6 Q 0 2 40 -6 Q 0 -1 -40 -6 Z', MUSTARD, 1);
        k.piece(cap, 'M -42 -8 C -42 -50 42 -50 42 -8 Q 0 -1 -42 -8 Z', CORAL, 2.2);
        for (const [x, y, r] of [[-22, -22, 5.4], [-2, -34, 6.2], [20, -22, 4.8], [4, -15, 3.4], [-12, -37, 2.6], [28, -13, 2.8]]) k.dot(cap, x, y, r, WHITE);

        const frame = { hips: [[-9, 42], [9, 42]], shoulders: [[-15, 14], [15, 14]], hipY: 42, top: [0, -40], soft: 0.7 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1);
                const lift = 10 * wide + clamp(-drag[1] * 1.1, 0, 14), tip = 7 * clamp(s.gazeX, -1, 1) + clamp(drag[0] * 1.2, -12, 12);
                cap.setAttribute('transform', `translate(0 ${f(-lift)}) rotate(${f(tip)} 0 -6)`);
                const open = clamp(s.lid, 0, 1) * (1 - 0.5 * clamp(s.squint, 0, 1)), r = 2.8 * (1 + 0.3 * wide);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 6.5 : -6.5) + s.gazeX * 2.4)); eye.setAttribute('cy', f(16 + s.gazeY * 2));
                    eye.setAttribute('rx', f(r)); eye.setAttribute('ry', f(Math.max(0.5, r * open)));
                });
                mouth.setAttribute('d', wide > 0.5 ? 'M -2.6 26 a 2 2.4 0 1 0 4 0 a 2 2.4 0 1 0 -4 0' : `M -4 25 Q 0 ${f(28.4 - 3 * clamp(s.squint, 0, 1))} 4 25`);
            },
        };
    },
};

export const toadstool = {
    name: 'toadstool',
    style: 'default',
    line: 2.6,
    limbs: NAVY,
    head,
    proportions: { thigh: 15, shin: 17, reach: 28, stride: 17, lift: 8, upper: 18, fore: 18 },
};
