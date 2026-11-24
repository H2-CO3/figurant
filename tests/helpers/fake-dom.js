// The smallest stand-in for a browser document that the renderer needs: enough
// to create SVG nodes and read back the attributes that were set on them.

export function fakeDocument() {
    const node = tag => ({
        tag,
        attrs: {},
        children: [],
        parent: null,
        setAttribute(key, value) { this.attrs[key] = String(value); },
        getAttribute(key) { return this.attrs[key] ?? null; },
        removeAttribute(key) { delete this.attrs[key]; },
        // (As in a browser: a node has one parent; put elsewhere, it leaves where it was.)
        get parentNode() { return this.parent; },
        appendChild(child) { child.remove(); child.parent = this; this.children.push(child); return child; },
        insertBefore(child, reference) {
            child.remove();
            child.parent = this;
            const i = this.children.indexOf(reference);
            this.children.splice(i < 0 ? this.children.length : i, 0, child);
            return child;
        },
        remove() {
            if (!this.parent) return;
            this.parent.children = this.parent.children.filter(c => c !== this);
            this.parent = null;
        },
    });
    const doc = { createElementNS: (_, tag) => node(tag), body: node('body') };
    const win = { scrollX: 0, scrollY: 0 };
    return { doc, win };
}

/** The numbers of an SVG path made of M/L commands, as [x, y] pairs. */
export function pathPoints(d) {
    const numbers = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    const points = [];
    for (let i = 0; i + 1 < numbers.length; i += 2) points.push([numbers[i], numbers[i + 1]]);
    return points;
}

/**
 * A page with a size, a scroll position, and elements that have a place on it.
 * @param {object} options
 * @param {number} [options.width]
 * @param {number} [options.height] of the viewport
 * @param {Array<{ attrs: object, rect: { x, y, w, h } }>} options.elements
 * @param {object} [options.media] { '(hover: none)': true, ... }
 */
export function fakePage({ width = 1000, height = 800, elements = [], media = {} }) {
    const { doc } = fakeDocument();
    const emitter = () => {
        const handlers = new Map();
        return {
            addEventListener(type, fn) {
                if (!handlers.has(type)) handlers.set(type, new Set());
                handlers.get(type).add(fn);
            },
            removeEventListener(type, fn) { handlers.get(type)?.delete(fn); },
            dispatch(type, event = {}) { for (const fn of [...(handlers.get(type) || [])]) fn(event); },
            listenerCount() { let n = 0; for (const set of handlers.values()) n += set.size; return n; },
        };
    };
    const win = {
        scrollX: 0, scrollY: 0, innerWidth: width, innerHeight: height,
        matchMedia: query => ({ matches: !!media[query] }),
        ...emitter(),
    };
    const nodes = elements.map(({ attrs, rect }) => ({
        tagName: 'DIV', rect,
        getAttributeNames: () => Object.keys(attrs),
        getAttribute: name => attrs[name],
        getBoundingClientRect() {
            const left = this.rect.x - win.scrollX, top = this.rect.y - win.scrollY;
            return { left, top, width: this.rect.w, height: this.rect.h, right: left + this.rect.w, bottom: top + this.rect.h };
        },
        ...emitter(),
    }));
    doc.documentElement = { clientWidth: width };
    doc.querySelectorAll = () => nodes;
    return {
        doc, win, nodes,
        scrollTo(y) { win.scrollY = y; win.dispatch('scroll'); },
        pointer(x, y, type = 'pointermove') { win.dispatch(type, { clientX: x, clientY: y, pointerType: 'mouse' }); },
    };
}
