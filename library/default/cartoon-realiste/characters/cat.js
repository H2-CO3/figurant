// A ginger cat on four legs, seen from the side with its face turned to the
// visitor, in the library's "realistic cartoon" style: striped fur, a cream
// chest and muzzle, pink ears and nose, green eyes. A lean cat, not a round
// one: an arched back and a belly tucked up towards the hind legs.
//
// It is the model for a body that is not a person's (docs/CHARACTERS.md).
// The engine gives it its hind legs; it draws its front legs itself with the
// engine's own walk (`anatomy.legPoints`), half a stride out of step, so the
// four feet fall like a cat's. It has no arms: `wave` swishes its tail, which
// also stands up when it is startled and trails behind every move. It turns
// round to walk the other way (it is drawn facing `state.dir`).

import { anatomy } from 'figurant';
import { kit } from '../kit.js';

const OUTLINE = '#5a3214', STRIPE = '#c2611a', CREAM = '#fdebcf', PINK = '#f2a9a0';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const pt = p => `${f(p[0])} ${f(p[1])}`;

/** Where the legs attach under the body, from its middle: hind legs behind, front legs ahead. */
const HIND = -24, FRONT = 21, BELLY = 8;

const head = {
    create({ stage, layer, line }) {
        const limb = { fill: 'none', stroke: OUTLINE, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
        // Front legs first: the body is drawn over where they join it.
        const front = [-1, 1].map(() => stage.el('path', layer, limb));
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const fur = k.linear([[0, '#f8b45a'], [0.6, '#ee9435'], [1, '#d97a22']], [0, 0, 0, 1]);
        const face = k.radial([[0, '#fbc277'], [0.7, '#f09a3c'], [1, '#dc7f26']], [0.4, 0.35, 0.75]);

        // The tail, behind the body: an outline, the fur, two darker rings.
        const tail = [k.line(group, '', OUTLINE, 8), k.line(group, '', '#ee9435', 4.8), k.line(group, '', STRIPE, 4.8, { 'stroke-dasharray': '3 9', 'stroke-linecap': 'butt' })];

        // The body: an arched back, a tucked belly, a cream chest, stripes.
        // A round haunch, a waist, a deep chest, and a neck rising to the head.
        k.shape(group, 'M -30 -8 C -22 -15 -4 -13 8 -12 C 18 -12 24 -17 31 -20 L 35 -6 C 34 3 28 9 20 9 C 11 9 5 3 -5 3 C -13 3 -17 10 -26 10 C -38 10 -39 -3 -30 -8 Z', fur, OUTLINE, 2.2);
        k.patch(group, 'path', { d: 'M 21 8 C 29 6 34 0 34 -9 C 28 -5 23 1 21 8 Z' }, CREAM, 0.95);
        k.patch(group, 'path', { d: 'M -34 2 C -32 8 -24 9.5 -18 7 C -24 6 -30 5 -34 2 Z' }, '#b8621b', 0.4);
        for (const [x, y] of [[-21, -12.6], [-11, -13.4], [-1, -12.6], [9, -11.6]]) k.line(group, `M ${x} ${y} q 2.6 4 0.6 8`, STRIPE, 2);
        k.line(group, 'M -33 -2 q 4 1 6 4', STRIPE, 2);

        // The head, turned to the visitor: ears, face, muzzle, whiskers.
        const turn = stage.el('g', group);
        // Its head is large for its body, as a cartoon cat's is.
        const skull = stage.el('g', turn, { transform: 'translate(-11 5) scale(1.28)' });
        for (const [outer, inner] of [['M 22 -30 L 21 -46 L 33 -38 Z', 'M 24.5 -34 L 24 -42 L 30 -38 Z'], ['M 39 -38 L 50 -45 L 48 -30 Z', 'M 42 -37 L 47.5 -41 L 46.5 -33.5 Z']]) {
            k.shape(skull, outer, fur, OUTLINE, 2);
            k.patch(skull, 'path', { d: inner }, PINK);
        }
        stage.el('ellipse', skull, { cx: 35.5, cy: -24, rx: 15.5, ry: 13.5, fill: face, stroke: OUTLINE, 'stroke-width': 2.2 });
        for (const d of ['M 32 -37 l 0.6 5', 'M 35.5 -37.5 l 0 5.5', 'M 39 -37 l -0.6 5']) k.line(skull, d, STRIPE, 1.8);
        k.patch(skull, 'ellipse', { cx: 35.5, cy: -17.5, rx: 8.2, ry: 5.6 }, CREAM);
        for (const d of ['M 28 -17 L 15 -19', 'M 28 -15 L 16 -13', 'M 43 -17 L 56 -19', 'M 43 -15 L 55 -13']) k.line(skull, d, OUTLINE, 0.8, { opacity: 0.75 });
        k.patch(skull, 'path', { d: 'M 33.4 -21.4 L 37.6 -21.4 L 35.5 -18.8 Z' }, '#e37f8c');
        const mouth = k.line(skull, '', OUTLINE, 1.3);
        const eyes = [[29.5, -26], [41.5, -26]].map(at => k.eye(skull, at, { r: 4.9, iris: '#79b043', outline: OUTLINE }));

        return {
            state: { lid: 1, wide: 0, squint: 0, gazeX: 0, gazeY: 0, pupil: 1 },
            // The hind legs are the engine's; they stay at the back whichever way it faces.
            frame: s => ({ hips: [[HIND * s.dir, BELLY], [HIND * s.dir, BELLY]], shoulders: [[0, 0], [0, 0]], hipY: BELLY, top: [0, -18], soft: 0.7 }),
            draw({ state: s, P, matrix, k: px, drag, ground, body }) {
                // Drawn facing right; mirrored when it faces left.
                const m = matrix;
                group.setAttribute('transform', `matrix(${[m[0] * s.dir, m[1] * s.dir, m[2], m[3], m[4], m[5]].map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1);

                // The head bobs with the walk and turns a little towards what it looks at.
                const bob = 1.3 * Math.sin(2 * s.phase) * s.walk;
                turn.setAttribute('transform', `translate(${f(s.gazeX * s.dir * 1.6)} ${f(s.gazeY * 1.4 + bob)})`);
                for (const eye of eyes) eye({ ...s, gazeX: s.gazeX * s.dir });
                mouth.setAttribute('d', wide > 0.4
                    ? `M 33.6 -16.4 Q 35.5 ${f(-18 + 0)} 37.4 -16.4 Q 35.5 ${f(-13 + 3 * wide)} 33.6 -16.4`
                    : 'M 35.5 -18.8 L 35.5 -16.8 M 35.5 -16.8 q -2.6 2.6 -5 0.8 M 35.5 -16.8 q 2.6 2.6 5 0.8');

                // The tail: up when it waves or is startled, swaying, and trailing behind a move.
                const lift = clamp(Math.max(s.wave, wide), 0, 1);
                const sway = Math.sin(s.clock * (0.003 + 0.009 * lift)) * (3 + 9 * lift);
                const trail = clamp(drag[0] * s.dir, -12, 12), drop = clamp(drag[1], -10, 10);
                const tip = [-54 - 6 * (1 - lift) + sway - trail, -30 - 18 * lift - drop];
                const curve = `M -31 -3 C -44 -5 ${f(-52 - trail * 0.4)} ${f(-14 - 6 * lift)} ${f(tip[0])} ${f(tip[1])}`;
                for (const stroke of tail) stroke.setAttribute('d', curve);

                // The front legs walk half a stride out of step with the hind legs.
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

export const cat = {
    name: 'cat',
    // The style it was drawn in: the atelier lists it under that style only.
    style: 'default',
    line: 2.8,
    limbs: OUTLINE,
    head,
    arms: 'none',
    // A cat does not sit on a ledge with its legs hanging.
    sits: false,
    // The stride is short enough for a leg to reach the ground at both ends of a step
    // without the body dipping: the front and hind legs are out of step, and a dip
    // timed for one pair would lift the other pair's feet off the floor.
    proportions: { thigh: 15, shin: 16, reach: 28, foot: 5, stride: 12, lift: 6 },
};
