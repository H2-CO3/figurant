// The examples printed in docs/CHARACTERS.md and docs/SCENES.md, run for real:
// a guide whose example does not work is worse than no guide.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    createClock, advance, createStage, createDirector, createFx, describeProblems, shapeHead, moves, easing, checkScenes, checkCharacter, ATTRIBUTES,
} from '../src/index.js';
import { DEFAULT_PROPORTIONS } from '../src/body/body.js';
import { fakePage } from './helpers/fake-dom.js';

const read = name => readFileSync(new URL(`../docs/${name}`, import.meta.url), 'utf8');

const teapot = {
    name: 'teapot',
    line: 3,
    head: shapeHead({
        shapes: [
            { tag: 'path', attrs: { d: 'M -40 20 C -52 -30 52 -30 40 20 Z' }, fill: true },
            { tag: 'path', attrs: { d: 'M 40 -6 C 64 -10 66 -30 74 -30' } },
        ],
        shoulders: [[-40, 0], [40, 0]],
        hips: [[-14, 20], [14, 20]],
        top: [0, -34],
        eyes: { at: [[-10, -4], [10, -4]], r: 2.4, travel: 4 },
    }),
    proportions: { thigh: 20, shin: 22, reach: 38 },
};

const cup = {
    name: 'cup',
    shapes: [{ tag: 'path', attrs: { d: 'M -8 -10 L -6 4 L 6 4 L 8 -10 Z' }, fill: true }],
    points: { grip: [0, 0] },
};

test('the teapot and the tea scene of the guides work as printed', async () => {
    let finished = false, cupSeen = false;
    const tea = {
        room: { left: 30, right: 60, up: 110 },
        async play(c, { api }) {
            const mug = c.give('right', cup, { state: { draw: 0 } });
            await c.all(c.hands({ right: { x: 34, y: 2, angle: 90 } }, 300), c.animate(mug.state, { draw: 1 }, 400));
            cupSeen = mug.state.draw === 1 && typeof api.random() === 'number';
            await c.tween({ tilt: -6 }, 300, easing.easeOut);
            await c.wait(900);
            await c.tween({ tilt: 0 }, 300, easing.easeOutBack);
            await moves.blink(c);
            await c.hands({ right: null }, 250);
            finished = true;
        },
    };
    const page = fakePage({
        width: 1000, height: 800,
        elements: [{ attrs: { 'data-fig-spot': 'tea', 'data-fig-scene': 'tea', 'data-fig-on': 'view', 'data-fig-at': '0.2' }, rect: { x: 100, y: 300, w: 600, h: 200 } }],
    });
    const clock = createClock();
    const director = createDirector({
        stage: createStage({ doc: page.doc, win: page.win }), clock, win: page.win, doc: page.doc,
        cast: { default: { character: teapot, unit: 1.2, scale: 0.75 } },
        scenes: { tea },
    }).start();
    assert.deepEqual(describeProblems(director.problems), []);
    await advance(clock, 12000);
    assert.ok(cupSeen, 'the cup was traced in its hand');
    assert.ok(finished, 'the scene ran to its end');
    const figure = director.members[0].figure;
    assert.ok(Math.abs(figure.points.legL.foot[1] - 300) < 0.5, 'and the teapot stands on its place');
});

test('the guides list every marker, every scene field and every proportion the engine has', () => {
    const scenes = read('SCENES.md'), characters = read('CHARACTERS.md');
    for (const attribute of Object.keys(ATTRIBUTES)) assert.ok(scenes.includes('`' + attribute + '`'), `${attribute} is documented`);
    for (const [attribute, rule] of Object.entries(ATTRIBUTES)) {
        for (const choice of rule.choices ?? []) assert.ok(scenes.includes('`' + choice + '`'), `${attribute}="${choice}" is documented`);
    }
    for (const name of Object.keys(DEFAULT_PROPORTIONS)) assert.ok(characters.includes('`' + name + '`'), `proportion ${name} is documented`);
    assert.deepEqual(checkScenes({ ok: { room: {}, variants: [], mood: 'free', data: {}, play() {} } }), []);
});

