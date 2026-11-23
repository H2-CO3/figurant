// The toadstool loses its hat. It jumps; the cap, which only sits on the
// stem, stays in the air a moment longer and comes down after it. In cut
// paper: poses held, moved in steps.

import { easing } from 'figurant';

const { easeIn, easeOut } = easing;

export const popCapToadstool = {
    character: 'toadstool',
    room: { left: 60, right: 60, up: 120 },

    async play(c) {
        const s = c.state, y = s.y, k = c.figure.k;
        // It looks left, right: nobody. Down it goes.
        await c.tween({ gazeX: -1 }, 80); await c.wait(340);
        await c.tween({ gazeX: 1 }, 80); await c.wait(340);
        await c.tween({ gazeX: 0, crouch: 8, squash: 0.6, squint: 1 }, 120, easeOut);
        await c.wait(300);
        // Up! The cap lifts off the stem.
        c.also({ crouch: 0, squash: -0.4, squint: 0 }, 80);
        await c.tween({ y: y - 34 * k }, 200, easeOut);
        await c.wait(120);
        // The stem comes down; the cap is still up there.
        c.also({ wide: 1, gazeY: -1 }, 80);
        await c.tween({ y, squash: 0.5 }, 180, easeIn);
        await c.tween({ squash: 0 }, 120);
        await c.wait(460);
        // Plop: the cap lands, and the stem takes the weight.
        await c.tween({ wide: 0 }, 140, easeIn);
        await c.tween({ squash: 0.6, crouch: 3 }, 80);
        await c.tween({ squash: 0, crouch: 0, gazeY: 0 }, 160);
        await c.wait(300);
        await c.tween({ lid: 0 }, 80); await c.wait(160); await c.tween({ lid: 1 }, 80);
        await c.wait(700);
    },
};
