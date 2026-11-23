// A hill with a tree, in cut paper: a dark teal hill behind, a teal one in
// front, a few flowers, and a small tree on its left slope (navy trunk, two layers
// of leaves, coral fruit). Made for the paper sun, which is wider than the
// tree and can sink behind the hilltop. Origin: the floor, under the hilltop.

import { paper, TEAL, CORAL, NAVY, WHITE, MUSTARD, SKY } from '../kit.js';

const DARK = '#2f7269';
/** A piece that stands on the floor: its shadow goes to the right only, never under the floor line. */
const standing = (d, fill, lift = 1.6) => { const [shade, piece] = paper(d, fill, lift); shade.attrs.transform = `translate(${lift * 1.3} 0)`; return [shade, piece]; };
const dot = (x, y, r, fill) => [
    { tag: 'circle', attrs: { cx: x + 0.7, cy: y + 0.9, r, fill: NAVY, stroke: 'none', opacity: 0.2 } },
    { tag: 'circle', attrs: { cx: x, cy: y, r, fill, stroke: 'none' } },
];

export const paperHill = {
    name: 'paper-hill',
    style: 'papier-decoupe',
    shapes: [
        // The hill behind, off to the right.
        ...standing('M -30 0 L -18 -18 L 4 -34 L 30 -40 L 52 -33 L 68 -16 L 76 0 Z', DARK, 2.2),
        // The tree: trunk, leaves behind, leaves in front, fruit.
        ...paper('M -62 -10 L -60.6 -48 L -55.4 -48.4 L -54.4 -10 Z', NAVY, 1.2),
        ...paper('M -80 -58 L -75 -74 L -62 -83 L -47 -80 L -37 -67 L -40 -51 L -53 -42 L -70 -45 Z', DARK, 1.8),
        ...paper('M -74 -61 L -68 -73 L -58 -77 L -48 -71 L -46 -60 L -54 -51 L -66 -52 Z', SKY, 1.2),
        ...dot(-66, -63, 2.7, CORAL), ...dot(-53, -61, 2.7, CORAL), ...dot(-59, -71, 2.5, CORAL),
        // The hill in front.
        ...standing('M -66 0 L -58 -17 L -44 -32 L -24 -44 L -2 -49 L 20 -45 L 40 -33 L 54 -17 L 62 0 Z', TEAL, 2.2),
        // Flowers: a white round with a mustard heart.
        ...[[-30, -24], [8, -30], [34, -12], [-8, -10]].flatMap(([x, y]) => [...dot(x, y, 3.2, WHITE), { tag: 'circle', attrs: { cx: x, cy: y, r: 1.3, fill: MUSTARD, stroke: 'none' } }]),
    ],
    points: { top: [0, -49], tree: [-58, -83] },
};
