// The "cut paper" style: flat shapes with no outline, as if cut from coloured
// paper and layered. Each layer casts a small soft shadow on the one below.
// One warm palette for the whole style.

export const CORAL = '#e8715a', MUSTARD = '#f2b84b', TEAL = '#3d8f86', NAVY = '#2f3a56', SAND = '#f1dcc0', WHITE = '#fffaf3', SKY = '#a9d3d8';
const SHADOW = '#2f3a56';

export function kit(stage) {
    return {
        /** A piece of paper: its shadow first, a little down and to the right, then the piece. */
        piece(into, d, fill, lift = 1.6) {
            stage.el('path', into, { d, fill: SHADOW, stroke: 'none', opacity: 0.2, transform: `translate(${lift} ${lift * 1.3})` });
            return stage.el('path', into, { d, fill, stroke: 'none' });
        },
        dot: (into, x, y, r, fill) => stage.el('circle', into, { cx: x, cy: y, r, fill, stroke: 'none' }),
        group: into => stage.el('g', into),
    };
}

// The same, for props (which are data).
export const paper = (d, fill, lift = 1.6) => [
    { tag: 'path', attrs: { d, fill: SHADOW, stroke: 'none', opacity: 0.2, transform: `translate(${lift} ${lift * 1.3})` } },
    { tag: 'path', attrs: { d, fill, stroke: 'none' } },
];
