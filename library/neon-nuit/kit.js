// The "neon at night" style: on a dark background, shapes are glowing tubes:
// a bright core with a halo of the same colour. Two or three colours per
// character; no fill. The glow is the volume.

export const CYAN = '#36e0c2', MAGENTA = '#ff4fb0', AMBER = '#ffc246', NIGHT = '#0f1220';

export function kit(stage) {
    const round = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
    return {
        /** A tube: a wide soft halo, a nearer one, the lit glass, a white-hot core. Returns the four paths. */
        tube(into, d, colour, width = 3) {
            const group = stage.el('g', into);
            for (const [w, opacity, tint] of [[width * 4.2, 0.1, colour], [width * 2.3, 0.26, colour], [width, 1, colour], [width * 0.34, 0.85, '#ffffff']]) {
                stage.el('path', group, { d, stroke: tint, 'stroke-width': w, opacity, ...round });
            }
            return group;
        },
        /** A point of light. */
        spark(into, x, y, r, colour) {
            const group = stage.el('g', into);
            stage.el('circle', group, { cx: x, cy: y, r: r * 2.6, fill: colour, opacity: 0.2 });
            stage.el('circle', group, { cx: x, cy: y, r, fill: colour });
            stage.el('circle', group, { cx: x, cy: y, r: r * 0.4, fill: '#ffffff', opacity: 0.9 });
            return group;
        },
        redraw: (tube, d) => { for (const path of tube.children) path.setAttribute('d', d); },
    };
}

// The same, for props (which are data).
export const tubeShapes = (d, colour, width = 1) => [[width * 4.2, 0.1, colour], [width * 2.3, 0.26, colour], [width, 1, colour], [width * 0.34, 0.85, '#ffffff']]
    .map(([weight, opacity, tint]) => ({ tag: 'path', attrs: { d, stroke: tint, opacity }, weight }));
