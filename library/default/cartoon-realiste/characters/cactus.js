// A cactus in a terracotta pot, in the library's "realistic cartoon" style:
// ribbed green flesh with light down one side, pale spines, a pink flower on
// its head, a glazed pot with a rim. What is its own: its spines bristle when
// it is startled, and its flower opens when it is pleased (`bloom`, 0 a bud
// -> 1 wide open; waving opens it too) and nods behind every move.

import { kit } from '../kit.js';

const OUTLINE = '#2f4a2a', POT_LINE = '#6b3a22';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

/** Where the spines grow: [x, y, direction in degrees from "up"]. */
const SPINES = [[-22, -34, -70], [-23, -16, -80], [-22, 2, -75], [22, -34, 70], [23, -16, 80], [22, 2, 75], [-11, -50, -28], [11, -50, 28], [0, -53, 0]];
const PETALS = [-72, -36, 0, 36, 72];

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const flesh = k.linear([[0, '#3f8f4a'], [0.3, '#7fcf7a'], [0.6, '#4fa558'], [1, '#2f7a3c']]);
        const clay = k.linear([[0, '#b5542c'], [0.3, '#e58a5a'], [0.65, '#c9673a'], [1, '#9a4423']]);

        const spines = SPINES.map(() => k.line(group, '', '#f4efd6', 1.5));
        // The column, its ribs, a long reflection.
        k.shape(group, 'M -22 16 L -22 -34 Q -22 -54 0 -54 Q 22 -54 22 -34 L 22 16 Z', flesh, OUTLINE, 2.2);
        for (const x of [-11, 0, 11]) k.line(group, `M ${x} -${50 - Math.abs(x) * 0.4} L ${x} 14`, '#2f7a3c', 1.3, { opacity: 0.6 });
        k.patch(group, 'path', { d: 'M -17 -38 Q -17 -47 -12 -49 L -12 6 Q -15 8 -17 6 Z' }, '#c9f2c0', 0.55);

        // The face.
        k.patch(group, 'ellipse', { cx: -13, cy: -6, rx: 4.6, ry: 2.8 }, '#f08f8f', 0.5);
        k.patch(group, 'ellipse', { cx: 13, cy: -6, rx: 4.6, ry: 2.8 }, '#f08f8f', 0.5);
        const eyes = [[-8.5, -16], [8.5, -16]].map(at => k.eye(group, at, { r: 5.4, iris: '#5a3a1e', outline: OUTLINE }));
        const mouth = k.line(group, '', OUTLINE, 1.6);

        // The flower: a stem of petals that open, and a yellow heart.
        const flower = stage.el('g', group);
        const petals = PETALS.map(() => k.shape(flower, '', '#f58db0', '#b8456e', 1.4));
        k.patch(flower, 'circle', { cx: 0, cy: -57, r: 3.4 }, '#ffd34d');

        // The pot: soil, a glazed body, a rim.
        k.patch(group, 'ellipse', { cx: 0, cy: 16, rx: 25, ry: 4 }, '#4a3323');
        k.shape(group, 'M -26 18 L -21 50 Q 0 54 21 50 L 26 18 Z', clay, POT_LINE, 2.2);
        k.patch(group, 'path', { d: 'M -19 24 L -16 46 L -12 46.6 L -14 24 Z' }, '#ffd0b0', 0.55);
        k.shape(group, 'M -30 12 Q -31 20 -28 20 L 28 20 Q 31 20 30 12 Q 0 8 -30 12 Z', clay, POT_LINE, 2.2);

        const frame = { hips: [[-10, 51], [10, 51]], shoulders: [[-22, -8], [22, -8]], hipY: 51, top: [0, -62], soft: 0.6 };

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, pupil: 1, bloom: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1);

                // Spines: short at rest, standing on end when it is startled.
                const length = 4 + 6 * wide;
                SPINES.forEach(([x, y, angle], i) => {
                    const a = (angle + 6 * Math.sin(s.clock * 0.004 + i)) * Math.PI / 180;
                    spines[i].setAttribute('d', `M ${x} ${y} l ${f(Math.sin(a) * length)} ${f(-Math.cos(a) * length)}`);
                });

                for (const eye of eyes) eye(s);
                const smile = 3.2 * (1 - clamp(s.squint, 0, 1)) + 1.2 * clamp(s.bloom, 0, 1);
                mouth.setAttribute('d', wide > 0.4 ? 'M -2.4 -6 Q 0 -8.6 2.4 -6 Q 0 -1 -2.4 -6 Z' : `M -5 -7 Q 0 ${f(-7 + smile)} 5 -7`);

                // The flower opens with pleasure, and nods behind a move.
                const open = clamp(Math.max(s.bloom, s.wave), 0, 1);
                flower.setAttribute('transform', `rotate(${f(clamp(-drag[0] * 1.6, -22, 22))} 0 -54)`);
                PETALS.forEach((angle, i) => {
                    const a = angle * (0.25 + 0.75 * open) * Math.PI / 180, long = 5 + 8 * open, wide2 = 2 + 3 * open;
                    const tx = Math.sin(a) * long, ty = -57 - Math.cos(a) * long, nx = Math.cos(a) * wide2, ny = Math.sin(a) * wide2;
                    petals[i].setAttribute('d', `M 0 -56 Q ${f(tx * 0.5 - nx)} ${f((ty - 56) / 2 - 0.5 - ny)} ${f(tx)} ${f(ty)} Q ${f(tx * 0.5 + nx)} ${f((ty - 56) / 2 - 0.5 + ny)} 0 -56 Z`);
                });
            },
        };
    },
};

export const cactus = {
    name: 'cactus',
    // The style it was drawn in: the atelier lists it under that style only.
    style: 'default',
    line: 2.6,
    limbs: OUTLINE,
    head,
    proportions: { thigh: 16, shin: 18, reach: 30, stride: 18, lift: 8, upper: 20, fore: 20 },
};
