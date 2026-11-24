// The boat takes in water: the wind is gone, it sits lower and lower, air
// comes up around it. `data.to`: how full it ends (0 -> 1, 1: the masthead
// under water), `data.over`: in how long. Alone, it goes half down, and
// comes up again.

import { easing } from 'figurant';
import { effects } from '../../../common/effects.js';

const { linear, easeInOut } = easing;

export const founderBoat = {
    character: 'boat',
    room: { left: 75, right: 80, up: 130 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, fx = ctx?.api?.fx ?? null;
        const alone = ctx?.data?.to === undefined, { to = 0.45, over = 5000 } = ctx?.data ?? {};
        let leaking = true;
        c.onLeave(() => { leaking = false; if (alone) s.sunk = 0; });
        (async () => {
            for (let breath = 0; leaking && c.alive; breath++) {
                const at = [c.figure.points.centre[0] + (breath % 3 - 1) * 26 * k, c.figure.points.ground - 2 * k];
                if (fx) (breath % 4 === 3 ? effects.ripple : effects.bubbles).play(fx, at, { k });
                await c.clock.wait(520);
            }
        })();
        c.also({ wind: 0.05, swell: 0.1, wide: 0.6 }, 900, easeInOut);
        await c.tween({ sunk: to }, over, linear);
        leaking = false;
        if (to >= 1 && fx) effects.ripple.play(fx, [c.figure.points.centre[0] + 14 * k, c.figure.points.ground - 2 * k], { k });
        await c.tween({ wide: 0 }, 400, easeInOut);
        if (alone) { await c.wait(700); await c.tween({ sunk: 0, wind: 0.35, swell: 0.25 }, 1800, easeInOut); }
    },
};
