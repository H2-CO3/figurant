// The cat stretches, as a cat does: front down, tail up, eyes narrowed; a
// shake; then a few steps to see what there is, and back.

import { easing, moves } from 'figurant';

const { easeInOut, easeOutBack } = easing;

export const stretchCat = {
    character: 'cat',
    room: { left: 80, right: 80, up: 90 },

    async play(c) {
        const s = c.state, k = c.figure.k, home = s.x, dir = s.dir || 1;

        // The stretch: it leans onto its front legs, tail high, eyes almost shut.
        c.also({ squint: 0.9, wave: 1 }, 500, easeInOut);
        await c.tween({ tilt: dir * 9, crouch: 5 }, 620, easeInOut);
        await c.wait(1260);
        c.also({ squint: 0, wave: 0 }, 400);
        await c.tween({ tilt: 0, crouch: 0 }, 420, easeOutBack);

        // A shake, from nose to tail.
        for (const lean of [4, -4, 3, -3, 0]) await c.tween({ tilt: lean }, 70);
        await moves.blink(c);
        await c.wait(420);

        // A few steps one way, a look, and home again.
        await moves.walkTo(c, home + dir * 60 * k, 0.7);
        await moves.glance(c, dir, -0.3, 840);
        await moves.walkTo(c, home, 0.7);
        s.dir = dir;
        await c.tween({ gazeX: 0, gazeY: 0 }, 240);
        await c.wait(840);
    },
};
