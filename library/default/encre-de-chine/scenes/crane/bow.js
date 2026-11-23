// The crane greets: it opens its wing, bows low on its long neck, rises, and
// folds the wing again. Unhurried.

import { easing, moves } from 'figurant';

const { easeInOut, easeOutBack } = easing;

export const bowCrane = {
    character: 'crane',
    room: { left: 80, right: 80, up: 130 },
    mood: 'any',

    async play(c) {
        await c.tween({ gazeX: 0, gazeY: -0.4 }, 420, easeInOut);
        await c.tween({ wave: 1 }, 840, easeInOut);
        await c.wait(420);
        // The bow: the neck goes down, the body follows a little.
        c.also({ squint: 0.6 }, 420);
        await c.tween({ gazeY: 1, tilt: (c.state.dir || 1) * 8, crouch: 4 }, 840, easeInOut);
        await c.wait(840);
        c.also({ squint: 0 }, 420);
        await c.tween({ gazeY: 0, tilt: 0, crouch: 0 }, 840, easeOutBack);
        await c.tween({ wave: 0 }, 840, easeInOut);
        await moves.blink(c);
        await c.wait(1260);
    },
};
