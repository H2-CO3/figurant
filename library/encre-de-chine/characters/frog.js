// A frog, in ink wash: one grey wash for the body, a bold stroke down the
// back, another over the folded haunch, a pale throat, an eye under its bump.
// An animal, so an animal's body, seen from the side and crouched. Its hind
// legs are the engine's (their feet, their walk, their placed steps), but it
// lays them down itself as brush strokes: a shank from the knee under the
// haunch back to the ankle, and a long foot pointing ahead (the engine's own
// lines are switched off with `limbs: 'none'`: at rest they would point one
// foot backwards). It draws its short forelegs the same way, half a stride
// out of step, and has no arms. It turns round to walk the other way.
//
// What is its own:
//   its throat swells and sinks as it breathes, fills when it is startled,
//       and with `croak` (0 -> 1) for a scene; it lags behind every move;
//   its eye closes from below, slowly if asked slowly (`lid`);
//   `tongue` 0 -> 1 shoots its tongue (its one touch of red, hidden at rest)
//       up to 64 units ahead of its mouth, higher or lower with `gazeY`.

import { anatomy } from 'figurant';
import { brush, INK, RED } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

/** Where the legs attach, from the middle of the body, and the mouth. */
const HIND = -22, FRONT = 21, BELLY = 12, MOUTH = [45, -8], KNEE = [-6, 10];
export const TONGUE = 64;

