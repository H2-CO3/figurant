// A master of the brush and of the fist, in ink wash: a stick figure in a
// robe. A head in one round stroke with a topknot, two brows that say
// everything, two dabs for eyes; a robe laid as a grey wash with one bold
// stroke down its front edge, and a sash whose two ends hang and swing
// behind every move. What is its own: `focus` (0 -> 1) draws the brows down
// and together, as before a strike; the sash and the topknot lag behind it.

import { brush, INK } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const ring = (x, y, r) => `M ${f(x - r)} ${f(y)} a ${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a ${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const path = (d, opacity = 1, more = {}) => stage.el('path', group, { d, fill: INK, stroke: 'none', opacity, ...more });
        // The robe: a wash from the shoulders to below the hips, darker down one side, its front edge in one stroke.
        path('M -10 -15 Q 0 -19 10 -15 L 15 27 Q 0 31 -15 27 Z', 0.2);
        path('M 2 -17 L 10 -15 L 15 27 Q 9 29.4 4 29.6 Z', 0.14);
        path(brush([-3, -16], [4.6, 4], [1.5, 28], 1.5));
        // The sash, and its two ends.
        path(brush([-12.4, 6], [0, 9.4], [12.6, 5.6], 2.4));
        const ends = [path(''), path('')];
        // The head: one round stroke on the paper, a topknot, a band.
        stage.el('path', group, { d: ring(0, -35, 14.4), fill: 'var(--fig-paper, #f5f1e8)', stroke: 'none' });
        path(`${ring(0, -35, 15.2)} ${ring(0.6, -34.6, 13.3)}`, 1, { 'fill-rule': 'evenodd' });
        const knot = stage.el('g', group);
        stage.el('path', knot, { d: 'M -4 -49 Q 0 -60 5 -49.6 Q 0.6 -47 -4 -49 Z', fill: INK, stroke: 'none' });
        path(brush([-13.6, -42], [0, -46.4], [13.8, -42.4], 1.3));
        const brows = [path(''), path('')];
        const eyes = [-5, 5].map(x => stage.el('ellipse', group, { cx: x, cy: -34, rx: 1.7, ry: 1.7, fill: INK, stroke: 'none' }));
        path(brush([-3.4, -25.6], [0, -24.6], [3.6, -25.8], 0.7), 0.9);
        const frame = { hips: [[-5, 24], [5, 24]], shoulders: [[-8.6, -12], [8.6, -12]], hipY: 24, top: [0, -58], soft: 0.3 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, focus: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const gx = clamp(s.gazeX, -1, 1), gy = clamp(s.gazeY, -1, 1), wide = clamp(s.wide, 0, 1), focus = clamp(Math.max(s.focus, s.squint), 0, 1);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 5 : -5) + gx * 2.8)); eye.setAttribute('cy', f(-34 + gy * 2.2));
                    eye.setAttribute('ry', f(1.7 * (0.12 + 0.88 * clamp(s.lid, 0, 1)) * (1 + 0.5 * wide) * (1 - 0.45 * focus)));
                });
                brows.forEach((brow, i) => {
                    const side = i ? 1 : -1, lift = 2.4 * wide - 1.2 * focus;
                    brow.setAttribute('d', brush([side * 9.4, -39.4 - lift - 1.6 * focus], [side * 5.6, -41 - lift], [side * 1.8, -39.2 - lift + 2.2 * focus], 1.1));
                });
                const swing = clamp(-drag[0] * 1.1, -9, 9);
                ends[0].setAttribute('d', brush([-9, 8], [-11 + swing * 0.5, 18], [-10 + swing, 27], 1.4));
                ends[1].setAttribute('d', brush([-6, 8.6], [-6 + swing * 0.5, 17], [-4 + swing, 23], 1.1));
                knot.setAttribute('transform', `rotate(${f(clamp(-drag[0] * 2, -22, 22))} 0 -48)`);
            },
        };
    },
};

export const inkMaster = {
    name: 'ink-master',
    style: 'encre-de-chine',
    line: 2.4,
    limbs: INK,
    head,
    arms: 'front',
    proportions: { thigh: 26, shin: 27, reach: 50, foot: 9, stride: 24, lift: 9, upper: 26, fore: 26, hand: 6 },
};
