import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advance } from '../src/core/clock.js';
import { createStage } from '../src/stage/stage.js';
import { createDirector } from '../src/director/director.js';
import { chair } from '../src/props/library.js';
import { stickman } from '../src/characters/stickman.js';
import { fakePage } from './helpers/fake-dom.js';

const near = (a, b, tolerance, message) =>
    assert.ok(Math.abs(a - b) <= tolerance, `${message}: expected ${b} ± ${tolerance}, got ${a}`);

function setup({ elements, scenes = {}, media, width = 1000, height = 800 }) {
    const page = fakePage({ width, height, elements, media });
    const stage = createStage({ doc: page.doc, win: page.win });
    const clock = createClock();
    const director = createDirector({
        stage, clock, win: page.win, doc: page.doc, scenes,
        cast: { default: { character: stickman, unit: 1, scale: 0.6 } },
    }).start();
    const member = director.members[0];
    return { page, stage, clock, director, member, s: member?.figure.state, figure: member?.figure };
}

// Where the feet are on the page, from the anchor and the state.
const feet = ({ member, figure }) => {
    const o = member.actor.anchor();
    return [o[0] + figure.state.x, o[1] + figure.state.y + figure.standHeight()];
};

const spot = (name, y, more = {}, rect = {}) => ({
    attrs: { 'data-fig-spot': name, ...more },
    rect: { x: 100, y, w: 600, h: 200, ...rect },
});

test('it arrives on a place once that place is on screen, feet on its top edge', async () => {
    const t = setup({ elements: [spot('gallery', 1500, { 'data-fig-at': '0.25' })] });
    await advance(t.clock, 6000);
    assert.notEqual(t.member.mode, 'perched', 'below the fold: it waits in the wings');
    assert.equal(t.member.placed, false);

    t.page.scrollTo(1100);
    await advance(t.clock, 4000);
    assert.equal(t.member.mode, 'perched');
    const [x, y] = feet(t);
    near(x, 100 + 600 * 0.25, 0.5, 'at a quarter of the element');
    near(y, 1500, 0.5, 'standing on its top edge');
    near(t.figure.points.legL.foot[1], 1500, 0.5, 'and its drawn foot is there too');
    near(t.figure.k, 0.6, 1e-9, 'at its roaming size');
});

test('with data-fig-enter="none" there is no entrance: it is simply standing there', async () => {
    const t = setup({ elements: [spot('here', 300, { 'data-fig-enter': 'none' })] });
    await advance(t.clock, 48);
    assert.equal(t.member.mode, 'perched', 'on its place within three frames');
    const [x, y] = feet(t);
    near(x, 400, 0.5, 'in the middle of the element');
    near(y, 300, 0.5, 'standing on its top edge');
    assert.equal(t.director.problems.length, 0, 'and "none" is a known value');
});

test('while it waits in the wings, a character is nowhere on the page', async () => {
    // The bug: a character whose first place was below the fold stood at the
    // page origin, full size, until the visitor scrolled down to it.
    const t = setup({ elements: [spot('gallery', 1500)] });
    await advance(t.clock, 3000);
    assert.equal(t.member.placed, false);
    const [, y] = feet(t);
    assert.ok(y < -100, `its feet should be well above the page, got y = ${y}`);
});

test('a cast member may start from a given state', async () => {
    const page = fakePage({ elements: [spot('gallery', 300)] });
    const stage = createStage({ doc: page.doc, win: page.win });
    const clock = createClock();
    const director = createDirector({
        stage, clock, win: page.win, doc: page.doc,
        cast: { default: { character: stickman, state: { wave: 1 } } },
    }).start();
    assert.equal(director.members[0].figure.state.wave, 1);
});

test('a place whose scene waits for the visitor is not a stop on the scroll route', async () => {
    const t = setup({
        scenes: { card: { async play(c) { await c.wait(50); } } },
        elements: [
            spot('row', 150),
            // Right in the middle of the screen, where a scroll stop would win.
            { attrs: { 'data-fig-scene': 'card' }, rect: { x: 300, y: 400, w: 200, h: 100 } },
        ],
    });
    await advance(t.clock, 6000);
    assert.equal(t.member.places[t.member.current].name, 'row');
    assert.equal(t.member.mode, 'perched');
});

