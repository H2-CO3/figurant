// `figurant inspect <file.svg>`: says what a drawing is made of, so that
// whoever rigs it knows before starting whether it can be rigged, and where
// the limbs could attach. It reads the file as text: no browser needed.

/** @returns {{ ok: boolean, lines: string[] }} */
export function inspect(text, name = 'the drawing') {
    const lines = [];
    if (!/<svg[\s>]/i.test(text)) return { ok: false, lines: [`${name} is not an SVG drawing. A picture made of pixels cannot be rigged part by part: it can only be used whole (as the head of an emoji figure), or redrawn.`] };
    const attr = (tag, key) => new RegExp(`<${tag}\\b[^>]*?\\s${key}="([^"]*)"`, 'i').exec(text)?.[1];
    const box = attr('svg', 'viewBox')?.trim().split(/[\s,]+/).map(Number);
    const width = box?.[2] ?? parseFloat(attr('svg', 'width')), height = box?.[3] ?? parseFloat(attr('svg', 'height'));
    lines.push(Number.isFinite(width) && Number.isFinite(height)
        ? `Size: ${width} by ${height}${box ? `, drawn from (${box[0]}, ${box[1]})` : ''}. A head is easiest around 100 to 170 units wide: scale by ${(140 / width).toFixed(2)}.`
        : 'Size: not stated (no viewBox, no width and height).');
    const count = tag => (text.match(new RegExp(`<${tag}[\\s>/]`, 'gi')) || []).length;
    const shapes = ['path', 'rect', 'circle', 'ellipse', 'line', 'polygon', 'polyline', 'text'].map(tag => [tag, count(tag)]).filter(([, n]) => n);
    const total = shapes.reduce((sum, [, n]) => sum + n, 0);
    lines.push(`Shapes: ${total} (${shapes.map(([tag, n]) => `${n} ${tag}`).join(', ') || 'none'}).`);
    const named = [...text.matchAll(/<(g|path|rect|circle|ellipse)\b[^>]*?\s(?:id|inkscape:label|data-name)="([^"]+)"/gi)].map(m => `${m[2]} (${m[1]})`);
    lines.push(named.length ? `Named parts: ${[...new Set(named)].slice(0, 30).join(', ')}${named.length > 30 ? ', …' : ''}.` : 'Named parts: none. Nothing says which shape is which.');
    if (count('image')) lines.push(`It embeds ${count('image')} picture(s) made of pixels: those parts cannot be moved separately.`);
    if (count('linearGradient') + count('radialGradient')) lines.push(`Gradients: ${count('linearGradient') + count('radialGradient')} (kept as they are).`);
    const colours = [...new Set([...text.matchAll(/(?:fill|stroke)[:=]\s*"?(#[0-9a-f]{3,8})/gi)].map(m => m[1].toLowerCase()))];
    if (colours.length) lines.push(`Colours: ${colours.slice(0, 12).join(' ')}${colours.length > 12 ? ' …' : ''}.`);

    // A verdict, in the spirit of docs/DESIGN.md "When to say no".
    let ok = true;
    if (total === 0) { ok = false; lines.push('Verdict: nothing to rig, the drawing has no shape.'); }
    else if (total === 1) lines.push('Verdict: one single shape. It can be a head as a whole, but no part of it can move by itself (no lid, no tail): say so, or ask for the parts to be drawn separately.');
    else if (total > 300 && named.length < 5) { ok = false; lines.push(`Verdict: ${total} shapes and almost none named. Do not guess which is which: ask for a file with its parts grouped and named (body, eyes, each part that should move).`); }
    else lines.push(named.length ? 'Verdict: it can be rigged. Use the named parts for what moves; put the hips on the bottom edge and the shoulders on the outline.' : 'Verdict: it can be rigged as one head. To make a part move by itself, find its shapes by position and colour, and tell the person which ones you took.');
    return { ok, lines };
}
