// Made for her: the dance in hold, her part. A last small step up to the
// hand held out, hers put in it; side to side together, eight beats (in the
// middle of them her hand is lifted and she turns once on the spot); then
// the spin under his arm, three turns, the skirt wide open.
// `data.step`, `data.spin`: when the steps and the spin begin, in ms from
// the start (his `together-him` is told its own, for the same moments).

import { easing, moves } from 'figurant';

const { easeOut, easeInOut } = easing;
/** How far each step to the side goes. */
const SWAY = 16;

export const togetherHer = {
    character: 'paper-dancer-her',
    room: { left: 60, right: 40, up: 140 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, { step = 800, spin = 5600 } = ctx?.data ?? {};
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        c.onLeave(() => { c.tween({ twirl: 0, spin: 0 }, 1).catch(() => {}); c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        const spot = s.x + s.dir * 14 * k;
        await c.all(moves.walkTo(c, spot, 0.6), c.hands({ left: { x: -19, y: -4, angle: 200 } }, 480, easeInOut));
        // Side to side, together: the same way on the floor at the same moment.
        await at(step);
        for (let beat = 0; beat < 8; beat++) {
            const to = beat % 2 ? -1 : 1;
            if (beat === 4) {
                await c.all(c.tween({ x: spot, tilt: 0 }, 200, easeInOut), c.hands({ left: { x: -8, y: -48 } }, 200, easeInOut), c.tween({ twirl: 0.8, blush: 1 }, 200));
                await c.tween({ spin: 1 }, 760, easeInOut);
                await c.tween({ spin: 0 }, 1);
                await c.all(c.tween({ twirl: 0, squash: 0 }, 220, easeInOut), c.hands({ left: { x: -19, y: -4, angle: 200 } }, 220, easeInOut));
                beat++;
                continue;
            }
            await c.all(c.tween({ x: spot + to * SWAY * k, tilt: to * 6, crouch: 2 }, 300, easeInOut), c.feet({ left: { x: to * 3, y: beat % 2 ? 6 : 0 }, right: { x: to * 3, y: beat % 2 ? 0 : 6 } }, 300, easeInOut));
            await c.all(c.tween({ crouch: 0 }, 240, easeOut), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 240));
        }
        await c.tween({ x: spot, tilt: 0 }, 240);
        await c.feet({ left: null, right: null }, 1);
        // The spin, under his arm.
        await at(spin);
        await c.all(c.hands({ left: { x: -8, y: -50 }, right: { x: 16, y: 2, angle: -10 } }, 300, easeInOut), c.tween({ twirl: 1, gazeX: 0 }, 300, easeOut));
        await c.tween({ spin: 3 }, 1500, easeInOut);
        await c.tween({ spin: 0 }, 1);
        await c.all(c.tween({ twirl: 0, squash: 0, tilt: 0, gazeX: s.dir }, 360, easeInOut), c.hands({ left: null, right: null }, 360));
    },
};
