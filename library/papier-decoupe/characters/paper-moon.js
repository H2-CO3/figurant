// A moon, in cut paper: a round of night-blue paper, and glued on it the lit
// part, cut from pale paper, with two craters. What is its own: its phase and
// its stars. `lit` (0 new -> 1 full; not `phase`, which is the body's walk cycle) is how much pale paper shows; it is
// changed with scissors, so it goes from one cut to the next and never slides.
// Its eyes are navy on the pale paper and pale on the night paper, whichever
// they happen to be on. Three paper stars hang beside it: they twinkle one
// notch at a time (`twinkle`: 0 -> 1, bigger), fly off when it is startled,
// sink and dim when it shuts its eyes, and lag behind a move. And it can
// frighten: `spook` (0 -> 1) gives it red eyes under slanted brows and a row of
// paper teeth, and its stars are bats.
//
// Paper does not stretch, and everything that moves by itself moves in
// notches, as in stop-motion.

import { kit, CORAL, MUSTARD, NAVY, WHITE } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const NIGHT = '#3d4b6e', PALE = '#f6ead0', CRATER = '#e4d3b0';
const R = 30;
/** A notch of stop-motion, in ms. */
const NOTCH = 160;
const notch = (v, n = 4) => Math.round(clamp(v, 0, 1) * n) / n;

