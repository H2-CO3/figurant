// What a fresh agent tripped on, on 2026-11-20, when it built a character, a
// scene and an integration from the documentation alone. Each test here is
// one of its findings, reproduced.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createClock, advance, createStage, createDirector, createProp, start, checkProp, describeProblems, stickman } from '../src/index.js';
import { fakeDocument, fakePage } from './helpers/fake-dom.js';

const run = promisify(execFile);
const CLI = new URL('../cli/figurant.js', import.meta.url).pathname;
const figurant = (cwd, ...args) => run(process.execPath, [CLI, ...args], { cwd }).then(r => ({ code: 0, ...r }), e => ({ code: e.code, stdout: e.stdout, stderr: e.stderr }));

test('a project outside this repository imports "figurant" and the commands still load it', async () => {
    const root = await mkdtemp(join(tmpdir(), 'figurant-own-'));
    try {
        await mkdir(join(root, 'scenes'));
        await writeFile(join(root, 'scenes/hi.js'), "import { moves } from 'figurant';\nexport const hi = { async play(c) { await moves.blink(c); } };\n");
        await writeFile(join(root, 'figurant.config.js'), "import { stickman } from 'figurant';\nimport { hi } from './scenes/hi.js';\nexport default { cast: { default: { character: stickman } }, scenes: { hi }, props: { broken: { shapes: 3 } } };\n");
        const check = await figurant(root, 'check');
        assert.match(check.stdout, /prop "broken"/, check.stdout + check.stderr);
        assert.equal(check.code, 1, 'and a badly formed prop is a problem');
        assert.match((await figurant(root, 'fiches')).stdout, /No fiche is waiting/);
    } finally { await rm(root, { recursive: true, force: true }); }
});

test('init makes a project the commands accept as it is', async () => {
    const root = await mkdtemp(join(tmpdir(), 'figurant-new-'));
    try {
        const made = await figurant(root, 'init');
        assert.equal(made.code, 0, made.stderr);
        assert.ok((await readdir(root)).includes('figurant.config.js'));
        const check = await figurant(root, 'check');
        assert.equal(check.code, 0, check.stdout + check.stderr);
        const again = await figurant(root, 'init');
        assert.notEqual(again.code, 0, 'it never overwrites a project');
        assert.match(await readFile(join(root, 'figurant.config.js'), 'utf8'), /from 'figurant'/);
    } finally { await rm(root, { recursive: true, force: true }); }
});

test('start() does everything an integration needs, and adds nothing to the page under reduced motion', async () => {
    const spot = { attrs: { 'data-fig-spot': 'a', 'data-fig-enter': 'none' }, rect: { x: 100, y: 300, w: 600, h: 200 } };
    const calm = fakePage({ width: 1000, height: 800, elements: [spot], media: { '(prefers-reduced-motion: reduce)': true } });
    const before = calm.doc.body.children.length;
    const quiet = start({ cast: { default: { character: stickman } }, win: calm.win, doc: calm.doc });
    assert.equal(calm.doc.body.children.length, before, 'nothing was added to the page');
    assert.equal(quiet.reduced, true);
    assert.deepEqual(quiet.problems, []);
    quiet.stop();

    const page = fakePage({ width: 1000, height: 800, elements: [spot] });
    const clock = createClock();
    const live = start({ cast: { default: { character: stickman } }, scenes: { odd: { rom: {}, play() {} } }, win: page.win, doc: page.doc, clock });
    assert.equal(live.reduced, false);
    assert.equal(live.problems.length, 1, 'mistakes are handed back, ready to print');
    assert.equal(typeof live.problems[0], 'string');
    await advance(clock, 200);
    assert.equal(live.director.members[0].mode, 'perched');
    assert.ok(page.doc.body.children.length > before);
    live.stop();
    assert.equal(page.doc.body.children.length, before, 'stop removes what it added');
});

