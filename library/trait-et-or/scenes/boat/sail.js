// The boat sails on: the wind in its sails, foam at its stern. `data.by`: how
// far it goes (character units, to the right), `data.over`: in how long;
// `data.sunk`: how full of water it is when it gets there (it keeps what it
// has when nothing is said). Alone, it sails on the spot.

import { easing } from 'figurant';
import { effects } from '../../../common/effects.js';

const { linear, easeInOut } = easing;

export const sailBoat = {
    character: 'boat',
    room: { left: 75, right: 80, up: 130 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, fx = ctx?.api?.fx ?? null;
        const { by = 0, over = 4000, sunk = s.sunk } = ctx?.data ?? {};
        let sailing = true;
        c.onLeave(() => { sailing = false; });
        // Foam trails from the stern for as long as it makes way.
        (async () => {
            while (sailing && c.alive) {
                if (fx) effects.wake.play(fx, [c.figure.points.centre[0] - 52 * k, c.figure.points.ground - 3 * k], { k });
                await c.clock.wait(240);
            }
        })();
        c.also({ wind: 0.8, swell: 0.2, gazeX: 1 }, 700, easeInOut);
        await c.tween({ x: s.x + by * k, sunk }, over, linear);
        sailing = false;
        await c.tween({ wind: 0.35, gazeX: 0 }, 500, easeInOut);
    },
};
