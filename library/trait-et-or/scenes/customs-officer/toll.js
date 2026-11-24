// Made for the customs officer: the toll. It stands at its post on the quay,
// book under its arm, and comes into the picture with the quay, which it
// does not leave. It watches the arrival without a word, holds out a hand
// before the newcomer has said anything, catches the coin, looks at it
// twice, puts it away, writes a line, and waves the stranger through. It
// keeps the time and the distances of the one it waits for
// (../pirate/landfall.js): `data.out` is how far out of the picture it starts.

import { easing, moves, props } from 'figurant';
import { T } from '../pirate/landfall.js';

const { easeOut, easeInOut } = easing;
const { notebook } = props;

export const tollCustomsOfficer = {
    character: 'customs-officer',
    room: { left: 60, right: 60, up: 110 },

    async play(c, ctx) {
        const s = c.state, way = -1, palm = 'left', other = 'right', post = s.x - (ctx?.data?.out ?? 0) * c.figure.k;
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        c.onLeave(() => { c.hands({ left: null, right: null }, 1).catch(() => {}); });
        s.dir = way;
        const book = c.give(other, notebook, { tilt: way * 12, state: { draw: 1 } });
        await c.hands({ [other]: { x: -way * 12, y: 6, angle: 30 } }, 300);

        // It comes into the picture with the quay: it is the quay that moves, at the pace the boat comes in.
        await at(T.quay);
        await c.all(c.tween({ x: post }, T.land - T.quay, easeOut), c.tween({ gazeX: way, gazeY: -0.2 }, 600, easeInOut));
        // The boat goes down under the stranger's feet: one look lower, eyes wide, a blink.
        await at(T.land + 300);
        c.also({ wide: 0.8, gazeY: 0.5 }, 150);
        await c.wait(800);
        await moves.blink(c);
        await c.tween({ wide: 0, gazeY: 0 }, 300);

        // The hand held out, palm up, before the other has said a word.
        await at(T.meet - 500);
        await c.hands({ [palm]: { x: way * 24, y: -2, angle: 190 } }, 420, easeInOut);
        // The coin lands: the hand gives under it, the eyes go to it, then to the newcomer, then to it again.
        await at(T.coin + 520);
        await c.hands({ [palm]: { x: way * 24, y: 2 } }, 90, easeOut);
        await c.all(c.hands({ [palm]: { x: way * 14, y: -8 } }, 300, easeInOut), c.tween({ gazeX: way * 0.4, gazeY: 0.7 }, 300));
        await c.wait(260);
        await c.tween({ gazeX: way, gazeY: 0 }, 200);
        await c.wait(260);
        await c.tween({ gazeX: way * 0.4, gazeY: 0.7 }, 200);
        // Into the pocket; a line in the book; and through you go.
        await at(T.hat + 200);
        await c.hands({ [palm]: { x: way * 3, y: 14 } }, 360, easeInOut);
        await c.all(c.hands({ [palm]: { x: -way * 6, y: 2 } }, 320, easeInOut), c.tween({ gazeX: -way * 0.3, gazeY: 0.6 }, 320));
        for (let line = 0; line < 3; line++) { await c.hands({ [palm]: { x: -way * 9, y: 3 } }, 140); await c.hands({ [palm]: { x: -way * 5, y: 3 } }, 140); }
        await c.all(c.hands({ [palm]: { x: -way * 20, y: -14, angle: -20 } }, 380, easeInOut), c.tween({ gazeX: way, gazeY: 0, tilt: -way * 4 }, 380));
        await c.wait(1500);
        await c.all(c.hands({ [palm]: null }, 400), c.tween({ tilt: 0 }, 400));
        // And it watches the stranger go into town.
        await c.tween({ gazeX: -way }, 900, easeInOut);
        await c.wait(3200);
        await c.tween({ gazeX: 0 }, 500);
    },
};
