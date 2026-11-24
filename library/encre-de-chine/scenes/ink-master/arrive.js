// The master arrives the way it does everything: a leap with a turn in it
// (`data.by` units forward, 70 if nothing is said), a landing in a low
// stance, one arm out; then it rises, and salutes, fist in palm.

import { easing } from 'figurant';

const { easeInOut, easeOut, easeIn, linear } = easing;

export const arriveInkMaster = {
    character: 'ink-master',
    room: { left: 30, right: 110, up: 180 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, ground = s.y, to = s.x + s.dir * (ctx?.data?.by ?? 70) * k;
        c.onLeave(() => { c.tween({ y: ground, focus: 0, tuck: 0 }, 1).catch(() => {}); c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        c.also({ crouch: 0, tuck: 1, focus: 1 }, 120, easeOut);
        const turn = c.tween({ tilt: 360 }, 620, linear), across = c.tween({ x: to }, 620, linear);
        await c.tween({ y: ground - 64 * k }, 310, easeOut);
        c.also({ tuck: 0 }, 200, easeIn);
        await c.tween({ y: ground }, 310, easeIn);
        await turn; await across;
        // (A full turn: upright again.)
        await c.tween({ tilt: 0 }, 1);
        await c.all(c.tween({ crouch: 11, focus: 1 }, 140, easeOut), c.feet({ left: { x: -9, y: 0 }, right: { x: 9, y: 0 } }, 140, easeOut), c.hands({ left: { x: -16, y: 8, angle: 200 }, right: { x: 26, y: -8, angle: -10 } }, 140, easeOut), c.tween({ gazeX: 1 }, 140));
        await c.wait(650);
        await c.all(c.tween({ crouch: 0, focus: 0 }, 360, easeInOut), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 360, easeInOut), c.hands({ left: { x: -3, y: -8 }, right: { x: 3, y: -8 } }, 360, easeInOut));
        await c.feet({ left: null, right: null }, 1);
        await c.tween({ tilt: 9, gazeY: 0.5 }, 420, easeInOut);
        await c.tween({ tilt: 0, gazeY: 0 }, 420, easeInOut);
        await c.hands({ left: null, right: null }, 200);
    },
};