test('the room kept for a header may be a function, read again as the layout changes', async () => {
    let header = 0, played = 0;
    const page = fakePage({ width: 1000, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a', 'data-fig-enter': 'none', 'data-fig-scene': 's', 'data-fig-on': 'idle', 'data-fig-sit': 'no' }, rect: { x: 100, y: 300, w: 600, h: 200 } }] });
    const clock = createClock();
    createDirector({
        stage: createStage({ doc: page.doc, win: page.win }), clock, win: page.win, doc: page.doc, clearance: () => header,
        cast: { default: { character: stickman } }, scenes: { s: { room: { up: 400 }, async play() { played++; } } },
    }).start();
    await advance(clock, 6000);
    assert.ok(played >= 1, 'with no header there is room above it');
    played = 0;
    await advance(clock, 8000);
    assert.ok(played >= 1, 'and it plays again each time it is left alone');
    header = 120; played = 0;
    await advance(clock, 8000);
    assert.equal(played, 0, 'a taller header leaves no room: the scene waits');
});

test('a prop shape may ask for the accent colour, and a prop is checked like a scene', () => {
    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const loaf = { name: 'loaf', shapes: [{ tag: 'path', attrs: { d: 'M 0 0 L 9 0' }, accent: true, fill: true }, { tag: 'path', attrs: { d: 'M 0 2 L 9 2' } }], points: { grip: [0, 0] } };
    const prop = createProp({ stage, prop: loaf });
    const [gold, plain] = prop.layer.children;
    assert.match(gold.attrs.stroke, /--fig-accent/);
    assert.match(plain.attrs.stroke, /--fig-ink/);
    assert.deepEqual(checkProp('loaf', loaf), []);
    assert.deepEqual(checkProp('layers', { points: {}, layers: [loaf] }), [], 'a prop may be made of layers');
    const lines = describeProblems([...checkProp('a', { shapes: 3 }), ...checkProp('b', { name: 'b', shapes: [{ attrs: {} }], points: { grip: [0] } }), ...checkProp('c', null)]);
    assert.equal(lines.length, 5, lines.join('\n'));
    for (const line of lines) assert.match(line, /^prop "/);
});

test('an emoji head may show an image instead of a glyph', async () => {
    const { emojiHead, checkCharacter } = await import('../src/index.js');
    const { createFigure } = await import('../src/figure/figure.js');
    const { doc, win } = fakeDocument();
    const character = { name: 'me', head: emojiHead({ face: '🙂', image: 'https://example.test/face.png' }) };
    assert.deepEqual(checkCharacter(character), []);
    const figure = createFigure({ stage: createStage({ doc, win }), character });
    figure.render([100, 100]);
    const find = (node, tag) => (node.tag === tag ? node : node.children.map(child => find(child, tag)).find(Boolean));
    const image = find(figure.layer, 'image');
    assert.equal(image.attrs.href, 'https://example.test/face.png');
    assert.equal(Number(image.attrs.width), Number(image.attrs.height), 'in a square the size of the glyph');
    assert.equal(find(figure.layer, 'text'), undefined, 'and no glyph is drawn');
    assert.equal(emojiHead({ image: 'x.png' }).create !== undefined, true, 'an image alone is enough');
});

test('the atelier saves a character\'s customisation as a module, and images as assets, and nothing else', async () => {
    const { createAtelierServer } = await import('../cli/server.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-custom-'));
    await mkdir(join(root, 'characters'));
    const server = createAtelierServer({ root, custom: { emoji: 'characters/emoji.custom.js' } }).listen(0, '127.0.0.1');
    await new Promise(done => server.once('listening', done));
    const base = `http://127.0.0.1:${server.address().port}/__figurant/api/`;
    const call = async (path, init) => { const r = await fetch(base + path, init); return { status: r.status, text: await r.text() }; };
    const put = (name, value) => call(`custom/${name}`, { method: 'PUT', body: JSON.stringify(value) });
    try {
        assert.equal((await put('emoji', { face: '😎', faces: { wide: '😳' } })).status, 200);
        const module = await import(join(root, 'characters/emoji.custom.js') + '?1');
        assert.deepEqual(module.default, { face: '😎', faces: { wide: '😳' }, image: null });

        const png = Buffer.from('89504e470d0a1a0a', 'hex');
        const up = await call('assets/My%20F%C3%A2ce!.png', { method: 'POST', body: png, headers: { 'content-type': 'image/png' } });
        assert.equal(up.status, 200, up.text);
        const { path } = JSON.parse(up.text);
        assert.equal(path, 'assets/my-face.png', 'the name is made safe');
        assert.deepEqual(await readFile(join(root, path)), png);
        assert.equal((await put('emoji', { face: '😎', image: path })).status, 200);
        const withImage = (await import(join(root, 'characters/emoji.custom.js') + '?2')).default;
        assert.ok(withImage.image.endsWith('/assets/my-face.png') && withImage.image.startsWith('file:'), 'the image is found from wherever the module is');
        assert.equal(JSON.parse((await call('custom/emoji')).text).image, 'assets/my-face.png', 'and read back as the project path');

        const svg = await call('assets/drawing.svg', { method: 'POST', body: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', headers: { 'content-type': 'image/svg+xml' } });
        assert.equal(svg.status, 200);
        const served = await fetch(base.replace('/__figurant/api/', '/assets/drawing.svg'));
        assert.match(served.headers.get('content-security-policy'), /sandbox/, 'an imported drawing cannot run a script when opened');
        await rm(join(root, 'assets/drawing.svg'));
        // What must be refused.
        assert.equal((await put('other', { face: '🙂' })).status, 404, 'only what the project declares can be customised');
        assert.equal((await put('emoji', { face: 'x'.repeat(40) })).status, 400);
        assert.equal((await put('emoji', { face: 'ab' })).status, 400, 'letters are not an emoji');
        assert.equal((await call('assets/page.png', { method: 'POST', body: '<html>', headers: { 'content-type': 'text/html' } })).status, 400, 'an image must be sent as an image');
        assert.equal((await put('emoji', { face: '🙂', image: '../../etc/passwd' })).status, 400);
        assert.equal((await put('emoji', { face: '🙂', image: 'assets/missing.png' })).status, 400);
        assert.equal((await put('emoji', { face: "'); process.exit(); ('" })).status, 400);
        assert.equal((await call('assets/x.js', { method: 'POST', body: 'alert(1)', headers: { 'content-type': 'text/javascript' } })).status, 400, 'only images');
        assert.equal((await call('assets/..%2Fx.png', { method: 'POST', body: png, headers: { 'content-type': 'image/png' } })).status, 400);
        assert.equal((await call('assets/big.png', { method: 'POST', body: Buffer.alloc(3_100_000), headers: { 'content-type': 'image/png' } })).status, 413);
        assert.equal((await call('custom/emoji', { method: 'PUT', body: '{"face":"🙂"}', headers: { origin: 'http://evil.example' } })).status, 403);
        assert.deepEqual((await readdir(root)).sort(), ['assets', 'characters'], 'nothing was written elsewhere');
        assert.deepEqual(await readdir(join(root, 'assets')), ['my-face.png']);
    } finally { server.close(); await rm(root, { recursive: true, force: true }); }
});

test('take brings along the files a module points to with new URL(..., import.meta.url)', async () => {
    const { take } = await import('../cli/take.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-assets-'));
    const site = await mkdtemp(join(tmpdir(), 'figurant-site-'));
    try {
        await mkdir(join(root, 'characters')); await mkdir(join(root, 'assets'));
        await writeFile(join(root, 'assets/face.png'), 'PNG');
        await writeFile(join(root, 'characters/me.custom.js'), "export default { face: '🙂', image: new URL('../assets/face.png', import.meta.url).href };\n");
        await writeFile(join(root, 'characters/me.js'), "import custom from './me.custom.js';\nexport const me = { name: 'me', custom };\n");
        const done = await take({ root, files: ['characters/me.js'], to: site });
        assert.deepEqual(done.files, ['assets/face.png', 'characters/me.custom.js', 'characters/me.js']);
        assert.equal(await readFile(join(site, 'assets/face.png'), 'utf8'), 'PNG');
        const { me } = await import(join(site, 'characters/me.js'));
        assert.ok(me.custom.image.endsWith(join(site, 'assets/face.png')));
        await writeFile(join(root, 'characters/bad.js'), "export const x = new URL('../../outside.png', import.meta.url).href;\n");
        await assert.rejects(take({ root, files: ['characters/bad.js'], to: site }), /outside the project/);
    } finally { await rm(root, { recursive: true, force: true }); await rm(site, { recursive: true, force: true }); }
});

// Seen by the second fresh agent, frame by frame: a prop was visible for one
// frame at the page's origin, before its first placement.
test('a prop is not visible before it has been placed once', () => {
    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const prop = createProp({ stage, prop: { name: 'loaf', shapes: [{ tag: 'path', attrs: { d: 'M 0 0 L 9 0' } }], points: {} } });
    assert.equal(prop.layer.attrs.visibility, 'hidden', 'created out of sight');
    prop.render([100, 100]);
    assert.equal(prop.layer.attrs.visibility, 'visible', 'shown once it has a place');
});

test('the atelier keeps several styles, one in use, and tells whether an assistant is listening', async () => {
    const { createAtelierServer } = await import('../cli/server.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-style-'));
    const server = createAtelierServer({ root }).listen(0, '127.0.0.1');
    await new Promise(done => server.once('listening', done));
    const base = `http://127.0.0.1:${server.address().port}/__figurant/api/`;
    const call = async (path, init) => { const r = await fetch(base + path, init); return { status: r.status, text: await r.text() }; };
    try {
        const list = async () => JSON.parse((await call('styles')).text);
        const put = (id, value, headers) => call(`styles/${id}`, { method: 'PUT', body: JSON.stringify(value), headers });
        assert.deepEqual(await list(), { active: null, styles: [] });
        assert.equal((await put('cartoon', { name: 'Cartoon', prompt: 'Realistic cartoon.', theme: { accent: '#3B5BDB' } })).status, 200);
        assert.equal((await put('ink', { name: 'Ink', prompt: 'Brush strokes.', theme: {} })).status, 200);
        assert.deepEqual((await list()).styles.map(style => [style.id, style.name, style.theme.accent]), [['cartoon', 'Cartoon', '#3b5bdb'], ['ink', 'Ink', undefined]]);
        assert.equal((await call('styles/cartoon/use', { method: 'POST' })).status, 200);
        assert.equal((await list()).active, 'cartoon');
        assert.equal(await readFile(join(root, 'STYLE.md'), 'utf8'), '# Style: Cartoon\n\nRealistic cartoon.\n', 'the style in use is written where whoever draws will read it');
        await put('cartoon', { name: 'Cartoon', prompt: 'Realistic cartoon, soft light.', theme: {} });
        assert.match(await readFile(join(root, 'STYLE.md'), 'utf8'), /soft light/, 'editing the style in use updates it');
        assert.equal((await call('styles/cartoon', { method: 'DELETE' })).status, 409, 'the style in use cannot be deleted');
        assert.equal((await call('styles/ink', { method: 'DELETE' })).status, 200);
        assert.deepEqual((await list()).styles.map(style => style.id), ['cartoon']);
        assert.equal((await call('styles/ink/use', { method: 'POST' })).status, 404);
        assert.equal((await put('bad', { name: 'x', prompt: 'y', theme: { accent: 'red; background:url(x)' } })).status, 400, 'a theme colour is a colour');
        assert.equal((await put('bad', { name: '', prompt: 'y' })).status, 400);
        assert.equal((await put('..%2Fx', { name: 'x', prompt: 'y' })).status, 400);
        assert.equal((await put('evil', { name: 'x', prompt: 'y' }, { origin: 'http://evil.example' })).status, 403);
        assert.deepEqual((await readdir(join(root, 'styles'))).sort(), ['.active', 'cartoon.json']);

        assert.equal(JSON.parse((await call('listening')).text).listening, false, 'nobody waits yet');
        await writeFile(join(root, 'figurant.config.js'), 'export default {};');
        const waiting = execFile(process.execPath, [CLI, 'fiches', '--wait'], { cwd: root });
        try {
            let heard = false;
            for (let i = 0; i < 40 && !heard; i++) { await new Promise(done => setTimeout(done, 150)); heard = JSON.parse((await call('listening')).text).listening; }
            assert.equal(heard, true, 'an assistant waiting on the fiches is seen');
        } finally { waiting.kill(); }
        assert.deepEqual(JSON.parse((await call('fiches')).text), {}, 'the mark it leaves is not taken for a fiche');
    } finally { server.close(); await rm(root, { recursive: true, force: true }); }
});

test('inspect says what a drawing is made of, and says no when it cannot be rigged', async () => {
    const { inspect } = await import('../cli/inspect.js');
    const good = inspect('<svg viewBox="0 0 280 200"><g id="body"><path d="M0 0" fill="#ff0000"/></g><circle id="eye-left" r="3"/><circle id="eye-right" r="3"/></svg>');
    assert.equal(good.ok, true);
    assert.match(good.lines.join('\n'), /Size: 280 by 200/);
    assert.match(good.lines.join('\n'), /scale by 0\.50/);
    assert.match(good.lines.join('\n'), /3 \(1 path, 2 circle\)/);
    assert.match(good.lines.join('\n'), /eye-left \(circle\)/);
    assert.match(good.lines.join('\n'), /can be rigged/);
    assert.equal(inspect('\x89PNG...').ok, false, 'pixels are refused, with the reason');
    assert.match(inspect('\x89PNG...').lines[0], /pixels/);
    const mess = inspect('<svg viewBox="0 0 10 10">' + '<path d="M0 0"/>'.repeat(400) + '</svg>');
    assert.equal(mess.ok, false);
    assert.match(mess.lines.at(-1), /Do not guess/);
    assert.match(inspect('<svg viewBox="0 0 10 10"><path d="M0 0"/></svg>').lines.at(-1), /one single shape/);
    const root = await mkdtemp(join(tmpdir(), 'figurant-inspect-'));
    try {
        await writeFile(join(root, 'a.svg'), '<svg viewBox="0 0 100 100"><rect id="box"/><rect/></svg>');
        const out = await figurant(root, 'inspect', 'a.svg');
        assert.equal(out.code, 0, out.stderr);
        assert.match(out.stdout, /Named parts: box \(rect\)/);
    } finally { await rm(root, { recursive: true, force: true }); }
});

// 2026-11-20: the owner asked for a chair to become a chaise longue. The
// message arrived and was answered in 56 seconds, but nothing on the page said
// that work was under way (he sent four messages, two of them empty), and the
// answer was a new prop elsewhere: the page still showed the chair.
test('the page can tell that an assistant is at work, and an answer can say where to look', async () => {
    const { createAtelierServer } = await import('../cli/server.js');
    const { parseFiche, serializeFiche } = await import('../cli/fiche.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-work-'));
    await writeFile(join(root, 'figurant.config.js'), 'export default {};');
    await mkdir(join(root, 'fiches'));
    const server = createAtelierServer({ root }).listen(0, '127.0.0.1');
    await new Promise(done => server.once('listening', done));
    const base = `http://127.0.0.1:${server.address().port}/__figurant/api/`;
    const state = async () => JSON.parse(await (await fetch(base + 'listening')).text());
    try {
        assert.deepEqual(await state(), { listening: false, working: false });
        // Someone writes; an assistant that was waiting wakes up and gets to work.
        await writeFile(join(root, 'fiches/prop-chair.md'), '# prop-chair\nstatus: draft\n\n## D person\ndecision: redo\nMake it a chaise longue.\n');
        const woke = await figurant(root, 'fiches', '--wait');
        assert.match(woke.stdout, /prop-chair: to redo/);
        assert.deepEqual(await state(), { listening: false, working: true }, 'between waking and answering, it is at work');
        // It answers: the work is over.
        await writeFile(join(root, 'fiches/prop-chair.md'), '# prop-chair\nstatus: draft\n\n## D person\ndecision: redo\nMake it a chaise longue.\n\n## D2 llm\nDone.\n=> props/lounger\n');
        assert.equal((await state()).working, false, 'no fiche waits any more');

        const fiche = parseFiche(await readFile(join(root, 'fiches/prop-chair.md'), 'utf8'));
        assert.equal(fiche.entries[1].see, 'props/lounger', 'the answer says where the result is');
        assert.equal(fiche.entries[1].text, 'Done.', 'and that line is not shown as text');
        assert.equal(parseFiche(serializeFiche(fiche)).entries[1].see, 'props/lounger');
        assert.equal(parseFiche('# a\n\n## D person\n=> props/x\n').entries[0].see, undefined, 'only an assistant points elsewhere');
        assert.equal(parseFiche('# a\n\n## D llm\n=> ../../etc\n').entries[0].see, undefined, 'and only to a workshop and a name');
    } finally { server.close(); await rm(root, { recursive: true, force: true }); }
});

test('an assistant can take the person\'s page to what it is working on, and say what it is doing', async () => {
    const { createAtelierServer } = await import('../cli/server.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-screen-'));
    await writeFile(join(root, 'figurant.config.js'), 'export default {};');
    const server = createAtelierServer({ root }).listen(0, '127.0.0.1');
    await new Promise(done => server.once('listening', done));
    const state = async () => JSON.parse(await (await fetch(`http://127.0.0.1:${server.address().port}/__figurant/api/listening`)).text());
    try {
        assert.equal((await state()).screen, undefined);
        const shown = await figurant(root, 'show', 'props/teacup', 'Drawing', 'the', 'cup');
        assert.equal(shown.code, 0, shown.stderr);
        const { screen } = await state();
        assert.equal(screen.see, 'props/teacup');
        assert.equal(screen.say, 'Drawing the cup');
        assert.ok(screen.at, 'each call is told apart from the one before');
        assert.equal((await state()).working, true, 'saying where it is counts as being at work');
        assert.equal((await figurant(root, 'show', 'compositions/breakfast', 'Composing')).code, 0, 'a scene is a place to show too');
        assert.equal((await state()).screen.see, 'compositions/breakfast');
        assert.notEqual((await figurant(root, 'show', '../../etc')).code, 0, 'only a workshop and a name');
        await writeFile(join(root, 'fiches/.screen'), JSON.stringify({ see: 'props/<script>', say: 'x' }));
        assert.equal((await state()).screen, undefined, 'a forged mark is ignored');
        await writeFile(join(root, 'fiches/.screen'), JSON.stringify({ see: 'props/cup', say: 'x'.repeat(500) }));
        assert.equal((await state()).screen.say.length, 140, 'what it says is kept short');
    } finally { server.close(); await rm(root, { recursive: true, force: true }); }
});

