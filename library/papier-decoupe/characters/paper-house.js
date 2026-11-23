// A little house, in cut paper: sand walls on a teal plinth, a coral roof in
// two layers with a navy chimney, two white windows that are its eyes (a
// mustard blind comes down when it blinks) and a teal door that is its mouth.
// What is its own: the roof sits loose, like a hat. It lifts when the house
// is startled, lags behind a move and leans towards what the house looks at;
// the door flips open like a paper flap when it is surprised. Three numbers
// of its own: `roof` (0 -> 1: it tips its roof like a hat), `door` (0 shut ->
// 1 flipped open) and `smoke` (0 -> 1: paper puffs climb out of the chimney,
// one notch at a time).
//
// Paper does not stretch: it barely squashes, and what moves by itself moves
// in notches, as in stop-motion.

import { kit, CORAL, MUSTARD, TEAL, NAVY, SAND, WHITE } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);
const BRICK = '#cf5b47', SHADOW = NAVY;
/** A notch of stop-motion, in ms. */
const NOTCH = 120;
const notch = (v, n = 4) => Math.round(clamp(v, 0, 1) * n) / n;
/** The three sizes of a puff, small as it leaves the chimney: one cut-out replaces another. */
const PUFFS = [
    'M -3.4 0.6 L -2.2 -2.8 L 1 -3.6 L 3.5 -1 L 2.6 2.6 L -1 3.4 Z',
    'M -5.2 0.4 L -3.6 -3.8 L 0.6 -5.3 L 4.6 -2.8 L 5.2 1.4 L 2 4.8 L -2.6 4.4 Z',
    'M -7 0.8 L -5.4 -4.4 L -1 -7 L 4.2 -5.6 L 7 -1 L 5.4 4.6 L 0.6 6.8 L -4.6 5 Z',
];
const WINDOWS = [-17, 17];

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        // The smoke, behind everything.
        const puffs = [0, 1, 2].map(() => ({
            shade: stage.el('path', group, { fill: SHADOW, stroke: 'none', opacity: 0 }),
            node: stage.el('path', group, { fill: WHITE, stroke: 'none', opacity: 0 }),
        }));
        // The walls and the plinth.
        k.piece(group, 'M -34 -22 L 34.6 -21.4 L 33.6 34 L -33.2 34.5 Z', SAND, 2.2);
        k.piece(group, 'M -34.6 26.4 L 34.6 25.8 L 34.2 34.2 L -34 34.6 Z', TEAL, 1);
        // The windows: a white square, a navy pane that looks, a blind, a coral sill.
        const panes = [], blinds = [];
        for (const x of WINDOWS) {
            k.piece(group, `M ${x - 8.4} -12 L ${x + 8} -12.5 L ${x + 8.5} 4.4 L ${x - 8} 4 Z`, WHITE, 1.1);
            panes.push(stage.el('rect', group, { width: 6.4, height: 7.4, rx: 1, fill: NAVY, stroke: 'none' }));
            blinds.push(stage.el('path', group, { fill: MUSTARD, stroke: 'none' }));
            k.piece(group, `M ${x - 10.4} 4 L ${x + 10.6} 3.6 L ${x + 10} 7.2 L ${x - 10} 7.4 Z`, CORAL, 0.9);
        }
        // The door: a dark doorway, and the leaf that flips open on its left edge.
        stage.el('path', group, { d: 'M -8.6 34.4 L -8.4 17 Q 0 8.4 8.6 17 L 8.4 34.2 Z', fill: NAVY, stroke: 'none' });
        const leaf = stage.el('g', group);
        k.piece(leaf, 'M -8.6 34.4 L -8.4 17 Q 0 8.4 8.6 17 L 8.4 34.2 Z', TEAL, 1.2);
        stage.el('path', leaf, { d: 'M -5.4 31 L -5.2 18.6 Q 0 13.4 5.4 18.6 L 5.2 30.8 Z', fill: '#4fa39a', stroke: 'none' });
        k.dot(leaf, 4, 25, 1.5, MUSTARD);
        // The roof, on top of everything, with its chimney: it moves as one hat.
        const roof = stage.el('g', group);
        k.piece(roof, 'M 14.6 -30 L 15 -52 L 27.4 -52.6 L 27.6 -30 Z', NAVY, 1.4);
        k.piece(roof, 'M 12.8 -51.4 L 13 -56 L 29.6 -56.4 L 29.4 -51.8 Z', SAND, 1);
        k.piece(roof, 'M -47 -17.6 L -1.4 -60 L 47.4 -18.6 Q 0 -15.4 -47 -17.6 Z', BRICK, 2.4);
        k.piece(roof, 'M -34 -27.6 L -1.2 -57.6 L 33.6 -28.4 Z', CORAL, 1.3);
        k.piece(roof, 'M -4.6 -36 L -3.4 -41.6 L 1.6 -43.4 L 5.2 -39.2 L 3.8 -34.2 L -1 -32.6 Z', MUSTARD, 0.9);
        for (const x of [-33, -20, -7, 6, 19, 32]) stage.el('path', roof, { d: `M ${x - 3.4} -23.4 L ${x} -19.4 L ${x + 3.4} -23.6 Z`, fill: CORAL, stroke: 'none' });

        let tick = -1, lifted = 0, late = 0;

        const frame = { hips: [[-13, 34.4], [13, 34.4]], shoulders: [[-33.6, 10], [34, 10]], hipY: 34.4, top: [0, -60], soft: 0.2 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, roof: 0, door: 0, smoke: 0 },
            frame: () => frame,
            draw({ state: s, matrix, drag }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const wide = notch(s.wide), lid = notch(s.lid), hat = clamp(s.roof, 0, 1);
                const now = Math.floor(s.clock / NOTCH);
                if (now !== tick) { tick = now; late = lifted; lifted = wide; }   // the roof comes down one notch after the fright

                // The roof: lifted by a fright, left behind by a move, tipped by `roof` on its left corner.
                const lift = 9 * Math.max(lifted, late) + clamp(-drag[1] * 1.1, 0, 12) + 7 * hat;
                const lean = 2.5 * clamp(s.gazeX, -1, 1) + clamp(drag[0] * 1.1, -10, 10);
                roof.setAttribute('transform', `translate(0 ${f(-lift)}) rotate(${f(lean)} 0 -18) rotate(${f(-22 * hat)} -44 -18)`);

                // The door flips over its left edge, as a paper flap does.
                const ajar = Math.max(clamp(s.door, 0, 1), 0.75 * wide);
                leaf.setAttribute('transform', `translate(-8.5 0) scale(${f(1 - 1.42 * ajar)} 1) translate(8.5 0)`);

                // The windows look, and their blinds come down.
                const shut = (1 - lid) + 0.4 * clamp(s.squint, 0, 1) * lid, big = 1 + 0.25 * wide;
                WINDOWS.forEach((x, i) => {
                    const w = 6.4 * big, h = 7.4 * big;
                    panes[i].setAttribute('x', f(x - w / 2 + s.gazeX * 3.4)); panes[i].setAttribute('y', f(-4.2 - h / 2 + s.gazeY * 3));
                    panes[i].setAttribute('width', f(w)); panes[i].setAttribute('height', f(h));
                    const drop = -12.2 + 16.6 * clamp(shut, 0, 1);
                    blinds[i].setAttribute('d', `M ${x - 8.4} -12.2 L ${x + 8.2} -12.6 L ${x + 8.4} ${f(drop)} L ${x - 8.2} ${f(drop + 0.5)} Z`);
                });

                // The smoke: three puffs climb in notches, each a bigger cut-out as it rises.
                const amount = clamp(s.smoke, 0, 1);
                puffs.forEach((puff, i) => {
                    const life = ((now * 0.085 + i / 3) % 1), size = Math.min(2, Math.floor(life * 3));
                    const x = 21 + 7 * life + 3.5 * Math.sin(i * 2.1 + Math.floor(life * 6)), y = -60 - lift - 32 * life;
                    const seen = amount > (i + 0.5) / 4 && life < 0.92 ? 1 : 0;
                    puff.node.setAttribute('d', PUFFS[size]); puff.shade.setAttribute('d', PUFFS[size]);
                    puff.node.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${i * 40 + size * 25})`);
                    puff.shade.setAttribute('transform', `translate(${f(x + 1.4)} ${f(y + 1.8)}) rotate(${i * 40 + size * 25})`);
                    puff.node.setAttribute('opacity', seen); puff.shade.setAttribute('opacity', seen * 0.2);
                });
            },
        };
    },
};

export const paperHouse = {
    name: 'paper-house',
    style: 'papier-decoupe',
    line: 2.6,
    limbs: NAVY,
    head,
    proportions: { thigh: 15, shin: 17, reach: 28, stride: 16, lift: 8, upper: 20, fore: 20 },
};
