// The teapot pours itself a cup. What a teapot does best: a table and a cup
// appear at its side, it leans, the tea falls, the cup fills, and it stands
// back up, pleased, in a cloud of steam.

import { easing, moves } from 'figurant';
import { teaTable, teacup, tea, stream, TABLE } from '../../props/tea-table.js';

const { easeOut, easeInOut, easeOutBack } = easing;

/** The table stands under the spout once the teapot leans. */
const TABLE_X = 108;
/** The teapot's middle above the floor when standing: its hips (53) on legs of 36. */
const STANDING = 89;
const LEAN = 24;

export const pourTeapot = {
    character: 'teapot',
    room: { left: 110, right: 150, up: 150 },

    async play(c) {
        const s = c.state, x0 = s.x / c.figure.k;
        c.onLeave(() => { s.steam = 0; });

        const table = c.prop(teaTable, { x: x0 + TABLE_X, state: { draw: 0 } });
        const cup = c.prop(teacup, { x: x0 + TABLE_X, y: -TABLE, state: { draw: 0 } });
        await c.animate(table.state, { draw: 1 }, 420);
        await c.animate(cup.state, { draw: 1 }, 360);

        // It looks at the cup, and leans.
        await moves.glance(c, 1, 0.6, 420);
        c.also({ squint: 0.4 }, 300);
        await c.tween({ tilt: LEAN, crouch: 4 }, 520, easeInOut);

        // Where the spout is now: its tip turned with the body.
        const a = LEAN * Math.PI / 180, tipX = 107 * Math.cos(a) + 30 * Math.sin(a), tipY = 107 * Math.sin(a) - 30 * Math.cos(a) + 4;
        const drop = STANDING - tipY - TABLE - 16;
        const pour = c.prop(stream(drop), { x: x0 + tipX, y: tipY - STANDING, state: { draw: 0 } });
        await c.animate(pour.state, { draw: 1 }, 260, easeOut);
        const filled = c.prop(tea, { x: x0 + TABLE_X, y: -TABLE - 16.4, state: { draw: 0 } });
        await c.animate(filled.state, { draw: 1 }, 900, easeInOut);
        await c.wait(420);

        // Enough. It stands back up; the cup steams, and so does it.
        await c.animate(pour.state, { draw: 0 }, 220);
        c.also({ squint: 0, steam: 0.9 }, 500, easeOut);
        await c.tween({ tilt: 0, crouch: 0 }, 460, easeOutBack);
        await c.tween({ gazeX: 0, gazeY: 0 }, 240);
        await moves.blink(c);
        await c.wait(1680);
        c.also({ steam: 0 }, 900);
        await c.wait(840);
    },
};
