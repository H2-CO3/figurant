// The pirate on the mast, arms and legs round it, going up hand over hand as
// the boat goes down: a look at the water, a pull, a look at the water.
// `data.for`: how long it keeps at it.

import { easing } from 'figurant';

const { easeOut, easeInOut } = easing;

/** Round the mast: both hands on it, one above the other, the feet gripping it. */
export const grip = (c, ms = 300) => c.all(
    c.hands({ left: { x: 2, y: -32 }, right: { x: 3, y: -18 } }, ms, easeInOut),
    c.feet({ left: { x: 1, y: 7 }, right: { x: 4, y: 2 } }, ms, easeInOut),
);
/** One pull up the mast: a hand reaches, the body follows. */
export async function pull(c, turn) {
    const up = turn % 2 ? 'left' : 'right', hold = turn % 2 ? 'right' : 'left';
    await c.all(c.hands({ [up]: { x: 3, y: -38 }, [hold]: { x: 3, y: -12 } }, 190, easeOut), c.tween({ crouch: 5 }, 190, easeOut));
    await c.all(c.hands({ [up]: { x: 3, y: -16 }, [hold]: { x: 3, y: 4 } }, 300, easeInOut), c.tween({ crouch: 0 }, 300, easeInOut), c.feet({ [up]: { x: 3, y: 9 }, [hold]: { x: 3, y: 2 } }, 300, easeInOut));
}

export const clingPirate = {
    character: 'pirate',
    room: { left: 40, right: 40, up: 110 },

    async play(c, ctx) {
        const end = c.clock.now + (ctx?.data?.for ?? 3000);
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); c.feet({ left: null, right: null }, 1).catch(() => {}); });
        c.also({ wide: 0.6, squint: 0, grin: 0.2, gazeX: 0.2, gazeY: 0.9 }, 200);
        await grip(c, 240);
        for (let turn = 0; c.clock.now < end - 900; turn++) {
            await pull(c, turn);
            await c.tween({ gazeY: turn % 2 ? 0.9 : -0.7, tilt: turn % 2 ? -3 : 3 }, 240, easeInOut);
            await c.wait(140);
        }
        await grip(c, 260);
        await c.tween({ tilt: 0, gazeY: 0.9 }, Math.max(1, end - c.clock.now), easeInOut);
    },
};
