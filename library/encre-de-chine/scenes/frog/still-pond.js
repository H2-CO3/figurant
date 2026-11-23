// The frog by the lotus leaf. A leaf rises beside it; the frog breathes, its
// throat filling and sinking; its eye closes, slowly. A mayfly comes down to
// the rim of the leaf. The eye opens. The frog gathers itself, a long while;
// then its tongue: one strike, the only quick thing here. The leaf dips and
// takes its time coming back; the frog swallows, and is still again.
//
// It never leaves the floor: no hop, no step.

import { easing } from 'figurant';
import { lotusLeaf } from '../../props/lotus-leaf.js';
import { mayfly } from '../../props/mayfly.js';
import { TONGUE } from '../../characters/frog.js';

const { easeInOut, easeOut, easeIn } = easing;
/** Where the stem stands; the rim of the leaf, from the stem; the frog's mouth, from its middle and above the floor. */
const STEM = 114, RIM = [-29.5, -37], MOUTH = [45, 35];

export const stillPondFrog = {
    character: 'frog',
    room: { left: 45, right: 170, up: 100 },
    variants: [{ name: 'left', room: { left: 170, right: 45, up: 100 } }],

    async play(c, { variant }) {
        const s = c.state, k = c.figure.k, side = variant === 'left' ? -1 : 1, x0 = s.x / k;
        c.onLeave(() => { s.croak = 0; s.tongue = 0; });
        // It faces the leaf.
        s.dir = side;
        const rimX = STEM + RIM[0];

        // The leaf rises. The frog breathes: its throat fills, holds, sinks.
        const leaf = c.prop(lotusLeaf, { x: x0 + side * STEM, state: { draw: 0, flip: side } });
        c.animate(leaf.state, { draw: 1 }, 1680).catch(() => {});
        await c.wait(630);
        await c.tween({ croak: 0.85 }, 1260, easeInOut);
        await c.wait(315);
        await c.tween({ croak: 0 }, 1260, easeInOut);

        // Its eye closes, slowly. Meanwhile a mayfly comes down, in an arc, to the rim of the leaf.
        const fly = c.prop(mayfly, { x: x0 + side * (rimX + 46), y: RIM[1] - 62, state: { draw: 0, flip: -side } });
        const land = { x: (x0 + side * (rimX + 5)) * k, y: (RIM[1] - 1.5) * k };
        c.animate(fly.state, { draw: 1 }, 630).catch(() => {});
        c.animate(fly.state, { x: land.x }, 2100, easeOut).catch(() => {});
        c.animate(fly.state, { y: land.y }, 2100, easeInOut).catch(() => {});
        await c.tween({ lid: 0.08 }, 1260, easeInOut);
        await c.wait(840);
        // It opens on the mayfly.
        await c.tween({ lid: 1, gazeX: side, gazeY: -0.25 }, 1050, easeInOut);
        await c.wait(630);

        // It gathers itself: lower, the eye narrowed, the throat held.
        await c.tween({ crouch: 2.5, squint: 0.6, croak: 0.3, tilt: -side * 3 }, 1050, easeInOut);
        await c.wait(420);

        // The strike. Out, and back with it.
        const reach = (rimX + 3 - MOUTH[0]) / TONGUE;
        c.also({ wide: 0.5, squint: 0 }, 90, easeOut);
        await c.tween({ tongue: reach }, 80, easeOut);
        fly.state.draw = 0;
        c.animate(leaf.state, { tilt: -side * 6 }, 160, easeOut).catch(() => {});
        await c.tween({ tongue: 0 }, 170, easeIn);
        // The long settling: the leaf comes back, the frog sinks onto itself again.
        c.animate(leaf.state, { tilt: 0 }, 2100, easeInOut).catch(() => {});
        await c.tween({ wide: 0, crouch: 0, tilt: 0, croak: 0, gazeY: 0 }, 1260, easeInOut);
        // It swallows: the eye shuts, the throat fills once, and sinks.
        await c.tween({ lid: 0.1, croak: 0.6 }, 630, easeInOut);
        await c.tween({ croak: 0 }, 840, easeInOut);
        await c.tween({ lid: 1 }, 840, easeInOut);
        await c.wait(840);

        // The leaf goes as it came.
        c.also({ gazeX: 0 }, 840, easeInOut);
        await c.animate(leaf.state, { draw: 0 }, 1260, easeInOut);
    },
};
