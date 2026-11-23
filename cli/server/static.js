// Files, served as they are: the project's, the engine's, the atelier's page.
// Never outside the folder given, never a hidden file, never what a link
// points to outside.

import { readFile, realpath } from 'node:fs/promises';
import { join, sep, relative } from 'node:path';
import { inside, hidden } from './guard.js';
import { send, typeOf, TYPES } from './http.js';
import { themeVars } from '../../atelier/theme.js';

/** Serves `asked` from the folder `base` (a folder gives its index.html). `own`: one of the atelier's own pages. */
export async function file(res, base, asked, own = false) {
    const path = inside(base, asked);
    if (!path) return send(res, 403, 'Outside the served folders.');
    try {
        if (hidden(relative(base, path))) throw new Error('hidden');
        let target = path;
        let body;
        try { body = await readFile(target); }
        catch (error) { if (error.code !== 'EISDIR') throw error; target = join(path, 'index.html'); body = await readFile(target); }
        const [real, home] = await Promise.all([realpath(target), realpath(base)]);
        if ((real !== home && !real.startsWith(home + sep)) || hidden(relative(home, real))) throw new Error('linked outside, or to something hidden');
        send(res, 200, body, typeOf(target), own);
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
