import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advance } from '../src/core/clock.js';
import { createStage } from '../src/stage/stage.js';
import { createFigure } from '../src/figure/figure.js';
import { createActor } from '../src/actor/actor.js';
import { createProp } from '../src/props/prop.js';
import { chair, couch, notebook, pen } from '../src/props/library.js';
import { seatHeight } from '../src/body/body.js';
import { stickman } from '../src/characters/stickman.js';
import { fakeDocument } from './helpers/fake-dom.js';

const near = (a, b, tolerance, message) =>
    assert.ok(Math.abs(a - b) <= tolerance, `${message}: expected ${b} ± ${tolerance}, got ${a}`);

function setup({ unit = 1 } = {}) {
    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const clock = createClock();
    const figure = createFigure({ stage, character: stickman, unit });
    Object.assign(figure.state, { legs: 1, arms: 1 });
    figure.state.y = -figure.standHeight();
    const actor = createActor({ figure, clock, anchor: stage.at(400, 300) }).show();
    return { stage, clock, figure, actor, unit };
}

test('a named point follows the prop: position, scale, tilt and flip', () => {
    const { stage } = setup();
    const prop = createProp({ stage, prop: { name: 't', shapes: [], points: { tip: [10, 0] } }, unit: 2 });
    prop.render([100, 50]);
    assert.deepEqual(prop.point('tip'), [120, 50]);

    prop.state.tilt = 90;
    prop.render([100, 50]);
    near(prop.point('tip')[0], 100, 1e-9, 'x after a quarter turn');
    near(prop.point('tip')[1], 70, 1e-9, 'y after a quarter turn');

    Object.assign(prop.state, { tilt: 0, flip: -1, scale: 0.5, x: 5 });
    prop.render([100, 50]);
    assert.deepEqual(prop.point('tip'), [95, 50]);
});

test('asking for a point that does not exist says which ones do', () => {
    const { stage } = setup();
    const prop = createProp({ stage, prop: chair });
    assert.throws(() => prop.point('handle'), /no point named "handle".*seat/);
});

test('the chair is the right height: a seated figure rests on its seat', async () => {
    for (const unit of [1, 2.2]) {
        const { stage, clock, figure, actor } = setup({ unit });
        const seat = createProp({ stage, prop: chair, unit });
        seat.render([400, 300]);

        actor.play(async c => { await c.tween({ seat: 1 }, 200); });
        await advance(clock, 300);

        const hip = figure.points.legL.hip;
        near(hip[1], seat.point('seat')[1], 0.01, `hips on the seat (unit ${unit})`);
        near(300 - seat.point('seat')[1], seatHeight(figure.body) * unit, 0.01, 'seat height');
        near(figure.points.legL.foot[1], 300, 0.01, 'feet on the floor');
    }
});

test('a held prop stays in the hand wherever the hand goes', async () => {
    const { stage, clock, figure, actor } = setup({ unit: 2 });
    const book = createProp({ stage, prop: notebook, unit: 2 });
    actor.hold('left', book);

    actor.play(async c => {
        await c.hands({ left: { x: -12, y: 4, angle: 150 } }, 100);
        await c.tween({ x: 120, crouch: 6 }, 200);
    });
    for (let i = 0; i < 25; i++) {
        await advance(clock, 16);
        const tip = figure.points.armL.tip, grip = book.point('grip');
        near(grip[0], tip[0], 0.01, `grip x at frame ${i}`);
        near(grip[1], tip[1], 0.01, `grip y at frame ${i}`);
    }
});

test('letting go stops the prop following the hand', async () => {
    const { stage, clock, figure, actor } = setup();
    const p = createProp({ stage, prop: pen });
    const release = actor.hold('right', p, { tilt: 20 });
    await advance(clock, 32);
    const before = p.point('grip');
    assert.equal(p.state.tilt, 20);

    release();
    figure.state.x = 200;
    await advance(clock, 32);
    assert.deepEqual(p.point('grip'), before);
});

