// The boat sets sail. Its mainsail is down; it goes up in three pulls, the
// wind comes, the boat heels and holds its course a while; then the wind
// drops and it sits upright again. Measured: every duration is a multiple of
// one beat. It stays where it is (a scene moves it along).

import { easing } from 'figurant';

const { easeInOut } = easing;
const BEAT = 420;

export const setSailBoat = {
    character: 'boat',
    room: { left: 75, right: 80, up: 130 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.furl = 0; s.wind = 0.35; });

        // At anchor: no wind, the sail on its boom.
        await c.tween({ furl: 1, wind: 0 }, BEAT * 2, easeInOut);
        await c.wait(BEAT * 2);
        // Three pulls on the halyard, a breath between each.
        for (const furl of [0.66, 0.33, 0]) {
            await c.tween({ furl }, BEAT, easeInOut);
            await c.wait(BEAT);
        }
        // The wind comes: the pennant turns to the bow, the sails fill, the boat heels.
        c.also({ gazeX: 1 }, BEAT * 2, easeInOut);
        await c.tween({ wind: 1 }, BEAT * 4, easeInOut);
        await c.wait(BEAT * 6);
        // A gust it did not expect: the sails shiver, then draw again.
        await c.tween({ wide: 0.8 }, BEAT, easeInOut);
        await c.tween({ wide: 0 }, BEAT * 2, easeInOut);
        await c.wait(BEAT * 2);
        // The wind drops.
        c.also({ gazeX: 0 }, BEAT * 4, easeInOut);
        await c.tween({ wind: 0.35 }, BEAT * 4, easeInOut);
        await c.wait(BEAT * 2);
    },
};
