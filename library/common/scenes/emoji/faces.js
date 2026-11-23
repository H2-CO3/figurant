// The emoji figure pulls its faces: surprise, doubt, eyes shut, each held
// long enough to be read (each is one of its glyphs, chosen in the atelier),
// then a hop and a wave.

import { easing, moves } from 'figurant';

const { easeOut } = easing;

export const facesEmoji = {
    character: 'emoji',
    room: { left: 50, right: 50, up: 110 },

    async play(c) {
        // Surprise.
        c.also({ squash: -0.3 }, 100, easeOut);
        await c.tween({ wide: 1 }, 80); await c.wait(700);
        await c.tween({ wide: 0, squash: 0 }, 120); await c.wait(250);
        // Doubt, head on one side.
        await c.tween({ squint: 1, tilt: 7 }, 160); await c.wait(800);
        await c.tween({ squint: 0, tilt: 0 }, 160); await c.wait(250);
        // Eyes shut, a long one.
        await c.tween({ lid: 0, crouch: 3 }, 120); await c.wait(700);
        await c.tween({ lid: 1, crouch: 0 }, 120);
        // And itself again.
        await moves.hop(c, 20);
        await c.tween({ wave: 1 }, 200); await c.wait(700);
        await c.tween({ wave: 0 }, 200);
        await c.wait(400);
    },
};
