// A calligraphy brush, in ink wash: a bamboo handle in two strokes with a dark
// node between them, a short ferrule, a tuft of pale hair with a loaded tip,
// and a red cord at the top (its one touch of red). It stands tuft down, as a
// brush is held: the tuft hangs between its legs, just above the paper.
//
// No face: the tuft does the looking. It bends towards what it looks at,
// draws up to blink, splays when it is startled and trails behind every move.
// What is its own:
//   `ink`  0 dry -> 1 loaded: how far up the tuft is black, and whether a drop
//          swells at the tip and falls (sooner when it is moved);
//   `mark` 0 -> 1: while it is above 0, wherever the tip touches the floor
//          (crouch about 9 lays it down) stays as a brush stroke on the ground;
//          lowering it to 0 fades the stroke and forgets it.

import { brush, INK, RED } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const pt = p => `${f(p[0])} ${f(p[1])}`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
/** The part of a cubic curve from t to its end, as a cubic. */
function lower([a, b, c, d], t) {
    const ab = mix(a, b, t), bc = mix(b, c, t), cd = mix(c, d, t), abc = mix(ab, bc, t), bcd = mix(bc, cd, t);
    return [mix(abc, bcd, t), bcd, cd, d];
}

/** Where the tuft leaves the ferrule, how long it hangs, where the hips are. */
const ROOT = 17, LENGTH = 35, HIP = 16;

/** The stroke left on the ground, from x0 to x1 (page pixels) at height y: pressed at the start, thinner, pressed again where it stops. */
function laidStroke(x0, x1, y, k) {
    const length = x1 - x0, steps = 18, top = [], bottom = [];
    const body = clamp(Math.abs(length) / (30 * k), 0.25, 1);
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Half its thickness along the way, in units.
        const bell = (at, spread) => Math.exp(-(((t - at) / spread) ** 2));
        const press = 2.7 * bell(0.07, 0.09) + 2.3 * bell(0.9, 0.1);
        const half = (2 + press) * Math.min(1, t / 0.04, (1 - t) / 0.05) * body * k;
        const x = x0 + length * t, rise = y - 0.9 * k * Math.sin(Math.PI * t) - 2.2 * k;
        top.push(`${f(x)} ${f(rise - half * 0.7)}`);
        bottom.push(`${f(x)} ${f(rise + half * 0.7)}`);
    }
    return `M ${top.join(' L ')} L ${bottom.reverse().join(' L ')} Z`;
}

/** One stroke of bamboo from y0 down to y1: pressed at both ends, a little lighter between. */
const cane = (y0, y1, w) => `M ${-w} ${y0} Q ${f(-w * 0.7)} ${(y0 + y1) / 2} ${-w} ${y1} Q 0 ${y1 + 1.8} ${w} ${y1} Q ${f(w * 0.7)} ${(y0 + y1) / 2} ${w} ${y0} Q 0 ${y0 - 1.8} ${-w} ${y0} Z`;

