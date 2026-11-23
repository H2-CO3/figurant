import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advance } from '../src/core/clock.js';
import { createStage } from '../src/stage/stage.js';
import { createFigure } from '../src/figure/figure.js';
import { createActor } from '../src/actor/actor.js';
import { stickman } from '../src/characters/stickman.js';
import { handSeals, SIGNS } from '../examples/hand-seals.js';
import { createFx } from '../src/fx/fx.js';
import { ELEMENTS } from '../examples/elements.js';
import { fakeDocument } from './helpers/fake-dom.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function setup() {
    const { doc, win } = fakeDocument();
    const stage = createStage({ doc, win });
    const clock = createClock();
    const fx = createFx({ stage, clock, seed: 3 });
    const figure = createFigure({ stage, character: stickman });
    Object.assign(figure.state, { legs: 1, arms: 1 });
    figure.state.y = -figure.standHeight();
    const actor = createActor({ figure, clock, anchor: stage.at(400, 300) }).show();
    return { clock, figure, actor, fx };
}

test('play runs a sequence to its end and reports it', async () => {
    const { clock, actor } = setup();
    const result = actor.play(async c => {
        await c.tween({ crouch: 10 }, 100);
        await c.wait(50);
        await c.tween({ crouch: 0 }, 100);
    });
    await advance(clock, 300);
    assert.equal(await result, 'done');
    assert.equal(actor.state.crouch, 0);
});

test('a new sequence interrupts the current one, which stops writing', async () => {
    const { clock, actor } = setup();
    let reachedEnd = false;
    const first = actor.play(async c => {
        await c.tween({ x: 500 }, 1000);
        await c.tween({ x: 900 }, 1000);
        reachedEnd = true;
    });
    await advance(clock, 300);

    const second = actor.play(async c => { await c.tween({ x: -20 }, 100); });
    await advance(clock, 2500);

    assert.equal(await first, 'cancelled');
    assert.equal(await second, 'done');
    assert.equal(reachedEnd, false, 'the interrupted sequence never resumes');
    assert.equal(actor.state.x, -20);
});

test('an interrupted wait does not let its sequence continue', async () => {
    const { clock, actor } = setup();
    let continued = false;
    const first = actor.play(async c => { await c.wait(200); continued = true; c.state.x = 999; });
    await advance(clock, 50);
    actor.cancel();
    await advance(clock, 400);
    assert.equal(await first, 'cancelled');
    assert.equal(continued, false);
    assert.notEqual(actor.state.x, 999);
});

test('a real error in a sequence is not swallowed', async () => {
    const { clock, actor } = setup();
    const outcome = actor.play(async () => { throw new Error('broken scene'); })
        .then(() => 'resolved', error => error.message);
    await advance(clock, 16);
    assert.equal(await outcome, 'broken scene');
});

test('the hand-seals example: every sign is reached by both hands', async () => {
    const { clock, figure, actor } = setup();
    const k = figure.k;
    const hit = new Set();

    // On every frame, note which signs both hands are exactly on.
    clock.onFrame(() => {
        const { armL, armR, centre } = figure.points;
        if (!armL || !armR) return;
        SIGNS.forEach((s, i) => {
            const left = [centre[0] + s.left.x * k, centre[1] + s.left.y * k];
            const right = [centre[0] + s.right.x * k, centre[1] + s.right.y * k];
            if (dist(armL.hand, left) < 0.05 && dist(armR.hand, right) < 0.05) {
                assert.ok(armL.reached && armR.reached, `sign ${i} is within reach`);
                hit.add(i);
            }
        });
    });

    const result = actor.play(c => handSeals(c));
    await advance(clock, 6000);

    assert.equal(await result, 'done');
    assert.equal(hit.size, SIGNS.length, `signs reached: ${[...hit].join(', ')}`);
    assert.equal(actor.state.handL.weight, 0, 'left hand freed at the end');
    assert.equal(actor.state.handR.weight, 0, 'right hand freed at the end');
    assert.equal(actor.state.crouch, 0);
    assert.equal(actor.state.squash, 0);
});

