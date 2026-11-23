// Made for her: the first dance, her part. They see each other from the two
// ends of the floor; she comes up, takes the hand held out, and they step
// from side to side together (he turns her once, in the middle of it); she spins under his arm, skirt open; she backs
// away, runs, and jumps, and he holds her up in the air, arms wide, for as
// long as a held breath; down again, a bow. His part is in
// ../paper-dancer-him/dance.js: both keep the time and the places below.
//
// Places are counted from the middle of the floor (`data.home` says where
// she starts).

import { easing, moves } from 'figurant';

const { easeOut, easeIn, easeInOut } = easing;
/** When each moment starts, in ms, for the two of them. */
export const T = { see: 500, come: 2200, hand: 5000, step: 6300, spin: 11100, apart: 13600, run: 15400, lift: 16500, down: 19900, bow: 21300, end: 23600 };
/** Where each stands for the steps; how far they sway; where he stands to catch her, and how high he holds her. */
export const SPOT = { him: -20, her: 20, sway: 16, catch: -34, high: 74 };

export const firstDanceHer = {
    character: 'paper-dancer-her',
    room: { left: 190, right: 60, up: 190 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, home = s.x, ground = s.y, base = ctx?.data?.home ?? 130, fx = ctx?.api?.fx ?? null;
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        const X = place => home + (place - base) * k;
        c.onLeave(() => { s.y = ground; s.twirl = 0; s.blush = 0; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        s.dir = -1;

        // She sees him: a look, a look away, the cheeks.
        await at(T.see);
        await c.tween({ gazeX: -1 }, 360, easeInOut);
        await c.wait(600);
        await c.all(c.tween({ gazeX: 0.4, gazeY: 0.5, blush: 1 }, 360, easeInOut), c.hands({ left: { x: -4, y: 12 }, right: { x: 4, y: 12 } }, 360));
        // She comes up, in small steps.
        await at(T.come);
        await c.hands({ left: null, right: null }, 240);
        await moves.walkTo(c, X(SPOT.her + 14), 0.75);
        await c.tween({ gazeX: -1, gazeY: -0.2 }, 300);
        // The hand held out: she puts hers in it.
        await at(T.hand + 500);
        await c.all(moves.walkTo(c, X(SPOT.her), 0.6), c.hands({ left: { x: -19, y: -4, angle: 200 } }, 480, easeInOut));
        s.dir = -1;
        // Side to side, together: the same way on the floor at the same moment.
        await at(T.step);
        for (let beat = 0; beat < 8; beat++) {
            const to = beat % 2 ? -1 : 1;
            // In the middle of it he lifts her hand, and she turns once round on the spot, led by him.
            if (beat === 4) {
                await c.all(c.tween({ x: X(SPOT.her), tilt: 0 }, 200, easeInOut), c.hands({ left: { x: -8, y: -48 } }, 200, easeInOut), c.tween({ twirl: 0.8, blush: 1 }, 200));
                for (let turn = 0; turn < 2; turn++) { s.dir = -s.dir; await c.tween({ squash: turn ? 0 : -0.1 }, 330, easeInOut); }
                s.dir = -1;
                await c.all(c.tween({ twirl: 0, squash: 0 }, 220, easeInOut), c.hands({ left: { x: -19, y: -4, angle: 200 } }, 220, easeInOut));
                beat++;
                continue;
            }
            await c.all(c.tween({ x: X(SPOT.her + to * SPOT.sway), tilt: to * 6, crouch: 2 }, 300, easeInOut), c.feet({ left: { x: to * 3, y: beat % 2 ? 6 : 0 }, right: { x: to * 3, y: beat % 2 ? 0 : 6 } }, 300, easeInOut));
            await c.all(c.tween({ crouch: 0 }, 240, easeOut), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 240));
        }
        await c.tween({ x: X(SPOT.her), tilt: 0 }, 240);
        await c.feet({ left: null, right: null }, 1);
        // The spin, under his arm: three turns, the skirt wide open.
        await at(T.spin);
        await c.all(c.hands({ left: { x: -8, y: -50 }, right: { x: 16, y: 2, angle: -10 } }, 300, easeInOut), c.tween({ twirl: 1, gazeX: 0 }, 300, easeOut));
        for (let turn = 0; turn < 6; turn++) { s.dir = -s.dir; await c.tween({ squash: turn % 2 ? 0 : -0.12, tilt: turn % 2 ? -3 : 3 }, 240, easeInOut); }
        s.dir = -1;
        await c.all(c.tween({ twirl: 0, squash: 0, tilt: 0, gazeX: -1 }, 360, easeInOut), c.hands({ left: null, right: null }, 360));
        // She backs away, all the way; a breath; she runs.
        await at(T.apart);
        await moves.walkTo(c, X(base - 10), 0.9);
        s.dir = -1;
        await c.tween({ crouch: 5, gazeX: -1 }, 300, easeInOut);
        await at(T.run);
        c.also({ crouch: 0 }, 150);
        await moves.walkTo(c, X(SPOT.catch + 44), 1.9);
        // The jump: up and over him, held there, arms wide, one leg back.
        await at(T.lift);
        await c.feet({ left: null, right: null }, 1);
        c.also({ wide: 0.6, twirl: 0.6 }, 200);
        await c.all(c.tween({ x: X(SPOT.catch + 22), y: ground - SPOT.high * k, tilt: -34, stretch: 1 }, 520, easeOut), c.feet({ right: { x: 20, y: 18, pitch: 40 } }, 520, easeOut));
        if (fx) for (let i = 0; i < 3; i++) c.clock.wait(i * 420).then(() => { if (!c.alive) return; const [x, y] = c.figure.points.top; const hearts = fx.particles({ color: '#e8715a', width: 2.4 }); for (let n = 0; n < 5; n++) hearts.emit({ x: x + fx.range(-18, 18) * k, y: y - 6 * k, vx: fx.range(-20, 20) * k, vy: -fx.range(30, 70) * k, life: 0.9, trail: 0.02 }); hearts.close(); });
        for (let breath = 0; c.clock.now - start < T.down - 320; breath++) await c.tween({ y: ground - (SPOT.high + (breath % 2 ? 2.5 : -1.5)) * k, tilt: -34 + (breath % 2 ? 2 : -2) }, 420, easeInOut);
        // Down, in front of him.
        await at(T.down);
        await c.all(c.tween({ x: X(SPOT.her), y: ground, tilt: 0, stretch: 0, twirl: 0, wide: 0 }, 480, easeIn), c.feet({ right: { x: 0, y: 0 } }, 480));
        await c.feet({ left: null, right: null }, 1);
        await moves.land(c, 4);
        // A curtsey to him, cheeks full; and they stand.
        await at(T.bow);
        await c.all(c.tween({ crouch: 7, tilt: -5, blush: 1, gazeY: 0.4 }, 420, easeInOut), c.hands({ left: { x: -17, y: 10 }, right: { x: 17, y: 10 } }, 420, easeInOut));
        await c.wait(520);
        await c.all(c.tween({ crouch: 0, tilt: 0, gazeY: 0, gazeX: -1 }, 420, easeInOut), c.hands({ left: null, right: null }, 420));
        await at(T.end);
        await c.tween({ blush: 0 }, 300);
    },
};
