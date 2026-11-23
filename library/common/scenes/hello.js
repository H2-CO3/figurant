// A hello: a hop and a wave. The smallest scene worth watching; it plays on
// any character.

import { moves } from 'figurant';

export const hello = {
    room: { left: 40, right: 40, up: 110 },
    async play(c) {
        await moves.hop(c, 24);
        await c.tween({ wave: 1 }, 220);
        await c.wait(900);
        await c.tween({ wave: 0 }, 220);
        await moves.blink(c);
        await c.wait(600);
    },
};
