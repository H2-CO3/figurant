// Rewind. The cassette strikes on beside a dark jukebox, presses it, and the
// arches light in a chase. It plays: its reels turn, its tape winds across,
// it steps from side to side. The tape runs out, the jukebox dies, the tape
// crumples. So it rewinds, fast, shaking, the arches running backwards; and
// the whole thing strikes on again.
//
// Written the way neon moves: every pose is switched, never glided, and held
// for a beat. Both feet stay on the floor all the way.

import { jukebox } from '../../props/jukebox.js';

/** No in-between: the old pose, then the new one. */
const snap = p => (p < 1 ? 0 : 1);
const BEAT = 375;

export const rewindCassette = {
    character: 'cassette',
    room: { left: 115, right: 190, up: 155 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.power = 1; s.spin = 0; s.wound = 0.5; });
        const box = c.prop(jukebox, { x: 134, y: 0, behind: true, state: { draw: 0.2 } });
        /** Switches to a pose, and holds it. */
        const pose = async (to, hands = {}, beats = 1) => {
            await c.all(c.tween(to, 1, snap), c.hands(hands, 1, snap));
            await c.wait(BEAT * beats - 1);
        };
        /** A tube that struggles: `target` switched between two values, at uneven intervals. */
        const buzz = async (target, key, a, b, times) => {
            for (const ms of times) {
                await c.animate(target, { [key]: target[key] === a ? b : a }, 1, snap);
                await c.wait(ms);
            }
        };
        const REST = { left: null, right: null };
        const UP = { left: { x: -88, y: -36, angle: -160 }, right: { x: 88, y: -36, angle: 160 } };

        // Dark: two cold signs, the tape all on the left reel.
        await pose({ power: 0, spin: 0, wound: 0 }, REST, 2);

        // It strikes: a stutter, then a flash.
        await buzz(s, 'power', 0, 1, [60, 90, 50, 170, 1]);
        await pose({ power: 1, wide: 1 }, {}, 1);
        await pose({ wide: 0 }, {}, 1);

        // A look at the jukebox, and a press on its side: the cabinet lights.
        await pose({ gazeX: 1 }, {}, 1);
        box.state.draw = 0.4;
        await pose({ tilt: 5 }, { right: { x: 87, y: 12, angle: 80 } }, 1);

        // The arches chase, twice, while it nods along.
        await c.tween({ tilt: 0, gazeX: 0, spin: 1 }, 1, snap);
        for (let step = 0; step < 8; step++) {
            box.state.draw = 0.4 + 0.2 * (step % 4);
            await pose({ crouch: step % 2 ? 0 : 4 }, step ? {} : REST, 0.5);
        }

        // It plays: a step to one side, a step to the other, the tape passing across.
        for (let frame = 0; frame < 8; frame++) {
            const side = frame % 2 ? 1 : -1;
            box.state.draw = [0.6, 0.8, 1][frame % 3];
            await c.all(
                c.feet({ left: { x: side < 0 ? -13 : 0, y: 0 }, right: { x: side > 0 ? 13 : 0, y: 0 } }, 1, snap),
                pose({ tilt: side * 6, crouch: frame % 2 ? 4 : 1, gazeX: side * 0.7, wound: (frame + 1) / 8 }, {
                    left: side < 0 ? { x: -92, y: -22, angle: -120 } : { x: -82, y: 30, angle: -20 },
                    right: side > 0 ? { x: 92, y: -22, angle: 120 } : { x: 82, y: 30, angle: 20 },
                }, 1),
            );
        }

        // The tape has run out. The reels stop; the jukebox buzzes and dies.
        await c.feet({ left: null, right: null }, 1, snap);
        await pose({ spin: 0, tilt: 0, crouch: 0, gazeX: 1 }, REST, 0.02);
        await buzz(box.state, 'draw', 1, 0.2, [70, 110, 50, 200, 60, 90, 40, 180, 50]);
        box.state.draw = 0.2;

        // Its tape crumples, and its own light stutters.
        await pose({ wide: 1, gazeX: 0, crouch: 3 }, { left: { x: -84, y: -24, angle: -150 }, right: { x: 84, y: -24, angle: 150 } }, 1);
        await buzz(s, 'power', 1, 0, [50, 80, 40, 150, 60, 1]);
        await pose({ power: 1, wide: 0, squint: 1, crouch: 0 }, REST, 1);

        // Rewind: fast, shaking, the arches running backwards.
        await c.tween({ spin: -4, squint: 0 }, 1, snap);
        for (let step = 0; step < 6; step++) {
            box.state.draw = [1, 0.8, 0.6][step % 3];
            await pose({ tilt: step % 2 ? 3 : -3, crouch: 4, wound: 1 - (step + 1) / 6 }, {
                left: { x: -97, y: step % 2 ? 8 : -12, angle: -90 }, right: { x: 97, y: step % 2 ? -12 : 8, angle: 90 },
            }, 0.5);
        }

        // Ready again: everything strikes on, arms up.
        box.state.draw = 1;
        await pose({ spin: 0, tilt: 0, crouch: 0, wide: 1 }, UP, 1);
        await pose({ wide: 0 }, {}, 1);

        // And it plays on, the jukebox blinking against its nod.
        await c.tween({ spin: 1 }, 1, snap);
        for (let frame = 0; frame < 4; frame++) {
            box.state.draw = frame % 2 ? 1 : 0.6;
            await pose({ crouch: frame % 2 ? 0 : 4, tilt: frame % 2 ? 0 : -4 }, frame ? {} : { left: { x: -82, y: 30, angle: -20 }, right: { x: 82, y: 30, angle: 20 } }, 1);
        }
        box.state.draw = 1;
        await pose({ spin: 0, tilt: 0, crouch: 0 }, REST, 1);
        await pose({ lid: 0 }, {}, 0.25);
        await pose({ lid: 1 }, {}, 2);
    },
};
