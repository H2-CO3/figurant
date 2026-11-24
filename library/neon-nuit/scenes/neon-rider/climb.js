// The runner takes the wall: out of its lane, up the side of the tunnel
// until it rides nearly sideways, a moment there, and down again to the lane
// it left. `data.side`: -1 for the left wall, 1 for the right;
// `data.over`: how long, all told.

import { easing } from 'figurant';

const { easeInOut } = easing;

export const climbNeonRider = {
    character: 'neon-rider',
    room: { left: 200, right: 200, up: 190 },

    async play(c, ctx) {
        const s = c.state, { side = -1, over = 2500 } = ctx?.data ?? {}, lane = s.lane;
        c.onLeave(() => { c.tween({ rev: 0.5 }, 1).catch(() => {}); });
        c.also({ rev: 0.9 }, 300);
        await c.tween({ lane: side * 2.5 }, over * 0.4, easeInOut);
        await c.tween({ lane: side * 2.2 }, over * 0.2, easeInOut);
        await c.tween({ lane }, over * 0.4, easeInOut);
        c.also({ rev: 0.5 }, 300);
    },
};