test('what a sequence brings on stage leaves with it, done or interrupted', async () => {
    for (const interrupt of [false, true]) {
        const { stage, clock, actor } = setup();
        const before = stage.svg.children.length;
        const result = actor.play(async c => {
            const seat = createProp({ stage, prop: couch });
            c.onLeave(() => seat.destroy());
            const book = createProp({ stage, prop: notebook });
            c.onLeave(() => book.destroy());
            c.onLeave(actor.hold('left', book));
            await c.wait(500);
        });
        await advance(clock, 100);
        assert.equal(stage.svg.children.length, before + 2, 'props are on stage');
        if (interrupt) actor.cancel();
        await advance(clock, 600);
        assert.equal(await result, interrupt ? 'cancelled' : 'done');
        assert.equal(stage.svg.children.length, before, 'nothing left behind');
    }
});

test('a prop can be drawn in progressively', () => {
    const { stage } = setup();
    const prop = createProp({ stage, prop: chair });
    const layer = stage.svg.children.at(-1);
    prop.state.draw = 0;
    prop.render([0, 0]);
    assert.equal(layer.attrs.visibility, 'hidden');
    prop.state.draw = 0.5;
    prop.render([0, 0]);
    assert.equal(layer.attrs.visibility, 'visible');
    assert.equal(layer.children[0].attrs['stroke-dashoffset'], '0.500');
});

test('a prop can be held by any of its points, at an angle', async () => {
    const { stage, clock, figure, actor } = setup({ unit: 2 });
    const p = createProp({ stage, prop: pen, unit: 2 });
    actor.hold('right', p, { point: 'tip', tilt: 40 });
    await advance(clock, 32);
    const tip = figure.points.armR.tip, held = p.point('tip');
    near(held[0], tip[0], 0.01, 'the pen tip is in the hand, x');
    near(held[1], tip[1], 0.01, 'the pen tip is in the hand, y');
    const grip = p.point('grip');
    assert.ok(Math.hypot(grip[0] - tip[0], grip[1] - tip[1]) > 4, 'so its grip is elsewhere');
});

test('a prop brought by a scene is sized like the figure, at any scale', async () => {
    // The bug: a figure roaming a page at scale 0.6 got furniture at scale 1,
    // so it sat in mid-air under a chair too big for it.
    for (const scale of [1, 0.6]) {
        const { clock, figure, actor } = setup({ unit: 2 });
        figure.state.scale = scale;
        figure.state.y = -figure.standHeight();
        let seat, sofa;
        actor.play(async c => {
            seat = c.prop(chair);
            sofa = c.prop(couch, { x: 100 });
            await c.tween({ seat: 1 }, 200);
            await c.wait(1000);
        });
        await advance(clock, 300);

        near(figure.points.legL.hip[1], seat.point('seat')[1], 0.01, `hips on the seat (scale ${scale})`);
        near(sofa.point('seat')[0] - seat.point('seat')[0], (100 + 1) * 2 * scale, 0.01, `offsets shrink with the figure (scale ${scale})`);
    }
});

test('a prop is drawn with the same line as the figure that brought it', async () => {
    const thin = { ...stickman, name: 'thin', line: 1.6, scaleLine: false };
    for (const [character, scale] of [[stickman, 1], [stickman, 0.5], [thin, 0.5]]) {
        const { doc, win } = fakeDocument();
        const stage = createStage({ doc, win });
        const clock = createClock();
        const figure = createFigure({ stage, character, unit: 2 });
        Object.assign(figure.state, { legs: 1, arms: 1, scale });
        const actor = createActor({ figure, clock, anchor: stage.at(0, 0) }).show();
        let seat, book;
        actor.play(async c => { seat = c.prop(chair); book = c.give('left', notebook); await c.wait(500); });
        await advance(clock, 32);

        const limb = Number(figure.layer.children.find(n => n.attrs.class === 'fig-limb').attrs['stroke-width']);
        const layerOf = prop => stage.svg.children.find(n => n.attrs['data-fig-layer'] === prop.name);
        // On screen, a stroke is its width times the scale of the layer it is in.
        const onScreen = (prop, i) => Number(layerOf(prop).children[i].attrs['stroke-width']) * prop.k;
        near(onScreen(seat, 0), limb, 0.01, `${character.name} at ${scale}: chair line`);
        near(onScreen(book, 0), limb, 0.01, `${character.name} at ${scale}: notebook outline`);
        assert.ok(onScreen(book, 1) < limb * 0.6, 'the ruled lines of the notebook are lighter than its outline');
    }
});

