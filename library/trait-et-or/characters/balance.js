// A pair of scales, in line and gold: a column on a foot, a round face, a
// beam and two pans on their chains. The beam tips towards what it looks at
// (softly, with a little sway) and by `tip` (-1 the left pan down, 1 the
// right one): a scene weighs with that number. The pans always hang straight
// and swing on their chains behind every move; startled, they fly apart and
// the tongue above the pivot quivers. The tongue is its one solid gold.

import { kit, INK, FINE, THREAD } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const RAD = Math.PI / 180;

/** The pivot of the beam, half its length, the chains' drop, and its angle (degrees) when `tip` is 1. */
export const PIVOT = [0, -48], ARM = 40, DROP = 26, TIP = 12;
/**
 * Where the floor of a pan is, in the character's own units (a hand target),
 * for a given `tip`, the gaze being straight.
 * @param {-1 | 1} side
 */
export function panAt(side, tip = 0) {
    const a = TIP * tip * RAD;
    return [PIVOT[0] + side * ARM * Math.cos(a), PIVOT[1] + side * ARM * Math.sin(a) + DROP];
}

const head = {
    create({ stage, layer, line }) {
        const group = stage.el('g', layer);
        const k = kit(stage, group, line);
        // The column, its foot, and the round face on it.
        k.gold(group, 'M -3 -8 L -2.4 -47 L 2.4 -47 L 3 -8 Z', THREAD);
        k.gold(group, 'M -3.6 14 L -3.6 29 Q -4.5 36 -10 38 L 10 38 Q 4.5 36 3.6 29 L 3.6 14 Z', THREAD);
        k.gold(group, 'M -16 44 L -16 38 L 16 38 L 16 44 Z');
        k.dot(group, -10, 38, 2.2); k.dot(group, 10, 38, 2.2);
        k.gold(group, 'M -13 4 A 13 13 0 1 0 13 4 A 13 13 0 1 0 -13 4 Z');
        const eyes = [0, 1].map(() => stage.el('ellipse', group, { fill: INK, stroke: 'none' }));
        // The pans, each hanging from an end of the beam.
        const pans = [-1, 1].map(() => {
            const pan = stage.el('g', group);
            k.ink(pan, `M 0 0 L -11 ${DROP} M 0 0 L 11 ${DROP}`, FINE);
            k.gold(pan, `M -13 ${DROP} Q 0 ${DROP + 11} 13 ${DROP} Z`, THREAD);
            return pan;
        });
        // The beam and its tongue.
        const beam = stage.el('g', group);
        k.gold(beam, `M ${-ARM} 0 Q 0 -10 ${ARM} 0 Q 0 4 ${-ARM} 0 Z`, THREAD);
        const tongue = k.solid(beam, 'M 0 -24 L 4.6 -13 L 0 -4 L -4.6 -13 Z');
        k.dot(beam, -ARM, 0, 2.2); k.dot(beam, ARM, 0, 2.2); k.dot(beam, 0, -1.5, 2.6);

        const frame = { hips: [[-9, 44], [9, 44]], shoulders: [[-12.6, 7], [12.6, 7]], hipY: 44, top: [0, -73], soft: 0.3 };
        // What moves by itself: the beam's lean towards the gaze, and each pan on its chains.
        const lean = { at: 0, speed: 0 }, swing = [{ at: 0, speed: 0 }, { at: 0, speed: 0 }];
        const settle = (part, target, stiffness, damping, dt) => {
            let left = clamp(dt || 0, 0, 100);
            while (left > 0) {
                const h = Math.min(left, 8) / 1000; left -= 8;
                part.speed += (-stiffness * (part.at - target) - damping * part.speed) * h;
                part.at += part.speed * h;
            }
            return part.at;
        };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, tip: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag, dt }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = clamp(s.wide, 0, 1);
                const angle = TIP * clamp(s.tip, -1.2, 1.2) + settle(lean, 8 * clamp(s.gazeX, -1, 1) - clamp(drag[0], -8, 8) * 0.8, 40, 5, dt);
                beam.setAttribute('transform', `translate(${PIVOT[0]} ${PIVOT[1]}) rotate(${f(angle)})`);
                tongue.setAttribute('transform', `rotate(${f(wide * 7 * Math.sin(s.clock * 0.05))} 0 -4)`);
                pans.forEach((pan, i) => {
                    const side = i ? 1 : -1, a = angle * RAD;
                    const x = PIVOT[0] + side * ARM * Math.cos(a), y = PIVOT[1] + side * ARM * Math.sin(a);
                    // They hang along the page's vertical whatever the body's tilt, and lag behind it.
                    const hang = settle(swing[i], -clamp(drag[0], -10, 10) * (i ? 2.6 : 3) - side * 16 * wide, 34, 2.2, dt);
                    pan.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(hang - s.tilt)})`);
                });
                const open = clamp(s.lid, 0, 1) * (1 - 0.5 * clamp(s.squint, 0, 1)), r = 2.3 * (1 + 0.3 * wide);
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 5.2 : -5.2) + clamp(s.gazeX, -1, 1) * 2.2)); eye.setAttribute('cy', f(4 + clamp(s.gazeY, -1, 1) * 1.8));
                    eye.setAttribute('rx', f(r)); eye.setAttribute('ry', f(Math.max(0.4, r * open)));
                });
            },
        };
    },
};

export const balance = {
    name: 'balance',
    style: 'trait-et-or',
    line: 2.2,
    limbs: INK,
    head,
    proportions: { thigh: 20, shin: 22, reach: 38, stride: 20, lift: 8, upper: 25, fore: 25 },
};
