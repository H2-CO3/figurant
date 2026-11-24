// Made for him: the dance in hold, his part. The hand held out, a small bow
// with it; a last step up; side to side together, eight beats (in the middle
// of them he lifts her hand over her head and turns her once, standing where
// he is); then his arm up for her to spin under, and he watches, delighted.
// `data.step`, `data.spin`: when the steps and the spin begin, in ms from
// the start (her `together-her` is told its own, for the same moments).

import { easing, moves } from 'figurant';

const { easeOut, easeInOut } = easing;
/** How far each step to the side goes. */
const SWAY = 16;

export const togetherHim = {
    character: 'paper-dancer-him',
    room: { left: 40, right: 60, up: 140 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, { step = 1300, spin = 6100 } = ctx?.data ?? {};
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        c.onLeave(() => { c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        const spot = s.x + s.dir * 12 * k;
        await c.all(c.hands({ right: { x: 21, y: -4, angle: -20 }, left: { x: -8, y: 12 } }, 420, easeInOut), c.tween({ tilt: 7, crouch: 2 }, 420, easeInOut));
        await c.wait(500);
        await c.all(moves.walkTo(c, spot, 0.6), c.tween({ tilt: 0, crouch: 0 }, 400));
        // Side to side, together: the same way on the floor at the same moment.
        await at(step);
        for (let beat = 0; beat < 8; beat++) {
            const to = beat % 2 ? -1 : 1;
            if (beat === 4) {
                await c.all(c.tween({ x: spot, tilt: 0 }, 200, easeInOut), c.hands({ right: { x: 32, y: -50, angle: -80 } }, 200, easeInOut), c.tween({ blush: 1, gazeY: -0.2 }, 200));
                await c.tween({ tilt: 3 }, 380, easeInOut); await c.tween({ tilt: -2 }, 380, easeInOut);
                await c.all(c.tween({ tilt: 0, gazeY: 0 }, 220), c.hands({ right: { x: 21, y: -4, angle: -20 } }, 220, easeInOut));
                beat++;
                continue;
            }
            await c.all(c.tween({ x: spot + to * SWAY * k, tilt: to * 6, crouch: 2 }, 300, easeInOut), c.feet({ left: { x: to * 3, y: beat % 2 ? 0 : 6 }, right: { x: to * 3, y: beat % 2 ? 6 : 0 } }, 300, easeInOut));
            await c.all(c.tween({ crouch: 0 }, 240, easeOut), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 240));
        }
        await c.tween({ x: spot, tilt: 0 }, 240);
        await c.feet({ left: null, right: null }, 1);
        // His arm up, for her to spin under.
        await at(spin);
        await c.all(c.hands({ right: { x: 30, y: -52, angle: -80 }, left: { x: -10, y: 10 } }, 300, easeInOut), c.tween({ gazeY: -0.2, blush: 1 }, 300));
        await at(spin + 1900);
        await c.all(c.hands({ left: null, right: null }, 360), c.tween({ gazeY: 0 }, 360));
    },
};
