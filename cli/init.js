// `figurant init`: a new project that already has something to look at. A
// stick figure, a figure whose head is an emoji or a picture (the one a
// drawing from the whiteboard is put on), one animation, a style to rewrite,
// and a git repository: the atelier's versions come from its history.

import { writeFile, mkdir, access, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';

const FILES = {
    'figurant.config.js': `// A Figurant project: the characters, props, animations and scenes made for
// one site. The atelier and the commands read this file; add what you make to it.
import { stickman } from 'figurant';
import { figure } from './characters/figure.js';
import { hello } from './scenes/hello.js';

const size = { unit: 1.5, scale: 0.75 };   // pixels per character unit, and how big it is drawn

export default {
    // Drawn characters. name: { character, unit, scale }
    cast: { stickman: { character: stickman, ...size } },
    // Figures whose head is an emoji or a picture.
    emoji: { figure: { character: figure, ...size } },
    // Animations: what one character does. One made for a character says so: character: 'name'.
    scenes: { hello },
    // Props, to show in the atelier.
    props: {},
    // Scenes: several characters, each on its track in time.
    compositions: {},
    // Characters a person may customise from the atelier, and where each choice is saved.
    custom: { figure: 'characters/figure.custom.js' },
};
`,
    'characters/figure.js': `// A stick figure with an emoji for a head, or any picture: the atelier's
// "Emoji & pictures" tab changes it, and a drawing made on the whiteboard is
// given legs by becoming its head. The choice is saved in figure.custom.js.
import { emojiHead } from 'figurant';
import custom from './figure.custom.js';

export const figure = {
    name: 'figure',
    line: 3,
    head: emojiHead({ face: custom.face || '🙂', faces: custom.faces, image: custom.image || undefined }),
};
`,
    'characters/figure.custom.js': `// Written by the atelier: the customisation chosen for this character.
// Change it from the atelier's page rather than by hand.
export default {
    face: "🙂",
    faces: {},
    image: null,
};
`,
    'scenes/hello.js': `// A hello: a hop and a wave. The smallest animation worth watching; it plays
// on any character. Copy it to start your own (see the guide: docs/SCENES.md).
import { moves } from 'figurant';

export const hello = {
    room: { left: 40, right: 40, up: 110 },
    async play(c) {
        await moves.hop(c, 24);
        await c.tween({ wave: 1 }, 220);
        await c.wait(900);
        await c.tween({ wave: 0 }, 220);
        await moves.blink(c);
        await c.wait(600);
    },
};
`,
    // What the atelier writes for itself, and what it makes for elsewhere, stay out of the history.
    '.gitignore': `node_modules/
exports/
fiches/.*
styles/.active
STYLE.md
.DS_Store
`,
};
const PROMPT = 'Say here, in plain words, what every character and prop of this project must look like. For example: realistic cartoon, with colour, volume and soft shadows; a dark outline; each character has its own material and palette.';

const git = (root, args) => new Promise(done => execFile('git', args, { cwd: root }, (error, out) => done(error ? null : String(out))));

/**
 * @param {string} root the folder to make a project of
 * @returns {Promise<{ files: string[], git: 'made' | 'kept' | 'none' | 'uncommitted' }>}
 */
export async function init(root) {
    if (await access(join(root, 'figurant.config.js')).then(() => true, () => false)) throw new Error(`${join(root, 'figurant.config.js')} exists already: this folder is a project.`);
    // Only an empty folder (or a new one): a project is committed whole, and that must never be somebody's other files.
    const there = await readdir(root).catch(() => []);
    if (there.length) throw new Error(`${root} is not empty (${there.slice(0, 3).join(', ')}${there.length > 3 ? '…' : ''}): give a new folder, for example "figurant init my-animations".`);
    for (const folder of ['characters', 'props', 'scenes', 'fiches', 'styles', 'assets']) await mkdir(join(root, folder), { recursive: true });
    for (const [name, text] of Object.entries(FILES)) {
        await writeFile(join(root, name), text);
    }
    // A first style, in use; the person changes it, or adds others, from the atelier.
    await writeFile(join(root, 'styles', 'my-style.json'), JSON.stringify({ name: 'My style', prompt: PROMPT, theme: {} }, null, 2) + '\n');
    await writeFile(join(root, 'styles', '.active'), 'my-style\n');
    await writeFile(join(root, 'STYLE.md'), `# Style: My style\n\n${PROMPT}\n`);

    // Its history: the atelier shows the versions of an animation from it.
    let made = 'none';
    if (await git(root, ['--version']) !== null) {
        if ((await git(root, ['rev-parse', '--is-inside-work-tree']))?.trim() === 'true') made = 'kept';
        else if (await git(root, ['init', '-q']) !== null) {
            await git(root, ['add', '-A']);
            made = await git(root, ['commit', '-q', '-m', 'A new Figurant project']) === null ? 'uncommitted' : 'made';
        }
    }
    return { files: [...Object.keys(FILES), 'styles/my-style.json'], git: made };
}
