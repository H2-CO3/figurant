// A cocktail glass, in neon: the sign over a bar door. A magenta glass, a
// cyan line for the drink, an amber olive on its pick. What is its own: the
// drink is liquid. It stays level when the glass tilts, sloshes behind
// every move, and leaps when the glass is startled.

import { kit, CYAN, MAGENTA, AMBER } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        const drink = k.tube(group, '', CYAN, 2.2);
        // The bowl, the stem, the foot: one line of glass.
        k.tube(group, 'M -38 -40 L 38 -40 L 0 2 Z M 0 2 L 0 34 M -18 36 L 18 36', MAGENTA, 3.2);
        // The olive on its pick.
        const pick = stage.el('g', group);
        k.tube(pick, 'M 36 -56 L 17 -22', AMBER, 1.4);
        k.tube(pick, 'M 15 -31 a 6 6 0 1 0 12 0 a 6 6 0 1 0 -12 0', AMBER, 2.2);
        const eyes = [k.spark(group, -14, -31, 2, CYAN), k.spark(group, 0, -31, 2, CYAN)];

        const frame = { hips: [[-9, 37], [9, 37]], shoulders: [[-20, -20], [20, -20]], hipY: 37, top: [0, -42], soft: 0.3 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1);
                // The surface: level against the tilt, pushed by a move, raised by a start.
                const slope = clamp(-s.tilt * 0.35 - drag[0] * 0.9, -9, 9), level = -24 - 7 * wide + clamp(drag[1] * 0.4, -3, 3);
                const half = Math.max(4, (2 - level) * 0.9 - 2), wave = Math.sin(s.clock * 0.006) * 1.2;
                k.redraw(drink, `M ${f(-half)} ${f(level + slope)} Q 0 ${f(level + wave)} ${f(half)} ${f(level - slope)}`);
                pick.setAttribute('transform', `rotate(${f(clamp(drag[0] * 1.4, -14, 14))} 17 -22)`);
                const light = 0.16 + 0.84 * clamp(s.lid, 0, 1);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('transform', `translate(${f(s.gazeX * 3)} ${f(s.gazeY * 2)}) scale(${f(1 + 0.4 * wide)})`);
                    eye.setAttribute('transform-origin', `${i ? 0 : -14} -31`);
                    eye.setAttribute('opacity', f(light));
                });
            },
        };
    },
};

export const cocktail = {
    name: 'cocktail',
    style: 'default',
    line: 2.6,
    limbs: MAGENTA,
    head,
    proportions: { thigh: 19, shin: 21, reach: 36, stride: 20, lift: 9, upper: 21, fore: 21 },
};
