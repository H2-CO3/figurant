// A dancer, in cut paper: her. A stick figure dressed in paper: a coral dress
// with a skirt that flares, a mustard belt, a sand head, navy hair with a
// ponytail and a coral band, two navy dots for eyes with a lash each, two
// coral cheeks. What is its own: the ponytail swings behind every move;
// `twirl` (0 -> 1) opens the skirt wide and lifts its hem, as when she spins;
// `blush` (0 -> 1) makes the cheeks grow, one notch at a time.
//
// Paper does not stretch: what moves by itself moves in notches, as in
// stop-motion.

import { kit, CORAL, MUSTARD, NAVY, SAND } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const notch = (v, n = 4) => Math.round(v * n) / n;
const skirt = open => { const hem = 17 + 12 * open, drop = 25 - 7 * open; return `M -7.4 3 L 7.6 3.4 L ${f(hem)} ${f(drop)} Q 0 ${f(drop + 3 - 5 * open)} ${f(-hem)} ${f(drop + 0.6)} Z`; };

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        // The ponytail, behind the head; then the dress: the skirt, the bodice over it, the belt.
        const tail = stage.el('g', group);
        k.piece(tail, 'M 9 -44 Q 24 -45 24 -30 Q 23 -20 17 -15 Q 20 -27 12 -36 Z', NAVY, 1);
        const hem = [stage.el('path', group, { fill: NAVY, stroke: 'none', opacity: 0.2, transform: 'translate(1.8 2.3)' }), stage.el('path', group, { fill: CORAL, stroke: 'none' })];
        k.piece(group, 'M -9.4 -14 L 9.8 -13.6 L 7.6 4.4 L -7.4 4 Z', CORAL, 1.4);
        k.piece(group, 'M -8 1.4 L 8.2 1.8 L 7.8 5.4 L -7.6 5 Z', MUSTARD, 0.8);
        // The head, the hair, the band.
        k.piece(group, 'M -13.6 -34 Q -13.8 -47.6 0 -48 Q 13.8 -47.6 14 -34 Q 13.6 -20.6 0 -20.4 Q -13.4 -20.8 -13.6 -34 Z', SAND, 1.8);
        k.piece(group, 'M -14.6 -32 Q -16 -50.6 0 -50.8 Q 15.4 -50.4 14.8 -36 Q 6 -40 -4 -43.6 Q -11 -40 -14.6 -32 Z', NAVY, 1.1);
        k.piece(group, 'M -12 -45.4 Q 0 -51.6 12.6 -44.6 L 13.4 -41.4 Q 0 -48 -12.8 -42.2 Z', CORAL, 0.7);
        const cheeks = [-8.4, 8.4].map(x => k.dot(group, x, -28.4, 2.6, CORAL));
        const eyes = [-5, 5].map(x => stage.el('ellipse', group, { cx: x, cy: -34, rx: 1.9, ry: 1.9, fill: NAVY, stroke: 'none' }));
        const lashes = [-1, 1].map(side => stage.el('path', group, { fill: 'none', stroke: NAVY, 'stroke-width': 1.1, 'stroke-linecap': 'round' }));
        const frame = { hips: [[-5, 22], [5, 22]], shoulders: [[-8.8, -11.6], [9.2, -11.2]], hipY: 22, top: [0, -51], soft: 0.25 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, blush: 0, twirl: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const gx = notch(clamp(s.gazeX, -1, 1), 3), gy = notch(clamp(s.gazeY, -1, 1), 3), wide = clamp(s.wide, 0, 1);
                eyes.forEach((eye, i) => {
                    const x = (i ? 5 : -5) + gx * 2.6, y = -34 + gy * 2.2;
                    eye.setAttribute('cx', f(x)); eye.setAttribute('cy', f(y));
                    eye.setAttribute('ry', f(1.9 * (0.15 + 0.85 * notch(clamp(s.lid, 0, 1), 2)) * (1 + 0.5 * wide) * (1 - 0.45 * clamp(s.squint, 0, 1))));
                    eye.setAttribute('rx', f(1.9 * (1 + 0.3 * wide)));
                    lashes[i].setAttribute('d', `M ${f(x + (i ? 1.6 : -1.6))} ${f(y - 1.6)} l ${i ? 2.4 : -2.4} -2`);
                });
                cheeks.forEach(cheek => cheek.setAttribute('r', f(2.6 + 2.2 * notch(clamp(s.blush, 0, 1)))));
                // The skirt flares with `twirl`, and with a quick move sideways.
                const open = notch(clamp(Math.max(s.twirl, Math.abs(drag[0]) / 9), 0, 1));
                for (const piece of hem) piece.setAttribute('d', skirt(open));
                tail.setAttribute('transform', `rotate(${f(notch(clamp(-drag[0] * 3 + 24 * clamp(s.twirl, 0, 1), -30, 30) / 30, 5) * 30)} 10 -42)`);
            },
        };
    },
};

export const paperDancerHer = {
    name: 'paper-dancer-her',
    style: 'papier-decoupe',
    line: 2.6,
    limbs: NAVY,
    head,
    arms: 'front',
    proportions: { thigh: 25, shin: 26, reach: 47, foot: 8, stride: 23, lift: 9, upper: 22, fore: 22, hand: 6 },
};
