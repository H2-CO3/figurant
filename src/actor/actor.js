// An actor: a figure plus the ability to play sequences. A sequence is an
// async function that animates the figure's state step by step. Playing a new
// sequence interrupts the current one cleanly: its tweens stop writing, and
// its next `await` throws, so it can never fight the sequence that replaced it.

import { easeInOut, easeIn } from '../core/easing.js';
import { createProp } from '../props/prop.js';
import { cycleLength } from '../body/body.js';

const CANCELLED = Symbol('cancelled');
/** Time a prop takes to erase itself when its scene ends, in ms. */
const ERASE_MS = 200;

/**
 * @param {object} options
 * @param {object} options.figure  from createFigure()
 * @param {object} options.clock   from createClock()
 * @param {() => [number, number]} options.anchor where the figure is positioned from
 */
export function createActor({ figure, clock, anchor }) {
    const state = figure.state;
    let generation = 0;
    let interrupt = () => {}; // unwinds the sequence being played
    let stopRendering = null;
    // Props this actor is holding: each follows a hand on every frame.
    const held = new Set();

    // Props standing on stage with the actor, positioned from its anchor.
    const scenery = new Set();

    // Only the numbers this character actually has: a scene written for a
    // character with eyelids still plays on one without.
    const own = to => {
        const kept = {};
        for (const key in to) if (key in state) kept[key] = to[key];
        return kept;
    };

    // A prop made for this figure: its size and its line.
    const make = (description, behind) => {
        const scale = state.scale;
        return createProp({
            stage: figure.stage, prop: description, unit: figure.unit, scale,
            width: figure.lineWidth(),
            behind: behind ? figure.layer : undefined,
        });
    };
    // Props erasing themselves after their scene: each entry removes one now.
    const leaving = new Set();
    const erase = (prop, forget) => {
        const finish = () => { if (leaving.delete(finish)) { forget(); clock.release(prop.state); prop.destroy(); } };
        leaving.add(finish);
        clock.release(prop.state);
        clock.tween(prop.state, { draw: 0 }, ERASE_MS, easeIn).then(finish);
    };

    let lastX = state.x;
    const draw = dt => {
        // The walk cycle advances with the distance actually covered, so feet
        // never slide, even while the walk speeds up or slows down.
        const k = figure.k;
        const moved = Math.abs(state.x - lastX);
        lastX = state.x;
        if (state.walk > 0.01 && moved < 30 * k) {
            state.phase += (moved / (cycleLength(figure.body) * k)) * Math.PI * 2;
        }
        const origin = actor.anchor();
        figure.render(origin, dt);
        for (const prop of scenery) prop.render(origin);
        for (const grip of held) {
            const arm = figure.points[grip.side === 'left' ? 'armL' : 'armR'];
            if (!arm) continue;
            grip.prop.state.tilt = typeof grip.tilt === 'function' ? grip.tilt() : grip.tilt;
            grip.prop.place(grip.point, arm.tip, [0, 0]);
            grip.prop.render([0, 0]);
        }
    };

    const release = () => {
        clock.release(state);
        clock.release(state.handL);
        clock.release(state.handR);
        clock.release(state.footL);
        clock.release(state.footR);
    };

    const actor = {
        figure,
        state,
        clock,
        anchor,

        /** Starts drawing the figure on every tick of the clock. */
        show() {
            if (!stopRendering) {
                stopRendering = clock.onFrame(draw);
            }
            return actor;
        },

        /** Draws one frame now. For a director that decides when to draw. */
        draw,

        /**
         * Changes the anchor without the figure moving on screen.
         * @param {() => [number, number]} next
         */
        reanchor(next) {
            const a = actor.anchor(), b = next();
            state.x += a[0] - b[0];
            state.y += a[1] - b[1];
            actor.anchor = next;
            lastX = state.x;
        },

        /** Stops drawing (the figure stays as last drawn). */
        hide() {
            if (stopRendering) stopRendering();
            stopRendering = null;
            return actor;
        },

        /**
         * Puts a prop in a hand: from now on it follows that hand.
         * @param {'left' | 'right'} side
         * @param {object} prop     from createProp()
         * @param {object} [options]
         * @param {string} [options.point] which of the prop's points the hand holds
         * @param {number} [options.tilt]  how the prop is angled in the hand, in degrees
         * @returns {() => void} let go
         */
        hold(side, prop, { point = 'grip', tilt = 0 } = {}) {
            const grip = { side, prop, point, tilt };
            held.add(grip);
            return () => held.delete(grip);
        },

        /**
         * Plays a sequence, interrupting whatever was playing.
         *
         * The sequence receives a context `c`. Every step it awaits through `c`
         * (c.tween, c.wait, c.hands, c.all) throws if the sequence has been
         * interrupted, which unwinds it. Always `await` those steps.
         *
         * @param {(c: object) => Promise<void>} sequence
         * @returns {Promise<'done' | 'cancelled'>}
         */
        play(sequence) {
            const mine = ++generation;
            release();
            interrupt();
            const alive = () => mine === generation;
            const check = () => { if (!alive()) throw CANCELLED; };
            // An interrupted sequence must unwind now, not when the step it
            // is waiting on happens to end: every step races the interruption.
            const interrupted = new Promise((_, reject) => { interrupt = () => reject(CANCELLED); });
            interrupted.catch(() => {});
            const guarded = async promise => {
                const value = await Promise.race([promise, interrupted]);
                check();
                return value;
            };

            // Whatever the sequence brings on stage leaves with it.
            const cleanups = [];
            const tidy = () => { while (cleanups.length) cleanups.pop()(); };

            const c = {
                actor, figure, state, clock,

                /**
                 * Registers something to undo when the sequence ends or is
                 * interrupted (remove a prop, let go of one, stop an effect).
                 */
                onLeave(fn) { cleanups.push(fn); return fn; },

                /**
                 * Brings a prop on stage for the length of the sequence. It is
                 * sized and drawn like the figure, positioned from the actor's
                 * anchor, and erases itself when the sequence ends.
                 * @param {object} description a prop description (see props/library.js)
                 * @param {object} [options]
                 * @param {number} [options.x] offset from the anchor, in character units
                 * @param {number} [options.y]
                 * @param {boolean} [options.behind] draw it behind the figure
                 * @param {object} [options.state] initial prop state (flip, tilt, draw…)
                 */
                prop(description, { x = 0, y = 0, behind = false, state: initial } = {}) {
                    const prop = make(description, behind);
                    Object.assign(prop.state, { x: x * figure.k, y: y * figure.k }, initial);
                    scenery.add(prop);
                    cleanups.push(() => erase(prop, () => scenery.delete(prop)));
                    return prop;
                },

                /**
                 * Brings a prop on stage in the figure's hand.
                 * @param {'left' | 'right'} side
                 */
                give(side, description, { point, tilt, state: initial } = {}) {
                    const prop = make(description, false);
                    Object.assign(prop.state, initial);
                    const letGo = actor.hold(side, prop, { point, tilt });
                    cleanups.push(() => erase(prop, letGo));
                    return prop;
                },

                /** Animates any object's numbers (a prop's state, an effect's level). */
                animate: (target, to, ms, ease = easeInOut) => guarded(clock.tween(target, to, ms, ease)),

                get alive() { return alive(); },

                /** Animates figure state properties. */
                tween: (to, ms, ease = easeInOut) => guarded(clock.tween(state, own(to), ms, ease)),

                /**
                 * Starts animating figure state on the side, without waiting
                 * for it: an accent that overlaps the next step.
                 */
                also(to, ms, ease = easeInOut) { clock.tween(state, own(to), ms, ease); },

                /** Waits `ms` of animation time. */
                wait: ms => guarded(clock.wait(ms)),

                /** Runs several steps at once and waits for all of them. */
                all: (...steps) => guarded(Promise.all(steps)),

                /**
                 * Sends hands to targets, or frees them.
                 * @param {{ left?: object | null, right?: object | null }} targets
                 *        each target is { x, y, angle?, page? } (see createPose);
                 *        null frees that hand; an omitted side is left alone.
                 */
                hands(targets, ms = 200, ease = easeInOut) {
                    const jobs = [];
                    for (const [side, key] of [['left', 'handL'], ['right', 'handR']]) {
                        const target = targets[side];
                        if (target === undefined) continue;
                        const hand = state[key];
                        if (target === null) {
                            jobs.push(clock.tween(hand, { weight: 0 }, ms, ease));
                            continue;
                        }
                        const page = !!target.page;
                        const angle = target.angle ?? 0;
                        if (hand.weight < 0.001 || hand.page !== page) {
                            // A free hand has no meaningful target yet: start from the new one.
                            Object.assign(hand, { x: target.x, y: target.y, angle, page });
                            jobs.push(clock.tween(hand, { weight: 1 }, ms, ease));
                        } else {
                            jobs.push(clock.tween(hand, { x: target.x, y: target.y, angle, weight: 1 }, ms, ease));
                        }
                    }
                    return guarded(Promise.all(jobs));
                },

                /**
                 * Places feet, or puts them back on the ground.
                 * @param {{ left?: object | null, right?: object | null }} targets
                 *        each target is { x, y, pitch? } (see createPose);
                 *        null gives that foot back to the walk; an omitted
                 *        side is left alone.
                 */
                feet(targets, ms = 120, ease = easeInOut) {
                    const jobs = [];
                    for (const [side, key] of [['left', 'footL'], ['right', 'footR']]) {
                        const target = targets[side];
                        if (target === undefined) continue;
                        const foot = state[key];
                        if (target === null) {
                            jobs.push(clock.tween(foot, { weight: 0 }, ms, ease));
                            continue;
                        }
                        const to = { x: target.x, y: target.y ?? 0, pitch: target.pitch ?? 0 };
                        // A free foot has no meaningful target yet: start from the new one.
                        if (foot.weight < 0.001) Object.assign(foot, to);
                        jobs.push(clock.tween(foot, { ...to, weight: 1 }, ms, ease));
                    }
                    return guarded(Promise.all(jobs));
                },
            };

            return Promise.resolve()
                .then(() => sequence(c))
                .then(
                    () => { tidy(); return alive() ? 'done' : 'cancelled'; },
                    error => {
                        tidy();
                        if (error === CANCELLED) return 'cancelled';
                        throw error;
                    },
                );
        },

        /** Interrupts the current sequence and leaves the figure as it is. */
        cancel() {
            generation++;
            release();
            interrupt();
        },

        destroy() {
            actor.cancel();
            for (const finish of [...leaving]) finish();
            actor.hide();
            figure.destroy();
        },
    };

    return actor;
}