test('the atelier page arrives already in the colours of the style in use, so a reload does not flash the default ones', async () => {
    const { createAtelierServer } = await import('../cli/server.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-theme-'));
    const server = createAtelierServer({ root }).listen(0, '127.0.0.1');
    await new Promise(done => server.once('listening', done));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const page = async () => (await fetch(origin + '/__figurant/atelier/')).text();
    try {
        assert.doesNotMatch(await page(), /<html[^>]*style=/, 'no style in use: the page keeps its own colours');
        await mkdir(join(root, 'styles'));
        await writeFile(join(root, 'styles/gold.json'), JSON.stringify({ name: 'Gold', prompt: 'x', theme: { paper: '#fbf7ee', accent: '#b8860b' } }));
        await writeFile(join(root, 'styles/.active'), 'gold\n');
        const html = await page();
        assert.match(html, /<html[^>]*style="[^"]*--accent:#b8860b/, 'the accent is there before any script runs');
        assert.match(html, /<html[^>]*style="[^"]*--paper:#fbf7ee/);
        assert.doesNotMatch(html, /--ink:/, 'a colour the style does not set is left to the page');
        assert.match(await (await fetch(origin + '/__figurant/atelier/index.html')).text(), /--accent:#b8860b/, 'by its file name too');
        // A style file edited by hand cannot put anything else than a colour in the page.
        await writeFile(join(root, 'styles/gold.json'), JSON.stringify({ name: 'Gold', prompt: 'x', theme: { accent: '#b8860b"><script>x</script>', ink: '#101010' } }));
        const safe = await page();
        assert.doesNotMatch(safe, /<script>x/);
        assert.match(safe, /<html[^>]*style="--ink:#101010"/);
    } finally { server.close(); await rm(root, { recursive: true, force: true }); }
});

