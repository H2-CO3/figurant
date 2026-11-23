// The whiteboard: what a person draws in the work zone, kept as strokes, and
// turned into a picture (SVG) that a character can wear for a head or that an
// assistant can start from. Pure: no page here, so that it can be tested.

/** The sheet, in its own units: every drawing is made on the same one. */
export const SHEET = { width: 900, height: 520 };
const f = n => (Math.round(n * 10) / 10).toString();
const COLOUR = /^#[0-9a-f]{6}$/i;

/**
 * A stroke as a shape: the line the pen followed, as wide at each point as the
 * pen pressed there. A mouse presses evenly; a stylus does not.
 * @param {{ x: number, y: number, p?: number }[]} points
 * @param {number} size the pen's width at full pressure
 * @returns {string} the path's `d`
 */
export function outline(points, size) {
    const half = point => Math.max(0.6, size * (0.35 + 0.65 * (point.p ?? 0.5)) / 2);
    if (!points.length) return '';
    if (points.length === 1) { const r = half(points[0]), { x, y } = points[0]; return `M ${f(x - r)} ${f(y)} a ${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a ${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`; }
    const left = [], right = [];
    points.forEach((point, i) => {
        const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
        let dx = after.x - before.x, dy = after.y - before.y;
        const length = Math.hypot(dx, dy) || 1; dx /= length; dy /= length;
        const r = half(point);
        left.push([point.x - dy * r, point.y + dx * r]); right.push([point.x + dy * r, point.y - dx * r]);
    });
    const first = half(points[0]), last = half(points.at(-1));
    const run = list => list.map(([x, y]) => `L ${f(x)} ${f(y)}`).join(' ');
    return `M ${f(left[0][0])} ${f(left[0][1])} ${run(left.slice(1))} A ${f(last)} ${f(last)} 0 0 0 ${f(right.at(-1)[0])} ${f(right.at(-1)[1])} ${run(right.slice(0, -1).reverse())} A ${f(first)} ${f(first)} 0 0 0 ${f(left[0][0])} ${f(left[0][1])} Z`;
}

/** A pen that shakes less: each point leans on its neighbours. Ends stay where they are. */
export function smooth(points) {
    if (points.length < 3) return points;
    return points.map((point, i) => i === 0 || i === points.length - 1 ? point
        : { ...point, x: (points[i - 1].x + 2 * point.x + points[i + 1].x) / 4, y: (points[i - 1].y + 2 * point.y + points[i + 1].y) / 4 });
}

/** Strokes as they are kept: known fields, sane numbers, real colours. Anything else is dropped. */
export function tidy(strokes) {
    if (!Array.isArray(strokes)) return [];
    return strokes.slice(0, 2000).map(stroke => ({
        colour: COLOUR.test(stroke?.colour) ? stroke.colour.toLowerCase() : '#16181d',
        size: Math.min(60, Math.max(1, Number(stroke?.size) || 6)),
        points: (Array.isArray(stroke?.points) ? stroke.points : []).slice(0, 5000)
            .filter(point => Number.isFinite(point?.x) && Number.isFinite(point?.y))
            .map(point => ({ x: point.x, y: point.y, p: Math.min(1, Math.max(0, Number.isFinite(point.p) ? point.p : 0.5)) })),
    })).filter(stroke => stroke.points.length);
}

/** The square that holds every stroke, with a little air; null for an empty sheet. */
export function bounds(strokes) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const stroke of strokes) for (const point of stroke.points) {
        const r = stroke.size / 2;
        left = Math.min(left, point.x - r); right = Math.max(right, point.x + r); top = Math.min(top, point.y - r); bottom = Math.max(bottom, point.y + r);
    }
    if (left === Infinity) return null;
    const side = Math.max(right - left, bottom - top) + 12;
    return { x: (left + right) / 2 - side / 2, y: (top + bottom) / 2 - side / 2, side };
}

/** The drawing as a standalone picture, cropped to what was drawn. Nothing in it but shapes. */
export function toSvg(strokes) {
    const clean = tidy(strokes), box = bounds(clean);
    if (!box) return null;
    const paths = clean.map(stroke => `<path fill="${stroke.colour}" d="${outline(stroke.points, stroke.size)}"/>`).join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(box.x)} ${f(box.y)} ${f(box.side)} ${f(box.side)}">\n${paths}\n</svg>\n`;
}
