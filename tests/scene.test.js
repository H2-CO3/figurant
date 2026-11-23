import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advance } from '../src/core/clock.js';
import { createStage } from '../src/stage/stage.js';
import { createFigure } from '../src/figure/figure.js';
import { createActor } from '../src/actor/actor.js';
import { createDirector } from '../src/director/director.js';
import { checkScene, checkScenes, SCENE_FORMAT, SCENE_FIELDS } from '../src/director/scene.js';
import { describeProblems } from '../src/director/spots.js';
import * as moves from '../src/actor/moves.js';
import { stickman } from '../src/characters/stickman.js';
import { fakeDocument, fakePage } from './helpers/fake-dom.js';

const play = async () => {};

test('a well-formed scene has no problems', () => {
    assert.deepEqual(checkScene('tea', {
        room: { left: 20, right: 140, up: 110 },
        variants: [{ name: 'compact', room: { left: 20, right: 60, up: 110 } }],
        mood: 'any',
        data: { anything: ['the scene', 'likes'] },
        play,
    }), []);
    assert.deepEqual(checkScene('bare', { play }), []);
});

test('every mistake in a scene is reported with its fix', () => {
    const problems = checkScenes({
        noplay: { room: { left: 10 } },
        typo: { rooms: { left: 10 }, play },
        badroom: { room: { left: '10', rihgt: 4, up: -3 }, play },
        badmood: { mood: 'sad', play },
        badvariants: { variants: [{ room: { left: 1 } }, { name: 'a' }, { name: 'a', moood: 'any' }], play },
        notobject: 3,
    });
    const about = (scene, field) => problems.filter(p => p.scene === scene && (field === undefined || p.field === field));
    assert.equal(about('noplay', 'play').length, 1, 'a scene needs play');
    assert.match(about('typo', 'rooms')[0].fix, /"room"/, 'an unknown field suggests the one probably meant');
    assert.equal(about('badroom', 'room.left').length, 1, 'a room side must be a number');
    assert.match(about('badroom', 'room.rihgt')[0].fix, /"right"/);
    assert.equal(about('badroom', 'room.up').length, 1, 'and not negative');
    assert.match(about('badmood', 'mood')[0].fix, /free.*solemn.*any/);
    assert.equal(about('badvariants', 'variants[0].name').length, 1, 'a variant needs a name');
    assert.equal(about('badvariants', 'variants[2].name').length, 1, 'variant names are unique');
    assert.match(about('badvariants', 'variants[2].moood')[0].fix, /"mood"/);
    assert.equal(about('notobject').length, 1);
    assert.equal(problems.length, 10, 'and nothing else is reported');
    for (const line of describeProblems(problems)) assert.match(line, /^scene "/, 'each reads as one line naming the scene');
});

test('the director reports scene mistakes next to marker mistakes, and still runs', async () => {
    const page = fakePage({ width: 1000, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a' }, rect: { x: 100, y: 300, w: 600, h: 200 } }] });
    const stage = createStage({ doc: page.doc, win: page.win });
    const clock = createClock();
    const director = createDirector({
        stage, clock, win: page.win, doc: page.doc,
        scenes: { odd: { rom: { left: 10 }, play } },
        cast: { default: { character: stickman } },
    }).start();
    assert.equal(director.problems.filter(p => p.scene === 'odd').length, 1);
    await advance(clock, 6000);
    assert.equal(director.members[0].mode, 'perched', 'the page still works');
});

// The frozen part of the scene format: what a scene's play() receives. Adding
// a member is fine (bump nothing); removing or renaming one breaks every
// scene ever written, and must bump SCENE_FORMAT.
test('scene format 1: the sequence context and the scene context keep their members', async () => {
    assert.equal(SCENE_FORMAT, 1);
    assert.deepEqual(Object.keys(SCENE_FIELDS).sort(), ['character', 'data', 'mood', 'play', 'room', 'variants']);

    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const clock = createClock();
    const figure = createFigure({ stage, character: stickman });
    const actor = createActor({ figure, clock, anchor: stage.at(0, 0) }).show();
    let seen = null;
    actor.play(async c => { seen = c; });
    await advance(clock, 32);
    for (const member of ['actor', 'figure', 'state', 'clock', 'alive', 'tween', 'also', 'wait', 'all', 'animate', 'hands', 'feet', 'prop', 'give', 'onLeave']) {
        assert.ok(member in seen, `c.${member}`);
    }
    for (const move of ['blink', 'walkTo', 'land', 'hop', 'glance', 'sitOnEdge', 'recover']) assert.equal(typeof moves[move], 'function', `moves.${move}`);

    const page = fakePage({ width: 1000, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a', 'data-fig-scene': 's', 'data-fig-on': 'view', 'data-fig-enter': 'none' }, rect: { x: 100, y: 300, w: 600, h: 200 } }] });
    const stage2 = createStage({ doc: page.doc, win: page.win });
    const clock2 = createClock();
    let ctx = null;
    createDirector({
        stage: stage2, clock: clock2, win: page.win, doc: page.doc,
        scenes: { s: { room: { up: 10 }, async play(c, context) { ctx = context; } } },
        cast: { default: { character: stickman } },
    }).start();
    await advance(clock2, 2000);
    assert.deepEqual(Object.keys(ctx).sort(), ['api', 'place', 'room', 'scene', 'variant']);
    for (const member of ['element', 'name', 'at', 'enter', 'scene', 'on', 'mood', 'cast', 'sit']) assert.ok(member in ctx.place, `place.${member}`);
    for (const member of ['actor', 'figure', 'state', 'view', 'pointer', 'pointerDistance', 'random', 'stage', 'clock', 'fx', 'moves', 'noHover']) assert.ok(member in ctx.api, `api.${member}`);
    assert.deepEqual(Object.keys(ctx.room).sort(), ['left', 'right', 'up']);
});

// The body works under any head: a head that adds no state at all must go
// through arrival, a startle and the stock moves without a single stray number.
test('a head with no state of its own is enough: nothing assumes eyes or lids', async () => {
    const bare = {
        name: 'thing',
        head: { create: () => ({ state: {}, frame: () => ({ hips: [[-8, 20], [8, 20]], shoulders: [[-10, 0], [10, 0]], hipY: 20, top: [0, -20] }), draw() {} }) },
    };
    const page = fakePage({ width: 1000, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a', 'data-fig-scene': 's', 'data-fig-on': 'view' }, rect: { x: 100, y: 300, w: 600, h: 200 } }] });
    const stage = createStage({ doc: page.doc, win: page.win });
    const clock = createClock();
    const director = createDirector({
        stage, clock, win: page.win, doc: page.doc,
        scenes: { s: { async play(c) { await moves.blink(c); await moves.glance(c, 1, 1, 50); await moves.hop(c); await moves.walkTo(c, c.state.x + 40); await moves.recover(c); } } },
        cast: { default: { character: bare } },
    }).start();
    const s = director.members[0].figure.state;
    const before = Object.keys(s).sort();
    await advance(clock, 6000);
    page.pointer(400, 280);
    await advance(clock, 4000);
    assert.deepEqual(Object.keys(s).sort(), before, 'no head-specific number was added to its state');
    for (const [key, value] of Object.entries(s)) if (typeof value === 'number') assert.ok(Number.isFinite(value), `${key} is a number`);
    assert.equal(director.members[0].mode, 'perched');
});

test('a scene written for one character is not played by another, and the mismatch is reported', async () => {
    const run = async (sceneFields, characterName = 'stickman') => {
        const page = fakePage({ width: 1000, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a', 'data-fig-scene': 's', 'data-fig-on': 'view', 'data-fig-enter': 'none' }, rect: { x: 100, y: 300, w: 600, h: 200 } }] });
        const clock = createClock();
        let played = 0;
        const director = createDirector({
            stage: createStage({ doc: page.doc, win: page.win }), clock, win: page.win, doc: page.doc,
            scenes: { s: { ...sceneFields, async play() { played++; } } },
            cast: { default: { character: { ...stickman, name: characterName } } },
        }).start();
        await advance(clock, 3000);
        return { played, problems: director.problems, lines: describeProblems(director.problems) };
    };
    assert.equal((await run({})).played, 1, 'a scene for any character plays');
    assert.equal((await run({ character: 'stickman' })).played, 1, 'its own scene plays');
    assert.equal((await run({ character: ['teapot', 'stickman'] })).played, 1, 'one of several plays');
    const wrong = await run({ character: 'teapot' });
    assert.equal(wrong.played, 0, 'a scene made for another character does not play');
    assert.equal(wrong.problems.length, 1);
    assert.match(wrong.lines[0], /scene "s" .*teapot.*stickman/);
    assert.match(wrong.problems[0].fix, /adapt/i);
    assert.equal(checkScene('s', { character: 3, play() {} }).length, 1, 'character is a name or a list of names');
    assert.equal(checkScene('s', { character: [], play() {} }).length, 1);
});

test('a character that cannot sit on an edge is never made to', async () => {
    const run = async sits => {
        const page = fakePage({ width: 1000, height: 800, elements: [{ attrs: { 'data-fig-spot': 'a', 'data-fig-enter': 'none' }, rect: { x: 100, y: 300, w: 600, h: 200 } }] });
        const clock = createClock();
        const director = createDirector({
            stage: createStage({ doc: page.doc, win: page.win }), clock, win: page.win, doc: page.doc,
            cast: { default: { character: { ...stickman, ...(sits === undefined ? {} : { sits }) } } },
        }).start();
        let sat = 0;
        clock.onFrame(() => { sat = Math.max(sat, director.members[0].figure.state.sit); });
        await advance(clock, 40000);
        return sat;
    };
    assert.ok(await run(undefined) > 0.9, 'left alone on an edge, a character ends up sitting');
    assert.equal(await run(false), 0, 'one that says it does not sit stays on its feet');
});