test('an order answered under another name is no longer an order, and the latest answer says where to look', async () => {
    const { fulfilled, latestPointer } = await import('../atelier/orders.js');
    const exists = (shop, name) => shop === 'scenes' && name === 'backflip-tabby';
    const person = { author: 'person', date: '2026-11-21T21:15:00Z', text: 'the cat does a backflip' };
    const answer = { author: 'llm', date: '2026-11-21T21:32:00Z', text: 'Done.', see: 'scenes/backflip-tabby' };
    assert.equal(fulfilled({ entries: [person] }, exists), null, 'not answered: still an order');
    assert.equal(fulfilled({ entries: [person, { ...answer, see: undefined }] }, exists), null, 'answered without saying where: still listed');
    assert.equal(fulfilled({ entries: [person, { ...answer, see: 'scenes/nothing' }] }, exists), null, 'pointing at what does not exist: still an order');
    assert.deepEqual(fulfilled({ entries: [person, answer] }, exists), { shop: 'scenes', name: 'backflip-tabby' });
    assert.deepEqual(fulfilled({ entries: [person, answer, { ...person, date: '2026-11-21T22:00:00Z' }] }, exists), { shop: 'scenes', name: 'backflip-tabby' }, 'a later remark does not bring the order back');
    assert.equal(fulfilled(undefined, exists), null);

    const fiches = {
        'character-cat': { entries: [{ author: 'llm', date: '2026-11-21T17:52:16Z', text: '', see: 'scenes/backflip-tabby' }] },
        salto: { entries: [person, answer] },
        other: { entries: [{ author: 'llm', date: '2026-11-21T23:00:00Z', text: '', see: 'props/gone' }] },
    };
    assert.deepEqual(latestPointer(fiches, exists), { key: 'salto@2026-11-21T21:32:00Z', shop: 'scenes', name: 'backflip-tabby' }, 'the most recent answer that points at something real');
    assert.equal(latestPointer({}, exists), null);
});

