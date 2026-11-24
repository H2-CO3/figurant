// A small harbour, in line and gold: still water, a quay on its piles, with a bollard, a
// barrel and the lantern of the harbour; the roofs of the town behind it; a
// gold coin. The origin of the quay is the foot of its first pile, at the
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

/** The town behind the quay: roofs, a tower, windows. Thin ink, far away. */
export const harbourTown = {
    name: 'harbour-town',
    style: STYLE,
    shapes: [
        inkShape(`M 0 ${-QUAY} L 0 ${-QUAY - 44} L 18 ${-QUAY - 62} L 36 ${-QUAY - 44} L 36 ${-QUAY} M 36 ${-QUAY - 50} L 36 ${-QUAY - 78} L 58 ${-QUAY - 96} L 80 ${-QUAY - 78} L 80 ${-QUAY} M 80 ${-QUAY - 40} L 100 ${-QUAY - 56} L 120 ${-QUAY - 40} L 120 ${-QUAY} M 120 ${-QUAY - 46} L 120 ${-QUAY - 118} L 132 ${-QUAY - 136} L 144 ${-QUAY - 118} L 144 ${-QUAY} M 144 ${-QUAY - 52} L 166 ${-QUAY - 70} L 188 ${-QUAY - 52} L 188 ${-QUAY}`, 0.7),
        inkShape(`M 12 ${-QUAY - 30} l 10 0 l 0 12 l -10 0 Z M 50 ${-QUAY - 62} l 12 0 l 0 14 l -12 0 Z M 50 ${-QUAY - 34} l 12 0 l 0 14 l -12 0 Z M 94 ${-QUAY - 28} l 10 0 l 0 12 l -10 0 Z M 160 ${-QUAY - 38} l 12 0 l 0 14 l -12 0 Z`, 0.5),
        goldShape(`M 128 ${-QUAY - 104} l 8 0 l 0 12 l -8 0 Z`, 0.8),
        inkShape(`M 132 ${-QUAY - 136} L 132 ${-QUAY - 148} l 9 3 l -9 3`, 0.6),
    ],
    points: {},
};

/** Still water, as far as a picture goes: short ripples here and there, fainter further off. Behind everything. */
export const harbourWater = {
    name: 'harbour-water',
    style: STYLE,
    shapes: [
        inkShape(Array.from({ length: 26 }, (unused, i) => { const x = -520 + i * 41 + (i * 37 % 23), w = 7 + (i * 13 % 6); return `M ${x} ${-9 - (i * 7 % 5)} q ${w / 2} -2.4 ${w} 0 q ${w / 2} 2.4 ${w} 0`; }).join(' '), 0.45),
        inkShape(Array.from({ length: 18 }, (unused, i) => { const x = -500 + i * 59 + (i * 29 % 31), w = 9 + (i * 11 % 7); return `M ${x} ${-2 - (i * 5 % 3)} q ${w / 2} -3 ${w} 0 q ${w / 2} 3 ${w} 0`; }).join(' '), 0.7),
    ],
    points: {},
};

export const goldCoin = { name: 'gold-coin', style: STYLE, shapes: [{ tag: 'circle', attrs: { cx: 0, cy: 0, r: 3.2, fill: GOLD, stroke: INK, 'stroke-width': 0.8 } }], points: {} };
