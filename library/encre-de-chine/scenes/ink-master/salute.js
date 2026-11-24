// The master salutes what it has made: fist in palm, a bow of the head; and
// it looks at it, for a while.

import { easing } from 'figurant';

const { easeInOut } = easing;

export const saluteInkMaster = {
    character: 'ink-master',
    room: { left: 30, right: 30, up: 120 },

    async play(c, ctx) {
        const s = c.state;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        await c.hands({ left: { x: -3, y: -8 }, right: { x: 3, y: -8 } }, 360, easeInOut);
        await c.tween({ tilt: 10, gazeY: 0.5 }, 480, easeInOut);
        await c.tween({ tilt: 0, gazeY: -0.3, gazeX: s.dir * 0.8 }, 480, easeInOut);
        await c.hands({ left: null, right: null }, 400);
        await c.wait(ctx?.data?.look ?? 2000);
    },
};
