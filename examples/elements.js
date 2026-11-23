// Example effects: five elemental releases, thrown from a point in a direction.
// They only use the public fx API (particles, shape, each).

import { easeOutBack, easeIn } from '../src/core/easing.js';
import { burst, dust } from '../src/fx/effects.js';

const f = n => n.toFixed(1);

export const COLORS = {
    fire: 'var(--fig-fire, #e2571c)',
    water: 'var(--fig-water, #2a7fd4)',
    lightning: 'var(--fig-bolt, #d9a400)',
    wind: 'var(--fig-wind, #7d8a96)',
    earth: 'var(--fig-earth, #7a5a3a)',
};

// Emits particles at a steady rate for `ms`, then lets the system die out.
function stream(fx, ms, perSecond, options, make) {
    const system = fx.particles(options);
    let age = 0, debt = 0;
    const stop = fx.each(dt => {
        age += dt;
        if (age >= ms) { stop(); system.close(); return; }
        debt += (dt / 1000) * perSecond;
        while (debt >= 1) { debt -= 1; system.emit(make(age / ms)); }
    });
}

export const ELEMENTS = {
    /** A roaring cone of flame that curls upwards. */
    fire(fx, [x, y], { k, dir }) {
        for (const [color, width, rate] of [[COLORS.fire, 3, 150], ['var(--fig-flame, #f2a51f)', 2, 90]]) {
            stream(fx, 750, rate, { color, width }, () => ({
                x, y: y + fx.range(-4, 4) * k,
                vx: dir * fx.range(240, 430) * k, vy: fx.range(-110, 90) * k,
                ay: -260 * k, drag: 1.4, curl: fx.range(-3, 3),
                life: fx.range(0.3, 0.6), trail: 0.07,
            }));
        }
    },

    /** A jet of water that arcs and falls. */
    water(fx, [x, y], { k, dir }) {
        stream(fx, 800, 190, { color: COLORS.water, width: 3 }, p => ({
            x, y: y + fx.range(-3, 3) * k,
            vx: dir * fx.range(230, 360) * k, vy: -fx.range(60, 190) * k * (1 - 0.4 * p),
            ay: 620 * k, life: fx.range(0.5, 0.85), trail: 0.045,
        }));
    },

    /** Forked bolts, redrawn every few frames so they crackle. */
    lightning(fx, [x, y], { k, dir }) {
        const reach = 150 * k;
        const bolt = (toX, toY, jitter, parts) => {
            let d = `M${f(x)} ${f(y)}`;
            for (let i = 1; i <= parts; i++) {
                const t = i / parts, edge = i === parts ? 0 : 1;
                d += `L${f(x + (toX - x) * t + fx.range(-1, 1) * jitter * 0.4 * edge)} ${f(y + (toY - y) * t + fx.range(-1, 1) * jitter * edge)}`;
            }
            return d;
        };
        let since = 99, d = '';
        fx.shape({
            life: 560,
            attrs: { stroke: COLORS.lightning, 'stroke-width': 2.5 },
            update(el, p, dt) {
                since += dt;
                if (since > 45) {
                    since = 0;
                    d = bolt(x + dir * reach, y + fx.range(-18, 18) * k, 13 * k, 9)
                        + bolt(x + dir * reach * 0.7, y - fx.range(20, 55) * k, 10 * k, 6)
                        + bolt(x + dir * reach * 0.75, y + fx.range(20, 50) * k, 10 * k, 6);
                    el.setAttribute('d', d);
                    el.setAttribute('opacity', fx.range(0.55, 1).toFixed(2));
                }
            },
        });
        burst(fx, [x, y], { k, count: 10, speed: 190, color: COLORS.lightning });
    },

    /** Gusts: curls of air that roll forward and unwind. */
    wind(fx, [x, y], { k, dir }) {
        for (let i = 0; i < 7; i++) {
            const delay = i * 70;
            const y0 = y + fx.range(-22, 18) * k;
            const size = fx.range(7, 13) * k, spin = fx.random() < 0.5 ? -1 : 1;
            const speed = fx.range(210, 300) * k;
            fx.shape({
                life: delay + 620,
                attrs: { stroke: COLORS.wind, 'stroke-width': 2.5 },
                update(el, p) {
                    const t = (p * (delay + 620) - delay) / 620;
                    if (t < 0) { el.setAttribute('d', ''); return; }
                    // A streak that ends in a curl; the whole thing travels and rolls.
                    const cx = x + dir * speed * 0.62 * t, r = size * (0.5 + t);
                    let d = `M${f(cx - dir * size * 3.2 * (1 - t * 0.5))} ${f(y0 + spin * r)}`;
                    for (let j = 0; j <= 14; j++) {
                        const a = (j / 14) * Math.PI * 1.6 + t * 5;
                        const rr = r * (1 - 0.55 * (j / 14));
                        d += `L${f(cx + dir * Math.sin(a) * rr)} ${f(y0 + spin * Math.cos(a) * rr)}`;
                    }
                    el.setAttribute('d', d);
                    el.setAttribute('opacity', (1 - t * t).toFixed(2));
                },
            });
        }
    },

    /** Rock spikes that erupt from the ground one after the other. */
    earth(fx, [x], { k, dir, ground }) {
        for (let i = 0; i < 5; i++) {
            const delay = 40 + i * 75;
            const base = x + dir * (26 + i * 30) * k;
            const height = (26 + i * 9) * k, half = (9 + i * 1.5) * k;
            const lean = dir * (4 + i * 2) * k;
            fx.shape({
                life: delay + 900,
                attrs: { stroke: COLORS.earth, 'stroke-width': 2.5, fill: 'var(--fig-paper, #fff)' },
                update(el, p) {
                    const t = p * (delay + 900) - delay;
                    if (t < 0) { el.setAttribute('d', ''); return; }
                    // Erupt fast, stand, then sink back.
                    const rise = t < 160 ? easeOutBack(t / 160) : t > 650 ? 1 - easeIn((t - 650) / 250) : 1;
                    const h = height * Math.max(0, rise);
                    el.setAttribute('d',
                        `M${f(base - half)} ${f(ground)}L${f(base + lean)} ${f(ground - h)}L${f(base + half)} ${f(ground)}`);
                    if (!el.kicked) { el.kicked = true; dust(fx, [base, ground], { k, count: 6, color: COLORS.earth }); }
                },
            });
        }
    },
};
