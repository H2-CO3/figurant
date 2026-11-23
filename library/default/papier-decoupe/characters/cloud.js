// A cloud, in cut paper: white rounds layered on a pale blue one, navy eyes,
// coral cheeks. What is its own: it rains when it is moved (`rain`, 0 dry ->
// 1 a shower), and a small mustard bolt of lightning shows when it is
// startled. It is soft: it squashes a lot, and its top puffs trail a move.

import { kit, WHITE, SKY, NAVY, CORAL, MUSTARD, TEAL } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const DROPS = [-22, -6, 10, 24];

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        const rain = DROPS.map(() => stage.el('path', group, { fill: TEAL, stroke: 'none' }));
        const bolt = stage.el('path', group, { d: 'M 2 22 L -7 38 L 0 38 L -4 52 L 9 33 L 2 33 L 7 22 Z', fill: MUSTARD, stroke: 'none' });
        // The back layer, pale blue; then the white puffs in front.
        k.piece(group, 'M -46 18 C -58 18 -58 0 -46 -2 C -50 -22 -24 -30 -14 -18 C -6 -38 28 -36 30 -14 C 48 -18 58 4 46 18 Z', SKY, 2.2);
        const puffs = stage.el('g', group);
        k.piece(puffs, 'M -40 20 C -52 20 -52 6 -42 4 C -42 -12 -22 -16 -16 -6 C -8 -24 20 -22 22 -4 C 38 -8 48 8 40 20 Z', WHITE);
        k.dot(group, -22, 9, 4.6, CORAL).setAttribute('opacity', '0.75');
        k.dot(group, 20, 9, 4.6, CORAL).setAttribute('opacity', '0.75');
        const eyes = [[-11, 3], [9, 3]].map(() => stage.el('ellipse', group, { fill: NAVY, stroke: 'none' }));
        const mouth = stage.el('path', group, { fill: 'none', stroke: NAVY, 'stroke-width': 1.8, 'stroke-linecap': 'round' });

        const frame = { hips: [[-14, 20], [14, 20]], shoulders: [[-44, 10], [42, 10]], hipY: 20, top: [0, -32], soft: 1 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, rain: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                puffs.setAttribute('transform', `translate(${f(clamp(-drag[0] * 0.4, -4, 4))} ${f(clamp(-drag[1] * 0.3, -3, 3))})`);
                const wide = clamp(s.wide, 0, 1);
                bolt.setAttribute('opacity', f(wide > 0.5 ? 1 : 0));

                // Drops fall one after another, each a small teardrop.
                const amount = clamp(s.rain, 0, 1);
                rain.forEach((drop, i) => {
                    const fall = ((s.clock * 0.0011 + i * 0.27) % 1), y = 24 + 34 * fall, x = DROPS[i];
                    drop.setAttribute('d', `M ${x} ${f(y)} q -3 5.5 0 7 q 3 -1.5 0 -7 Z`);
                    drop.setAttribute('opacity', f(amount * (1 - fall * 0.7)));
                });

                const open = clamp(s.lid, 0, 1) * (1 - 0.5 * clamp(s.squint, 0, 1)), r = 3.2 * (1 + 0.3 * wide);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 9 : -11) + s.gazeX * 3)); eye.setAttribute('cy', f(3 + s.gazeY * 2.4));
                    eye.setAttribute('rx', f(r)); eye.setAttribute('ry', f(Math.max(0.5, r * open)));
                });
                const smile = 3.4 - 5 * amount - 2 * clamp(s.squint, 0, 1);
                mouth.setAttribute('d', wide > 0.5 ? 'M -3.4 12 a 2.4 2.8 0 1 0 4.8 0 a 2.4 2.8 0 1 0 -4.8 0' : `M -5.5 11 Q -1 ${f(11 + smile)} 3.5 11`);
            },
        };
    },
};

export const cloud = {
    name: 'cloud',
    style: 'default',
    line: 2.6,
    limbs: NAVY,
    head,
    proportions: { thigh: 18, shin: 20, reach: 34, stride: 20, lift: 9, upper: 20, fore: 20 },
};
