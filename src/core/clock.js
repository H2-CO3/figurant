// The clock: the single source of time for an engine.
//
// Everything that moves subscribes to a clock, and a clock only moves when
// something calls tick(). In a browser, driveWithAnimationFrame() ticks it once
// per frame. In tests, advance() ticks it by hand, so a ten-second scene runs
// in a few milliseconds and never depends on how fast the machine is.

import { easeInOut } from './easing.js';

/**
 * @param {object} [options]
 * @param {number} [options.maxStep] longest step, in ms, a single tick may
 *        take. Guards against the jump that follows a background tab.
 */
export function createClock({ maxStep = 50 } = {}) {
    const tasks = new Set();
    // For each animated object: which tween "owns" each property. A new tween
    // on a property takes over from the previous one.
    const owners = new WeakMap();
    let seq = 0;
    let wake = null;
    // A step can only end on a tick, usually a little after its duration. That
    // leftover is credited to whatever step starts next, so a chain of short
    // steps lasts the sum of their durations instead of drifting later.
    let credit = 0;
    const finish = overshoot => { credit = credit === null ? overshoot : Math.min(credit, overshoot); };

    const clock = {
        /** Milliseconds of animation time elapsed since the clock was created. */
        now: 0,

        /** True when nothing is subscribed: the driver may stop ticking. */
        get idle() { return tasks.size === 0; },

        /**
         * Calls fn(dt in ms) on every tick.
         * @returns {() => void} unsubscribe
         */
        onFrame(fn) {
            const wasIdle = tasks.size === 0;
            tasks.add(fn);
            if (wasIdle && wake) wake();
            return () => tasks.delete(fn);
        },

        /** Advances time by dt ms (capped at maxStep) and runs every subscriber. */
        tick(dt) {
            const step = Math.min(Math.max(dt, 0), maxStep);
            clock.now += step;
            credit = null; // only steps that end on this tick may leave a credit
            // Copy: a subscriber may subscribe or unsubscribe while we iterate.
            for (const fn of [...tasks]) {
                if (tasks.has(fn)) fn(step);
            }
        },

        /** Resolves after `ms` milliseconds of animation time. */
        wait(ms) {
            return new Promise(resolve => {
                let t = credit || 0;
                const off = clock.onFrame(dt => {
                    t += dt;
                    if (t >= ms) { off(); finish(t - ms); resolve(); }
                });
            });
        },

        /**
         * Animates the numeric properties of `target` towards the values in `to`.
         * A later tween on the same property takes it over; the earlier tween
         * keeps animating whatever properties it still owns.
         * @returns {Promise<void>} resolved when the duration has elapsed, or
         *          as soon as the tween no longer owns any property.
         */
        tween(target, to, ms, ease = easeInOut) {
            const id = ++seq;
            let owned = owners.get(target);
            if (!owned) owners.set(target, (owned = new Map()));

            const from = {};
            for (const key in to) {
                from[key] = target[key];
                owned.set(key, id);
            }

            return new Promise(resolve => {
                let t = credit || 0;
                const off = clock.onFrame(dt => {
                    t += dt;
                    const p = ms <= 0 ? 1 : Math.min(t / ms, 1);
                    const e = ease(p);
                    let alive = false;
                    for (const key in to) {
                        if (owned.get(key) !== id) continue;
                        alive = true;
                        target[key] = from[key] + (to[key] - from[key]) * e;
                    }
                    if (p >= 1 || !alive) {
                        // Give the properties back, so a finished tween leaves no trace.
                        for (const key in to) {
                            if (owned.get(key) === id) owned.delete(key);
                        }
                        off();
                        if (p >= 1) finish(Math.max(0, t - ms));
                        resolve();
                    }
                });
            });
        },

        /**
         * Stops every tween running on `target`. Values stay where they are,
         * and the stopped tweens resolve on the next tick.
         */
        release(target) {
            const owned = owners.get(target);
            if (owned) owned.clear();
        },

        /** @internal Lets a driver know when the clock goes from idle to busy. */
        _setWake(fn) { wake = fn; },
    };

    return clock;
}

/**
 * Ticks a clock once per animation frame, and stops asking for frames while
 * the clock is idle. Browser only.
 * @returns {() => void} stop
 */
export function driveWithAnimationFrame(clock, host = globalThis) {
    let running = false;
    let stopped = false;
    let last = 0;

    const loop = now => {
        if (stopped) return;
        clock.tick(now - last);
        last = now;
        if (clock.idle) running = false;
        else host.requestAnimationFrame(loop);
    };

    const start = () => {
        if (running || stopped) return;
        running = true;
        last = host.performance.now();
        host.requestAnimationFrame(loop);
    };

    clock._setWake(start);
    if (!clock.idle) start();

    return () => {
        stopped = true;
        clock._setWake(null);
    };
}

// A macrotask boundary: lets every pending promise continuation run, however
// deep the chain of awaits, before the next tick.
const settle = () => new Promise(resolve => {
    if (typeof setImmediate === 'function') setImmediate(resolve);
    else {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => { channel.port1.close(); resolve(); };
        channel.port2.postMessage(0);
    }
});

/**
 * Advances a clock by `ms` of animation time in steps of `step` ms, letting
 * asynchronous sequences continue between steps. For tests and tools.
 */
export async function advance(clock, ms, step = 16) {
    await settle();
    let left = ms;
    while (left > 1e-9) {
        const dt = Math.min(step, left);
        clock.tick(dt);
        left -= dt;
        await settle();
    }
}