test('on a touch screen, a scene plays while its place is centred, and stops when it is not', async () => {
    let running = false;
    const t = setup({
        width: 390, height: 700, media: { '(hover: none)': true },
        scenes: { card: { async play(c) { running = true; c.onLeave(() => { running = false; }); for (;;) await c.wait(100); } } },
        elements: [{ attrs: { 'data-fig-scene': 'card' }, rect: { x: 40, y: 1000, w: 300, h: 100 } }],
    });
    t.page.scrollTo(700); // the card's centre is at 350 of 700: centred
    await advance(t.clock, 6000);
    assert.equal(running, true, 'centred: the scene plays');

    t.page.scrollTo(450); // centre at 600 of 700: still on screen, no longer centred
    await advance(t.clock, 2000);
    assert.equal(running, false, 'off centre: the scene stops');
    assert.equal(t.member.mode, 'perched', 'and it stays on the card, on its feet');
});

test('scrolling to another place takes it there', async () => {
    const t = setup({ elements: [spot('one', 600), spot('two', 2400, { 'data-fig-enter': 'drop' })] });
    await advance(t.clock, 4000);
    assert.equal(t.member.places[t.member.current].name, 'one');

    t.page.scrollTo(2000);
    await advance(t.clock, 6000);
    assert.equal(t.member.mode, 'perched');
    assert.equal(t.member.places[t.member.current].name, 'two');
    near(feet(t)[1], 2400, 0.5, 'standing on the second place');

    t.page.scrollTo(200);
    await advance(t.clock, 6000);
    assert.equal(t.member.places[t.member.current].name, 'one', 'and back up');
    near(feet(t)[1], 600, 0.5, 'standing on the first place again');
});

test('if the layout moves, it stays on its place', async () => {
    const t = setup({ elements: [spot('card', 500)] });
    await advance(t.clock, 4000);
    t.page.nodes[0].rect = { x: 40, y: 560, w: 300, h: 200 }; // a column reflow
    t.page.win.dispatch('resize');
    await advance(t.clock, 100);
    near(t.figure.points.legL.foot[1], 560, 0.5, 'feet follow the edge');
    near(feet(t)[0], 40 + 150, 0.5, 'and the fraction along it');
});

test('a solemn place: it walks in, and a close pointer does not make it jump', async () => {
    const t = setup({ elements: [spot('grave', 500, { 'data-fig-mood': 'solemn', 'data-fig-enter': 'drop' })] });
    let flew = false;
    t.clock.onFrame(() => { if (t.s.stretch > 0.1 || t.s.rope > 0.1 || t.s.squash < -0.1) flew = true; });
    await advance(t.clock, 5000);
    assert.equal(t.member.mode, 'perched');
    assert.equal(flew, false, 'no drop, no thread, no stretch: it came on foot');

    const [x, y] = feet(t);
    t.page.pointer(x + 10, y - 30);
    let jumped = false;
    t.clock.onFrame(() => { if (t.s.y < t.member.standY - 2) jumped = true; });
    await advance(t.clock, 2500);
    assert.equal(jumped, false);
    assert.ok(t.s.gazeY > 0.8 && t.s.lid < 0.8, 'it stands with its eyes lowered');
});

test('elsewhere, a pointer that comes too close makes it jump, then it settles', async () => {
    const t = setup({ elements: [spot('ledge', 500)] });
    await advance(t.clock, 4000);
    const standY = t.member.standY;
    const [x, y] = feet(t);
    let highest = 0;
    t.clock.onFrame(() => { highest = Math.max(highest, standY - t.s.y); });
    t.page.pointer(x + 20, y - 30);
    await advance(t.clock, 3000);
    assert.ok(highest > 5, `it left the ground (${highest.toFixed(1)} px)`);
    near(t.s.y, standY, 0.01, 'and came back down where it stood');
    assert.equal(t.member.mode, 'perched');
});

