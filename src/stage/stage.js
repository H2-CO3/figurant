// The stage: one SVG laid over the whole page, in page coordinates (pixels
// from the top-left corner of the document). Because it scrolls with the page,
// a character anchored to an element stays glued to it with no per-scroll work.
//
// An "anchor" is a function returning the origin a character is positioned
// from: a point on an element, the viewport, or a fixed spot on the page.

const NS = 'http://www.w3.org/2000/svg';

/**
 * @param {object} [options]
 * @param {Document} [options.doc]
 * @param {Window} [options.win]
 * @param {Element} [options.parent] defaults to <body>
 */
export function createStage({ doc = globalThis.document, win = globalThis.window, parent } = {}) {
    const svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fig-stage');
    // Decorative: hidden from assistive technology, and never in the way of a click.
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', '1');
    svg.setAttribute('height', '1');
    svg.setAttribute('style',
        'position:absolute;top:0;left:0;overflow:visible;pointer-events:none;z-index:var(--fig-z,50)');
    (parent || doc.body).appendChild(svg);

    return {
        svg,

        /**
         * A new drawing layer (one per character or prop), above the previous
         * ones, or just under the layer given as `behind`.
         */
        layer(name, { behind } = {}) {
            const g = doc.createElementNS(NS, 'g');
            if (name) g.setAttribute('data-fig-layer', name);
            if (behind) svg.insertBefore(g, behind);
            else svg.appendChild(g);
            return g;
        },

        /** Creates an SVG element inside `into`. */
        el(tag, into, attrs) {
            const node = doc.createElementNS(NS, tag);
            if (attrs) for (const key in attrs) node.setAttribute(key, attrs[key]);
            into.appendChild(node);
            return node;
        },

        /** Anchor: a point on an element (at: 0 left edge … 1 right edge; up: 0 top … 1 bottom). */
        on(element, at = 0.5, down = 0) {
            return () => {
                const r = element.getBoundingClientRect();
                return [r.left + win.scrollX + r.width * at, r.top + win.scrollY + r.height * down];
            };
        },

        /** Anchor: the top-left corner of the viewport (for travel between sections). */
        view() {
            return () => [win.scrollX, win.scrollY];
        },

        /** Anchor: a fixed point of the page. */
        at(x, y) {
            return () => [x, y];
        },

        /** Removes the stage and everything drawn on it. */
        destroy() {
            svg.remove();
        },
    };
}
