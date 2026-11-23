// The stick figure navigates. It takes a pocket compass out, raises it and
// reads it, looks far ahead with a hand over its eyes, points the way, and
// puts the compass away. Measured, like the rest of line and gold: every
// duration is a multiple of one beat. It does not walk: it may be aboard.

import { easing, moves } from 'figurant';
import { pocketCompass } from '../../props/pocket-compass.js';

const { easeInOut } = easing;
const BEAT = 420;

export const navigateStickman = {
    character: 'stickman',
    room: { left: 50, right: 70, up: 140 },

    async play(c) {
        // The compass comes out, in the hand towards the bow.
        const held = c.give('right', pocketCompass, { state: { draw: 0 } });
        await c.animate(held.state, { draw: 1 }, BEAT * 2, easeInOut);
        // Raised to the eyes, and read.
        c.also({ gazeX: 0.6, gazeY: 0.5 }, BEAT * 2, easeInOut);
        await c.hands({ right: { x: 28, y: 2, angle: 20 } }, BEAT * 2, easeInOut);
        await c.wait(BEAT * 4);
        await moves.blink(c);
        // Far ahead, a hand over the eyes.
        c.also({ gazeX: 1, gazeY: -0.1, tilt: 3 }, BEAT * 2, easeInOut);
        await c.hands({ left: { x: 20, y: -42, angle: 100 } }, BEAT * 2, easeInOut);
        await c.wait(BEAT * 4);
        // That way.
        await c.hands({ left: { x: 56, y: -10, angle: 95 } }, BEAT * 2, easeInOut);
        await c.wait(BEAT * 4);
        // Back to rest; the compass goes away.
        c.also({ gazeX: 0, gazeY: 0, tilt: 0 }, BEAT * 2, easeInOut);
        await c.all(c.hands({ left: null, right: null }, BEAT * 2, easeInOut), c.animate(held.state, { draw: 0 }, BEAT * 2, easeInOut));
        await c.wait(BEAT * 2);
    },
};