const head = {
    create({ stage, layer, line }) {
        // The forelegs first: the body's wash lies over where they join it.
        const front = [-1, 1].map(() => stage.el('path', layer, { fill: INK, stroke: 'none' }));
        const hind = [-1, 1].map(() => stage.el('path', layer, { fill: INK, stroke: 'none' }));
        const group = stage.el('g', layer);
        const path = (d, opacity = 1, fill = INK) => stage.el('path', group, { d, fill, stroke: 'none', opacity });

        // The throat, under everything: a pale wash and the thin line of its skin.
        const pouch = path('', 0.1), skin = path('', 0.85);
        const tongue = path('', 1, RED);
        // The body: a wash from rump to snout, darker along the back.
        path('M -37 9 C -32 -12 -2 -25 22 -23 C 38 -24 49 -14 46 -8 C 38 -4 32 6 23 11 C 8 16 -24 16 -37 9 Z', 0.1);
        path('M -34 4 C -26 -12 -2 -24 20 -22 C 4 -16 -14 -8 -34 4 Z', 0.16);
        // The back in one stroke, the snout in another, the mouth as a hair line.
        path(brush([-38, 10], [-16, -24], [21, -23], 4.2));
        path(brush([31, -22], [43, -19], [47, -9], 2));
        path(brush([46.5, -7.6], [38, -3.6], [29, -6.5], 1.1));
        // The haunch, folded over the hind leg. The belly is left to the wash.
        path(brush([-35, 9], [-21, -15], [-5, 11], 4.6));
        // Two marks on its back.
        path(brush([-10, -9.5], [-6, -12.5], [-2, -11.5], 2.2), 0.55);
        path(brush([4, -14.5], [7, -16.6], [10, -15.6], 1.7), 0.55);
        // The eye, under its bump: a dark ball with a point of paper, a lid that comes up from below.
        const bump = path('');
        const ball = stage.el('ellipse', group, { fill: INK, stroke: 'none' });
        const glint = stage.el('circle', group, { fill: '#f5f1e8', stroke: 'none' });
        const lower = path('', 0.9);

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, croak: 0, tongue: 0 },
            // The hind legs are the engine's; they stay under the haunch whichever way it faces.
            frame: s => ({ hips: [[HIND * s.dir, BELLY], [HIND * s.dir, BELLY]], shoulders: [[0, 0], [0, 0]], hipY: BELLY, top: [0, -26], soft: 0.8 }),
            draw({ state: s, P, matrix, k, drag, ground, body }) {
                // Drawn facing right; mirrored when it faces left.
                const m = matrix;
                group.setAttribute('transform', `matrix(${[m[0] * s.dir, m[1] * s.dir, m[2], m[3], m[4], m[5]].map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1), lid = clamp(s.lid, 0, 1) * (1 - 0.45 * clamp(s.squint, 0, 1));
                const lookX = clamp(s.gazeX * s.dir, -1, 1), lookY = clamp(s.gazeY, -1, 1);

                // The throat: it breathes by itself, fills with a fright or a croak, and lags behind a move.
                const breath = 0.1 + 0.1 * Math.sin(s.clock * 0.0031);
                const swell = clamp(breath + s.croak + 0.6 * wide, 0, 1.2);
                const lagX = clamp(drag[0] * s.dir, -5, 5), lagY = clamp(drag[1], -4, 4);
                const cx = 38 + 13 * swell - lagX, cy = 6 + 9 * swell - lagY;
                pouch.setAttribute('d', `M 45 -7 Q ${f(cx)} ${f(cy)} 23 11 L 29 -6 Z`);
                pouch.setAttribute('opacity', f(0.1 + 0.07 * swell));
                skin.setAttribute('d', brush([45.5, -7], [cx, cy], [23, 11], 1.3 + 0.5 * swell));

                // The eye: larger with a fright; the lid rises from below and the ball flattens under it.
                const r = 3.3 * (1 + 0.3 * wide), ex = 25.5, ey = -22.5 - 1.5 * wide;
                bump.setAttribute('d', brush([18.5, -21.5], [ex, ey - 11.5 - 2 * wide], [32.5, -21.5], 2.2));
                ball.setAttribute('cx', f(ex)); ball.setAttribute('cy', f(ey - r * (1 - lid) * 0.5));
                ball.setAttribute('rx', f(r)); ball.setAttribute('ry', f(Math.max(0.25, r * lid)));
                glint.setAttribute('cx', f(ex + 1.1 + 1.1 * lookX)); glint.setAttribute('cy', f(ey - 1 + 1.1 * lookY));
                glint.setAttribute('r', f(0.95 * Math.max(0, lid * 2 - 1)));
                lower.setAttribute('d', lid < 0.97 ? brush([ex - r - 0.6, ey + 0.4], [ex, ey + r * (2 * lid - 1) + 1.4], [ex + r + 0.6, ey + 0.4], 1) : '');

                // The tongue: a thin red stroke with a thicker end.
                const out = clamp(s.tongue, 0, 1) * TONGUE;
                if (out < 1) tongue.setAttribute('d', '');
                else {
                    const rise = lookY * 0.6, end = [MOUTH[0] + out * Math.cos(rise), MOUTH[1] - 1 + out * Math.sin(rise)];
                    const mid = [(MOUTH[0] + end[0]) / 2, (MOUTH[1] - 1 + end[1]) / 2 - out * 0.08];
                    tongue.setAttribute('d', `${brush([MOUTH[0] - 2, MOUTH[1] - 1], mid, end, 1.7)} M ${f(end[0] + 2.3)} ${f(end[1])} a 2.3 2 0 1 0 -4.6 0 a 2.3 2 0 1 0 4.6 0 Z`);
                }

                // The forelegs: short, a stroke each, walking half a stride out of step with the hind legs.
                const pose = { ...s, phase: s.phase + Math.PI / 2, footL: null, footR: null };
                const fore = { ...body, thigh: 9.5, shin: 9.5, foot: 5, stride: body.stride * 0.8 };
                front.forEach((node, i) => {
                    const leg = anatomy.legPoints(fore, pose, i ? 1 : -1, P((FRONT - (i ? 0 : 3)) * s.dir, BELLY - 3), ground, k);
                    if (!leg) { node.setAttribute('d', ''); return; }
                    const [hx, hy] = leg.hip, [jx, jy] = leg.knee, [ax, ay] = leg.foot;
                    // One stroke bowing through the elbow, and the hand flat on the ground.
                    node.setAttribute('d', `${brush([hx, hy], [2 * jx - (hx + ax) / 2, 2 * jy - (hy + ay) / 2], [ax, ay], line * k * 1.5)} ${brush([ax - 1.2 * k * s.dir, ay - 0.3 * k], [(ax + leg.toe[0]) / 2, ay - 1.6 * k], leg.toe, line * k * 1.1)}`);
                    node.setAttribute('opacity', i ? '1' : '0.5');
                });

                // The hind legs: the engine says where each foot is; the shank runs to it from the knee.
                hind.forEach((node, i) => {
                    const leg = anatomy.legPoints(body, s, i ? 1 : -1, P(HIND * s.dir, BELLY), ground, k);
                    if (!leg) { node.setAttribute('d', ''); return; }
                    const knee = P((KNEE[0] - (i ? 0 : 4)) * s.dir, KNEE[1]), [ax, ay] = leg.foot;
                    const toe = [ax + s.dir * Math.abs(leg.toe[0] - ax), leg.toe[1]];
                    node.setAttribute('d', `${brush(knee, [(knee[0] + ax) / 2 - 3 * k * s.dir, (knee[1] + ay) / 2 + 3 * k], [ax, ay], line * k * 1.7)} ${brush([ax - 1.5 * k * s.dir, ay - 0.4 * k], [(ax + toe[0]) / 2, ay - 2 * k], toe, line * k * 1.8)}`);
                    node.setAttribute('opacity', i ? '1' : '0.5');
                });
            },
        };
    },
};

export const frog = {
    name: 'frog',
    style: 'encre-de-chine',
    line: 2.2,
    limbs: 'none',
    head,
    arms: 'none',
    // A frog does not sit on a ledge with its legs hanging.
    sits: false,
    // Short shanks, long feet, small steps: it stays close to the ground.
    proportions: { thigh: 8, shin: 9, reach: 14, foot: 11, stride: 9, lift: 5 },
};