test('the animation room lists a character\'s own animations first, the common gestures apart, and none of those for a body without arms', async () => {
    const { animationsOf } = await import('../atelier/orders.js');
    const scenes = { hello: {}, 'sniff-dog': { character: 'dog' }, 'backflip-tabby': { character: 'tabby' }, cheer: {}, 'ring-fork': { character: 'fork' } };
    assert.deepEqual(animationsOf(scenes, { name: 'fork' }), { own: ['ring-fork'], gestures: ['hello', 'cheer'], others: ['sniff-dog', 'backflip-tabby'] });
    assert.deepEqual(animationsOf(scenes, { name: 'tabby', arms: 'none' }), { own: ['backflip-tabby'], gestures: [], others: ['sniff-dog', 'ring-fork'] }, 'a cat shakes no hands');
    assert.deepEqual(animationsOf({}, { name: 'fork' }), { own: [], gestures: [], others: [] });
});

test('a person names an order in their own words; the file gets a safe name and the page shows readable ones', async () => {
    const { nameFor, readable } = await import('../atelier/orders.js');
    const { isFicheName } = await import('../cli/fiche.js');
    assert.equal(nameFor('Salto arrière du chat'), 'salto-arriere-du-chat', 'spaces and accents are accepted');
    assert.equal(nameFor('mon_super salto'), 'mon_super-salto', 'underscores are kept');
    assert.equal(nameFor('  Le   chat !! '), 'le-chat');
    assert.equal(nameFor('../../etc/passwd'), 'etc-passwd', 'nothing that leaves the folder');
    assert.equal(nameFor('<script>alert(1)</script>'), 'script-alert-1-script');
    assert.equal(nameFor('__--'), '', 'nothing usable: no name');
    assert.equal(nameFor('日本語'), '', 'no letter it can keep: no name');
    assert.equal(nameFor('x'.repeat(200)).length, 60);
    for (const typed of ['Salto arrière du chat', 'mon_super salto', '_a', 'A  B', '../x', 'é', '1 2 3']) {
        const name = nameFor(typed);
        assert.ok(name === '' || isFicheName(name), `"${typed}" -> "${name}" is a file name the server accepts`);
    }
    assert.equal(readable('backflip-tabby', 'tabby'), 'Backflip', 'the owner is not repeated');
    assert.equal(readable('turn-over-hourglass', 'hourglass'), 'Turn over');
    assert.equal(readable('navigate-stickman', 'stickman'), 'Navigate');
    assert.equal(readable('shake-hands'), 'Shake hands');
    assert.equal(readable('mon_super-salto'), 'Mon super salto');
    assert.equal(readable('tabby', 'tabby'), 'Tabby', 'a name that is only the owner stays');
    assert.equal(readable('salto', undefined, 'Salto arrière du chat'), 'Salto arrière du chat', 'what the person typed wins');
});

