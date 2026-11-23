// The calligraphy brush writes 天 and 地, heaven and earth, on a sheet that
// stands on an easel. It loads its tuft at the inkstone, rises off the floor
// as a brush rises in a hand, and lays the strokes one after the other, in
// the order they are written, its point on the paper all the way along each:
// four for heaven, then ink again, then six for earth. A red seal, and it
// comes down and looks. About three quarters of a minute.
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
/** How far above the floor the point of the tuft is when the brush stands. */
const TIP = 4;
/** Each character is written in a square of 40; its top left corner, from the sheet's (units, down the sheet). */
const HEAVEN = [6, 8], EARTH = [6, 62];
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
        c.onLeave(() => { s.y = ground; s.ink = rest; c.feet({ left: null, right: null }, 1).catch(() => {}); });
        const sheet = [EASEL + easel.points.sheet[0], easel.points.sheet[1]];
        /** A point of a character's square as a place: across from where the brush stands, and above the floor. */
        const place = (square, [x, y]) => [sheet[0] + square[0] + x, -(sheet[1] + square[1] + y)];
        /** Takes the point of the tuft to a place. */
        const tipTo = ([x, up], ms, ease = easeInOut) => c.tween({ x: home + x * k, y: ground - (up - TIP) * k }, ms, ease);

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
            await c.tween({ gazeX: -0.7 }, 450, easeInOut);
            await c.tween({ gazeX: -1 }, 450, easeInOut);
            await c.all(c.tween({ tilt: 0, crouch: 0, gazeX: 0.6, gazeY: 0 }, 900, easeInOut), c.feet({ left: { x: -5, y: 0 }, right: { x: 5, y: 0 } }, 900, easeInOut));
            await c.feet({ left: null, right: null }, 120);
        };
        /** One character: for each stroke, the point goes to its start, presses, runs along it as it appears, and lifts. */
        const write = async (square, strokes, dry) => {
            for (const [points, weight] of strokes) {
                const path = points.map(point => place(square, point));
                const d = path.map(([x, up], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${(-up).toFixed(1)}`).join(' ');
                const laid = c.prop({ name: 'stroke', shapes: [{ tag: 'path', attrs: { d, stroke: INK, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, weight: weight * 0.8 }], points: {} }, { state: { draw: 0 } });
                const long = path.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - path[i][0], point[1] - path[i][1]), 0), time = 320 + long * 26;
                // A little above the paper's start of it, then down: the press.
                await tipTo([path[0][0] - 3, path[0][1] + 3], 620);
                await c.all(tipTo(path[0], 160, easeIn), c.tween({ squash: 0.12 }, 160, easeIn));
                await c.wait(140);
                // Along it, the stroke appearing under the point; the tuft trails the way it goes.
                c.animate(laid.state, { draw: 1 }, time, easeInOut).catch(() => {});
                c.also({ squash: 0, ink: s.ink - dry }, time, easeInOut);
                for (let i = 1; i < path.length; i++) {
                    const part = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]) / (long || 1);
                    c.also({ gazeX: Math.max(-1, Math.min(1, (path[i][0] - path[i - 1][0]) / 8)) }, 200);
                    await tipTo(path[i], time * part, i === path.length - 1 ? easeOut : easing.linear);
                }
                // The lift, and a breath.
                await tipTo([path.at(-1)[0] + 2, path.at(-1)[1] + 6], 380, easeOut);
                await c.wait(420);
            }
        };

        // Ink; then up off the floor, as a brush is lifted, and across to the sheet.
        await load();
        await c.all(c.tween({ y: ground - 40 * k, gazeX: 0.6 }, 1100, easeInOut), c.tween({ x: home + (sheet[0] - 14) * k }, 1100, easeInOut));
        await write(HEAVEN, STROKES.heaven, 0.14);
        // It draws back to look at heaven; then down for more ink.
        await c.all(c.tween({ x: home + (sheet[0] - 30) * k, gazeX: 0.8, gazeY: -0.3 }, 900, easeInOut));
        await c.wait(900);
        await c.all(c.tween({ x: home, y: ground, gazeY: 0 }, 1300, easeInOut));
        await moves.land(c, 3);
        await load();
        await c.all(c.tween({ y: ground - 20 * k, gazeX: 0.6 }, 1000, easeInOut), c.tween({ x: home + (sheet[0] - 14) * k }, 1000, easeInOut));
        await write(EARTH, STROKES.earth, 0.1);

        // The seal, under the two of them: the one touch of red. Then down, a step back, and stillness before the whole.
        const seal = c.prop({ name: 'seal', shapes: [{ tag: 'path', attrs: { d: 'M 0 0 L 8 0 L 8 8 L 0 8 Z M 2.2 2.4 L 5.8 2.4 M 4 2.4 L 4 6 M 2 6 L 6 6', stroke: RED, 'stroke-linejoin': 'round' }, weight: 1.1 }], points: {} }, { x: sheet[0] + 38, y: sheet[1] + 104, state: { draw: 0 } });
        await c.all(c.tween({ x: home + (sheet[0] - 34) * k, y: ground, gazeX: 0.8, gazeY: -0.2 }, 1400, easeInOut));
        await moves.land(c, 3);
        await c.animate(seal.state, { draw: 1 }, 500, easeOut);
        await c.tween({ tilt: 8, crouch: 3 }, 900, easeInOut);
        await c.tween({ tilt: 0, crouch: 0 }, 900, easeInOut);
        await c.wait(2600);
        await c.all(c.tween({ x: home, gazeX: 0, gazeY: 0 }, 1400, easeInOut));
        await c.wait(600);
    },
};
