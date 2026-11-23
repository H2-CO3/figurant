// A head that is an emoji: a glyph on a stick body. The face may change with
// what the character feels (eyes shut, surprise, doubt), by swapping the
// glyph. The glyph is drawn by the visitor's own system font: it will not look
// the same on every device, and it does not follow the page's colours.

/**
 * @param {object} spec
 * @param {string} spec.face  the emoji at rest
 * @param {{ blink?: string, wide?: string, squint?: string }} [spec.faces]
 *        other glyphs: `blink` while the eyes are shut, `wide` when surprised,
 *        `squint` when it narrows its eyes
 * @param {string} [spec.image] address of a picture shown instead of the glyph (it
 *        has one face only: `faces` is then ignored)
 * @param {number} [spec.size] height of the glyph, in character units
 * @param {boolean} [spec.spine] draw a body line under the head (default true)
 */
export function emojiHead(spec) {
    if (!spec || !((typeof spec.face === 'string' && spec.face) || spec.image)) throw new Error('emojiHead needs a face: emojiHead({ face: "🙂" }), or an image.');
    const size = spec.size ?? 36;
    const faces = spec.faces ?? {};
    const spine = spec.spine !== false;
    // The glyph sits where the reference stick figure has its head.
    const centre = -35, neck = centre + size * 0.42, hip = 22;
    const frame = {
        hips: [[0, hip], [0, hip]], shoulders: [[0, neck + 8], [0, neck + 8]], hipY: hip,
        top: [0, centre - size * 0.5], soft: 0.6,
    };

    return {
        create({ stage, layer, line }) {
            const group = stage.el('g', layer);
            if (spine) {
                stage.el('line', group, {
                    x1: 0, y1: neck, x2: 0, y2: hip, fill: 'none',
                    stroke: 'var(--fig-ink, currentColor)', 'stroke-width': line, 'stroke-linecap': 'round',
                });
            }
            const picture = !!spec.image;
            const glyph = picture
                ? stage.el('image', group, { href: spec.image, x: -size / 2, y: centre - size / 2, width: size, height: size, preserveAspectRatio: 'xMidYMid meet' })
                : stage.el('text', group, {
                    x: 0, y: centre, 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'central',
                    'font-family': '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                });
            let shown = null;

            return {
                state: { lid: 1, wide: 0, squint: 0, gazeX: 0, gazeY: 0 },
                frame: () => frame,
                draw({ state: s, matrix }) {
                    group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                    const face = (s.lid < 0.4 && faces.blink) || (s.wide > 0.5 && faces.wide) || (s.squint > 0.5 && faces.squint) || spec.face;
                    if (!picture && face !== shown) { glyph.textContent = face; shown = face; }
                    // It cannot move its eyes: the whole face leans a little towards what it looks at.
                    glyph.setAttribute('transform', `translate(${(s.gazeX * 1.6).toFixed(2)} ${(s.gazeY * 1.2).toFixed(2)})`);
                },
            };
        },
    };
}
