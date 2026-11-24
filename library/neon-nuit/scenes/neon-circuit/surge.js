// The circuit kicks: everything lurches forward, the core flares, the air
// is drawn out; then it settles. `data.over`: how long, all told.

import { easing } from 'figurant';

const { easeOut, easeInOut } = easing;

export const surgeNeonCircuit = {
    character: 'neon-circuit',
    room: { left: 200, right: 200, up: 190 },

    async play(c, ctx) {
        const over = ctx?.data?.over ?? 1500;
        c.onLeave(() => { c.tween({ boost: 0 }, 1).catch(() => {}); });
        await c.tween({ boost: 1 }, over * 0.3, easeOut);
        await c.wait(over * 0.25);
        await c.tween({ boost: 0 }, over * 0.45, easeInOut);
    },
};
