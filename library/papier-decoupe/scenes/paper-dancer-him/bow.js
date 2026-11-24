// Made for him: a bow, one hand on his heart; and he stands.

import { easing } from 'figurant';

const { easeInOut } = easing;

export const bowHim = {
    character: 'paper-dancer-him',
    room: { left: 40, right: 40, up: 120 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        await c.all(c.tween({ tilt: 12, crouch: 3, blush: 1, gazeY: 0.4 }, 420, easeInOut), c.hands({ right: { x: 3, y: -6 }, left: { x: -16, y: 6 } }, 420, easeInOut));
        await c.wait(520);
        await c.all(c.tween({ tilt: 0, crouch: 0, gazeY: 0, gazeX: s.dir }, 420, easeInOut), c.hands({ left: null, right: null }, 420));
        await c.wait(750);
        await c.tween({ blush: 0 }, 300);
    },
};
