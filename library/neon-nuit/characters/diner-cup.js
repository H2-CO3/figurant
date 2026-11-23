// A diner's coffee cup, in neon: the sign in the window of a place that
// never closes. An amber cup on its saucer, three cyan wisps of steam, a
// magenta heart. It is a sign, so nothing glides. What is its own:
// - the steam is a chase: the wisps light one after the other, then all go
//   dark, on a loop (`chase` 1). With `chase` 0 a scene lights exactly
//   `steam` wisps (0 to 3). Startled (`wide`), all three strike on, taller.
// - the heart is a two-frame sign: small, large, small, large. Startled, it
//   stays large; when the cup doubts (`squint`), it goes dark.
// - the wisps lean behind a move (`drag`), as steam does.
// - `power`: below one half the whole sign is switched off, and only the
//   cold glass is left to see. A scene strikes it on and off with it.

import { kit, CYAN, MAGENTA, AMBER } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
/** What is left of a tube when it is switched off. */
const OFF = 0.13;
/** The three wisps stand over these abscissas. */
const WISPS = [-19, 0, 19];
/** One wisp: an S rising from the rim, its top pushed aside by `lean`. */
const wisp = (x, height, lean) => `M ${f(x)} -43 C ${f(x - 9 + lean * 0.3)} ${f(-43 - height * 0.33)} ${f(x + 9 + lean * 0.7)} ${f(-43 - height * 0.66)} ${f(x + lean)} ${f(-43 - height)}`;
const HEART = 'M 0 16 C -13 7 -7 -3 0 4 C 7 -3 13 7 0 16 Z';

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

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        const steam = WISPS.map(x => k.tube(group, wisp(x, 26, 0), CYAN, 2.2));
        // The cup: its side, its rim seen a little from above, the handle; then the saucer.
        const cup = stage.el('g', group);
        k.tube(cup, 'M -36 -30 L -36 -4 Q -36 24 -12 24 L 12 24 Q 36 24 36 -4 L 36 -30', AMBER, 3.2);
        k.tube(cup, 'M -36 -30 a 36 6.5 0 1 0 72 0 a 36 6.5 0 1 0 -72 0', AMBER, 2.4);
        k.tube(cup, 'M 37 -19 C 62 -22 62 10 33 9', AMBER, 3.2);
        k.tube(cup, 'M -54 28 Q -51 34 -41 34 L 41 34 Q 51 34 54 28', AMBER, 3.2);
        const heart = k.tube(group, HEART, MAGENTA, 2.2);
        const eyes = [k.spark(group, -13, -11, 2.4, CYAN), k.spark(group, 13, -11, 2.4, CYAN)];

        // The right arm hangs from the handle, not through it.
        let lit = null;
        const frame = { hips: [[-13, 35], [13, 35]], shoulders: [[-36, -16], [55, -6]], hipY: 35, top: [0, -37], soft: 0.25 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, power: 1, chase: 1, steam: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const on = s.power >= 0.5, startled = s.wide > 0.5;
                if (on !== lit) { lit = on; dimLimbs(layer, on ? 1 : 0.2); }
                // The hum: a shimmer too faint to be called a movement.
                const hum = 0.95 + 0.05 * Math.sin(s.clock * 0.021);
                cup.setAttribute('opacity', f(on ? hum : OFF));

                // The steam. A chase has four frames: none, one, two, three wisps.
                const count = startled ? 3 : s.chase >= 0.5 ? Math.floor(s.clock / 330) % 4 : Math.round(clamp(s.steam, 0, 3));
                const lean = clamp(-drag[0] * 1.5, -13, 13), height = startled ? 36 : 26;
                steam.forEach((tube, i) => {
                    k.redraw(tube, wisp(WISPS[i], height, lean));
                    tube.setAttribute('opacity', f(on && i < count ? hum : OFF));
                });

                // The heart: two frames, a beat apart.
                const big = startled || Math.floor(s.clock / 520) % 2 === 1, size = startled ? 1.45 : big ? 1.22 : 1;
                heart.setAttribute('transform', `translate(0 ${f(9 - 9 * size)}) scale(${f(size)})`);
                heart.setAttribute('opacity', f(on && s.squint < 0.5 ? hum : OFF));

                const light = on ? 0.16 + 0.84 * clamp(s.lid, 0, 1) : OFF;
                eyes.forEach((eye, i) => {
                    eye.setAttribute('transform', `translate(${f(s.gazeX * 4)} ${f(s.gazeY * 3)}) scale(${f(startled ? 1.5 : 1)} ${f((startled ? 1.5 : 1) * (s.squint > 0.5 ? 0.45 : 1))})`);
                    eye.setAttribute('transform-origin', `${i ? 13 : -13} -11`);
                    eye.setAttribute('opacity', f(light));
                });
            },
        };
    },
};

export const dinerCup = {
    name: 'diner-cup',
    style: 'neon-nuit',
    line: 2.6,
    limbs: AMBER,
    head,
    proportions: { thigh: 19, shin: 21, reach: 36, stride: 20, lift: 9, upper: 18, fore: 18 },
};
