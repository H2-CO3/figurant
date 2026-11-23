// `figurant take`: copies characters, props and scenes into a website, with
// the engine, as plain ES modules that need no build step.
//
// The chosen files are copied with everything they import from the project;
// `import ... from 'figurant'` is rewritten to point at the engine copy.

import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { resolve, dirname, relative, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { replaceable } from './replace.js';

const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// A file a module points to by address: new URL('./picture.png', import.meta.url).
const ASSET = /new\s+URL\(\s*(['"])(\.[^'"]+)\1\s*,\s*import\.meta\.url\s*\)/g;
const IMPORT = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"]+)\2/g;
const posix = path => path.split(sep).join('/');

/**
 * @param {object} options
 * @param {string} options.root   the project the files come from
 * @param {string[]} options.files paths of the modules to take, relative to root
 * @param {string} options.to     destination folder, in the website
 * @param {boolean} [options.within] allow a destination inside the project (its exports folder)
 * @returns {Promise<{ engine: string, files: string[] }>} what was written
 */
export async function take({ root, files, to, within = false }) {
    root = resolve(root);
    const dest = resolve(to);
    if (!files.length) throw new Error('Nothing to take: name at least one file, for example library/default/cartoon-realiste/characters/teapot.js.');
    // (`within`: an export made by the atelier goes to the project's own exports folder.)
    if (dest === root || (dest.startsWith(root + sep) && !within)) throw new Error('The destination is inside the project itself: give a folder of the website.');

    // Copy the engine first: its folder is replaced, never merged.
    const engine = join(dest, 'figurant');
    await replaceable(engine);
    await rm(engine, { recursive: true, force: true });
    await cp(join(ENGINE, 'src'), engine, { recursive: true });

    const written = [];
    const seen = new Set();
    const copy = async file => {
        const source = resolve(root, file);
        if (source !== root && !source.startsWith(root + sep)) throw new Error(`${file} is outside the project: only its own files can be taken.`);
        if (seen.has(source)) return;
        seen.add(source);
        let text;
        try { text = await readFile(source, 'utf8'); }
        catch { throw new Error(`No such file in the project: ${relative(root, source)}.`); }
        const target = join(dest, relative(root, source));
        const jobs = [];
        text = text.replace(IMPORT, (whole, lead, quote, specifier) => {
            if (specifier === 'figurant') {
                let path = posix(relative(dirname(target), join(engine, 'index.js')));
                if (!path.startsWith('.')) path = './' + path;
                return `${lead}${quote}${path}${quote}`;
            }
            if (specifier.startsWith('.')) {
                const next = resolve(dirname(source), specifier);
                // The project's own copy of the engine is the engine: point at the one just copied.
                const inEngine = relative(join(ENGINE, 'src'), next);
                if (root === ENGINE && !inEngine.startsWith('..')) {
                    let path = posix(relative(dirname(target), join(engine, inEngine)));
                    if (!path.startsWith('.')) path = './' + path;
                    return `${lead}${quote}${path}${quote}`;
                }
                jobs.push(relative(root, next));
            }
            return whole;
        });
        for (const [, , address] of text.matchAll(ASSET)) {
            const asset = resolve(dirname(source), address);
            if (!asset.startsWith(root + sep)) throw new Error(`${relative(root, source)} points to ${address}, which is outside the project.`);
            if (seen.has(asset)) continue;
            seen.add(asset);
            const to = join(dest, relative(root, asset));
            await mkdir(dirname(to), { recursive: true });
            try { await cp(asset, to); } catch { throw new Error(`${relative(root, source)} points to a file that does not exist: ${relative(root, asset)}.`); }
            written.push(posix(relative(dest, to)));
        }
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, text);
        written.push(posix(relative(dest, target)));
        for (const job of jobs) await copy(job);
    };
    for (const file of files) await copy(file);
    return { engine: posix(relative(dest, engine)), files: written.sort() };
}
