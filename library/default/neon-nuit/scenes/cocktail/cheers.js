// The cocktail says cheers. In neon: poses that snap, held, and a flicker.
// It tips one way, the other (its drink stays level), raises an arm, hops a
// clink, and its sign flickers before it settles.

import { easing, moves } from 'figurant';

const { easeOut } = easing;
const SNAP = 60;

export const cheersCocktail = {
    character: 'cocktail',
    room: { left: 70, right: 70, up: 130 },

    async play(c) {
        // Tip, hold; tip, hold.
        await c.tween({ tilt: 16, gazeX: 1 }, SNAP, easeOut); await c.wait(380);
        await c.tween({ tilt: -16, gazeX: -1 }, SNAP, easeOut); await c.wait(380);
        await c.tween({ tilt: 0, gazeX: 0 }, SNAP, easeOut); await c.wait(200);
        // Cheers!
        await c.all(c.hands({ right: { x: 34, y: -46, angle: 160 } }, SNAP, easeOut), c.tween({ wide: 1, tilt: -8 }, SNAP, easeOut));
        await c.wait(300);
        await moves.hop(c, 18);
        // The sign flickers.
        for (const lid of [0, 1, 0.2, 1, 0, 1]) { await c.tween({ lid }, 30); await c.wait(70); }
        await c.wait(400);
        await c.all(c.hands({ right: null }, SNAP), c.tween({ wide: 0, tilt: 0 }, SNAP, easeOut));
        await c.wait(600);
    },
};
