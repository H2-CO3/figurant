// A pirate captain, in line and gold: the stick figure in costume. Under it
// is the plain stick figure (a spine, a round head, two eyes that look
// about). Over it, in few pieces, each bold enough to be read from far away:
// a wide three-cornered hat, a dark scarf with two ends flying, two heavy
// locks of hair, a moustache and a small beard with a gold bead, a smile
// with a gold tooth (`grin`, 0 -> 1, widens it), a ring in one ear, a long
// coat with a collar, a belt with its buckle, a sash hanging at the hip.
// Gold for what is cloth and metal, ink for what is hair and leather.
// Every gesture the stick figure knows, it knows. This is how a stick figure
// is given a part to play: copy this file and change the clothes.

import { GOLD, INK, PAPER } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

const head = {
    create({ stage, layer, line }) {
        const group = stage.el('g', layer);
        const round = { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
        const gold = (d, width = 1.7) => stage.el('path', group, { d, fill: PAPER, stroke: GOLD, 'stroke-width': width, ...round });
        const dark = d => stage.el('path', group, { d, fill: INK, stroke: 'none' });
        const ink = (d, width = 1.3) => stage.el('path', group, { d, fill: 'none', stroke: INK, 'stroke-width': width, ...round });
        const metal = d => stage.el('path', group, { d, fill: GOLD, stroke: 'none' });

        // Behind the head: two heavy locks of hair, down to the shoulders.
        dark('M -13 -42 C -22 -37 -23.6 -22 -20.4 -9 C -19 -4.6 -13.6 -5.4 -13.8 -10.6 C -14.2 -19 -12.6 -27 -11 -33 Z');
        dark('M 13 -42 C 22 -37 23.4 -23 20.8 -11 C 19.6 -6.4 14 -7 14 -12 C 14.2 -20 12.6 -27 11 -33 Z');
        // The coat: two long panels, open down the front; a wide collar over them.
        gold('M -1.4 -15 L -14 -12 Q -18.4 6 -19.4 30 L -7.4 27.2 Q -5.4 10 -2.8 -4 Z');
        gold('M 1.4 -15 L 14 -12 Q 18.4 6 19.4 30 L 7.4 27.2 Q 5.4 10 2.8 -4 Z');
        gold('M -1 -15.6 L -11 -13 L -4.2 -3.6 Z', 1.4);
        gold('M 1 -15.6 L 11 -13 L 4.2 -3.6 Z', 1.4);
        // The spine, the shirt open at the neck, the belt and its buckle, the sash at the hip.
        stage.el('line', group, { x1: 0, y1: -20, x2: 0, y2: 22, stroke: INK, 'stroke-width': line, 'stroke-linecap': 'round' });
        dark('M -8.2 7.4 L 8.2 7.4 L 8 11.8 L -8 11.8 Z');
        metal('M -2.8 5.8 L 2.8 5.8 L 2.8 13.4 L -2.8 13.4 Z');
        stage.el('rect', group, { x: -1.2, y: 7.8, width: 2.4, height: 3.6, fill: PAPER, stroke: 'none' });
        const sash = gold('', 1.4);
        // The head, and the ring in its ear.
        stage.el('circle', group, { cx: 0, cy: -35, r: 15, fill: PAPER, stroke: INK, 'stroke-width': line });
        stage.el('circle', group, { cx: -16, cy: -29, r: 2.7, fill: 'none', stroke: GOLD, 'stroke-width': 1.5 });
        // The scarf: a dark band, a knot at one side, two ends that fly.
        dark('M -14.9 -40.6 Q 0 -46.4 14.9 -40.6 L 15 -36 Q 0 -41.8 -15 -36 Z');
        const ends = stage.el('path', group, { fill: 'none', stroke: INK, 'stroke-width': 2.2, ...round });
        stage.el('circle', group, { cx: 15.4, cy: -38.2, r: 2.4, fill: INK, stroke: 'none' });
        // The hat: a low crown, a wide brim turned up in three corners, a band, a gold stud at the front.
        gold('M -12.4 -47.6 Q 0 -66 12.4 -47.6 Z', 1.8);
        gold('M -30 -42.6 Q -21.6 -53.6 -9.4 -50.2 Q 0 -58.4 9.4 -50.2 Q 21.6 -53.6 30 -42.6 Q 15 -37 0 -40.2 Q -15 -37 -30 -42.6 Z', 1.9);
        ink('M -22 -44.6 Q -11 -47.6 0 -45.4 Q 11 -47.6 22 -44.6', 1);
        metal('M 0 -52 L 2.6 -48.6 L 0 -45.4 L -2.6 -48.6 Z');
        // The face: two brows, two eyes with a dark lid over each, the moustache, the smile and its tooth, the beard and its bead.
        const brows = ink('', 1.8);
        const lids = ink('', 1.3);
        const eyes = [-5.4, 5.4].map(x => stage.el('ellipse', group, { cx: x, cy: -34.4, rx: 2.1, ry: 2.1, fill: INK, stroke: 'none' }));
        dark('M 0 -27.8 C -3 -31 -8.4 -29.4 -10 -25.2 C -6.8 -27.2 -3 -26.6 0 -26.2 C 3 -26.6 6.8 -27.2 10 -25.2 C 8.4 -29.4 3 -31 0 -27.8 Z');
        const smile = ink('', 1.5);
        const tooth = stage.el('rect', group, { width: 2.2, height: 2.2, fill: GOLD, stroke: 'none' });
        dark('M -2.2 -21 L 2.2 -21 L 0.9 -13.6 L -0.9 -13.6 Z');
        stage.el('circle', group, { cx: 0, cy: -12.6, r: 1.7, fill: GOLD, stroke: 'none' });

        const frame = { hips: [[0, 22], [0, 22]], shoulders: [[0, -12], [0, -12]], hipY: 22, top: [0, -66], soft: 0.3 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, grin: 0.5 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const gx = clamp(s.gazeX, -1, 1), gy = clamp(s.gazeY, -1, 1), wide = clamp(s.wide, 0, 1), squint = clamp(s.squint, 0, 1), grin = clamp(s.grin, 0, 1);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 5.4 : -5.4) + gx * 2.8)); eye.setAttribute('cy', f(-34.4 + gy * 2.2));
                    eye.setAttribute('ry', f(2.1 * (0.12 + 0.88 * clamp(s.lid, 0, 1)) * (1 + 0.45 * wide) * (1 - 0.5 * squint)));
                });
                // The lids come down when it is easy in its mind; the brows go up when it is startled, one alone when it doubts.
                const heavy = 1.4 * squint - 1.8 * wide, lift = 2.6 * wide;
                lids.setAttribute('d', `M -8.6 ${f(-36.6 + heavy)} Q -5.4 ${f(-38.4 + heavy)} -2.2 ${f(-36.6 + heavy)} M 2.2 ${f(-36.6 + heavy)} Q 5.4 ${f(-38.4 + heavy)} 8.6 ${f(-36.6 + heavy)}`);
                brows.setAttribute('d', `M -9.6 ${f(-40.4 - lift)} Q -5.6 ${f(-42.6 - lift - 1.6 * squint)} -1.8 ${f(-40.6 - lift)} M 1.8 ${f(-40.6 - lift)} Q 5.6 ${f(-42.6 - lift)} 9.6 ${f(-40.4 - lift)}`);
                // The smile, lopsided; its gold tooth shows as it widens.
                const reach = 3.4 + 3 * grin, drop = 1 + 3.6 * grin;
                smile.setAttribute('d', `M ${f(-reach)} -24.6 Q 0.6 ${f(-24.6 + drop)} ${f(reach + 0.8)} ${f(-25.2 - 0.6 * grin)}`);
                tooth.setAttribute('x', f(1.6)); tooth.setAttribute('y', f(-24.9 + drop * 0.42)); tooth.setAttribute('opacity', f(clamp(grin * 2 - 0.5, 0, 1)));
                // What flies behind every move: the ends of the scarf, the sash.
                const fly = clamp(-drag[0] * 0.9, -8, 8);
                ends.setAttribute('d', `M 15.4 -38.2 Q ${f(22 + fly * 0.5)} -36.4 ${f(27 + fly)} -29.6 M 15.4 -38.2 Q ${f(20.4 + fly * 0.4)} -32.4 ${f(21 + fly * 0.8)} -24.6`);
                sash.setAttribute('d', `M -8 11.6 L -3.6 11.8 L ${f(-5.4 + fly * 0.5)} 27 L ${f(-11 + fly * 0.5)} 24.6 Z`);
            },
        };
    },
};

export const pirate = {
    name: 'pirate',
    style: 'trait-et-or',
    line: 3,
    head,
};
