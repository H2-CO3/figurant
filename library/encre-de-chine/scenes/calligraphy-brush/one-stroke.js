// The calligraphy brush writes "one": the single horizontal stroke. An
// inkstone appears beside it; it leans over, lowers its tuft into the pool
// and takes its time loading; it carries the ink a few steps away (a drop may
// fall on the way), turns, lays the tuft on the paper with one short press,
// and walks the stroke back to where it stood. Then it lifts, and looks at
// what is there. About fourteen and a half seconds.
//
// Unhurried: one gesture at a time, long eases, long holds. The only quick
// thing is the press that starts the stroke.

import { easing, moves } from 'figurant';
import { inkstone } from '../../props/inkstone.js';

const { easeInOut, easeOut, linear } = easing;
/** Where the stone sits, and what brings the tip into its pool: a lean, and the body lowered. */
const STONE = 38, LEAN = 23, DIP = 7.5;
/** How far the feet must be sent back for them not to slide while it leans (its hips are 16 below its middle). */
const SHIFT = 16 * Math.sin(LEAN * Math.PI / 180);
/** How low the body goes for the tuft to lie on the paper, and where the stroke starts. */
const LAID = 10, FAR = 72;

export const oneStrokeCalligraphyBrush = {
    character: 'calligraphy-brush',
    room: { left: 100, right: 75, up: 150 },
    variants: [{ name: 'left', room: { left: 75, right: 100, up: 150 } }],

    async play(c, { variant }) {
        const s = c.state, k = c.figure.k, side = variant === 'left' ? -1 : 1, home = s.x, rest = s.ink;
        c.onLeave(() => { s.mark = 0; s.ink = rest; });

        // The stone comes; the tuft turns to it.
        const stone = c.prop(inkstone, { x: home / k + side * STONE, state: { draw: 0, flip: side } });
        c.animate(stone.state, { draw: 1 }, 1260).catch(() => {});
        await c.wait(210);
        await c.tween({ gazeX: side, gazeY: 0.3 }, 840, easeInOut);
        await c.wait(210);

        // It leans over the stone and lowers its tuft into the pool. Its feet stay where they are.
        await c.all(
            c.tween({ tilt: -side * LEAN, crouch: DIP }, 1050, easeInOut),
            c.feet({ left: { x: -5 - side * SHIFT, y: 0 }, right: { x: 5 - side * SHIFT, y: 0 } }, 1050, easeInOut),
        );
        await c.wait(210);
        // Loading: the ink climbs the hair while the tip turns once in the pool.
        c.also({ ink: 1 }, 1050, easeInOut);
        await c.tween({ gazeX: side * 0.72 }, 525, easeInOut);
        await c.tween({ gazeX: side }, 525, easeInOut);
        await c.wait(210);
        await c.all(
            c.tween({ tilt: 0, crouch: 0, gazeX: 0, gazeY: 0 }, 1050, easeInOut),
            c.feet({ left: { x: -5, y: 0 }, right: { x: 5, y: 0 } }, 1050, easeInOut),
        );
        await c.feet({ left: null, right: null }, 120);

        // It carries the ink away from the stone, and turns.
        await moves.walkTo(c, home - side * FAR * k, 0.9);
        s.dir = side;
        await c.tween({ gazeX: 0 }, 420, easeInOut);

        // The tuft comes down to the paper. One short press: the head of the stroke.
        s.mark = 1;
        await c.tween({ crouch: LAID - 2 }, 840, easeInOut);
        await c.tween({ crouch: LAID + 2 }, 110, easeOut);
        await c.wait(315);
        // The stroke, walked back at one even pace; the brush runs dry as it goes.
        c.animate(s, { ink: 0.34 }, 2400, linear).catch(() => {});
        c.also({ crouch: LAID }, 420, easeInOut);
        await moves.walkTo(c, home, 0.24);
        // The stop: it presses once more, then lifts.
        await c.tween({ crouch: LAID + 1.5 }, 315, easeInOut);
        await c.tween({ crouch: 0 }, 1050, easeInOut);
        await c.wait(210);

        // It looks back along what it wrote. Stillness.
        await c.tween({ gazeX: -side, gazeY: 0.5 }, 840, easeInOut);
        await c.wait(1050);

        // The paper drinks the ink; the stone goes. It is home: the stroke ended where it began.
        c.animate(stone.state, { draw: 0 }, 1050).catch(() => {});
        c.also({ gazeX: 0, gazeY: 0 }, 840, easeInOut);
        await c.tween({ mark: 0 }, 1050, easeInOut);
    },
};
