// A navigator's compass, in line and gold. It has no face: its needle is its
// one solid gold and does the looking. The needle turns towards what the
// compass looks at, swings a little past and settles slowly, like a real one;
// it trembles when the compass is startled, dips when it "blinks", and is
// thrown aside by every move. `bearing` (degrees, clockwise from north) is
// added to where it points: a scene turns the needle with it. The ring of the
// case swings behind every move.

import { kit, INK, FINE, THREAD } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const circle = r => `M ${-r} 0 A ${r} ${r} 0 1 0 ${r} 0 A ${r} ${r} 0 1 0 ${-r} 0 Z`;
/** The marks of the dial: long at the four points, short between them. */
const ticks = (from, to, offset) => [0, 1, 2, 3].map(i => {
    const a = (i * 90 + offset) * Math.PI / 180, sin = Math.sin(a), cos = Math.cos(a);
    return `M ${f(from * sin)} ${f(-from * cos)} L ${f(to * sin)} ${f(-to * cos)}`;
}).join(' ');

const head = {
    create({ stage, layer, line }) {
        const group = stage.el('g', layer);
        const k = kit(stage, group, line);
        // The ring it is carried by, and its stem.
        const ring = stage.el('g', group);
        k.gold(ring, 'M -4 -46.5 A 8 8 0 1 1 4 -46.5', THREAD, 'none');
        k.gold(group, 'M -4.5 -36 L -4.5 -44 L 4.5 -44 L 4.5 -36 Z', THREAD);
        // The case and its dial.
        k.gold(group, circle(38));
        k.ink(group, circle(31), FINE);
        k.ink(group, ticks(31, 25, 0));
        k.ink(group, ticks(31, 28, 45), FINE);
        k.dot(group, -4.5, -44, 2); k.dot(group, 4.5, -44, 2);
        // The needle: the north half in solid gold, the south half in outline.
        const needle = stage.el('g', group);
        stage.el('path', needle, { d: 'M -4.6 0 L 0 23 L 4.6 0 Z', fill: 'var(--fig-paper, #fdfcf8)', stroke: INK, 'stroke-width': line * FINE, 'stroke-linejoin': 'round' });
        k.solid(needle, 'M 0 -24 L 5 0 L -5 0 Z');
        k.dot(group, 0, 0, 2.6);

        const frame = { hips: [[-10, 36.7], [10, 36.7]], shoulders: [[-37.5, 6], [37.5, 6]], hipY: 36.7, top: [0, -61], soft: 0.3 };
        // The needle is a small mass on a pivot: it has an angle and a speed of its own.
        let angle = 0, speed = 0;
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, bearing: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag, dt }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                ring.setAttribute('transform', `rotate(${f(clamp(drag[0] * 1.6, -22, 22))} 0 -44)`);

                // Where it should point: north at rest, towards the gaze, plus the bearing a scene asks for.
                const gx = clamp(s.gazeX, -1, 1), gy = clamp(s.gazeY, -1, 1);
                const target = s.bearing + Math.atan2(gx, 0.5 - gy) * 180 / Math.PI - clamp(drag[0], -8, 8) * 4;
                // The same direction a full turn away is the same direction.
                angle += 360 * Math.round((target - angle) / 360);
                let left = clamp(dt || 0, 0, 100);
                while (left > 0) {
                    const h = Math.min(left, 8) / 1000; left -= 8;
                    speed += (-52 * (angle - target) - 4.4 * speed) * h;
                    angle += speed * h;
                }
                const tremble = clamp(s.wide, 0, 1) * (9 * Math.sin(s.clock * 0.047) + 5 * Math.sin(s.clock * 0.071));
                const length = (0.4 + 0.6 * clamp(s.lid, 0, 1)) * (1 - 0.2 * clamp(s.squint, 0, 1));
                needle.setAttribute('transform', `rotate(${f(angle + tremble)}) scale(1 ${f(length)})`);
            },
        };
    },
};

export const compass = {
    name: 'compass',
    style: 'trait-et-or',
    line: 2.2,
    limbs: INK,
    head,
    proportions: { thigh: 20, shin: 22, reach: 38, stride: 20, lift: 8, upper: 22, fore: 22 },
};
