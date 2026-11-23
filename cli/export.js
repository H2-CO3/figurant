// `Export` in the atelier: one item made ready for a website. A folder,
// exports/<name>/, with its files and all they import, the engine, the module
// that starts it, a page that shows it working, and a manual for whoever (a
// person or a coding assistant) puts it on the site. The GIF made by the page
// is saved beside them.

import { readFile, writeFile, mkdir, rm, readdir, cp } from 'node:fs/promises';
import { resolve, dirname, join, relative, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { take } from './take.js';
import { isFicheName } from './fiche.js';

const ENGINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const posix = path => path.split(sep).join('/');
const SKIP = ['node_modules', 'exports', 'fiches', '.git', 'dist'];

/** Every module of the project (not the engine's own, not what was exported before). */
async function modules(root, dir = root, out = []) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) { if (!SKIP.includes(entry.name) && !entry.name.startsWith('.') && path !== join(ENGINE, 'src') && path !== join(ENGINE, 'atelier') && path !== join(ENGINE, 'cli') && path !== join(ENGINE, 'tests')) await modules(root, path, out); }
        else if (['.js', '.mjs'].includes(extname(entry.name)) && !entry.name.endsWith('.config.js')) out.push(path);
    }
    return out;
}

/**
 * Under which name a module exports the thing written at `at`: the declaration
 * it is in if that one is exported, or else the export that uses it (a head
 * declared on its own, then the character that has it).
 */
