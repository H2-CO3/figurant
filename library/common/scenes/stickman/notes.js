// Made for the stick figure: the chair, the couch and every hand position are
// fitted to its proportions. Another character needs its own adapted copy.
//
// The figure sits on a chair beside an empty couch, and takes
// notes. It looks up at the visitor, nods, writes, and starts again.
// Shows furniture, held props, and a scene that loops until it is interrupted.

import { easing, props } from 'figurant';

const { easeOut, easeInOut } = easing;
const { chair, couch, notebook, pen } = props;

/** How much room the scene needs, and its smaller version without the couch. */
export const takeNotesScene = {
    character: 'stickman',
    room: { left: 20, right: 180, up: 100 },
    variants: [{ name: 'compact', room: { left: 20, right: 45, up: 100 } }],
    play: takeNotes,
};

/**
 * @param {object} c sequence context
 * @param {object} [ctx]
 * @param {string} [ctx.variant] 'compact' leaves the couch out
 */
export async function takeNotes(c, { variant = 'full' } = {}) {
    // The furniture draws itself in.
    const seat = c.prop(chair, { behind: true, state: { draw: 0 } });
    const drawing = [c.animate(seat.state, { draw: 1 }, 380)];
    if (variant !== 'compact') {
        const sofa = c.prop(couch, { x: 112, behind: true, state: { draw: 0 } });
        drawing.push(c.animate(sofa.state, { draw: 1 }, 520));
    }
    await c.all(...drawing);

    // Sit down, with a little settle.
    await c.tween({ seat: 1, squash: 0.35 }, 300, easeInOut);
    await c.tween({ squash: 0 }, 220, easeOut);

    // Notebook in the left hand, pen in the right.
    const book = c.give('left', notebook, { tilt: -12, state: { draw: 0 } });
    const quill = c.give('right', pen, { tilt: 28, state: { draw: 0 } });
    const rest = { left: { x: 13, y: 6, angle: 150 }, right: { x: 21, y: -3, angle: -160 } };
    await c.all(
        c.hands(rest, 320),
        c.animate(book.state, { draw: 1 }, 320),
        c.animate(quill.state, { draw: 1 }, 320),
    );

    for (;;) {
        // Look up at the visitor, and nod.
        await c.tween({ gazeX: 0, gazeY: -0.2 }, 260);
        await c.wait(700);
        for (let i = 0; i < 2; i++) {
            await c.tween({ tilt: 5, gazeY: 0.5 }, 170);
            await c.tween({ tilt: 0, gazeY: -0.2 }, 190);
        }
        await c.wait(250);

        // Back to the page: a few lines of writing.
        await c.tween({ gazeX: 0.9, gazeY: 0.9, tilt: 3 }, 240);
        for (let line = 0; line < 3; line++) {
            for (let stroke = 0; stroke < 4; stroke++) {
                await c.hands({ right: { x: 19 + stroke * 1.6, y: -4 + line * 2.2 + (stroke % 2 ? 1.2 : 0), angle: -160 } }, 80);
            }
            await c.wait(120);
        }
        await c.hands({ right: rest.right }, 200);
        await c.tween({ tilt: 0 }, 200);
    }
}
