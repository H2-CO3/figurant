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
    /** Water thrown up from a point of its surface: drops that fall back, a flat ring. */
    splash: {
        play(fx, [x, y], options) {
            const k = options?.k ?? 1, drops = fx.particles({ color: options?.color, width: 1.8 * k });
            for (let i = 0; i < 12; i++) drops.emit({ x: x + fx.range(-6, 6) * k, y, vx: fx.range(-55, 55) * k, vy: -fx.range(70, 170) * k, ay: 420 * k, life: fx.range(0.45, 0.8), trail: 0.03 });
            drops.close();
            ready.shockwave(fx, [x, y], { size: 30, flat: 0.22, width: 1.6, ...options });
        },
    },
    /** Rings on still water, one after the other. */
    ripple: {
        play(fx, at, options) {
            ready.shockwave(fx, at, { size: 26, flat: 0.2, life: 900, width: 1.4, ...options });
            ready.shockwave(fx, at, { size: 44, flat: 0.2, life: 1300, width: 1.1, ...options });
        },
        every: 1600,
    },
    /** Air coming up through water: small rings that rise, wobble and are gone. */
    bubbles: {
        play(fx, [x, y], options) {
            const k = options?.k ?? 1;
            for (let i = 0; i < 7; i++) {
                const from = x + fx.range(-16, 16) * k, r = fx.range(1.4, 3.6) * k, rise = fx.range(14, 34) * k, swing = fx.range(0, 6.28), late = fx.range(0, 0.4);
                fx.shape({
                    life: 900, tag: 'circle', attrs: { r: r.toFixed(2), 'stroke-width': 1.1 * k, ...(options?.color ? { stroke: options.color } : {}) },
                    update(el, p) {
                        const q = Math.max(0, (p - late) / (1 - late));
                        el.setAttribute('cx', (from + Math.sin(swing + q * 7) * 2.5 * k).toFixed(2));
                        el.setAttribute('cy', (y - q * rise).toFixed(2));
                        el.setAttribute('opacity', (q <= 0 ? 0 : Math.min(1, (1 - q) * 3)).toFixed(2));
                    },
                });
            }
        },
        every: 1100,
    },
    /** Foam left behind on the water by what goes through it: dashes that trail back and fade (`way`: -1 trails to the left). */
    wake: {
        play(fx, [x, y], options) {
            const k = options?.k ?? 1, way = options?.way ?? -1, foam = fx.particles({ color: options?.color, width: 1.5 * k });
            for (let i = 0; i < 6; i++) foam.emit({ x: x + way * fx.range(0, 12) * k, y: y + fx.range(-2.5, 2.5) * k, vx: way * fx.range(26, 60) * k, vy: 0, drag: 1.6, life: fx.range(0.5, 1), trail: 0.22 });
            foam.close();
        },
        every: 500,
    },
};
