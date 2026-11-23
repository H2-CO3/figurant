// Files, served as they are: the project's, the engine's, the atelier's page.
// Never outside the folder given, never a hidden file, never what a link
// points to outside.

import { readFile, realpath, stat } from 'node:fs/promises';
import { join, sep, relative } from 'node:path';
import { inside, hidden } from './guard.js';
import { send, typeOf, TYPES } from './http.js';
import { themeVars } from '../../atelier/theme.js';

/** The part of a file of `size` bytes a `Range` header asks for: [first, last], null when it asks for none, false when for none there is. */
export function part(range, size) {
    const asked = /^bytes=(\d*)-(\d*)$/.exec(range ?? '');
    if (!asked || (asked[1] === '' && asked[2] === '')) return null;
    const first = asked[1] === '' ? Math.max(0, size - Number(asked[2])) : Number(asked[1]);
    const last = asked[1] === '' || asked[2] === '' ? size - 1 : Math.min(size - 1, Number(asked[2]));
    return first > last || first >= size ? false : [first, last];
}

/**
 * Serves `asked` from the folder `base` (a folder gives its index.html). `own`: one of the atelier's own pages.
 * `range`: the request's Range header; a browser asks for a part of a sound file to go to a moment of it.
 */
export async function file(res, base, asked, own = false, range) {
    const path = inside(base, asked);
    if (!path) return send(res, 403, 'Outside the served folders.');
    try {
        if (hidden(relative(base, path))) throw new Error('hidden');
        // Where it really is, before a byte of it is read: a link may point to something huge, or endless.
        const home = await realpath(base);
        const allowed = async target => { const real = await realpath(target); if ((real !== home && !real.startsWith(home + sep)) || hidden(relative(home, real))) throw new Error('linked outside, or to something hidden'); };
        let target = path;
        await allowed(target);
        if ((await stat(target)).isDirectory()) { target = join(path, 'index.html'); await allowed(target); }
        const body = await readFile(target), span = part(range, body.length);
        if (span === false) return send(res, 416, 'No such part.', undefined, false, { 'content-range': `bytes */${body.length}` });
        if (span) return send(res, 206, body.subarray(span[0], span[1] + 1), typeOf(target), own, { 'accept-ranges': 'bytes', 'content-range': `bytes ${span[0]}-${span[1]}/${body.length}` });
        send(res, 200, body, typeOf(target), own, { 'accept-ranges': 'bytes' });
    } catch { send(res, 404, 'Not found.'); }
}

// The page arrives in the colours of the style in use: applied by
// script they would come after a first paint in the default ones.
export async function atelierPage(res, engine, styles) {
    const { active, styles: list } = await styles.all();
    const theme = list.find(style => style.id === active)?.theme ?? {};
    const colours = Object.entries(themeVars(theme)).map(([name, colour]) => `${name}:${colour}`);
    const html = await readFile(join(engine, 'atelier', 'index.html'), 'utf8');
    return send(res, 200, colours.length ? html.replace('<html lang="en">', `<html lang="en" style="${colours.join(';')}">`) : html, TYPES['.html'], true);
}
