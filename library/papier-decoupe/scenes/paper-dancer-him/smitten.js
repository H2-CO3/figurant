// Made for him: he sees somebody across the floor. He stops short, quiff up;
// straightens his tie.

import { easing } from 'figurant';

const { easeInOut } = easing;

export const smittenHim = {
    character: 'paper-dancer-him',
    room: { left: 40, right: 40, up: 120 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        c.also({ wide: 1 }, 150);
        await c.tween({ gazeX: s.dir }, 300, easeInOut);
        await c.wait(500);
        await c.all(c.tween({ wide: 0, blush: 1 }, 300), c.hands({ right: { x: 2, y: -9 } }, 300, easeInOut));
        await c.hands({ right: { x: 5, y: -10 } }, 160); await c.hands({ right: { x: 1, y: -9 } }, 160);
        await c.hands({ right: null }, 240);
    },
};
