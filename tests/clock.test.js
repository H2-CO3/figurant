import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClock, advance, driveWithAnimationFrame } from '../src/core/clock.js';
import { linear } from '../src/core/easing.js';

test('wait resolves after the simulated time, not before', async () => {
    const clock = createClock();
    let done = false;
    clock.wait(100).then(() => { done = true; });

    await advance(clock, 96);
    assert.equal(done, false);
    await advance(clock, 16);
    assert.equal(done, true);
});

test('a finished wait or tween leaves the clock idle', async () => {
    const clock = createClock();
    const o = { x: 0 };
    clock.wait(30);
    clock.tween(o, { x: 1 }, 30);
    assert.equal(clock.idle, false);
    await advance(clock, 64);
    assert.equal(clock.idle, true);
});

test('tween moves a property from its current value to the target', async () => {
    const clock = createClock();
    const o = { x: 10 };
    clock.tween(o, { x: 30 }, 100, linear);

    await advance(clock, 50, 10);
    assert.ok(Math.abs(o.x - 20) < 1e-9, `halfway, x should be 20, got ${o.x}`);
    await advance(clock, 60, 10);
    assert.equal(o.x, 30);
});

test('a later tween takes over a property; untouched properties keep going', async () => {
    const clock = createClock();
    const o = { x: 0, y: 0 };
    // The first tween outlives the second: if it still wrote x, we would see it.
    clock.tween(o, { x: 200, y: 200 }, 200, linear);
    await advance(clock, 50, 10);

    clock.tween(o, { x: 0 }, 50, linear);
    await advance(clock, 60, 10);

    assert.equal(o.x, 0, 'x follows the second tween and stays there');
    assert.ok(Math.abs(o.y - 110) < 1e-9, `y is still driven by the first tween, got ${o.y}`);
});

test('release stops in-flight tweens where they are and resolves them', async () => {
    const clock = createClock();
    const o = { x: 0 };
    let resolved = false;
    clock.tween(o, { x: 100 }, 100, linear).then(() => { resolved = true; });

    await advance(clock, 40, 10);
    const frozen = o.x;
    clock.release(o);
    await advance(clock, 200, 10);

    assert.equal(o.x, frozen, 'the value no longer moves');
    assert.equal(resolved, true, 'the promise does not hang');
    assert.equal(clock.idle, true, 'nothing stays subscribed');
});

test('an interrupted sequence cannot write after a new one has started', async () => {
    // The bug this protects against: a walk was interrupted mid-way, a new
    // sequence started, and the old walk kept pushing the character off screen.
    const clock = createClock();
    const o = { x: 0 };
    let generation = 0;

    const play = async sequence => {
        const mine = ++generation;
        clock.release(o);
        await sequence(() => { if (mine !== generation) throw new Error('cancelled'); });
    };

    const walkFar = async check => {
        await clock.tween(o, { x: 1000 }, 1000, linear); check();
        await clock.tween(o, { x: 2000 }, 1000, linear); check();
    };
    const stepBack = async check => {
        await clock.tween(o, { x: -50 }, 100, linear); check();
    };

    play(walkFar).catch(() => {});
    await advance(clock, 300);
    play(stepBack).catch(() => {});
    await advance(clock, 3000);

    assert.equal(o.x, -50);
});

test('a single tick never advances more than maxStep', () => {
    const clock = createClock({ maxStep: 50 });
    let seen = 0;
    clock.onFrame(dt => { seen = dt; });
    clock.tick(5000);
    assert.equal(seen, 50);
    assert.equal(clock.now, 50);
});

test('a subscriber may unsubscribe another during a tick', () => {
    const clock = createClock();
    const calls = [];
    let offB;
    clock.onFrame(() => { calls.push('a'); offB(); });
    offB = clock.onFrame(() => { calls.push('b'); });
    clock.tick(16);
    assert.deepEqual(calls, ['a']);
});

test('the frame driver only asks for frames while something is animating', () => {
    const queue = [];
    const host = {
        time: 0,
        performance: { now: () => host.time },
        requestAnimationFrame: fn => queue.push(fn),
    };
    const frame = ms => { host.time += ms; queue.shift()(host.time); };

    const clock = createClock();
    driveWithAnimationFrame(clock, host);
    assert.equal(queue.length, 0, 'idle clock: no frame requested');

    const o = { x: 0 };
    clock.tween(o, { x: 1 }, 32, linear);
    assert.equal(queue.length, 1, 'first subscriber wakes the driver');

    frame(16);
    assert.equal(o.x, 0.5);
    frame(16);
    assert.equal(o.x, 1);
    assert.equal(queue.length, 0, 'back to idle: the driver stops');
});

test('a chain of short steps lasts the sum of its durations, not longer', async () => {
    // Each step can only end on a 16 ms tick. Without carrying the leftover
    // over, ten 50 ms steps would take 640 ms instead of 500.
    const clock = createClock();
    const o = { x: 0 };
    let endedAt = null;
    (async () => {
        for (let i = 0; i < 5; i++) {
            await clock.wait(50);
            await clock.tween(o, { x: i + 1 }, 50, linear);
        }
        endedAt = clock.now;
    })();
    await advance(clock, 800);
    assert.ok(endedAt !== null, 'the chain finished');
    assert.ok(endedAt >= 500 && endedAt <= 516, `expected about 500 ms, took ${endedAt}`);
    assert.equal(o.x, 5);
});

test('a step that starts on its own gets no credit from an old one', async () => {
    const clock = createClock();
    clock.wait(20);
    await advance(clock, 32);   // ended 12 ms late, nobody chained on it
    await advance(clock, 160);  // time passes

    let done = false;
    clock.wait(48).then(() => { done = true; });
    await advance(clock, 32);
    assert.equal(done, false, 'no stale credit shortened it');
    await advance(clock, 16);
    assert.equal(done, true);
});
