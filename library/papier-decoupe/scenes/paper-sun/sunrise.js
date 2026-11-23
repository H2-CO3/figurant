// The paper sun sets and rises again. A hill is put down beside it; it walks
// behind the hilltop, sinks, shuts its eyes (its rays droop and stop turning:
// night). Then it peeps over the hill, climbs back up, throws its arms open,
// shines (`shine`: rays out, sparks), turns its rays a quarter (`spin`),
// leans to warm the tree, and walks home.
//
// Stop-motion: every move is a handful of poses a tenth of a second apart
// (`pose`), a prop changes on a cut, and there is a hold between two moves.
// Nothing glides. It never leaves the floor: it only walks and bends its legs.

import { paperHill } from '../../props/paper-hill.js';

/** One photograph: a tenth of a second. */
const FRAME = 100;
/** An easing that goes in `n` jumps: the paper is moved between two photographs. */
const steps = n => p => Math.min(1, Math.ceil(p * n) / n);
/** How far the hilltop is from where the sun stands, in character units. */
const HILL = 118;

export const sunrisePaperSun = {
    character: 'paper-sun',
    room: { left: 68, right: 198, up: 150 },
    variants: [{ name: 'left', room: { left: 198, right: 68, up: 150 } }],

    async play(c, { variant }) {
        const s = c.state, k = c.figure.k, side = variant === 'left' ? -1 : 1;
        c.onLeave(() => { s.spin = 0; s.shine = 0; s.horizon = 0; });
        /** Goes to a pose in `n` photographs. */
        const pose = (to, n = 1) => c.tween(to, n * FRAME, steps(n));
        const hold = n => c.wait(n * FRAME);
        /** Walks to x (character units from its place) in `n` photographs. */
        const walk = async (x, n) => {
            s.dir = x * k > s.x ? 1 : -1; s.walk = 1;
            await pose({ x: x * k }, n);
            s.walk = 0; s.phase = 0;
        };

        // A hand puts the hill down: there on a cut, a little too high, then pressed flat.
        const hill = c.prop(paperHill, { x: HILL * side, y: -5, state: { flip: side } });
        await hold(1); hill.state.y = 0;
        await hold(1); hill.state.y = -2 * k;
        await hold(1); hill.state.y = 0;
        // The sun has seen it: its rays jump out, the front ones a moment later.
        await pose({ wide: 1, gazeX: side }, 2);
        await hold(4);
        await pose({ wide: 0 }, 2);
        await hold(2);

        // It walks behind the hill…
        await walk(HILL * side, 12);
        await pose({ gazeX: 0 });
        await hold(2);
        // … and sets: down behind the hilltop, then its eyes shut and its rays droop.
        // Its hands go to its sides (an arm must not hang under the floor), and
        // the floor cuts its rays: a sun going down.
        s.horizon = 1;
        c.hands({ left: { x: -35, y: 15, angle: 0 }, right: { x: 35, y: 15, angle: 0 } }, 3 * FRAME, steps(3)).catch(() => {});
        await pose({ crouch: 30, gazeY: 0.7 }, 5);
        await hold(1);
        await pose({ lid: 0 }, 3);
        await hold(9);

        // Morning. It peeps over the hill, one way, the other.
        await pose({ lid: 1, gazeY: 0 }, 3);
        await pose({ crouch: 15 }, 2);
        await pose({ gazeX: -side });
        await hold(3);
        await pose({ gazeX: side });
        await hold(3);
        await pose({ gazeX: 0 });
        // It rises, arms thrown open, and shines.
        c.hands({ left: null, right: null }, 4 * FRAME, steps(4)).catch(() => {});
        await pose({ crouch: 0 }, 5);
        s.horizon = 0;
        await pose({ stretch: 1, wide: 1 }, 2);
        await hold(2);
        await pose({ shine: 1, wide: 0 }, 4);
        await pose({ spin: 90 }, 9);
        await hold(3);
        await pose({ spin: 45 }, 5);
        await hold(2);

        // It leans over the tree to warm it: two pulses of light, each on a cut.
        await pose({ tilt: -9 * side, stretch: 0, gazeX: -side, gazeY: 0.4 }, 3);
        for (let pulse = 0; pulse < 2; pulse++) {
            s.shine = 0.4; await hold(2);
            s.shine = 1; await hold(3);
        }
        await pose({ shine: 0, tilt: 0, gazeY: 0 }, 4);
        await pose({ spin: 0 }, 4);
        await hold(2);

        // Home again, and a blink (the rays dip with it).
        await walk(0, 12);
        await pose({ gazeX: 0 });
        await hold(2);
        s.lid = 0; await hold(2);
        s.lid = 1; await hold(7);
    },
};
