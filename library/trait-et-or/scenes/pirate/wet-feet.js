// Water round its feet: the pirate looks down, lifts one foot and shakes it,
// then the other, and looks up at the mast.

import { easing } from 'figurant';
import { effects } from '../../../common/effects.js';

const { easeIn, easeOut, easeInOut } = easing;

export const wetFeetPirate = {
    character: 'pirate',
    room: { left: 40, right: 40, up: 110 },

    async play(c, ctx) {
        const k = c.figure.k, fx = ctx?.api?.fx ?? null;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); c.feet({ left: null, right: null }, 1).catch(() => {}); });
        c.also({ wide: 1, squint: 0, grin: 0.1 }, 120);
        await c.all(c.tween({ gazeX: 0.1, gazeY: 1 }, 260, easeOut), c.hands({ left: { x: -16, y: -6 }, right: { x: 16, y: -6 } }, 260, easeOut));
        await c.wait(300);
        for (const side of ['left', 'right']) {
            const way = side === 'left' ? -1 : 1;
            await c.feet({ [side]: { x: way * 6, y: 12, pitch: 20 } }, 220, easeOut);
            await c.feet({ [side]: { x: way * 8, y: 10, pitch: -10 } }, 110); await c.feet({ [side]: { x: way * 6, y: 12, pitch: 20 } }, 110);
            if (fx) effects.splash.play(fx, [c.figure.points.centre[0] + way * 6 * k, c.figure.points.ground - 14 * k], { k: k * 0.6 });
            await c.feet({ [side]: { x: way * 3, y: 0 } }, 200, easeIn);
        }
        await c.feet({ left: null, right: null }, 1);
        // The only dry place left is up.
        await c.all(c.tween({ gazeX: 0.3, gazeY: -1, wide: 0.4 }, 300, easeInOut), c.hands({ left: { x: -4, y: -30 }, right: { x: 4, y: -34 } }, 300, easeInOut));
        await c.wait(250);
    },
};
