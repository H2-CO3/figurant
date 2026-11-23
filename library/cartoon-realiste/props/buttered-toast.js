// What the toaster makes: a slice of toast, golden, with a pat of butter
// melting on it. Same "cartoon réaliste" look and scale as the slices that
// stand in the toaster's slots (characters/toaster.js), so one can fly out of
// them. Flat colours, a patch of light, a patch of shade, a dark crust.
// Origin: the middle of its bottom edge, where a hand holds it.

const CRUST = '#6b3d16';
const piece = (d, fill, weight = 0.7, stroke = CRUST) => ({ tag: 'path', attrs: { d, fill, stroke }, weight });
const patch = (d, fill, opacity = 1) => ({ tag: 'path', attrs: { d, fill, stroke: 'none', opacity } });
const dot = (cx, cy, r, fill, opacity = 1) => ({ tag: 'circle', attrs: { cx, cy, r, fill, stroke: 'none', opacity } });

/** How tall the slice is. */
export const SLICE = 37;

export const butteredToast = {
    name: 'buttered-toast',
    style: 'cartoon-realiste',
    shapes: [
        piece('M -15 0 L -15 -22 C -20 -25 -19 -34 -11 -34 C -6 -37 6 -37 11 -34 C 19 -34 20 -25 15 -22 L 15 0 Z', '#a8672a'),
        patch('M -11.6 -2.6 L -11.6 -20.4 C -15.4 -23.4 -14.6 -30.2 -9 -30.6 C -5 -33 5 -33 9 -30.6 C 14.6 -30.2 15.4 -23.4 11.6 -20.4 L 11.6 -2.6 Z', '#e9b566'),
        patch('M 11.6 -2.6 L 11.6 -20.4 C 15 -23 14.8 -29.6 9.6 -30.5 C 12 -27 11 -22 8.4 -20 L 8.4 -2.6 Z', '#b9722c', 0.5),
        patch('M -10 -22 C -13 -25 -12 -29 -8 -29.4 C -4 -31.4 0 -31.6 3 -31 C -3 -30 -8 -27 -10 -22 Z', '#fff3d2', 0.75),
        dot(6, -25.5, 1.1, '#b9722c', 0.6), dot(-8, -15, 1, '#b9722c', 0.6), dot(7.5, -8, 1.1, '#b9722c', 0.6), dot(-6.5, -6.5, 0.9, '#b9722c', 0.6),
        // The butter: a melted pool, then the pat on it, lit from the upper left.
        patch('M -8.5 -12.5 C -10 -17.5 -5 -19.6 0 -19 C 5 -20.4 9.6 -17 8.4 -12.6 C 9.4 -9 5 -7.6 1 -8.6 C -3 -7.4 -8 -8.6 -8.5 -12.5 Z', '#ffe58a', 0.9),
        piece('M -5 -17.4 L 4.4 -18 L 5.2 -11.6 L -4.2 -10.8 Z', '#ffd43b', 0.55, '#a8760f'),
        patch('M -4 -16.5 L 0.6 -16.8 L 0.9 -14.6 L -3.7 -14.2 Z', '#fff6c9', 0.9),
        patch('M 2.6 -12 L 5.1 -12.3 L 4.5 -17.2 L 2.2 -17 Z', '#d9a514', 0.55),
    ],
    points: { grip: [0, 0], top: [0, -SLICE], middle: [0, -18] },
};
