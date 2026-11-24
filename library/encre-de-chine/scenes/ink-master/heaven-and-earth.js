// The master writes 天 and 地, heaven and earth, on a sheet that stands on
// an easel. A brush lies on the floor beside an inkstone. The master arrives
// the way it does everything: a run, a leap, a landing in a low stance, a
// salute, fist in palm. It takes up the brush, spins it once, loads it at
// the stone, and writes: each stroke begun from a stance and struck in one
// breath, in the order they are written, the point of the brush on the paper
// all the way along it. Four for heaven; ink again; six for earth. A red
// seal. It lays the brush back where it found it, salutes the sheet, and
// steps back to look. About forty seconds.
//
// `data.walk`: how far to the right of where it starts its place is (it
// comes in from out of sight).

import { easing, moves } from 'figurant';
import { inkstone } from '../../props/inkstone.js';
import { easel } from '../../props/easel.js';
import { inkBrush } from '../../props/ink-brush.js';
import { INK, RED } from '../../kit.js';

const { easeInOut, easeOut, easeIn, linear } = easing;
/** Where the stone and the easel stand, from the master's place (character units). */
const STONE = -46, EASEL = 100;
/** How far above the floor the master's middle is (what its hands are placed from); how far in front of itself it likes to write; how far the point of the brush is beyond the hand, and how much above it. */
const MIDDLE = 74, ARM = 46, REACH = 26, RISE = 12;
/** Each character is written in a square of 40; its top left corner, from the sheet's (units, down the sheet). */
const HEAVEN = [6, 26], EARTH = [6, 70];
/**
 * The strokes, in the order they are written: the points the brush goes through, in its character's
 * square (x across, y down), and how heavy the stroke is.
 */
const STROKES = {
    heaven: [
        [[[7, 9], [20, 7.6], [33, 9]], 2.3],                 // a short line across
        [[[3, 19.5], [20, 18], [37, 19.5]], 2.6],            // a longer one under it
        [[[20, 9], [19.5, 22], [14, 31], [4, 38]], 2.7],     // sweeping down to the left
        [[[20, 19.5], [25, 29], [31, 35], [38, 38]], 3.2],   // and down to the right, pressed at the end
    ],
    earth: [
        [[[2.5, 15], [9, 13.8], [15, 13]], 2.1],
        [[[9, 6], [9.4, 18], [9, 30]], 2.3],
        [[[1.5, 33], [9, 31], [16, 27]], 2.1],
        [[[17, 17.5], [26, 14.5], [34, 12], [32.5, 18], [31, 23.5]], 2.2],
        [[[25, 4], [25.4, 15], [25, 27]], 2.3],
        [[[19.5, 9], [19.5, 22], [19.5, 30], [22, 33.5], [30, 33.5], [38, 33.5], [38, 26]], 2.6],
    ],
};

