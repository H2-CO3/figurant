// The scales weigh. A set of weights is set beside them, with one place
// empty; they bend, take the missing weight by its knob and lay it in their
// left pan, which sinks; a hand on the other pan brings the beam level, and
// they hold the balance. The weight goes back to its place, and the beam
// rocks once, slowly, before it rests.

import { easing, moves } from 'figurant';
import { panAt } from '../../characters/balance.js';
import { weights, weight, CASE, WEIGHT } from '../../props/weights.js';

const { easeInOut } = easing;
/** One beat: every duration is a multiple of it. */
const BEAT = 420;
/** Where the case of weights stands, from the scales' feet. */
const CASE_X = -54;
/** The floor, in the scales' own units (hips and legs), and how far they bend to reach the case. */
const FLOOR = 44 + 38, BEND = 12;
/** The length of the hand's stroke: what it holds is at its end. */
const HAND = 7;

export const weighBalance = {
    character: 'balance',
    room: { left: 95, right: 75, up: 160 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.tip = 0; });
        // A hand holding the weight by its knob, the weight standing in the left pan:
        // the hand's stroke (HAND long) comes from the inside and ends on the knob.
        const inPan = tip => { const [x, y] = panAt(-1, tip); return { x: x + HAND, y: y - WEIGHT, angle: -90 }; };
        // The same hand over the weight's place on the case, once the body has bent: from above.
        const onCase = { x: CASE_X + CASE.place, y: FLOOR - BEND - CASE.height - WEIGHT - HAND, angle: 0 };

        // A look: the case is traced, and the beam leans towards it.
        const set = c.prop(weights, { x: CASE_X, y: 0, state: { draw: 0 } });
        c.also({ gazeX: -1, gazeY: 0.4 }, BEAT * 2, easeInOut);
        await c.animate(set.state, { draw: 1 }, BEAT * 2, easeInOut);
        await c.wait(BEAT);

        // It bends and takes the missing weight.
        await c.all(c.tween({ crouch: BEND }, BEAT * 2, easeInOut), c.hands({ left: onCase }, BEAT * 2, easeInOut));
        const held = c.give('left', weight, { state: { draw: 0 } });
        await c.animate(held.state, { draw: 1 }, BEAT, easeInOut);

        // Into the left pan, which sinks under it.
        c.also({ gazeX: 0, gazeY: 0 }, BEAT * 2, easeInOut);
        await c.all(c.tween({ crouch: 0 }, BEAT * 2, easeInOut), c.hands({ left: inPan(0) }, BEAT * 2, easeInOut));
        c.also({ wide: 0.35 }, BEAT, easeInOut);
        await c.all(c.tween({ tip: -1 }, BEAT * 2, easeInOut), c.hands({ left: inPan(-1) }, BEAT * 2, easeInOut));
        c.also({ wide: 0 }, BEAT * 2, easeInOut);
        await c.wait(BEAT);

        // The other hand on the other pan: the beam comes level. Held.
        const press = tip => { const [x, y] = panAt(1, tip); return { x: x - HAND, y: y - 2, angle: 90 }; };
        await c.hands({ right: press(-1) }, BEAT * 2, easeInOut);
        await c.all(c.tween({ tip: 0 }, BEAT * 2, easeInOut), c.hands({ left: inPan(0), right: press(0) }, BEAT * 2, easeInOut));
        await c.wait(BEAT * 3);

        // The weight goes back to its place.
        c.also({ gazeX: -1, gazeY: 0.4 }, BEAT * 2, easeInOut);
        await c.all(c.tween({ crouch: BEND }, BEAT * 2, easeInOut), c.hands({ left: onCase, right: null }, BEAT * 2, easeInOut));
        await c.animate(held.state, { draw: 0 }, BEAT, easeInOut);
        c.also({ gazeX: 0, gazeY: 0 }, BEAT * 2, easeInOut);
        await c.all(c.tween({ crouch: 0 }, BEAT * 2, easeInOut), c.hands({ left: null }, BEAT * 2, easeInOut));

        // The flourish: the beam rocks once each way, slowly, and rests.
        await c.tween({ tip: 0.7 }, BEAT * 2, easeInOut);
        await c.tween({ tip: -0.7 }, BEAT * 2, easeInOut);
        await c.tween({ tip: 0 }, BEAT * 2, easeInOut);
        await moves.blink(c);
        await c.wait(BEAT * 2);
    },
};
