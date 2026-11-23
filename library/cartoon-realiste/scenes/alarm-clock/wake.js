// The alarm clock is caught out by its own alarm. It yawns, jumps onto its
// bedside table, sits on the edge and dozes off while its hands tick on.
// Then it rings: a great start, it leaps down still ringing, hops about in a
// panic, and at last claps both hands on its bells. Silence; a look around,
// as if nobody had noticed.
//
// Written as classic cartoon animation: a crouch before each jump, a stretch
// in the air and a squash on landing, a take when the alarm goes, arms flung
// wide before they clap the bells, and every arrival overshoots and settles.
// Its own parts play: `ring` (hammer, bells, shaking case), `hour` (its
// hands), `mouth` (the yawn), and the bells, which hop and trail.

import { easing, moves } from 'figurant';
import { bedsideTable, BEDSIDE } from '../../props/bedside-table.js';
import { QUARTER_PAST_NINE } from '../../characters/alarm-clock.js';

const { easeIn, easeOut, easeInOut, easeOutBack, easeOutElastic, linear } = easing;

/** Where the table stands, from where the clock starts: clear of its arms. */
const TABLE_X = 104;

export const wakeAlarmClock = {
    character: 'alarm-clock',
    room: { left: 75, right: TABLE_X + 62, up: 215 },

    async play(c) {
        const s = c.state, k = c.figure.k, home = s.x, floor = s.y;
        const reach = c.figure.body.reach;
        const onTable = floor - BEDSIDE * k;
        c.onLeave(() => { s.ring = 0; s.mouth = 0; s.hour = QUARTER_PAST_NINE; });
        /** A jump from here to (x, y): up to `peak` above the higher end, then down. */
        const leap = (x, y, peak, ms) => c.all(
            c.tween({ x }, ms, linear),
            (async () => {
                await c.tween({ y: Math.min(s.y, y) - peak * k }, ms * 0.55, easeOut);
                await c.tween({ y }, ms * 0.45, easeIn);
            })(),
        );
        const touchDown = async depth => {
            await c.tween({ crouch: depth, squash: 0.7, tilt: 0 }, 80, easeOut);
            c.also({ squash: 0 }, 600, easeOutElastic);
            await c.tween({ crouch: 0 }, 280, easeOutBack);
        };

        const table = c.prop(bedsideTable, { x: home / k + TABLE_X, behind: true, state: { draw: 0 } });
        await c.animate(table.state, { draw: 1 }, 460);

        // A yawn: it leans back and stretches as its mouth opens, then sags.
        c.also({ lid: 0.3, mouth: 1, gazeY: -0.4 }, 500, easeInOut);
        await c.tween({ tilt: -8, stretch: 1, squash: -0.3 }, 560, easeInOut);
        await c.wait(380);
        c.also({ mouth: 0, lid: 0.6, gazeY: 0 }, 300);
        await c.tween({ tilt: 0, stretch: 0, squash: 0.15 }, 380, easeOutBack);

        // Bed. It looks at the table, crouches deep, leaning away from it, and jumps.
        await moves.glance(c, 1, -0.2, 200);
        await c.tween({ crouch: 13, squash: 0.55, tilt: -9 }, 300, easeOut);
        await c.wait(90);
        c.also({ crouch: 0, squash: -0.45, tilt: 10, lid: 1 }, 110, easeOut);
        await leap(home + TABLE_X * k, onTable, 34, 480);
        await touchDown(9);

        // It sits on the edge, legs hanging, and its eyes close.
        await c.tween({ crouch: 5, squash: 0.25 }, 150, easeOut);
        c.also({ crouch: 0, squash: 0 }, 450, easeOutElastic);
        await c.tween({ sit: 1, y: onTable + reach * k }, 380, easeInOut);
        c.also({ gazeX: 0, gazeY: 0.5 }, 400);
        await c.tween({ lid: 0.1, tilt: 6, squash: 0.18 }, 480, easeInOut);
        // It sleeps. Its hands tick on, five minutes at a time, and each tick nods its head.
        for (let i = 1; i <= 3; i++) {
            c.also({ hour: QUARTER_PAST_NINE + i * 5 / 60 }, 110, easeOutBack);
            await c.tween({ tilt: 8.5, squash: 0.26 }, 110, easeOut);
            await c.tween({ tilt: 6, squash: 0.12 }, 330, easeInOut);
        }

        // Half past nine. It shrinks for an instant, then the alarm: a take that lifts it off its seat.
        await c.tween({ squash: 0.5, tilt: 0 }, 120, easeIn);
        s.ring = 1;
        c.also({ wide: 1, lid: 1, pupil: 0.6, gazeY: 0, stretch: 1 }, 90, easeOut);
        // Its hands run wild: right round the dial, and back to a quarter past nine.
        c.also({ hour: QUARTER_PAST_NINE + 12 }, 2600, easeInOut);
        await c.tween({ squash: -0.6, y: onTable + (reach - 9) * k }, 110, easeOut);
        await c.tween({ squash: 0.3, y: onTable + reach * k }, 120, easeIn);
        c.also({ squash: 0 }, 400, easeOutElastic);
        for (let i = 0; i < 4; i++) await c.tween({ tilt: i % 2 ? 7 : -7 }, 90, easeInOut);

        // It leaps off the table, back where it came from, arms in the air.
        c.also({ sit: 0, squash: -0.4, tilt: -10, gazeX: -0.6 }, 120, easeOut);
        await leap(home, floor, 30, 460);
        c.also({ stretch: 0 }, 200);
        await touchDown(11);
        // Panic: it hops from one foot to the other, looking everywhere for the noise.
        for (let i = 0; i < 4; i++) {
            const side = i % 2 ? 1 : -1;
            c.also({ tilt: side * 9, gazeX: side, squash: -0.2 }, 100, easeOut);
            await c.tween({ y: floor - 9 * k }, 100, easeOut);
            await c.tween({ y: floor }, 90, easeIn);
            c.also({ squash: 0.3 }, 50, easeOut);
            await c.wait(50);
        }
        c.also({ tilt: 0, squash: 0, gazeX: 0, gazeY: -1 }, 160, easeOutBack);

        // It is up there. Arms flung wide (anticipation), then both hands clap down on the bells.
        c.also({ squash: -0.3 }, 200, easeOut);
        await c.hands({ left: { x: -58, y: -24, angle: -120 }, right: { x: 58, y: -24, angle: 120 } }, 200, easeOut);
        await c.wait(80);
        await c.hands({ left: { x: -39, y: -45, angle: 150 }, right: { x: 39, y: -45, angle: -150 } }, 110, easeIn);
        s.ring = 0;
        c.also({ wide: 0, pupil: 1, squint: 0.5, gazeY: 0 }, 160, easeOut);
        await c.tween({ crouch: 10, squash: 0.6 }, 90, easeOut);
        c.also({ squash: 0 }, 600, easeOutElastic);
        await c.tween({ crouch: 2 }, 300, easeOutBack);

        // Silence. It looks left, then right, without moving anything else.
        await c.wait(320);
        await moves.glance(c, -1, 0, 380);
        await moves.glance(c, 1, 0, 380);
        // Nobody saw. It lets go, breathes out, and puts on its best face.
        c.also({ gazeX: 0, squint: 0 }, 260);
        await c.all(
            c.hands({ left: null, right: null }, 320),
            c.tween({ crouch: 5, squash: 0.25 }, 320, easeInOut),
        );
        await c.tween({ crouch: 0, squash: 0 }, 360, easeOutBack);
        await moves.blink(c);
        await c.wait(700);
    },
};
