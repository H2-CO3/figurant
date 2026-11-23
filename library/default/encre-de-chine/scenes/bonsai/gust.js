// A gust takes the bonsai. In ink wash: it leans slowly into a wind that
// rises, holds a long time, the gust hits in one sharp stroke, and it comes
// back upright as slowly as it went.

import { easing } from 'figurant';

const { easeInOut, easeOut } = easing;

export const gustBonsai = {
    character: 'bonsai',
    room: { left: 70, right: 70, up: 100 },

    async play(c) {
        // The wind rises: it leans, eyes narrowed.
        c.also({ squint: 0.8, gazeX: -1 }, 900);
        await c.tween({ tilt: 7, crouch: 2 }, 1800, easeInOut);
        await c.wait(1200);
        // The gust: one stroke.
        c.also({ wide: 1, squint: 0 }, 70, easeOut);
        await c.tween({ tilt: 15, x: c.state.x + 6 * c.figure.k }, 90, easeOut);
        await c.wait(520);
        // And the calm, slowly.
        c.also({ wide: 0, gazeX: 0 }, 1400);
        await c.tween({ tilt: 0, crouch: 0, x: c.state.x - 6 * c.figure.k }, 2200, easeInOut);
        await c.tween({ lid: 0 }, 500, easeInOut);
        await c.wait(900);
        await c.tween({ lid: 1 }, 700, easeInOut);
        await c.wait(600);
    },
};
