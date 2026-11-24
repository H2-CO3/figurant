// Made for her: the jump. Up and over the one who catches her (22 units
// ahead of her, 74 up: where his hands are), held there, arms wide, one leg
// back, hearts above her; then down in front of him, and a soft landing.
// `data.down`: when she is set down, in ms from the start.

import { easing, moves } from 'figurant';

const { easeOut, easeIn, easeInOut } = easing;
/** How far ahead she is held, and how high; where she is set down, from where she took off. */
const OVER = 22, HIGH = 74, DOWN = 10;

export const leapHer = {
    character: 'paper-dancer-her',
    room: { left: 60, right: 50, up: 190 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, from = s.x, ground = s.y, down = ctx?.data?.down ?? 3400, fx = ctx?.api?.fx ?? null;
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        c.onLeave(() => { c.tween({ y: ground, twirl: 0, stretch: 0, wide: 0 }, 1).catch(() => {}); c.feet({ left: null, right: null }, 1).catch(() => {}); });
        c.also({ wide: 0.6, twirl: 0.6 }, 200);
        await c.all(c.tween({ x: from + s.dir * OVER * k, y: ground - HIGH * k, tilt: -34, stretch: 1 }, 520, easeOut), c.feet({ right: { x: 20, y: 18, pitch: 40 } }, 520, easeOut));
        if (fx) for (let i = 0; i < 3; i++) c.clock.wait(i * 420).then(() => { if (!c.alive) return; const [x, y] = c.figure.points.top; const hearts = fx.particles({ color: '#e8715a', width: 2.4 }); for (let n = 0; n < 5; n++) hearts.emit({ x: x + fx.range(-18, 18) * k, y: y - 6 * k, vx: fx.range(-20, 20) * k, vy: -fx.range(30, 70) * k, life: 0.9, trail: 0.02 }); hearts.close(); });
        for (let breath = 0; c.clock.now - start < down - 320; breath++) await c.tween({ y: ground - (HIGH + (breath % 2 ? 2.5 : -1.5)) * k, tilt: -34 + (breath % 2 ? 2 : -2) }, 420, easeInOut);
        await at(down);
        await c.all(c.tween({ x: from - s.dir * DOWN * k, y: ground, tilt: 0, stretch: 0, twirl: 0, wide: 0 }, 480, easeIn), c.feet({ right: { x: 0, y: 0 } }, 480));
        await c.feet({ left: null, right: null }, 1);
        await moves.land(c, 4);
    },
};
