// The pirate leaves its boat: one long stride through the air, as off a
// stair, onto the planks; the back of a hand across its brow, and the smile
// is back. `data.by`: how far ahead it lands.

import { easing, moves } from 'figurant';
import { effects } from '../../../common/effects.js';

const { easeIn, easeOut, easeInOut } = easing;

export const leapPirate = {
    character: 'pirate',
    room: { left: 30, right: 80, up: 130 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, fx = ctx?.api?.fx ?? null, by = ctx?.data?.by ?? 46, from = s.y;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); c.feet({ left: null, right: null }, 1).catch(() => {}); });
        c.also({ wide: 0.6, grin: 0.3, gazeX: 1, gazeY: 0.2 }, 120);
        await c.all(c.tween({ crouch: 7, tilt: 6 }, 200, easeOut), c.hands({ left: { x: -18, y: 2, angle: 200 }, right: { x: -6, y: 6 } }, 200, easeOut));
        // Off: the front leg reaching, the arms thrown forward.
        c.also({ x: s.x + by * k }, 520, easeInOut);
        c.also({ crouch: 0, stretch: 0.2 }, 180, easeOut);
        c.hands({ left: { x: 16, y: -24, angle: -40 }, right: { x: 22, y: -14, angle: -20 } }, 240, easeOut).catch(() => {});
        c.feet({ right: { x: 16, y: 4, pitch: -10 }, left: { x: -12, y: 8, pitch: 40 } }, 240, easeOut).catch(() => {});
        await c.tween({ y: from - 20 * k }, 260, easeOut);
        await c.tween({ y: from }, 260, easeIn);
        await c.feet({ left: null, right: null }, 1);
        if (fx) effects.landing.play(fx, [c.figure.points.centre[0], c.figure.points.ground - 90 * k], { k });
        c.also({ stretch: 0, tilt: 0 }, 200);
        c.hands({ left: null, right: null }, 260).catch(() => {});
        await moves.land(c, 9);
        // Dry planks.
        await c.all(c.hands({ right: { x: 8, y: -40, angle: -100 } }, 220, easeOut), c.tween({ grin: 1, squint: 0.5, wide: 0, gazeY: 0 }, 220));
        await c.hands({ right: { x: -4, y: -40, angle: -100 } }, 200, easeInOut);
        await c.hands({ right: null }, 220);
    },
};