/** A round cut with scissors: its corners are never quite on the circle. */
function round(r, sides, wobble, seed) {
    let d = '';
    for (let i = 0; i < sides; i++) {
        const a = (i + 0.3 * Math.sin(i * 2.4 + seed)) / sides * Math.PI * 2, rr = r * (1 + wobble * Math.sin(i * 1.7 + seed * 3));
        d += `${i ? 'L' : 'M'} ${f(rr * Math.cos(a))} ${f(rr * Math.sin(a))} `;
    }
    return d + 'Z';
}
/** Where the pale paper ends at height y, for a phase: left of it is night. */
const edge = (phase, y) => (1 - 2 * phase) * Math.sqrt(Math.max(0, (R - 1) * (R - 1) - y * y));
/** The lit part: the right rim, then back up along the cut. Eight cuts are possible, no more. */
function lit(phase) {
    const r = R - 1, steps = 9;
    let d = '';
    for (let i = 0; i <= steps; i++) {
        const a = -Math.PI / 2 + Math.PI * i / steps, rr = r * (1 + 0.02 * Math.sin(i * 2.1));
        d += `${i ? 'L' : 'M'} ${f(rr * Math.cos(a))} ${f(rr * Math.sin(a))} `;
    }
    for (let i = steps - 1; i >= 1; i--) {
        const y = r * Math.sin(-Math.PI / 2 + Math.PI * i / steps);
        d += `L ${f(edge(phase, y) + 0.7 * Math.sin(i * 1.9))} ${f(y)} `;
    }
    return d + 'Z';
}
const STAR = 'M 0 -6 L 1.7 -1.9 L 6 -1.6 L 2.7 1.3 L 3.8 5.6 L 0 3.3 L -3.7 5.7 L -2.6 1.2 L -6.1 -1.7 L -1.8 -1.8 Z';
/** Where each star hangs, and how big it is cut. */
/** What a star is when the moon frightens: a bat, wings out. */
const BAT = 'M 0 -2.4 L 1.6 -4.6 L 2.4 -2 L 5 -3.6 L 8.6 -1 L 6.6 -0.2 L 7 2.6 L 4.4 1.4 L 2.8 3.6 L 0 1.6 L -2.8 3.6 L -4.4 1.4 L -7 2.6 L -6.6 -0.2 L -8.6 -1 L -5 -3.6 L -2.4 -2 L -1.6 -4.6 Z';
const FANGS = 'M -15 7 L -10.5 13 L -6.5 7.6 L -2.4 13.6 L 1.6 7.6 L 5.8 13.6 L 9.8 7.6 L 14 13 L 17 7 L 15 17 L 6 21 L -5 21 L -13 17 Z';
const RED = '#f0503c';
const STARS = [{ x: -44, y: -24, size: 1, turn: 8 }, { x: -37, y: 8, size: 0.62, turn: -14 }, { x: 40, y: -36, size: 0.78, turn: 20 }];

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        const stars = STARS.map(star => ({ ...star, shade: stage.el('path', group, { d: STAR, fill: NAVY, stroke: 'none', opacity: 0.2 }), node: stage.el('path', group, { d: STAR, fill: MUSTARD, stroke: 'none' }) }));
        k.piece(group, round(R, 17, 0.02, 2), NIGHT, 2.2);
        const light = stage.el('path', group, { fill: PALE, stroke: 'none' });
        const craters = [[17, -14, 4.6], [21, 13, 3.2], [8, 19, 2.4]].map(([x, y, r]) => ({ x, node: k.dot(group, x, y, r, CRATER) }));
        const cheek = k.dot(group, 19, 4.5, 3.8, CORAL); cheek.setAttribute('opacity', '0.75');
        const eyes = [0, 1].map(() => stage.el('ellipse', group, { stroke: 'none' }));
        const mouth = stage.el('path', group, { stroke: 'none' });
        const brows = [-1, 1].map(side => stage.el('path', group, { d: `M ${f(side * 14)} -15.5 L ${f(side * 2.5)} -9.5 L ${f(side * 3.4)} -6.6 L ${f(side * 15)} -12 Z`, fill: WHITE, stroke: 'none' }));

        let tick = -1, beat = 0, flown = 0;
        const frame = { hips: [[-10, 28], [10, 28]], shoulders: [[-29, 5], [29, 5]], hipY: 28, top: [0, -31], soft: 0.2 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 0.8, wide: 0, squint: 0, lit: 0.62, twinkle: 0, spook: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const lid = notch(s.lid), wide = notch(s.wide), twinkle = clamp(s.twinkle, 0, 1), spook = s.spook > 0.5;
                // The phase goes from cut to cut; under a sliver nothing is left to glue.
                const phase = Math.round(clamp(s.lit, 0, 1) * 8) / 8;
                light.setAttribute('d', phase < 0.06 ? '' : lit(Math.max(phase, 0.14)));
                const onLight = (x, y) => phase >= 0.06 && x > edge(Math.max(phase, 0.14), y) + 1.5;
                for (const crater of craters) crater.node.setAttribute('opacity', onLight(crater.x - 4, 0) ? '1' : '0');
                cheek.setAttribute('opacity', !spook && onLight(15, 4.5) ? '0.75' : '0');

                const now = Math.floor(s.clock / NOTCH);
                if (now !== tick) { tick = now; beat++; flown = wide; }
                const asleep = lid < 0.5;
                stars.forEach((star, i) => {
                    const big = !asleep && (beat + i) % 3 === 0, size = star.size * (big ? 1.25 + 0.5 * twinkle : 1) * (asleep ? 0.8 : 1);
                    const out = 1 + 0.35 * flown, lag = 0.4 + 0.3 * i;
                    const x = star.x * out + clamp(-drag[0] * lag, -8, 8), y = star.y * out + clamp(-drag[1] * lag, -8, 8) + (asleep ? 9 : 0);
                    const t = `translate(${f(x)} ${f(y)}) rotate(${f(star.turn + (big ? 18 : 0))}) scale(${f(size)})`;
                    star.node.setAttribute('transform', t); star.shade.setAttribute('transform', `translate(1.5 2) ${t}`);
                    star.node.setAttribute('opacity', asleep ? '0.45' : '1');
                    // Frightening, its stars are bats, and they beat their wings.
                    const d = spook ? BAT : STAR;
                    if (star.shown !== d) { star.shown = d; star.node.setAttribute('d', d); star.shade.setAttribute('d', d); star.node.setAttribute('fill', spook ? NAVY : MUSTARD); }
                    if (spook) { const flap = `translate(${f(x)} ${f(y - ((beat + i) % 2 ? 3 : 0))}) scale(${f(star.size * 1.5)} ${f(star.size * ((beat + i) % 2 ? 1.5 : 0.9))})`; star.node.setAttribute('transform', flap); star.shade.setAttribute('transform', `translate(1.5 2) ${flap}`); }
                });

                const open = lid * (1 - 0.5 * clamp(s.squint, 0, 1)), r = 3.2 * (1 + 0.3 * wide);
                eyes.forEach((eye, i) => {
                    // Frightening, the eyes are red, bigger, and in the middle of the face, under their brows.
                    const x = (spook ? (i ? 9 : -9) : (i ? 16 : 2)) + s.gazeX * 3, y = (spook ? -5 : -4) + s.gazeY * 2.6;
                    eye.setAttribute('cx', f(x)); eye.setAttribute('cy', f(y));
                    eye.setAttribute('rx', f(spook ? 4.6 : r)); eye.setAttribute('ry', f(spook ? 4 : Math.max(0.7, r * open)));
                    eye.setAttribute('fill', spook ? RED : onLight(x - 3, y) ? NAVY : WHITE);
                });
                for (const brow of brows) brow.setAttribute('display', spook ? 'inline' : 'none');
                // A cut shape for a mouth: a small crescent, a round when it is startled or yawns, a row of teeth to frighten.
                const smile = 4.5 - 3 * clamp(s.squint, 0, 1) - 2 * (1 - lid);
                mouth.setAttribute('fill', spook ? WHITE : onLight(6, 10) ? NAVY : WHITE);
                mouth.setAttribute('d', spook ? FANGS : wide > 0.5
                    ? 'M 6.2 12 L 7.6 9.1 L 11 8.9 L 12.4 11.9 L 10.8 14.9 L 7.5 14.8 Z'
                    : `M 4 8.5 Q 9 ${f(8.5 + smile * 1.7)} 14 8.1 Q 9 ${f(8.5 + smile * 0.5)} 4 8.5 Z`);
            },
        };
    },
};

export const paperMoon = {
    name: 'paper-moon',
    style: 'papier-decoupe',
    line: 2.6,
    limbs: NAVY,
    arms: 'front',
    head,
    proportions: { thigh: 16, shin: 18, reach: 30, stride: 17, lift: 8, upper: 18, fore: 19 },
};
