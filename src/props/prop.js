// A prop: an object drawn in the same line style as the characters, described
// as data. Besides its shapes, a prop names the points that matter to whoever
// uses it: where a hand holds it, where one sits on it, where a pen writes.
//
// A prop description:
//   {
//     name: 'chair',
//     shapes: [{ tag, attrs, fill?, weight?, accent? }], // in character units, y down;
//                                        // weight: stroke as a share of the line
//                                        // fill: filled with the paper colour
//                                        // accent: stroked in the accent colour
//              { tag: 'text', text, attrs }     // a word, filled with the ink
//     points: { seat: [x, y], ... },     // named points, same units
//   }
// The origin (0, 0) is the prop's reference point: the spot on the floor for
// furniture, the grip for something held.

const RAD = Math.PI / 180;

/**
 * @param {object} options
 * @param {object} options.stage
 * @param {object} options.prop   a prop description
 * @param {number} [options.unit] pixels per character unit at scale 1
 * @param {number} [options.line] stroke width, in the prop's own units
 * @param {number} [options.width] stroke width on screen, in pixels: when
 *        given it wins over `line` and holds whatever the prop's scale
 * @param {number} [options.scale] its size, like a figure's scale
 * @param {Element} [options.behind] draw it just under this layer
 */
export function createProp({ stage, prop, unit = 1, line = 3, width = null, scale = 1, behind }) {
    const layer = stage.layer(prop.name, { behind });
    // Out of sight until it has been placed once: a prop must never flash at the page's origin.
    layer.setAttribute('visibility', 'hidden');
    const shapes = prop.shapes.map(shape => {
        if (shape.text === undefined) return outline(shape);
        // A word is filled, not outlined; it fades in as the prop is drawn.
        const node = stage.el(shape.tag, layer, { fill: 'var(--fig-ink, currentColor)', stroke: 'none', ...shape.attrs });
        node.textContent = shape.text;
        return node;
    });
    function outline(shape) { return stage.el(shape.tag, layer, {
        fill: shape.fill ? 'var(--fig-paper, #fff)' : 'none',
        stroke: shape.accent ? 'var(--fig-accent, currentColor)' : 'var(--fig-ink, currentColor)',
        // A shape may be lighter or heavier than the line, never free of it.
        'stroke-width': line * (shape.weight ?? 1),
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        // Lets every shape be "drawn in" from 0 to 1, whatever its real length.
        pathLength: 1,
        'stroke-dasharray': 1,
        ...shape.attrs,
    }); }

    const state = {
        x: 0, y: 0,     // position relative to the anchor, in pixels
        scale,
        tilt: 0,        // degrees, clockwise
        flip: 1,        // -1 mirrors it left-right
        draw: 1,        // 0 nothing drawn yet -> 1 fully drawn
    };
    let origin = [0, 0];
    let strokedAt = null; // the scale the strokes were last sized for

    const instance = {
        name: prop.name,
        layer,
        state,
        get k() { return state.scale * unit; },

        /** Draws the prop. `at` is the anchor origin, in page pixels. */
        render(at) {
            origin = at;
            const k = state.scale * unit;
            if (width !== null && k !== strokedAt && k > 1e-6) {
                // Keep the line constant on screen: undo the layer's scale.
                strokedAt = k;
                prop.shapes.forEach((shape, i) => {
                    if (shape.attrs?.['stroke-width'] === undefined && shape.text === undefined) shapes[i].setAttribute('stroke-width', ((width / k) * (shape.weight ?? 1)).toFixed(3));
                });
            }
            const cos = Math.cos(state.tilt * RAD), sin = Math.sin(state.tilt * RAD);
            const m = [k * cos * state.flip, k * sin * state.flip, -k * sin, k * cos, at[0] + state.x, at[1] + state.y];
            layer.setAttribute('transform', `matrix(${m.map(n => n.toFixed(4)).join(' ')})`);
            const draw = Math.max(0, Math.min(1, state.draw));
            const offset = (1 - draw).toFixed(3);
            for (const node of shapes) {
                node.setAttribute('stroke-dashoffset', offset);
                node.setAttribute('fill-opacity', draw.toFixed(2));
            }
            layer.setAttribute('visibility', draw > 0.001 ? 'visible' : 'hidden');
        },

        /** Where one of the prop's named points is right now, in page pixels. */
        point(name) {
            const p = prop.points?.[name];
            if (!p) throw new Error(`Prop "${prop.name}" has no point named "${name}". It has: ${Object.keys(prop.points || {}).join(', ') || 'none'}.`);
            const k = state.scale * unit;
            const cos = Math.cos(state.tilt * RAD), sin = Math.sin(state.tilt * RAD);
            const x = p[0] * state.flip, y = p[1];
            return [origin[0] + state.x + k * (x * cos - y * sin), origin[1] + state.y + k * (x * sin + y * cos)];
        },

        /**
         * Moves the prop so that one of its named points sits exactly on a page
         * position (used to put a prop in a hand).
         */
        place(name, [px, py], at = origin) {
            const p = prop.points?.[name] ?? [0, 0];
            const k = state.scale * unit;
            const cos = Math.cos(state.tilt * RAD), sin = Math.sin(state.tilt * RAD);
            const x = p[0] * state.flip, y = p[1];
            state.x = px - at[0] - k * (x * cos - y * sin);
            state.y = py - at[1] - k * (x * sin + y * cos);
        },

        destroy() { layer.remove(); },
    };

    return instance;
}
