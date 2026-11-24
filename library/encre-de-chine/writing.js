// 天 and 地, heaven and earth, as they are written: the strokes of each in
// their order, and where they go on the sheet of the easel. Shared by the
// sheet that shows them (characters/ink-sheet.js) and the master whose
// brush follows them (scenes/ink-master/write.js).

import { easel } from './props/easel.js';

/** Each character is written in a square of 40; its top left corner, from the sheet's (units, down the sheet). */
const SQUARE = { heaven: [6, 26], earth: [6, 70] };
/** The points the brush goes through, in the character's square (x across, y down), and how heavy the stroke is. */
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
const [LEFT, TOP] = easel.points.sheet;

/**
 * The strokes of a character, each as { points, weight, length }: the points
 * from the foot of the easel's middle (x across, y down: above the floor is
 * negative), as the easel itself is drawn.
 */
export const strokes = name => STROKES[name].map(([points, weight]) => {
    const placed = points.map(([x, y]) => [LEFT + SQUARE[name][0] + x, TOP + SQUARE[name][1] + y]);
    return { points: placed, weight, length: placed.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - placed[i][0], point[1] - placed[i][1]), 0) };
});
/** Where the red seal goes, under the two of them. */
export const SEAL = [LEFT + 40, TOP + 106];

/** The point a share `f` (0 -> 1) of the way along a stroke. */
export function along(stroke, f) {
    let left = Math.min(1, Math.max(0, f)) * stroke.length;
    for (let i = 1; i < stroke.points.length; i++) {
        const [ax, ay] = stroke.points[i - 1], [bx, by] = stroke.points[i], part = Math.hypot(bx - ax, by - ay);
        if (left <= part || i === stroke.points.length - 1) { const p = part ? left / part : 0; return [ax + (bx - ax) * p, ay + (by - ay) * p]; }
        left -= part;
    }
    return stroke.points[0];
}
