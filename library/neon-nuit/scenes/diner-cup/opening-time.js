// Opening time. The cup is a dark sign beside a dark "OPEN" sign. It strikes
// on, counts the letters in one by one (a wisp of steam for each), the sign
// buzzes and dies, the cup stamps its foot, the sign strikes back, and the
// two of them blink together like the window of a diner at night.
//
// Written the way neon moves: every pose is switched, never glided, and held
// for a beat. Its feet never leave the floor, except the one it stamps.

import { openSign } from '../../props/open-sign.js';

/** No in-between: the old pose, then the new one. */
const snap = p => (p < 1 ? 0 : 1);
const BEAT = 375;

export const openingTimeDinerCup = {
    character: 'diner-cup',
    room: { left: 160, right: 70, up: 175 },

    async play(c) {
        const s = c.state;
        c.onLeave(() => { s.power = 1; s.chase = 1; s.steam = 0; });
        const sign = c.prop(openSign, { x: -104, y: 0, behind: true, state: { draw: 0.2 } });
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
        const POINT = { left: { x: -64, y: -38, angle: -140 }, right: { x: 62, y: 24, angle: 20 } };

        // Dark: two cold signs.
        await pose({ power: 0, chase: 0, steam: 0 }, REST, 2);

        // It strikes: a stutter, then a flash.
        await buzz(s, 'power', 0, 1, [60, 90, 50, 170, 1]);
        await pose({ power: 1, wide: 1 }, { left: { x: -62, y: -24, angle: -110 }, right: { x: 84, y: -22, angle: 110 } }, 1);
        await pose({ wide: 0 }, REST, 1);

        // The other sign is still dark. A look, a doubt (its heart goes out).
        await pose({ gazeX: -1, gazeY: -0.6 }, {}, 1);
        await pose({ squint: 1, tilt: -5 }, {}, 1);

        // It points, and counts the letters in: O, P, E, N, a wisp for each.
        await pose({ squint: 0, tilt: -6 }, POINT, 1);
        for (let letter = 0; letter < 4; letter++) {
            sign.state.draw = 0.4 + 0.2 * letter;
            const last = letter === 3;
            await pose({ steam: Math.min(3, letter + 1), crouch: letter % 2 ? 0 : 5, wide: last ? 1 : 0 },
                { left: POINT.left, right: letter % 2 ? POINT.right : { x: 78, y: -22, angle: 140 } }, 1);
        }

        // Proud of it: fists on the saucer, steam running.
        await pose({ wide: 0, crouch: 0, tilt: 0, gazeX: 0, gazeY: 0, chase: 1 }, { left: { x: -44, y: 14, angle: 40 }, right: { x: 52, y: 22, angle: -40 } }, 2);

        // The sign buzzes, and dies.
        await pose({ gazeX: -1, gazeY: -0.6 }, {}, 0.02);
        await buzz(sign.state, 'draw', 1, 0.2, [70, 110, 50, 200, 60, 90, 40, 260, 50]);
        sign.state.draw = 0.2;
        await pose({ squint: 1, chase: 0, steam: 0, tilt: -5 }, REST, 2);

        // Two stamps of the foot; on the second, everything strikes back.
        for (let stamp = 0; stamp < 2; stamp++) {
            await c.all(c.tween({ crouch: 0, tilt: 5 }, 1, snap), c.feet({ left: { x: -6, y: 15, pitch: 20 } }, 1, snap));
            await c.wait(BEAT / 2);
            await c.all(c.tween({ crouch: 5, tilt: -4 }, 1, snap), c.feet({ left: { x: -2, y: 0 } }, 1, snap));
            if (stamp) sign.state.draw = 1;
            await c.wait(BEAT / 2);
        }
        await c.feet({ left: null }, 1, snap);
        await pose({ squint: 0, wide: 1, crouch: 0, tilt: 0 }, { left: { x: -62, y: -24, angle: -110 }, right: { x: 84, y: -22, angle: 110 } }, 1);

        // The two-frame sign: one pose, the other, and the "OPEN" blinks against the beat.
        await c.tween({ wide: 0, chase: 1, gazeX: 0, gazeY: 0 }, 1, snap);
        for (let frame = 0; frame < 8; frame++) {
            const side = frame % 2 ? 1 : -1;
            sign.state.draw = frame % 2 ? 0.2 : 1;
            await pose({ tilt: side * 7, crouch: frame % 2 ? 5 : 0, gazeX: side * 0.6 }, {
                left: side < 0 ? { x: -60, y: -40, angle: -160 } : { x: -52, y: 12, angle: -40 },
                right: side > 0 ? { x: 74, y: -36, angle: 160 } : { x: 70, y: 22, angle: 40 },
            }, 1);
        }

        // Open for the night.
        sign.state.draw = 1;
        await pose({ tilt: 0, crouch: 0, gazeX: 0 }, REST, 1);
        await pose({ lid: 0 }, {}, 0.25);
        await pose({ lid: 1 }, {}, 2);
    },
};
