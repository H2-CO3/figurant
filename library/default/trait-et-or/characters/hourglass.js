// An hourglass, in line and gold. Two small eyes in its upper bulb; its sand
// is its one solid gold. The sand runs down as time passes (`sand`, 0 all
// above -> 1 all below), and leaps back up when it is startled; the thread of
// falling sand sways behind every move.

import { kit, GOLD, INK, FINE, THREAD } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

const head = {
    create({ stage, layer, line }) {
        const group = stage.el('g', layer);
        const k = kit(stage, group, line);
        // The two bulbs, drawn as one glass, then what is inside.
        k.gold(group, 'M -22 -44 C -22 -14 -3 -8 -3 0 C -3 8 -22 14 -22 44 L 22 44 C 22 14 3 8 3 0 C 3 -8 22 -14 22 -44 Z');
        const top = k.solid(group, ''), bottom = k.solid(group, '');
        const thread = stage.el('path', group, { fill: 'none', stroke: GOLD, 'stroke-width': line * FINE, 'stroke-linecap': 'round' });
        // The frame: two plates and their posts.
        k.ink(group, 'M -27 -44 L 27 -44 M -27 44 L 27 44', THREAD);
        k.ink(group, 'M -25 -44 L -25 44 M 25 -44 L 25 44', FINE);
        for (const [x, y] of [[-25, -44], [25, -44], [-25, 44], [25, 44]]) k.dot(group, x, y, 2.4);
        const eyes = [[-8, -30], [8, -30]].map(() => stage.el('ellipse', group, { fill: INK, stroke: 'none' }));
        // A cap with its rank on it, for the day it plays the boss (`cap`: 0 bare-headed, 1 worn).
        const cap = k.group(group);
        const visor = k.ink(cap, 'M 19 -46.5 Q 32 -47 39 -43', THREAD);
        k.gold(cap, 'M -22 -46 L -22 -57 Q -22 -70 0 -70 Q 22 -70 22 -57 L 22 -46 Z', THREAD);
        const rank = stage.el('text', cap, { x: 0, y: -57, 'font-size': 12, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-family': 'system-ui, sans-serif', 'font-weight': 800, 'letter-spacing': 0.6, fill: INK, stroke: 'none' });
        rank.textContent = 'BOSS';

        const frame = { hips: [[-10, 45], [10, 45]], shoulders: [[-26, -6], [26, -6]], hipY: 45, top: [0, -46], soft: 0.4 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, sand: 0.35, cap: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                cap.setAttribute('display', s.cap > 0.5 ? 'inline' : 'none');
                // The visor points where it looks.
                visor.setAttribute('transform', `scale(${(s.gazeX || s.dir || 1) < 0 ? -1 : 1} 1)`);
                // Startled, the sand jumps back up a little.
                const fallen = clamp(s.sand - 0.3 * clamp(s.wide, 0, 1), 0, 1);
                // Above: a pool that sinks into the neck. Below: a heap that rises.
                const level = -18 + 14 * fallen, half = Math.max(1.5, 17 * (1 - (level + 18) / 16));
                top.setAttribute('d', fallen > 0.97 ? '' : `M ${f(-half)} ${f(level)} L ${f(half)} ${f(level)} C ${f(half * 0.4)} -8 2.4 -6 2.4 -2 L -2.4 -2 C -2.4 -6 ${f(-half * 0.4)} -8 ${f(-half)} ${f(level)} Z`);
                const heap = 3 + 17 * fallen;
                bottom.setAttribute('d', `M -20.5 42.5 L 20.5 42.5 C 14 ${f(42.5 - heap * 0.5)} 5 ${f(42.5 - heap)} 0 ${f(42.5 - heap)} C -5 ${f(42.5 - heap)} -14 ${f(42.5 - heap * 0.5)} -20.5 42.5 Z`);
                const sway = clamp(-drag[0], -4, 4);
                thread.setAttribute('d', fallen > 0.02 && fallen < 0.98 ? `M 0 -2 Q ${f(sway)} 20 ${f(sway * 0.5)} ${f(42 - heap)}` : '');

                const open = clamp(s.lid, 0, 1) * (1 - 0.5 * clamp(s.squint, 0, 1)), r = 2.5 * (1 + 0.3 * clamp(s.wide, 0, 1));
                eyes.forEach((eye, i) => {
                    eye.setAttribute('cx', f((i ? 8 : -8) + s.gazeX * 2.4)); eye.setAttribute('cy', f(-30 + s.gazeY * 2));
                    eye.setAttribute('rx', f(r)); eye.setAttribute('ry', f(Math.max(0.4, r * open)));
                });
            },
        };
    },
};

export const hourglass = {
    name: 'hourglass',
    style: 'default',
    line: 2.2,
    limbs: INK,
    head,
    proportions: { thigh: 20, shin: 22, reach: 38, stride: 20, lift: 8, upper: 22, fore: 22 },
};
