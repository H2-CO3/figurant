// The atelier's local server: the project's own files, the engine, the atelier
// page, and the fiches. Node's standard library only. It listens on this
// machine alone and never serves or writes outside the folders it was given.
//
// This file is the table of contents: the order a request goes through the
// checks, then which address is answered by what. The rest is in server/:
//   guard.js     the checks themselves: Host, cross-site writes, paths kept
//                inside a folder, hidden files, what a page may run (CSP)
//   door.js      the access code of `figurant atelier --lan`
//   http.js      sending an answer, reading a request (with a size limit)
//   static.js    serving files, and the atelier's page in its colours
//   fiches.js, presence.js, styles.js, exports.js, history.js, custom.js,
//   assets.js    one part of the API each (see the table below)

import { createServer } from 'node:http';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inside, loopback, knownHost, crossSite } from './server/guard.js';
import { send } from './server/http.js';
import { createDoor } from './server/door.js';
import { file, atelierPage } from './server/static.js';
import { createFiches } from './server/fiches.js';
import { createPresence } from './server/presence.js';
import { createStyles } from './server/styles.js';
import { createExports } from './server/exports.js';
import { createHistory } from './server/history.js';
import { createCustom } from './server/custom.js';
import { createAssets } from './server/assets.js';

export { inside };

const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ANY = '*';

/** The first line of `table` that answers this request: its handler and what its address caught. */
function find(table, method, path) {
    for (const [wanted, address, handler] of table) {
        if (wanted !== ANY && wanted !== method) continue;
        const found = typeof address === 'string' ? (address === path ? [path] : null) : address.exec(path);
        if (found) return { handler, found };
    }
    return null;
}

/**
 * @param {object} options
 * @param {string} options.root    the project folder
 * @param {string} [options.fiches] folder of the fiches, relative to root
 * @param {object} [options.custom] { character: 'path/to/name.custom.js' }: the
 *        characters a person may customise from the page, and the module
 *        each customisation is saved in
 * @param {{ key: string, hosts: string[] }} [options.lan] opened to the local
 *        network on purpose (`figurant atelier --lan`): the addresses of this
 *        machine it may be asked by, and the access code a client that is not
 *        this machine must give first
 * @param {(req: object) => boolean} [options.local] whether a request comes
 *        from this machine itself (for tests)
 */
export function createAtelierServer({ root, fiches: ficheFolder = 'fiches', custom = {}, lan = null, local = loopback }) {
    root = resolve(root);
    const ficheDir = inside(root, ficheFolder);
    if (!ficheDir) throw new Error(`The fiches folder "${ficheFolder}" must be inside the project.`);

    const door = createDoor(lan, local);
    const fiches = createFiches(ficheDir);
    const presence = createPresence(fiches);
    const styles = createStyles(root);
    const exports = createExports(root);
    const history = createHistory(root);
    const customs = createCustom(root, custom);
    const assets = createAssets(root);

    // The API, under /__figurant/api/. Each line: the method, the address, who answers.
    // ANY: the handler looks at the method itself and answers 405, after its own
    // checks; the methods it takes are named on the right.
    const api = [
        ['GET', '/__figurant/api/listening',                      presence.listening],
        [ANY,   '/__figurant/api/export',                         exports.item],       // POST
        [ANY,   '/__figurant/api/history',                        history.versions],   // POST
        [ANY,   '/__figurant/api/restore',                        history.restore],    // POST
        [ANY,   /^\/__figurant\/api\/export\/([^/]+)\/gif$/,      exports.film],       // POST
        [ANY,   '/__figurant/api/activity',                       presence.activity],  // POST
        [ANY,   '/__figurant/api/styles',                         styles.list],        // GET
        [ANY,   /^\/__figurant\/api\/styles\/([^/]+)\/use$/,      styles.choose],      // POST
        [ANY,   /^\/__figurant\/api\/styles\/([^/]+)$/,           styles.one],         // PUT, DELETE
        [ANY,   /^\/__figurant\/api\/custom\/([^/]+)$/,           customs.one],        // GET, PUT
        [ANY,   /^\/__figurant\/api\/assets\/([^/]+)$/,           assets.add],         // POST
        ['GET', '/__figurant/api/fiches',                         fiches.all],
        [ANY,   /^\/__figurant\/api\/fiches\/([^/]+)$/,           fiches.one],         // GET, POST
    ];

    // Everything else is read only (GET or HEAD): the past, the atelier's page, the engine, the project.
    const toAtelier = (req, res) => { res.writeHead(302, { location: '/__figurant/atelier/' }); return res.end(); };
    const atelier = (req, res) => atelierPage(res, ENGINE, styles);
    const pages = [
        [ANY, /^\/__figurant\/at\/([^/]+)\/(.+)$/,   history.at],
        [ANY, '/__figurant',                         toAtelier],
        [ANY, '/__figurant/',                        toAtelier],
        [ANY, '/__figurant/atelier/',                atelier],
        [ANY, '/__figurant/atelier/index.html',      atelier],
        [ANY, /^\/__figurant\/atelier\/(.*)$/s,      (req, res, [, asked]) => file(res, join(ENGINE, 'atelier'), asked, true)],
        [ANY, /^\/__figurant\/engine\/(.*)$/s,       (req, res, [, asked]) => file(res, join(ENGINE, 'src'), asked)],
        [ANY, /^.*$/s,                               (req, res, [asked]) => file(res, root, asked, false, req.headers.range)],   // the project's own files
    ];

    return createServer(async (req, res) => {
        try {
            // 1. The name it is asked by (guard.js): before anything else.
            if (!knownHost(req, lan)) return send(res, 403, 'This server answers to localhost only.');
            const url = new URL(req.url, 'http://localhost');
            const path = url.pathname;

            // 2. The access code, when opened to the local network (door.js): before anything is served or written.
            if (await door(req, res, path)) return;

            // 3. The API. Fiches are only written from the atelier page itself.
            if (path.startsWith('/__figurant/api/')) {
                if (req.method !== 'GET' && crossSite(req)) return send(res, 403, 'Cross-site request refused.');
                const route = find(api, req.method, path);
                return route ? await route.handler(req, res, route.found) : send(res, 404, 'Unknown address.');
            }

            // 4. Files.
            if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'GET only.');
            const page = find(pages, req.method, path);
            return await page.handler(req, res, page.found);
        } catch (error) {
            send(res, 500, `Atelier error: ${error.message}`);
        }
    });
}
