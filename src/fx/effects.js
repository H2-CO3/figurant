// Ready-made effects built on createFx(). Sizes are given through `k`, the
// number of pixels per character unit, so an effect matches its character.

const TAU = Math.PI * 2;
const f = n => n.toFixed(1);
const INK = 'var(--fig-ink, currentColor)';

/** Short lines flying out from a point: an impact, a spark, an accent. */
export function burst(fx, [x, y], { k = 1, count = 8, speed = 160, life = 0.28, color = INK, width = 2, arc = [0, TAU] } = {}) {
    const system = fx.particles({ color, width });
    for (let i = 0; i < count; i++) {
        const a = fx.range(arc[0], arc[1]);
        const v = speed * k * fx.range(0.6, 1.2);
        system.emit({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * fx.range(0.7, 1.2), trail: 0.07, drag: 3 });
    }
    system.close();
}

/** Dust kicked up along the ground, to both sides. */
export function dust(fx, [x, y], { k = 1, count = 10, color = INK } = {}) {
    const system = fx.particles({ color, width: 1.6 * Math.max(1, k * 0.6), opacity: 0.55 });
    for (let i = 0; i < count; i++) {
        const side = i % 2 ? 1 : -1;
        system.emit({
            x: x + side * fx.range(4, 14) * k, y: y - fx.range(0, 3) * k,
            vx: side * fx.range(40, 130) * k, vy: -fx.range(10, 55) * k,
            ay: 60 * k, drag: 3.5, life: fx.range(0.3, 0.6), trail: 0.05,
        });
    }
    system.close();
}

/**
 * A flame-shaped aura around a figure: a flickering outline plus streaks
 * rising along the body. Its strength follows `aura.level` (0..1), which a
 * sequence can tween.
 * @returns {{ level: number, stop(): void }}
 */
export function aura(fx, figure, { color = 'var(--fig-accent, #d9a400)' } = {}) {
    const streaks = fx.particles({ color, width: 2.5 });
    const state = { level: 0, stop: null };
    const shells = [0, 1].map(i => ({ phase: i * 2.1, size: 1 - i * 0.2, el: null }));
    let time = 0, debt = 0, stopped = false;

    const make = () => {
        for (const shell of shells) {
            shell.handle = fx.shape({
                life: Infinity,
                attrs: { stroke: color, 'stroke-width': 2.5, fill: color, 'fill-opacity': 0.1 },
                update: el => { shell.el = el; },
            });
        }
    };
    make();

    const stop = fx.each(dt => {
        time += dt;
        const L = Math.max(0, Math.min(1, state.level));
        const k = figure.k;
        const [cx] = figure.points.centre;
        const ground = figure.points.ground;
        const height = ground - figure.points.top[1] + 16 * k;
        const cy = ground - height * 0.5;
        const rx = 30 * k * (0.75 + 0.5 * L), ry = height * 0.6 * (1 + 0.15 * L);

        for (const shell of shells) {
            if (!shell.el) continue;
            let d = '';
            const steps = 44;
            for (let i = 0; i <= steps; i++) {
                const a = (i / steps) * TAU;
                const up = Math.max(0, Math.cos(a));
                // Flames lick upwards: the wobble travels up the outline, and the top is pointed.
                const wobble = 1 + L * (0.11 * Math.sin(a * 6 + time * 0.016 + shell.phase)
                    + 0.08 * Math.sin(a * 11 - time * 0.023 + shell.phase * 2)) * (0.4 + up);
                const x = cx + Math.sin(a) * rx * shell.size * wobble;
                const y = Math.min(ground, cy - Math.cos(a) * ry * shell.size * wobble * (1 + 0.7 * up * up * up));
                d += `${i ? 'L' : 'M'}${f(x)} ${f(y)}`;
            }
            shell.el.setAttribute('d', d + 'Z');
            shell.el.setAttribute('opacity', (Math.min(1, L * 1.3) * (shell.size > 0.9 ? 0.95 : 0.6)).toFixed(2));
        }

        // Rising streaks: more of them as the aura grows.
        debt += (dt / 1000) * 150 * L;
        while (debt >= 1) {
            debt -= 1;
            const side = fx.range(-1, 1);
            streaks.emit({
                x: cx + side * rx * 0.9, y: ground - fx.range(0, height * 0.75),
                vx: side * 25 * k, vy: -fx.range(130, 260) * k,
                life: fx.range(0.25, 0.5), trail: 0.08,
            });
        }
    });

    state.stop = () => {
        if (stopped) return;
        stopped = true;
        stop();
        streaks.close();
        for (const shell of shells) shell.handle.stop();
    };
    return state;
}
