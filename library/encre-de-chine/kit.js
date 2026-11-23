// The "ink wash" style: brush strokes in black ink that swell and thin, a few
// grey washes for volume, a lot of empty paper, and one touch of red at
// most, like a seal. Nothing is outlined all the way round.

export const INK = '#111111', RED = '#c0392b';

/**
 * One brush stroke from a to b, bowing through c: it starts thin, swells to
 * `width` in the middle and thins again.
 */
export function brush([ax, ay], [cx, cy], [bx, by], width) {
    const dx = bx - ax, dy = by - ay, length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length * width, ny = dx / length * width, n = v => v.toFixed(2);
    return `M ${n(ax)} ${n(ay)} Q ${n(cx + nx)} ${n(cy + ny)} ${n(bx)} ${n(by)} Q ${n(cx - nx)} ${n(cy - ny)} ${n(ax)} ${n(ay)} Z`;
}

export function kit(stage) {
    return {
        stroke: (into, a, c, b, width, opacity = 1) => stage.el('path', into, { d: brush(a, c, b, width), fill: INK, stroke: 'none', opacity }),
        /** A wash: diluted ink, laid flat. */
        wash: (into, d, opacity = 0.2) => stage.el('path', into, { d, fill: INK, stroke: 'none', opacity }),
        dab: (into, x, y, r, fill = INK, opacity = 1) => stage.el('circle', into, { cx: x, cy: y, r, fill, stroke: 'none', opacity }),
    };
}

// The same, for props (which are data).
export const strokeShape = (a, c, b, width, opacity = 1) => ({ tag: 'path', attrs: { d: brush(a, c, b, width), fill: INK, stroke: 'none', opacity } });
export const washShape = (d, opacity = 0.2) => ({ tag: 'path', attrs: { d, fill: INK, stroke: 'none', opacity } });
