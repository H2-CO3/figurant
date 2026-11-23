// A porcelain teapot, in the library's "realistic cartoon" style: glazed
// white with a blue painted band and gilt trim, light from the upper left,
// a soft shade underneath. It has a face (eyes, cheeks, a mouth) and parts
// that are its own: a lid that hops when it is startled and lags behind a
// jump, and steam.
//
// Numbers it adds: gazeX, gazeY, lid (its eyes), wide (surprise), squint,
// pupil, and `steam` (0 none -> 1 a full plume).

import { kit } from '../kit.js';

const OUTLINE = '#4a3b2e', BLUE = '#2f5f9e';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const SPOUT_TIP = [107, -30];

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const glaze = k.radial([[0, '#ffffff'], [0.55, '#f3eee4'], [1, '#cdc3b1']], [0.32, 0.28, 0.85]);
        const gilt = k.linear([[0, '#fff3c2'], [0.45, '#e3b24c'], [1, '#a26f18']], [0, 0, 0, 1]);
        const gold = k.radial([[0, '#fff6cf'], [0.5, '#e7b650'], [1, '#9c6a14']], [0.35, 0.3, 0.75]);

        // Behind the belly: steam, the handle (a glazed ring) and the spout.
        const steam = [0, 1, 2].map(() => k.line(group, '', '#aebccb', 4.2, { opacity: 0 }));
        k.line(group, 'M -60 -14 C -103 -22 -105 37 -62 28', OUTLINE, 13.5);
        k.line(group, 'M -60 -14 C -103 -22 -105 37 -62 28', '#ebe5d9', 8.5);
        k.line(group, 'M -66 -12 C -93 -14 -96 14 -84 26', '#ffffff', 2.2, { opacity: 0.85 });
        k.shape(group, 'M 54 12 C 80 8 80 -24 100 -37 L 113 -24 C 95 -13 97 27 60 35 Z', glaze, OUTLINE, 2.4);
        k.patch(group, 'ellipse', { cx: 106.5, cy: -30.5, rx: 6.2, ry: 2.6, transform: 'rotate(45 106.5 -30.5)' }, '#6b5a48', 0.9);

        // The foot, then the belly with its painted band.
        k.shape(group, 'M -33 46 L -29 55 L 29 55 L 33 46 Z', '#ddd4c4', OUTLINE, 2.4);
        k.shape(group, 'M -34 -34 C -80 -22 -72 46 -36 47 L 36 47 C 72 46 80 -22 34 -34 Z', glaze, OUTLINE, 2.4);
        k.patch(group, 'path', { d: 'M -30 46 C 20 50 62 40 72 4 C 70 34 54 46 36 46.5 Z' }, '#8f8371', 0.28);
        k.line(group, 'M -64 22 Q 0 34 64 22', BLUE, 2.6);
        k.line(group, 'M -60 31 Q 0 43 60 31', BLUE, 1.4);
        for (const x of [-48, -24, 0, 24, 48]) k.patch(group, 'circle', { cx: x, cy: 31 - Math.abs(x) * 0.09, r: 1.9 }, BLUE);
        k.patch(group, 'ellipse', { cx: -42, cy: -12, rx: 7.5, ry: 15, transform: 'rotate(28 -42 -12)' }, '#ffffff', 0.85);
        k.patch(group, 'circle', { cx: -52, cy: 9, r: 2.6 }, '#ffffff', 0.8);

        // The face.
        k.patch(group, 'ellipse', { cx: -37, cy: 13, rx: 7.5, ry: 4.6 }, '#f08f8f', 0.42);
        k.patch(group, 'ellipse', { cx: 37, cy: 13, rx: 7.5, ry: 4.6 }, '#f08f8f', 0.42);
        const eyes = [[-19, 0], [19, 0]].map(at => k.eye(group, at, { r: 8, iris: '#3b6ea8', outline: OUTLINE }));
        const mouth = k.shape(group, '', '#7a2f2f', OUTLINE, 1.8);

        // The lid: glazed dome, gilt rim, gold knob.
        const lid = stage.el('g', group);
        k.shape(lid, 'M -37 -34 Q 0 -63 37 -34 Z', glaze, OUTLINE, 2.4);
        k.patch(lid, 'ellipse', { cx: -13, cy: -45, rx: 7, ry: 2.6, transform: 'rotate(-24 -13 -45)' }, '#ffffff', 0.85);
        k.shape(lid, 'M -41 -37 L 41 -37 Q 44 -34 41 -31 L -41 -31 Q -44 -34 -41 -37 Z', gilt, OUTLINE, 1.8);
        stage.el('circle', lid, { cx: 0, cy: -54, r: 6.6, fill: gold, stroke: OUTLINE, 'stroke-width': 1.8 });
        k.patch(lid, 'circle', { cx: -2.2, cy: -56.4, r: 1.7 }, '#ffffff', 0.9);

        const frame = { hips: [[-21, 53], [21, 53]], shoulders: [[-63, 22], [64, 26]], hipY: 53, top: [0, -60], soft: 0.7 };

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, pupil: 1, steam: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1);

                // The lid sits loose: surprise lifts it, and it lags behind a jump.
                const lift = 9 * wide + clamp(-drag[1] * 0.9, 0, 14);
                const rattle = clamp(drag[0] * 0.8, -9, 9) + 5 * wide;
                lid.setAttribute('transform', `translate(0 ${f(-lift)}) rotate(${f(rattle)} -37 -34)`);

                for (const eye of eyes) eye(s);
                // A smile at rest, an "oh" when it is startled, a flat line when it doubts.
                const curve = 5 * (1 - clamp(s.squint, 0, 1));
                mouth.setAttribute('d', wide > 0.3
                    ? `M ${f(-4 - 2 * wide)} 16 Q 0 ${f(13 - 2 * wide)} ${f(4 + 2 * wide)} 16 Q 0 ${f(19 + 7 * wide)} ${f(-4 - 2 * wide)} 16 Z`
                    : `M -7 15 Q 0 ${f(15 + curve)} 7 15 Q 0 ${f(15 + curve * 0.72)} -7 15 Z`);

                // Steam: three soft wisps from the spout, rising, swaying, trailing behind a move.
                const amount = clamp(Math.max(s.steam, 0.7 * wide), 0, 1);
                steam.forEach((wisp, i) => {
                    wisp.setAttribute('opacity', f(0.6 * amount));
                    if (amount < 0.02) { wisp.setAttribute('d', ''); return; }
                    const t = s.clock * 0.0016 + i * 2.1;
                    const x0 = SPOUT_TIP[0] + (i - 1) * 5, y0 = SPOUT_TIP[1] - 7;
                    const h = (20 + i * 6) * amount, sway = 5.5 * Math.sin(t), dx = clamp(drag[0], -10, 10);
                    wisp.setAttribute('d', `M ${f(x0)} ${f(y0)} C ${f(x0 + sway)} ${f(y0 - h * 0.4)} ${f(x0 - sway + dx * 0.5)} ${f(y0 - h * 0.7)} ${f(x0 + sway * 0.6 + dx)} ${f(y0 - h)}`);
                });
            },
        };
    },
};

export const teapot = {
    name: 'teapot',
    // The style it was drawn in: the atelier lists it under that style only.
    style: 'default',
    line: 2.6,
    limbs: OUTLINE,
    head,
    // Its belly is wide: a raised arm would vanish behind it.
    arms: 'front',
    proportions: { thigh: 19, shin: 21, reach: 36, stride: 20, lift: 8, upper: 25, fore: 25 },
};
