// A bonsai, in ink wash: a low bowl in two strokes, a twisted trunk in one
// bold one, foliage as grey washes with a few dark dabs, and a red seal on
// the bowl. Two ink dots for eyes. What is its own: its foliage sways behind
// every move and spreads when it is startled.

import { kit, brush, INK, RED } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
/** The clumps of foliage: [x, y, rx, ry]. */
const CLUMPS = [[-24, -34, 20, 11], [8, -50, 22, 12], [28, -28, 16, 9]];

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        const foliage = CLUMPS.map(() => stage.el('g', group));
        foliage.forEach((clump, i) => {
            const [, , rx, ry] = CLUMPS[i];
            stage.el('ellipse', clump, { cx: 0, cy: 0, rx, ry, fill: INK, opacity: 0.2 });
            stage.el('ellipse', clump, { cx: -rx * 0.2, cy: ry * 0.15, rx: rx * 0.62, ry: ry * 0.6, fill: INK, opacity: 0.2 });
            for (const [dx, dy, r] of [[-0.5, -0.2, 1.8], [0.1, 0.3, 2.2], [0.5, -0.3, 1.5]]) k.dab(clump, dx * rx, dy * ry, r, INK, 0.85);
        });
        // The trunk, and a branch to each side.
        k.stroke(group, [2, 22], [-14, 2], [4, -22], 5);
        k.stroke(group, [4, -22], [10, -34], [8, -44], 2.6);
        k.stroke(group, [-4, -2], [-16, -14], [-24, -28], 2.2);
        k.stroke(group, [6, -14], [18, -18], [26, -24], 1.9);
        // The bowl: a wash, a stroke for its rim, one for its foot; the seal.
        k.wash(group, 'M -28 22 L 28 22 L 22 40 L -22 40 Z', 0.14);
        k.stroke(group, [-30, 22], [0, 26], [30, 22], 2.8);
        k.stroke(group, [-20, 41], [0, 43], [20, 41], 2);
        stage.el('rect', group, { x: 12, y: 29, width: 6.5, height: 6.5, fill: RED });
        const eyes = [[-9, 31], [1, 31]].map(() => stage.el('ellipse', group, { fill: INK, stroke: 'none' }));

        const frame = { hips: [[-9, 42], [9, 42]], shoulders: [[-27, 26], [27, 26]], hipY: 42, top: [8, -62], soft: 0.5 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1);
                foliage.forEach((clump, i) => {
                    const [x, y] = CLUMPS[i], breeze = Math.sin(s.clock * 0.0016 + i * 1.7) * 1.4;
                    const spread = 1 + 0.22 * wide;
                    clump.setAttribute('transform', `translate(${f(x * spread - clamp(drag[0], -9, 9) * (0.6 + i * 0.2) + breeze)} ${f(y * spread - clamp(drag[1], -6, 6) * 0.5)}) scale(${f(spread)})`);
                });
                const open = clamp(s.lid, 0, 1) * (1 - 0.5 * clamp(s.squint, 0, 1)), r = 2.2 * (1 + 0.3 * wide);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 1 : -9) + s.gazeX * 2)); eye.setAttribute('cy', f(31 + s.gazeY * 1.6));
                    eye.setAttribute('rx', f(r)); eye.setAttribute('ry', f(Math.max(0.4, r * open)));
                });
            },
        };
    },
};

export const bonsai = {
    name: 'bonsai',
    style: 'default',
    line: 2,
    limbs: INK,
    head,
    proportions: { thigh: 15, shin: 17, reach: 28, stride: 16, lift: 7, upper: 18, fore: 18 },
};
