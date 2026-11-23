// A chaise longue, seen from the side: a wooden frame, a striped cushion, the
// backrest raised. In the library's "realistic cartoon" style: flat colours
// with a patch of shade and one of light, a dark outline. Sized for the stick
// figure; whoever lies on it faces right, head on the raised end.
// Origin: the floor, under the front of the backrest.

const OUTLINE = '#4a3b2e', WOOD = '#b07a45', DARK = '#8a5a34', CLOTH = '#f6f0e3', STRIPE = '#e2705a';

const piece = (d, fill, weight = 0.8) => ({ tag: 'path', attrs: { d, fill, stroke: OUTLINE }, weight });
const patch = (d, fill, opacity = 1) => ({ tag: 'path', attrs: { d, fill, stroke: 'none', opacity } });

export const lounger = {
    name: 'lounger',
    style: 'default',
    shapes: [
        // The far legs and the strut that holds the backrest, a little darker.
        piece('M -36 -37 L -32 -39 L -25 0 L -29 0 Z', DARK),
        piece('M 46 -13 L 50 -13 L 53 0 L 49 0 Z', DARK),
        piece('M -2 -13 L 2 -13 L 0 0 L -4 0 Z', DARK),
        // The frame: the bed, then the backrest hinged on it.
        piece('M -9 -17 L 62 -17 Q 64 -15 62 -13 L -9 -13 Z', WOOD),
        piece('M -10 -15 L -49 -47 L -46 -51 L -5 -19 Z', WOOD),
        patch('M -7 -16.4 L 61 -16.4 L 61 -15.4 L -7 -15.4 Z', '#d9a66d', 0.9),
        // The cushion, in two parts, with its stripes.
        piece('M -10 -25 L 57 -25 Q 62 -25 62 -21 L 62 -17 L -6 -17 Z', CLOTH),
        piece('M -6 -17 L -10 -25 L -52 -58 Q -57 -59 -57 -54 L -49 -47 Z', CLOTH),
        ...[4, 18, 32, 46].map(x => patch(`M ${x} -25 L ${x + 6} -25 L ${x + 6} -17 L ${x} -17 Z`, STRIPE)),
        ...[0.2, 0.48, 0.76].map(t => {
            const ax = -10 - 42 * t, ay = -25 - 33 * t, bx = -6 - 43 * t, by = -17 - 30 * t;
            return patch(`M ${ax} ${ay} L ${ax - 5.2} ${ay - 4.1} L ${bx - 5.4} ${by - 3.8} L ${bx} ${by} Z`, STRIPE);
        }),
        patch('M -8 -18.6 L 61 -18.6 L 61 -17.4 L -6.6 -17.4 Z', '#8c7f6a', 0.35),
        patch('M -6 -24 L 50 -24 L 48 -22.6 L -5.4 -22.6 Z', '#ffffff', 0.7),
        // Outlines again over the stripes, so that the cushion keeps its edge.
        { tag: 'path', attrs: { d: 'M -10 -25 L 57 -25 Q 62 -25 62 -21 L 62 -17 L -6 -17 Z M -6 -17 L -10 -25 L -52 -58 Q -57 -59 -57 -54 L -49 -47 Z', stroke: OUTLINE }, weight: 0.8 },
    ],
    points: { seat: [22, -25], head: [-42, -50], foot: [58, -25] },
};
