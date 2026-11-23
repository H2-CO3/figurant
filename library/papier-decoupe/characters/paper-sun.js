// A sun, in cut paper: a mustard disc cut with scissors (its edge has facets),
// a paler round glued on it, and two layers of paper rays behind, coral ones
// and deep mustard ones, which turn in opposite directions, one notch at a
// time. What is its own: the rays. They slide outwards when it is startled
// (the front layer one notch after the back one), droop when it shuts its
// eyes and stop turning while they are shut, and lag behind a move. Two
// numbers of its own: `spin` (degrees: scenes turn the rays with it) and
// `shine` (0 -> 1: the rays slide further out and white sparks show between
// them). A third, `horizon`: at 1 the rays are cut off at the floor, for a
// sun that sets behind something (a ray must not hang under the floor line).
//
// Paper does not stretch: it barely squashes, and everything that moves by
// itself moves in notches, as in stop-motion.

import { kit, CORAL, MUSTARD, NAVY, WHITE } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const RAD = Math.PI / 180;
const SHADOW = NAVY, DEEP = '#e39a35', PALE = '#f7cd72';
/** A notch of stop-motion, in ms: what moves by itself changes only this often. */
const NOTCH = 120;
/** Values that come from the page (a blink, a fright) are cut into a few poses. */
const notch = (v, n = 4) => Math.round(clamp(v, 0, 1) * n) / n;

/** A round cut with scissors: a polygon whose corners are never quite on the circle. */
function round(r, sides, wobble, seed) {
    let d = '';
    for (let i = 0; i < sides; i++) {
        const a = (i + 0.3 * Math.sin(i * 2.4 + seed)) / sides * Math.PI * 2, rr = r * (1 + wobble * Math.sin(i * 1.7 + seed * 3));
        d += `${i ? 'L' : 'M'} ${f(rr * Math.cos(a))} ${f(rr * Math.sin(a))} `;
    }
    return d + 'Z';
}

/** Eight rays per layer; no two cut alike. The ray points up, its base hidden under the disc. */
const BACK = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({
    at: i * 45, d: `M ${f(-6.5 - (i % 3) * 0.5)} -24 L ${f(-1 + (i % 2) * 1.6)} ${f(-51 + (i * 5 % 7) * 0.9)} L ${f(6.4 + (i % 2) * 0.8)} -24 Z`,
}));
const FRONT = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({
    at: 22.5 + i * 45, d: `M ${f(-8 - (i % 2) * 0.7)} -24 L ${f(0.8 - (i % 3) * 0.9)} ${f(-41.5 + (i * 3 % 5) * 0.8)} L ${f(8.2 - (i % 3) * 0.4)} -24 Z`,
}));
let suns = 0;
const SPARK = 'M 0 -4.6 L 1.7 -0.4 L 0.3 4.4 L -1.8 0.3 Z';

