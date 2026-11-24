// The sheet writes itself: 天, stroke after stroke, then 地, then the seal;
// a moment to look; and the paper is white again.

import { easing } from 'figurant';

const { easeOut, easeInOut } = easing;

export const appearInkSheet = {
    character: 'ink-sheet',
    room: { left: 40, right: 40, up: 160 },

    async play(c) {
        c.onLeave(() => { c.tween({ heaven: 0, earth: 0, seal: 0 }, 1).catch(() => {}); });
        for (let stroke = 1; stroke <= 4; stroke++) { await c.tween({ heaven: stroke }, 520, easeOut); await c.wait(220); }
        await c.wait(400);
        for (let stroke = 1; stroke <= 6; stroke++) { await c.tween({ earth: stroke }, 460, easeOut); await c.wait(200); }
        await c.tween({ seal: 1 }, 400, easeOut);
        await c.wait(2000);
        await c.tween({ heaven: 0, earth: 0, seal: 0 }, 900, easeInOut);
    },
};