export const heavenAndEarthInkMaster = {
    character: 'ink-master',
    room: { left: 80, right: 150, up: 180 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, home = s.x + (ctx?.data?.walk ?? 0) * k, ground = s.y;
        c.onLeave(() => { s.y = ground; s.focus = 0; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        const sheet = [EASEL + easel.points.sheet[0], easel.points.sheet[1]];
        /** A point of a character's square as a place: across from the master's place, and above the floor. */
        const place = (square, [x, y]) => [sheet[0] + square[0] + x, -(sheet[1] + square[1] + y)];
        /** Something set down at a place counted from the master's own (wherever it is standing just now). */
        const set = (thing, x, more = {}) => c.prop(thing, { ...more, x: home / k + x });
        /** Takes the point of the brush to a place on the sheet: the hand stays a brush's length short of it. */
        const pointTo = ([x, up], ms, ease = easeInOut) => c.hands({ right: { x: x - REACH - (s.x - home) / k, y: MIDDLE - up + RISE } }, ms, ease);
        /** A stance: feet wide, low, the free arm drawn back. */
        const stance = (low, ms) => c.all(c.tween({ crouch: low, focus: 1 }, ms, easeOut), c.feet({ left: { x: -9, y: 0 }, right: { x: 9, y: 0 } }, ms, easeOut), c.hands({ left: { x: -16, y: 8, angle: 200 } }, ms, easeOut));
        const rise = ms => c.all(c.tween({ crouch: 0, focus: 0, tilt: 0 }, ms, easeInOut), c.feet({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } }, ms, easeInOut)).then(() => c.feet({ left: null, right: null }, 1));

        // What is there before anyone comes: the easel, the stone, the brush lying beside it.
        const stand = set(easel, EASEL, { behind: true, state: { draw: 0 } });
        const stone = set(inkstone, STONE, { state: { draw: 0, flip: -1 } });
        const lying = set(inkBrush, STONE + 44, { y: -3, state: { draw: 0, tilt: -4 } });
        await c.all(c.animate(stand.state, { draw: 1 }, 1000, easeInOut), c.animate(stone.state, { draw: 1 }, 1000), c.animate(lying.state, { draw: 1 }, 1000));

        // The master: a run, a leap with a turn in it, a landing in a low stance.
        if (Math.abs(s.x - home) > 10 * k) await moves.walkTo(c, home - 70 * k, 1.9);
        s.dir = 1;
        c.also({ crouch: 0, tuck: 1, focus: 1 }, 120, easeOut);
        const turn = c.tween({ tilt: 360 }, 620, linear), across = c.tween({ x: home }, 620, linear);
        await c.tween({ y: ground - 64 * k }, 310, easeOut);
        c.also({ tuck: 0 }, 200, easeIn);
        await c.tween({ y: ground }, 310, easeIn);
        await turn; await across;
        s.tilt = 0;
        await c.all(stance(11, 140), c.hands({ right: { x: 26, y: -8, angle: -10 } }, 140, easeOut), c.tween({ gazeX: 1 }, 140));
        await c.wait(650);
        // The salute: fist in palm, a bow of the head.
        await c.all(rise(360), c.hands({ left: { x: -3, y: -8 }, right: { x: 3, y: -8 } }, 360, easeInOut));
        await c.tween({ tilt: 9, gazeY: 0.5 }, 420, easeInOut);
        await c.tween({ tilt: 0, gazeY: 0 }, 420, easeInOut);

        // It takes up the brush from the floor, and spins it once in its fingers.
        await c.hands({ left: null, right: null }, 200);
        await moves.walkTo(c, home + (STONE + 34) * k, 0.8);
        s.dir = -1;
        await c.all(c.tween({ crouch: 20, tilt: -14, gazeY: 0.8 }, 420, easeInOut), c.hands({ right: { x: -8, y: 52 } }, 420, easeInOut));
        const spin = { turn: 184 };
        c.animate(lying.state, { draw: 0 }, 120).catch(() => {});
        const held = c.give('right', inkBrush, { tilt: () => spin.turn, state: { draw: 1 } });
        await c.all(c.tween({ crouch: 0, tilt: 0, gazeY: 0 }, 420, easeInOut), c.hands({ right: { x: -14, y: -6 } }, 420, easeInOut));
        await c.animate(spin, { turn: 184 + 720 }, 620, easeInOut);
        spin.turn = 184;

        /** To the stone: a knee bent, the point of the brush lowered into the pool, turned once, lifted. */
        const load = async () => {
            if (Math.abs(s.x - (home + (STONE + 34) * k)) > 4 * k) { await moves.walkTo(c, home + (STONE + 34) * k, 0.8); s.dir = -1; }
            await c.all(c.tween({ crouch: 14, tilt: -8, gazeX: -1, gazeY: 0.7 }, 520, easeInOut), c.hands({ right: { x: -14, y: 38 } }, 520, easeInOut), c.animate(spin, { turn: 150 }, 520, easeInOut));
            await c.animate(spin, { turn: 172 }, 300, easeInOut); await c.animate(spin, { turn: 150 }, 300, easeInOut);
            await c.all(c.tween({ crouch: 0, tilt: 0, gazeY: 0 }, 520, easeInOut), c.hands({ right: { x: 14, y: -4 } }, 520, easeInOut));
            // (Turned to the sheet, the brush points up at it.)
            await c.animate(spin, { turn: -24 }, 320, easeInOut);
        };
        /** One character: each stroke begun from a stance, struck in one breath, and risen from. */
        const write = async (square, strokes) => {
            for (const [n, [points, weight]] of strokes.entries()) {
                const path = points.map(point => place(square, point));
                const d = path.map(([x, up], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${(-up).toFixed(1)}`).join(' ');
                // (On the sheet, which stands where the master's place is counted from, not where it came in from.)
                const laid = set({ name: 'stroke', shapes: [{ tag: 'path', attrs: { d, stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, weight: weight * 0.8 }], points: {} }, 0, { state: { draw: 0 } });
                const long = path.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - path[i][0], point[1] - path[i][1]), 0), time = 200 + long * 15;
                // Where its arm is easy: a step, if the stroke is out of reach.
                const middle = path.reduce((sum, point) => sum + point[0], 0) / path.length, spot = home + (middle - ARM) * k;
                if (Math.abs(spot - s.x) > 6 * k) { await moves.walkTo(c, spot, 0.7); s.dir = 1; }
                // The stance, the point brought to the start of the stroke; a held breath.
                await c.all(stance(n % 2 ? 6 : 9, 220), pointTo([path[0][0] - 3, path[0][1] + 2], 300, easeOut), c.tween({ gazeX: 0.8, gazeY: path[0][1] > 85 ? -0.6 : 0, tilt: -3 }, 220));
                await c.wait(260);
                // The strike: on the paper, and along it in one go.
                await pointTo(path[0], 70, easeIn);
                c.animate(laid.state, { draw: 1 }, time, easeOut).catch(() => {});
                c.also({ tilt: 5 }, time, easeOut);
                for (let i = 1; i < path.length; i++) {
                    const part = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]) / (long || 1);
                    await pointTo(path[i], time * part, i === path.length - 1 ? easeOut : linear);
                }
                // Off the paper, and up.
                await c.all(pointTo([path.at(-1)[0] - 6, path.at(-1)[1] + 5], 200, easeOut), rise(240));
                await c.wait(200);
            }
        };

        await load();
        s.dir = 1;
        await write(HEAVEN, STROKES.heaven);
        // A step back to look at heaven, the brush held upright; then the stone again.
        await c.all(moves.walkTo(c, home + (sheet[0] - 44) * k, 0.6), c.hands({ right: { x: 12, y: -4 } }, 400), c.animate(spin, { turn: -90 }, 400));
        s.dir = 1;
        await c.tween({ gazeX: 0.8, gazeY: -0.5 }, 400, easeInOut);
        await c.wait(800);
        await c.animate(spin, { turn: 184 }, 300, easeInOut);
        await load();
        s.dir = 1;
        await write(EARTH, STROKES.earth);

        // The seal, under the two of them. The brush goes back where it was found; a salute to the sheet; and it looks.
        const seal = set({ name: 'seal', shapes: [{ tag: 'path', attrs: { d: 'M 0 0 L 8 0 L 8 8 L 0 8 Z M 2.2 2.4 L 5.8 2.4 M 4 2.4 L 4 6 M 2 6 L 6 6', stroke: RED, 'stroke-linejoin': 'round' }, weight: 1.1 }], points: {} }, sheet[0] + 40, { y: sheet[1] + 106, state: { draw: 0 } });
        await c.animate(seal.state, { draw: 1 }, 400, easeOut);
        await c.all(moves.walkTo(c, home + (STONE + 34) * k, 0.8), c.hands({ right: { x: 12, y: -4 } }, 400), c.animate(spin, { turn: 184 }, 400));
        s.dir = -1;
        await c.all(c.tween({ crouch: 20, tilt: -14, gazeY: 0.8 }, 420, easeInOut), c.hands({ right: { x: -8, y: 52 } }, 420, easeInOut));
        c.animate(held.state, { draw: 0 }, 120).catch(() => {});
        await c.animate(lying.state, { draw: 1 }, 160);
        await c.all(c.tween({ crouch: 0, tilt: 0, gazeY: 0 }, 420, easeInOut), c.hands({ right: null }, 420));
        await moves.walkTo(c, home, 0.7);
        s.dir = 1;
        await c.hands({ left: { x: -3, y: -8 }, right: { x: 3, y: -8 } }, 360, easeInOut);
        await c.tween({ tilt: 10, gazeY: 0.5 }, 480, easeInOut);
        await c.tween({ tilt: 0, gazeY: -0.3, gazeX: 0.8 }, 480, easeInOut);
        await c.hands({ left: null, right: null }, 400);
        await c.wait(3200);
    },
};
