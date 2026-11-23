// A chrome toaster on a bakelite base, in the "cartoon réaliste" style:
// polished metal that mirrors a sky and a floor, a dark warm plastic, light
// from the upper left. It has a face on its front (eyes, brows of bakelite, a
// mouth) and parts that are its own:
// - two slices of toast that pop out of its slots when it is startled
//   (`wide`), and float up out of them when it drops (`drag`);
// - its cord, which it carries like a tail: the plug trails behind every
//   move and stands up straight when it is surprised;
// - a lever, a dial and a glow that follow `heat`.
//
// Numbers it adds: gazeX, gazeY, lid, wide, squint, pupil (its eyes),
// `toast` (0 in the slots -> 1 popped out; below 0 the slots are empty) and
// `heat` (0 cold -> 1 toasting: lever down, slots glowing).

import { kit } from '../kit.js';

const OUTLINE = '#2e3339', BAKELITE = '#4a2c22', CRUST = '#6b3d16';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

/** Where the slices stand in the slots: the one behind first. */
const SLICES = [{ x: 8, up: 3, shade: 0.22 }, { x: -7, up: 0, shade: 0 }];
/** How far a slice rises when it pops. */
const POP = 27;
/** Where the cord leaves the body, and where its plug rests. */
const CORD = [-47, 22], PLUG = [-72, 3];

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage, group);
        const chrome = k.linear([[0, '#7e8994'], [0.1, '#dfe6ec'], [0.28, '#ffffff'], [0.5, '#c5ced7'], [0.72, '#a9b4bf'], [0.9, '#e3e9ee'], [1, '#77828d']]);
        const plastic = k.linear([[0, '#7a4a38'], [0.4, '#4f2f24'], [1, '#33201a']], [0, 0, 0, 1]);
        const crumb = k.radial([[0, '#f8dfa8'], [0.6, '#e6ae5f'], [1, '#bd772f']], [0.4, 0.35, 0.8]);
        const ember = k.radial([[0, '#ffd27a', 0.95], [0.5, '#ff7a2a', 0.6], [1, '#ff5a1a', 0]], [0.5, 0.75, 0.6]);
        const brass = k.linear([[0, '#fff0b8'], [0.5, '#e0b045'], [1, '#96691a']], [0, 0, 0, 1]);

        // Behind the body: the cord and its plug, the glow, the toast, the lever.
        const cordDark = k.line(group, '', OUTLINE, 5.6);
        const cord = k.line(group, '', '#c8503c', 3);
        const cordLight = k.line(group, '', '#f1a08c', 0.9, { opacity: 0.8 });
        const plug = stage.el('g', group);
        k.shape(plug, 'M -2.6 -8 L -2.6 -14.5 M 2.6 -8 L 2.6 -14.5', 'none', OUTLINE, 3.2);
        k.line(plug, 'M -2.6 -8 L -2.6 -14.3 M 2.6 -8 L 2.6 -14.3', '#e0b045', 1.6);
        k.shape(plug, 'M -3 2 L -5.5 -3 Q -6 -9 -3.5 -9 L 3.5 -9 Q 6 -9 5.5 -3 L 3 2 Z', plastic, OUTLINE, 1.6);
        k.line(plug, 'M -3.4 -6.6 L -2.6 -2.4', '#b98a72', 1, { opacity: 0.8 });

        const glow = k.patch(group, 'ellipse', { cx: 0, cy: -42, rx: 40, ry: 17 }, ember, 0);
        const slices = SLICES.map(({ shade }) => {
            const g = stage.el('g', group);
            k.shape(g, 'M -15 2 L -15 -22 C -20 -25 -19 -34 -11 -34 C -6 -37 6 -37 11 -34 C 19 -34 20 -25 15 -22 L 15 2 Z', '#a8672a', CRUST, 1.8);
            k.patch(g, 'path', { d: 'M -11.6 2 L -11.6 -20.4 C -15.4 -23.4 -14.6 -30.2 -9 -30.6 C -5 -33 5 -33 9 -30.6 C 14.6 -30.2 15.4 -23.4 11.6 -20.4 L 11.6 2 Z' }, crumb);
            k.patch(g, 'ellipse', { cx: -5.5, cy: -24.5, rx: 3.6, ry: 1.9, transform: 'rotate(-20 -5.5 -24.5)' }, '#fff3d2', 0.75);
            for (const [x, y, r] of [[4, -25, 1.1], [-2, -17, 0.9], [6.5, -15, 1.2], [-7, -11, 1], [2, -8, 0.9]]) k.patch(g, 'circle', { cx: x, cy: y, r }, '#b9722c', 0.55);
            if (shade) k.patch(g, 'path', { d: 'M -15 2 L -15 -22 C -20 -25 -19 -34 -11 -34 C -6 -37 6 -37 11 -34 C 19 -34 20 -25 15 -22 L 15 2 Z' }, '#3a2010', shade);
            return g;
        });
        const lever = stage.el('g', group);
        k.shape(lever, 'M 46 -3 L 58 -3.6 Q 63.5 -3.6 63.5 0 Q 63.5 3.6 58 3.6 L 46 3 Z', plastic, OUTLINE, 1.8);
        k.line(lever, 'M 52 -1.7 L 59.5 -1.9', '#b98a72', 1, { opacity: 0.85 });

        // The base, then the chrome body with what it mirrors.
        k.shape(group, 'M -53 28 L 53 28 Q 56.5 28 56 31.5 L 55 38 Q 54.5 40.5 52 40.5 L -52 40.5 Q -54.5 40.5 -55 38 L -56 31.5 Q -56.5 28 -53 28 Z', plastic, OUTLINE, 2.2);
        k.shape(group, 'M -50 30 L -50 -16 C -50 -30 -42 -36 -30 -36 L 30 -36 C 42 -36 50 -30 50 -16 L 50 30 Z', chrome, OUTLINE, 2.4);
        k.patch(group, 'path', { d: 'M -48.8 9 C -28 2 28 15 48.8 6 L 48.8 28.8 L -48.8 28.8 Z' }, '#566270', 0.24);
        k.patch(group, 'path', { d: 'M -48.8 20 C -20 15 24 24 48.8 18 L 48.8 28.8 L -48.8 28.8 Z' }, '#7a4a38', 0.2);
        k.patch(group, 'path', { d: 'M 48.8 -16 L 48.8 28.8 L 16 28.8 C 36 24 46 8 48.8 -16 Z' }, '#2f3842', 0.26);
        k.patch(group, 'ellipse', { cx: -38, cy: -15, rx: 4.6, ry: 13, transform: 'rotate(14 -38 -15)' }, '#ffffff', 0.92);
        k.patch(group, 'circle', { cx: -41.5, cy: 5, r: 2.3 }, '#ffffff', 0.85);
        k.line(group, 'M -27 -33.6 L 22 -33.6', '#ffffff', 1.3, { opacity: 0.85 });
        k.line(group, 'M -51 33 L 34 33', '#b98a72', 1.1, { opacity: 0.6 });

        // The mouth of the slots: a bakelite plate along the top.
        k.shape(group, 'M -32 -40.5 L 32 -40.5 Q 35.5 -40.5 35.5 -37.6 Q 35.5 -34.6 32 -34.6 L -32 -34.6 Q -35.5 -34.6 -35.5 -37.6 Q -35.5 -40.5 -32 -40.5 Z', plastic, OUTLINE, 1.9);
        k.line(group, 'M -30 -38.9 L 14 -38.9', '#b98a72', 0.9, { opacity: 0.7 });
        const hot = k.line(group, 'M -29 -36.6 L 29 -36.6', '#ff8a3a', 1.7, { opacity: 0 });

        // The dial, with its three marks.
        for (const a of [-50, 0, 50]) k.line(group, `M 38 13.2 L 38 11.8`, '#4a545e', 0.9, { transform: `rotate(${a} 38 20)` });
        const dial = stage.el('g', group);
        stage.el('circle', dial, { cx: 38, cy: 20, r: 5.2, fill: plastic, stroke: OUTLINE, 'stroke-width': 1.5 });
        k.line(dial, 'M 38 19 L 38 16', '#f3e7da', 1.3);
        k.patch(group, 'circle', { cx: 36.4, cy: 18.2, r: 1.1 }, '#b98a72', 0.7);

        // The face.
        k.patch(group, 'ellipse', { cx: -32, cy: 6, rx: 6.5, ry: 3.8 }, '#f0907a', 0.4);
        k.patch(group, 'ellipse', { cx: 30, cy: 6, rx: 6.5, ry: 3.8 }, '#f0907a', 0.4);
        const eyes = [[-16, -8], [16, -8]].map(at => k.eye(group, at, { r: 9, iris: '#b0672a', outline: OUTLINE }));
        const brows = [-1, 1].map(() => k.line(group, '', BAKELITE, 2.8));
        const mouth = k.shape(group, '', '#7a2f2f', OUTLINE, 1.8);
        // A rivet at each corner: this is sheet metal, not a balloon.
        for (const [x, y] of [[-44, 24], [44, 24]]) { stage.el('circle', group, { cx: x, cy: y, r: 1.6, fill: brass, stroke: OUTLINE, 'stroke-width': 0.8 }); }

        const frame = { hips: [[-24, 40], [24, 40]], shoulders: [[-51, 4], [51, 12]], hipY: 40, top: [0, -40], soft: 0.5 };

        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, pupil: 1, toast: 0, heat: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1), squint = clamp(s.squint, 0, 1), heat = clamp(s.heat, 0, 1);

                // The toast: surprise pops it, a fall floats it out of the slots, a
                // sideways move rattles it. Below 0 there is none.
                const loaded = s.toast > -0.5;
                const out = clamp(Math.max(s.toast, wide), 0, 1);
                const float = clamp(-drag[1] * 0.9, 0, 12), rattle = clamp(drag[0] * 0.7, -8, 8);
                slices.forEach((slice, i) => {
                    const { x, up } = SLICES[i];
                    slice.setAttribute('visibility', loaded ? 'visible' : 'hidden');
                    const y = 1 - (POP + up) * out - float * (1 - 0.3 * i);
                    slice.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(rattle * (i ? 1 : 0.6) + (i ? -3 : 4) * out)} 0 -2)`);
                });

                // Toasting: the lever goes down and comes back up with the toast,
                // the slots glow, the dial is turned.
                const down = heat * (1 - out);
                lever.setAttribute('transform', `translate(0 ${f(-20 + 20 * down)})`);
                const pulse = 0.85 + 0.15 * Math.sin(s.clock * 0.006);
                glow.setAttribute('opacity', f(0.85 * heat * pulse));
                hot.setAttribute('opacity', f(heat * pulse));
                dial.setAttribute('transform', `rotate(${f(-50 + 100 * heat)} 38 20)`);

                // The cord: a tail. Its plug trails, sways a little, and stands up when startled.
                const sway = 1.6 * Math.sin(s.clock * 0.0023);
                const tx = PLUG[0] + drag[0] * 1.3 + sway + 5 * wide, ty = PLUG[1] + drag[1] * 1.1 - 15 * wide;
                const cx = tx + 7 + drag[0] * 0.5 - 6 * wide, cy = ty + 19;
                const d = `M ${CORD[0]} ${CORD[1]} C ${f(CORD[0] - 15)} ${f(CORD[1] + 7)} ${f(cx)} ${f(cy)} ${f(tx)} ${f(ty)}`;
                cordDark.setAttribute('d', d); cord.setAttribute('d', d); cordLight.setAttribute('d', d);
                plug.setAttribute('transform', `translate(${f(tx)} ${f(ty)}) rotate(${f(Math.atan2(tx - cx, cy - ty) * 180 / Math.PI)})`);

                for (const eye of eyes) eye(s);
                // Brows of bakelite: up and arched in surprise, down and flat in doubt.
                brows.forEach((brow, i) => {
                    const side = i ? 1 : -1, y = -22.5 - 4.5 * wide + 3.2 * squint;
                    brow.setAttribute('d', `M ${f(side * 25)} ${f(y + 1.6)} Q ${f(side * 17)} ${f(y - 3 - 3 * wide + 3 * squint)} ${f(side * 8)} ${f(y + 2.4 * squint - wide)}`);
                });
                // A smile at rest, an "oh" when it is startled, a flat line when it doubts.
                const curve = 6 * (1 - squint);
                mouth.setAttribute('d', wide > 0.3
                    ? `M ${f(-4.5 - 2 * wide)} 10 Q 0 ${f(7 - 2 * wide)} ${f(4.5 + 2 * wide)} 10 Q 0 ${f(13 + 8 * wide)} ${f(-4.5 - 2 * wide)} 10 Z`
                    : `M -8.5 8 Q 0 ${f(8 + curve)} 8.5 8 Q 0 ${f(8 + curve * 0.7)} -8.5 8 Z`);
            },
        };
    },
};

export const toaster = {
    name: 'toaster',
    style: 'cartoon-realiste',
    line: 2.6,
    limbs: '#5d6873',
    head,
    // A wide box: a raised arm would vanish behind it.
    arms: 'front',
    proportions: { thigh: 18, shin: 20, reach: 34, stride: 19, lift: 7, upper: 24, fore: 24 },
};
