// The dog has found a smell. Classic cartoon: it freezes (anticipation), its
// nose goes down, it sniffs along the floor with its tail going faster and
// faster, then its head shoots up, delighted.

import { easing, moves } from 'figurant';

const { easeIn, easeOut, easeInOut, easeOutBack } = easing;

export const sniffDog = {
    character: 'dog',
    room: { left: 70, right: 70, up: 90 },

    async play(c) {
        const s = c.state, dir = s.dir || 1;
        c.onLeave(() => { s.wag = 0; });
        // It freezes: something is there.
        c.also({ wide: 0.6 }, 90, easeOut);
        await c.tween({ squash: -0.3, gazeX: dir }, 160, easeOut);
        await c.wait(420);
        // Nose to the floor, rump up, and it sniffs.
        c.also({ wide: 0, squint: 0.5, wag: 0.4 }, 300);
        await c.tween({ tilt: dir * 11, crouch: 3, squash: 0.2, gazeY: 1 }, 320, easeInOut);
        for (let i = 0; i < 5; i++) {
            c.also({ wag: 0.4 + 0.12 * i }, 200);
            await c.tween({ gazeY: 0.6, squash: 0.05 }, 130, easeOut);
            await c.tween({ gazeY: 1, squash: 0.25 }, 130, easeIn);
        }
        // Found it! Up it comes, tongue out, tail flat out.
        c.also({ squint: 0, wide: 0.8, wag: 1 }, 160, easeOut);
        await c.tween({ tilt: -dir * 6, crouch: 0, squash: -0.35, gazeY: -0.4 }, 180, easeOut);
        await c.tween({ tilt: 0, squash: 0 }, 360, easeOutBack);
        await moves.hop(c, 12);
        await c.wait(840);
        c.also({ wide: 0, gazeY: 0, gazeX: 0 }, 400);
        await c.tween({ wag: 0.3 }, 600);
    },
};
