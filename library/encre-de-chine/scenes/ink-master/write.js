// The master writes. It stands by the inkstone, the brush at its feet: it
// takes the brush up, spins it once, loads it at the stone; then each stroke
// of 天 is begun from a stance and struck in one breath, the point of the
// brush on the paper all the way along it; a step back to look; ink again;
// the six strokes of 地; and the brush is laid back where it was found.
//
// The ink itself is the sheet's (characters/ink-sheet.js): a scene sets it
// stroke by stroke, and tells the master when, so that the brush is there:
//   `data.easel`    how far the middle of the easel is from where the
//                   master starts (character units, to the right);
//   `data.strokes`  for each of the ten strokes, { at, over }: when its ink
//                   starts, in ms from the start of this animation, and how
//                   long it runs (the same as on the sheet's track);
//   `data.lay`      when the brush touches the floor again.
// Without them it writes at its own pace, as one practises.

import { easing, moves } from 'figurant';
import { inkBrush } from '../../props/ink-brush.js';
import { strokes, along } from '../../writing.js';

const { easeInOut, easeOut, easeIn, linear } = easing;
/** How far above the floor the master's middle is (what its hands are placed from); how far in front of itself it likes to write; how far the point of the brush is beyond the hand, and how much above it. */
const MIDDLE = 74, ARM = 46, REACH = 26, RISE = 12;
/** The stance before a stroke, the held breath, the strike: how long before the ink starts the master gets ready. */
const READY = 300 + 260 + 70;
/** The time at which the ink of a `set` clip has run a share `f` of its way (the engine's ease in and out, read backwards). */
const when = f => (f < 0.5 ? Math.cbrt(f / 4) : 1 - Math.cbrt(2 * (1 - f)) / 2);

export const writeInkMaster = {
    character: 'ink-master',
    room: { left: 40, right: 160, up: 180 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, home = s.x, ground = s.y;
        const { easel = 112, strokes: times = null, lay = null } = ctx?.data ?? {};
        const start = c.clock.now, at = ms => c.wait(Math.max(0, ms - (c.clock.now - start)));
        c.onLeave(() => { c.tween({ y: ground, focus: 0 }, 1).catch(() => {}); c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        /** Takes the point of the brush to a place of the easel (x from its middle, y down from the floor): the hand stays a brush's length short of it. */
        const pointTo = ([x, y], ms, ease = easeInOut) => c.hands({ right: { x: easel + x - REACH - (s.x - home) / k, y: MIDDLE + y + RISE } }, ms, ease);
        /** A stance: feet wide, low, the free arm drawn back. */
        const stance = (low, ms) => c.all(c.tween({ crouch: low, focus: 1 }, ms, easeOut), c.feet({ left: { x: -9, y: 0 }, right: { x: 9, y: 0 } }, ms, easeOut), c.hands({ left: { x: -16, y: 8, angle: 200 } }, ms, easeOut));
        const rise = ms => c.all(c.tween({ crouch: 0, focus: 0, tilt: 0 }, ms, easeInOut), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, ms, easeInOut)).then(() => c.feet({ left: null, right: null }, 1));

        // It takes up the brush from the floor, and spins it once in its fingers.
        await c.all(c.tween({ crouch: 20, tilt: -14, gazeY: 0.8 }, 420, easeInOut), c.hands({ right: { x: -8, y: 52 } }, 420, easeInOut));
        const spin = { turn: 184 };
        const held = c.give('right', inkBrush, { tilt: () => spin.turn, state: { draw: 1 } });
        await c.all(c.tween({ crouch: 0, tilt: 0, gazeY: 0 }, 420, easeInOut), c.hands({ right: { x: -14, y: -6 } }, 420, easeInOut));
        await c.animate(spin, { turn: 184 + 720 }, 620, easeInOut);
        await c.animate(spin, { turn: 184 }, 1, linear);

        /** At the stone: a knee bent, the point of the brush lowered into the pool, turned once, lifted. */
        const load = async () => {
            if (Math.abs(s.x - home) > 4 * k) await moves.walkTo(c, home, 0.8);
            await c.all(c.tween({ crouch: 14, tilt: -8, gazeX: -1, gazeY: 0.7 }, 520, easeInOut), c.hands({ right: { x: -14, y: 38 } }, 520, easeInOut), c.animate(spin, { turn: 150 }, 520, easeInOut));
            await c.animate(spin, { turn: 172 }, 300, easeInOut); await c.animate(spin, { turn: 150 }, 300, easeInOut);
            await c.all(c.tween({ crouch: 0, tilt: 0, gazeY: 0 }, 520, easeInOut), c.hands({ right: { x: 14, y: -4 } }, 520, easeInOut));
            // (Turned to the sheet, the brush points up at it.)
            await c.animate(spin, { turn: -24 }, 320, easeInOut);
        };
        let count = 0;
        /** One character: each stroke begun from a stance, struck in one breath, and risen from. */
        const write = async name => {
            for (const [n, stroke] of strokes(name).entries()) {
                const told = times?.[count++], over = told?.over ?? 200 + stroke.length * 15, first = stroke.points[0], last = stroke.points.at(-1);
                // Where its arm is easy: a step, if the stroke is out of reach.
                const middle = stroke.points.reduce((sum, point) => sum + point[0], 0) / stroke.points.length, spot = home + (easel + middle - ARM) * k;
                if (Math.abs(spot - s.x) > 6 * k) await moves.walkTo(c, spot, 0.7);
                if (told) await at(told.at - READY);
                // The stance, the point brought to the start of the stroke; a held breath.
                await c.all(stance(n % 2 ? 6 : 9, 220), pointTo([first[0] - 3, first[1] - 2], 300, easeOut), c.tween({ gazeX: 0.8, gazeY: first[1] < -85 ? -0.6 : 0, tilt: -3 }, 220));
                await c.wait(260);
                // The strike: on the paper, and along it in one go, as fast as the ink runs.
                await pointTo(first, 70, easeIn);
                c.also({ tilt: 5 }, over, easeOut);
                for (let piece = 1; piece <= 10; piece++) await pointTo(along(stroke, piece / 10), over * (when(piece / 10) - when((piece - 1) / 10)), linear);
                // Off the paper, and up.
                await c.all(pointTo([last[0] - 6, last[1] - 5], 200, easeOut), rise(240));
                await c.wait(200);
            }
        };

        await load();
        await write('heaven');
        // A step back to look at heaven, the brush held upright; then the stone again.
        await c.all(c.tween({ x: s.x - 30 * k }, 520, easeInOut), c.hands({ right: { x: 12, y: -4 } }, 400), c.animate(spin, { turn: -90 }, 400));
        await c.tween({ gazeX: 0.8, gazeY: -0.5 }, 400, easeInOut);
        await c.wait(800);
        await c.animate(spin, { turn: 184 }, 300, easeInOut);
        await load();
        await write('earth');

        // The brush goes back where it was found.
        await c.all(moves.walkTo(c, home, 0.8), c.hands({ right: { x: 12, y: -4 } }, 400), c.animate(spin, { turn: 184 }, 400));
        if (lay !== null) await at(lay - 420);
        await c.all(c.tween({ crouch: 20, tilt: -14, gazeY: 0.8 }, 420, easeInOut), c.hands({ right: { x: -8, y: 52 } }, 420, easeInOut));
        await c.animate(held.state, { draw: 0 }, 120);
        await c.all(c.tween({ crouch: 0, tilt: 0, gazeY: 0 }, 420, easeInOut), c.hands({ right: null }, 420));
    },
};
