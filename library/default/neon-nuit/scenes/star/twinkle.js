// The star twinkles: it dims, gathers itself, and flares twice, bigger and
// brighter each time, with a turn on itself; then hums on.

import { easing, moves } from 'figurant';

const { easeInOut, easeOutBack, easeOut } = easing;

export const twinkleStar = {
    character: 'star',
    room: { left: 70, right: 70, up: 130 },

    async play(c) {
        await c.tween({ lid: 0.15, crouch: 5 }, 420, easeInOut);
        await c.wait(420);
        for (const size of [0.6, 1]) {
            c.also({ wide: size, lid: 1 }, 120, easeOut);
            await c.tween({ crouch: 0, squash: -0.3 * size }, 160, easeOut);
            await c.tween({ squash: 0, wide: 0 }, 420, easeOutBack);
            await c.wait(210);
        }
        // A turn on itself: a star looks the same five times in a turn.
        await c.tween({ tilt: 72 }, 520, easeInOut);
        c.state.tilt = 0;
        await moves.blink(c);
        await c.wait(1260);
    },
};
