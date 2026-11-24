// Made for him: the catch. He plants his feet and opens his arms; down on
// his legs as she arrives, then up, arms straight, eyes on her, for as long
// as a held breath; he sets her down, and lets go.
// `data.catch`, `data.down`: when she arrives and when he sets her down, in
// ms from the start (her `leap-her` starts a breath after the first, and is
// told the second from its own start).

import { easing } from 'figurant';

const { easeOut, easeInOut } = easing;

export const catchHim = {
    character: 'paper-dancer-him',
    room: { left: 40, right: 60, up: 190 },

    async play(c, ctx) {
        const { catch: arrives = 1080, down = 4600 } = ctx?.data ?? {};
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        const s = c.state;
        c.onLeave(() => { c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        await c.all(c.feet({ left: { x: -8, y: 0 }, right: { x: 8, y: 0 } }, 300, easeInOut), c.tween({ crouch: 4, gazeX: s.dir }, 300), c.hands({ left: { x: 4, y: -6 }, right: { x: 22, y: -8, angle: -30 } }, 300, easeInOut));
        await at(arrives);
        await c.tween({ crouch: 9 }, 150, easeOut);
        await c.all(c.tween({ crouch: 0, gazeX: s.dir * 0.3, gazeY: -1, wide: 0.4 }, 480, easeOut), c.hands({ left: { x: 4, y: -57, angle: -90 }, right: { x: 18, y: -57, angle: -90 } }, 480, easeOut));
        for (let breath = 0; c.clock.now - start < down - 320; breath++) await c.tween({ tilt: breath % 2 ? 2 : -2, crouch: breath % 2 ? 1.5 : 0 }, 420, easeInOut);
        await at(down);
        await c.all(c.tween({ tilt: 0, crouch: 5, gazeX: s.dir, gazeY: 0, wide: 0 }, 460, easeInOut), c.hands({ left: { x: 8, y: -8 }, right: { x: 24, y: -8 } }, 460, easeInOut));
        await c.all(c.tween({ crouch: 0 }, 300), c.hands({ left: null, right: null }, 300), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 300));
        await c.feet({ left: null, right: null }, 1);
    },
};
