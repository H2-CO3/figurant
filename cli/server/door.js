// The access code, when the atelier is opened to the local network
// (`figurant atelier --lan`): the page that asks for it, the cookie that
// remembers it, and the five wrong tries that lock an address out for five
// minutes. Nothing here applies to this machine itself.

import { timingSafeEqual } from 'node:crypto';
import { crossSite } from './guard.js';
import { send, text, TYPES } from './http.js';

const page = said => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Figurant</title>
<style>body{font:18px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f7f7f5;color:#16181d}form{display:grid;gap:14px;padding:28px;border:2.5px solid #16181d;border-radius:22px;background:#fff;box-shadow:0 8px 0 #16181d;width:min(340px,86vw)}h1{font-size:22px;margin:0}input{font:inherit;font-size:26px;letter-spacing:.2em;text-align:center;text-transform:uppercase;padding:10px;border:2.5px solid #16181d;border-radius:12px}button{font:inherit;font-weight:800;padding:12px;border:2.5px solid #16181d;border-radius:12px;background:#ffcf24;cursor:pointer}p{margin:0;color:#c0392b;min-height:1.2em}small{color:#5c6470}</style>
<form method="post" action="/__figurant/key"><h1>Figurant</h1><small>Access code / Code d’accès</small><input name="key" maxlength="12" autocomplete="off" autofocus required><p>${said}</p><button>Enter / Entrer</button></form></html>`;

/**
 * @param {{ key: string, hosts: string[] } | null} lan
 * @param {(req: object) => boolean} local whether a request comes from this machine
 * @returns {(req, res, path: string) => Promise<boolean>} true when the door
 *          has answered (the code is asked for, given or refused) and the
 *          request goes no further; false when it may pass
 */
export function createDoor(lan, local) {
    const misses = new Map();
    const sameKey = given => { const a = Buffer.from(String(given).trim().toUpperCase()), b = Buffer.from(lan?.key ?? ''); return a.length === b.length && b.length > 0 && timingSafeEqual(a, b); };

    return async function door(req, res, path) {
        // Opened to the local network: whoever is not at this machine gives the access code first.
        // What they write is read by an assistant that can act, so nothing is served or written without it.
        if (!lan || local(req)) return false;
        const from = req.socket?.remoteAddress ?? '?', now = Date.now();
        const tries = (misses.get(from) ?? []).filter(when => now - when < 5 * 60_000);
        if (path === '/__figurant/key' && req.method === 'POST') {
            if (crossSite(req)) { send(res, 403, 'Cross-site request refused.'); return true; }
            if (tries.length >= 5) { send(res, 429, 'Too many wrong codes: wait five minutes.'); return true; }
            const given = new URLSearchParams(await text(req)).get('key') ?? '';
            if (!sameKey(given)) { misses.set(from, [...tries, now]); send(res, 401, page('That is not the code.'), TYPES['.html'], true); return true; }
            misses.delete(from);
            res.writeHead(303, { location: '/__figurant/', 'set-cookie': `figurant_key=${lan.key}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200`, 'cache-control': 'no-store' });
            res.end();
            return true;
        }
        const cookie = /(?:^|;\s*)figurant_key=([^;]*)/.exec(req.headers.cookie ?? '')?.[1] ?? '';
        if (sameKey(cookie)) return false;
        // A program is told in words; a browser asking for a page is shown the form.
        if (path.startsWith('/__figurant/api/') || !/text\/html/.test(req.headers.accept ?? 'text/html') && !path.startsWith('/__figurant/atelier') && path !== '/__figurant/' && path !== '/__figurant') send(res, 401, 'The access code first: open /__figurant/ in a browser.');
        else send(res, 401, page(''), TYPES['.html'], true);
        return true;
    };
}