test('a scene waiting for attention: hover brings it over and plays; leaving stops it cleanly', async () => {
    const log = [];
    const scenes = {
        psy: {
            room: { left: 10, right: 60, up: 120 },
            async play(c, { variant }) {
                log.push(`start:${variant}`);
                c.prop(chair, { behind: true });
                c.onLeave(() => log.push('left'));
                await c.tween({ seat: 1 }, 200);
                for (;;) await c.wait(100);
            },
        },
    };
    const t = setup({
        scenes,
        elements: [
            spot('row', 500, {}, { x: 100, w: 800 }),
            { attrs: { 'data-fig-scene': 'psy', 'data-fig-at': '0.1' }, rect: { x: 520, y: 500, w: 240, h: 200 } },
        ],
    });
    await advance(t.clock, 4000);
    assert.equal(t.member.places[t.member.current].name, 'row');
    const layersAtRest = t.stage.svg.children.length;

    t.page.nodes[1].dispatch('pointerenter');
    await advance(t.clock, 5000);
    assert.equal(t.member.places[t.member.current].name, 'psy', 'it went to the card');
    near(feet(t)[0], 520 + 24, 0.5, 'and stands where the card says');
    assert.deepEqual(log, ['start:full']);
    assert.equal(t.s.seat, 1, 'the scene is playing');
    assert.equal(t.stage.svg.children.length, layersAtRest + 1, 'its chair is on stage');

    t.page.nodes[1].dispatch('pointerleave');
    await advance(t.clock, 4000);
    assert.deepEqual(log, ['start:full', 'left']);
    assert.equal(t.s.seat, 0, 'it stood back up');
    assert.equal(t.stage.svg.children.length, layersAtRest, 'the chair is gone');
    assert.equal(t.member.places[t.member.current].name, 'row', 'and it went back to its ledge');
});

test('a scene that does not fit is not played; its smaller variant is', async () => {
    const played = [];
    const scene = room => ({
        room, variants: [{ name: 'compact', room: { right: 40, up: 100 } }],
        async play(c, { variant }) { played.push(variant); await c.wait(50); },
    });
    // 390 px wide phone, the place near the right edge: about 90 px free to the right.
    const phone = scenes => setup({
        width: 390, height: 700, scenes, media: { '(hover: none)': true },
        elements: [{ attrs: { 'data-fig-scene': 'wide', 'data-fig-at': '0.9' }, rect: { x: 20, y: 300, w: 300, h: 100 } }],
    });

    const t = phone({ wide: scene({ right: 400, up: 100 }) });
    await advance(t.clock, 6000);
    assert.deepEqual(played.slice(0, 1), ['compact'], 'the full version needs 240 px; the compact one fits');

    played.length = 0;
    const none = phone({ wide: { room: { right: 400, up: 100 }, async play(c) { played.push('full'); await c.wait(50); } } });
    await advance(none.clock, 6000);
    assert.deepEqual(played, [], 'no variant fits: nothing is played');
    assert.equal(none.member.mode, 'perched', 'and it simply stays there');
});

test('with reduced motion asked for, nothing is created and nothing moves', async () => {
    const t = setup({ elements: [spot('a', 400)], media: { '(prefers-reduced-motion: reduce)': true } });
    await advance(t.clock, 3000);
    assert.equal(t.director.reduced, true);
    assert.equal(t.director.members.length, 0);
    assert.equal(t.stage.svg.children.length, 0);
    assert.equal(t.page.win.listenerCount(), 0);
});

test('stop removes the characters and every listener', async () => {
    const t = setup({ elements: [spot('a', 400), { attrs: { 'data-fig-scene': 'x' }, rect: { x: 0, y: 400, w: 100, h: 100 } }], scenes: { x: { async play() {} } } });
    await advance(t.clock, 3000);
    assert.ok(t.page.win.listenerCount() > 0);
    t.director.stop();
    await advance(t.clock, 500);
    assert.equal(t.stage.svg.children.length, 0);
    assert.equal(t.page.win.listenerCount(), 0);
    assert.equal(t.page.nodes[1].listenerCount(), 0);
    assert.equal(t.clock.idle, true);
});

test('markers with mistakes are reported, and the page still works', async () => {
    const t = setup({ elements: [spot('ok', 400, { 'data-fig-enter': 'fly' })] });
    assert.equal(t.director.problems.length, 1);
    assert.match(t.director.problems[0].fix, /Allowed: walk, rope, drop/);
    await advance(t.clock, 4000);
    assert.equal(t.member.mode, 'perched', 'the bad option fell back to its default');
});

