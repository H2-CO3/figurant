// The pirate on the mast of a boat that has found its wind again, and is
// still going down: an arm pointing the way, pulls up the mast as the water
// comes; at the very end it stands on the masthead, arms out, the water at
// its heels. `data.by`, `data.over`: how far the boat carries it meanwhile,
// and in how long (the same as the boat's own `sail-boat`).

import { easing } from 'figurant';
import { grip, pull } from './cling.js';

const { linear, easeOut, easeInOut } = easing;

export const holdOnPirate = {
    character: 'pirate',
    room: { left: 40, right: 50, up: 110 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, { by = 0, over = 5300 } = ctx?.data ?? {};
        const end = c.clock.now + over;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); c.feet({ left: null, right: null }, 1).catch(() => {}); });
        c.also({ x: s.x + by * k }, over, linear);
        c.also({ grin: 1, squint: 0.5, wide: 0, gazeX: 1, gazeY: 0 }, 240);
        await grip(c, 220);
        // That way! And faster.
        await c.all(c.hands({ right: { x: 28, y: -18, angle: -15 } }, 300, easeOut), c.tween({ tilt: 7 }, 300, easeOut));
        await c.wait(700);
        await c.all(c.hands({ right: { x: 3, y: -18 } }, 260, easeInOut), c.tween({ tilt: 0 }, 260));
        for (let turn = 0; c.clock.now < end - 1900; turn++) {
            await pull(c, turn);
            await c.tween({ gazeX: turn % 2 ? 1 : 0.2, gazeY: turn % 2 ? 0 : 0.9, wide: turn % 2 ? 0 : 0.7, grin: turn % 2 ? 0.8 : 0.2 }, 220);
        }
        // Nothing left to climb: on the masthead, upright, arms out, on its toes.
        await c.all(c.feet({ left: { x: -2, y: 0 }, right: { x: 2, y: 0 } }, 300, easeInOut), c.hands({ left: { x: -24, y: -8, angle: 200 }, right: { x: 24, y: -8, angle: -20 } }, 300, easeInOut), c.tween({ gazeX: 0.2, gazeY: 0.9, wide: 0.8, grin: 0.1, squint: 0 }, 300));
        for (let wobble = 0; c.clock.now < end - 500; wobble++) await c.tween({ tilt: wobble % 2 ? -5 : 6, gazeX: wobble % 2 ? 0.2 : 1, gazeY: wobble % 2 ? 0.9 : 0 }, 260, easeInOut);
        await c.all(c.tween({ tilt: 4, gazeX: 1, gazeY: 0, crouch: 4 }, Math.max(1, end - c.clock.now), easeInOut));
    },
};
