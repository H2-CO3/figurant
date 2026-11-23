// The teapot's study: what it sits on and writes in. Made to its size and in
// the same "realistic cartoon" style: flat colours with a patch of shade and
// a patch of light, a dark outline. Units are the teapot's; furniture has
// its origin on the floor.
//
// Sizes are a teapot's world: it is 150 units wide and 110 tall, so its seat
// is wider than it is, its table comes up to its hand, and its divan is long
// enough for a visitor of its own size.

const OUTLINE = '#4a3b2e', WOOD = '#8a5a34', GOLD = '#e3b24c';

/** A coloured piece with a dark outline. */
const piece = (d, fill, weight = 0.9) => ({ tag: 'path', attrs: { d, fill, stroke: OUTLINE }, weight });
/** A patch of shade or light, with no outline. */
const patch = (d, fill, opacity = 1) => ({ tag: 'path', attrs: { d, fill, stroke: 'none', opacity } });
const line = (d, color = OUTLINE, weight = 0.9) => ({ tag: 'path', attrs: { d, stroke: color }, weight });

/** How high the teapot's base is when it sits (its `shin`). */
export const SEAT = 21;

/** A wide, low pouffe: broader than the teapot, which would hide a chair. Origin: the floor, under its middle. */
export const pouffe = {
    name: 'pouffe',
    style: 'default',
    shapes: [
        piece('M -72 -4 L -75 0 L -67 0 L -66 -4 Z', WOOD), piece('M 72 -4 L 75 0 L 67 0 L 66 -4 Z', WOOD),
        piece(`M -86 -3 L -86 ${-SEAT + 9} Q -86 ${-SEAT + 1} -78 ${-SEAT + 1} L 78 ${-SEAT + 1} Q 86 ${-SEAT + 1} 86 ${-SEAT + 9} L 86 -3 Z`, '#b5475a'),
        patch(`M -85 -3.6 L -85 ${-SEAT + 12} L 85 ${-SEAT + 12} L 85 -3.6 Z`, '#8f3345', 0.55),
        patch(`M -76 ${-SEAT + 3.4} L 30 ${-SEAT + 3.4} L 26 ${-SEAT + 6} L -78 ${-SEAT + 6} Z`, '#e88a9a', 0.7),
        line(`M -86 ${-SEAT + 11} L 86 ${-SEAT + 11}`, GOLD, 0.9),
    ],
    points: { seat: [0, -SEAT] },
};

/** How high the table top is: where a seated teapot's hand comes down. */
export const DESK = 34;

/** A side table with an open notebook on it. Origin: the floor, under its leg. */
export const desk = {
    name: 'desk',
    style: 'default',
    shapes: [
        piece(`M -3 ${-DESK + 4} L -3 -2 L -17 -2 L -17 1 L 17 1 L 17 -2 L 3 -2 L 3 ${-DESK + 4} Z`, WOOD),
        piece(`M -31 ${-DESK} L 31 ${-DESK} L 31 ${-DESK + 5} L -31 ${-DESK + 5} Z`, '#c08a55'),
        patch(`M -30 ${-DESK + 0.8} L 30 ${-DESK + 0.8} L 30 ${-DESK + 2.2} L -30 ${-DESK + 2.2} Z`, '#e6b983', 0.9),
        // The notebook, open: it writes on the near page; the far one is already full.
        piece(`M -21 ${-DESK - 1} L -20 ${-DESK - 15} L 0 ${-DESK - 12} L 20 ${-DESK - 15} L 21 ${-DESK - 1} Z`, '#fffdf6', 0.8),
        patch(`M 0 ${-DESK - 12} L 3.5 ${-DESK - 12.6} L 3.5 ${-DESK - 1} L 0 ${-DESK - 1} Z`, '#d9d2c0', 0.7),
        line(`M 0 ${-DESK - 12} L 0 ${-DESK - 1}`, OUTLINE, 0.6),
        line(`M 5 ${-DESK - 10.5} L 17 ${-DESK - 12.2} M 5 ${-DESK - 7.5} L 17 ${-DESK - 9.2} M 5 ${-DESK - 4.5} L 13 ${-DESK - 5.6}`, '#7d8a99', 0.5),
    ],
    points: { page: [-17, -DESK - 12] },
};

/** One written line on the near page; several are stacked as it writes. Origin: where the line starts. */
export const written = length => ({
    name: 'written',
    shapes: [line(`M 0 0 L ${length} ${(length * 0.14).toFixed(1)}`, '#2f5f9e', 0.5)],
    points: {},
});

/** Its pen. Origin: where it is held; the tip writes. */
export const quill = {
    name: 'quill',
    style: 'default',
    shapes: [line('M 0 -17 L 0 3', '#26323f', 1.5), line('M 0 3 L 0 5.5', GOLD, 1), line('M 0 -17 L 0 -13', GOLD, 1.5)],
    points: { grip: [0, 0], tip: [0, 5] },
};

/** The divan where whoever it listens to would sit: long enough for a visitor of its size. Origin: the floor, under its middle. */
export const divan = {
    name: 'divan',
    style: 'default',
    shapes: [
        piece('M -108 -4 L -110 0 L -102 0 L -102 -4 Z', WOOD), piece('M 108 -4 L 110 0 L 102 0 L 102 -4 Z', WOOD),
        piece('M -105 -4 L -105 -70 Q -105 -82 -93 -82 L 93 -82 Q 105 -82 105 -70 L 105 -4 Z', '#3f8f8a'),
        patch('M -98 -76 Q -98 -79 -92 -79 L 60 -79 L 52 -73 L -98 -73 Z', '#7cc4bd', 0.6),
        piece(`M -118 -4 L -118 -46 Q -118 -56 -108 -56 Q -98 -56 -98 -46 L -98 ${-SEAT - 3} L 98 ${-SEAT - 3} L 98 -46 Q 98 -56 108 -56 Q 118 -56 118 -46 L 118 -4 Z`, '#4aa39c'),
        patch(`M -117 -4.6 L -117 -14 L 117 -14 L 117 -4.6 Z`, '#2f6f6b', 0.55),
        patch(`M -96 ${-SEAT - 1.6} L 60 ${-SEAT - 1.6} L 54 ${-SEAT + 1.6} L -96 ${-SEAT + 1.6} Z`, '#8fd6ce', 0.6),
        line(`M 0 ${-SEAT - 3} L 0 -14`, '#2f6f6b', 0.7),
    ],
    points: { seat: [0, -SEAT - 3] },
};