test('a home controller: born at home, held until ready, then leaves and comes back through it', async () => {
    const calls = [];
    let ready;
    const home = {
        begin(api, { atHome }) { calls.push(`begin:${atHome}`); return new Promise(resolve => { ready = resolve; }); },
        async leave(c) { calls.push('leave'); await c.tween({ legs: 1, arms: 1 }, 100); },
        async enter(c, api) { calls.push('enter'); api.state.y = -api.figure.standHeight(); await c.tween({ legs: 0, arms: 0 }, 100); },
        frame() { calls.includes('frame') || calls.push('frame'); },
    };
    const page = fakePage({ elements: [
        { attrs: { 'data-fig-home': 'default' }, rect: { x: 400, y: 200, w: 200, h: 200 } },
        spot('below', 2000),
    ] });
    const stage = createStage({ doc: page.doc, win: page.win });
    const clock = createClock();
    const director = createDirector({
        stage, clock, win: page.win, doc: page.doc,
        cast: { default: { character: stickman, home } },
    }).start();
    const member = director.members[0];

    await advance(clock, 1000);
    assert.deepEqual(calls, ['begin:true'], 'held: nothing else happens before the controller is ready');
    assert.equal(member.mode, 'home');

    ready();
    await advance(clock, 500);
    assert.ok(calls.includes('frame'), 'once ready, the controller runs every frame at home');

    page.scrollTo(1600);
    await advance(clock, 6000);
    assert.ok(calls.includes('leave'), 'leaving home goes through the controller');
    assert.equal(member.places[member.current].name, 'below');
    assert.equal(member.mode, 'perched');

    page.scrollTo(0);
    await advance(clock, 6000);
    assert.ok(calls.includes('enter'), 'coming back too');
    assert.equal(member.mode, 'home');
    assert.equal(member.figure.state.legs, 0);
});

test('a home controller may say when the home is wanted, whatever the distances', async () => {
    // A logo in a sticky navbar is always near the top of the screen: by
    // distance alone it would win or lose for the wrong reasons.
    let wanted = true;
    const home = {
        wanted: () => wanted,
        visible: () => true, // a sticky navbar is always on screen
        async leave(c) { await c.tween({ legs: 1, arms: 1 }, 100); },
        async enter(c, api) { api.state.y = -api.figure.standHeight(); await c.tween({ legs: 0, arms: 0 }, 100); },
    };
    const page = fakePage({ elements: [
        { attrs: { 'data-fig-home': 'default' }, rect: { x: 20, y: 600, w: 30, h: 30 } },
        spot('title', 300),
    ] });
    const stage = createStage({ doc: page.doc, win: page.win });
    const clock = createClock();
    const director = createDirector({
        stage, clock, win: page.win, doc: page.doc,
        cast: { default: { character: stickman, home } },
    }).start();
    const member = director.members[0];
    const target = () => member.places[member.target].name;

    // The place (100 px from the middle) is nearer than the home (215 px).
    await advance(clock, 3000);
    assert.equal(target(), 'default:home', 'wanted at home: it stays, though a place is nearer the middle');
    assert.equal(member.mode, 'home');

    // Now the home (35 px from the middle) is nearer than the place (350 px).
    wanted = false;
    page.scrollTo(250);
    await advance(clock, 1000);
    assert.equal(target(), 'title', 'not wanted at home: the home is not a candidate, however near');

    wanted = true;
    page.scrollTo(0);
    await advance(clock, 6000);
    assert.equal(member.mode, 'home', 'wanted again: it comes back');
});

test('lines keep their thickness at any scale when the character asks for it', async () => {
    const { createFigure } = await import('../src/figure/figure.js');
    const { fakeDocument } = await import('./helpers/fake-dom.js');
    const widths = scaleLine => {
        const { doc, win } = fakeDocument();
        const stage = createStage({ doc, win });
        const figure = createFigure({ stage, character: { ...stickman, scaleLine }, unit: 2 });
        Object.assign(figure.state, { legs: 1, scale: 0.5 });
        figure.render([0, 0]);
        return stage.svg.children[0].children.find(n => n.attrs.class === 'fig-limb').attrs['stroke-width'];
    };
    assert.equal(widths(undefined), '3.00', 'by default the line follows the scale: 3 × 2 × 0.5');
    assert.equal(widths(false), '6.00', 'kept constant: 3 × 2');
});

test('a scene gets the effects layer given to the director', async () => {
    const page = fakePage({ elements: [{ attrs: { 'data-fig-scene': 'card' }, rect: { x: 300, y: 400, w: 300, h: 100 } }] });
    const stage = createStage({ doc: page.doc, win: page.win });
    const clock = createClock();
    const fx = { marker: true };
    let seen;
    const director = createDirector({
        stage, clock, win: page.win, doc: page.doc, fx,
        scenes: { card: { async play(c, { api }) { seen = api.fx; await c.wait(50); } } },
        cast: { default: { character: stickman, unit: 1, scale: 0.6 } },
    }).start();
    page.nodes[0].dispatch('pointerenter');
    await advance(clock, 6000);
    assert.equal(seen, fx);
    director.stop();
});

