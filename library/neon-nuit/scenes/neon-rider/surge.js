// The runner kicks: the wings spread, the flare behind the wheel, and it
// gains ground (a little further ahead); then it eases back to where it was.
// `data.over`: how long, all told (the circuit's own surge is told the same).

import { easing } from 'figurant';

const { easeOut, easeInOut } = easing;

export const surgeNeonRider = {
    character: 'neon-rider',
    room: { left: 200, right: 200, up: 190 },

    async play(c, ctx) {
        const s = c.state, over = ctx?.data?.over ?? 1500, far = s.far;
        c.onLeave(() => { c.tween({ boost: 0, rev: 0.5 }, 1).catch(() => {}); });
        await c.tween({ boost: 1, rev: 1, far: far + 0.22 }, over * 0.3, easeOut);
        await c.wait(over * 0.25);
        await c.tween({ boost: 0, rev: 0.5, far }, over * 0.45, easeInOut);
    },
};
