// A small harbour, in line and gold: a quay on its piles, with a bollard, a
// barrel and the lantern of the harbour; a gold coin. The origin of the quay is the foot of its first pile, at the
// water (the floor of a scene): its planks are `QUAY` units above it, and
// whoever walks on them is that high above the floor (`fly: QUAY`).

import { GOLD, INK, goldShape, inkShape, dotShape } from '../kit.js';

/** How high the planks of the quay are above the water. */
export const QUAY = 48;
const STYLE = 'trait-et-or';
const PILES = [8, 92, 176, 260, 344, 428, 512, 596];

export const quay = {
    name: 'quay',
    style: STYLE,
    shapes: [
        // Braces between the piles, then the piles down into the water, each with its ring of ripples.
        inkShape(PILES.slice(0, -1).map(x => `M ${x + 4} ${-QUAY + 8} L ${x + 80} -6 M ${x + 80} ${-QUAY + 8} L ${x + 4} -6`).join(' '), 0.6),
        ...PILES.flatMap(x => [
            goldShape(`M ${x - 4} ${-QUAY + 6} L ${x - 4} 3 L ${x + 4} 3 L ${x + 4} ${-QUAY + 6} Z`),
            inkShape(`M ${x - 4} -13 L ${x + 4} -13 M ${x - 9} 2 q 4.5 -3.4 9 0 q 4.5 3.4 9 0`, 0.7),
        ]),
        // The planks, their joints, the beam under them.
        goldShape(`M -3 ${-QUAY} L 700 ${-QUAY} L 700 ${-QUAY + 7} L -3 ${-QUAY + 7} Z`),
        inkShape(Array.from({ length: 16 }, (unused, i) => `M ${30 + i * 42} ${-QUAY} L ${30 + i * 42} ${-QUAY + 7}`).join(' '), 0.7),
        // A ladder down to the water, a mooring ring.
        inkShape(`M 20 ${-QUAY + 7} L 20 -2 M 30 ${-QUAY + 7} L 30 -2 ` + [-34, -27, -20, -13, -6].map(y => `M 20 ${y} L 30 ${y}`).join(' '), 0.8),
        // A bollard with a turn of rope, a barrel, the lantern on its post.
        goldShape(`M 84 ${-QUAY} L 84 ${-QUAY - 9} Q 89 ${-QUAY - 14} 94 ${-QUAY - 9} L 94 ${-QUAY} Z`),
        inkShape(`M 83 ${-QUAY - 4} Q 89 ${-QUAY - 1} 95 ${-QUAY - 4}`, 0.8),
        goldShape(`M 196 ${-QUAY} Q 191 ${-QUAY - 11} 196 ${-QUAY - 22} L 212 ${-QUAY - 22} Q 217 ${-QUAY - 11} 212 ${-QUAY} Z`),
        inkShape(`M 194 ${-QUAY - 6} L 214 ${-QUAY - 6} M 194 ${-QUAY - 16} L 214 ${-QUAY - 16}`, 0.8),
        inkShape(`M 40 ${-QUAY} L 40 ${-QUAY - 92} Q 40 ${-QUAY - 100} 50 ${-QUAY - 100} L 52 ${-QUAY - 100} L 52 ${-QUAY - 95}`, 1.1),
        goldShape(`M 46 ${-QUAY - 95} L 58 ${-QUAY - 95} L 56 ${-QUAY - 80} L 48 ${-QUAY - 80} Z`),
        { tag: 'circle', attrs: { cx: 52, cy: -QUAY - 87, r: 2.4, fill: GOLD, stroke: 'none' } },
        dotShape(40, -QUAY, 2),
    ],
    points: { edge: [0, -QUAY] },
};

export const goldCoin = { name: 'gold-coin', style: STYLE, shapes: [{ tag: 'circle', attrs: { cx: 0, cy: 0, r: 3.2, fill: GOLD, stroke: INK, 'stroke-width': 0.8 } }], points: {} };
