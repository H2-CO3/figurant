// The server's two gestures, shared by every route: sending an answer (with
// the headers every answer carries) and reading what a request brings, never
// past a size limit.

import { extname } from 'node:path';
import { DRAWING_POLICY, PAGE_POLICY, OWN_PAGE_POLICY } from './guard.js';

export const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
    '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

/** The type a file is served as, from its name. */
export const typeOf = path => TYPES[extname(path).toLowerCase()] || 'application/octet-stream';

/** Answers. `own`: the page is one of the atelier's own. */
export function send(res, status, body, type = 'text/plain; charset=utf-8', own = false) {
    const headers = { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
    if (type === TYPES['.svg']) headers['content-security-policy'] = DRAWING_POLICY;
    if (type === TYPES['.html']) headers['content-security-policy'] = own ? OWN_PAGE_POLICY : PAGE_POLICY;
    res.writeHead(status, headers);
    res.end(body);
}

export const json = (res, status, value) => send(res, status, JSON.stringify(value), TYPES['.json']);

/** What a request brings, as bytes; fails (with `tooLarge`) past `limit`. */
export const bytes = (req, limit) => new Promise((done, fail) => {
    const chunks = []; let size = 0;
    req.on('data', chunk => { size += chunk.length; if (size > limit) { fail(Object.assign(new Error('too large'), { tooLarge: true })); req.resume(); } else chunks.push(chunk); });
    req.on('end', () => done(Buffer.concat(chunks)));
    req.on('error', fail);
});

/** What a request brings, as text: 100 kB at most unless said otherwise. */
export const text = async (req, limit = 100_000) => (await bytes(req, limit)).toString('utf8');

/** What a request brings, read as JSON; throws when it is too large or is not JSON. */
export const readJson = async (req, limit) => JSON.parse(await text(req, limit));
