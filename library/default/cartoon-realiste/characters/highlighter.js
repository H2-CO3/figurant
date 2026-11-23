// A highlighter, in the library's "realistic cartoon" style: a fluorescent
// yellow plastic barrel with a white label, a black collar, a felt tip. It
// has no face at all: everything it feels shows in its tip and the way it
// holds itself. The tip turns towards what it looks at, sinks into the
// barrel when it "blinks", shoots up when it is startled; and it can leave a
// stroke of colour on the ground behind it (`mark`, 0 none -> 1 a full stroke).

import { kit } from '../kit.js';

const OUTLINE = '#3b3716', NEON = '#ffe81a';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

/** Where the barrel ends and the neck begins: the tip turns about this point. */
const NECK = -34;

const head = {
    create({ stage, layer }) {
        // The stroke it leaves lies on the ground, under everything else.
        const stroke = stage.el('path', layer, { fill: 'none', stroke: NEON, 'stroke-linecap': 'round', opacity: 0.55 });
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const plastic = k.linear([[0, '#b99f00'], [0.22, '#fff25a'], [0.5, NEON], [0.82, '#e3c800'], [1, '#a88f00']]);
        const black = k.linear([[0, '#1c1c1c'], [0.3, '#6a6a6a'], [0.6, '#2e2e2e'], [1, '#111111']]);
        const felt = k.linear([[0, '#b7d81f'], [0.45, '#e9ff5c'], [1, '#93b012']]);

        // The neck and the tip, behind the barrel so that they slide into it.
        const neck = stage.el('g', group);
        k.shape(neck, `M -10 ${NECK - 11} L -10 ${NECK - 27} L 10 ${NECK - 37} L 10 ${NECK - 11} Z`, felt, OUTLINE, 2);
        k.line(neck, `M -6 ${NECK - 15} L -6 ${NECK - 25}`, '#f6ffb0', 1.6, { opacity: 0.9 });
        k.shape(neck, `M -15 ${NECK + 6} L -15 ${NECK - 12} L 15 ${NECK - 12} L 15 ${NECK + 6} Z`, black, '#0d0d0d', 2);
        k.line(neck, `M -15 ${NECK - 5} L 15 ${NECK - 5}`, '#8a8a8a', 1, { opacity: 0.7 });

        // The barrel: fluorescent plastic, a black base, a white label, a long reflection.
        k.shape(group, `M -20 ${NECK + 6} Q -20 ${NECK} -14 ${NECK} L 14 ${NECK} Q 20 ${NECK} 20 ${NECK + 6} L 20 40 Q 20 46 14 46 L -14 46 Q -20 46 -20 40 Z`, plastic, OUTLINE, 2.2);
        k.shape(group, 'M -20 33 L 20 33 L 20 40 Q 20 46 14 46 L -14 46 Q -20 46 -20 40 Z', black, '#0d0d0d', 2);
        k.shape(group, 'M -13 -16 Q -13 -19 -10 -19 L 10 -19 Q 13 -19 13 -16 L 13 14 Q 13 17 10 17 L -10 17 Q -13 17 -13 14 Z', '#fbfbf6', '#8f8a5a', 1.1);
        k.line(group, 'M -8 -11 L 8 -11', '#2b2b2b', 2.6);
        k.line(group, 'M -8 -4 L 6 -4 M -8 2 L 8 2 M -8 8 L 2 8', '#9a9a94', 1.2);
        k.patch(group, 'path', { d: `M -16.5 ${NECK + 6} L -16.5 28 Q -15 30 -13.5 28 L -13.5 ${NECK + 6} Q -15 ${NECK + 3} -16.5 ${NECK + 6} Z` }, '#ffffff', 0.7);
        k.patch(group, 'path', { d: `M 15 ${NECK + 10} L 15 30 L 18.5 30 L 18.5 ${NECK + 10} Z` }, '#7d6c00', 0.3);

        const frame = { hips: [[-9, 46], [9, 46]], shoulders: [[-20, -4], [20, -4]], hipY: 46, top: [0, NECK - 37], soft: 0.5 };

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, mark: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag, P, k: px, ground }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);

                // No face: the tip does the looking. It leans where it looks, sinks
                // into the barrel to blink, and shoots out when it is startled.
                const lean = 15 * clamp(s.gazeX, -1, 1) + 7 * clamp(s.squint, 0, 1) + clamp(drag[0] * 0.9, -8, 8);
                const out = 9 * clamp(s.wide, 0, 1) - 8 * (1 - clamp(s.lid, 0, 1)) - 2.5 * clamp(s.gazeY, -1, 1) + clamp(-drag[1] * 0.5, -3, 6);
                neck.setAttribute('transform', `rotate(${f(lean)} 0 ${NECK}) translate(0 ${f(-out)})`);

                // The stroke of colour, on the ground, trailing behind the way it faces.
                const amount = clamp(s.mark, 0, 1);
                if (amount < 0.01) { stroke.setAttribute('d', ''); return; }
                const x = P(0, 0)[0], y = ground - 3 * px;
                stroke.setAttribute('d', `M ${f(x)} ${f(y)} L ${f(x - s.dir * 90 * amount * px)} ${f(y)}`);
                stroke.setAttribute('stroke-width', f(10 * px));
            },
        };
    },
};

export const highlighter = {
    name: 'highlighter',
    // The style it was drawn in: the atelier lists it under that style only.
    style: 'default',
    // Sturdy limbs, a little long for its body: it is a dancer.
    line: 3.6,
    limbs: '#2b2b2b',
    head,
    // Arms in front of the barrel: crossed arms, or a hand on its chest, must show.
    arms: 'front',
    proportions: { thigh: 25, shin: 27, reach: 47, foot: 10, stride: 24, lift: 10, upper: 27, fore: 27, hand: 8 },
};
