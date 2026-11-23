// Checks on a prop description, reported like every other mistake: with its
// fix, never thrown.

/** @returns {Array<{ prop, field, value, message, fix }>} empty when it is sound */
export function checkProp(name, prop) {
    const problems = [];
    const report = (field, value, message, fix) => problems.push({ prop: name, field, value, message, fix });
    if (!prop || typeof prop !== 'object') {
        report('', prop, 'is not an object.', 'A prop is { name, shapes: [{ tag, attrs }], points: { grip: [x, y] } }.');
        return problems;
    }
    const layers = Array.isArray(prop.layers) ? prop.layers : [prop];
    layers.forEach((layer, i) => {
        const at = prop.layers ? `layers[${i}].` : '';
        if (typeof layer?.name !== 'string' || !layer.name) report(`${at}name`, layer?.name, 'has no name.', 'Give it a name: it names its drawing layer.');
        if (!Array.isArray(layer?.shapes)) {
            report(`${at}shapes`, layer?.shapes, 'has no list of shapes.', 'Write shapes: [{ tag: "path", attrs: { d: "..." } }], in character units, y pointing down.');
            return;
        }
        layer.shapes.forEach((shape, j) => {
            if (typeof shape?.tag !== 'string') report(`${at}shapes[${j}].tag`, shape?.tag, 'has a shape with no tag.', 'A shape is { tag: "path" | "circle" | "line" | "text"..., attrs }.');
        });
    });
    for (const [point, value] of Object.entries(prop.points ?? {})) {
        if (!Array.isArray(value) || value.length !== 2 || !value.every(Number.isFinite)) {
            report(`points.${point}`, value, `has a point "${point}" that is not [x, y].`, 'A point is two numbers, in the same units as the shapes.');
        }
    }
    return problems;
}

/** Checks every prop of a { name: prop } map. */
export const checkProps = props => Object.entries(props).flatMap(([name, prop]) => checkProp(name, prop));