test('a character whose legs cannot reach the ground is reported with its fix', () => {
    const page = fakePage({ width: 1000, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a' }, rect: { x: 100, y: 300, w: 600, h: 200 } }] });
    const make = cast => createDirector({
        stage: createStage({ doc: page.doc, win: page.win }), clock: createClock(), win: page.win, doc: page.doc, cast,
    });
    const short = { ...teapot, proportions: { thigh: 20, shin: 22 } };
    const lines = describeProblems(make({ default: { character: short } }).problems);
    assert.equal(lines.length, 1);
    assert.match(lines[0], /^character "teapot" .*reach/);
    assert.match(lines[0], /41/, 'the fix gives a value that works');
    assert.deepEqual(make({ default: { character: teapot } }).problems, []);
    assert.equal(make({ default: { character: { name: 'x' } } }).problems.filter(p => p.field === 'head').length, 1, 'a character needs a head');
});

test('the library teapot lives on a page: it arrives, plays hello, and its lid hops when startled', async () => {
    const { teapot: crafted } = await import('../library/default/cartoon-realiste/characters/teapot.js');
    const { hello } = await import('../library/common/scenes/hello.js');
    const page = fakePage({ width: 1000, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a', 'data-fig-scene': 'hello', 'data-fig-on': 'view', 'data-fig-enter': 'none' }, rect: { x: 100, y: 300, w: 600, h: 200 } }] });
    const clock = createClock();
    const stage = createStage({ doc: page.doc, win: page.win });
    let played = 0;
    const director = createDirector({
        stage, clock, win: page.win, doc: page.doc,
        // As in docs/INTEGRATION.md: effects, a fixed header, a size that follows the layout.
        fx: createFx({ stage, clock }), clearance: 64,
        cast: { default: { character: crafted, unit: () => (page.win.innerWidth < 600 ? 0.7 : 1), scale: 0.6 } },
        scenes: { hello: { ...hello, play: async (c, ctx) => { await hello.play(c, ctx); played++; } } },
    }).start();
    assert.deepEqual(director.problems, []);
    await advance(clock, 8000);
    assert.equal(played, 1);
    const figure = director.members[0].figure;
    assert.ok('steam' in figure.state && 'lid' in figure.state, 'it has its own numbers');
    assert.ok(Math.abs(figure.points.legL.foot[1] - 300) < 0.5, 'feet on its place');
    figure.state.wide = 1; figure.state.steam = 1;
    await advance(clock, 32);
    for (const [key, value] of Object.entries(figure.state)) if (typeof value === 'number') assert.ok(Number.isFinite(value), key);
});

test('an emoji head: a glyph on a stick body, changing face with what it feels', async () => {
    const { emojiHead } = await import('../src/index.js');
    const { fakeDocument } = await import('./helpers/fake-dom.js');
    const { createFigure } = await import('../src/figure/figure.js');
    const { doc, win } = fakeDocument();
    const character = { name: 'smiley', head: emojiHead({ face: '🙂', faces: { blink: '😌', wide: '😮', squint: '🤨' } }) };
    assert.deepEqual(checkCharacter(character), []);
    const figure = createFigure({ stage: createStage({ doc, win }), character });
    Object.assign(figure.state, { legs: 1, arms: 1 });
    const glyph = () => { figure.render([200, 200]); const find = node => (node.tag === 'text' ? node : node.children.map(find).find(Boolean)); return find(figure.layer).textContent; };
    assert.equal(glyph(), '🙂');
    figure.state.lid = 0.1; assert.equal(glyph(), '😌', 'eyes shut');
    figure.state.lid = 1; figure.state.wide = 0.8; assert.equal(glyph(), '😮', 'surprised');
    figure.state.wide = 0; figure.state.squint = 0.7; assert.equal(glyph(), '🤨');
    figure.state.squint = 0; assert.equal(glyph(), '🙂', 'back to its face');
    const plain = createFigure({ stage: createStage({ doc, win }), character: { name: 'p', head: emojiHead({ face: '🤖' }) } });
    plain.state.lid = 0; plain.render([0, 0]);
    assert.ok(Number.isFinite(plain.standHeight()), 'a single face is enough');
    assert.throws(() => emojiHead({}), /face/);
});

test("the teapot's notes scene is its own: it sits on its pouffe, writes within reach, and the stick figure does not play it", async () => {
    const { teapot: crafted } = await import('../library/default/cartoon-realiste/characters/teapot.js');
    const { notesTeapot } = await import('../library/default/cartoon-realiste/scenes/teapot/notes.js');
    const { stickman } = await import('../src/index.js');
    const run = async (character, width = 1400) => {
        const page = fakePage({ width, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a', 'data-fig-scene': 'notes-teapot', 'data-fig-on': 'view', 'data-fig-enter': 'none', 'data-fig-at': '0.3' }, rect: { x: 100, y: 400, w: width - 200, h: 200 } }] });
        const clock = createClock();
        const stage = createStage({ doc: page.doc, win: page.win });
        const director = createDirector({ stage, clock, win: page.win, doc: page.doc, cast: { default: { character, unit: 1, scale: 1 } }, scenes: { 'notes-teapot': notesTeapot } }).start();
        const figure = director.members[0].figure;
        let farthest = 0;
        clock.onFrame(() => { const arm = figure.points.armR; if (arm && figure.state.handR.weight > 0.99) farthest = Math.max(farthest, Math.hypot(arm.hand[0] - arm.target[0], arm.hand[1] - arm.target[1])); });
        await advance(clock, 9000);
        const layers = stage.svg.children.map(child => child.attrs['data-fig-layer']);
        return { figure, layers, farthest, problems: director.problems };
    };
    const wide = await run(crafted);
    assert.deepEqual(wide.problems, []);
    for (const prop of ['pouffe', 'desk', 'divan', 'quill', 'written']) assert.ok(wide.layers.includes(prop), `${prop} is on stage`);
    assert.equal(wide.figure.state.seat, 1, 'it is seated');
    assert.ok(wide.farthest < 0.5, `the pen hand reaches every point it is sent to (off by ${wide.farthest.toFixed(2)})`);
    const narrow = await run(crafted, 420);
    assert.ok(narrow.layers.includes('desk') && !narrow.layers.includes('divan'), 'on a narrow screen: the compact version, without the divan');
    const other = await run(stickman);
    assert.ok(!other.layers.includes('pouffe'), 'another character does not play it');
    assert.equal(other.problems.length, 1);
});

test('the loaf of the Props section is a sound prop', async () => {
    const { checkProp } = await import('../src/index.js');
    const loaf = {
        name: 'loaf',
        shapes: [
            { tag: 'path', attrs: { d: 'M -20 0 Q 0 -14 20 0 Z' }, accent: true, fill: true, weight: 1.6 },
            { tag: 'path', attrs: { d: 'M -8 -4 L -4 -8' }, weight: 0.7 },
            { tag: 'circle', attrs: { cx: 0, cy: 0, r: 2.6, fill: 'var(--fig-ink)', stroke: 'none' } },
            { tag: 'text', text: 'PAIN', attrs: { x: 0, y: 10, 'font-size': 8, 'text-anchor': 'middle' } },
        ],
        points: { grip: [0, 0], top: [0, -14] },
    };
    assert.deepEqual(checkProp('loaf', loaf), []);
    assert.match(read('SCENES.md'), /name: 'loaf'/);
    const { desk } = await import('../library/default/cartoon-realiste/props/teapot-study.js');
    assert.deepEqual(checkProp('desk', desk), []);
});

test('the cat walks on four legs: no arms, front feet on the ground and not sliding', async () => {
    const { cat } = await import('../library/default/cartoon-realiste/characters/cat.js');
    const { createActor } = await import('../src/actor/actor.js');
    const { createFigure } = await import('../src/figure/figure.js');
    const { fakeDocument, pathPoints } = await import('./helpers/fake-dom.js');
    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const clock = createClock();
    assert.deepEqual(checkCharacter(cat), []);
    const figure = createFigure({ stage, character: cat });
    Object.assign(figure.state, { legs: 1, arms: 1 });
    figure.state.y = -figure.standHeight();
    const actor = createActor({ figure, clock, anchor: stage.at(400, 300) }).show();
    await advance(clock, 32);
    const frontLegs = () => figure.layer.children.find(k => k.attrs.class === 'fig-head').children.filter(k => k.tag === 'path').slice(0, 2).map(node => pathPoints(node.attrs.d));
    assert.equal(figure.points.armL, null, 'it has no arms');
    for (const leg of frontLegs()) assert.ok(Math.abs(leg[2][1] - 300) < 0.01, 'front feet on the ground at rest');
    const hind = figure.points.legL.hip[0], frontHip = frontLegs()[0][0][0];
    assert.ok(frontHip - hind > 30, 'front legs ahead of hind legs when it faces right');

    // Walking: a front foot that is down stays where it is on the page.
    const { anatomy } = await import('../src/index.js');
    let slid = 0, steps = 0, planted = 0, hover = 0; const last = [null, null];
    clock.onFrame(() => {
        frontLegs().forEach((leg, i) => {
            const [x, y] = leg[2], down = y > 299.95;
            // In the part of its stride where the foot is meant to be down, it is on the floor, not above it.
            if (anatomy.footCycle(figure.body, figure.state.phase + Math.PI / 2, i ? 1 : -1).planted) hover = Math.max(hover, Math.abs(y - 300));
            if (down) planted++;
            if (down && last[i] !== null) slid = Math.max(slid, Math.abs(x - last[i]));
            if (!down && last[i] !== null) steps++;
            last[i] = down ? x : null;
        });
    });
    actor.play(async c => { c.state.walk = 1; c.state.dir = 1; await c.tween({ x: 300 }, 3000, easing.linear); });
    await advance(clock, 3200);
    assert.ok(steps >= 4, `it took steps with its front legs (${steps})`);
    assert.ok(hover < 0.05, `a front foot that should be down is on the floor (off by ${hover.toFixed(2)} px)`);
    assert.ok(planted > 60, `and they spend real time on the floor (${planted} frames)`);
    assert.ok(slid < 0.6, `a planted front foot does not slide (${slid.toFixed(2)} px)`);
    figure.state.dir = -1;
    await advance(clock, 32);
    assert.ok(frontLegs()[0][0][0] < figure.points.legL.hip[0], 'facing left, its front legs are on the left');
});

test('every character of the library lives on a page: it arrives, says hello, and is startled without a stray number', async () => {
    const { hello } = await import('../library/common/scenes/hello.js');
    const config = (await import('../examples/figurant.config.js')).default;
    for (const name of ['stickman', 'teapot', 'highlighter', 'fork', 'cat', 'cactus', 'lantern', 'hourglass', 'cloud', 'toadstool', 'crane', 'bonsai', 'star', 'cocktail']) assert.ok(config.cast[name], `${name} is in the cast`);
    // The library is arranged by style, every style built the same way. "default"
    // holds what was made before the styles had content of their own.
    const { readdirSync, existsSync } = await import('node:fs');
    const root = new URL('../library/', import.meta.url);
    const folders = readdirSync(root).filter(name => !['common', 'emoji'].includes(name));
    const known = readdirSync(new URL('../styles/', import.meta.url)).filter(name => name.endsWith('.json')).map(name => name.slice(0, -5));
    assert.deepEqual(folders.sort(), known.sort(), 'one folder per style of the project');
    const seen = new Map();
    for (const folder of folders) {
        const index = await import(new URL(`${folder}/index.js`, root));
        assert.equal(index.style, folder);
        assert.ok(Object.keys(index.characters).length >= 2, `${folder} has at least two characters`);
        assert.ok(Object.keys(index.props).length >= 1, `${folder} has a prop`);
        assert.ok(Object.keys(index.scenes).length >= 2, `${folder} has at least two animations`);
        if (folder !== 'default') for (const part of ['characters', 'props', 'scenes']) assert.ok(existsSync(new URL(`${folder}/${part}/`, root)), `${folder}/${part}/`);
        for (const item of [...Object.values(index.characters), ...Object.values(index.props)]) assert.equal(item.style ?? item.layers?.[0]?.style, folder, `${item.name} says its style`);
        for (const scene of Object.values(index.scenes)) assert.ok([...Object.keys(index.characters), 'stickman'].includes([].concat(scene.character)[0]), `${folder}: an animation belongs to a character of its style, or to the stick figure, who goes with any`);
        for (const name of [...Object.keys(index.characters), ...Object.keys(index.props), ...Object.keys(index.scenes)]) {
            assert.ok(!seen.has(name), `"${name}" is in ${folder} and in ${seen.get(name)}: every name is used once`);
            seen.set(name, folder);
        }
    }
    assert.deepEqual(Object.keys(config.emoji), ['emoji'], 'emoji figures are a kind apart');
    for (const [name, member] of Object.entries({ ...config.cast, ...config.emoji })) {
        const page = fakePage({ width: 1000, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a', 'data-fig-scene': 'hello', 'data-fig-on': 'view', 'data-fig-enter': 'none' }, rect: { x: 100, y: 400, w: 600, h: 200 } }] });
        const clock = createClock();
        let played = 0;
        const director = createDirector({
            stage: createStage({ doc: page.doc, win: page.win }), clock, win: page.win, doc: page.doc,
            cast: { default: member }, scenes: { hello: { ...hello, play: async (c, ctx) => { await hello.play(c, ctx); played++; } } },
        }).start();
        assert.deepEqual(director.problems, [], name);
        await advance(clock, 8000);
        assert.equal(played, 1, `${name} played hello`);
        const figure = director.members[0].figure;
        assert.ok(Math.abs(figure.points.legL.foot[1] - 400) < 0.5, `${name} stands on its place`);
        page.pointer(400, 380);
        Object.assign(figure.state, { wide: 1, squint: 1, lid: 0, gazeX: 1, gazeY: -1 });
        await advance(clock, 3000);
        for (const [key, value] of Object.entries(figure.state)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${name}.${key}`);
        const text = JSON.stringify(figure.layer, (key, value) => (key === 'parent' ? undefined : value));
        assert.doesNotMatch(text, /NaN|undefined|Infinity/, `${name} draws no broken number`);
    }
});

test('every scene of the library plays to its end with the character it was made for, and only with it', async () => {
    const config = (await import('../examples/figurant.config.js')).default;
    const { castOf } = await import('../src/index.js');
    const everyone = { ...config.cast, ...config.emoji };
    for (const [name, scene] of Object.entries(config.scenes)) {
        const owner = castOf(scene)[0] ?? 'stickman';
        const page = fakePage({ width: 1600, height: 900, elements: [{ attrs: { 'data-fig-spot': 'a', 'data-fig-scene': name, 'data-fig-on': 'view', 'data-fig-enter': 'none' }, rect: { x: 500, y: 500, w: 600, h: 200 } }] });
        const clock = createClock();
        let ended = 0;
        const director = createDirector({
            stage: createStage({ doc: page.doc, win: page.win }), clock, win: page.win, doc: page.doc,
            cast: { default: everyone[owner] }, scenes: { [name]: { ...scene, play: async (c, ctx) => { await scene.play(c, ctx); ended++; } } },
        }).start();
        assert.deepEqual(director.problems, [], name);
        await advance(clock, 30000);
        const figure = director.members[0].figure;
        // Some animations go on until something else replaces them.
        const loops = ['notes', 'notes-teapot', 'picket'].includes(name);
        const underWay = name === 'picket' ? figure.state.handR.weight > 0.9 : figure.state.seat === 1;
        assert.ok(loops ? underWay : ended === 1, `${name} ${loops ? 'is under way' : 'played to its end'} with ${owner}`);
        for (const [key, value] of Object.entries(figure.state)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${name}: ${key}`);
        if (castOf(scene).length) {
            const other = Object.keys(config.cast).find(candidate => !castOf(scene).includes(candidate));
            assert.ok(other && !castOf(scene).includes(everyone[other].character.name), `${name} belongs to ${owner} only`);
        }
    }
});

test('every animation has its one owner, every character has an animation of its own, and none is a copy of another', async () => {
    const config = (await import('../examples/figurant.config.js')).default;
    const { castOf } = await import('../src/index.js');
    const everyone = { ...config.cast, ...config.emoji };
    const names = Object.values(everyone).map(member => member.character.name);
    // The only animations without an owner: the common gestures, what a crowd is made of.
    const gestures = Object.keys(config.scenes).filter(name => config.scenes[name].character === undefined);
    assert.deepEqual(gestures.sort(), ['cheer', 'hello', 'picket', 'shake-hands'], 'the common gestures, and nothing else, belong to nobody');
    const bodies = new Map();
    for (const [name, scene] of Object.entries(config.scenes)) {
        const owners = castOf(scene);
        if (!gestures.includes(name)) {
            assert.equal(owners.length, 1, `${name} has one owner`);
            assert.ok(names.includes(owners[0]), `${name} belongs to "${owners[0]}", who is not in the cast`);
        }
        const body = scene.play.toString().replace(/\s+/g, ' ');
        assert.ok(!bodies.has(body), `${name} is the same animation as ${bodies.get(body)}`);
        bodies.set(body, name);
    }
    for (const name of names) {
        assert.ok(Object.values(config.scenes).some(scene => castOf(scene).includes(name)), `${name} has no animation of its own`);
    }
});
