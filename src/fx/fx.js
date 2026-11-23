// Effects: short-lived drawings that are not part of a character. Sparks,
// dust, an aura, a bolt. Everything is driven by the clock and by a seeded
// random generator, and everything removes itself when it is over.

import { createRandom } from '../core/random.js';

const f = n => n.toFixed(1);

/**
 * @param {object} options
 * @param {object} options.stage
 * @param {object} options.clock
 * @param {number} [options.seed]
 * @param {string} [options.name] layer name; create the fx before a figure to
 *        draw behind it, after to draw in front
 */
export function createFx({ stage, clock, seed = 1, name = 'fx' }) {
    const layer = stage.layer(name);
    const random = createRandom(seed);
    const running = new Set();
    let off = null;

    const add = step => {
        const entry = { step };
        running.add(entry);
        if (!off) {
            off = clock.onFrame(dt => {
                for (const e of [...running]) if (running.has(e)) e.step(dt);
                if (!running.size && off) { off(); off = null; }
            });
        }
        return () => running.delete(entry);
    };

    const fx = {
        layer,
        /** Random number in [0, 1). */
        random,
        /** Random number in [a, b). */
        range: (a, b) => a + (b - a) * random(),

        /** True when nothing is playing. */
        get idle() { return running.size === 0; },

        /**
         * Calls fn(dt in ms) on every tick until the returned function is called.
         * @returns {() => void} stop
         */
        each(fn) {
            return add(fn);
        },

        /**
         * A particle system: many moving streaks drawn as a single path.
         * Positions are page pixels, speeds pixels per second.
         * @returns {{ emit(p: object): void, close(): void, count: number }}
         *          emit({ x, y, vx, vy, life?, trail?, ax?, ay?, drag?, curl? });
         *          close() lets the system remove itself once it is empty.
         */
        particles({ color = 'var(--fig-ink, currentColor)', width = 2, opacity = 1 } = {}) {
            const path = stage.el('path', layer, {
                fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', opacity,
            });
            const list = [];
            let closed = false;
            const remove = add(dt => {
                const h = dt / 1000;
                let d = '';
                for (let i = list.length - 1; i >= 0; i--) {
                    const p = list[i];
                    p.age += h;
                    if (p.age >= p.life) { list.splice(i, 1); continue; }
                    if (p.curl) {
                        const c = Math.cos(p.curl * h), s = Math.sin(p.curl * h);
                        const vx = p.vx * c - p.vy * s;
                        p.vy = p.vx * s + p.vy * c;
                        p.vx = vx;
                    }
                    p.vx += p.ax * h; p.vy += p.ay * h;
                    if (p.drag) { const keep = Math.max(0, 1 - p.drag * h); p.vx *= keep; p.vy *= keep; }
                    p.x += p.vx * h; p.y += p.vy * h;
                    // The streak shortens as the particle ages, down to a dot.
                    const t = p.trail * (1 - p.age / p.life);
                    d += `M${f(p.x)} ${f(p.y)}L${f(p.x - p.vx * t)} ${f(p.y - p.vy * t)}`;
                }
                path.setAttribute('d', d);
                if (closed && !list.length) { path.remove(); remove(); }
            });
            return {
                emit(p) {
                    list.push({ age: 0, life: 0.4, trail: 0.06, ax: 0, ay: 0, drag: 0, curl: 0, ...p });
                },
                close() { closed = true; },
                get count() { return list.length; },
            };
        },

        /**
         * A temporary SVG element, updated on every tick and removed after `life` ms.
         * @param {object} options
         * @param {number} options.life
         * @param {string} [options.tag]
         * @param {object} [options.attrs]
         * @param {(el: Element, p: number, dt: number) => void} options.update p goes 0 -> 1
         * @returns {{ done: Promise<void>, stop(): void }}
         */
        shape({ life, tag = 'path', attrs = {}, update }) {
            const el = stage.el(tag, layer, {
                fill: 'none', stroke: 'var(--fig-ink, currentColor)', 'stroke-width': 2,
                'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs,
            });
            let age = 0, finish;
            const done = new Promise(resolve => { finish = resolve; });
            const end = () => { el.remove(); remove(); finish(); };
            const remove = add(dt => {
                age += dt;
                if (age >= life) { end(); return; }
                update(el, age / life, dt);
            });
            update(el, 0, 0);
            return { done, stop: end };
        },

        destroy() {
            running.clear();
            if (off) { off(); off = null; }
            layer.remove();
        },
    };

    return fx;
}
