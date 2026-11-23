// The cloud has a shower. It swells, rises a little, rains; a flash startles
// it; it wrings itself out and smiles.

import { easing, moves } from 'figurant';

const { easeInOut, easeOutBack } = easing;

export const showerCloud = {
    character: 'cloud',
    room: { left: 60, right: 60, up: 120 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.rain = 0; });
        // It swells…
        c.also({ squint: 0.6 }, 300);
        await c.tween({ squash: -0.5, crouch: 0 }, 520, easeInOut);
        // … and rains.
        await c.tween({ rain: 1, gazeY: 0.8 }, 420);
        await c.wait(1680);
        // A flash: it jumps.
        c.also({ squint: 0, wide: 1, gazeY: 0 }, 80);
        await moves.hop(c, 16);
        await c.wait(420);
        c.also({ wide: 0 }, 300);
        // It wrings itself out, and the rain stops.
        await c.tween({ squash: 0.7, rain: 0 }, 420, easeInOut);
        await c.tween({ squash: 0 }, 420, easeOutBack);
        await moves.blink(c);
        await c.wait(1260);
    },
};
