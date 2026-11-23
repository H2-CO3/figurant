// The hourglass runs out. Its sand falls to the last grain, it looks down,
// finds itself empty, and turns itself over in one leap; the sand is back on
// top and time starts again.

import { easing, moves } from 'figurant';

const { easeIn, easeOut, easeInOut, linear } = easing;

export const turnOverHourglass = {
    character: 'hourglass',
    room: { left: 70, right: 70, up: 140 },

    async play(c) {
        const s = c.state, y = s.y, k = c.figure.k, start = s.sand;
        c.onLeave(() => { s.sand = start; s.tilt = 0; s.tuck = 0; });
        // The last of the sand.
        c.also({ gazeY: 0.9 }, 420);
        await c.tween({ sand: 1 }, 1680, easeIn);
        await c.wait(420);
        // Empty! It looks at you.
        c.also({ wide: 1 }, 90);
        await c.tween({ gazeY: 0 }, 120, easeOut);
        await c.wait(420);
        c.also({ wide: 0 }, 300);
        // One leap, one full turn: the sand goes back up.
        await c.tween({ crouch: 8, squash: 0.4 }, 210, easeInOut);
        c.also({ crouch: 0, squash: -0.3, tuck: 1 }, 100, easeOut);
        const turn = c.tween({ tilt: 360, sand: 0 }, 630, linear);
        await c.tween({ y: y - 56 * k }, 315, easeOut);
        c.also({ tuck: 0 }, 220, easeIn);
        await c.tween({ y }, 315, easeIn);
        await turn;
        s.tilt = 0;
        c.also({ squash: 0 }, 200);
        await moves.land(c, 8);
        // Time starts again.
        c.also({ gazeY: 0.5 }, 420);
        await c.tween({ sand: start }, 1260, easeInOut);
        await c.tween({ gazeY: 0 }, 420);
        await moves.blink(c);
    },
};
