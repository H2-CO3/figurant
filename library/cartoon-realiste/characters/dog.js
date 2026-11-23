// A dog on four legs, seen from the side with its face turned to the visitor,
// in the "realistic cartoon" style: a white coat with caramel patches, long
// soft ears, a pale muzzle, a black nose. A sturdy little dog, deep in the
// chest, with a short tail carried high.
//
// A body that is not a person's (docs/CHARACTERS.md): the engine gives it its
// hind legs, it draws its front legs itself with the engine's walk. What is
// its own: its ears flap behind every move, its tail wags when it is pleased
// (`wave`, or its own `wag`, 0 still -> 1 flat out), and its tongue comes out
// when it is excited (`wide`).

import { anatomy } from 'figurant';
import { kit } from '../kit.js';

const OUTLINE = '#4a3324', PATCH = '#c9853f', TONGUE = '#f08a9a';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const pt = p => `${f(p[0])} ${f(p[1])}`;

/** Where the legs attach under the body, from its middle: hind legs behind, front legs ahead. */
const HIND = -22, FRONT = 20, BELLY = 12;

const head = {
    create({ stage, layer, line }) {
        const limb = { fill: 'none', stroke: OUTLINE, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
        const front = [-1, 1].map(() => stage.el('path', layer, limb));
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const coat = k.linear([[0, '#ffffff'], [0.65, '#f4efe6'], [1, '#d9d0c0']], [0, 0, 0, 1]);
        const face = k.radial([[0, '#ffffff'], [0.7, '#f4efe6'], [1, '#dcd3c4']], [0.4, 0.35, 0.8]);

        // The tail, behind the body.
        const tail = [k.line(group, '', OUTLINE, 7.5), k.line(group, '', '#f4efe6', 4.4)];
        // The body: a deep chest, a level back, a round rump; a caramel saddle.
        k.shape(group, 'M -31 -8 C -24 -15 2 -14 16 -13 C 24 -13 28 -17 33 -20 L 37 -4 C 37 6 31 13 22 13 C 12 13 4 9 -6 9 C -14 9 -18 13 -26 13 C -38 13 -40 -1 -31 -8 Z', coat, OUTLINE, 2.2);
        k.patch(group, 'path', { d: 'M -20 -12.4 C -8 -15 6 -14.4 14 -13 C 12 -4 -4 -1 -16 -3 C -22 -5 -23 -9 -20 -12.4 Z' }, PATCH, 0.95);
        k.patch(group, 'path', { d: 'M -34 5 C -32 11 -24 12.5 -18 10.5 C -24 9.5 -30 8.4 -34 5 Z' }, '#9c8f7c', 0.4);

        // The head, turned to the visitor: ears, face, muzzle, nose, tongue.
        const turn = stage.el('g', group);
        const skull = stage.el('g', turn, { transform: 'translate(-10 6) scale(1.26)' });
        const ears = [stage.el('g', skull), stage.el('g', skull)];
        k.shape(ears[0], 'M 23 -34 C 14 -34 12 -20 15 -12 C 19 -8 24 -14 25 -28 Z', PATCH, OUTLINE, 2);
        k.shape(ears[1], 'M 48 -34 C 57 -34 59 -20 56 -12 C 52 -8 47 -14 46 -28 Z', PATCH, OUTLINE, 2);
        stage.el('ellipse', skull, { cx: 35.5, cy: -24, rx: 14.5, ry: 13, fill: face, stroke: OUTLINE, 'stroke-width': 2.2 });
        k.patch(skull, 'path', { d: 'M 37 -37 C 46 -36 50 -30 50 -24 C 45 -26 40 -30 37 -37 Z' }, PATCH, 0.95);
        const tongue = k.shape(skull, '', TONGUE, '#b8556a', 1.2);
        k.patch(skull, 'ellipse', { cx: 35.5, cy: -17, rx: 8.6, ry: 6.2 }, '#fffaf2');
        k.patch(skull, 'ellipse', { cx: 35.5, cy: -20.6, rx: 3.4, ry: 2.5 }, '#2a211c');
        k.patch(skull, 'circle', { cx: 34.4, cy: -21.4, r: 0.9 }, '#ffffff', 0.8);
        const mouth = k.line(skull, '', OUTLINE, 1.3);
        const eyes = [[29.5, -27], [41.5, -27]].map(at => k.eye(skull, at, { r: 4.6, iris: '#6b4423', outline: OUTLINE }));

        return {
            state: { lid: 1, wide: 0, squint: 0, gazeX: 0, gazeY: 0, pupil: 1, wag: 0 },
            frame: s => ({ hips: [[HIND * s.dir, BELLY], [HIND * s.dir, BELLY]], shoulders: [[0, 0], [0, 0]], hipY: BELLY, top: [26 * s.dir, -22], soft: 0.7 }),
            draw({ state: s, P, matrix, k: px, drag, ground, body }) {
                const m = matrix;
                group.setAttribute('transform', `matrix(${[m[0] * s.dir, m[1] * s.dir, m[2], m[3], m[4], m[5]].map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1), happy = clamp(Math.max(s.wag, s.wave), 0, 1);

                const bob = 1.4 * Math.sin(2 * s.phase) * s.walk;
                turn.setAttribute('transform', `translate(${f(s.gazeX * s.dir * 1.6)} ${f(s.gazeY * 3 + bob)})`);
                for (const eye of eyes) eye({ ...s, gazeX: s.gazeX * s.dir });
                // Ears: hinged at the top, they flap behind a move and lift a little when it is startled.
                const flap = clamp(drag[0] * s.dir * 2.2, -24, 24) + clamp(-drag[1] * 1.6, -10, 22);
                ears[0].setAttribute('transform', `rotate(${f(flap + 14 * wide)} 23 -33)`);
                ears[1].setAttribute('transform', `rotate(${f(flap - 14 * wide)} 48 -33)`);
                // Pleased or excited: the mouth opens and the tongue hangs out, panting.
                const out = clamp(Math.max(wide, happy * 0.8), 0, 1), pant = out * (1 + 0.25 * Math.sin(s.clock * 0.02));
                tongue.setAttribute('d', out > 0.15 ? `M 33 -14 Q 33 ${f(-14 + 8 * pant)} 35.5 ${f(-13 + 9 * pant)} Q 38 ${f(-14 + 8 * pant)} 38 -14 Z` : '');
                mouth.setAttribute('d', 'M 35.5 -18.2 L 35.5 -15.6 M 35.5 -15.6 q -3 2.8 -5.6 0.6 M 35.5 -15.6 q 3 2.8 5.6 0.6');

                // The tail: carried high, wagging faster and wider the happier it is.
                const swing = Math.sin(s.clock * (0.006 + 0.03 * happy)) * (4 + 22 * happy);
                const trail = clamp(drag[0] * s.dir, -10, 10);
                tail.forEach(stroke => stroke.setAttribute('d', `M -31 -4 C -38 -10 ${f(-40 + swing * 0.3 - trail)} -20 ${f(-42 + swing - trail)} ${f(-28 - 2 * happy)}`));

                const pose = { ...s, phase: s.phase + Math.PI / 2, footL: null, footR: null };
                front.forEach((node, i) => {
                    const leg = anatomy.legPoints(body, pose, i ? 1 : -1, P(FRONT * s.dir, BELLY), ground, px);
                    node.setAttribute('d', leg ? `M ${pt(leg.hip)} L ${pt(leg.knee)} L ${pt(leg.foot)} L ${pt(leg.toe)}` : '');
                    node.setAttribute('stroke-width', f(line * px));
                });
            },
        };
    },
};

export const dog = {
    name: 'dog',
    style: 'cartoon-realiste',
    line: 3,
    limbs: OUTLINE,
    head,
    arms: 'none',
    sits: false,
    // A short stride, so that front and hind feet reach the floor without the body dipping.
    proportions: { thigh: 13, shin: 14, reach: 24, foot: 5, stride: 11, lift: 6 },
};
