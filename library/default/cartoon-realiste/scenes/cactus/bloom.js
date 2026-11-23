// The cactus flowers. It looks about, gathers itself, and its flower opens;
// it shows it off with a small bow.

import { easing, moves } from 'figurant';

const { easeInOut, easeOutBack } = easing;

export const bloomCactus = {
    character: 'cactus',
    room: { left: 50, right: 50, up: 110 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.bloom = 0; });
        await moves.glance(c, -0.8, -0.2, 500);
        await moves.glance(c, 0.8, -0.2, 500);
        // It gathers itself…
        c.also({ squint: 0.8 }, 300);
        await c.tween({ crouch: 5, squash: 0.25, gazeX: 0, gazeY: -0.6 }, 420, easeInOut);
        // … and flowers.
        c.also({ squint: 0, squash: 0 }, 300, easeOutBack);
        await c.tween({ crouch: 0, bloom: 1 }, 700, easeOutBack);
        await c.wait(840);
        // A small bow, to show it.
        await c.tween({ tilt: 7 }, 300, easeInOut);
        await c.tween({ tilt: 0 }, 300, easeOutBack);
        await moves.blink(c);
        await c.wait(1680);
        await c.tween({ bloom: 0 }, 900, easeInOut);
        await c.wait(420);
    },
};
