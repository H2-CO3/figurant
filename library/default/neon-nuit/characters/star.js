// A star, in neon: a five-pointed tube of cyan light with two magenta points
// for eyes and an amber smile. It is a sign, so it behaves like one: it
// hums (a faint shimmer), dims almost to nothing when it "blinks", burns
// brighter and larger when it is startled, and flickers after a jolt.

import { kit, CYAN, MAGENTA, AMBER } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
/** A five-pointed star of outer radius R, inner radius r, round the origin. */
const starPath = (R, r) => Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + i * Math.PI / 5, radius = i % 2 ? r : R;
    return `${i ? 'L' : 'M'} ${f(Math.cos(a) * radius)} ${f(Math.sin(a) * radius)}`;
}).join(' ') + ' Z';

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        const body = k.tube(group, starPath(44, 19), CYAN, 3.4);
        const eyes = [k.spark(group, -8, -2, 2.4, MAGENTA), k.spark(group, 8, -2, 2.4, MAGENTA)];
        const mouth = k.tube(group, 'M -6 9 Q 0 14 6 9', AMBER, 1.6);

        const frame = { hips: [[-13, 30], [13, 30]], shoulders: [[-36, -10], [36, -10]], hipY: 30, top: [0, -44], soft: 0.3 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1);
                // The light: a hum, a dip when it blinks, a flicker after a jolt.
                const jolt = Math.min(1, Math.hypot(drag[0], drag[1]) / 8);
                const flicker = jolt > 0.2 && Math.sin(s.clock * 0.09) > 0.3 ? 0.45 : 1;
                const light = (0.94 + 0.06 * Math.sin(s.clock * 0.02)) * (0.16 + 0.84 * clamp(s.lid, 0, 1)) * flicker;
                body.setAttribute('opacity', f(light));
                k.redraw(body, starPath(44 + 5 * wide, 19 + 2 * wide));
                eyes.forEach((eye, i) => {
                    eye.setAttribute('transform', `translate(${f(s.gazeX * 4)} ${f(s.gazeY * 3)}) scale(${f(1 + 0.4 * wide)} ${f(Math.max(0.15, clamp(s.lid, 0, 1) * (1 - 0.5 * clamp(s.squint, 0, 1))) * (1 + 0.4 * wide))})`);
                    eye.setAttribute('transform-origin', `${i ? 8 : -8} -2`);
                });
                k.redraw(mouth, wide > 0.5 ? 'M -3 10 a 3 3.4 0 1 0 6 0 a 3 3.4 0 1 0 -6 0' : `M -6 9 Q 0 ${f(14 - 5 * clamp(s.squint, 0, 1))} 6 9`);
                mouth.setAttribute('opacity', f(light));
            },
        };
    },
};

export const star = {
    name: 'star',
    style: 'default',
    line: 2.6,
    limbs: CYAN,
    head,
    proportions: { thigh: 19, shin: 21, reach: 36, stride: 20, lift: 9, upper: 21, fore: 21 },
};
