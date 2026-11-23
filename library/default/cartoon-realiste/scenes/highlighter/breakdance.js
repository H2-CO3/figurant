// The highlighter breakdances. A short set of the moves one knows from the
// street, played large: a bounce in, toprock (kicks and crossing steps on its
// feet), footwork low to the floor, a kick up into a headspin on its felt tip
// (which marks the floor as it turns), a freeze held on one side, a windmill,
// a second freeze upside down, and a b-boy stance. It never leaves the floor:
// whatever its angle, its feet, its tip or its side rests on it (`onFloor`).
//
// On its head it stands on its tip: the body is lowered until the tip
// touches the ground, and its legs, which always hang from the hips, are
// sent up with placed feet.

import { easing, moves } from 'figurant';

const { easeIn, easeOut, easeInOut, easeOutBack, linear } = easing;
/** One beat of the music nobody hears. */
const BEAT = 420;
/** The highlighter's outline, from its middle (y down): what can touch the floor. */
const OUTLINE = [[-20, 46], [20, 46], [-20, -28], [20, -28], [-15, -46], [15, -46], [-10, -71], [10, -71]];
/** Its middle above the floor when it stands: hips (46) on legs of 47. */
const STANDING = 93;
/**
 * How far the body must come down for its lowest point to rest on the floor
 * when it is turned by `angle` degrees. Breaking is danced on the floor: when
 * it is on its head, on its side or rolling, something of it always touches.
 */
function onFloor(angle) {
    const a = angle * Math.PI / 180, sin = Math.sin(a), cos = Math.cos(a);
    return STANDING - Math.max(...OUTLINE.map(([x, y]) => x * sin + y * cos));
}
/** On its head: the tip on the floor. */
const ON_TIP = onFloor(180);
/** Where a foot is sent when the legs are in the air: far above the hips. */
const AIR = 195;