test('a choreography may take a character: the page leaves it alone, then gets it back', async () => {
    let scenePlays = 0;
    const t = setup({
        elements: [spot('a', 300, { 'data-fig-scene': 'act', 'data-fig-on': 'idle' }), spot('b', 2000)],
        scenes: { act: { async play(c) { scenePlays++; await c.wait(200); } } },
    });
    await advance(t.clock, 5000);
    assert.equal(t.member.mode, 'perched');

    let step = 'none';
    const done = t.member.direct(async (c, api) => {
        step = 'started';
        // Positions are now measured from the screen's top-left corner.
        await c.tween({ x: 500, y: 600 }, 400);
        step = 'moved';
        await c.wait(20000);
        step = 'finished';
    });
    await advance(t.clock, 1000);
    assert.equal(step, 'moved');
    assert.deepEqual(t.member.actor.anchor(), [0, 0], 'anchored to the screen');
    near(t.s.x, 500, 0.5, 'where the choreography put it');

    // Nothing the page does reaches it: no scene, no jump, no travel.
    const before = scenePlays;
    t.page.pointer(500, 600);
    t.page.scrollTo(1600);
    await advance(t.clock, 9000);
    assert.equal(scenePlays, before, 'no place scene while directed');
    near(t.s.y, 600, 0.5, 'a close pointer did not make it jump');
    assert.equal(t.member.placed && t.member.mode === 'perched', false, 'and it did not travel to the other place');

    // Released before the end: it goes back to where the page wants it.
    t.member.release();
    assert.equal(await done, 'cancelled');
    await advance(t.clock, 6000);
    assert.equal(step, 'moved', 'the choreography did not go on');
    assert.equal(t.member.mode, 'perched');
    assert.equal(t.member.places[t.member.current].name, 'b');
    near(feet(t)[1], 2000, 0.5, 'standing on its place again');
});

test('a choreography that ends by itself gives the character back too', async () => {
    const t = setup({ elements: [spot('a', 300)] });
    await advance(t.clock, 5000);
    const done = t.member.direct(async c => {
        await c.tween({ x: 40, y: 700, tilt: 30 }, 200);
        await c.hands({ left: { x: 50, y: 0 } }, 100); // it ends holding a hand out
    });
    await advance(t.clock, 9000);
    assert.equal(await done, 'done');
    assert.equal(t.member.mode, 'perched');
    near(feet(t)[1], 300, 0.5, 'back on its place');
    near(t.s.tilt, 0, 0.01, 'and tidy');
    near(t.s.handL.weight, 0, 0.01, 'its hand let go on the way back');
});

test('given back with nowhere to go yet, it waits well out of sight', async () => {
    // The bug: after a choreography, a character whose place was below the
    // fold dived under the screen and stayed there, its top still showing.
    const t = setup({ elements: [spot('far', 3000)] });
    await advance(t.clock, 1000);
    const done = t.member.direct(async c => { await c.tween({ x: 500, y: 600, scale: 1 }, 200); });
    await advance(t.clock, 4000);
    assert.equal(await done, 'done');
    assert.equal(t.member.placed, false, 'its place is not on screen: it is in the wings');
    assert.ok(t.s.y < -300, `it should wait far above the screen, got y = ${t.s.y}`);
});

test('a scene played on view that the visitor interrupts starts again once left alone; a finished one does not', async () => {
    let starts = 0, endless = true;
    const t = setup({
        elements: [spot('here', 300, { 'data-fig-enter': 'none', 'data-fig-scene': 'act', 'data-fig-on': 'view' })],
        scenes: { act: { async play(c) { starts++; do { await c.wait(500); } while (endless); } } },
    });
    await advance(t.clock, 2000);
    assert.equal(starts, 1, 'the scene plays as soon as its place is in view');

    // The pointer comes too close: it jumps, and the scene is cut short.
    const [x, y] = feet(t);
    t.page.pointer(x + 20, y - 30);
    await advance(t.clock, 1500);
    assert.equal(starts, 1, 'not restarted under the pointer');
    await advance(t.clock, 3500);
    assert.equal(starts, 1, 'still not, while the pointer stays close: no jump-and-restart loop');

    // The pointer goes away: the scene starts again.
    t.page.pointer(x + 600, y + 400);
    await advance(t.clock, 3000);
    assert.equal(starts, 2, 'left alone, it picks its scene up again');

    // This time it runs to its end: once is enough.
    endless = false;
    await advance(t.clock, 8000);
    assert.equal(starts, 2, 'a scene that finished is not played again on the same visit');
});
