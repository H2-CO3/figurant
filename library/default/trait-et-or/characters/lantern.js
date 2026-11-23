// A lantern, in line and gold. It has no face: its flame is its heart and
// does the feeling. The flame leans towards what it looks at, sinks to an
// ember when it "blinks", flares when it is startled, and sheds rings of
// light (`glow`, 0 none -> 1 a full halo). The whole lantern swings from its
// ring behind every move.

import { kit, GOLD, INK, FINE, THREAD } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

const head = {
    create({ stage, layer, line }) {
        const group = stage.el('g', layer);
        const k = kit(stage, group, line);
        const halo = [0, 1].map(() => stage.el('circle', group, { cx: 0, cy: -2, fill: 'none', stroke: GOLD, 'stroke-width': line * FINE }));

        // The ring it would hang from, and the cap.
        const ring = stage.el('g', group);
        k.gold(ring, 'M -7 -58 A 7 7 0 1 1 7 -58', THREAD, 'none');
        k.gold(group, 'M -20 -40 L -11 -54 L 11 -54 L 20 -40 Z');
        k.dot(group, -11, -54, 2.2); k.dot(group, 11, -54, 2.2);
        // The glass, its bars, the flame inside, the base.
        k.gold(group, 'M -18 -40 Q -26 -4 -18 32 L 18 32 Q 26 -4 18 -40 Z');
        const flame = k.solid(group, '');
        k.ink(group, 'M -9 -39 Q -13 -4 -9 31 M 9 -39 Q 13 -4 9 31', FINE);
        k.ink(group, 'M -18 -40 L 18 -40 M -18 32 L 18 32', THREAD);
        k.gold(group, 'M -22 32 L 22 32 L 18 44 L -18 44 Z');
        k.dot(group, -18, 32, 2.2); k.dot(group, 18, 32, 2.2);

        const frame = { hips: [[-9, 44], [9, 44]], shoulders: [[-21, -6], [21, -6]], hipY: 44, top: [0, -65], soft: 0.4 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, glow: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                ring.setAttribute('transform', `rotate(${f(clamp(drag[0] * 1.5, -20, 20))} 0 -54)`);

                // The flame: a teardrop that flickers, leans, shrinks and flares.
                const flicker = Math.sin(s.clock * 0.011) * 0.06 + Math.sin(s.clock * 0.017) * 0.04;
                const size = clamp(s.lid, 0.18, 1) * (1 + 0.45 * clamp(s.wide, 0, 1) - 0.25 * clamp(s.squint, 0, 1)) * (1 + flicker);
                const lean = 7 * clamp(s.gazeX, -1, 1) - clamp(drag[0], -8, 8) * 0.8, h = 26 * size, w = 9 * size, base = 20;
                flame.setAttribute('d', `M 0 ${base} C ${f(-w)} ${f(base - h * 0.2)} ${f(-w * 0.7 + lean * 0.4)} ${f(base - h * 0.7)} ${f(lean)} ${f(base - h - 3 * clamp(s.gazeY, -1, 1) * -1)} C ${f(w * 0.7 + lean * 0.4)} ${f(base - h * 0.7)} ${f(w)} ${f(base - h * 0.2)} 0 ${base} Z`);

                // Rings of light, breathing outwards.
                const amount = clamp(Math.max(s.glow, 0.6 * s.wide), 0, 1);
                halo.forEach((circle, i) => {
                    const phase = (s.clock * 0.0006 + i * 0.5) % 1;
                    circle.setAttribute('r', f(34 + 26 * phase));
                    circle.setAttribute('opacity', f(amount * (1 - phase) * 0.8));
                });
            },
        };
    },
};

export const lantern = {
    name: 'lantern',
    style: 'default',
    line: 2.2,
    limbs: INK,
    head,
    proportions: { thigh: 20, shin: 22, reach: 38, stride: 20, lift: 8, upper: 22, fore: 22 },
};
