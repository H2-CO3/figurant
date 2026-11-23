// Three animations for a crowd, playable by any body that has arms: picketing
// with a placard, shaking hands, cheering. They are what scenes with several
// characters are made of (see ../compositions).

import { easing, moves } from 'figurant';
import { placard } from '../props/placard.js';

const { easeOut, easeIn, easeInOut, easeOutBack } = easing;

/** It holds a placard up and bounces with it, for as long as it is left to. `data.text`: the word on the board. */
export const picket = {
    room: { left: 50, right: 50, up: 170 },
    async play(c, ctx) {
        const sign = c.give('right', placard(ctx?.data?.text ?? '!'), { state: { draw: 0 } });
        await c.all(c.hands({ right: { x: 30, y: -34, angle: 170 } }, 300, easeOut), c.animate(sign.state, { draw: 1 }, 360));
        for (let beat = 0; ; beat++) {
            c.hands({ right: { x: 30, y: -44, angle: 170 } }, 180, easeOut).catch(() => {});
            await c.tween({ crouch: 0, tilt: beat % 2 ? 4 : -4 }, 180, easeOut);
            c.hands({ right: { x: 30, y: -34, angle: 170 } }, 240, easeIn).catch(() => {});
            await c.tween({ crouch: 5 }, 240, easeIn);
            if (beat % 4 === 3) await moves.blink(c);
        }
    },
};

/**
 * It holds a hand out in front of it and shakes: two of them, face to face, shake hands.
 * Bodies differ, so a scene says where each one's hand goes for the two to meet:
 * `data.reach` (how far in front of its middle) and `data.height` (y from its
 * origin, down positive), in character units.
 */
export const shakeHands = {
    room: { left: 60, right: 60, up: 110 },
    async play(c, ctx) {
        const dir = c.state.dir || 1, hand = dir > 0 ? 'right' : 'left';
        const x = dir * (ctx?.data?.reach ?? 40), y = ctx?.data?.height ?? -4;
        c.also({ gazeX: dir, tilt: dir * 4 }, 300);
        await c.hands({ [hand]: { x, y, angle: dir * 90 } }, 420, easeInOut);
        for (let i = 0; i < 4; i++) {
            await c.hands({ [hand]: { x, y: y - 6, angle: dir * 90 } }, 150, easeOut);
            await c.hands({ [hand]: { x, y: y + 4, angle: dir * 90 } }, 150, easeIn);
        }
        await moves.blink(c);
        await c.all(c.hands({ [hand]: null }, 300), c.tween({ tilt: 0, gazeX: 0 }, 300));
    },
};

/** It jumps for joy, twice, arms up. */
export const cheer = {
    room: { left: 40, right: 40, up: 150 },
    async play(c) {
        for (let i = 0; i < 2; i++) {
            c.also({ wide: 0.6, stretch: 1 }, 120, easeOut);
            await moves.hop(c, 26);
            c.also({ wide: 0, stretch: 0 }, 300, easeOutBack);
            await c.wait(140);
        }
        await c.tween({ wave: 1 }, 200);
        await c.wait(700);
        await c.tween({ wave: 0 }, 200);
    },
};
