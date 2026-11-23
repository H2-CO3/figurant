// What keeps the atelier's server to its own folders and its own page: the
// names it answers to, where a write may come from, which paths stay inside a
// served folder, which files are never shown, and what a served page or
// drawing may run. Checks only: server.js decides when each one applies.

import { resolve, sep } from 'node:path';

/** `path` under `base`, or null when it would escape it. */
export function inside(base, path) {
    let decoded;
    try { decoded = decodeURIComponent(path); } catch { return null; }
    if (decoded.includes('\0')) return null;
    const target = resolve(base, '.' + sep + decoded);
    return target === base || target.startsWith(base + sep) ? target : null;
}

// Hidden files (.env, .git, the activity log) are never served, and neither is
// anything a link inside a served folder points to outside it (see static.js).
export const hidden = path => path.split(/[\\/]/).some(part => part.startsWith('.'));

/** Whether a request comes from this machine itself. */
export const loopback = req => /^(127\.|::1$|::ffff:127\.)/.test(req.socket?.remoteAddress ?? '');

// Asked for by its own name only. A page elsewhere can get a name of its own to point
// at this machine (DNS rebinding) and would then read the project and write to it as
// if it were the atelier: what is written here is read by an assistant that can act.
export function knownHost(req, lan) {
    const host = (req.headers.host ?? '').replace(/:\d+$/, '').toLowerCase();
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) || lan?.hosts.includes(host);
}

/** Whether a request says it comes from a page of another site. */
export function crossSite(req) {
    if (!req.headers.origin) return false;
    // An Origin that is no address is not this page's.
    try { return new URL(req.headers.origin).host !== req.headers.host; } catch { return true; }
}

// An imported drawing is shown as a picture; opened on its own it must not run anything.
export const DRAWING_POLICY = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
// A page is never shown inside another site's page; the atelier's own pages run nothing but what this server serves.
export const PAGE_POLICY = "frame-ancestors 'self'";
export const OWN_PAGE_POLICY = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-ancestors 'self'; base-uri 'none'; form-action 'self'";