const head = {
    create({ stage, layer }) {
        // What it leaves on the ground lies under everything else.
        const laid = stage.el('path', layer, { fill: INK, stroke: 'none' });
        const blot = stage.el('ellipse', layer, { fill: INK, stroke: 'none', opacity: 0 });
        const drop = stage.el('circle', layer, { fill: INK, stroke: 'none', r: 0 });
        const group = stage.el('g', layer);
        const path = (d, opacity = 1, fill = INK) => stage.el('path', group, { d, fill, stroke: 'none', opacity });

        // The tuft, behind the ferrule: pale hair, a thin edge, the loaded part, two loose hairs.
        const hair = path('', 0.16), edge = path('', 0.75), loaded = path('', 0.94);
        const strays = [-1, 1].map(() => path('', 0));
        // The handle: two strokes of bamboo, lighter than the ink of the tuft, and the node between them.
        path(cane(-68, -31, 3.7), 0.74);
        path(cane(-27.5, 11, 4.1), 0.74);
        path(brush([-4.6, -29.6], [0, -27.8], [5.4, -30], 1.6));
        // The ferrule that holds the hair.
        path(brush([-6.6, 12.6], [0, 15.8], [6.6, 12.2], 7));
        // The cord it hangs from when it rests: it swings behind every move.
        const cord = stage.el('path', group, { fill: 'none', stroke: RED, 'stroke-width': 1.5, 'stroke-linecap': 'round' });

        const frame = { hips: [[-4.5, HIP], [4.5, HIP]], shoulders: [[0, -10], [0, -10]], hipY: HIP, top: [0, -82], soft: 0.3 };
        // The stroke on the ground: where the tip first touched, and the furthest it went since.
        let from = null, to = null;
        // The drop: it swells at the tip, falls, and leaves a blot that dries.
        const bead = { stage: 'none', size: 0, x: 0, y: 0, speed: 0, age: 0, wait: 0 };

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, ink: 0.3, mark: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag, P, k, ground, dt }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1), ink = clamp(s.ink, 0, 1), lid = clamp(s.lid, 0, 1);

                // Where the tip is: towards what it looks at, behind a move, drawn up for a blink.
                let tx = 10 * clamp(s.gazeX, -1, 1) - clamp(drag[0] * 0.9, -9, 9);
                let ty = ROOT + LENGTH * (0.78 + 0.22 * lid) - 2 * wide + 1.5 * clamp(s.gazeY, -1, 1) - clamp(drag[1] * 0.4, -3, 3);
                let belly = 6.2 + 1.4 * ink + 3.2 * wide - 1.6 * clamp(s.squint, 0, 1);
                // On the floor the hair gives: the tip stays on the paper and bends back.
                const reach = P(tx, ty), cos = Math.max(0.5, Math.cos(s.tilt * Math.PI / 180));
                const pressed = Math.max(0, (reach[1] - ground) / (k * cos));
                // (It no longer looks anywhere then: laid hair follows the hand.)
                if (pressed > 0) { ty -= pressed; tx = tx * (1 - Math.min(1, pressed)) - (s.dir || 1) * Math.min(12, 3 * Math.min(1, pressed) + pressed * 1.6); belly += Math.min(3, pressed * 0.5); }
                // The two sides of the tuft, from the ferrule down to the tip.
                const span = ty - ROOT;
                const flank = sign => [[sign * belly * 0.72, ROOT], [sign * belly + tx * 0.2, ROOT + span * 0.42], [tx + sign * belly * 0.5 - tx * 0.1, ty - span * 0.3], [tx, ty]];
                const left = flank(-1), right = flank(1);
                const curve = c => `C ${pt(c[1])} ${pt(c[2])} ${pt(c[3])}`;
                hair.setAttribute('d', `M ${pt(left[0])} ${curve(left)} ${curve([...right].reverse())} Z`);
                edge.setAttribute('d', brush([-belly * 0.7, ROOT + 1], [-belly * 1.05 + tx * 0.2, ROOT + 12], [tx * 0.55 - belly * 0.62, ty - 10], 1.1));
                // The ink climbs the hair as it is loaded: the lower part of the same two sides.
                const from0 = 1 - (0.34 + 0.6 * ink), l = lower(left, from0), r = lower(right, from0);
                loaded.setAttribute('d', `M ${pt(l[0])} ${curve(l)} ${curve([...r].reverse())} Q ${f((l[0][0] + r[0][0]) / 2)} ${f(l[0][1] + 2.2)} ${pt(l[0])} Z`);
                strays.forEach((stray, i) => {
                    const side = i ? 1 : -1;
                    stray.setAttribute('opacity', f(wide));
                    stray.setAttribute('d', brush([side * 3, ROOT + 10], [side * (belly + 3), ROOT + 20], [tx + side * (5 + 6 * wide), ty - 5], 0.8));
                });
                const swing = clamp(drag[0] * 0.8, -8, 8) + Math.sin(s.clock * 0.0017) * 0.7;
                cord.setAttribute('d', `M 0.8 -68 C ${f(-5 - swing * 0.5)} -74 ${f(-4 - swing)} -82 ${f(0.8 - swing)} -81 C ${f(5 - swing)} -80 ${f(5 - swing * 0.5)} -73 0.8 -68`);

                // The stroke: it grows wherever the tip touches the floor while `mark` is up.
                const tip = P(tx, ty), amount = clamp(s.mark, 0, 1);
                if (amount < 0.01) { from = to = null; laid.setAttribute('d', ''); }
                else {
                    if (pressed > 0.3) {
                        if (from === null) from = to = tip[0];
                        else if (Math.abs(tip[0] - from) > Math.abs(to - from)) to = tip[0];
                    }
                    laid.setAttribute('d', from === null || Math.abs(to - from) < k ? '' : laidStroke(from, to, ground, k));
                    laid.setAttribute('opacity', f(0.92 * amount));
                }

                // The drop. Loaded hair lets one go now and then, sooner when it is moved.
                const step = Math.min(dt ?? 16, 50);
                if (bead.stage === 'none') {
                    if (ink > 0.55 && pressed === 0) bead.wait += step * ink * (1 + 0.5 * Math.hypot(drag[0], drag[1]));
                    else bead.wait = 0;
                    if (bead.wait > 2400) Object.assign(bead, { stage: 'swell', size: 0, wait: 0 });
                } else if (bead.stage === 'swell') {
                    bead.size += step / 700; bead.x = tip[0]; bead.y = tip[1] + 1.2 * k * bead.size;
                    if (pressed > 0) bead.stage = 'none';
                    else if (bead.size >= 1) Object.assign(bead, { stage: 'fall', speed: 0 });
                } else if (bead.stage === 'fall') {
                    bead.speed += 0.0005 * k * step; bead.y += bead.speed * step;
                    if (bead.y >= ground - 1.5 * k) Object.assign(bead, { stage: 'blot', age: 0, y: ground - 1.2 * k });
                } else {
                    bead.age += step;
                    if (bead.age > 2600) bead.stage = 'none';
                }
                const falling = bead.stage === 'swell' || bead.stage === 'fall';
                drop.setAttribute('r', f(falling ? 1.7 * k * Math.min(1, bead.size) : 0));
                drop.setAttribute('cx', f(bead.x)); drop.setAttribute('cy', f(bead.y));
                const dry = bead.stage === 'blot' ? bead.age / 2600 : 1;
                blot.setAttribute('cx', f(bead.x)); blot.setAttribute('cy', f(bead.y));
                blot.setAttribute('rx', f(k * (1.6 + 2.6 * Math.min(1, dry * 5)))); blot.setAttribute('ry', f(k * 1.1));
                blot.setAttribute('opacity', f(bead.stage === 'blot' ? 0.8 * (1 - dry) : 0));
            },
        };
    },
};

export const calligraphyBrush = {
    name: 'calligraphy-brush',
    style: 'encre-de-chine',
    line: 1.9,
    limbs: INK,
    head,
    // A brush is all handle and hair: it has legs to walk on, and no arms.
    arms: 'none',
    sits: false,
    proportions: { thigh: 23, shin: 24, reach: 44, foot: 8, stride: 17, lift: 6 },
};