test('the hand-seals example can be interrupted mid-way and leaves no trace', async () => {
    const { clock, actor } = setup();
    const seals = actor.play(c => handSeals(c));
    await advance(clock, 900);
    assert.ok(actor.state.handL.weight > 0.9, 'hands are busy mid-sequence');

    const rest = actor.play(async c => {
        await c.all(c.hands({ left: null, right: null }, 150), c.tween({ crouch: 0, squash: 0 }, 150));
    });
    await advance(clock, 4000);

    assert.equal(await seals, 'cancelled');
    assert.equal(await rest, 'done');
    assert.equal(actor.state.handL.weight, 0);
    assert.equal(actor.state.handR.weight, 0);
    assert.equal(actor.state.crouch, 0);
    assert.equal(actor.state.squash, 0);
});

test('with effects: every element plays to the end and cleans up after itself', async () => {
    for (const element of Object.keys(ELEMENTS)) {
        const { clock, actor, fx } = setup();
        const result = actor.play(c => handSeals(c, { fx, element }));
        await advance(clock, 3000);
        assert.ok(fx.layer.children.length > 0, `${element}: effects are drawn mid-sequence`);
        await advance(clock, 5000);
        assert.equal(await result, 'done', element);
        assert.equal(fx.layer.children.length, 0, `${element}: nothing left on the effects layer`);
        assert.equal(fx.idle, true, `${element}: nothing left running`);
        assert.equal(actor.state.tilt, 0);
    }
});

test('with effects: interrupting the sequence puts the aura out', async () => {
    const { clock, actor, fx } = setup();
    const seals = actor.play(c => handSeals(c, { fx }));
    await advance(clock, 1200);
    assert.ok(fx.layer.children.length > 0, 'the aura is burning');

    actor.cancel();
    await advance(clock, 2000);
    assert.equal(await seals, 'cancelled');
    assert.equal(fx.layer.children.length, 0, 'aura and sparks are gone');
    assert.equal(fx.idle, true);
});

test('effects are reproducible: same seed, same drawing', async () => {
    const run = async () => {
        const { clock, actor, fx } = setup();
        actor.play(c => handSeals(c, { fx, element: 'lightning' }));
        await advance(clock, 2600);
        return fx.layer.children.map(n => n.attrs.d).join('|');
    };
    const a = await run(), b = await run();
    assert.ok(a.length > 200, 'something was drawn');
    assert.equal(a, b);
});

test('interrupting stops a tween even if the new sequence never touches that property', async () => {
    const { clock, actor } = setup();
    actor.play(async c => { await c.tween({ x: 500 }, 1000); });
    await advance(clock, 304);
    const frozen = actor.state.x;
    assert.ok(frozen > 0 && frozen < 500);

    actor.play(async c => { await c.wait(100); });
    await advance(clock, 1500);
    assert.equal(actor.state.x, frozen, 'x stopped where it was interrupted');
});

test('a free hand goes straight to its target instead of sweeping in from elsewhere', async () => {
    const { clock, figure, actor } = setup();
    actor.play(async c => { await c.hands({ right: { x: 20, y: -5, angle: 90 } }, 160); });
    await advance(clock, 80);
    assert.equal(actor.state.handR.x, 20, 'the target is set at once; only the weight animates');
    assert.equal(actor.state.handR.y, -5);
    await advance(clock, 200);
    const [cx, cy] = figure.points.centre;
    const { hand } = figure.points.armR;
    assert.ok(dist(hand, [cx + 20 * figure.k, cy - 5 * figure.k]) < 0.01);
    assert.equal(actor.state.handR.angle, 90);
});

