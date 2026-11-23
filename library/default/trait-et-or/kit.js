// The "line and gold" style: a gold contour on a body filled with the paper
// colour, details in thin ink, an ink dot where two pieces meet, at most one
// solid gold shape. Three colours, no gradient, no shadow.

export const GOLD = '#b8860b', INK = '#1c1c1c', PAPER = '#fdfcf8';
/** Stroke weights, as shares of the character's line. */
export const CONTOUR = 1.6, THREAD = 1.15, DETAIL = 1, FINE = 0.7;

export function kit(stage, layer, line) {
    const round = { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    return {
        gold: (into, d, weight = CONTOUR, fill = PAPER) => stage.el('path', into, { d, fill, stroke: GOLD, 'stroke-width': line * weight, ...round }),
        ink: (into, d, weight = DETAIL) => stage.el('path', into, { d, fill: 'none', stroke: INK, 'stroke-width': line * weight, ...round }),
        dot: (into, x, y, r = 2.6, fill = INK) => stage.el('circle', into, { cx: x, cy: y, r, fill, stroke: 'none' }),
        solid: (into, d) => stage.el('path', into, { d, fill: GOLD, stroke: 'none' }),
        group: into => stage.el('g', into),
    };
}

// The same, for props (which are data).
export const goldShape = (d, weight = CONTOUR) => ({ tag: 'path', attrs: { d, stroke: GOLD, fill: PAPER }, weight });
export const inkShape = (d, weight = DETAIL) => ({ tag: 'path', attrs: { d, stroke: INK }, weight });
export const dotShape = (x, y, r = 2.6) => ({ tag: 'circle', attrs: { cx: x, cy: y, r, fill: INK, stroke: 'none' } });
