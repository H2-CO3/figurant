// A small harbour, in line and gold: a skiff to sail in (and to sink), the
// water it sails on, a quay on its piles with a bollard and a lantern, a gold
// coin. They are what the pirate's landfall is played in
// (../scenes/pirate/landfall.js); any other scene may use them.
//
// The skiff is in two pieces, so that somebody can stand in it: its rig (the
// mast, the yard, the sail) goes behind them, its hull in front. Origin of
// both: the waterline, under the mast. The quay's origin is its edge, at the
// level of its planks; the water is `WATER` units under those planks.

import { GOLD, INK, PAPER, goldShape, inkShape, dotShape } from '../kit.js';

/** The mast above the skiff's waterline; its floor, where one stands in it; the water below the quay's planks; the length of a wave. */
export const MAST = 122, FLOOR = 3, WATER = 36, WAVE = 54;
const STYLE = 'trait-et-or';

export const skiffRig = {
    name: 'skiff-rig',
    style: STYLE,
    shapes: [
        inkShape(`M 0 -6 L 0 ${-MAST}`, 1.4),                                                        // the mast
        inkShape(`M -11 ${-MAST} L 11 ${-MAST} M -11 ${-MAST} L -11 ${-MAST - 6} M 11 ${-MAST} L 11 ${-MAST - 6}`, 1.1), // the masthead
        inkShape(`M -4 ${-MAST + 18} L 46 ${-MAST + 26}`, 1),                                        // the yard
        goldShape(`M 3 ${-MAST + 19} L 45 ${-MAST + 27} Q 52 -66 40 -34 L 3 -26 Q 10 -64 3 ${-MAST + 19} Z`), // the sail, full
        inkShape(`M 19 ${-MAST + 48} l 8 7 m -8 0 l 8 -7 M 13 -50 l 15 -4`, 0.7),                    // its patches
        inkShape('M 0 -26 L 42 -34', 0.9),                                                           // the boom
    ],
    points: { masthead: [0, -MAST] },
};
export const skiffHull = {
    name: 'skiff-hull',
    style: STYLE,
    shapes: [
        goldShape('M -62 -15 L 66 -18 Q 56 16 4 18 Q -46 16 -62 -15 Z'),
        inkShape('M -56 -7 Q 0 -2 61 -10 M -48 3 Q 0 8 53 0', 0.7),
        inkShape('M -62 -15 L -74 -24', 1.2),                                                        // the tiller
        dotShape(-62, -15, 2.2), dotShape(66, -18, 2.2),
    ],
    points: { floor: [0, -FLOOR], stern: [-34, -FLOOR] },
};
/** The skiff whole, to look at. */
export const skiff = { name: 'skiff', style: STYLE, shapes: [...skiffRig.shapes, ...skiffHull.shapes], points: { masthead: [0, -MAST] } };

/** One line of swell, wide enough to run past a picture: `at` units under the waterline. Slide it by a wave's length, again and again. */
export const swell = (at, weight) => ({
    name: 'swell',
    style: STYLE,
    shapes: [inkShape(Array.from({ length: 34 }, (unused, i) => `M ${-918 + i * WAVE} ${WATER + at} q ${WAVE / 4} -4 ${WAVE / 2} 0 t ${WAVE / 2} 0`).join(' '), weight)],
    points: {},
});
/** The water: what is under it is not seen (the paper covers it), and its line. */
export const harbourWater = {
    name: 'harbour-water',
    style: STYLE,
    shapes: [
        { tag: 'path', attrs: { d: `M -960 ${WATER} L 960 ${WATER} L 960 ${WATER + 220} L -960 ${WATER + 220} Z`, fill: PAPER, stroke: 'none' } },
        inkShape(`M -960 ${WATER} L 960 ${WATER}`, 1),
    ],
    points: {},
};
export const quay = {
    name: 'quay',
    style: STYLE,
    shapes: [
        // Under the planks, the water is hidden too; then the piles, the planks, a bollard, the lantern of the harbour.
        { tag: 'path', attrs: { d: `M 0 7 L 900 7 L 900 ${WATER + 220} L 0 ${WATER + 220} Z`, fill: PAPER, stroke: 'none' } },
        inkShape(`M 0 ${WATER} L 900 ${WATER}`, 1),
        ...[6, 96, 186, 276, 366, 456, 546, 636, 726, 816].flatMap(x => [goldShape(`M ${x - 4} 6 L ${x - 4} ${WATER + 60} L ${x + 4} ${WATER + 60} L ${x + 4} 6 Z`), inkShape(`M ${x - 4} ${WATER} q 4 -3 8 0`, 0.7)]),
        goldShape('M 0 0 L 900 0 L 900 7 L 0 7 Z'),
        inkShape(Array.from({ length: 13 }, (unused, i) => `M ${44 + i * 66} 0 L ${44 + i * 66} 7`).join(' '), 0.7),
        goldShape('M 16 0 L 16 -9 Q 21 -13 26 -9 L 26 0 Z'),
        inkShape('M 196 0 L 196 -96 M 196 -96 L 210 -96 M 210 -96 L 210 -90', 1.1),
        goldShape('M 204 -90 L 216 -90 L 214 -74 L 206 -74 Z'),
        dotShape(210, -82, 2.2),
    ],
    points: { edge: [0, 0] },
};
export const goldCoin = { name: 'gold-coin', style: STYLE, shapes: [{ tag: 'circle', attrs: { cx: 0, cy: 0, r: 3.2, fill: GOLD, stroke: INK, 'stroke-width': 0.8 } }], points: {} };
