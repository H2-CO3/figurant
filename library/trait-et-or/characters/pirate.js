// A pirate captain, in line and gold: the stick figure in costume, drawn with
// care. Under it is the plain stick figure (a spine, a round head, two eyes
// that look about); over it, cut the way this style cuts everything (a gold
// contour on paper, details in thin ink, a dot where two pieces meet):
// a three-cornered hat with its plume, a dark scarf knotted under it with its
// ends flying, long hair in four locks, brows that say what it thinks, a
// moustache, a smile that widens (`grin`, 0 -> 1), a beard in two strands, a
// ring in one ear, a long coat with lapels, a belt and its gold buckle.
// Every gesture the stick figure knows, it knows. This is how a stick figure
// is given a part to play: copy this file and change the clothes.

import { kit, GOLD, INK, PAPER, FINE, THREAD } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

const head = {
    create({ stage, layer, line }) {
        const group = stage.el('g', layer);
        // (The clothes are drawn finer than the body: a third of its line, so that a hat stays a hat at this size.)
        const k = kit(stage, layer, 1);
        const thin = (d, weight = FINE) => k.ink(group, d, weight);
        // Behind everything: the hair, four locks of it, two ending in a trinket.
        thin('M -13 -37 C -20 -30 -21 -18 -17 -7 M -9.5 -31 C -15 -24 -16 -14 -13.5 -4', THREAD * 0.7);
        thin('M 13 -37 C 20 -30 21 -19 18 -9 M 9.5 -31 C 15 -24 16 -15 14.5 -6', THREAD * 0.7);
        k.dot(group, -17, -6, 1.8); k.dot(group, 14.5, -5, 1.8);
        // The coat: two long skirts with a lapel each, open on the shirt.
        k.gold(group, 'M -1.5 -14 L -12.5 -10.5 Q -16 2 -18 28 L -6.5 25.5 Q -5 10 -3 -3 Z');
        k.gold(group, 'M 1.5 -14 L 12.5 -10.5 Q 16 2 18 28 L 6.5 25.5 Q 5 10 3 -3 Z');
        thin('M -12.5 -10.5 L -5 -2 M 12.5 -10.5 L 5 -2');
        thin('M -15.4 12 L -6 11 M 15.4 12 L 6 11');
        // The spine, the belt across it, and its buckle: the one solid gold.
        stage.el('line', group, { x1: 0, y1: -20, x2: 0, y2: 22, stroke: INK, 'stroke-width': line, 'stroke-linecap': 'round' });
        k.ink(group, 'M -6.2 9 L 6.2 9', 2);
        k.solid(group, 'M -3 6 L 3 6 L 3 12 L -3 12 Z');
        k.dot(group, 0, 9, 1.1, PAPER);
        // The head.
        stage.el('circle', group, { cx: 0, cy: -35, r: 15, fill: PAPER, stroke: INK, 'stroke-width': line });
        // The ring in its ear.
        stage.el('circle', group, { cx: -15.6, cy: -29.6, r: 2.5, fill: 'none', stroke: GOLD, 'stroke-width': 1 });
        // The scarf: a dark band under the hat, knotted at one side, two ends flying.
        stage.el('path', group, { d: 'M -14.8 -40.4 Q 0 -45.6 14.8 -40.4 L 14.9 -36.8 Q 0 -42 -14.9 -36.8 Z', fill: INK, stroke: 'none' });
        const ends = k.ink(group, '', THREAD);
        k.dot(group, 15, -38.4, 2);
        // The hat: a low crown, three corners, a line of trim, a plume.
        k.gold(group, 'M -12 -47.5 Q 0 -64 12 -47.5 Z');
        k.gold(group, 'M -27.5 -42.6 Q -20 -51.4 -9 -48.8 Q 0 -55.6 9 -48.8 Q 20 -51.4 27.5 -42.6 Q 14 -38.4 0 -40.8 Q -14 -38.4 -27.5 -42.6 Z');
        thin('M -21 -44.4 Q -10 -47 0 -45.2 Q 10 -47 21 -44.4');
        const plume = stage.el('path', group, { fill: 'none', stroke: GOLD, 'stroke-width': 1.3, 'stroke-linecap': 'round' });
        // The face: brows, eyes with a dark line under each, a nose, the moustache, the smile, the beard.
        const brows = k.ink(group, '', THREAD * 0.8);
        const eyes = [-5.2, 5.2].map(x => stage.el('ellipse', group, { cx: x, cy: -35, rx: 1.9, ry: 1.9, fill: INK, stroke: 'none' }));
        thin('M -8.4 -32.2 Q -5.2 -30.4 -2 -32.2 M 2 -32.2 Q 5.2 -30.4 8.4 -32.2');
        thin('M 0.4 -33 L -1 -29.6 L 0.8 -29.4');
        k.ink(group, 'M -0.6 -27.4 Q -4 -29.4 -8 -26.6 M 0.6 -27.4 Q 4 -29.4 8 -26.6', THREAD * 0.85);
        const smile = k.ink(group, '', THREAD * 0.8);
        thin('M -1.5 -21 L -2.8 -14.4 M 1.5 -21 L 2.8 -14.4', THREAD * 0.7);
        k.dot(group, -2.8, -13.8, 1.1); k.dot(group, 2.8, -13.8, 1.1);

        const frame = { hips: [[0, 22], [0, 22]], shoulders: [[0, -12], [0, -12]], hipY: 22, top: [0, -64], soft: 0.3 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, grin: 0.5 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const gx = clamp(s.gazeX, -1, 1), gy = clamp(s.gazeY, -1, 1), wide = clamp(s.wide, 0, 1), squint = clamp(s.squint, 0, 1), grin = clamp(s.grin, 0, 1);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 5.2 : -5.2) + gx * 3)); eye.setAttribute('cy', f(-35 + gy * 2.4));
                    eye.setAttribute('ry', f(1.9 * (0.12 + 0.88 * clamp(s.lid, 0, 1)) * (1 + 0.5 * wide) * (1 - 0.55 * squint)));
                    eye.setAttribute('rx', f(1.9 * (1 + 0.25 * wide)));
                });
                // The brows: up when it is startled, one cocked when it doubts.
                const lift = 2.6 * wide, cock = 2 * squint;
                brows.setAttribute('d', `M -9 ${f(-39.6 - lift)} Q -5.4 ${f(-41.4 - lift - cock)} -2 ${f(-39.8 - lift)} M 2 ${f(-39.8 - lift)} Q 5.4 ${f(-41.4 - lift)} 9 ${f(-39.6 - lift + cock * 0.6)}`);
                // The smile, lopsided, wider with `grin`.
                smile.setAttribute('d', `M ${f(-4 - 2.4 * grin)} -25.4 Q 1 ${f(-24.6 + 4.6 * grin)} ${f(5 + 2.6 * grin)} ${f(-26 - 0.8 * grin)}`);
                // What flies: the ends of the scarf and the plume, behind every move.
                const fly = clamp(-drag[0] * 0.9, -7, 7);
                ends.setAttribute('d', `M 15 -38.4 Q ${f(21 + fly * 0.5)} -36.6 ${f(25 + fly)} -30.6 M 15 -38.4 Q ${f(19.6 + fly * 0.4)} -33 ${f(20 + fly * 0.8)} -26`);
                plume.setAttribute('d', `M 9.6 -51.4 Q ${f(18 + fly * 0.6)} -66 ${f(30 + fly)} -57.6 M ${f(20.6 + fly * 0.7)} -61.8 q 3.4 -4.6 8 -3.4`);
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