test('what the person does in the atelier is noted silently, and told to the assistant in a few lines when it next looks', async () => {
    const { createAtelierServer } = await import('../cli/server.js');
    const { summarise, clean } = await import('../cli/activity.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-activity-'));
    await writeFile(join(root, 'figurant.config.js'), 'export default {};');
    const server = createAtelierServer({ root }).listen(0, '127.0.0.1');
    await new Promise(done => server.once('listening', done));
    const base = `http://127.0.0.1:${server.address().port}/__figurant/api/`;
    const post = (events, headers = {}) => fetch(base + 'activity', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify({ events }) });
    try {
        assert.equal((await post([{ what: 'open', shop: 'scenes' }, { what: 'pick', shop: 'scenes', item: 'backflip-tabby', cast: 'tabby' }, { what: 'replay' }])).status, 200);
        const lines = (await readFile(join(root, 'fiches/.activity'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
        assert.deepEqual(lines.map(line => line.what), ['open', 'pick', 'replay']);
        assert.ok(lines.every(line => !Number.isNaN(Date.parse(line.at))), 'the server dates each one');
        assert.equal(lines[1].item, 'backflip-tabby');
        // Only what it knows, and nothing a page could smuggle in.
        await post([{ what: 'typed', value: 'my password' }, { what: 'pick', shop: 'scenes', item: '../../x\n{"what":"open"}', extra: 'x'.repeat(5000) }, 'nonsense', { what: 'speed', value: 0.25 }]);
        const after = (await readFile(join(root, 'fiches/.activity'), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
        assert.deepEqual(after.map(line => line.what), ['open', 'pick', 'replay', 'pick', 'speed'], 'unknown kinds are dropped');
        assert.equal(after[3].item, undefined, 'a name that is not a name is dropped');
        assert.equal(after[3].extra, undefined);
        assert.equal(clean({ what: 'typed', value: 'secret' }), null, 'what the person types is never noted');
        assert.equal((await post([{ what: 'open', shop: 'props' }], { origin: 'http://evil.example' })).status, 403);
        // It stays small.
        for (let i = 0; i < 5; i++) await post(Array.from({ length: 100 }, () => ({ what: 'replay' })));
        assert.ok((await readFile(join(root, 'fiches/.activity'), 'utf8')).trim().split('\n').length <= 400, 'only the latest are kept');
        // Silent: it wakes nobody and is not a fiche.
        assert.deepEqual(JSON.parse(await (await fetch(base + 'fiches')).text()), {});
        assert.match((await figurant(root, 'fiches')).stdout, /No fiche is waiting/);
        assert.equal(JSON.parse(await (await fetch(base + 'listening')).text()).working, false);
    } finally { server.close(); await rm(root, { recursive: true, force: true }); }

    const at = s => new Date(Date.UTC(2026, 10, 22, 20, 0, s)).toISOString();
    const told = summarise([
        { at: at(0), what: 'open', shop: 'scenes' },
        { at: at(2), what: 'pick', shop: 'scenes', item: 'backflip-tabby', cast: 'tabby' },
        { at: at(10), what: 'replay' }, { at: at(20), what: 'replay' }, { at: at(25), what: 'speed', value: 0.25 }, { at: at(40), what: 'step' },
        { at: at(62), what: 'pick', shop: 'characters', item: 'tabby' },
        { at: at(70), what: 'style', value: 'trait-et-or' },
        { at: at(75), what: 'order-open', shop: 'characters' }, { at: at(80), what: 'order-cancel' },
        { at: at(90), what: 'pick', shop: 'scenes', item: 'backflip-tabby', cast: 'tabby' },
    ], { now: Date.parse(at(100)) }).join('\n');
    assert.match(told, /scenes\/backflip-tabby \(played by tabby\): 1 min 10 s, replayed 2×, slowed to ¼, frame by frame/, 'time on it is added up over visits');
    assert.match(told, /characters\/tabby: 28 s/);
    assert.match(told, /style → trait-et-or/);
    assert.match(told, /opened the order form \(characters\), cancelled/);
    assert.match(told, /Now on scenes\/backflip-tabby/);
    assert.match(summarise([{ at: at(0), what: 'new', shop: 'emoji' }, { at: at(1), what: 'advanced', value: 1 }], { now: Date.parse(at(2)) }).join('\n'), /pressed "New" \(emoji\)\n- opened Advanced/);
    assert.deepEqual(summarise([], { now: 0 }), ['The person has done nothing in the atelier yet.']);
    // A long silence is not time spent looking.
    assert.match(summarise([{ at: at(0), what: 'pick', shop: 'props', item: 'cup' }], { now: Date.parse(at(0)) + 3 * 3600_000 }).join('\n'), /props\/cup: 5 min/, 'time on an item is capped');
});

test('the atelier has one conversation: every exchange in order of time, each said about something; and a new thing is named from its first words', async () => {
    const { conversation, orderName } = await import('../atelier/orders.js');
    const fiches = {
        'character-cat': { entries: [{ author: 'person', date: '2026-11-21T17:50:00Z', text: 'fais moi un chat' }, { author: 'llm', date: '2026-11-21T17:52:00Z', text: 'Fait.', see: 'characters/tabby' }] },
        salto: { entries: [{ author: 'person', date: '2026-11-21T21:15:00Z', text: 'Character: tabby\nle chat fait un salto' }, { author: 'llm', date: '2026-11-21T21:32:00Z', text: 'Fait.' }] },
        'prop-cup': { entries: [{ author: 'person', date: '2026-11-21T18:00:00Z', text: 'une tasse' }] },
    };
    const said = conversation(fiches);
    assert.deepEqual(said.map(entry => [entry.fiche, entry.author]), [['character-cat', 'person'], ['character-cat', 'llm'], ['prop-cup', 'person'], ['salto', 'person'], ['salto', 'llm']]);
    assert.equal(said[1].see, 'characters/tabby', 'an answer keeps where it points');
    assert.deepEqual(conversation(fiches, 2).map(entry => entry.fiche), ['salto', 'salto'], 'only the latest when asked');
    assert.deepEqual(conversation({}), []);

    assert.equal(orderName('Fais-moi un chat qui danse la salsa sur la table', []), 'fais-moi-un-chat-qui-danse-la', 'its first six words');
    assert.equal(orderName('un chat', ['un-chat']), 'un-chat-2', 'a name already taken gets a number');
    assert.equal(orderName('un chat', ['un-chat', 'un-chat-2']), 'un-chat-3');
    assert.equal(orderName('!!!', []), 'demande', 'no usable word: a plain name');
});

test('the atelier can show a project as it was at a commit, file by file, read from git', async () => {
    const { createAtelierServer } = await import('../cli/server.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-versions-'));
    const git = (args, date) => promisify(execFile)('git', args, { cwd: root, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });
    await git(['init', '-q']);
    await mkdir(join(root, 'scenes'));
    await writeFile(join(root, 'figurant.config.js'), 'export default {};');
    await writeFile(join(root, 'scenes/sun.js'), 'export const height = 0;');
    await git(['add', '-A']); await git(['commit', '-qm', 'one'], '2026-01-01T10:00:00Z');
    await writeFile(join(root, 'scenes/sun.js'), 'export const height = 190;');
    await git(['add', '-A']); await git(['commit', '-qm', 'two'], '2026-01-01T12:00:00Z');
    const server = createAtelierServer({ root }).listen(0, '127.0.0.1');
    await new Promise(done => server.once('listening', done));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const get = async path => { const r = await fetch(origin + path); return { status: r.status, type: r.headers.get('content-type'), text: await r.text() }; };
    try {
        const then = (await git(['rev-parse', 'HEAD~1'])).stdout.trim(), now = (await git(['rev-parse', 'HEAD'])).stdout.trim();
        // The project as it was then, file by file.
        const old = await get(`/__figurant/at/${then}/scenes/sun.js`);
        assert.equal(old.status, 200); assert.equal(old.text, 'export const height = 0;'); assert.match(old.type, /javascript/);
        assert.equal((await get(`/__figurant/at/${now}/scenes/sun.js`)).text, 'export const height = 190;');
        assert.equal((await get(`/__figurant/at/${then}/figurant.config.js`)).status, 200);
        // Nothing else than a file of that version.
        assert.equal((await get(`/__figurant/at/${then}/scenes/none.js`)).status, 404);
        assert.equal((await get(`/__figurant/at/${then}/..%2F..%2Fetc%2Fpasswd`)).status, 404);
        assert.equal((await get('/__figurant/at/HEAD/scenes/sun.js')).status, 404, 'a version is a full commit name, nothing git would interpret');
        assert.equal((await get(`/__figurant/at/--output=x/scenes/sun.js`)).status, 404);
    } finally { server.close(); await rm(root, { recursive: true, force: true }); }

    // A folder that is not under git has no versions, and says so without failing.
    const bare = await mkdtemp(join(tmpdir(), 'figurant-noversions-'));
    const plain = createAtelierServer({ root: bare }).listen(0, '127.0.0.1');
    await new Promise(done => plain.once('listening', done));
    try {
        const none = await (await fetch(`http://127.0.0.1:${plain.address().port}/__figurant/api/history`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shop: 'scenes', name: 'sun', needles: [] }) })).json();
        assert.deepEqual(none, { head: null, dirty: false, versions: [] });
    } finally { plain.close(); await rm(bare, { recursive: true, force: true }); }

    const { versionsOf } = await import('../atelier/orders.js');
    const fiche = { entries: [{ author: 'person', date: 'd1' }, { author: 'llm', date: 'd2' }, { author: 'person', date: 'd3' }, { author: 'person', date: 'd4' }] };
    assert.deepEqual(versionsOf.dates(fiche), ['d1', 'd3', 'd4'], 'one moment per thing the person said');
});

