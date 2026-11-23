// Export over HTTP: the item made ready for a website, in exports/<name>/
// (the work itself is in ../export.js), and its film, which the page records
// and sends to be put beside it.

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { isFicheName } from '../fiche.js';
import { exportItem } from '../export.js';
import { send, json, bytes, readJson } from './http.js';

/** @param {string} root the project folder */
export function createExports(root) {
    return {
        /** POST /__figurant/api/export */
        async item(req, res) {
            if (req.method !== 'POST') return send(res, 405, 'POST.');
            let asked;
            try { asked = await readJson(req, 2_000_000); } catch { return send(res, 400, 'Send JSON: { shop, name, needles }.'); }
            try { return json(res, 200, await exportItem({ root, shop: String(asked?.shop), name: String(asked?.name), title: typeof asked?.title === 'string' ? asked.title.slice(0, 120) : undefined, needles: Array.isArray(asked?.needles) ? asked.needles : [] })); }
            catch (error) { return send(res, 400, error.message); }
        },

        /** POST /__figurant/api/export/<name>/gif */
        async film(req, res, [, filmed]) {
            if (req.method !== 'POST') return send(res, 405, 'POST the GIF.');
            if (!isFicheName(filmed)) return send(res, 400, 'A name is letters, digits, "-" and "_".');
            let data;
            try { data = await bytes(req, 80_000_000); } catch { return send(res, 413, 'The film is too large.'); }
            if (data.subarray(0, 6).toString('latin1') !== 'GIF89a') return send(res, 400, 'Not a GIF.');
            const folder = join(root, 'exports', filmed);
            await mkdir(folder, { recursive: true });
            await writeFile(join(folder, `${filmed}.gif`), data);
            return json(res, 200, { path: `exports/${filmed}/${filmed}.gif`, bytes: data.length });
        },
    };
}
