// Made for the highlighter: its tap dance. It is a broad one: heavy heel
// digs that shake its whole barrel, a stamp on each foot, a turn of the tip
// from side to side, and a stroke of colour on the floor to underline the
// finish.

import { easing, moves } from 'figurant';

const { easeOut, easeIn, easeInOut } = easing;
const BEAT = 210;

export const tapDanceHighlighter = {
    character: 'highlighter',
    room: { left: 90, right: 90, up: 130 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.mark = 0; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        /** Fists on the hips, elbows out. */
        const akimbo = ms => c.hands({ left: { x: -19, y: 14, angle: 20 }, right: { x: 19, y: 14, angle: 160 } }, ms, easeInOut);
        /** A heel struck out in front, toe up, and brought back with a stamp. */
        const dig = async side => {
            const way = side === 'left' ? -1 : 1;
            c.also({ gazeX: way * 0.8 }, BEAT);
            await c.all(c.feet({ [side]: { x: way * 20, y: 0, pitch: -38 } }, BEAT, easeIn), c.tween({ tilt: -way * 6, crouch: 4 }, BEAT));
            await c.wait(BEAT * 0.5);
            await c.all(c.feet({ [side]: { x: way * 3, y: 9 } }, BEAT * 0.5, easeOut), c.tween({ tilt: 0, crouch: 0 }, BEAT * 0.5));
            await c.all(c.feet({ [side]: { x: 0, y: 0 } }, BEAT * 0.4, easeIn), c.tween({ squash: 0.3 }, BEAT * 0.4, easeIn));
            await c.tween({ squash: 0 }, BEAT * 0.6, easeOut);
        };
        /** Up on both toes, and down. */
        const rise = async () => {
            await c.feet({ left: { x: -5, y: 8, pitch: 60 }, right: { x: 5, y: 8, pitch: 60 } }, BEAT, easeOut);
            await c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, BEAT, easeIn);
        };

        await akimbo(BEAT * 2);
        for (let round = 0; round < 2; round++) { await dig('right'); await dig('left'); await rise(); }
        await dig('right'); await dig('right'); await dig('left'); await dig('left');
        await rise(); await rise();
        // The finish: arms wide, a hop, and the stroke that underlines it.
        await c.hands({ left: null, right: null }, BEAT);
        c.also({ wide: 1, stretch: 1, gazeX: 0 }, BEAT, easeOut);
        await moves.hop(c, 22);
        await c.tween({ mark: 1 }, 480, easeOut);
        await c.wait(BEAT * 4);
        await c.tween({ stretch: 0, wide: 0, mark: 0 }, 480, easeInOut);
        await c.feet({ left: null, right: null }, 1);
        await moves.blink(c);
    },
};
