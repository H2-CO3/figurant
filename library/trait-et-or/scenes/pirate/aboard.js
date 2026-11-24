// The pirate in its boat, under sail: one arm round the mast, at ease, a
// little unsteady. A long look ahead under its hand; a hiccup. `data.by`,
// `data.over`: how far the boat carries it meanwhile, and in how long (the
// same as the boat's own `sail-boat`). It stands in the hull, by the mast.

import { easing } from 'figurant';

const { linear, easeInOut, easeOut } = easing;

export const aboardPirate = {
    character: 'pirate',
    room: { left: 40, right: 40, up: 110 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, { by = 0, over = 5600 } = ctx?.data ?? {};
        const end = c.clock.now + over;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        c.also({ x: s.x + by * k }, over, linear);
        c.also({ gazeX: 0.9, squint: 0.5, grin: 1 }, 400);
        await c.hands({ right: { x: 3, y: -22 }, left: { x: -10, y: 10, angle: 30 } }, 400, easeInOut);
        const sway = async until => { for (let i = 0; c.clock.now < until; i++) await c.tween({ tilt: i % 2 ? 5 : -4 }, 620, easeInOut); };
        await sway(c.clock.now + 1300);
        // A hand over the eyes: nothing but sea, and that suits it.
        await c.all(c.hands({ left: { x: 9, y: -42, angle: -100 } }, 420, easeInOut), c.tween({ tilt: 6 }, 420, easeInOut));
        await c.wait(1100);
        await c.all(c.hands({ left: { x: -10, y: 10, angle: 30 } }, 420, easeInOut), c.tween({ tilt: 0 }, 420, easeInOut));
        // A hiccup.
        c.also({ wide: 1, squint: 0 }, 80);
        await c.tween({ squash: -0.18, crouch: -2 }, 90, easeOut);
        await c.tween({ squash: 0, crouch: 0, wide: 0, squint: 0.5 }, 220, easeOut);
        await sway(end - 300);
        await c.tween({ tilt: 0 }, Math.max(1, end - c.clock.now), easeInOut);
    },
};
