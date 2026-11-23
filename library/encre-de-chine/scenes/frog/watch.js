// The frog watches someone at work, the way a frog watches anything: without
// moving, for a long time. Its eye follows up and down, its throat swells
// once when something is well done, it shuts its eye slowly as if to keep
// what it saw, and at the very end it gives one croak. Three quarters of a
// minute of almost nothing.

import { easing, moves } from 'figurant';

const { easeInOut } = easing;

export const watchFrog = {
    character: 'frog',
    room: { left: 50, right: 50, up: 60 },

    async play(c) {
        const s = c.state, way = s.dir || 1;
        c.onLeave(() => { s.croak = 0; s.tongue = 0; });
        /** A slow look somewhere, held. */
        const look = async (up, hold) => { await c.tween({ gazeX: way, gazeY: up }, 1100, easeInOut); await c.wait(hold); };
        /** The eye shut slowly, and opened as slowly. */
        const doze = async () => { await c.tween({ lid: 0 }, 900, easeInOut); await c.wait(700); await c.tween({ lid: 1 }, 900, easeInOut); };
        /** The throat, once. */
        const swell = async ms => { await c.tween({ croak: 1 }, ms, easeInOut); await c.tween({ croak: 0 }, ms, easeInOut); };

        await look(-0.2, 3200);
        await doze();
        await look(0.4, 4200);
        await look(-0.7, 5200);
        await swell(900);
        await look(-0.3, 4600);
        await doze();
        await look(0.2, 5000);
        await look(-0.5, 5400);
        await swell(700);
        await look(-0.4, 3600);
        // The whole of it is there: one croak, a hop on the spot, and still again.
        await c.tween({ croak: 1 }, 350, easeInOut);
        await moves.hop(c, 10);
        await c.tween({ croak: 0, gazeX: 0, gazeY: 0 }, 1200, easeInOut);
        await moves.blink(c);
    },
};
