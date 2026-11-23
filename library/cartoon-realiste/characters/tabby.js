// A tabby cat on four legs, seen from the side with its face turned to the
// visitor, in the "realistic cartoon" style: a grey striped coat, a white
// bib and muzzle, a pink nose, green eyes, whiskers. Slim and long in the
// leg, with a long tail that never quite keeps still.
//
// A body that is not a person's (docs/CHARACTERS.md): the engine gives it its
// hind legs, it draws its front legs itself with the engine's walk. What is
// its own:
//   its tail sways slowly by itself, trails behind every move, and stands
//       straight up, bristling, when it is startled (`wide`);
//   its ears turn back when it is startled or narrows its eyes, and flick;
//   its whiskers lift when it is startled and droop when it blinks;
//   `purr` 0 -> 1: the eyes half close, the tail curls and it trembles a little.

import { anatomy } from 'figurant';
import { kit } from '../kit.js';

const OUTLINE = '#3b3a40', COAT = '#9a9ca6', STRIPE = '#5d5f6b', PINK = '#f2a0a8', WHITE = '#fbfaf6';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const pt = p => `${f(p[0])} ${f(p[1])}`;

/** Where the legs attach under the body, from its middle: hind legs behind, front legs ahead. */
const HIND = -22, FRONT = 19, BELLY = 8;

