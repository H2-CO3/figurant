// The quay draws near: seen from a boat, it is the land that comes, fast at
// first, slower as one comes alongside. `data.by`: how far it comes
// (character units; negative: from the right), `data.over`: in how long.
// Alone, it comes a little way and goes back.

import { easing } from 'figurant';

const { easeOut, easeInOut } = easing;

export const drawNearHarbourQuay = {
    character: 'harbour-quay',
    room: { left: 20, right: 160, up: 160 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, from = s.x;
        if (ctx?.data?.by === undefined) { await c.tween({ x: from - 40 * k }, 1600, easeOut); await c.wait(600); await c.tween({ x: from }, 1600, easeInOut); return; }
        await c.tween({ x: from + ctx.data.by * k }, ctx.data.over ?? 5000, easeOut);
    },
};
