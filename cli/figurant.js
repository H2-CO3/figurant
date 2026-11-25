#!/usr/bin/env node
// The figurant command. Each sub-command is something a coding LLM (or a
// person) can run from a project folder.
//
//   figurant init [folder]                    make a new project
//   figurant atelier [folder] [--port 4173]   open the local atelier
//                    [--lan]                  …and let the local network in, with an access code
//   figurant check [folder]                   check characters and scenes
//   figurant take <files...> --to <folder>    copy characters, props and scenes
//                                             into a website, with the engine
//   figurant inspect <drawing.svg>            say what a drawing is made of, and
//                                             whether it can be rigged
//   figurant show <workshop>/<name> "words"   take the person's page to an item and
//                                             say what you are doing there
//   figurant fiches [folder] [--wait]         list what the fiches ask for;
//                                             --wait returns only once one does

import { resolve, join } from 'node:path';
import { register } from 'node:module';
import { writeFile, mkdir, access, rm } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { randomBytes } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { createAtelierServer } from './server.js';
import { parseFiche, pending, isFicheName } from './fiche.js';
import { take } from './take.js';
import { init } from './init.js';
import { inspect } from './inspect.js';
import { readActivity, summarise } from './activity.js';
import { checkScenes } from '../src/director/scene.js';
import { checkCharacter } from '../src/director/cast.js';
import { checkProps } from '../src/props/check.js';
import { checkComposition } from '../src/director/composition.js';

// A project imports the engine by name; when it has no copy of its own, that name is this engine.
register('./resolve.mjs', import.meta.url);
import { describeProblems } from '../src/director/spots.js';

const [command, ...rest] = process.argv.slice(2);
const flag = name => { const i = rest.indexOf(`--${name}`); return i < 0 ? undefined : rest.splice(i, 2)[1]; };
const port = Number(flag('port') ?? 4173);
const to = flag('to');
const wait = rest.includes('--wait') && !!rest.splice(rest.indexOf('--wait'), 1);
const onLan = rest.includes('--lan') && !!rest.splice(rest.indexOf('--lan'), 1);
// `take` is run from the project folder and lists files; the others take a folder.
const root = resolve(['take', 'inspect', 'show'].includes(command) ? '.' : rest[0] ?? '.');

const loadConfig = async () => {
    const file = join(root, 'figurant.config.js');
    try { return (await import(pathToFileURL(file).href)).default; }
    catch (error) {
        console.error(`Could not load ${file}: ${error.message}\nA project has a figurant.config.js exporting { cast, scenes }.`);
        process.exit(2);
    }
};