test('props erase themselves when the scene ends, instead of vanishing', async () => {
    const { stage, clock, actor } = setup();
    const before = stage.svg.children.length;
    let seat;
    actor.play(async c => { seat = c.prop(chair); await c.wait(100); });
    await advance(clock, 64);
    assert.equal(seat.state.draw, 1);
    await advance(clock, 64 + 80);
    assert.equal(stage.svg.children.length, before + 1, 'still there just after the scene');
    assert.ok(seat.state.draw < 1 && seat.state.draw > 0, `being erased, got ${seat.state.draw}`);
    await advance(clock, 400);
    assert.equal(stage.svg.children.length, before, 'then gone');
    assert.equal(clock.idle, false, 'the figure keeps drawing');
});

test('destroying the actor removes its props at once, even mid-erase', async () => {
    const { stage, clock, actor } = setup();
    const before = stage.svg.children.length;
    actor.play(async c => { c.prop(chair); c.give('left', notebook); await c.wait(100); });
    await advance(clock, 160); // the scene is over, the props are being erased
    assert.equal(stage.svg.children.length, before + 2);
    actor.destroy();
    assert.equal(stage.svg.children.length, before - 1, 'props and figure are gone');
});

test('an interrupted scene clears its props at once, even from a long wait', async () => {
    // The bug: the interrupted sequence only noticed at the end of the step it
    // was waiting on, so its furniture stayed on stage for up to that long.
    const { stage, clock, actor } = setup();
    const before = stage.svg.children.length;
    let left = false;
    actor.play(async c => { c.prop(chair); c.onLeave(() => { left = true; }); await c.wait(5000); });
    await advance(clock, 100);
    actor.play(async c => { await c.wait(50); });
    await advance(clock, 16);
    assert.equal(left, true, 'the old scene has unwound');
    await advance(clock, 300);
    assert.equal(stage.svg.children.length, before, 'its chair is gone');
});

test('a prop the scene enlarges keeps the figure\'s line', async () => {
    // The bug: a scene that made one prop bigger (the subject of the scene)
    // got it drawn with a heavier line than everything else.
    const { stage, clock, figure, actor } = setup({ unit: 2 });
    let seat;
    actor.play(async c => { seat = c.prop(chair, { state: { scale: 1.5 } }); await c.wait(500); });
    await advance(clock, 32);
    const limb = Number(figure.layer.children.find(n => n.attrs.class === 'fig-limb').attrs['stroke-width']);
    const layer = stage.svg.children.find(n => n.attrs['data-fig-layer'] === 'chair');
    near(Number(layer.children[0].attrs['stroke-width']) * seat.k, limb, 0.01, 'line on screen at scale 1.5');
    seat.state.scale = 0.5;
    await advance(clock, 32);
    near(Number(layer.children[0].attrs['stroke-width']) * seat.k, limb, 0.01, 'and after the scale changes');
});

test('a shape may carry a word: filled text, not a stroked outline', () => {
    const { stage } = setup();
    createProp({ stage, prop: { name: 'sign', shapes: [{ tag: 'text', text: 'STRIKE', attrs: { x: 0, y: 0 } }] } });
    const layer = stage.svg.children.at(-1);
    const word = layer.children[0];
    assert.equal(word.textContent, 'STRIKE');
    assert.equal(word.getAttribute('stroke'), 'none');
    assert.equal(word.getAttribute('fill'), 'var(--fig-ink, currentColor)');
});

test('a held prop can be turned in the hand while it is held', async () => {
    const { stage, clock, figure, actor } = setup({ unit: 2 });
    const book = createProp({ stage, prop: notebook, unit: 2 });
    const spin = { angle: 0 };
    actor.hold('left', book, { tilt: () => spin.angle });
    actor.play(async c => {
        await c.hands({ left: { x: -12, y: 4, angle: 150 } }, 50);
        await c.animate(spin, { angle: 180 }, 200);
    });
    await advance(clock, 400);
    assert.equal(book.state.tilt, 180, 'the prop follows the angle it is given');
    const tip = figure.points.armL.tip, grip = book.point('grip');
    near(grip[0], tip[0], 0.01, 'still in the hand, x');
    near(grip[1], tip[1], 0.01, 'still in the hand, y');
});