export const breakdanceHighlighter = {
    character: 'highlighter',
    room: { left: 110, right: 110, up: 215 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.mark = 0; });
        const legs = (left, right, ms, ease = easeInOut, drop = [0, 0]) => c.feet({ left: { x: left, y: AIR - drop[0] }, right: { x: right, y: AIR - drop[1] } }, ms, ease);
        const beat = n => BEAT * n;
        /**
         * Turns the body to `angle`, keeping it on the floor all the way: its
         * height follows its outline as it rolls. `grounded` says how much it
         * rests on the floor at the start and at the end (0 standing on its
         * feet, 1 lying on the floor).
         */
        const roll = async (angle, ms, ease = easeInOut, grounded = [1, 1], standing = 6) => {
            const turn = { angle: s.tilt, weight: grounded[0] };
            const place = () => {
                s.tilt = turn.angle;
                s.crouch = standing + (onFloor(turn.angle) - standing) * turn.weight;
                arms(turn.angle);
            };
            const stop = c.onLeave(c.clock.onFrame(place));
            await c.animate(turn, { angle, weight: grounded[1] }, ms, ease);
            Object.assign(turn, { angle, weight: grounded[1] });
            place();
            stop();
        };
        /**
         * On the floor its arms go straight out from its shoulders, turning with
         * the body; the one that points down stops at the floor: a hand planted.
         */
        const arms = angle => {
            const a = angle * Math.PI / 180, sin = Math.sin(a), cos = Math.cos(a), height = STANDING - s.crouch - 9;
            for (const [hand, side] of [[s.handL, -1], [s.handR, 1]]) {
                let x = side * 80 * cos + 4 * sin, y = side * 80 * sin - 4 * cos, angle = Math.atan2(x, y) * 180 / Math.PI;
                if (y > height) {
                    // Planted: the arm goes straight from the shoulder to the floor, away from the body.
                    const sx = side * 20 * cos + 4 * sin, sy = side * 20 * sin - 4 * cos, down = Math.max(0, height - sy);
                    const out = Math.sqrt(Math.max(0, 50 * 50 - down * down));
                    x = sx + (sx >= 0 ? 1 : -1) * out; y = height; angle = sx >= 0 ? 90 : -90;
                }
                Object.assign(hand, { x, y, angle, weight: 1, page: false });
            }
        };

        // Arms the way a b-boy holds them: open wide to the sides, or crossed over the chest.
        const open = (ms, ease = easeOut) => c.hands({ left: { x: -54, y: 8, angle: -100 }, right: { x: 54, y: 8, angle: 100 } }, ms, ease).catch(() => {});
        const crossed = (ms, ease = easeInOut) => c.hands({ left: { x: 12, y: -2, angle: 80 }, right: { x: -12, y: 5, angle: -80 } }, ms, ease).catch(() => {});

        // In: the tip pops, and it bounces to find the beat, deep in the knees, arms loose.
        c.also({ wide: 0.9 }, 100, easeOut);
        await c.tween({ crouch: 11 }, beat(0.25), easeOut);
        c.also({ wide: 0 }, 300);
        for (let i = 0; i < 3; i++) {
            await c.tween({ crouch: 1, tilt: i % 2 ? -5 : 5 }, beat(0.25), easeOut);
            await c.tween({ crouch: 11 }, beat(0.25), easeIn);
        }

        // Toprock, eight counts: a foot kicks out as the arms open, then crosses in
        // front of the other as the arms close over the chest. The body rocks over it.
        for (let step = 0; step < 8; step++) {
            const side = step % 2 ? 1 : -1, foot = side < 0 ? 'left' : 'right';
            open(beat(0.25));
            c.also({ tilt: side * 11, gazeX: -side }, beat(0.5), easeOut);
            await c.feet({ [foot]: { x: side * 22, y: 20, pitch: -30 } }, beat(0.25), easeOut);      // the kick out
            c.also({ crouch: 3 }, beat(0.25));
            crossed(beat(0.25));
            await c.feet({ [foot]: { x: -side * 20, y: 0 } }, beat(0.25), easeIn);                   // the cross
            c.also({ crouch: 11 }, beat(0.25));
            await c.feet({ [foot]: { x: side * 6, y: 12 } }, beat(0.25), easeOut);
            await c.feet({ [foot]: null }, beat(0.25), easeIn);
        }

        // Down to the floor for footwork: low on its legs, a hand reaching for the
        // ground on one side while a leg sweeps out on the other, and round again.
        c.also({ gazeX: 0, squint: 0.4 }, beat(0.5));
        await c.tween({ crouch: 20, tilt: 0 }, beat(0.5), easeInOut);
        for (let sweep = 0; sweep < 6; sweep++) {
            const side = sweep % 2 ? 1 : -1, foot = side < 0 ? 'left' : 'right', other = side < 0 ? 'right' : 'left';
            c.hands({ [other]: { x: -side * 44, y: 44, angle: -side * 20 }, [foot]: { x: side * 50, y: -8, angle: side * 110 } }, beat(0.5), easeInOut).catch(() => {});
            c.also({ tilt: -side * 16 }, beat(0.5), easeInOut);
            await c.feet({ [foot]: { x: side * 44, y: 0, pitch: -20 }, [other]: { x: -side * 4, y: 0 } }, beat(0.5), easeInOut);
        }
        c.also({ squint: 0 }, 200);

        // The kick up: over onto its tip, legs thrown to the sky.
        // It sits down on the floor as its legs go up, then rolls over onto its tip:
        // it does not jump onto its head.
        await c.tween({ crouch: onFloor(0), tilt: 0 }, beat(0.3), easeIn);
        legs(-30, 30, beat(0.5));
        await roll(180, beat(0.8), easeInOut);

        // The headspin: it turns on its tip. Seen from the front, a spin is legs that
        // scissor wide, a body that pulses, and the colour its tip leaves on the floor.
        for (let turn = 0; turn < 8; turn++) {
            const out = turn % 2 ? 1 : -1;
            c.also({ squash: 0.24 * out, mark: Math.min(1, 0.3 + 0.1 * turn) }, beat(0.5), easeInOut);
            await legs(out * 46, out * -14, beat(0.5), linear, [turn % 2 ? 40 : 0, turn % 2 ? 0 : 40]);
        }
        c.also({ squash: 0 }, beat(0.25));

        // The freeze: it drops onto its side, tip and shoulder on the floor, a hand
        // down, one leg high and one tucked. Held: the stillness after the storm.
        legs(-50, -4, beat(0.5), easeOut, [0, 70]);
        await roll(112, beat(0.5), easeOut);
        await c.wait(beat(2.5));

        // The windmill: it rolls round and round on the floor, legs wide like blades.
        c.also({ mark: 0 }, beat(1));
        legs(-44, 44, beat(0.5));
        await roll(900, beat(4), easeInOut);
        s.tilt = 180;

        // A second freeze, upside down, straight as a mast, one knee folded.
        legs(-10, 26, beat(0.5), easeOut, [0, 60]);
        await c.wait(beat(2.5));

        // Back onto its feet, rolling up over its side without leaving the floor, and
        // the stance: arms crossed, leaning back.
        c.feet({ left: null, right: null }, beat(1.2)).catch(() => {});
        await roll(300, beat(1), easeIn);
        await roll(360, beat(0.6), easeOut, [1, 0], 10);
        s.tilt = 0;
        c.hands({ left: null, right: null }, beat(0.5)).catch(() => {});
        await c.tween({ crouch: 0 }, beat(0.5), easeOutBack);
        await c.all(
            c.hands({ left: { x: 10, y: -4, angle: 80 }, right: { x: -10, y: 4, angle: -80 } }, beat(0.5), easeOut),
            c.tween({ tilt: -12, squint: 0.6, gazeX: 0.4 }, beat(0.5), easeOutBack),
        );
        await c.wait(beat(4));
        await c.all(c.hands({ left: null, right: null }, beat(0.5)), c.tween({ tilt: 0, squint: 0, gazeX: 0 }, beat(0.5)));
        await c.wait(beat(1));
    },
};