test('a theme has four colours, and what is written on the bright ones is chosen to be read', async () => {
    const { onColour, themeVars } = await import('../atelier/theme.js');
    assert.equal(onColour('#ffd23f'), '#16181d', 'dark words on yellow');
    assert.equal(onColour('#36e0c2'), '#16181d', 'and on a bright teal');
    assert.equal(onColour('#3b5bdb'), '#ffffff', 'white words on a deep blue');
    assert.equal(onColour('#16181d'), '#ffffff');
    assert.equal(onColour('nonsense'), '#16181d', 'no colour: the safe one');
    const night = themeVars({ paper: '#0f1220', ink: '#e8ecff', accent: '#36e0c2', pop: '#ff4fd8' });
    assert.deepEqual(night, { '--paper': '#0f1220', '--ink': '#e8ecff', '--accent': '#36e0c2', '--pop': '#ff4fd8', '--on-accent': '#16181d', '--on-pop': '#16181d' });
    assert.deepEqual(themeVars({ accent: '#3B5BDB' }), { '--accent': '#3b5bdb', '--on-accent': '#ffffff' }, 'only what the theme sets, and what follows from it');
    assert.deepEqual(themeVars({ accent: 'red; x', pop: '#ffd23f"><script>' }), {}, 'nothing that is not a colour');
    assert.deepEqual(themeVars(undefined), {});

    // The server keeps the fourth colour and puts all of it in the page it sends.
    const { createAtelierServer } = await import('../cli/server.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-pop-'));
    const server = createAtelierServer({ root }).listen(0, '127.0.0.1');
    await new Promise(done => server.once('listening', done));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
        const put = await fetch(origin + '/__figurant/api/styles/night', { method: 'PUT', body: JSON.stringify({ name: 'Night', prompt: 'x', theme: { paper: '#0f1220', ink: '#e8ecff', accent: '#36e0c2', pop: '#FF4FD8' } }) });
        assert.equal(put.status, 200);
        assert.equal(JSON.parse(await put.text()).styles[0].theme.pop, '#ff4fd8');
        assert.equal((await fetch(origin + '/__figurant/api/styles/bad', { method: 'PUT', body: JSON.stringify({ name: 'x', prompt: 'y', theme: { pop: 'yellow' } }) })).status, 400);
        await fetch(origin + '/__figurant/api/styles/night/use', { method: 'POST' });
        const html = await (await fetch(origin + '/__figurant/atelier/')).text();
        assert.match(html, /<html[^>]*style="[^"]*--pop:#ff4fd8[^"]*--on-pop:#16181d/);
    } finally { server.close(); await rm(root, { recursive: true, force: true }); }

    // Every style of this project says its fourth colour.
    for (const file of (await readdir(new URL('../styles/', import.meta.url))).filter(name => name.endsWith('.json'))) {
        const style = JSON.parse(await readFile(new URL(`../styles/${file}`, import.meta.url), 'utf8'));
        assert.match(style.theme.pop ?? '', /^#[0-9a-f]{6}$/, `${file} has a bright colour`);
        assert.notEqual(style.theme.pop, style.theme.accent, `${file}: the bright colour is not the accent again`);
    }
});