const head = {
    create({ stage, layer }) {
        // The rays go under the legs when the page allows it: a ray that points
        // down must not hide them.
        // They sit in a wrapper that can be cut at the floor (`horizon`).
        const wrapper = layer.parentNode?.insertBefore ? stage.el('g', layer.parentNode) : null;
        if (wrapper) layer.parentNode.insertBefore(wrapper, layer.parentNode.firstChild);
        const clipId = `paper-sun-horizon-${++suns}`;
        const sky = wrapper ? stage.el('rect', stage.el('clipPath', wrapper, { id: clipId, clipPathUnits: 'userSpaceOnUse' }), { x: -100000, y: -100000, width: 200000, height: 100000 }) : null;
        const under = wrapper ? stage.el('g', wrapper) : null;
        const group = stage.el('g', layer);
        const k = kit(stage);
        const raysInto = under ?? group;

        // Each layer: all its shadows first, then its rays.
        const rays = (list, fill) => {
            const shades = list.map(ray => stage.el('path', raysInto, { d: ray.d, fill: SHADOW, stroke: 'none', opacity: 0.2 }));
            return list.map((ray, i) => ({ ...ray, shade: shades[i], node: stage.el('path', raysInto, { d: ray.d, fill, stroke: 'none' }) }));
        };
        const sparks = FRONT.map(ray => ({ at: ray.at + 22.5, node: stage.el('path', raysInto, { d: SPARK, fill: WHITE, stroke: 'none' }) }));
        const back = rays(BACK, CORAL), front = rays(FRONT, DEEP);

        k.piece(group, round(30, 17, 0.022, 1), MUSTARD, 2.2);
        k.piece(group, round(23.5, 13, 0.03, 4), PALE, 1.1).setAttribute('transform', 'translate(-1.2 -1.6)');
        k.dot(group, -16, 6, 4.4, CORAL).setAttribute('opacity', '0.8');
        k.dot(group, 15.5, 6.4, 4.4, CORAL).setAttribute('opacity', '0.8');
        const eyes = [-9.5, 9.5].map(() => stage.el('ellipse', group, { fill: NAVY, stroke: 'none' }));
        const mouth = stage.el('path', group, { fill: NAVY, stroke: 'none' });

        // What the rays remember from one notch to the next.
        let tick = -1, turned = 0, spread = 0, late = 0;

        const frame = { hips: [[-10, 28], [10, 28]], shoulders: [[-29, 5], [29, 5]], hipY: 28, top: [0, -31], soft: 0.25 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, spin: 0, shine: 0, horizon: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag, ground }) {
                const m = `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`;
                group.setAttribute('transform', m);
                if (under) {
                    under.setAttribute('transform', m);
                    const cut = s.horizon > 0.5 && Number.isFinite(ground);
                    if (cut) sky.setAttribute('height', f(100000 + ground));
                    if (cut) wrapper.setAttribute('clip-path', `url(#${clipId})`); else wrapper.removeAttribute('clip-path');
                }

                const lid = notch(s.lid), wide = notch(s.wide), shine = clamp(s.shine, 0, 1);
                const now = Math.floor(s.clock / NOTCH);
                if (now !== tick) {
                    tick = now;
                    if (lid > 0.5) turned += 3;          // asleep, the rays stand still
                    late = spread; spread = wide;        // the front layer hears of a fright one notch late
                }
                const droop = 1 - lid;
                // A move leaves the rays a little behind, and turns them.
                const lagX = clamp(-drag[0] * 0.5, -5, 5), lagY = clamp(-drag[1] * 0.5, -5, 5), swing = clamp(drag[0] * 1.6, -14, 14);
                const place = (ray, turn, out, lag) => {
                    const a = ray.at + turn, fall = 38 * droop * Math.sin(a * RAD);
                    const t = `translate(${f(lagX * lag)} ${f(lagY * lag)}) rotate(${f(a)}) translate(0 ${f(-out + 5 * droop)}) rotate(${f(fall)} 0 -25)`;
                    ray.node.setAttribute('transform', t);
                    ray.shade.setAttribute('transform', `translate(1.8 2.3) ${t}`);
                };
                for (const ray of back) place(ray, turned + s.spin + swing, 9 * spread + 7 * shine, 1);
                for (const ray of front) place(ray, -turned * 0.67 - s.spin * 0.5 + swing * 0.5, 7 * late + 5 * shine, 0.5);
                for (const spark of sparks) {
                    const a = spark.at - turned * 0.67 - s.spin * 0.5;
                    spark.node.setAttribute('transform', `rotate(${f(a)}) translate(0 ${f(-50 - 6 * shine)}) rotate(${f(-a)})`);
                    spark.node.setAttribute('opacity', shine > 0.45 && lid > 0.5 ? '1' : '0');
                }

                const open = lid * (1 - 0.5 * clamp(s.squint, 0, 1)), r = 3.3 * (1 + 0.3 * wide);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 9.5 : -9.5) + s.gazeX * 3)); eye.setAttribute('cy', f(-3 + s.gazeY * 2.6));
                    eye.setAttribute('rx', f(r)); eye.setAttribute('ry', f(Math.max(0.7, r * open)));
                });
                // The mouth is a cut shape too: a crescent, or a small round when it is startled.
                const smile = 5.5 + 2.5 * shine - 3 * clamp(s.squint, 0, 1) - 3.5 * droop;
                mouth.setAttribute('d', wide > 0.5
                    ? 'M -3 11.5 L -1.6 8.6 L 1.8 8.4 L 3.2 11.4 L 1.6 14.4 L -1.7 14.3 Z'
                    : `M -6.5 8 Q 0 ${f(8 + smile * 1.7)} 6.5 7.6 Q 0 ${f(8 + smile * 0.5)} -6.5 8 Z`);
            },
        };
    },
};

export const paperSun = {
    name: 'paper-sun',
    style: 'papier-decoupe',
    line: 2.6,
    limbs: NAVY,
    arms: 'front',
    head,
    proportions: { thigh: 17, shin: 19, reach: 32, stride: 19, lift: 9, upper: 19, fore: 19 },
};
