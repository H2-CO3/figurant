// A dancer, in cut paper: him. A stick figure dressed in paper: a teal shirt
// cut a little crooked, a white collar, a mustard bow tie, a sand head with a
// navy cap of hair and its quiff, two navy dots for eyes, two coral cheeks.
// What is its own: the quiff lags behind every move and stands up when it is
// startled; `blush` (0 -> 1) makes the cheeks grow, one notch at a time; the
// bow tie tips towards who it looks at.
//
// Paper does not stretch: what moves by itself moves in notches, as in
// stop-motion.

import { kit, CORAL, MUSTARD, TEAL, NAVY, SAND, WHITE } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const notch = (v, n = 4) => Math.round(v * n) / n;

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        // The shirt, then the collar and the tie over it.
        k.piece(group, 'M -11.4 -14 L 11.8 -13.4 L 9 22.6 L -8.6 22 Z', TEAL, 1.8);
        k.piece(group, 'M -6.4 -14.6 L 0 -8.6 L 6.6 -14.2 L 3 -16.4 L -3 -16.6 Z', WHITE, 0.9);
        const tie = stage.el('g', group);
        k.piece(tie, 'M -6 -12.6 L 0 -10 L 6 -12.8 L 6.2 -6.6 L 0 -9 L -6.2 -6.4 Z', MUSTARD, 0.8);
        // The head, the hair on it, the quiff apart.
        k.piece(group, 'M -13.6 -34 Q -13.8 -47.6 0 -48 Q 13.8 -47.6 14 -34 Q 13.6 -20.6 0 -20.4 Q -13.4 -20.8 -13.6 -34 Z', SAND, 1.8);
        k.piece(group, 'M -14.4 -35 Q -15 -50.4 0 -50.6 Q 15 -50 14.6 -35 Q 9 -42 0 -41.4 Q -9 -41 -14.4 -35 Z', NAVY, 1.1);
        const quiff = stage.el('g', group);
        k.piece(quiff, 'M -3 -48.6 Q 2 -58 11 -53.6 Q 6 -51.6 6.4 -46.6 Z', NAVY, 0.9);
        const cheeks = [-8.4, 8.4].map(x => k.dot(group, x, -28.4, 2.6, CORAL));
        // A wide smile, cut from navy paper: it grows with the cheeks.
        const smile = stage.el('path', group, { fill: NAVY, stroke: 'none' });
        const eyes = [-5, 5].map(x => stage.el('ellipse', group, { cx: x, cy: -34, rx: 1.9, ry: 1.9, fill: NAVY, stroke: 'none' }));
        const frame = { hips: [[-5, 22], [5, 22]], shoulders: [[-10.6, -11.6], [11, -11.2]], hipY: 22, top: [0, -51], soft: 0.25 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, blush: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const gx = notch(clamp(s.gazeX, -1, 1), 3), gy = notch(clamp(s.gazeY, -1, 1), 3), wide = clamp(s.wide, 0, 1);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 5 : -5) + gx * 2.6)); eye.setAttribute('cy', f(-34 + gy * 2.2));
                    eye.setAttribute('ry', f(1.9 * (0.15 + 0.85 * notch(clamp(s.lid, 0, 1), 2)) * (1 + 0.5 * wide) * (1 - 0.45 * clamp(s.squint, 0, 1))));
                    eye.setAttribute('rx', f(1.9 * (1 + 0.3 * wide)));
                });
                cheeks.forEach(cheek => cheek.setAttribute('r', f(2.6 + 2.2 * notch(clamp(s.blush, 0, 1)))));
                const joy = 1.6 + 1.6 * notch(clamp(s.blush, 0, 1));
                smile.setAttribute('d', `M -5.4 -27.4 Q 0 ${f(-27.4 + joy * 2.6)} 5.4 -27.4 Q 0 ${f(-27.4 + joy * 1.1)} -5.4 -27.4 Z`);
                quiff.setAttribute('transform', `rotate(${f(notch(clamp(-drag[0] * 2.4, -24, 24) / 24, 4) * 24 - 16 * wide)} 2 -47)`);
                tie.setAttribute('transform', `rotate(${f(gx * 10)} 0 -9.6)`);
            },
        };
    },
};

export const paperDancerHim = {
    name: 'paper-dancer-him',
    style: 'papier-decoupe',
    line: 2.8,
    limbs: NAVY,
    head,
    arms: 'front',
    proportions: { thigh: 26, shin: 27, reach: 49, foot: 9, stride: 24, lift: 9, upper: 24, fore: 24, hand: 6 },
};
