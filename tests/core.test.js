import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as easing from '../src/core/easing.js';
import { createFollower } from '../src/core/spring.js';

test('every easing curve starts at 0 and ends at 1', () => {
    const curves = {
        linear: easing.linear,
        easeIn: easing.easeIn,
        easeOut: easing.easeOut,
        easeInOut: easing.easeInOut,
        easeOutBack: easing.easeOutBack,
        easeInBack: easing.easeInBack,
        easeInOutBack: easing.easeInOutBack,
        easeOutElastic: easing.easeOutElastic,
        ramp: easing.ramp(),
    };
    for (const [name, curve] of Object.entries(curves)) {
        assert.ok(Math.abs(curve(0)) < 1e-9, `${name}(0) should be 0, got ${curve(0)}`);
        assert.ok(Math.abs(curve(1) - 1) < 1e-9, `${name}(1) should be 1, got ${curve(1)}`);
    }
});

test('ramp never moves backwards and cruises at a constant speed', () => {
    const curve = easing.ramp(0.2);
    let previous = 0;
    for (let i = 1; i <= 100; i++) {
        const value = curve(i / 100);
        assert.ok(value >= previous, `ramp went backwards at ${i}%`);
        previous = value;
    }
    const speedA = curve(0.41) - curve(0.4);
    const speedB = curve(0.61) - curve(0.6);
    assert.ok(Math.abs(speedA - speedB) < 1e-9);
});

test('the follower lags behind a moving target, then settles on it', () => {
    const follower = createFollower();
    follower.step(0, 0, 16);

    // The target moves right at a steady pace: the follower trails behind.
    let x = 0, offset = [0, 0];
    for (let i = 0; i < 20; i++) {
        x += 5;
        offset = follower.step(x, 0, 16);
    }
    assert.ok(offset[0] < -1, `should trail behind, offset ${offset[0]}`);

    // The target stops: the offset dies out.
    for (let i = 0; i < 300; i++) offset = follower.step(x, 0, 16);
    assert.ok(Math.abs(offset[0]) < 0.01, `should settle, offset ${offset[0]}`);
});

test('the follower snaps to a target that jumped, with no momentum', () => {
    const follower = createFollower({ teleport: 100 });
    follower.step(0, 0, 16);
    for (let i = 0; i < 10; i++) follower.step(i * 8, 0, 16);

    assert.deepEqual(follower.step(5000, 0, 16), [0, 0]);
    const after = follower.step(5000, 0, 16);
    assert.ok(Math.abs(after[0]) < 1e-9, 'no leftover velocity after the jump');
});
