// A head described entirely as data: a few SVG shapes, where the limbs attach,
// and optionally two eyes that look around and blink. Enough for most simple
// characters; a richer head implements the same three members by hand.
//
// The head contract:
//   create({ stage, layer, line }) -> {
//     state,        // numbers this head adds to the figure's state
//     frame(state)  // -> { hips: [L, R], shoulders: [L, R], hipY, top, soft? }
//                   //    attachment points in head-local units (y down)
//     draw(ctx)     // ctx: { state, P, matrix, k, unit, drag, dt, line, ground, body }
//                   //   ground = ordinate of the floor under it, page pixels; body = its proportions
//                   //   P(x, y) maps head-local units to page pixels; k = pixels
//                   //   per unit now; drag = secondary-motion offset, in units
//   }

/**
 * @param {object} spec
 * @param {Array<{ tag: string, attrs: object, fill?: boolean }>} spec.shapes
 *        drawn in order, in head-local units. Stroked with the ink colour;
 *        `fill: true` also fills them with the paper colour.
 * @param {[[number, number], [number, number]]} spec.hips       left, right
 * @param {[[number, number], [number, number]]} spec.shoulders  left, right
 * @param {[number, number]} spec.top   where a thread would be tied
 * @param {{ at: Array<[number, number]>, r: number, travel?: number }} [spec.eyes]
 */
export function shapeHead(spec) {
    return {
        create({ stage, layer, line }) {
            const group = stage.el('g', layer);
            for (const shape of spec.shapes) {
                stage.el(shape.tag, group, {
                    fill: shape.fill ? 'var(--fig-paper, #fff)' : 'none',
                    stroke: 'var(--fig-ink, currentColor)',
                    'stroke-width': line,
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                    ...shape.attrs,
                });
            }
            const eyes = (spec.eyes?.at ?? []).map(() =>
                stage.el('ellipse', group, { fill: 'var(--fig-ink, currentColor)' }));

            const hipY = Math.max(spec.hips[0][1], spec.hips[1][1]);
            const frame = { hips: spec.hips, shoulders: spec.shoulders, hipY, top: spec.top };

            return {
                state: {
                    gazeX: 0, gazeY: 0, // where it looks, -1..1
                    lid: 1,             // 1 eyes open -> 0 shut (blink)
                },
                frame: () => frame,
                draw({ state, matrix }) {
                    group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                    if (!spec.eyes) return;
                    const travel = spec.eyes.travel ?? spec.eyes.r;
                    eyes.forEach((eye, i) => {
                        const [x, y] = spec.eyes.at[i];
                        eye.setAttribute('cx', (x + state.gazeX * travel).toFixed(2));
                        eye.setAttribute('cy', (y + state.gazeY * travel * 0.7).toFixed(2));
                        eye.setAttribute('rx', spec.eyes.r);
                        eye.setAttribute('ry', (spec.eyes.r * Math.max(0.12, state.lid)).toFixed(2));
                    });
                },
            };
        },
    };
}