test('walking covers the distance with no foot sliding, at any scale', async () => {
    const { walkTo } = await import('../src/actor/moves.js');
    for (const scale of [1, 0.6]) {
        const { clock, figure, actor } = setup();
        figure.state.scale = scale;
        figure.state.y = -figure.standHeight();
        let planted = null, checked = 0, worst = 0;
        clock.onFrame(() => {
            const s = figure.state;
            if (s.walk < 0.999) { planted = null; return; }
            const p = ((s.phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (p < Math.PI - 0.05 && p > 0.05) { // left leg firmly in stance
                const x = figure.points.legL.foot[0];
                if (planted !== null) { worst = Math.max(worst, Math.abs(x - planted)); checked++; }
                planted = x;
            } else planted = null;
        });
        const result = actor.play(c => walkTo(c, 420));
        await advance(clock, 6000);
        assert.equal(await result, 'done');
        assert.equal(Math.round(figure.state.x), 420);
        assert.equal(figure.state.walk, 0);
        assert.ok(checked > 20, `stance frames were observed (${checked})`);
        assert.ok(worst < 0.6, `scale ${scale}: a planted foot moved ${worst.toFixed(2)} px between frames`);
    }
});

test('moves ignore numbers a character does not have', async () => {
    const { land, recover, blink } = await import('../src/actor/moves.js');
    const { clock, actor } = setup();
    assert.equal('wide' in actor.state, false, 'the stickman has no "wide"');
    const result = actor.play(async c => { await blink(c); await land(c, 10); await recover(c); });
    await advance(clock, 2000);
    assert.equal(await result, 'done');
    assert.equal('wide' in actor.state, false, 'and none was invented');
    assert.equal(actor.state.crouch, 0);
    for (const value of Object.values(actor.state)) {
        if (typeof value === 'number') assert.ok(Number.isFinite(value));
    }
});

test('changing anchor does not move the figure on screen', async () => {
    const { clock, figure, actor } = setup();
    await advance(clock, 32);
    const before = [...figure.points.centre];
    actor.reanchor(() => [50, 900]);
    await advance(clock, 32);
    assert.ok(dist(figure.points.centre, before) < 0.01);
});

test('feet can be placed like hands, and are let go when the sequence is replaced', async () => {
    const { clock, figure, actor } = setup();
    actor.play(async c => {
        await c.feet({ right: { x: 14, y: 10, pitch: 60 } }, 100);
        await c.wait(5000);
    });
    await advance(clock, 50);
    assert.equal(actor.state.footR.x, 14, 'a free foot takes its target at once; only the weight animates');
    await advance(clock, 200);
    const { hip, foot } = figure.points.legR;
    assert.ok(dist(foot, [hip[0] + 14 * figure.k, figure.points.ground - 10 * figure.k]) < 0.01, 'the foot is on its target');
    assert.equal(actor.state.footL.weight, 0, 'the other foot was left alone');

    actor.play(async c => { await c.feet({ right: null }, 100); });
    await advance(clock, 300);
    assert.equal(actor.state.footR.weight, 0, 'null puts the foot back on the ground');

    // A foot tween in flight stops with the sequence that started it.
    actor.play(async c => { await c.feet({ left: { x: -10, y: 8 } }, 400); });
    await advance(clock, 100);
    actor.play(async c => { await c.wait(50); });
    const frozen = actor.state.footL.weight;
    assert.ok(frozen > 0 && frozen < 1);
    await advance(clock, 600);
    assert.equal(actor.state.footL.weight, frozen, 'an interrupted foot stops where it was');
});

test('recover puts lifted feet back down', async () => {
    const { recover } = await import('../src/actor/moves.js');
    const { clock, actor } = setup();
    actor.play(async c => { await c.feet({ left: { x: -10, y: 8 }, right: { x: 5, y: 3 } }, 100); });
    await advance(clock, 200);
    actor.play(async c => { await recover(c); });
    await advance(clock, 400);
    assert.equal(actor.state.footL.weight, 0);
    assert.equal(actor.state.footR.weight, 0);
});