function exportedAs(text, at) {
    const declared = [...text.matchAll(/^(export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=/gm)];
    const index = declared.findLastIndex(found => found.index <= at);
    if (index < 0) return null;
    if (declared[index][1]) return declared[index][2];
    const inner = new RegExp(`\\b${declared[index][2].replace(/\$/g, '\\$')}\\b`);
    for (let i = index + 1; i < declared.length; i++) {
        if (declared[i][1] && inner.test(text.slice(declared[i].index, declared[i + 1]?.index ?? text.length))) return declared[i][2];
    }
    return null;
}

/**
 * Where each thing is written in the project, and under which name its module exports it.
 * @param {string} root the project
 * @param {Array<{ kind: string, key: string, text: string, hint?: string }>} needles each thing, with a piece of its source
 * @returns {Promise<{ found: Array<{ kind: string, key: string, file: string, as: string }>, missing: string[] }>}
 */
export async function locate(root, needles = []) {
    root = resolve(root);
    const sources = await Promise.all((await modules(root)).map(async path => ({ path, text: await readFile(path, 'utf8') })));
    const found = [], missing = [];
    for (const needle of needles.slice(0, 80)) {
        // A name goes into the code that is written: it is a plain name of a known kind, or it is not taken.
        if (!['scene', 'character', 'prop', 'composition'].includes(needle?.kind) || !isFicheName(String(needle?.key ?? ''))) continue;
        // Several files may hold the same lines (two drawings begun from the same model):
        // the one that also says the thing's name is the one.
        const text = String(needle.text ?? '').slice(0, 8000), hint = typeof needle.hint === 'string' ? needle.hint.slice(0, 80) : '';
        const holding = text.length >= 8 ? sources.filter(candidate => candidate.text.includes(text)) : [];
        const source = holding.find(candidate => hint && (candidate.text.includes(`'${hint}'`) || candidate.text.includes(`"${hint}"`))) ?? holding[0];
        if (!source) { missing.push(needle.key); continue; }
        const as = exportedAs(source.text, source.text.indexOf(text));
        if (!as) { missing.push(needle.key); continue; }
        if (!found.some(item => item.kind === needle.kind && item.key === needle.key)) found.push({ kind: needle.kind, key: String(needle.key), file: posix(relative(root, source.path)), as });
    }
    return { found, missing };
}

/**
 * @param {object} options
 * @param {string} options.root   the project
 * @param {string} options.shop   'scenes' (an animation), 'compositions' (a scene of several), 'characters', 'emoji' or 'props'
 * @param {string} options.name   the item's name in the project's config
 * @param {string} [options.title] what a person calls it
 * @param {Array<{ kind: 'scene' | 'character' | 'prop' | 'composition', key: string, text: string, hint?: string }>} options.needles
 *        the item and all it uses, each with a piece of its source, by which its file is found
 *        (`hint`: its name, to tell apart two files that hold the same lines)
 * @returns {Promise<{ folder: string, files: string[], missing: string[] }>}
 */
export async function exportItem({ root, shop, name, title, needles = [] }) {
    root = resolve(root);
    if (!isFicheName(name)) throw new Error('The name of what is exported is letters, digits, "-" and "_".');
    const { found, missing } = await locate(root, needles);
    const own = { scenes: 'scene', compositions: 'composition', props: 'prop' }[shop] ?? 'character';
    if (!found.some(item => item.kind === own && item.key === name)) throw new Error(`"${name}" was not found in the project's files: nothing to export.`);

    const folder = join(root, 'exports', name);
    await rm(folder, { recursive: true, force: true });
    await mkdir(folder, { recursive: true });
    const taken = await take({ root, files: [...new Set(found.map(item => item.file))], to: join(folder, 'site'), within: true });
    await cp(join(ENGINE, 'docs', 'INTEGRATION.md'), join(folder, 'INTEGRATION.md'));

    const of = kind => found.filter(item => item.kind === kind);
    const imports = found.map(item => `import { ${item.as} } from './site/${item.file}';`);
    const list = kind => of(kind).map(item => `'${item.key}': ${item.as}`).join(', ');
    const lead = of('character')[0];
    const engine = `./site/${taken.engine}/index.js`;
    let start, markup, how;
    if (shop === 'compositions') {
        const scene = of('composition').find(item => item.key === name);
        markup = `<div data-figurant-scene="${name}" style="height: 320px"></div>`;
        start = `// Plays the scene "${name}" on the element that asks for it: its floor is the element's bottom edge.
import { playComposition, createClock, createStage, createFx${missing.includes('stickman') ? ', stickman' : ''} } from '${engine}';
${imports.join('\n')}

export function play(element = document.querySelector('[data-figurant-scene="${name}"]')) {
    const clock = createClock(), stage = createStage();
    const show = playComposition({
        stage, clock, composition: ${scene.as}, fx: createFx({ stage, clock }),
        characters: { ${[list('character'), missing.includes('stickman') ? 'stickman' : ''].filter(Boolean).join(', ')} }, animations: { ${list('scene')} }, props: { ${list('prop')} },
        // Smaller on a narrow element: the scene says how wide it wants to be.
        unit: Math.min(1.6, element.getBoundingClientRect().width * 0.92 / (${scene.as}.width ?? 600)),
        origin: () => { const box = element.getBoundingClientRect(); return [box.left + box.width / 2 + scrollX, box.bottom + scrollY]; },
    });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return show;
    let last = performance.now();
    const frame = now => { clock.tick(Math.min(50, now - last)); last = now; requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    return show;
}
if (document.querySelector('[data-figurant-scene="${name}"]')) play();
`;
        how = `A scene of several characters is played by \`play(element)\` in \`start.js\`: the element is its floor (the characters stand on its bottom edge), and the scene is centred in it. This player is the one the atelier uses; on a page that scrolls or resizes, check it there.`;
    } else {
        const cast = lead ? `{ character: ${lead.as} }` : '{ character: stickman }';
        const scenes = list('scene');
        markup = shop === 'scenes'
            ? `<div data-fig-spot="${name}" data-fig-scene="${name}" data-fig-on="view" data-fig-enter="none"></div>`
            : `<div data-fig-spot="${name}"></div>`;
        start = `// Starts "${name}" on the page: the character stands on the element marked for it.
import { start${lead ? '' : ', stickman'} } from '${engine}';
${imports.join('\n')}

export const show = start({
    cast: { default: ${cast} },${scenes ? `\n    scenes: { ${scenes} },` : ''}
});
for (const line of show.problems) console.warn('[figurant]', line);
`;
        how = shop === 'scenes'
            ? `The character stands on the top edge of the element marked \`data-fig-spot\`, and plays the animation when that element comes into view (\`data-fig-on\`: \`view\`, \`click\`, \`idle\` or \`attention\`).`
            : `The character stands on the top edge of the element marked \`data-fig-spot\`, looks around and reacts to the visitor.`;
    }
    await writeFile(join(folder, 'start.js'), start);
    await writeFile(join(folder, 'demo.html'), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${String(title ?? name).replace(/[<>&"]/g, '')}</title>
<style>
  :root { --fig-ink: #1c1c1c; --fig-paper: #faf9f6; --fig-accent: #b8860b; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: var(--fig-paper); color: var(--fig-ink); font: 16px/1.5 system-ui, sans-serif; }
  .floor { width: min(90vw, 900px); border-bottom: 2px solid color-mix(in srgb, var(--fig-ink) 22%, var(--fig-paper)); }
  .floor[data-fig-spot] { border-bottom: 0; border-top: 2px solid color-mix(in srgb, var(--fig-ink) 22%, var(--fig-paper)); height: 60px; margin-top: 45vh; }
</style>
</head>
<body>
${markup.replace('<div ', '<div class="floor" ')}
<script type="module" src="./start.js"></script>
</body>
</html>
`);
    await writeFile(join(folder, 'EXPORT.md'), `# Export: ${title ?? name}

Made in the Figurant atelier, ready to be put on a website. If you are a
coding assistant asked to integrate it: read this page, then
\`INTEGRATION.md\` beside it (the full manual: what may and may not be touched
on someone's site, how to check the result).

## What it is

${{ scenes: 'An animation: one character playing one thing.', compositions: 'A scene: several characters, each on its track in time.', props: 'A prop: an object a character holds or stands beside.' }[shop] ?? 'A character.'} Its name in the code is \`${name}\`.

${how}

## What is in this folder

| File | What it is |
| --- | --- |
| \`site/\` | Plain ES modules to copy into the site as they are: the engine (\`site/${taken.engine}/\`) and the item's own files. No dependency, no build step. |
| \`start.js\` | The module that starts it. It imports from \`./site/…\`: keep the two together, or adjust its paths. |
| \`demo.html\` | A page that shows it working. Serve this folder (any static server; modules do not load from \`file://\`) and open it. |
| \`${name}.gif\` | A film of it, when one was made: to show what it should look like, or to use as it is where scripts are not allowed. |
| \`INTEGRATION.md\` | The manual. |

Its own files:

${found.map(item => `- \`site/${item.file}\`: ${item.kind} \`${item.key}\`, exported as \`${item.as}\``).join('\n')}
${missing.length ? `\nNot in the project's files, so not copied: ${missing.map(key => `\`${key}\``).join(', ')}. (The stick figure comes with the engine: \`import { stickman } from '${engine}'\`. Anything else in this list must be found before it will play.)\n` : ''}
## Putting it on the site

1. Copy \`site/\` and \`start.js\` into a folder the site serves, for example \`/js/animation/\`.
2. On the page, put the element it lives on:

   \`\`\`html
   ${markup}
   \`\`\`

   On a real page this is usually an element the site already has (a title, a card, a button): add the attributes to it instead of adding an element.
3. Load the module on that page:

   \`\`\`html
   <script type="module" src="/js/animation/start.js"></script>
   \`\`\`

4. Give it the site's colours: \`--fig-ink\`, \`--fig-paper\` and \`--fig-accent\` on \`:root\` (see \`demo.html\`).

Then check it as \`INTEGRATION.md\` says (section "Before saying it is done"): on a phone width, with reduced motion, and that nothing of the site moved.
`);
    return { folder: posix(relative(root, folder)), files: taken.files, missing };
}
