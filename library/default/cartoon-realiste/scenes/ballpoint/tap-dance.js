// Made for the ballpoint pen: its tap dance. It is thin and quick: tiny fast
// taps on the toes, a slide to each side on one foot, a scribble of ink left
// on the floor at the end. Its body is a barrel: it leans, it never bends.

import { easing, moves } from 'figurant';

const { easeOut, easeIn, easeInOut } = easing;
const BEAT = 150;

export const tapDanceBallpoint = {
    character: 'ballpoint',
    room: { left: 90, right: 90, up: 130 },

    async play(c) {
        const s = c.state, k = c.figure.k, home = s.x;
        c.onLeave(() => { s.mark = 0; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        const arms = (lean, ms = BEAT * 2) => c.hands({ left: { x: -24 - lean, y: -4 + lean * 0.5, angle: 200 }, right: { x: 24 - lean, y: -4 - lean * 0.5, angle: -20 } }, ms, easeInOut);
        /** One toe, struck twice, very fast. */
        const patter = async side => {
            const way = side === 'left' ? -1 : 1;
            for (let tap = 0; tap < 2; tap++) {
                await c.feet({ [side]: { x: way * 8, y: 9, pitch: 30 } }, BEAT * 0.5, easeOut);
                await c.feet({ [side]: { x: way * 9, y: 7, pitch: 55 } }, BEAT * 0.5, easeIn);
            }
            await c.feet({ [side]: { x: 0, y: 0 } }, BEAT, easeInOut);
        };
        /** A slide on one foot, the other held out, the barrel leaning into it. */
        const slide = async way => {
            const lifted = way > 0 ? 'left' : 'right';
            await c.all(c.feet({ [lifted]: { x: -way * 16, y: 12, pitch: 20 } }, BEAT, easeOut), c.tween({ tilt: way * 12 }, BEAT, easeOut));
            await c.tween({ x: s.x + way * 34 * k }, BEAT * 3, easeOut);
            await c.all(c.feet({ [lifted]: { x: 0, y: 0 } }, BEAT, easeIn), c.tween({ tilt: 0 }, BEAT));
        };

        await arms(0, BEAT * 2);
        for (let round = 0; round < 3; round++) {
            c.also({ gazeX: round % 2 ? -0.7 : 0.7 }, BEAT * 2);
            await c.all(patter(round % 2 ? 'left' : 'right'), arms(round % 2 ? -7 : 7, BEAT * 3));
        }
        await slide(1); await patter('right');
        await slide(-1); await slide(-1); await patter('left');
        await slide(1);
        // The finish: a hop, and a flourish of ink behind it.
        await c.all(c.hands({ left: null, right: null }, BEAT), c.tween({ x: home, gazeX: 0 }, BEAT * 2));
        c.also({ wide: 1, stretch: 1 }, BEAT, easeOut);
        await moves.hop(c, 24);
        await c.tween({ mark: 1 }, 420, easeOut);
        await c.wait(BEAT * 6);
        await c.tween({ stretch: 0, wide: 0, mark: 0 }, 420, easeInOut);
        await c.feet({ left: null, right: null }, 1);
        await moves.blink(c);
    },
};
