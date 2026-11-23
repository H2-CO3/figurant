// Styles: each is a brief for whoever draws, and a theme for the atelier's
// page. They live in styles/<id>.json; styles/.active names the one in use,
// and STYLE.md at the root always holds its brief, for whoever draws.

import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { isFicheName } from '../fiche.js';
import { send, json, readJson } from './http.js';
import { THEME_KEYS } from '../../atelier/theme.js';

const COLOUR = /^#[0-9a-f]{6}$/i;
const BAD_NAME = 'A style name is letters, digits and dashes.';

/** @param {string} root the project folder */
export function createStyles(root) {
    const styleDir = join(root, 'styles');

    /** { active, styles }: every style there is, and the id of the one in use (or null). */
    async function all() {
        const files = (await readdir(styleDir).catch(() => [])).filter(f => f.endsWith('.json') && isFicheName(f.slice(0, -5)));
        const list = [];
        for (const file of files.sort()) {
            // Only what a style is made of is read from its file; its name is its file's.
            try {
                const read = JSON.parse(await readFile(join(styleDir, file), 'utf8'));
                const theme = Object.fromEntries(THEME_KEYS.filter(key => typeof read?.theme?.[key] === 'string' && COLOUR.test(read.theme[key])).map(key => [key, read.theme[key].toLowerCase()]));
                list.push({ id: file.slice(0, -5), name: String(read?.name ?? file.slice(0, -5)).slice(0, 60), prompt: String(read?.prompt ?? '').slice(0, 20_000), theme });
            } catch { /* a broken file is skipped */ }
        }
        const active = (await readFile(join(styleDir, '.active'), 'utf8').catch(() => '')).trim();
        return { active: list.some(style => style.id === active) ? active : null, styles: list };
    }
    /** Writes a style from checked values; says what is wrong, or null. */
    async function save(id, value) {
        if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 60) return 'name: what this style is called (60 characters at most).';
        if (typeof value.prompt !== 'string' || value.prompt.length > 20_000) return 'prompt: the style, in words (20 000 characters at most).';
        const theme = {};
        for (const key of THEME_KEYS) {
            const colour = value.theme?.[key];
            if (colour === undefined || colour === '') continue;
            if (typeof colour !== 'string' || !COLOUR.test(colour)) return `theme.${key}: a colour such as #3b5bdb.`;
            theme[key] = colour.toLowerCase();
        }
        await mkdir(styleDir, { recursive: true });
        await writeFile(join(styleDir, `${id}.json`), JSON.stringify({ name: value.name.trim(), prompt: value.prompt, theme }, null, 2) + '\n');
        if ((await all()).active === id) await use(id);
        return null;
    }
    /** Puts a style in use (and its brief in STYLE.md); false when there is no such style. */
    async function use(id) {
        const style = (await all()).styles.find(candidate => candidate.id === id);
        if (!style) return false;
        await writeFile(join(styleDir, '.active'), id + '\n');
        await writeFile(join(root, 'STYLE.md'), `# Style: ${style.name}\n\n${style.prompt.trim()}\n`);
        return true;
    }
    /** Removes a style; says why not, or null. */
    async function remove(id) {
        const { active, styles: list } = await all();
        if (!list.some(style => style.id === id)) return 'No such style.';
        if (active === id) return 'This style is in use: choose another one first.';
        await rm(join(styleDir, `${id}.json`), { force: true });
        return null;
    }

    return {
        all,

        /** GET /__figurant/api/styles */
        async list(req, res) {
            return req.method === 'GET' ? json(res, 200, await all()) : send(res, 405, 'GET.');
        },

        /** POST /__figurant/api/styles/<id>/use */
        async choose(req, res, [, id]) {
            if (!isFicheName(id)) return send(res, 400, BAD_NAME);
            if (req.method !== 'POST') return send(res, 405, 'POST.');
            return await use(id) ? json(res, 200, await all()) : send(res, 404, 'No such style.');
        },

        /** PUT or DELETE /__figurant/api/styles/<id> */
        async one(req, res, [, id]) {
            if (!isFicheName(id)) return send(res, 400, BAD_NAME);
            if (req.method === 'DELETE') {
                const refused = await remove(id);
                return refused ? send(res, 409, refused) : json(res, 200, await all());
            }
            if (req.method !== 'PUT') return send(res, 405, 'PUT or DELETE.');
            let value;
            try { value = await readJson(req); } catch { return send(res, 400, 'Send JSON: { name, prompt, theme }.'); }
            const refused = await save(id, value);
            return refused ? send(res, 400, refused) : json(res, 200, await all());
        },
    };
}
