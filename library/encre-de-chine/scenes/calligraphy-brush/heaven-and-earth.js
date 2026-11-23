// The calligraphy brush writes 天 and 地, heaven and earth, on a sheet that
// stands on an easel. It wets a hand at the inkstone, turns to the sheet,
// and lays the strokes one after the other with that hand, in the order they
// are written, its fingers on the paper all the way along each, stepping
// along as it needs to: four for heaven, then ink again, then six for earth.
// A red seal, and it steps back and looks. About three quarters of a minute.
//
// Unhurried: one stroke at a time, a breath between two. The only quick
// thing is the press that starts a stroke.

import { easing, moves } from 'figurant';
import { inkstone } from '../../props/inkstone.js';
import { easel } from '../../props/easel.js';
import { INK, RED } from '../../kit.js';

const { easeInOut, easeOut, easeIn } = easing;
/** Where the stone and the easel stand, from where the brush does (character units). */
const STONE = -44, EASEL = 96;
/** What brings the tip into the stone's pool: a lean, and the body lowered. */
const LEAN = 23, DIP = 7.5, SHIFT = 16 * Math.sin(LEAN * Math.PI / 180);
/** How far above the floor the middle of the brush is (what its hands are placed from), and how far in front of itself it likes to write. */
const MIDDLE = 60, ARM = 30;
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

