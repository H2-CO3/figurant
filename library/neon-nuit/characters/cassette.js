// A cassette tape, in neon: the sign of a record shop that stays open late.
// A magenta shell, two cyan reels that are also its eyes (the bright hub of
// each looks about), amber tape. It is a sign, so nothing glides. What is
// its own:
// - the reels turn by switching between three positions, never smoothly:
//   `spin` says how fast and which way (1 plays, negative rewinds). They
//   also turn when it walks, the way it goes.
// - `wound` (0 to 1) is how much tape has passed from the left reel to the
//   right one: the two packs of tape change size, in seven steps.
// - while the reels turn, a light runs along the five dashes of its label.
// - the stretch of tape across its mouth sags behind a move (`drag`) and
//   flickers after a jolt; startled (`wide`), the tape crumples into a
//   zigzag and the reels strike larger.
// - `power`: below one half the whole sign is switched off, and only the
//   cold glass is left to see.

import { kit, CYAN, MAGENTA, AMBER } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
/** What is left of a tube when it is switched off. */
const OFF = 0.13;
/** The reels: their middles. */
const REELS = [[-25, -5], [25, -5]];
const ring = (x, y, r) => `M ${f(x - r)} ${f(y)} a ${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a ${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;
/** Three spokes, turned by `step` thirds of their spacing. */
const spokes = (x, y, r, step) => [0, 1, 2].map(i => {
    const a = (i * 120 + step * 40 - 90) * Math.PI / 180;
    return `M ${f(x + Math.cos(a) * 2.6)} ${f(y + Math.sin(a) * 2.6)} L ${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`;
}).join(' ');
/** The five dashes of the label. */

/**
 * The arms and legs are tubes of the same sign: they go dark with it. The
 * engine draws them beside the head's layer; where there is no such layer
 * (a test without a page), nothing is dimmed.
 */
const dimLimbs = (layer, opacity) => {
    for (const node of layer.parentNode?.children ?? []) {
        if (node.getAttribute?.('class') === 'fig-limb') node.setAttribute('opacity', opacity);
    }
};
const DASHES = [-32, -18, -4, 10, 24].map(x => `M ${x} -32 L ${x + 8} -32`);

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        // The shell, and the opening at its foot where the tape shows.
        const shell = stage.el('g', group);
        k.tube(shell, 'M -54 -42 L 54 -42 Q 62 -42 62 -34 L 62 30 Q 62 38 54 38 L -54 38 Q -62 38 -62 30 L -62 -34 Q -62 -42 -54 -42 Z', MAGENTA, 3.2);
        k.tube(shell, 'M -38 38 L -31 21 L 31 21 L 38 38', MAGENTA, 2.2);
        const dashes = DASHES.map(d => k.tube(group, d, AMBER, 1.8));
        const packs = REELS.map(([x, y]) => k.tube(group, ring(x, y, 14), AMBER, 1.6));
        const reels = REELS.map(([x, y]) => k.tube(group, '', CYAN, 2));
        const tape = k.tube(group, '', AMBER, 1.8);
        const eyes = REELS.map(([x, y]) => k.spark(group, x, y, 2.3, CYAN));

        const frame = { hips: [[-15, 39], [15, 39]], shoulders: [[-62, -4], [62, -4]], hipY: 39, top: [0, -42], soft: 0.25 };
        let turn = 0, lit = null;
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, power: 1, spin: 0, wound: 0.5 },
            frame: () => frame,
            draw({ state: s, matrix, drag, dt }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const on = s.power >= 0.5, startled = s.wide > 0.5;
                if (on !== lit) { lit = on; dimLimbs(layer, on ? 1 : 0.2); }
                const hum = 0.95 + 0.05 * Math.sin(s.clock * 0.023);
                shell.setAttribute('opacity', f(on ? hum : OFF));

                // The reels switch position four times a second at `spin` 1.
                const speed = s.spin || s.walk * s.dir;
                turn += speed * dt / 250;
                const step = ((Math.floor(turn) % 3) + 3) % 3, turning = Math.abs(speed) > 0.05;
                const radius = startled ? 10.5 : 8;
                const blink = 0.16 + 0.84 * clamp(s.lid, 0, 1);
                reels.forEach((reel, i) => {
                    const [x, y] = REELS[i];
                    k.redraw(reel, `${ring(x, y, radius)} ${spokes(x, y, radius, step)}`);
                    reel.setAttribute('opacity', f(on ? hum * blink : OFF));
                });

                // The packs: what leaves the left reel arrives on the right one.
                const wound = Math.round(clamp(s.wound, 0, 1) * 6) / 6;
                packs.forEach((pack, i) => {
                    const [x, y] = REELS[i];
                    k.redraw(pack, ring(x, y, 12.5 + 7 * (i ? wound : 1 - wound)));
                    pack.setAttribute('opacity', f(on ? hum : OFF));
                });

                // The light that runs along the label while the tape runs.
                const runner = ((Math.floor(turn) % 5) + 5) % 5;
                dashes.forEach((dash, i) => dash.setAttribute('opacity', f(!on ? OFF : turning ? (i === runner ? 1 : 0.22) : hum)));

                // The tape across the mouth: slack, crumpled when startled, flickering after a jolt.
                const jolt = Math.min(1, Math.hypot(drag[0], drag[1]) / 7);
                const flicker = jolt > 0.25 && Math.floor(s.clock / 45) % 2 ? 0.3 : 1;
                const sag = clamp(1.5 + drag[1] * 0.5 - 3 * clamp(s.squint, 0, 1), -4, 6), pull = clamp(-drag[0] * 1.3, -12, 12);
                k.redraw(tape, startled
                    ? 'M -27 30 L -19 25 L -11 34 L -3 25 L 5 34 L 13 25 L 21 34 L 27 29'
                    : `M -27 29 Q ${f(pull)} ${f(29 + sag * 2)} 27 29`);
                tape.setAttribute('opacity', f(on ? hum * flicker : OFF));

                eyes.forEach((eye, i) => {
                    const [x, y] = REELS[i];
                    eye.setAttribute('transform', `translate(${f(s.gazeX * 3.4)} ${f(s.gazeY * 3)}) scale(${f(startled ? 1.5 : 1)} ${f((startled ? 1.5 : 1) * (s.squint > 0.5 ? 0.45 : 1))})`);
                    eye.setAttribute('transform-origin', `${x} ${y}`);
                    eye.setAttribute('opacity', f(on ? blink : OFF));
                });
            },
        };
    },
};

export const cassette = {
    name: 'cassette',
    style: 'neon-nuit',
    line: 2.6,
    limbs: MAGENTA,
    head,
    proportions: { thigh: 18, shin: 20, reach: 34, stride: 20, lift: 9, upper: 21, fore: 21 },
};
