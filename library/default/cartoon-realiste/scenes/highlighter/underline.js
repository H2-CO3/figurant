// The highlighter underlines: it walks a few steps leaving a stroke of colour
// on the ground, turns its tip back to look at it, and walks off pleased.

import { easing, moves } from 'figurant';

const { easeInOut, easeOutBack } = easing;

export const underlineHighlighter = {
    character: 'highlighter',
    room: { left: 40, right: 140, up: 120 },
    variants: [{ name: 'left', room: { left: 140, right: 40, up: 120 } }],

    async play(c, { variant }) {
        const s = c.state, k = c.figure.k, side = variant === 'left' ? -1 : 1, home = s.x;
        c.onLeave(() => { s.mark = 0; });

        // It dips its tip, as one presses a pen down, then walks: the stroke follows.
        await c.tween({ crouch: 6, lid: 0.3 }, 260, easeInOut);
        c.also({ crouch: 0, lid: 1 }, 300, easeOutBack);
        c.animate(s, { mark: 1 }, 1500, easing.linear).catch(() => {});
        await moves.walkTo(c, home + side * 90 * k, 0.6);

        // It turns its tip back to look at what it did.
        await c.tween({ gazeX: -side, gazeY: 0.6 }, 320, easeInOut);
        await c.wait(840);
        c.also({ wide: 0.5 }, 160);
        await moves.hop(c, 14);
        c.also({ wide: 0 }, 300);
        await c.wait(840);

        // The stroke dries away; it goes back to its place.
        await c.tween({ mark: 0 }, 600);
        await moves.walkTo(c, home, 0.8);
        await c.tween({ gazeX: 0, gazeY: 0 }, 240);
    },
};
