// The pirate takes its bearings, one arm round the mast: the compass out of
// its coat, turned one way and the other; it does not say what it should, so
// it is tapped three times on its glass (the mast let go of for that, and
// caught again); looked at from very near; a hiccup; and there, that way,
// obviously. `data.for`: how long, all told.

import { easing } from 'figurant';
import { pocketCompass } from '../../props/pocket-compass.js';

const { easeIn, easeOut, easeInOut } = easing;

export const bearingPirate = {
    character: 'pirate',
    room: { left: 40, right: 50, up: 110 },

    async play(c, ctx) {
        const end = c.clock.now + (ctx?.data?.for ?? 4700);
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); c.feet({ left: null, right: null }, 1).catch(() => {}); });
        const hold = { x: 2, y: -30 };
        c.also({ wide: 0, squint: 0.3, grin: 0.5 }, 240);
        await c.all(c.hands({ left: hold, right: { x: 5, y: 10 } }, 260, easeInOut), c.feet({ left: { x: 1, y: 7 }, right: { x: 4, y: 2 } }, 260, easeInOut));
        const needle = c.give('right', pocketCompass, { tilt: -10, state: { draw: 0 } });
        await c.all(c.hands({ right: { x: 14, y: -10, angle: -60 } }, 380, easeOut), c.animate(needle.state, { draw: 1 }, 380), c.tween({ gazeX: 0.5, gazeY: 0.7, tilt: 2 }, 380));
        await c.wait(420);
        await c.all(c.tween({ tilt: -6, gazeX: -0.4 }, 380, easeInOut), c.hands({ right: { x: 8, y: -14, angle: -110 } }, 380, easeInOut));
        await c.all(c.tween({ tilt: 6, gazeX: 0.8 }, 400, easeInOut), c.hands({ right: { x: 16, y: -12, angle: -60 } }, 400, easeInOut));
        // Three taps on the glass: for that it lets go of the mast, and nearly of everything.
        for (let tap = 0; tap < 3; tap++) { await c.hands({ left: { x: 11, y: -24 } }, 130, easeOut); await c.hands({ left: { x: 14, y: -16 } }, 90, easeIn); await c.wait(100); }
        c.also({ wide: 1, squint: 0 }, 100);
        await c.tween({ tilt: -11 }, 200, easeOut);
        await c.all(c.hands({ left: hold }, 200, easeOut), c.tween({ tilt: 2, wide: 0, squint: 1 }, 320, easeInOut));
        // From very near.
        await c.all(c.hands({ right: { x: 9, y: -25, angle: -80 } }, 300, easeInOut), c.tween({ gazeX: 0.3, gazeY: -0.2 }, 300));
        await c.wait(520);
        c.also({ wide: 1, squint: 0 }, 80);
        await c.tween({ squash: -0.18, crouch: -2 }, 90, easeOut);
        await c.tween({ squash: 0, crouch: 0, wide: 0, squint: 0.5 }, 220, easeOut);
        // That way.
        await c.all(c.hands({ right: { x: 28, y: -18, angle: -15 } }, 340, easeOut), c.tween({ gazeX: 1, gazeY: -0.1, tilt: 7, grin: 1 }, 340, easeOut));
        await c.wait(Math.max(200, end - c.clock.now - 320));
        await c.all(c.animate(needle.state, { draw: 0 }, 300), c.hands({ right: { x: 3, y: -18 } }, 300, easeInOut), c.tween({ tilt: 0 }, 300));
    },
};
