// The teapot takes notes. An adaptation of the stick figure's scene
// (../stickman/notes.js) to another body, not a reuse of it: a teapot is
// wider than a chair and its arms do not meet across its belly, so it sits on
// a pouffe and writes in a notebook lying on a small table at its side. What
// it thinks shows the way a teapot shows it: steam, and a lid that hops.

import { easing, moves } from 'figurant';
import { pouffe, desk, written, quill, divan, DESK } from '../../props/teapot-study.js';

const { easeOut, easeInOut, easeOutBack } = easing;

/** Where the table stands, from the teapot's middle; its page is within reach of the right hand. */
const DESK_X = 112;
/** Where the divan stands: past the table, with air between them. */
const DIVAN_X = 284;
/** The teapot's middle above the floor once seated: its hips (52) on a seat of 21. */
const SEATED = 73;
/** A point of the desk, in the units c.hands expects (from the teapot's middle). */
const onDesk = (x, y) => ({ x: DESK_X + x, y: SEATED + y });

export const notesTeapot = {
    character: 'teapot',
    room: { left: 110, right: DIVAN_X + 124, up: 150 },
    variants: [{ name: 'compact', room: { left: 110, right: DESK_X + 40, up: 150 } }],

    async play(c, { variant = 'full' } = {}) {
        const s = c.state, x0 = s.x / c.figure.k;

        // The furniture draws itself in.
        const seat = c.prop(pouffe, { x: x0, behind: true, state: { draw: 0 } });
        const table = c.prop(desk, { x: x0 + DESK_X, state: { draw: 0 } });
        const drawing = [c.animate(seat.state, { draw: 1 }, 380), c.animate(table.state, { draw: 1 }, 460)];
        if (variant !== 'compact') {
            const sofa = c.prop(divan, { x: x0 + DIVAN_X, behind: true, state: { draw: 0 } });
            drawing.push(c.animate(sofa.state, { draw: 1 }, 560));
        }
        await c.all(...drawing);

        // It sits down: heavy, with a settle, and the lid clinks.
        await c.tween({ seat: 1, squash: 0.4 }, 320, easeInOut);
        c.also({ wide: 0.5 }, 90, easeOut);
        await c.tween({ squash: 0 }, 260, easeOutBack);
        c.also({ wide: 0 }, 260);

        // The pen in its right hand, resting above the page.
        const pen = c.give('right', quill, { tilt: -24, state: { draw: 0 } });
        const rest = { ...onDesk(-8, -DESK - 22), angle: 60 };
        await c.all(c.hands({ right: rest }, 320), c.animate(pen.state, { draw: 1 }, 320));

        const lines = [];
        for (;;) {
            // It listens: looks up at the visitor, nods, and thinks — steam rises.
            await c.tween({ gazeX: 0, gazeY: -0.2, tilt: 0 }, 260);
            await c.wait(600);
            c.also({ steam: 0.9 }, 700, easeOut);
            for (let i = 0; i < 2; i++) {
                await c.tween({ tilt: 4, gazeY: 0.5 }, 180);
                await c.tween({ tilt: 0, gazeY: -0.2 }, 200);
            }
            await c.wait(400);
            c.also({ steam: 0 }, 900);

            // Back to the page: three lines, each staying where it was written.
            await c.tween({ gazeX: 0.9, gazeY: 0.8, tilt: 3 }, 240);
            if (lines.length >= 3) {
                // The page is full: it turns it.
                await c.all(...lines.splice(0).map(line => c.animate(line.state, { draw: 0 }, 200)));
            }
            for (let row = lines.length; row < 3; row++) {
                const from = onDesk(-17, -DESK - 11.6 + row * 3), length = 13 - row * 2;
                const line = c.prop(written(length), { x: x0 + from.x, y: from.y - SEATED, state: { draw: 0 } });
                lines.push(line);
                await c.hands({ right: { ...from, y: from.y - 5, angle: 60 } }, 140);
                await c.all(
                    c.hands({ right: { x: from.x + length, y: from.y - 5 + length * 0.14, angle: 60 } }, 420, easeInOut),
                    c.animate(line.state, { draw: 1 }, 420, easeInOut),
                );
                await c.wait(140);
            }
            await c.hands({ right: rest }, 220);
            await moves.blink(c);
            await c.tween({ tilt: 0 }, 200);
        }
    },
};
