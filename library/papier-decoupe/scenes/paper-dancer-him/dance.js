// Made for him: the first dance, his part. He sees her, dares, walks up and
// holds out a hand; they step from side to side together; he lifts his arm
// for her to spin under; he stands firm while she runs, catches her at the
// waist and holds her up, looking up at her; sets her down; bows. Her part,
// with the time and the places both keep, is in ../paper-dancer-her/dance.js.

import { easing, moves } from 'figurant';
import { T, SPOT } from '../paper-dancer-her/dance.js';

const { easeOut, easeInOut } = easing;

export const firstDanceHim = {
    character: 'paper-dancer-him',
    room: { left: 60, right: 190, up: 190 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, home = s.x, base = ctx?.data?.home ?? -130;
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        const X = place => home + (place - base) * k;
        c.onLeave(() => { s.blush = 0; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        s.dir = 1;

        // He sees her: stops short, quiff up; straightens his tie.
        await at(T.see + 300);
        c.also({ wide: 1 }, 150);
        await c.tween({ gazeX: 1 }, 300, easeInOut);
        await c.wait(500);
        await c.all(c.tween({ wide: 0, blush: 1 }, 300), c.hands({ right: { x: 2, y: -9 } }, 300, easeInOut));
        await c.hands({ right: { x: 5, y: -10 } }, 160); await c.hands({ right: { x: 1, y: -9 } }, 160);
        await c.hands({ right: null }, 240);
        // He walks up, a little too fast, and stops a step short.
        await at(T.come + 300);
        await moves.walkTo(c, X(SPOT.him - 12), 1);
        // The hand held out, a small bow with it.
        await at(T.hand);
        await c.all(c.hands({ right: { x: 21, y: -4, angle: -20 }, left: { x: -8, y: 12 } }, 420, easeInOut), c.tween({ tilt: 7, crouch: 2 }, 420, easeInOut));
        await c.wait(500);
        await c.all(moves.walkTo(c, X(SPOT.him), 0.6), c.tween({ tilt: 0, crouch: 0 }, 400));
        s.dir = 1;
        // Side to side, together: the same way on the floor at the same moment.
        await at(T.step);
        for (let beat = 0; beat < 8; beat++) {
            const to = beat % 2 ? -1 : 1;
            // In the middle of it he lifts her hand over her head and turns her once, standing where he is.
            if (beat === 4) {
                await c.all(c.tween({ x: X(SPOT.him), tilt: 0 }, 200, easeInOut), c.hands({ right: { x: 32, y: -50, angle: -80 } }, 200, easeInOut), c.tween({ blush: 1, gazeY: -0.2 }, 200));
                await c.tween({ tilt: 3 }, 330, easeInOut); await c.tween({ tilt: -2 }, 330, easeInOut);
                await c.all(c.tween({ tilt: 0, gazeY: 0 }, 220), c.hands({ right: { x: 21, y: -4, angle: -20 } }, 220, easeInOut));
                beat++;
                continue;
            }
            await c.all(c.tween({ x: X(SPOT.him + to * SPOT.sway), tilt: to * 6, crouch: 2 }, 300, easeInOut), c.feet({ left: { x: to * 3, y: beat % 2 ? 0 : 6 }, right: { x: to * 3, y: beat % 2 ? 6 : 0 } }, 300, easeInOut));
            await c.all(c.tween({ crouch: 0 }, 240, easeOut), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 240));
        }
        await c.tween({ x: X(SPOT.him), tilt: 0 }, 240);
        await c.feet({ left: null, right: null }, 1);
        // His arm up, for her to spin under; he watches, delighted.
        await at(T.spin);
        await c.all(c.hands({ right: { x: 30, y: -52, angle: -80 }, left: { x: -10, y: 10 } }, 300, easeInOut), c.tween({ gazeY: -0.2, blush: 1 }, 300));
        await at(T.spin + 1900);
        await c.hands({ left: null, right: null }, 360);
        // She backs away: he steps to where he will catch her, plants his feet, opens his arms.
        await at(T.apart);
        await moves.walkTo(c, X(SPOT.catch), 0.7);
        s.dir = 1;
        await c.all(c.feet({ left: { x: -8, y: 0 }, right: { x: 8, y: 0 } }, 300, easeInOut), c.tween({ crouch: 4, gazeX: 1 }, 300), c.hands({ left: { x: 4, y: -6 }, right: { x: 22, y: -8, angle: -30 } }, 300, easeInOut));
        // The catch: down on his legs as she arrives, then up, arms straight, eyes on her.
        await at(T.lift - 120);
        await c.tween({ crouch: 9 }, 150, easeOut);
        await c.all(c.tween({ crouch: 0, gazeX: 0.3, gazeY: -1, wide: 0.4 }, 480, easeOut), c.hands({ left: { x: 4, y: -57, angle: -90 }, right: { x: 18, y: -57, angle: -90 } }, 480, easeOut));
        for (let breath = 0; c.clock.now - start < T.down - 320; breath++) await c.tween({ tilt: breath % 2 ? 2 : -2, crouch: breath % 2 ? 1.5 : 0 }, 420, easeInOut);
        // He sets her down, and lets go.
        await at(T.down);
        await c.all(c.tween({ tilt: 0, crouch: 5, gazeX: 1, gazeY: 0, wide: 0 }, 460, easeInOut), c.hands({ left: { x: 8, y: -8 }, right: { x: 24, y: -8 } }, 460, easeInOut));
        await c.all(c.tween({ crouch: 0 }, 300), c.hands({ left: null, right: null }, 300), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, 300));
        await c.feet({ left: null, right: null }, 1);
        // A bow, one hand on his heart.
        await at(T.bow + 150);
        await c.all(c.tween({ tilt: 12, crouch: 3, blush: 1, gazeY: 0.4 }, 420, easeInOut), c.hands({ right: { x: 3, y: -6 }, left: { x: -16, y: 6 } }, 420, easeInOut));
        await c.wait(520);
        await c.all(c.tween({ tilt: 0, crouch: 0, gazeY: 0, gazeX: 1 }, 420, easeInOut), c.hands({ left: null, right: null }, 420));
        await at(T.end);
        await c.tween({ blush: 0 }, 300);
    },
};
