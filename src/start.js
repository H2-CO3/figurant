// The one call an integration needs: a clock driven by the browser, a stage,
// effects, a director, and the mistakes ready to print. Under reduced motion
// it adds nothing at all to the page.

import { createClock, driveWithAnimationFrame } from './core/clock.js';
import { createStage } from './stage/stage.js';
import { createFx } from './fx/fx.js';
import { createDirector } from './director/director.js';
import { describeProblems } from './director/spots.js';

/**
 * @param {object} options
 * @param {object} options.cast     { name: { character, unit?, scale?, ... } }
 * @param {object} [options.scenes] { name: scene }
 * @param {number | (() => number)} [options.clearance] pixels kept free at the
 *        top (a fixed header); a function is read again as the layout changes
 * @param {boolean} [options.effects] give scenes an effects layer (default true)
 * @param {object} [options.clock]  a clock of your own (tests step it by hand)
 * @returns {{ director, reduced: boolean, problems: string[], stop: () => void }}
 */
export function start({ cast, scenes = {}, clearance = 0, effects = true, clock, seed, win = globalThis.window, doc = globalThis.document, root }) {
    const reduced = !!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const stage = reduced ? null : createStage({ doc, win });
    let stopClock = () => {};
    if (!clock) {
        clock = createClock();
        if (!reduced) stopClock = driveWithAnimationFrame(clock, win) ?? stopClock;
    }
    const director = createDirector({
        stage, clock, cast, scenes, clearance, seed, win, doc, root,
        fx: stage && effects ? createFx({ stage, clock }) : null,
    });
    if (!reduced) director.start();
    return {
        director, reduced,
        /** One line per mistake in the markers, the scenes and the characters, each with its fix. */
        problems: describeProblems(director.problems),
        stop() { director.stop(); if (typeof stopClock === 'function') stopClock(); stage?.destroy(); },
    };
}