test('an item is exported as a folder a site can take: its files, the engine, a page that shows it, and a manual', async () => {
    const { exportItem } = await import('../cli/export.js');
    const root = await mkdtemp(join(tmpdir(), 'figurant-export-'));
    await mkdir(join(root, 'characters')); await mkdir(join(root, 'scenes/bun'), { recursive: true }); await mkdir(join(root, 'stories'));
    await writeFile(join(root, 'kit.js'), 'export const round = 7;\n');
    await writeFile(join(root, 'characters/bun.js'), "import { shapeHead } from 'figurant';\nimport { round } from '../kit.js';\nconst head = { create({ stage, layer }) { return { state: { lid: 1 }, frame: () => ({ hips: [[-6, 20], [6, 20]], shoulders: [[-12, 0], [12, 0]], hipY: 20, top: [0, -round] }), draw() {} }; } };\nexport const other = 1;\nexport const bun = { name: 'bun', head };\n");
    await writeFile(join(root, 'scenes/bun/rise.js'), "import { moves } from 'figurant';\nexport const riseBun = {\n    character: 'bun',\n    async play(c) { await moves.hop(c, 12); },\n};\n");
    await writeFile(join(root, 'stories/bakery.js'), "export const bakery = { title: 'The bakery', cast: [{ id: 'b', character: 'bun', at: 0 }], tracks: { b: [{ at: 0, play: 'rise-bun' }] } };\n");
    await writeFile(join(root, 'figurant.config.js'), "import { bun } from './characters/bun.js';\nimport { riseBun } from './scenes/bun/rise.js';\nimport { bakery } from './stories/bakery.js';\nexport default { cast: { bun: { character: bun } }, scenes: { 'rise-bun': riseBun }, compositions: { bakery } };\n");
    const needles = [
        { kind: 'scene', key: 'rise-bun', text: 'async play(c) { await moves.hop(c, 12); }' },
        { kind: 'character', key: 'bun', text: "create({ stage, layer }) { return { state: { lid: 1 }" },
        { kind: 'character', key: 'stickman', text: 'something that lives in the engine, not in the project' },
    ];
    try {
        const done = await exportItem({ root, shop: 'scenes', name: 'rise-bun', needles, title: 'Rise' });
        assert.equal(done.folder, 'exports/rise-bun');
        const at = path => join(root, 'exports/rise-bun', path);
        const manual = await readFile(at('EXPORT.md'), 'utf8'), start = await readFile(at('start.js'), 'utf8'), page = await readFile(at('demo.html'), 'utf8');
        // Its own files and what they import, with the engine, ready for a site.
        for (const file of ['site/scenes/bun/rise.js', 'site/characters/bun.js', 'site/kit.js', 'site/figurant/index.js', 'INTEGRATION.md']) await readFile(at(file));
        assert.doesNotMatch(await readFile(at('site/scenes/bun/rise.js'), 'utf8'), /from 'figurant'/, 'the engine is imported by path, as a site needs');
        // The module that starts it names the right things.
        assert.match(start, /import \{ riseBun \} from '\.\/site\/scenes\/bun\/rise\.js'/);
        assert.match(start, /import \{ bun \} from '\.\/site\/characters\/bun\.js'/, 'the export that holds the character, not the first of the file');
        assert.match(start, /scenes: \{ 'rise-bun': riseBun \}/);
        assert.match(start, /character: bun\b/);
        assert.match(page, /data-fig-scene="rise-bun"/); assert.match(page, /start\.js/);
        // The manual says what it is, what is in the folder, what could not be found, and what to do.
        assert.match(manual, /rise-bun/); assert.match(manual, /site\/scenes\/bun\/rise\.js/); assert.match(manual, /stickman/); assert.match(manual, /INTEGRATION\.md/); assert.match(manual, /data-fig-scene="rise-bun"/);
        // What the start module imports is there, and the whole loads.
        const loaded = await import(at('site/scenes/bun/rise.js'));
        assert.equal(typeof loaded.riseBun.play, 'function');

        // A scene of several: its own file, and a player.
        const story = await exportItem({ root, shop: 'compositions', name: 'bakery', title: 'The bakery', needles: [{ kind: 'composition', key: 'bakery', text: "title: 'The bakery'" }, ...needles.slice(0, 2)] });
        const play = await readFile(join(root, story.folder, 'start.js'), 'utf8');
        assert.match(play, /import \{ bakery \} from '\.\/site\/stories\/bakery\.js'/); assert.match(play, /playComposition/); assert.match(play, /animations: \{ 'rise-bun': riseBun \}/);
        // A scene's sounds go with it, at the same paths: sound files only, and only from inside the project.
        await mkdir(join(root, 'assets'), { recursive: true });
        await writeFile(join(root, 'assets/bell.mp3'), 'ID3'); await writeFile(join(root, 'assets/notes.txt'), 'private'); await writeFile(join(root, '.hidden.mp3'), 'x');
        const heard = await exportItem({ root, shop: 'compositions', name: 'bakery', title: 'The bakery', needles: [{ kind: 'composition', key: 'bakery', text: "title: 'The bakery'" }, ...needles.slice(0, 2)], sounds: ['assets/bell.mp3', 'assets/notes.txt', '../outside.mp3', '.hidden.mp3', 'assets/absent.wav', 7] });
        assert.equal(await readFile(join(root, heard.folder, 'site/assets/bell.mp3'), 'utf8'), 'ID3');
        assert.deepEqual(heard.files.filter(file => !file.endsWith('.js')), ['assets/bell.mp3'], 'the sound file, and nothing else that was named');
        assert.deepEqual(heard.missing.filter(name => /wav$/.test(name)), ['assets/absent.wav'], 'one that is not there is said to be missing');
        assert.match(await readFile(join(root, heard.folder, 'start.js'), 'utf8'), /sound: \{ base: new URL\('\.\/site\/', import\.meta\.url\)\.href \}/);
        // Two drawings begun from the same model hold the same first lines: the name tells which file is meant.
        await writeFile(join(root, 'characters/roll.js'), (await readFile(join(root, 'characters/bun.js'), 'utf8')).replaceAll('bun', 'roll').replace('other', 'another'));
        const twin = await exportItem({ root, shop: 'characters', name: 'roll', needles: [{ kind: 'character', key: 'roll', text: 'create({ stage, layer }) { return { state: { lid: 1 }', hint: 'roll' }] });
        assert.match(await readFile(join(root, twin.folder, 'start.js'), 'utf8'), /import \{ roll \} from '\.\/site\/characters\/roll\.js'/);
        // Exporting again replaces the folder; and a name cannot leave it.
        await exportItem({ root, shop: 'scenes', name: 'rise-bun', needles, title: 'Rise' });
        await assert.rejects(exportItem({ root, shop: 'scenes', name: '../x', needles }), /name/);
        await assert.rejects(exportItem({ root, shop: 'scenes', name: 'nothing', needles: [{ kind: 'scene', key: 'nothing', text: 'not in any file of the project at all' }] }), /found/);
    } finally { await rm(root, { recursive: true, force: true }); }
});
