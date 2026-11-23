// Example sequence: a rapid series of two-handed signs while an aura builds,
// then an elemental release.
//
// A stress test for the arms (both hands must hit precise points, in rhythm,
// with no fingers to hide behind) and for the effects layer.

import { easeOut, easeOutBack, easeIn } from '../src/core/easing.js';
import { aura, burst, dust } from '../src/fx/effects.js';
import { ELEMENTS, COLORS } from './elements.js';

// Signs are written around the point where the hands meet, a little below the
// shoulders, so the elbows have room to fall outwards.
const MEET = 10;
const sign = (lx, ly, la, rx, ry, ra) => ({
    left: { x: lx, y: ly + MEET, angle: la },
    right: { x: rx, y: ry + MEET, angle: ra },
});

// Offsets are in character units.
// Angles: 180 = hand pointing up, 90 = right, -90 = left.
export const SIGNS = [
    sign(-2, -4, 160, 2, -6, 180),       // palms together, fingers up
    sign(-5, 0, 90, 5, -3, -90),         // hands crossed flat
    sign(-1.5, -11, 180, 1.5, -11, 180), // joined high
    sign(-6, -12, 180, 5, 2, -60),       // one up, one low
    sign(-4, -2, 135, 4, -2, -135),      // a V
    sign(-1, 1, 150, 1, 1, -150),        // clasped low
    sign(-8, -6, 120, 8, -6, -120),      // elbows out, wide
    sign(0, -24, 180, 3, -10, 150),      // one hand before the face
    sign(-1.5, -8, 180, 1.5, -4, 180),   // stacked, staggered
    sign(-3, 3, 90, 3, 0, -90),          // palms stacked flat
    sign(-14, -4, -120, -8, -8, -90),    // both hands to the left
    sign(-3, -9, 150, 3, -9, -150),      // a peak
    sign(8, -8, 90, 14, -4, 120),        // both hands to the right
    sign(-3, -2, 90, 1, -5, -100),       // fist on palm
    sign(-10, -20, 150, 10, -20, -150),  // both raised, apart
    sign(-6, 4, 60, 6, 4, -60),          // low, wrists bent
    sign(-1, -14, 180, 1, -14, 180),     // joined before the face
    sign(-2, -3, 180, 2, -3, 180),       // the last one: palms together
];

// How long each sign is held, in ms. Uneven on purpose: runs of quick signs
// broken by a beat read as intent; an even tempo reads as a machine.
// Durations are whole numbers of 16 ms frames: a step can only end on a frame,
// so 50 ms would silently take 64.
const HOLDS = [0, 16, 80, 0, 16, 0, 96, 16, 0, 64, 0, 16, 0, 112, 0, 16, 48, 0];

/**
 * @param {object} c sequence context, from actor.play()
 * @param {object} [options]
 * @param {object} [options.fx]      from createFx(); without it, no effects
 * @param {string} [options.element] one of ELEMENTS; defaults to fire
 * @param {number} [options.pace]    1 = full speed, 2 = half speed…
 */
export async function handSeals(c, { fx, element = 'fire', pace = 1 } = {}) {
    const { figure, state } = c;
    const k = figure.k;
    const color = COLORS[element];
    const glow = fx ? aura(fx, figure, { color }) : { level: 0, stop() {} };
    const feet = () => [figure.points.centre[0], figure.points.ground];
    const between = () => {
        const { armL, armR } = figure.points;
        return [(armL.tip[0] + armR.tip[0]) / 2, (armL.tip[1] + armR.tip[1]) / 2];
    };

    try {
        // Drop into a stance; the aura catches.
        if (fx) dust(fx, feet(), { k });
        await c.all(
            c.tween({ crouch: 6, gazeY: 0.5 }, 160 * pace, easeOut),
            c.hands(SIGNS[0], 160 * pace, easeOut),
        );
        const building = c.clock.tween(glow, { level: 0.6 }, 1500 * pace);

        // The signs: each one snaps into place with a small accent of the body.
        for (let i = 0; i < SIGNS.length; i++) {
            const lean = (i % 2 ? 1 : -1) * 2.5;
            await c.all(
                c.hands(SIGNS[i], 48 * pace, easeOut),
                c.tween({ squash: 0.22, tilt: lean }, 48 * pace, easeOut),
            );
            if (fx) burst(fx, between(), { k, count: 4, speed: 90, life: 0.16, color });
            await c.tween({ squash: 0 }, 32 * pace);
            if (HOLDS[i]) await c.wait(HOLDS[i] * pace);
        }
        await building;

        // Gather: sink, swell, the aura flares.
        await c.all(
            c.tween({ crouch: 13, squash: 0.55, tilt: -4, gazeX: 1, gazeY: 0 }, 260 * pace, easeIn),
            c.all(c.clock.tween(glow, { level: 1 }, 260 * pace)),
        );
        if (fx) dust(fx, feet(), { k, count: 16 });

        // Release: both palms thrust forward, the body stretches, the element goes.
        await c.all(
            c.hands({ left: { x: 34, y: -12, angle: 100 }, right: { x: 38, y: -5, angle: 80 } }, 90 * pace, easeOutBack),
            c.tween({ squash: -0.6, crouch: 9, tilt: 5, x: state.x - 5 * k }, 90 * pace, easeOut),
        );
        if (fx) {
            burst(fx, between(), { k, count: 14, speed: 260, color, arc: [-0.9, 0.9] });
            ELEMENTS[element](fx, between(), { k, dir: 1, ground: figure.points.ground });
        }
        await c.all(
            c.tween({ squash: -0.15, tilt: 3 }, 500 * pace),
            c.all(c.clock.tween(glow, { level: 0.35 }, 500 * pace)),
        );
        await c.wait(280 * pace);

        // Back to rest.
        await c.all(
            c.hands({ left: null, right: null }, 360 * pace),
            c.tween({ squash: 0, crouch: 0, tilt: 0, gazeX: 0, x: state.x + 5 * k }, 360 * pace),
            c.all(c.clock.tween(glow, { level: 0 }, 300 * pace)),
        );
    } finally {
        // Reached whether the sequence ended or was interrupted.
        c.clock.release(glow);
        glow.stop();
    }
}
