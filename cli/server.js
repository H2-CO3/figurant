// The atelier's local server: the project's own files, the engine, the atelier
// page, and the fiches. Node's standard library only. It listens on this
// machine alone and never serves or writes outside the folders it was given.

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, readdir, access, stat, rm, realpath } from 'node:fs/promises';
import { resolve, join, extname, sep, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFiche, serializeFiche, addPersonEntry, isFicheName, pending } from './fiche.js';
import { noteActivity } from './activity.js';
import { exportItem, locate } from './export.js';
import { execFile } from 'node:child_process';
import { timingSafeEqual } from 'node:crypto';
import { themeVars, THEME_KEYS } from '../atelier/theme.js';

const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
    '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

/** `path` under `base`, or null when it would escape it. */
export function inside(base, path) {
    let decoded;
    try { decoded = decodeURIComponent(path); } catch { return null; }
    if (decoded.includes('\0')) return null;
    const target = resolve(base, '.' + sep + decoded);
    return target === base || target.startsWith(base + sep) ? target : null;
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
const loopback = req => /^(127\.|::1$|::ffff:127\.)/.test(req.socket?.remoteAddress ?? '');
export function createAtelierServer({ root, fiches = 'fiches', custom = {}, lan = null, local = loopback }) {
    root = resolve(root);
    const ficheDir = inside(root, fiches);
    if (!ficheDir) throw new Error(`The fiches folder "${fiches}" must be inside the project.`);
    const ficheFile = name => join(ficheDir, `${name}.md`);
    const readFiche = async name => {
        try { return parseFiche(await readFile(ficheFile(name), 'utf8'), name); }
        catch (error) { if (error.code === 'ENOENT') return parseFiche('', name); throw error; }
    };

    const send = (res, status, body, type = 'text/plain; charset=utf-8', own = false) => {
        const headers = { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
        // An imported drawing is shown as a picture; opened on its own it must not run anything.
        if (type === TYPES['.svg']) headers['content-security-policy'] = "default-src 'none'; style-src 'unsafe-inline'; sandbox";
        // A page is never shown inside another site's page; the atelier's own pages run nothing but what this server serves.
        if (type === TYPES['.html']) headers['content-security-policy'] = own ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-ancestors 'self'; base-uri 'none'; form-action 'self'" : "frame-ancestors 'self'";
        res.writeHead(status, headers);
        res.end(body);
    };
    const json = (res, status, value) => send(res, status, JSON.stringify(value), TYPES['.json']);
    // Hidden files (.env, .git, the activity log) are never served, and neither is
    // anything a link inside a served folder points to outside it.
    const hidden = path => path.split(/[\\/]/).some(part => part.startsWith('.'));
    const file = async (res, base, asked, own = false) => {
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
            send(res, 200, body, TYPES[extname(target).toLowerCase()] || 'application/octet-stream', own);
        } catch { send(res, 404, 'Not found.'); }
    };
    const bytes = (req, limit) => new Promise((done, fail) => {
        const chunks = []; let size = 0;
        req.on('data', chunk => { size += chunk.length; if (size > limit) { fail(Object.assign(new Error('too large'), { tooLarge: true })); req.resume(); } else chunks.push(chunk); });
        req.on('end', () => done(Buffer.concat(chunks)));
        req.on('error', fail);
    });
    const body = async req => (await bytes(req, 100_000)).toString('utf8');

    // Styles live in styles/<id>.json; styles/.active names the one in use, and
    // STYLE.md at the root always holds its brief, for whoever draws.
    const styleDir = join(root, 'styles');
    const COLOUR = /^#[0-9a-f]{6}$/i;
    const styles = {
        async all() {
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
        },
        async save(id, value) {
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
            if ((await styles.all()).active === id) await styles.use(id);
            return null;
        },
        async use(id) {
            const style = (await styles.all()).styles.find(candidate => candidate.id === id);
            if (!style) return false;
            await writeFile(join(styleDir, '.active'), id + '\n');
            await writeFile(join(root, 'STYLE.md'), `# Style: ${style.name}\n\n${style.prompt.trim()}\n`);
            return true;
        },
        async remove(id) {
            const { active, styles: list } = await styles.all();
            if (!list.some(style => style.id === id)) return 'No such style.';
            if (active === id) return 'This style is in use: choose another one first.';
            await rm(join(styleDir, `${id}.json`), { force: true });
            return null;
        },
    };

    // Customisations. Each is a module the project imports, so that it travels
    // with the character; it is written from checked values only, never from text.
    const customFile = name => {
        if (!Object.hasOwn(custom, name) || typeof custom[name] !== 'string' || !custom[name].endsWith('.custom.js')) return null;
        return inside(root, custom[name]);
    };
    const IMAGE = /^assets\/[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp|gif|svg)$/;
    const glyph = value => typeof value === 'string' && value.length >= 1 && value.length <= 16 && !/[\x00-\x7f]/.test(value);
    async function checkCustom(value) {
        if (!value || typeof value !== 'object') return 'Send { face, faces?, image? }.';
        if (value.face !== undefined && !glyph(value.face)) return 'face is one emoji.';
        const faces = {};
        for (const key of ['blink', 'wide', 'squint']) {
            const face = value.faces?.[key];
            if (face === undefined || face === '' || face === null) continue;
            if (!glyph(face)) return `faces.${key} is one emoji.`;
            faces[key] = face;
        }
        let image = null;
        if (value.image) {
            if (typeof value.image !== 'string' || !IMAGE.test(value.image)) return 'image is a file imported into assets/.';
            if (!await access(join(root, value.image)).then(() => true, () => false)) return 'That image is not in assets/.';
            image = value.image;
        }
        if (!value.face && !image) return 'Give a face or an image.';
        return { face: value.face ?? '🙂', faces, image };
    }
    const customModule = (file, value) => {
        let address = value.image && relative(dirname(file), join(root, value.image)).split(sep).join('/');
        if (address && !address.startsWith('.')) address = './' + address;
        return `// Written by the atelier: the customisation chosen for this character.\n// Change it from the atelier's page rather than by hand.\nexport default {\n    face: ${JSON.stringify(value.face)},\n    faces: ${JSON.stringify(value.faces)},\n    image: ${address ? `new URL(${JSON.stringify(address)}, import.meta.url).href` : 'null'},\n};\n`;
    };
    const readCustom = async file => {
        try {
            const text = await readFile(file, 'utf8');
            const pick = key => { const found = new RegExp(`${key}: ("(?:[^"\\\\]|\\\\.)*"|\\{[^}]*\\})`).exec(text); return found ? JSON.parse(found[1]) : undefined; };
            const address = /image: new URL\(("(?:[^"\\]|\\.)*")/.exec(text);
            return { face: pick('face') ?? '🙂', faces: pick('faces') ?? {}, image: address ? relative(root, resolve(dirname(file), JSON.parse(address[1]))).split(sep).join('/') : null };
        } catch { return { face: '🙂', faces: {}, image: null }; }
    };

    // The project's past, from git when it is under git: what it was at a given
    // moment, and its files as they were then. Only full commit names are ever
    // handed to git, and never through a shell.
    const git = args => new Promise(done => execFile('git', args, { cwd: root, maxBuffer: 20_000_000, encoding: 'buffer', timeout: 20_000 }, (error, out) => done(error ? null : out)));
    const COMMIT = /^[0-9a-f]{40}$/;
    /** A file of the project as it was at a commit, or null. */
    const fileAt = async (commit, path) => {
        const target = inside(root, path);
        if (!COMMIT.test(commit) || !target || target === root || hidden(relative(root, target))) return null;
        // git names files from the top of its repository, which may be above the project.
        const prefix = (await git(['rev-parse', '--show-prefix']))?.toString().trim() ?? '';
        return git(['show', `${commit}:${prefix}${relative(root, target).split(sep).join('/')}`]);
    };

    // The access code, when the atelier is opened to the local network.
    const misses = new Map();
    const sameKey = given => { const a = Buffer.from(String(given).trim().toUpperCase()), b = Buffer.from(lan?.key ?? ''); return a.length === b.length && b.length > 0 && timingSafeEqual(a, b); };
    const door = said => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Figurant</title>
<style>body{font:18px system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f7f7f5;color:#16181d}form{display:grid;gap:14px;padding:28px;border:2.5px solid #16181d;border-radius:22px;background:#fff;box-shadow:0 8px 0 #16181d;width:min(340px,86vw)}h1{font-size:22px;margin:0}input{font:inherit;font-size:26px;letter-spacing:.2em;text-align:center;text-transform:uppercase;padding:10px;border:2.5px solid #16181d;border-radius:12px}button{font:inherit;font-weight:800;padding:12px;border:2.5px solid #16181d;border-radius:12px;background:#ffcf24;cursor:pointer}p{margin:0;color:#c0392b;min-height:1.2em}small{color:#5c6470}</style>
<form method="post" action="/__figurant/key"><h1>Figurant</h1><small>Access code / Code d’accès</small><input name="key" maxlength="12" autocomplete="off" autofocus required><p>${said}</p><button>Enter / Entrer</button></form></html>`;

    return createServer(async (req, res) => {
        try {
            // Asked for by its own name only. A page elsewhere can get a name of its own to point
            // at this machine (DNS rebinding) and would then read the project and write to it as
            // if it were the atelier: what is written here is read by an assistant that can act.
            const host = (req.headers.host ?? '').replace(/:\d+$/, '').toLowerCase();
            if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host) && !lan?.hosts.includes(host)) return send(res, 403, 'This server answers to localhost only.');
            const url = new URL(req.url, 'http://localhost');
            const path = url.pathname;

            // Opened to the local network: whoever is not at this machine gives the access code first.
            // What they write is read by an assistant that can act, so nothing is served or written without it.
            if (lan && !local(req)) {
                const from = req.socket?.remoteAddress ?? '?', now = Date.now();
                const tries = (misses.get(from) ?? []).filter(when => now - when < 5 * 60_000);
                if (path === '/__figurant/key' && req.method === 'POST') {
                    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) return send(res, 403, 'Cross-site request refused.');
                    if (tries.length >= 5) return send(res, 429, 'Too many wrong codes: wait five minutes.');
                    const given = new URLSearchParams(await body(req)).get('key') ?? '';
                    if (!sameKey(given)) { misses.set(from, [...tries, now]); return send(res, 401, door('That is not the code.'), TYPES['.html'], true); }
                    misses.delete(from);
                    res.writeHead(303, { location: '/__figurant/', 'set-cookie': `figurant_key=${lan.key}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200`, 'cache-control': 'no-store' });
                    return res.end();
                }
                const cookie = /(?:^|;\s*)figurant_key=([^;]*)/.exec(req.headers.cookie ?? '')?.[1] ?? '';
                if (!sameKey(cookie)) return path.startsWith('/__figurant/api/') || !/text\/html/.test(req.headers.accept ?? 'text/html') && !path.startsWith('/__figurant/atelier') && path !== '/__figurant/' && path !== '/__figurant'
                    ? send(res, 401, 'The access code first: open /__figurant/ in a browser.')
                    : send(res, 401, door(''), TYPES['.html'], true);
            }

            // Fiches are only written from the atelier page itself.
            if (path.startsWith('/__figurant/api/')) {
                const origin = req.headers.origin;
                if (req.method !== 'GET' && origin && new URL(origin).host !== req.headers.host) return send(res, 403, 'Cross-site request refused.');
                if (path === '/__figurant/api/listening' && req.method === 'GET') {
                    // An assistant waiting on the fiches (figurant fiches --wait) leaves a fresh mark there.
                    const age = name => stat(join(ficheDir, name)).then(s => Date.now() - s.mtimeMs, () => Infinity);
                    // At work: one that was waiting has been woken (it left a mark), and a fiche still waits for its answer…
                    const names = (await readdir(ficheDir).catch(() => [])).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)).filter(isFicheName);
                    const waiting = (await Promise.all(names.map(readFiche))).some(fiche => pending(fiche));
                    // … or it has just said where it is (figurant show), within the last ten minutes, and has not answered since:
                    // once a fiche has been written after that and nothing waits, the work it spoke of is done.
                    const shown = await age('.screen'), written = Math.min(Infinity, ...await Promise.all(names.map(name => age(`${name}.md`))));
                    const showing = shown < 10 * 60_000 && (waiting || written > shown);
                    const working = await age('.working') < 30 * 60_000 && (waiting || showing);
                    // Where the assistant says it is, and what it is doing.
                    let screen = null;
                    if (showing) try {
                        const said = JSON.parse(await readFile(join(ficheDir, '.screen'), 'utf8'));
                        if (/^(scenes|characters|emoji|props|compositions)(\/[a-z0-9][a-z0-9_-]{0,63})?$/i.test(said.see ?? '')) screen = { see: said.see, say: String(said.say ?? '').slice(0, 140), at: String(said.at ?? '') };
                    } catch { /* it said nothing */ }
                    return json(res, 200, { listening: await age('.listening') < 6000, working, ...(screen ? { screen } : {}) });
                }
                // Export: the item made ready for a website, in exports/<name>/, and its film beside it.
                if (path === '/__figurant/api/export') {
                    if (req.method !== 'POST') return send(res, 405, 'POST.');
                    let asked;
                    try { asked = JSON.parse((await bytes(req, 2_000_000)).toString('utf8')); } catch { return send(res, 400, 'Send JSON: { shop, name, needles }.'); }
                    try { return json(res, 200, await exportItem({ root, shop: String(asked?.shop), name: String(asked?.name), title: typeof asked?.title === 'string' ? asked.title.slice(0, 120) : undefined, needles: Array.isArray(asked?.needles) ? asked.needles : [] })); }
                    catch (error) { return send(res, 400, error.message); }
                }
                // The versions of one item: the commits that changed its files (or those of what it uses),
                // newest first; and going back to one, which is a new commit: nothing is ever lost.
                if (path === '/__figurant/api/history' || path === '/__figurant/api/restore') {
                    if (req.method !== 'POST') return send(res, 405, 'POST.');
                    let asked;
                    try { asked = JSON.parse((await bytes(req, 2_000_000)).toString('utf8')); } catch { return send(res, 400, 'Send JSON: { shop, name, needles }.'); }
                    const { found } = await locate(root, Array.isArray(asked?.needles) ? asked.needles : []);
                    const files = [...new Set(found.map(item => item.file))];
                    const head = (await git(['rev-parse', 'HEAD']))?.toString().trim() ?? '';
                    if (!files.length || !COMMIT.test(head)) return json(res, 200, { head: null, dirty: false, versions: [] });
                    const changed = async list => ((await git(['status', '--porcelain', '--', ...list]))?.toString().trim() ?? '') !== '';
                    const log = async list => ((await git(['log', '-n', '40', '--format=%H%x09%cI%x09%s', '--', ...list]))?.toString() ?? '').split('\n').filter(Boolean)
                        .map(line => { const [commit, date, ...subject] = line.split('\t'); return { commit, date, subject: subject.join('\t').slice(0, 200) }; }).filter(version => COMMIT.test(version.commit));
                    const kind = { scenes: 'scene', compositions: 'composition', props: 'prop' }[asked?.shop] ?? 'character';
                    const own = found.find(item => item.kind === kind && item.key === String(asked?.name))?.file;
                    if (path.endsWith('/history')) {
                        // What it uses is older than it is: versions from before its own file existed are not versions of it.
                        const born = own ? (await git(['log', '--diff-filter=A', '--format=%cI', '--', own]))?.toString().trim().split('\n').at(-1) : '';
                        const versions = (await log(files)).filter(version => !born || Date.parse(version.date) >= Date.parse(born));
                        return json(res, 200, { head, dirty: await changed(files), versions });
                    }
                    // Going back: only the item's own file, only to a version of it, and never over work that is not saved in git.
                    if (!own) return send(res, 404, 'That item was not found in the project\'s files.');
                    const to = (await log([own])).find(version => version.commit === asked?.commit);
                    if (!to) return send(res, 404, 'That is not a version of this item.');
                    if (await changed([own])) return send(res, 409, `${own} has changes that are not saved in git: save or discard them first.`);
                    if (!await git(['checkout', to.commit, '--', own])) return send(res, 500, 'git could not bring that version back.');
                    if (!await changed([own])) return json(res, 200, { file: own, unchanged: true });
                    if (!await git(['commit', '-m', `Back to the version of ${to.date}: ${String(asked.name).replace(/[^\w-]/g, '')}`, '--', own])) {
                        // Not saved: the file goes back to what it was, so that nothing is left half done.
                        await git(['checkout', 'HEAD', '--', own]);
                        return send(res, 500, 'git could not save the return (is an author set? git config user.name). Nothing was changed.');
                    }
                    return json(res, 200, { file: own, from: to.commit });
                }
                const [, filmed] = /^\/__figurant\/api\/export\/([^/]+)\/gif$/.exec(path) || [];
                if (filmed !== undefined) {
                    if (req.method !== 'POST') return send(res, 405, 'POST the GIF.');
                    if (!isFicheName(filmed)) return send(res, 400, 'A name is letters, digits, "-" and "_".');
                    let data;
                    try { data = await bytes(req, 80_000_000); } catch { return send(res, 413, 'The film is too large.'); }
                    if (data.subarray(0, 6).toString('latin1') !== 'GIF89a') return send(res, 400, 'Not a GIF.');
                    const folder = join(root, 'exports', filmed);
                    await mkdir(folder, { recursive: true });
                    await writeFile(join(folder, `${filmed}.gif`), data);
                    return json(res, 200, { path: `exports/${filmed}/${filmed}.gif`, bytes: data.length });
                }
                if (path === '/__figurant/api/activity') {
                    // What the person does on the page, noted silently for the assistant (see activity.js).
                    if (req.method !== 'POST') return send(res, 405, 'POST.');
                    let said;
                    try { said = JSON.parse(await body(req)); } catch { return send(res, 400, 'Send JSON: { events: [...] }.'); }
                    return json(res, 200, { noted: await noteActivity(ficheDir, said?.events) });
                }
                // Styles: each is a brief for whoever draws, and a theme for this page. One is in use.
                const styleRoute = /^\/__figurant\/api\/styles(?:\/([^/]+)(\/use)?)?$/.exec(path);
                if (styleRoute) {
                    const [, id, use] = styleRoute;
                    if (!id) return req.method === 'GET' ? json(res, 200, await styles.all()) : send(res, 405, 'GET.');
                    if (!isFicheName(id)) return send(res, 400, 'A style name is letters, digits and dashes.');
                    if (use) {
                        if (req.method !== 'POST') return send(res, 405, 'POST.');
                        return await styles.use(id) ? json(res, 200, await styles.all()) : send(res, 404, 'No such style.');
                    }
                    if (req.method === 'DELETE') {
                        const refused = await styles.remove(id);
                        return refused ? send(res, 409, refused) : json(res, 200, await styles.all());
                    }
                    if (req.method !== 'PUT') return send(res, 405, 'PUT or DELETE.');
                    let value;
                    try { value = JSON.parse(await body(req)); } catch { return send(res, 400, 'Send JSON: { name, prompt, theme }.'); }
                    const refused = await styles.save(id, value);
                    return refused ? send(res, 400, refused) : json(res, 200, await styles.all());
                }
                const [, customName] = /^\/__figurant\/api\/custom\/([^/]+)$/.exec(path) || [];
                if (customName !== undefined) {
                    const target = customFile(decodeURIComponent(customName));
                    if (!target) return send(res, 404, 'This character is not declared as customisable (custom: { name: "path/name.custom.js" } in figurant.config.js).');
                    if (req.method === 'GET') return json(res, 200, await readCustom(target));
                    if (req.method !== 'PUT') return send(res, 405, 'GET or PUT.');
                    let value;
                    try { value = JSON.parse(await body(req)); } catch { return send(res, 400, 'Send JSON: { face, faces, image }.'); }
                    const checked = await checkCustom(value);
                    if (typeof checked === 'string') return send(res, 400, checked);
                    await mkdir(dirname(target), { recursive: true });
                    await writeFile(target, customModule(target, checked));
                    return json(res, 200, checked);
                }
                const [, assetName] = /^\/__figurant\/api\/assets\/([^/]+)$/.exec(path) || [];
                if (assetName !== undefined) {
                    if (req.method !== 'POST') return send(res, 405, 'POST an image.');
                    let wanted;
                    try { wanted = decodeURIComponent(assetName); } catch { return send(res, 400, 'Bad name.'); }
                    const ext = extname(wanted).toLowerCase();
                    const stem = wanted.slice(0, wanted.length - ext.length).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
                    if (/[\\/]/.test(wanted) || !stem || !/^\.(png|jpe?g|webp|gif|svg)$/.test(ext) || !/^image\//.test(req.headers['content-type'] || '')) {
                        return send(res, 400, 'An image file: png, jpg, webp, gif or svg.');
                    }
                    let data;
                    try { data = await bytes(req, 3_000_000); } catch (error) { return send(res, error.tooLarge ? 413 : 400, 'The image is too large: 3 MB at most.'); }
                    await mkdir(join(root, 'assets'), { recursive: true });
                    await writeFile(join(root, 'assets', stem + ext), data);
                    return json(res, 200, { path: `assets/${stem}${ext}` });
                }
                const [, name] = /^\/__figurant\/api\/fiches\/([^/]+)$/.exec(path) || [];
                if (path === '/__figurant/api/fiches' && req.method === 'GET') {
                    let names = [];
                    try { names = (await readdir(ficheDir)).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)).filter(isFicheName); } catch { /* no fiche yet */ }
                    return json(res, 200, Object.fromEntries(await Promise.all(names.map(async n => [n, await readFiche(n)]))));
                }
                if (!name || !isFicheName(name)) return send(res, 400, 'A scene name is letters, digits, "-" and "_".');
                if (req.method === 'GET') return json(res, 200, await readFiche(name));
                if (req.method === 'POST') {
                    let said;
                    try { said = JSON.parse(await body(req)); } catch { return send(res, 400, 'Send JSON: { decision, note, answers }.'); }
                    let next;
                    try { next = addPersonEntry(await readFiche(name), said); } catch (error) { return send(res, 400, error.message); }
                    await mkdir(ficheDir, { recursive: true });
                    await writeFile(ficheFile(name), serializeFiche(next));
                    return json(res, 200, next);
                }
                return send(res, 405, 'GET or POST.');
            }
            if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'GET only.');
            const past = /^\/__figurant\/at\/([^/]+)\/(.+)$/.exec(path);
            if (past) {
                const body = await fileAt(past[1], past[2]);
                return body ? send(res, 200, body, TYPES[extname(past[2]).toLowerCase()] || 'application/octet-stream') : send(res, 404, 'Not in that version.');
            }
            if (path === '/__figurant' || path === '/__figurant/') { res.writeHead(302, { location: '/__figurant/atelier/' }); return res.end(); }
            if (path === '/__figurant/atelier/' || path === '/__figurant/atelier/index.html') {
                // The page arrives in the colours of the style in use: applied by
                // script they would come after a first paint in the default ones.
                const { active, styles: list } = await styles.all();
                const theme = list.find(style => style.id === active)?.theme ?? {};
                const colours = Object.entries(themeVars(theme)).map(([name, colour]) => `${name}:${colour}`);
                const html = await readFile(join(ENGINE, 'atelier', 'index.html'), 'utf8');
                return send(res, 200, colours.length ? html.replace('<html lang="en">', `<html lang="en" style="${colours.join(';')}">`) : html, TYPES['.html'], true);
            }
            if (path.startsWith('/__figurant/atelier/')) return file(res, join(ENGINE, 'atelier'), path.slice('/__figurant/atelier/'.length), true);
            if (path.startsWith('/__figurant/engine/')) return file(res, join(ENGINE, 'src'), path.slice('/__figurant/engine/'.length));
            return file(res, root, path);
        } catch (error) {
            send(res, 500, `Atelier error: ${error.message}`);
        }
    });
}
