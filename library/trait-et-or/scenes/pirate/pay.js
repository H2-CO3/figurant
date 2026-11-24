// The pirate pays its way: a finger up, one pocket patted, then the other;
// there it is. The coin is flipped, turns over in the air and lands
// `data.to` units ahead (in an open palm, if there is one). Then the hat is
// lifted, the other arm wide, with a bow. The coin lands 1960 ms after the
// start.

import { easing } from 'figurant';
import { goldCoin } from '../../props/harbour.js';

const { easeIn, easeOut, easeInOut } = easing;

export const payPirate = {
    character: 'pirate',
    room: { left: 40, right: 60, up: 120 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, to = ctx?.data?.to ?? 26;
        // (How high it stands above the floor: its coin starts from its hand.)
        const up = (s.y + c.figure.standHeight()) / k, here = s.x / k;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        c.also({ grin: 1, squint: 0.5, gazeX: 1 }, 200);
        await c.all(c.hands({ left: { x: -10, y: 10 }, right: { x: 8, y: -32, angle: -90 } }, 240, easeOut), c.tween({ gazeY: -0.3 }, 240));
        await c.wait(200);
        await c.hands({ left: { x: -7, y: 13 }, right: { x: 7, y: 13 } }, 240, easeInOut);
        await c.all(c.tween({ gazeY: 0.6, tilt: -4 }, 180), c.hands({ left: { x: -5, y: 9 } }, 180));
        await c.all(c.hands({ left: { x: -10, y: 10 }, right: { x: 6, y: 12 } }, 300, easeInOut), c.tween({ tilt: 0, gazeY: 0 }, 300));
        await c.hands({ right: { x: 15, y: -8, angle: -30 } }, 280, easeOut);
        const piece = c.prop(goldCoin, { x: here + 15, y: up - 83, state: { draw: 1 } });
        c.also({ gazeY: -0.6 }, 200);
        await c.all(c.animate(piece.state, { x: (here + (15 + to) / 2) * k, y: (up - 113) * k, tilt: 540 }, 260, easeOut), c.hands({ right: { x: 17, y: -16, angle: -60 } }, 200, easeOut));
        await c.animate(piece.state, { x: (here + to) * k, y: (up - 77) * k, tilt: 1080 }, 260, easeIn);
        await c.wait(420);
        c.animate(piece.state, { draw: 0 }, 260).catch(() => {});
        // The hat lifted, a bow.
        await c.all(c.hands({ right: { x: 9, y: -49 }, left: { x: -22, y: -2, angle: 200 } }, 300, easeInOut), c.tween({ gazeY: 0, tilt: 11, crouch: 3 }, 300, easeInOut));
        await c.wait(380);
        await c.all(c.hands({ left: null, right: null }, 300), c.tween({ tilt: 0, crouch: 0, gazeX: 0.9 }, 300, easeInOut));
    },
};