const commands = {
    async atelier() {
        const config = await loadConfig();
        // --lan: other machines of the local network may open the atelier, with an access code made for this run.
        let lan = null;
        if (onLan) {
            const hosts = Object.values(networkInterfaces()).flat().filter(address => address && !address.internal && address.family === 'IPv4').map(address => address.address);
            const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            lan = { hosts, key: [...randomBytes(8)].map(byte => letters[byte % letters.length]).join('') };
        }
        const server = createAtelierServer({ root, fiches: config?.fiches ?? 'fiches', custom: config?.custom ?? {}, lan });
        server.on('error', error => {
            console.error(error.code === 'EADDRINUSE' ? `Port ${port} is taken: try --port ${port + 1}.` : error.message);
            process.exit(1);
        });
        // A project just cloned has no style in use yet: it starts in the one its config names.
        const styleDir = join(root, 'styles');
        if (typeof config?.style === 'string' && isFicheName(config.style) && !await access(join(styleDir, '.active')).then(() => true, () => false)) {
            try {
                const style = JSON.parse(await readFile(join(styleDir, `${config.style}.json`), 'utf8'));
                await writeFile(join(styleDir, '.active'), config.style + '\n');
                await writeFile(join(root, 'STYLE.md'), `# Style: ${style.name}\n\n${String(style.prompt).trim()}\n`);
            } catch { /* no such style: the person picks one in the atelier */ }
        }
        server.listen(port, lan ? '0.0.0.0' : '127.0.0.1', () => {
            console.log(`Atelier: http://localhost:${port}/__figurant/  (Ctrl+C to stop)`);
            // An assistant reads this just before it decides what to do next: starting the page is half the job.
            const path = text => /^[\w@%+=:,./-]+$/.test(text) ? text : JSON.stringify(text);
            const here = fileURLToPath(new URL('..', import.meta.url));
            console.log(`\nNo assistant is listening yet: what a person writes in the page is saved, and nothing answers it.\nIf you are a coding assistant, you are the one who answers. Run this in the background now,\nbefore you give the address, and again after each answer (it returns once per message):\n  node ${path(join(here, 'cli', 'figurant.js'))} fiches ${path(root)} --wait\nHow to answer, where files go, when to commit: ${path(join(here, 'docs', 'ATELIER.md'))}`);
            if (!lan) return;
            if (!lan.hosts.length) return console.log('--lan: this machine has no address on a local network.');
            console.log(`\nOpened to the local network. Whoever has the code can read this project and write\nmessages that your assistant will act on: give it only to people you trust.\n${lan.hosts.map(host => `  http://${host}:${port}/__figurant/`).join('\n')}\n  Access code: ${lan.key}\n`);
        });
    },

    async check() {
        const config = await loadConfig();
        const problems = [
            ...checkScenes(config?.scenes ?? {}),
            ...Object.values({ ...config?.cast, ...config?.emoji }).flatMap(member => checkCharacter(member?.character)),
            ...checkProps(config?.props ?? {}),
            ...Object.entries(config?.compositions ?? {}).flatMap(([name, composition]) => checkComposition(name, composition, {
                characters: Object.fromEntries(Object.entries({ ...config?.cast, ...config?.emoji }).map(([key, member]) => [key, member?.character])),
                animations: config?.scenes ?? {}, props: config?.props ?? {},
            })),
        ];
        // A sound a scene names must be a file of the project: this command can look, the page cannot.
        for (const [name, composition] of Object.entries(config?.compositions ?? {})) {
            for (const [i, cue] of (Array.isArray(composition?.sounds) ? composition.sounds : []).entries()) {
                if (typeof cue?.src !== 'string' || problems.some(problem => problem.composition === name && problem.field === `sounds[${i}].src`)) continue;
                const there = await access(resolve(root, cue.src)).then(() => true, () => false);
                if (!there) problems.push({ composition: name, field: `sounds[${i}].src`, value: cue.src, message: `plays "${cue.src}", a file the project does not have.`, fix: 'Put the sound file there, or correct the path: it starts from the project\'s folder.' });
            }
        }
        const counts = `${Object.keys({ ...config?.cast, ...config?.emoji }).length} character(s), ${Object.keys(config?.scenes ?? {}).length} scene(s), ${Object.keys(config?.props ?? {}).length} prop(s), ${Object.keys(config?.compositions ?? {}).length} composed scene(s)`;
        if (!problems.length) return console.log(`Nothing wrong found in ${counts}. This says they are well formed, not that the motion is good.`);
        console.log(describeProblems(problems).join('\n'));
        console.log(`${problems.length} problem(s) in ${counts}.`);
        process.exitCode = 1;
    },

    async init() {
        let made;
        try { made = await init(root); } catch (error) { console.error(error.message); process.exit(1); }
        const history = { made: 'A git repository was started: the atelier shows the versions of what you make from it.', kept: 'This folder is already under git: commit when you are ready.', uncommitted: 'A git repository was started, but nothing could be committed: set your name (git config user.name, user.email), then commit.', none: 'git was not found: without it the atelier cannot show earlier versions.' }[made.git];
        console.log(`Project made in ${root}:\n  figurant.config.js   a stick figure, a figure with an emoji or a picture for a head, one animation\n  characters/  props/  scenes/  styles/  fiches/  assets/\n${history}\nNext: figurant atelier ${rest[0] ?? '.'}   then open the address it prints.`);
    },

    // figurant show props/teacup "Drawing the cup": takes the person's page there and says what is going on.
    async show() {
        const config = await loadConfig();
        const dir = join(root, config?.fiches ?? 'fiches');
        const [see, ...words] = rest.filter(arg => !arg.startsWith('--'));
        if (!/^(scenes|characters|emoji|props|compositions)(\/[a-z0-9][a-z0-9_-]{0,63})?$/i.test(see ?? '')) { console.error('Where? figurant show <scenes|characters|emoji|props|compositions>/<name> "what you are doing"'); process.exit(2); }
        await mkdir(dir, { recursive: true });
        await writeFile(join(dir, '.screen'), JSON.stringify({ see, say: words.join(' '), at: new Date().toISOString() }));
        await writeFile(join(dir, '.working'), new Date().toISOString());
        console.log(`The atelier shows ${see}${words.length ? `: ${words.join(' ')}` : ''}`);
    },

    async inspect() {
        if (!rest[0]) { console.error('Which drawing? figurant inspect assets/teapot.svg'); process.exit(2); }
        let text;
        try { text = await readFile(resolve(rest[0]), 'utf8'); } catch { console.error(`No such file: ${rest[0]}`); process.exit(1); }
        const report = inspect(text, rest[0]);
        console.log(report.lines.join('\n'));
        process.exitCode = report.ok ? 0 : 1;
    },

    async take() {
        if (!to) { console.error('Say where: figurant take library/default/cartoon-realiste/characters/teapot.js --to ../my-site/public/js/animation'); process.exit(2); }
        try {
            const done = await take({ root, files: rest.filter(arg => !arg.startsWith('--')), to });
            console.log(`Copied to ${resolve(to)}:\n  ${done.engine}/  (the engine)\n  ${done.files.join('\n  ')}\nNext: docs/INTEGRATION.md.`);
        } catch (error) { console.error(error.message); process.exit(1); }
    },

    // figurant activity: what the person has been doing in the atelier, in a few lines.
    async activity() {
        const config = await loadConfig();
        console.log(summarise(await readActivity(join(root, config?.fiches ?? 'fiches'))).join('\n'));
    },

    async fiches() {
        const config = await loadConfig();
        const dir = join(root, config?.fiches ?? 'fiches');
        for (;;) {
            let files = [];
            try { files = (await readdir(dir)).filter(f => f.endsWith('.md') && isFicheName(f.slice(0, -3))); } catch { /* none yet */ }
            const lines = [];
            for (const f of files) {
                const line = pending(parseFiche(await readFile(join(dir, f), 'utf8'), f.slice(0, -3)));
                if (line) lines.push(`${line}   (${join(dir, f)})`);
            }
            if (lines.length && wait) {
                // Woken: from now until it answers, the atelier shows the person that work is under way.
                await mkdir(dir, { recursive: true });
                await writeFile(join(dir, '.working'), new Date().toISOString());
            }
            // With what waits, what the person was doing: it says what they have in mind.
            if (lines.length) { const seen = await readActivity(dir); if (seen.length) lines.push('', ...summarise(seen)); }
            if (lines.length || !wait) return console.log(lines.length ? lines.join('\n') : 'No fiche is waiting for an answer.');
            await rm(join(dir, '.working'), { force: true });
            await rm(join(dir, '.screen'), { force: true });
            // --wait: come back when a person has written something. An agent
            // runs this in the background and is woken by its exit.
            // The atelier shows the person that someone is listening.
            await mkdir(dir, { recursive: true });
            await writeFile(join(dir, '.listening'), new Date().toISOString());
            await new Promise(done => setTimeout(done, 1500));
        }
    },
};

if (!commands[command]) {
    console.log('Usage: figurant <init|atelier|check|inspect|show|fiches|activity|take> [folder] [--port 4173] [--wait]');
    process.exit(command ? 2 : 0);
}
await commands[command]();
