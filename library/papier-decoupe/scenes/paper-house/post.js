// The paper house gets a letter. A mailbox is put down beside it, flag up: its
// roof jumps, it puffs smoke, walks over, takes the letter out, reads it
// behind half-drawn blinds, tips its roof like a hat (`roof`), chatters with
// its door (`door`), then posts the letter through its own door, shuts it,
// and walks home with a nod.
//
// Stop-motion: every move is a handful of poses a tenth of a second apart
// (`pose`), props and the door change on a cut, and there is a hold between
// two moves. Nothing glides. It never leaves the floor: it only walks.

import { paperMailbox, paperLetter } from '../../props/paper-mailbox.js';

/** One photograph: a tenth of a second. */
const FRAME = 100;
/** An easing that goes in `n` jumps: the paper is moved between two photographs. */
const steps = n => p => Math.min(1, Math.ceil(p * n) / n);
/** Where the mailbox stands, and how far the house walks towards it (character units). */
const BOX = 104, NEAR = 26;
/** The floor, measured from the middle of the house's drawing: hips (34.4) on legs of 28. */
const FLOOR = 62.4;

export const postPaperHouse = {
    character: 'paper-house',
    room: { left: 56, right: 130, up: 150 },
    variants: [{ name: 'left', room: { left: 130, right: 56, up: 150 } }],

    async play(c, { variant }) {
        const s = c.state, k = c.figure.k, side = variant === 'left' ? -1 : 1, hand = side < 0 ? 'left' : 'right';
        c.onLeave(() => { s.roof = 0; s.door = 0; s.smoke = 0; });
        const pose = (to, n = 1) => c.tween(to, n * FRAME, steps(n));
        const hold = n => c.wait(n * FRAME);
        const reach = (target, n) => c.hands({ [hand]: target }, n * FRAME, steps(n));
        const walk = async (x, n) => {
            s.dir = x * k > s.x ? 1 : -1; s.walk = 1;
            await pose({ x: x * k }, n);
            s.walk = 0; s.phase = 0;
        };

        // A hand puts the mailbox down: there on a cut, it rocks and settles.
        // A letter peeps out of it (put down first, so the box covers half of it).
        const peeping = c.prop(paperLetter, { x: (BOX - 21) * side, y: -42, state: { tilt: -7 * side } });
        const box = c.prop(paperMailbox, { x: BOX * side, y: -5, state: { flip: side } });
        const drop = y => { box.state.y = y * k; peeping.state.y = (y - 37) * k; };
        await hold(1); drop(0);
        await hold(1); drop(-2);
        await hold(1); drop(0);
        // Mail! The roof jumps and the door falls open; then it puffs with joy.
        await pose({ wide: 1, gazeX: side }, 2);
        await hold(4);
        await pose({ wide: 0 }, 2);
        s.smoke = 1;
        await hold(4);

        // Over to the box, and a hand into it.
        await walk(NEAR * side, 4);
        await hold(2);
        await reach({ x: (BOX - NEAR - 19) * side, y: FLOOR - 43, angle: 90 * side }, 4);
        await hold(2);
        // The letter comes out on a cut; the box rocks as it lets go.
        peeping.state.draw = 0;
        const letter = c.give(hand, paperLetter);
        box.state.tilt = 5 * side; await hold(1);
        box.state.tilt = 0;
        await reach({ x: 56 * side, y: -4, angle: 140 * side }, 4);
        s.smoke = 0;

        // It reads, blinds half down.
        await pose({ gazeY: -0.5, squint: 0.7 }, 2);
        await hold(10);
        // Good news: the roof jumps, then it tips it like a hat and chatters.
        await pose({ squint: 0, gazeY: 0, wide: 1 });
        await hold(2);
        await pose({ wide: 0, roof: 1 }, 4);
        s.smoke = 1;
        await hold(3);
        for (let word = 0; word < 3; word++) {
            s.door = 1; await hold(2);
            s.door = word === 1 ? 0.5 : 0; await hold(1);
        }
        s.door = 0;
        await pose({ roof: 0 }, 3);
        await hold(2);

        // It posts the letter through its own door, and shuts it.
        await pose({ gazeX: 0, gazeY: 0.8 });
        s.door = 1;
        await hold(1);
        await reach({ x: 7 * side, y: 30, angle: -90 * side }, 4);
        await hold(1);
        letter.state.draw = 0;
        await hold(2);
        await reach(null, 3);
        s.door = 0;
        await pose({ gazeY: 0 });
        await hold(3);

        // Home, a nod, and the blinds blink once.
        await walk(0, 4);
        await hold(2);
        await pose({ tilt: 7 * side }, 2);
        await hold(2);
        await pose({ tilt: 0 }, 2);
        s.smoke = 0;
        s.lid = 0; await hold(2);
        s.lid = 1; await hold(6);
    },
};
