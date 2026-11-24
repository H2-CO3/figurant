// Made for her: she sees somebody across the floor. A look, a look away, the
// cheeks; her hands joined in front of her.

import { easing } from 'figurant';

const { easeInOut } = easing;

export const shyHer = {
    character: 'paper-dancer-her',
    room: { left: 40, right: 40, up: 120 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        await c.tween({ gazeX: s.dir }, 360, easeInOut);
        await c.wait(600);
        await c.all(c.tween({ gazeX: -s.dir * 0.4, gazeY: 0.5, blush: 1 }, 360, easeInOut), c.hands({ left: { x: -4, y: 12 }, right: { x: 4, y: 12 } }, 360));
        await c.wait(500);
        await c.hands({ left: null, right: null }, 240);
    },
};