const head = {
    create({ stage, layer, line }) {
        const limb = { fill: 'none', stroke: OUTLINE, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
        const front = [-1, 1].map(() => stage.el('path', layer, limb));
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const coat = k.linear([[0, '#b4b6c0'], [0.6, COAT], [1, '#7c7e8a']], [0, 0, 0, 1]);
        const face = k.radial([[0, '#bcbec8'], [0.7, COAT], [1, '#83858f']], [0.4, 0.35, 0.8]);

        // The tail, behind the body: an outline stroke and the coat over it, with rings.
        const tail = [k.line(group, '', OUTLINE, 6.6), k.line(group, '', COAT, 3.8), k.line(group, '', STRIPE, 3.8, { 'stroke-dasharray': '2.4 6', 'stroke-linecap': 'butt' })];
        // The body: slim, a level back, a tucked belly, a white bib under the neck.
        const body = stage.el('g', group);
        k.shape(body, 'M -30 -6 C -24 -13 0 -12 14 -11 C 22 -11 27 -14 31 -17 L 34 -3 C 34 5 29 9 21 9 C 12 9 4 5 -6 5 C -14 5 -18 9 -25 9 C -35 9 -37 0 -30 -6 Z', coat, OUTLINE, 2.2);
        for (const x of [-20, -11, -2, 7]) k.patch(body, 'path', { d: `M ${x} -11.6 C ${x + 2.5} -8 ${x + 2.5} -4 ${x + 1} -1 C ${x - 0.5} -4 ${x - 1} -8 ${x - 3} -11 Z` }, STRIPE, 0.9);
        k.patch(body, 'path', { d: 'M 24 -6 C 30 -4 33 0 31 5 C 28 8 23 8.4 20 7 C 24 4 25 -1 24 -6 Z' }, WHITE, 0.95);
        k.patch(body, 'path', { d: 'M -33 3 C -31 8 -24 8.6 -19 7 C -24 6.4 -29 5.6 -33 3 Z' }, '#4c4e58', 0.35);

        // The head, turned to the visitor: ears, face, mask, muzzle, nose, whiskers.
        const turn = stage.el('g', group);
        const skull = stage.el('g', turn, { transform: 'translate(-9 3) scale(1.18)' });
        const ears = [[-1, 26.5], [1, 44.5]].map(([side, x]) => {
            const ear = stage.el('g', skull);
            k.shape(ear, `M ${x - 5.5} -31 L ${x - side * 2.5} -45 L ${x + 5.5} -33 Z`, COAT, OUTLINE, 2);
            k.patch(ear, 'path', { d: `M ${x - 2.6} -33 L ${x - side * 1.8} -41 L ${x + 2.8} -34 Z` }, PINK, 0.9);
            return { ear, side, x };
        });
        stage.el('ellipse', skull, { cx: 35.5, cy: -24, rx: 14, ry: 11.6, fill: face, stroke: OUTLINE, 'stroke-width': 2.2 });
        // The tabby's "M" on the forehead, and a stripe on each cheek.
        k.line(skull, 'M 31.5 -34.6 L 32.6 -31 M 35.5 -35.4 L 35.5 -31.4 M 39.5 -34.6 L 38.4 -31', STRIPE, 1.5);
        k.line(skull, 'M 22.6 -22 L 26 -21 M 23 -18.4 L 26.4 -18.6 M 48.4 -22 L 45 -21 M 48 -18.4 L 44.6 -18.6', STRIPE, 1.3);
        // A white muzzle in two rounds, a pink nose, a small mouth.
        k.patch(skull, 'ellipse', { cx: 32.6, cy: -17.4, rx: 4.4, ry: 3.6 }, WHITE);
        k.patch(skull, 'ellipse', { cx: 38.4, cy: -17.4, rx: 4.4, ry: 3.6 }, WHITE);
        k.shape(skull, 'M 33.6 -21.4 L 37.4 -21.4 L 35.5 -19 Z', PINK, '#b8606c', 0.9);
        const mouth = k.line(skull, '', OUTLINE, 1.2);
        const whiskers = [-1, 1].map(() => k.line(skull, '', OUTLINE, 0.7, { opacity: 0.75 }));
        const eyes = [[29.6, -25.4], [41.4, -25.4]].map(at => k.eye(skull, at, { r: 4.4, iris: '#7fae4a', outline: OUTLINE }));

        return {
            state: { lid: 1, wide: 0, squint: 0, gazeX: 0, gazeY: 0, pupil: 1, purr: 0 },
            frame: s => ({ hips: [[HIND * s.dir, BELLY], [HIND * s.dir, BELLY]], shoulders: [[0, 0], [0, 0]], hipY: BELLY, top: [26 * s.dir, -30], soft: 0.6 }),
            draw({ state: s, P, matrix, k: px, drag, ground, body: legs }) {
                const m = matrix, t = s.clock / 1000;
                const wide = clamp(s.wide, 0, 1), purr = clamp(s.purr, 0, 1), shut = 1 - clamp(s.lid, 0, 1);
                group.setAttribute('transform', `matrix(${[m[0] * s.dir, m[1] * s.dir, m[2], m[3], m[4], m[5]].map(n => n.toFixed(4)).join(' ')})`);
                // Purring: a tremble too small to be a move.
                body.setAttribute('transform', `translate(0 ${f(0.35 * purr * Math.sin(t * 70))})`);

                const bob = 1.1 * Math.sin(2 * s.phase) * s.walk;
                turn.setAttribute('transform', `translate(${f(s.gazeX * s.dir * 1.6)} ${f(s.gazeY * 2.6 + bob + 0.3 * purr * Math.sin(t * 70))})`);
                // Cat's eyes: narrow pupils in the light, round ones when startled; half shut when it purrs.
                for (const eye of eyes) eye({ ...s, gazeX: s.gazeX * s.dir, pupil: 0.72 + 0.6 * wide, lid: clamp(s.lid, 0, 1) * (1 - 0.5 * purr) });
                // Ears: back when startled or wary, pulled by a move, and a flick now and then.
                const flick = Math.max(0, Math.sin(t * 0.9)) ** 24 * 10;
                const back = 22 * Math.max(wide, clamp(s.squint, 0, 1)) + clamp(drag[0] * s.dir * 1.4, -12, 12);
                for (const { ear, side, x } of ears) ear.setAttribute('transform', `rotate(${f(-side * back + (side > 0 ? flick : 0))} ${x} -32)`);
                // Whiskers: three a side, up when startled, down when the eyes close.
                const lift = 0.16 * wide - 0.14 * shut + 0.05 * Math.sin(t * 2.3);
                whiskers.forEach((node, i) => {
                    const side = i ? 1 : -1, x = 35.5 + side * 5.4;
                    node.setAttribute('d', [-0.22, 0, 0.22].map(a => `M ${f(x)} ${f(-17.6 + a * 4)} l ${f(side * 10.5 * Math.cos(a - lift))} ${f(10.5 * Math.sin(a - lift))}`).join(' '));
                });
                mouth.setAttribute('d', `M 35.5 -19 L 35.5 -17.2 M 35.5 -17.2 q -2.2 ${f(1.9 + purr)} -4.2 0.3 M 35.5 -17.2 q 2.2 ${f(1.9 + purr)} 4.2 0.3`);

                // The tail: a slow S that sways; straight up and thick when startled; curled over when it purrs.
                const sway = Math.sin(t * 1.3) * 5 * (1 - wide), trail = clamp(drag[0] * s.dir, -10, 10) * (1 - wide);
                const tipX = -50 + sway - trail + 12 * purr + 18 * wide, tipY = -36 - 6 * wide + 8 * purr;
                const d = `M -30 -3 C ${f(-42 - trail * 0.4 + 8 * wide)} ${f(-4 - 6 * wide)} ${f(-50 + sway * 0.4 + 16 * wide)} ${f(-16 - 4 * wide)} ${f(-42 + sway * 0.7 + 10 * wide)} ${f(-23 - 6 * wide)} S ${f(tipX + 5 * (1 - wide) + 6 * purr)} ${f(tipY + 9 * (1 - wide))} ${f(tipX)} ${f(tipY)}`;
                tail.forEach((stroke, i) => { stroke.setAttribute('d', d); stroke.setAttribute('stroke-width', f((i ? 3.8 : 6.6) + 2.4 * wide)); });

                const pose = { ...s, phase: s.phase + Math.PI / 2, footL: null, footR: null };
                front.forEach((node, i) => {
                    const leg = anatomy.legPoints(legs, pose, i ? 1 : -1, P(FRONT * s.dir, BELLY), ground, px);
                    node.setAttribute('d', leg ? `M ${pt(leg.hip)} L ${pt(leg.knee)} L ${pt(leg.foot)} L ${pt(leg.toe)}` : '');
                    node.setAttribute('stroke-width', f(line * px));
                });
            },
        };
    },
};

export const tabby = {
    name: 'tabby',
    style: 'cartoon-realiste',
    line: 2.6,
    limbs: OUTLINE,
    head,
    arms: 'none',
    sits: false,
    // Long in the leg, with a soft, short step.
    proportions: { thigh: 14, shin: 15, reach: 26, foot: 4, stride: 11, lift: 5 },
};
