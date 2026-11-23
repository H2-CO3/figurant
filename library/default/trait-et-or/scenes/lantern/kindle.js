// The lantern lights up. Its flame sinks to an ember, it gathers itself, the
// flame flares and rings of light spread; it looks left and right at what it
// lights, then settles.

import { easing, moves } from 'figurant';

const { easeInOut, easeOutBack } = easing;

export const kindleLantern = {
    character: 'lantern',
    room: { left: 70, right: 70, up: 120 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.glow = 0; });
        // An ember…
        await c.tween({ lid: 0.2, crouch: 5 }, 420, easeInOut);
        await c.wait(840);
        // … then the flame.
        c.also({ wide: 1 }, 160);
        await c.tween({ lid: 1, crouch: 0, glow: 1 }, 420, easeOutBack);
        c.also({ wide: 0 }, 600);
        await c.wait(840);
        // It holds its light out to one side, then the other.
        await moves.glance(c, -1, 0, 840);
        await moves.glance(c, 1, 0, 840);
        await moves.glance(c, 0, 0, 420);
        await c.tween({ glow: 0 }, 1260, easeInOut);
        await c.wait(840);
    },
};
