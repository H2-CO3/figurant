// The cat does a backflip. Classic cartoon timing: it looks up, sinks onto
// its legs and wiggles its rump (anticipation), shoots up stretched, tucks
// its legs and turns right over backwards at the top, opens out, lands on
// its four feet, and then pretends it was nothing.

import { easing, moves } from 'figurant';

const { easeIn, easeOut, easeInOut, easeOutBack, linear } = easing;

export const backflipTabby = {
    character: 'tabby',
    room: { left: 80, right: 80, up: 150 },

    async play(c) {
        const s = c.state, dir = s.dir || 1, k = c.figure.k, y = s.y, x = s.x;
        c.onLeave(() => { s.tilt = 0; s.tuck = 0; s.purr = 0; });

        // It looks up, measuring the jump.
        await c.tween({ gazeY: -0.8, squash: -0.15 }, 200, easeOut);
        await c.wait(260);
        // Down on its legs, rump wiggling, eyes narrowed.
        c.also({ squint: 0.5, gazeY: -0.3 }, 200);
        await c.tween({ crouch: 9, squash: 0.45, tilt: -dir * 5 }, 260, easeInOut);
        for (let i = 0; i < 3; i++) {
            await c.tween({ tilt: -dir * 8 }, 70, easeInOut);
            await c.tween({ tilt: -dir * 3 }, 70, easeInOut);
        }
        await c.tween({ crouch: 11, squash: 0.6 }, 110, easeOut);

        // Off! Stretched on the way up, a full turn backwards, legs tucked.
        c.also({ crouch: 0, squash: -0.55, squint: 0, wide: 0.7 }, 90, easeOut);
        c.also({ tuck: 1 }, 170, easeOut);
        const turn = c.tween({ tilt: -dir * 360 }, 620, t => 0.5 * linear(t) + 0.5 * easeInOut(t));
        const drift = c.tween({ x: x - dir * 16 * k }, 640, linear);
        await c.tween({ y: y - 74 * k }, 320, easeOut);
        c.also({ squash: 0 }, 120);
        const open = c.wait(150).then(() => c.tween({ tuck: 0 }, 150, easeIn));
        await c.tween({ y }, 320, easeIn);
        await c.all(turn, drift, open);
        s.tilt = 0;

        // On its four feet, and a wobble.
        await moves.land(c, 9);
        await c.tween({ tilt: dir * 3 }, 110, easeOut);
        await c.tween({ tilt: 0 }, 260, easeOutBack);
        // Nothing happened. A slow blink, a purr, a look at you.
        await c.wait(240);
        c.also({ gazeX: 0, gazeY: 0 }, 200);
        await moves.blink(c);
        await c.tween({ purr: 1 }, 400, easeInOut);
        await c.wait(1100);
        await c.tween({ purr: 0, x }, 500, easeInOut);
    },
};
