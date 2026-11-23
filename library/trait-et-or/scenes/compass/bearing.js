// The compass takes a bearing. A globe is set beside it; it looks at it and
// lays a hand on it; its needle makes one slow full turn, quivers, and comes
// to rest; then it points the way with its needle and its arm, and holds.

import { easing, moves } from 'figurant';
import { globe, GLOBE } from '../../props/globe.js';

const { easeInOut } = easing;
/** One beat: every duration is a multiple of it. */
const BEAT = 420;
/** Where the globe stands, from the compass's feet. */
const GLOBE_X = 82;
/** The floor, in the compass's own units (its hips and its legs). */
const FLOOR = 36.7 + 38;

export const bearingCompass = {
    character: 'compass',
    room: { left: 95, right: 120, up: 150 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.bearing = 0; });

        // A look: the globe is traced, and the needle turns to it.
        const sphere = c.prop(globe, { x: GLOBE_X, y: 0, state: { draw: 0 } });
        c.also({ gazeX: 1, gazeY: 0.3 }, BEAT * 2, easeInOut);
        await c.animate(sphere.state, { draw: 1 }, BEAT * 2, easeInOut);
        await c.wait(BEAT * 2);

        // A gesture: a hand on the globe, and the needle goes once round the dial.
        // (The hand's stroke, 7 long, ends on the sphere.)
        const lean = 70 * Math.PI / 180;
        await c.hands({ right: { x: GLOBE_X - GLOBE.r * 0.82 - 7 * Math.sin(lean), y: FLOOR - GLOBE.height - GLOBE.r * 0.57 - 7 * Math.cos(lean), angle: 70 } }, BEAT * 2, easeInOut);
        await c.wait(BEAT);
        c.also({ gazeX: 0, gazeY: 0 }, BEAT * 6, easeInOut);
        await c.tween({ bearing: 360 }, BEAT * 6, easeInOut);
        s.bearing = 0;
        // It quivers on its pivot, then comes to rest.
        await c.tween({ wide: 0.6 }, BEAT, easeInOut);
        await c.tween({ wide: 0 }, BEAT * 2, easeInOut);
        await c.wait(BEAT * 2);

        // A hold: the way is that one. Needle and arm point together.
        c.also({ gazeX: -1, gazeY: -0.1, tilt: -3 }, BEAT * 2, easeInOut);
        await c.hands({ right: null, left: { x: -82, y: -8, angle: -100 } }, BEAT * 2, easeInOut);
        await c.wait(BEAT * 4);

        // Back to rest; the globe is put away.
        c.also({ gazeX: 0, gazeY: 0, tilt: 0 }, BEAT * 2, easeInOut);
        await c.all(c.hands({ left: null }, BEAT * 2, easeInOut), c.animate(sphere.state, { draw: 0 }, BEAT * 2, easeInOut));
        await moves.blink(c);
        await c.wait(BEAT * 2);
    },
};
