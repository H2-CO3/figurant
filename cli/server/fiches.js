// The fiches over HTTP: read them all, read one, add what the person says to
// one. Their format and rules are in ../fiche.js; this is only the folder and
// the routes.

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFiche, serializeFiche, addPersonEntry, isFicheName } from '../fiche.js';
import { send, json, readJson } from './http.js';

export const BAD_NAME = 'A scene name is letters, digits, "-" and "_".';

/** @param {string} dir the folder of the fiches */
export function createFiches(dir) {
    const file = name => join(dir, `${name}.md`);
    /** A fiche; one that does not exist yet reads as an empty one. */
    const read = async name => {
        try { return parseFiche(await readFile(file(name), 'utf8'), name); }
        catch (error) { if (error.code === 'ENOENT') return parseFiche('', name); throw error; }
    };
    /** The names of the fiches there are (none when the folder is not there yet). */
    const names = async () => (await readdir(dir).catch(() => [])).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)).filter(isFicheName);

    return {
        dir, read, names,

        /** GET /__figurant/api/fiches */
        async all(req, res) {
            return json(res, 200, Object.fromEntries(await Promise.all((await names()).map(async n => [n, await read(n)]))));
        },

        /** GET or POST /__figurant/api/fiches/<name> */
        async one(req, res, [, name]) {
            if (!name || !isFicheName(name)) return send(res, 400, BAD_NAME);
            if (req.method === 'GET') return json(res, 200, await read(name));
            if (req.method === 'POST') {
                let said;
                try { said = await readJson(req); } catch { return send(res, 400, 'Send JSON: { decision, note, answers }.'); }
                let next;
                try { next = addPersonEntry(await read(name), said); } catch (error) { return send(res, 400, error.message); }
                await mkdir(dir, { recursive: true });
                await writeFile(file(name), serializeFiche(next));
                return json(res, 200, next);
            }
            return send(res, 405, 'GET or POST.');
        },
    };
}