export const heavenAndEarthCalligraphyBrush = {
    character: 'calligraphy-brush',
    room: { left: 80, right: 140, up: 170 },

    async play(c) {
        const s = c.state, k = c.figure.k, home = s.x, ground = s.y, rest = s.ink;
        c.onLeave(() => { s.y = ground; s.ink = rest; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });
        const sheet = [EASEL + easel.points.sheet[0], easel.points.sheet[1]];
        /** A point of a character's square as a place: across from where the brush stands, and above the floor. */
        const place = (square, [x, y]) => [sheet[0] + square[0] + x, -(sheet[1] + square[1] + y)];
        /** Takes its writing hand to a place on the sheet, from where it stands. */
        const handTo = ([x, up], ms, ease = easeInOut) => c.hands({ right: { x: x - (s.x - home) / k, y: MIDDLE - up } }, ms, ease);

        // The easel and the stone come, each drawn in its turn; the brush bows to the white sheet.
        const stand = c.prop(easel, { x: EASEL, behind: true, state: { draw: 0 } });
        const stone = c.prop(inkstone, { x: STONE, state: { draw: 0, flip: -1 } });
        await c.animate(stand.state, { draw: 1 }, 1400, easeInOut);
        c.animate(stone.state, { draw: 1 }, 1100).catch(() => {});
        await c.tween({ gazeX: 1, gazeY: -0.4 }, 900, easeInOut);
        await c.tween({ tilt: 9, crouch: 3 }, 800, easeInOut);
        await c.tween({ tilt: 0, crouch: 0, gazeX: 0, gazeY: 0 }, 800, easeInOut);

        /** To the stone: it leans over, lowers its tuft into the pool, and the ink climbs the hair. */
        const load = async () => {
            await c.tween({ gazeX: -1, gazeY: 0.3 }, 600, easeInOut);
            await c.all(c.tween({ tilt: LEAN, crouch: DIP }, 900, easeInOut), c.feet({ left: { x: -5 + SHIFT, y: 0 }, right: { x: 5 + SHIFT, y: 0 } }, 900, easeInOut));
            c.also({ ink: 1 }, 900, easeInOut);
            // (And the hand it writes with goes into the pool too.)
            await c.all(c.tween({ gazeX: -0.7 }, 450, easeInOut), c.hands({ right: { x: -30, y: 34 } }, 450, easeInOut));
            await c.all(c.tween({ gazeX: -1 }, 450, easeInOut), c.hands({ right: { x: -26, y: 36 } }, 450, easeInOut));
            await c.all(c.tween({ tilt: 0, crouch: 0, gazeX: 0.6, gazeY: 0 }, 900, easeInOut), c.feet({ left: { x: -5, y: 0 }, right: { x: 5, y: 0 } }, 900, easeInOut));
            await c.feet({ left: null, right: null }, 120);
        };
        /** One character: for each stroke, it steps to where its arm is easy, puts its hand to the start, presses, runs along it as it appears, and lifts. */
        const write = async (square, strokes, dry) => {
            for (const [points, weight] of strokes) {
                const path = points.map(point => place(square, point));
                const d = path.map(([x, up], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${(-up).toFixed(1)}`).join(' ');
                const laid = c.prop({ name: 'stroke', shapes: [{ tag: 'path', attrs: { d, stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, weight: weight * 0.8 }], points: {} }, { state: { draw: 0 } });
                const long = path.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - path[i][0], point[1] - path[i][1]), 0), time = 320 + long * 26;
                // A step, if the stroke is out of easy reach: it stands a forearm short of the middle of it.
                const middle = path.reduce((sum, point) => sum + point[0], 0) / path.length, stand = home + (middle - ARM) * k;
                if (Math.abs(stand - s.x) > 5 * k) { await c.hands({ right: { x: 12, y: 2 } }, 240, easeInOut); await moves.walkTo(c, stand, 0.5); s.dir = 1; }
                // The hand a little off the paper at the start of it, then on: the press.
                await handTo([path[0][0] - 4, path[0][1] + 3], 520);
                await c.all(handTo(path[0], 150, easeIn), c.tween({ tilt: 3 }, 150, easeIn));
                await c.wait(140);
                // Along it, the stroke appearing under the fingers; the tuft and the eyes follow the hand.
                c.animate(laid.state, { draw: 1 }, time, easeInOut).catch(() => {});
                c.also({ ink: s.ink - dry }, time, easeInOut);
                for (let i = 1; i < path.length; i++) {
                    const part = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]) / (long || 1);
                    c.also({ gazeX: 0.5 + Math.max(-0.5, Math.min(0.5, (path[i][0] - path[i - 1][0]) / 16)), gazeY: path[i][1] > 80 ? -0.6 : 0.2 }, 200);
                    await handTo(path[i], time * part, i === path.length - 1 ? easeOut : easing.linear);
                }
                // The lift, and a breath.
                await c.all(handTo([path.at(-1)[0] - 5, path.at(-1)[1] + 4], 360, easeOut), c.tween({ tilt: 0 }, 360));
                await c.wait(420);
            }
            await c.hands({ right: { x: 12, y: 4 } }, 400, easeInOut);
        };

        // Ink; then to the sheet, turned to it.
        await load();
        await moves.walkTo(c, home + (sheet[0] + HEAVEN[0] + 20 - ARM) * k, 0.55);
        s.dir = 1;
        await c.tween({ gazeX: 0.8, gazeY: -0.4 }, 500, easeInOut);
        await write(HEAVEN, STROKES.heaven, 0.14);
        // It steps back to look at heaven; then to the stone for more ink.
        await moves.walkTo(c, home + (sheet[0] - 34) * k, 0.5);
        s.dir = 1;
        await c.tween({ gazeX: 0.8, gazeY: -0.5 }, 500, easeInOut);
        await c.wait(900);
        await c.hands({ right: null }, 300);
        await moves.walkTo(c, home, 0.6);
        s.dir = 1;
        await load();
        await moves.walkTo(c, home + (sheet[0] + EARTH[0] + 20 - ARM) * k, 0.55);
        s.dir = 1;
        await c.tween({ gazeX: 0.8, gazeY: 0 }, 400, easeInOut);
        await write(EARTH, STROKES.earth, 0.1);

        // The seal, under the two of them: the one touch of red. Then down, a step back, and stillness before the whole.
        const seal = c.prop({ name: 'seal', shapes: [{ tag: 'path', attrs: { d: 'M 0 0 L 8 0 L 8 8 L 0 8 Z M 2.2 2.4 L 5.8 2.4 M 4 2.4 L 4 6 M 2 6 L 6 6', stroke: RED, 'stroke-linejoin': 'round' }, weight: 1.1 }], points: {} }, { x: sheet[0] + 40, y: sheet[1] + 106, state: { draw: 0 } });
        await c.animate(seal.state, { draw: 1 }, 500, easeOut);
        await c.hands({ right: null }, 300);
        await moves.walkTo(c, home + (sheet[0] - 34) * k, 0.5);
        s.dir = 1;
        await c.tween({ gazeX: 0.8, gazeY: -0.2 }, 500, easeInOut);
        await c.tween({ tilt: 8, crouch: 3 }, 900, easeInOut);
        await c.tween({ tilt: 0, crouch: 0 }, 900, easeInOut);
        await c.wait(2600);
        await moves.walkTo(c, home, 0.55);
        await c.tween({ gazeX: 0, gazeY: 0 }, 600, easeInOut);
    },
};
