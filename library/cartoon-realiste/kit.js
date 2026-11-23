// A small kit for characters drawn with colour and volume (the "realistic
// cartoon" style of this library): gradients, soft shadows, highlights, and
// eyes with a white, an iris and a glint. Nothing here is required by the
// engine: a character is free to draw itself any other way.

let serial = 0;
const f = n => (+n).toFixed(2);

/**
 * Drawing helpers bound to one character's layer.
 * @param {object} stage from the head's create({ stage, layer })
 * @param {Element} layer
 */
export function kit(stage, layer) {
    const defs = stage.el('defs', layer);
    // Each character on a page needs gradient names of its own.
    const uid = `fig${Math.random().toString(36).slice(2, 8)}${(serial++).toString(36)}`;
    let count = 0;
    const gradient = (tag, attrs, stops) => {
        const id = `${uid}-${count++}`;
        const node = stage.el(tag, defs, { id, ...attrs });
        for (const [offset, color, opacity] of stops) stage.el('stop', node, { offset, 'stop-color': color, ...(opacity === undefined ? {} : { 'stop-opacity': opacity }) });
        return `url(#${id})`;
    };
    const round = { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

    return {
        /** A gradient across (x1,y1)-(x2,y2), as fractions of the shape's box. stops: [[offset, colour, opacity?]]. */
        linear: (stops, [x1, y1, x2, y2] = [0, 0, 1, 0]) => gradient('linearGradient', { x1, y1, x2, y2 }, stops),
        /** A gradient from a centre outwards: light from the upper left by default. */
        radial: (stops, [cx, cy, r] = [0.35, 0.3, 0.8]) => gradient('radialGradient', { cx, cy, r }, stops),
        /** A filled, outlined shape. */
        shape: (into, d, fill, outline, width, more = {}) => stage.el('path', into, { d, fill, stroke: outline, 'stroke-width': width, ...round, ...more }),
        /** A line. */
        line: (into, d, color, width, more = {}) => stage.el('path', into, { d, fill: 'none', stroke: color, 'stroke-width': width, ...round, ...more }),
        /** A soft patch with no outline: a shadow, a blush, a reflection. */
        patch: (into, tag, attrs, fill, opacity = 1) => stage.el(tag, into, { ...attrs, fill, stroke: 'none', opacity }),
        group: into => stage.el('g', into),

        /**
         * An eye: a white, an iris, a pupil, a glint. Returns update(state),
         * which makes it look (gazeX, gazeY), blink (lid), widen (wide), narrow (squint).
         */
        eye(into, [x, y], { r = 6, iris = '#5b3a1e', outline = '#2a2018', travel = 0.42 } = {}) {
            const white = stage.el('ellipse', into, { fill: '#ffffff', stroke: outline, 'stroke-width': r * 0.22 });
            const ring = stage.el('ellipse', into, { fill: iris, stroke: 'none' });
            const pupil = stage.el('ellipse', into, { fill: '#17120e', stroke: 'none' });
            const glint = stage.el('circle', into, { fill: '#ffffff', stroke: 'none' });
            return s => {
                const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
                const open = Math.max(0.08, clamp(s.lid ?? 1, 0, 1) * (1 - 0.45 * clamp(s.squint ?? 0, 0, 1)));
                const big = 1 + 0.18 * clamp(s.wide ?? 0, 0, 1);
                const ry = r * big * open, rx = r * big * 0.86;
                const cx = x + (s.gazeX ?? 0) * r * travel, cy = y + (s.gazeY ?? 0) * r * travel * 0.8;
                const k = clamp(s.pupil ?? 1, 0.6, 1.4);
                white.setAttribute('cx', f(x)); white.setAttribute('cy', f(y)); white.setAttribute('rx', f(rx)); white.setAttribute('ry', f(ry));
                ring.setAttribute('cx', f(cx)); ring.setAttribute('cy', f(cy)); ring.setAttribute('rx', f(r * 0.56)); ring.setAttribute('ry', f(Math.min(r * 0.56, ry * 0.92)));
                pupil.setAttribute('cx', f(cx)); pupil.setAttribute('cy', f(cy)); pupil.setAttribute('rx', f(r * 0.3 * k)); pupil.setAttribute('ry', f(Math.min(r * 0.3 * k, ry * 0.8)));
                glint.setAttribute('cx', f(cx - r * 0.2)); glint.setAttribute('cy', f(cy - Math.min(r * 0.22, ry * 0.5))); glint.setAttribute('r', f(r * 0.14 * Math.min(1, open * 1.6)));
            };
        },
    };
}
