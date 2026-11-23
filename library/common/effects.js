// Special effects, ready to use in an animation: each is drawn at a point of
// the page, in a colour, at a size. They are what the atelier shows under
// "Effects". An effect is
//
//   { play(fx, [x, y], { k, color }), every?: ms }
//
// `fx` is what an animation receives as `ctx.api.fx`; the point is in page
// pixels (a figure's hand: `c.figure.points.armR.tip`); `k` is pixels per
// character unit (`c.figure.k`), so that an effect is the size of who makes it;
// `every` is how often the atelier plays it again to show it.
// In an animation: `effects.clash.play(ctx.api.fx, point, { k: c.figure.k, color: '#2f7df6' })`.

import { effects as ready } from 'figurant';

export const effects = {
    /** Short lines flying out: an impact, an accent. */
    burst: { play: (fx, at, options) => ready.burst(fx, at, { count: 12, ...options }) },
    /** Dust kicked up along the ground. */
    dust: { play: (fx, [x, y], options) => ready.dust(fx, [x, y + 90 * (options?.k ?? 1)], options) },
    /** A ring that grows and fades. */
    shockwave: { play: (fx, at, options) => { ready.shockwave(fx, at, { size: 60, ...options }); } },
    /** A star of rays, open and shut in an instant. */
    flash: { play: (fx, at, options) => { ready.flash(fx, at, { size: 34, ...options }); }, every: 900 },
    /** Lightning between two points. */
    bolt: { play: (fx, [x, y], options) => { const k = options?.k ?? 1; ready.bolt(fx, [x - 110 * k, y + 20 * k], [x + 110 * k, y - 30 * k], { life: 900, ...options }); }, every: 1500 },
    /** Arcs leaving a point, one after the other. */
    wave: { play: (fx, [x, y], options) => ready.wave(fx, [x - 60 * (options?.k ?? 1), y], 0, { reach: 120, count: 5, ...options }), every: 1500 },
    /** Two blades meeting: a ring, a star, sparks. */
    clash: {
        play(fx, at, options) {
            ready.shockwave(fx, at, { size: 40, ...options });
            ready.flash(fx, at, { size: 26, ...options });
            ready.burst(fx, at, { count: 14, speed: 220, ...options });
        },
    },
    /** A landing: a flat ring on the floor, and dust. */
    landing: {
        play(fx, [x, y], options) {
            const floor = [x, y + 90 * (options?.k ?? 1)];
            ready.shockwave(fx, floor, { size: 50, flat: 0.25, ...options });
            ready.dust(fx, floor, { count: 16, ...options });
        },
    },
};
