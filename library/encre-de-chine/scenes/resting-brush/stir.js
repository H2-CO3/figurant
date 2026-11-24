// The brush at rest stirs: it rolls a little on its handle, one way, the
// other, and lies still again. As if it had been waiting.

import { easing } from 'figurant';

const { easeInOut } = easing;

export const stirRestingBrush = {
    character: 'resting-brush',
    room: { left: 60, right: 40, up: 30 },

    async play(c) {
        await c.tween({ rock: 5 }, 500, easeInOut);
        await c.tween({ rock: -3 }, 600, easeInOut);
        await c.tween({ rock: 0 }, 500, easeInOut);
        await c.wait(800);
    },
};
