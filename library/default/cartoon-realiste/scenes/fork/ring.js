// The fork rings. Something taps it: it goes rigid on tiptoe and hums like a
// tuning fork, shivering fast and less and less, tines spread; then the note
// dies away and it shakes itself loose.

import { easing, moves } from 'figurant';

const { easeOut, easeInOut, easeOutBack } = easing;

export const ringFork = {
    character: 'fork',
    room: { left: 60, right: 60, up: 120 },

    async play(c) {
        const s = c.state;
        // It gathers itself, tines pinched…
        c.also({ squint: 1, gazeY: -0.6 }, 200);
        await c.tween({ crouch: 7, squash: 0.4 }, 240, easeInOut);
        await c.wait(160);
        // … ting! Rigid, tall, tines wide open.
        c.also({ squint: 0, wide: 1, gazeY: 0 }, 60, easeOut);
        await c.tween({ crouch: 0, squash: -0.6 }, 80, easeOut);
        // The hum: a fast shiver that dies away.
        for (let i = 0; i < 14; i++) {
            const swing = 7 * (1 - i / 14) ** 1.5;
            await c.tween({ tilt: i % 2 ? -swing : swing }, 55, easeInOut);
        }
        c.also({ wide: 0 }, 500);
        await c.tween({ tilt: 0, squash: 0 }, 420, easeOutBack);
        // It shakes the note off.
        await moves.blink(c);
        await c.tween({ squint: 0.6 }, 160);
        await c.wait(500);
        await c.tween({ squint: 0 }, 300);
        await c.wait(400);
    },
};
