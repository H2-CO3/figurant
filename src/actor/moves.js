// Stock moves: the small building blocks most scenes are made of. Each takes a
// sequence context `c` (from actor.play) and can be awaited like any step.
// They only use numbers a character may or may not have; missing ones are
// ignored, so the same move plays on an eye, a stick figure or a teapot.

import { easeIn, easeOut, easeOutBack, easeOutElastic, ramp, clamp } from '../core/easing.js';
import { cycleLength, sitDrop } from '../body/body.js';

/** Duration of one walk cycle at an easy pace, in ms. */
const CYCLE_MS = 440;
/** Share of a walk spent speeding up, and slowing down. */
const WALK_RAMP = 0.18;

export async function blink(c) {
    await c.tween({ lid: 0 }, 70, easeIn);
    await c.tween({ lid: 1 }, 110, easeOut);
}

/**
 * Walks to x (pixels from the anchor). It leans in, cruises, brakes, then
 * straightens up.
 * @param {number} [pace] 1 = easy pace
 */
export async function walkTo(c, x, pace = 1) {
    const s = c.state, k = c.figure.k;
    if (Math.abs(x - s.x) < 0.5) return;
    s.dir = x > s.x ? 1 : -1;
    c.also({ walk: 1, tilt: s.dir * 5, gazeX: s.dir, gazeY: 0 }, 220, easeOut);
    const cruise = (cycleLength(c.figure.body) / CYCLE_MS) * k * pace;
    await c.tween({ x }, Math.abs(x - s.x) / (cruise * (1 - WALK_RAMP)), ramp(WALK_RAMP));
    c.also({ tilt: 0 }, 420, easeOutBack);
    await c.tween({ walk: 0 }, 180, easeOut);
    s.phase = 0;
}

/** Landing: it sinks onto its legs, then springs back up. */
export async function land(c, depth = 8) {
    c.also({ stretch: 0, gazeY: 0, wide: 0 }, 260, easeOut);
    await c.tween({ crouch: depth, squash: clamp(depth / 16, 0.2, 0.9) }, 80, easeOut);
    c.also({ squash: 0 }, 700, easeOutElastic);
    await c.tween({ crouch: 0 }, 300, easeOutBack);
}

/** A hop on the spot: gather, take off, land. `height` in character units. */
export async function hop(c, height = 20) {
    const s = c.state, y = s.y;
    await c.tween({ crouch: 5, squash: 0.35 }, 80, easeOut);
    c.also({ crouch: 0, squash: -0.3 }, 90, easeOut);
    await c.tween({ y: y - height * c.figure.k }, 150, easeOut);
    await c.tween({ y }, 140, easeIn);
    await land(c, 7);
}

/** A quick glance to (gx, gy), each -1..1, then an optional hold. */
export async function glance(c, gx, gy, hold = 0) {
    await c.tween({ gazeX: gx, gazeY: gy }, 90, easeOut);
    if (hold) await c.wait(hold);
}

/**
 * Sits down on the edge it stands on, legs dangling.
 * @param {number} standY the y at which it stands on that edge
 */
export async function sitOnEdge(c, standY) {
    await c.tween({ crouch: 6, squash: 0.25 }, 160, easeOut);
    c.also({ crouch: 0, squash: 0 }, 500, easeOutElastic);
    await c.tween({ sit: 1, y: standY + sitDrop(c.figure.body) * c.figure.k }, 420);
}

/**
 * Back on its feet and attentive, whatever it was doing.
 * @param {number | null} standY the y at which it stands here, if it has one
 */
export async function recover(c, standY = null, ms = 220) {
    const to = {
        tilt: 0, lid: 1, sit: 0, seat: 0, squint: 0, squash: 0, crouch: 0,
        stretch: 0, wave: 0, walk: 0, pupil: 1, wide: 0, tuck: 0,
    };
    if (standY !== null) to.y = standY;
    await c.all(c.tween(to, ms, easeOutBack), c.hands({ left: null, right: null }, ms), c.feet({ left: null, right: null }, ms));
    c.state.phase = 0;
}
