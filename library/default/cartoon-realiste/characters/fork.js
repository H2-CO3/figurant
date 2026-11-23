// A stainless steel fork, in the library's "realistic cartoon" style: brushed
// metal with a bright reflection down its length. A very thin head on a body
// with long legs: it shows what to do with a shape that is almost a line,
// which is to let its parts speak. Its tines fan out when it is startled,
// close up when it doubts, and trail behind every move; its two green eyes
// sit low on the head.

import { kit } from '../kit.js';

const OUTLINE = '#39424b';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

/** The four tines: where each leaves the head. */
const TINES = [-14.5, -4.8, 4.8, 14.5];
const ROOT = -22, TIP = -68;

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const steel = k.linear([[0, '#7f8b96'], [0.3, '#f7fafc'], [0.55, '#c7d0d8'], [0.8, '#aab4be'], [1, '#6f7a85']]);

        // Tines first: the head covers where they join it.
        const tines = TINES.map(() => k.shape(group, '', steel, OUTLINE, 1.8));
        // The handle, then the head.
        k.shape(group, 'M -4 2 C -6 28 -7.5 54 -6.5 64 Q 0 73 6.5 64 C 7.5 54 6 28 4 2 Z', steel, OUTLINE, 2);
        k.line(group, 'M -2.4 12 C -3.4 30 -4 48 -3.6 58', '#ffffff', 1.5, { opacity: 0.9 });
        k.patch(group, 'ellipse', { cx: 0, cy: 62.5, rx: 2.1, ry: 2.9 }, '#2b333b');
        k.shape(group, `M -4.5 4 C -6 -6 -19 -6 -19 ${ROOT} L 19 ${ROOT} C 19 -6 6 -6 4.5 4 Z`, steel, OUTLINE, 2);
        k.patch(group, 'path', { d: `M -15.5 ${ROOT + 2} C -15.5 -10 -9 -7 -6 -2 C -10 -8 -13 -12 -13 ${ROOT + 2} Z` }, '#ffffff', 0.8);

        const eyes = [[-7.5, -12.5], [7.5, -12.5]].map(at => k.eye(group, at, { r: 4.6, iris: '#3f8a52', outline: OUTLINE }));
        const frame = { hips: [[-3.5, 66], [3.5, 66]], shoulders: [[-15, -9], [15, -9]], hipY: 66, top: [0, TIP], soft: 0.45 };

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, pupil: 1 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);

                // The tines: fanned by surprise, pinched by doubt, and their points trail.
                const fan = 0.42 * clamp(s.wide, 0, 1) - 0.22 * clamp(s.squint, 0, 1);
                const trail = clamp(drag[0], -9, 9), lift = clamp(drag[1], -6, 6);
                TINES.forEach((x, i) => {
                    const tx = x * (1 + fan) - trail * 0.8, ty = TIP - 5 * clamp(s.wide, 0, 1) - lift * 0.5 + Math.abs(x) * 0.12;
                    const mx = x * (1 + fan * 0.4) - trail * 0.3, my = (ROOT + TIP) / 2;
                    tines[i].setAttribute('d', `M ${f(x - 3.3)} ${ROOT} Q ${f(mx - 3)} ${f(my)} ${f(tx)} ${f(ty)} Q ${f(mx + 3)} ${f(my)} ${f(x + 3.3)} ${ROOT} Z`);
                });
                for (const eye of eyes) eye(s);
            },
        };
    },
};

export const fork = {
    name: 'fork',
    // The style it was drawn in: the atelier lists it under that style only.
    style: 'default',
    line: 2.4,
    limbs: OUTLINE,
    head,
    // Long legs under a narrow body, and arms that reach past its head.
    proportions: { thigh: 21, shin: 23, reach: 40, foot: 7, stride: 22, lift: 9, upper: 23, fore: 23, hand: 6 },
};
