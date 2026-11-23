// The toaster makes toast, and it is as surprised as anyone when it pops. It
// pushes its own lever down, waits (humming, glowing, shaking more and more),
// the slice shoots out over its head, it catches it on the way down and
// offers it to whoever is looking.
//
// Written as classic cartoon animation: every action has its anticipation (a
// reach up before the push, a gather before the pop, a lean away before the
// catch, a pull back before the offer), the body squashes and stretches, and
// every arrival overshoots and settles. Its own parts play: `heat` (lever,
// glow, dial), `toast` (the slices in its slots), and its cord, which trails.

import { easing, moves } from 'figurant';
import { butteredToast } from '../../props/buttered-toast.js';

const { easeIn, easeOut, easeInOut, easeOutBack, easeOutElastic, linear } = easing;

/** The toaster's middle above the floor when standing: its hips (40) on legs of 34. */
const STANDING = 74;
/** Where the front slice stands when popped, from the toaster's middle (see characters/toaster.js). */
const SLOT = [-7, -26];
/** Where the right hand waits for the slice, and how high the slice flies above the floor. */
const CATCH = [66, -22], PEAK = 196;
/** Its lever, up and down, for the hand that pushes it. */
const LEVER = [59, -20];

export const popToaster = {
    character: 'toaster',
    room: { left: 95, right: 100, up: 215 },

    async play(c) {
        const s = c.state, k = c.figure.k, x0 = s.x / k, y0 = s.y;
        c.onLeave(() => { s.toast = 0; s.heat = 0; });

        // A look at the lever. The hand goes up above it (anticipation), then pushes it down.
        await moves.glance(c, 0.9, -0.5, 260);
        c.also({ squash: -0.22, tilt: -5 }, 240, easeOut);
        await c.hands({ right: { x: LEVER[0], y: LEVER[1] - 16, angle: 150 } }, 260, easeOut);
        await c.wait(110);
        c.also({ heat: 1, crouch: 8, squash: 0.42, tilt: 4 }, 150, easeIn);
        await c.hands({ right: { x: LEVER[0], y: LEVER[1] + 17, angle: 170 } }, 150, easeIn);
        c.also({ squash: 0 }, 520, easeOutElastic);
        await c.tween({ crouch: 0, tilt: 0 }, 300, easeOutBack);
        await c.hands({ right: null }, 240);

        // It waits: rocks from one foot to the other, eyes on its slots, pleased with the smell.
        c.also({ gazeX: 0, gazeY: -0.9, squint: 0.35 }, 300);
        for (let i = 0; i < 6; i++) {
            const side = i % 2 ? 1 : -1;
            c.also({ crouch: 3 }, 150, easeIn);
            await c.tween({ tilt: side * 6 }, 300, easeInOut);
            c.also({ crouch: 0 }, 150, easeOut);
        }
        // It is nearly ready: it gathers, lower and lower, and shakes harder and harder.
        c.also({ squint: 0, gazeY: -1, crouch: 10, squash: 0.5 }, 620, easeIn);
        for (let i = 0; i < 10; i++) await c.tween({ tilt: (i % 2 ? 1 : -1) * (1 + i * 0.45) }, 62, linear);

        // Pop! It stretches off the floor, the slice leaves the slot and flies.
        c.also({ toast: 1, heat: 0, squash: -0.55, crouch: 0, tilt: 0, pupil: 0.65 }, 80, easeOut);
        await c.tween({ y: y0 - 12 * k }, 110, easeOut);
        s.toast = -1;
        const slice = c.prop(butteredToast, { x: x0 + SLOT[0], y: SLOT[1] - STANDING + 12, state: { draw: 1 } });
        const flight = c.all(
            c.animate(slice.state, { x: (x0 + CATCH[0]) * k, tilt: 720 }, 900, linear),
            (async () => {
                await c.animate(slice.state, { y: -PEAK * k }, 470, easeOut);
                await c.animate(slice.state, { y: (CATCH[1] - STANDING) * k }, 430, easeIn);
            })(),
        );
        // The take: eyes wide, it comes down, squashes, and follows the slice up with its eyes.
        c.also({ wide: 1, gazeY: -1, gazeX: 0.2 }, 90, easeOut);
        await c.tween({ y: y0 }, 130, easeIn);
        await c.tween({ crouch: 9, squash: 0.6 }, 80, easeOut);
        c.also({ squash: 0 }, 500, easeOutElastic);
        await c.tween({ crouch: 0 }, 220, easeOutBack);
        // It leans away from where the slice will fall (anticipation), then throws its hand under it.
        c.also({ gazeX: 0.9, wide: 0.5, pupil: 1 }, 200);
        await c.tween({ tilt: -9, crouch: 4 }, 190, easeOut);
        c.also({ tilt: 7, crouch: 0 }, 220, easeOutBack);
        await c.hands({ right: { x: CATCH[0], y: CATCH[1], angle: 180 } }, 200, easeOut);
        await flight;

        // Caught: the hand gives under the weight and comes back up, the body with it.
        slice.state.draw = 0;
        c.give('right', butteredToast);
        c.also({ crouch: 6, squash: 0.35, wide: 0, gazeY: -0.3 }, 90, easeOut);
        await c.hands({ right: { x: CATCH[0] - 2, y: CATCH[1] + 14, angle: 180 } }, 90, easeOut);
        c.also({ crouch: 0, squash: 0, tilt: 3 }, 380, easeOutBack);
        await c.hands({ right: { x: CATCH[0], y: CATCH[1] - 3, angle: 180 } }, 380, easeOutBack);

        // It admires it, close to its eyes.
        c.also({ tilt: 6, gazeX: 1, gazeY: -0.5, squint: 0.3 }, 300, easeInOut);
        await c.hands({ right: { x: 60, y: -16, angle: 180 } }, 300, easeInOut);
        await moves.blink(c);
        await c.wait(700);

        // The offer: it pulls the slice back against itself (anticipation), then holds it out, on tiptoe.
        c.also({ tilt: -8, crouch: 6, squash: 0.3, squint: 0, gazeX: 0, gazeY: 0 }, 260, easeInOut);
        await c.hands({ right: { x: 56, y: 0, angle: 170 } }, 260, easeInOut);
        c.also({ tilt: 9, crouch: 0, squash: -0.2 }, 320, easeOutBack);
        await c.hands({ right: { x: 76, y: -14, angle: 150 } }, 320, easeOutBack);
        c.also({ squash: 0 }, 300, easeOut);
        // Two small bounces of pride.
        for (let i = 0; i < 2; i++) {
            await c.tween({ crouch: 5, squash: 0.25 }, 130, easeOut);
            c.also({ squash: 0 }, 300, easeOutBack);
            await c.tween({ crouch: 0 }, 240, easeOutBack);
        }
        await moves.blink(c);
        await c.wait(1300);

        // It stands back up; the scene takes the slice away with it.
        c.also({ tilt: 0 }, 420, easeOutBack);
        await c.hands({ right: { x: 60, y: -6, angle: 170 } }, 300, easeInOut);
        await c.wait(240);
    },
};
