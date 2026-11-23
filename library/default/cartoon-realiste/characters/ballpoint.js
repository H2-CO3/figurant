// A ballpoint pen, in the library's "realistic cartoon" style, without its
// cap: a clear six-sided barrel with its tube of blue ink showing through, a
// blue plug at the foot, a brass cone and a tiny ball at the top. Like the
// highlighter it has no face: the cone does the looking. It leans where it
// looks, draws back into the barrel when it "blinks", shoots out when it is
// startled; and it can leave a thin line of ink on the ground behind it
// (`mark`, 0 none -> 1 a full line). `ink` (0 to 1) is how full its tube is.

import { kit } from '../kit.js';

const OUTLINE = '#22304a', BLUE = '#1f4fd6';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

/** Where the barrel ends and the cone begins: the cone turns about this point. */
const NECK = -40;

const head = {
    create({ stage, layer }) {
        // The line it leaves lies on the ground, under everything else.
        const stroke = stage.el('path', layer, { fill: 'none', stroke: BLUE, 'stroke-linecap': 'round', opacity: 0.9 });
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const clear = k.linear([[0, '#b9c7d6'], [0.2, '#f4f8fc'], [0.5, '#dfe8f1'], [0.8, '#c3d0de'], [1, '#93a4b8']]);
        const brass = k.linear([[0, '#8a6a1c'], [0.35, '#f1d27a'], [0.6, '#c79a34'], [1, '#6f5413']]);
        const plug = k.linear([[0, '#12339a'], [0.3, '#4f7bf0'], [0.6, BLUE], [1, '#0f2a80']]);

        // The cone and its ball, behind the barrel so that they slide into it.
        const neck = stage.el('g', group);
        k.shape(neck, `M -8 ${NECK + 4} L -8 ${NECK - 6} L -2.4 ${NECK - 24} L 2.4 ${NECK - 24} L 8 ${NECK - 6} L 8 ${NECK + 4} Z`, brass, '#4a3a10', 1.8);
        k.line(neck, `M -4 ${NECK - 4} L -1.4 ${NECK - 20}`, '#fff3c4', 1.3, { opacity: 0.9 });
        k.shape(neck, `M -1.8 ${NECK - 25.5} a 1.8 1.8 0 1 0 3.6 0 a 1.8 1.8 0 1 0 -3.6 0`, '#d9dde3', '#3a3f48', 1);

        // The barrel: clear plastic, the tube of ink inside it, the plug at the foot, two long reflections.
        k.shape(group, `M -11 ${NECK + 5} Q -11 ${NECK} -7 ${NECK} L 7 ${NECK} Q 11 ${NECK} 11 ${NECK + 5} L 11 40 L -11 40 Z`, clear, OUTLINE, 2);
        const tube = k.shape(group, '', BLUE, '#12339a', 1);
        k.line(group, `M -3.6 ${NECK + 6} L -3.6 39`, '#8fa2b8', 0.9, { opacity: 0.8 });
        k.line(group, `M 3.6 ${NECK + 6} L 3.6 39`, '#8fa2b8', 0.9, { opacity: 0.8 });
        k.shape(group, 'M -11 38 L 11 38 L 11 43 Q 11 48 6 48 L -6 48 Q -11 48 -11 43 Z', plug, '#0c2266', 2);
        k.patch(group, 'path', { d: `M -8.6 ${NECK + 7} L -8.6 34 Q -7.6 36 -6.6 34 L -6.6 ${NECK + 7} Q -7.6 ${NECK + 4} -8.6 ${NECK + 7} Z` }, '#ffffff', 0.85);
        k.patch(group, 'path', { d: `M 7.4 ${NECK + 9} L 7.4 36 L 9.6 36 L 9.6 ${NECK + 9} Z` }, '#5f7189', 0.3);
        // What is printed on it: a mark and a line, as on any pen of its kind.
        k.line(group, 'M 0 -6 L 0 14', '#6b7c93', 1.1, { opacity: 0.8 });
        k.line(group, 'M 0 -14 L 0 -10', '#22304a', 1.6);

        const frame = { hips: [[-6, 48], [6, 48]], shoulders: [[-11, -8], [11, -8]], hipY: 48, top: [0, NECK - 26], soft: 0.4 };

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, mark: 0, ink: 0.8 },
            frame: () => frame,
            draw({ state: s, matrix, drag, P, k: px, ground }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);

                // No face: the cone does the looking.
                const lean = 17 * clamp(s.gazeX, -1, 1) + 6 * clamp(s.squint, 0, 1) + clamp(drag[0] * 0.9, -8, 8);
                const out = 7 * clamp(s.wide, 0, 1) - 9 * (1 - clamp(s.lid, 0, 1)) - 2 * clamp(s.gazeY, -1, 1) + clamp(-drag[1] * 0.5, -3, 5);
                neck.setAttribute('transform', `rotate(${f(lean)} 0 ${NECK}) translate(0 ${f(-out)})`);

                // The ink in its tube: down from the cone, as far as it is full; it sloshes a little behind a move.
                const level = NECK + 6 + 68 * clamp(s.ink, 0.05, 1), slosh = clamp(drag[0] * 0.25, -2, 2);
                tube.setAttribute('d', `M -2.6 ${NECK + 5} L 2.6 ${NECK + 5} L 2.6 ${f(level + slosh)} L -2.6 ${f(level - slosh)} Z`);

                // The line of ink, on the ground, trailing behind the way it faces.
                const amount = clamp(s.mark, 0, 1);
                if (amount < 0.01) { stroke.setAttribute('d', ''); return; }
                const x = P(0, 0)[0], y = ground - 1.5 * px;
                stroke.setAttribute('d', `M ${f(x)} ${f(y)} q ${f(-s.dir * 22 * amount * px)} ${f(-5 * px)} ${f(-s.dir * 45 * amount * px)} 0 t ${f(-s.dir * 45 * amount * px)} 0`);
                stroke.setAttribute('stroke-width', f(2.2 * px));
            },
        };
    },
};

export const ballpoint = {
    name: 'ballpoint',
    style: 'default',
    // Thin limbs for a thin pen: quick on its feet.
    line: 3,
    limbs: '#22304a',
    head,
    arms: 'front',
    proportions: { thigh: 24, shin: 26, reach: 45, foot: 9, stride: 24, lift: 10, upper: 25, fore: 25, hand: 7 },
};
