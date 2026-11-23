// Where the alarm clock belongs: a bedside table, painted sage with a honey
// wood top, one drawer with a brass knob, turned legs. Same "cartoon
// réaliste" look and scale as the clock (80 units wide): the top is wider
// than it is, and low enough for it to jump on. Flat colours with a patch of
// shade and one of light. Origin: the floor, under its middle.

const OUTLINE = '#3a2622', PAINT = '#7fae9f', PAINT_DARK = '#4f7d70', WOOD = '#d09a5c', WOOD_DARK = '#8a5a34';
const piece = (d, fill, weight = 0.8) => ({ tag: 'path', attrs: { d, fill, stroke: OUTLINE }, weight });
const patch = (d, fill, opacity = 1) => ({ tag: 'path', attrs: { d, fill, stroke: 'none', opacity } });

/** How high the table top is. */
export const BEDSIDE = 46;
/** Half the width of its top. */
export const BEDSIDE_HALF = 50;

const T = -BEDSIDE;

export const bedsideTable = {
    name: 'bedside-table',
    style: 'cartoon-realiste',
    shapes: [
        // Four legs: the two behind darker, the two in front tapering to the floor.
        piece(`M -30 ${T + 30} L -26 ${T + 30} L -27 -1 L -30 -1 Z`, WOOD_DARK), piece(`M 30 ${T + 30} L 26 ${T + 30} L 27 -1 L 30 -1 Z`, WOOD_DARK),
        piece(`M -42 ${T + 31} L -35 ${T + 31} L -38 0 L -41.5 0 Z`, WOOD), piece(`M 42 ${T + 31} L 35 ${T + 31} L 38 0 L 41.5 0 Z`, WOOD),
        patch(`M -37.4 ${T + 32} L -35.8 ${T + 32} L -38.4 -0.8 L -39.6 -0.8 Z`, WOOD_DARK, 0.55), patch(`M 39.6 ${T + 32} L 41.2 ${T + 32} L 41 -0.8 L 39.8 -0.8 Z`, WOOD_DARK, 0.55),
        // The box and its drawer.
        piece(`M -44 ${T + 5} L 44 ${T + 5} L 44 ${T + 29} Q 44 ${T + 32} 41 ${T + 32} L -41 ${T + 32} Q -44 ${T + 32} -44 ${T + 29} Z`, PAINT),
        patch(`M -43.2 ${T + 5.8} L 43.2 ${T + 5.8} L 43.2 ${T + 10.5} L -43.2 ${T + 10.5} Z`, PAINT_DARK, 0.6),
        patch(`M 43.2 ${T + 10.5} L 43.2 ${T + 29} Q 43.2 ${T + 31.2} 41 ${T + 31.2} L 20 ${T + 31.2} C 34 ${T + 28} 41 ${T + 20} 43.2 ${T + 10.5} Z`, PAINT_DARK, 0.4),
        piece(`M -36 ${T + 13} L 36 ${T + 13} L 36 ${T + 27} L -36 ${T + 27} Z`, '#93c0b1', 0.55),
        patch(`M -34.6 ${T + 14.4} L 20 ${T + 14.4} L 18 ${T + 16.6} L -34.6 ${T + 16.6} Z`, '#d3ebe0', 0.8),
        { tag: 'circle', attrs: { cx: 0, cy: T + 20.5, r: 3.1, fill: '#e0b045', stroke: OUTLINE }, weight: 0.55 },
        { tag: 'circle', attrs: { cx: -1, cy: T + 19.5, r: 0.9, fill: '#fff6cf', stroke: 'none' } },
        // The top: a slab of wood that overhangs.
        piece(`M -${BEDSIDE_HALF - 2} ${T} L ${BEDSIDE_HALF - 2} ${T} Q ${BEDSIDE_HALF} ${T} ${BEDSIDE_HALF} ${T + 2.6} Q ${BEDSIDE_HALF} ${T + 5.6} ${BEDSIDE_HALF - 2} ${T + 5.6} L -${BEDSIDE_HALF - 2} ${T + 5.6} Q -${BEDSIDE_HALF} ${T + 5.6} -${BEDSIDE_HALF} ${T + 2.6} Q -${BEDSIDE_HALF} ${T} -${BEDSIDE_HALF - 2} ${T} Z`, WOOD),
        patch(`M -46 ${T + 1.1} L 30 ${T + 1.1} L 27 ${T + 2.5} L -46 ${T + 2.5} Z`, '#f3cf9c', 0.9),
        patch(`M -47 ${T + 3.9} L 47.6 ${T + 3.9} L 47 ${T + 5} L -47 ${T + 5} Z`, WOOD_DARK, 0.5),
    ],
    points: { top: [0, T] },
};
