// Made for the stick figure: a tap dance. (A foot on its toe is held up by its own
// length: at pitch 55 the heel is 7 units above the floor, or the toe would go through it.)
// Shuffles (the toe brushes forward
// and back), a ball change from one foot to the other, a travelling step to
// each side, heel digs, and a finish on one knee's bend with the arms wide.
// Everything is on a beat; the feet are placed, never slid.

import { easing, moves } from 'figurant';

const { easeOut, easeIn, easeInOut } = easing;
const BEAT = 190;
const other = side => (side === 'left' ? 'right' : 'left');

export const tapDanceStickman = {
    character: 'stickman',
    room: { left: 95, right: 95, up: 130 },

    async play(c) {
        const beat = n => BEAT * n;
        c.onLeave(() => { c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        // Arms: out to the sides, loose, swinging against the feet.
        const arms = (lean, ms = beat(1)) => c.hands({ left: { x: -30 - lean, y: -6 + lean * 0.4, angle: 200 }, right: { x: 30 - lean, y: -6 - lean * 0.4, angle: -20 } }, ms, easeInOut);
        /** A shuffle: the toe brushes the floor going forward, and again coming back. */
        const shuffle = async side => {
            const way = side === 'left' ? -1 : 1;
            await c.feet({ [side]: { x: way * 4, y: 9, pitch: 20 } }, beat(0.5), easeOut);       // lifted
            await c.feet({ [side]: { x: way * 15, y: 7, pitch: 55 } }, beat(0.25), easeIn);       // brush forward: the toe taps
            await c.feet({ [side]: { x: way * 17, y: 11, pitch: 25 } }, beat(0.25), easeOut);
            await c.feet({ [side]: { x: way * 6, y: 7, pitch: 55 } }, beat(0.25), easeIn);        // brush back: the toe taps
            await c.feet({ [side]: { x: way * 3, y: 10, pitch: 20 } }, beat(0.25), easeOut);
        };
        /** A ball change: onto the ball of one foot behind, back onto the other. */
        const ballChange = async side => {
            const way = side === 'left' ? -1 : 1;
            await c.all(c.feet({ [side]: { x: -way * 3, y: 8, pitch: 70 } }, beat(0.5), easeIn), c.tween({ crouch: 3, tilt: way * 3 }, beat(0.5)));
            await c.all(c.feet({ [other(side)]: { x: way * 2, y: 6 } }, beat(0.25), easeOut), c.tween({ crouch: 0 }, beat(0.25)));
            await c.all(c.feet({ [other(side)]: { x: 0, y: 0 } }, beat(0.25), easeIn), c.tween({ tilt: 0 }, beat(0.25)));
            await c.feet({ [side]: { x: 0, y: 0 } }, beat(0.5), easeInOut);
        };
        /** A heel dig: the heel strikes out in front, toe up. */
        const dig = async side => {
            const way = side === 'left' ? -1 : 1;
            await c.all(c.feet({ [side]: { x: way * 18, y: 0, pitch: -35 } }, beat(0.5), easeIn), c.tween({ tilt: -way * 4, crouch: 2 }, beat(0.5)));
            await c.wait(beat(0.5));
            await c.all(c.feet({ [side]: { x: 0, y: 0 } }, beat(0.5), easeInOut), c.tween({ tilt: 0, crouch: 0 }, beat(0.5)));
        };
        /** Three quick steps to one side, on the toes. */
        const travel = async way => {
            for (let step = 0; step < 3; step++) {
                const side = (step % 2 === 0) === (way > 0) ? 'right' : 'left';
                await c.all(c.feet({ [side]: { x: way * 8, y: 7, pitch: 30 } }, beat(0.25), easeOut), c.tween({ x: c.state.x + way * 9 * c.figure.k, tilt: way * 3 }, beat(0.5), easeInOut));
                await c.feet({ [side]: { x: 0, y: 0 } }, beat(0.25), easeIn);
            }
            await c.tween({ tilt: 0 }, beat(0.5));
        };

        // Ready: a look, the arms come out.
        await moves.glance(c, 0, 0.3, beat(1));
        await arms(0, beat(1.5));

        // The time step, twice: shuffle, ball change, on each foot.
        for (let round = 0; round < 2; round++) {
            for (const side of ['right', 'left']) {
                c.also({ gazeX: side === 'left' ? -0.5 : 0.5 }, beat(1));
                await c.all(shuffle(side), arms(side === 'left' ? -6 : 6, beat(1.5)));
                await ballChange(side);
            }
        }

        // Across the floor and back, then the heels.
        await c.all(travel(1), arms(8, beat(1.5)));
        await c.all(travel(-1), arms(-8, beat(1.5)));
        await c.all(travel(-1), arms(-8, beat(1.5)));
        await c.all(travel(1), arms(8, beat(1.5)));
        await arms(0, beat(0.5));
        await dig('right');
        await dig('left');
        await dig('right');

        // The finish: a hop, landing wide, arms up, held.
        await c.feet({ left: null, right: null }, beat(0.5));
        await c.hands({ left: null, right: null }, beat(0.5));
        await moves.hop(c, 22);
        await c.all(c.feet({ left: { x: -12, y: 0 }, right: { x: 14, y: 0, pitch: -30 } }, beat(0.5), easeOut), c.tween({ stretch: 1, crouch: 4, wide: 1 }, beat(0.5), easeOut));
        await c.wait(beat(5));
        await c.all(c.tween({ stretch: 0, crouch: 0, wide: 0, gazeX: 0 }, beat(1.5), easeInOut), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, beat(1.5), easeInOut));
        await c.feet({ left: null, right: null }, 1);
        await moves.blink(c);
        await c.wait(beat(3));
    },
};
