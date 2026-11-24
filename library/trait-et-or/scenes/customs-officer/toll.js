// The customs officer takes its due: a hand held out, palm up, before the
// other has said a word. A coin lands in it (`data.lands`: how long after
// the start): the hand gives under it, the eyes go to it, to the newcomer, to
// it again. Into the pocket, a line in the book, and through you go.

import { easing, props } from 'figurant';

const { easeOut, easeInOut } = easing;
const { notebook } = props;

export const tollCustomsOfficer = {
    character: 'customs-officer',
    room: { left: 60, right: 60, up: 110 },

    async play(c, ctx) {
        const s = c.state, way = s.dir, start = c.clock.now, lands = ctx?.data?.lands ?? 1500;
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        c.give('right', notebook, { tilt: way * 12, state: { draw: 1 } });
        c.also({ gazeX: way, gazeY: 0 }, 200);
        await c.hands({ right: { x: -way * 12, y: 6, angle: 30 }, left: { x: way * 24, y: -2, angle: 190 } }, 420, easeInOut);
        await c.wait(Math.max(0, lands - (c.clock.now - start)));
        await c.hands({ left: { x: way * 24, y: 2 } }, 90, easeOut);
        await c.all(c.hands({ left: { x: way * 14, y: -8 } }, 300, easeInOut), c.tween({ gazeX: way * 0.4, gazeY: 0.7 }, 300));
        await c.wait(240);
        await c.tween({ gazeX: way, gazeY: 0 }, 200);
        await c.wait(240);
        await c.tween({ gazeX: way * 0.4, gazeY: 0.7 }, 200);
        await c.hands({ left: { x: way * 3, y: 14 } }, 340, easeInOut);
        await c.all(c.hands({ left: { x: -way * 6, y: 2 } }, 300, easeInOut), c.tween({ gazeX: -way * 0.3, gazeY: 0.6 }, 300));
        for (let line = 0; line < 3; line++) { await c.hands({ left: { x: -way * 9, y: 3 } }, 140); await c.hands({ left: { x: -way * 5, y: 3 } }, 140); }
        // Through you go: an arm towards the town.
        await c.all(c.hands({ left: { x: -way * 20, y: -14, angle: -20 } }, 360, easeInOut), c.tween({ gazeX: way, gazeY: 0, tilt: -way * 4 }, 360));
        await c.wait(900);
        await c.all(c.hands({ left: null }, 400), c.tween({ tilt: 0, gazeX: -way }, 400));
    },
};
