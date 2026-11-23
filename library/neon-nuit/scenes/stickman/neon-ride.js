// Made for the stick figure: a ride without end, at night, on a motorbike of
// light. It leans over the bars; the floor is a grid running under the
// wheels, a skyline slides by, a striped sun sits on the horizon, a ribbon of
// light trails behind. Now and then it looks at you and waves, opens the
// throttle, jumps. It goes on until something else replaces it.
//
// Everything that scrolls is drawn by `ctx.api.fx` on every frame; without it
// (nothing to draw on) the ride is the rider and the bike alone.

import { easing, moves, effects } from 'figurant';

const { easeOut, easeIn, easeInOut } = easing;
const CYAN = '#22e6ff', PINK = '#ff2bd6', VIOLET = '#8b6bff', AMBER = '#ffb347';
/** A tube of light: a wide soft stroke under a bright thin one. */
const tube = (d, colour, weight = 1) => [
    { tag: 'path', attrs: { d, stroke: colour, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.3 }, weight: weight * 3.2 },
    { tag: 'path', attrs: { d, stroke: colour, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, weight },
];
/** The bike, seen from the side, without its wheels. Origin: the floor under the saddle. */
const bike = {
    name: 'light-bike',
    shapes: [
        ...tube('M -30 -15 L -8 -30 L 8 -31 L 22 -24 L 32 -15', CYAN, 1.3),      // rear arm, saddle, tank, fork
        ...tube('M -8 -30 L 2 -14 L 22 -24 M 2 -14 L -30 -15', CYAN, 1),         // the frame under the tank
        ...tube('M 22 -24 L 19 -40 M 14 -42 L 24 -39', PINK, 1.1),               // the bars
        ...tube('M -30 -24 L -44 -27', PINK, 0.9),                               // the tail
        ...tube('M -6 -10 L -26 -8', AMBER, 0.8),                                // the pipe
    ],
    points: { saddle: [0, -30], bars: [19, -40], peg: [3, -13] },
};
/** A wheel: a rim and three spokes, to turn. Origin: its hub. */
const wheel = {
    name: 'light-wheel',
    shapes: [
        { tag: 'circle', attrs: { cx: 0, cy: 0, r: 15, stroke: PINK, opacity: 0.3 }, weight: 4 },
        { tag: 'circle', attrs: { cx: 0, cy: 0, r: 15, stroke: PINK }, weight: 1.3 },
        { tag: 'path', attrs: { d: 'M 0 -13 L 0 13 M -11.3 -6.5 L 11.3 6.5 M -11.3 6.5 L 11.3 -6.5', stroke: CYAN }, weight: 0.6 },
    ],
    points: { hub: [0, 0] },
};

export const neonRideStickman = {
    character: 'stickman',
    room: { left: 120, right: 120, up: 150 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, ground = s.y, fx = ctx?.api?.fx ?? null;
        const air = { up: 0 }, ride = { speed: 1 };
        const frame = c.prop(bike, { x: 0, y: 0, state: { draw: 0 } });
        const wheels = [c.prop(wheel, { x: -30, y: -15, state: { draw: 0 } }), c.prop(wheel, { x: 32, y: -15, state: { draw: 0 } })];
        c.onLeave(() => { s.y = ground; c.feet({ left: null, right: null }, 1).catch(() => {}); c.hands({ left: null, right: null }, 1).catch(() => {}); });

        // The wheels turn, and bike and rider leave the floor together.
        c.onLeave(c.clock.onFrame(dt => {
            for (const turning of wheels) { turning.state.tilt = (turning.state.tilt + 0.9 * ride.speed * dt) % 360; turning.state.y = (-15 - air.up) * k; }
            frame.state.y = -air.up * k;
            s.y = ground - air.up * k;
        }));

        // ── The night it rides through. ──
        if (fx) {
            const mid = c.figure.points.centre[0], floor = c.figure.points.ground, half = 330 * k;
            const forever = (attrs, update) => c.onLeave(fx.shape({ life: 1e12, attrs, update }).stop);
            const road = { grid: 0, city: 0, ribbon: 0 };
            // The sun on the horizon: chords of a disc, closer together towards the top.
            forever({ stroke: AMBER, 'stroke-width': 2 * k, opacity: 0.85 }, el => {
                if (el.getAttribute('d')) return;
                const cx = mid + 70 * k, cy = floor - 44 * k, r = 66 * k;
                let d = `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}A${r.toFixed(1)} ${r.toFixed(1)} 0 0 1 ${(cx + r).toFixed(1)} ${cy.toFixed(1)}`;
                for (const part of [0, 0.2, 0.42, 0.66]) { const y = cy + part * 44 * k, w = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy))); d += `M${(cx - w).toFixed(1)} ${y.toFixed(1)}H${(cx + w).toFixed(1)}`; }
                el.setAttribute('d', d);
            });
            // A skyline, far away, sliding by slowly.
            const blocks = Array.from({ length: 14 }, () => [fx.range(22, 52) * k, fx.range(24, 92) * k]), long = blocks.reduce((sum, [w]) => sum + w, 0);
            forever({ stroke: VIOLET, 'stroke-width': 1.6 * k, opacity: 0.8 }, (el, p, dt) => {
                road.city = (road.city + 16 * k * ride.speed * dt / 1000) % long;
                let x = mid - half - road.city, d = '';
                for (let i = 0; x < mid + half; i++) {
                    const [w, h] = blocks[i % blocks.length], from = Math.max(x, mid - half), till = Math.min(x + w, mid + half);
                    if (till > from) d += `M${from.toFixed(1)} ${floor.toFixed(1)}V${(floor - h).toFixed(1)}H${till.toFixed(1)}V${floor.toFixed(1)}`;
                    x += w;
                }
                el.setAttribute('d', d);
            });
            // The floor: a line of light, and a grid under it that runs towards the rider.
            forever({ stroke: CYAN, 'stroke-width': 5 * k, opacity: 0.25 }, el => el.setAttribute('d', `M${(mid - half).toFixed(1)} ${floor.toFixed(1)}H${(mid + half).toFixed(1)}`));
            forever({ stroke: CYAN, 'stroke-width': 1.6 * k }, el => el.setAttribute('d', `M${(mid - half).toFixed(1)} ${floor.toFixed(1)}H${(mid + half).toFixed(1)}`));
            forever({ stroke: CYAN, 'stroke-width': 1.1 * k, opacity: 0.55 }, (el, p, dt) => {
                const step = 46 * k, deep = 46 * k;
                road.grid = (road.grid + 330 * k * ride.speed * dt / 1000) % step;
                let d = '';
                for (const part of [0.16, 0.4, 0.7, 1]) d += `M${(mid - half).toFixed(1)} ${(floor + deep * part).toFixed(1)}H${(mid + half).toFixed(1)}`;
                for (let x = -half - road.grid; x <= half; x += step) if (x >= -half) d += `M${(mid + x).toFixed(1)} ${floor.toFixed(1)}L${(mid + Math.max(-half, Math.min(half, x * 1.7))).toFixed(1)} ${(floor + deep).toFixed(1)}`;
                el.setAttribute('d', d);
            });
            // The ribbon of light the bike leaves behind, rippling.
            for (const [width, opacity] of [[7, 0.22], [2.2, 0.95]]) forever({ stroke: PINK, 'stroke-width': width * k, opacity }, (el, p, dt) => {
                road.ribbon += dt / 1000;
                const from = c.figure.points.centre[0] - 44 * k, y = c.figure.points.ground - (27 + air.up) * k;
                let d = `M${from.toFixed(1)} ${y.toFixed(1)}`;
                for (let x = from - 16 * k, i = 1; x > mid - half; x -= 16 * k, i++) d += `L${x.toFixed(1)} ${(y + Math.sin(road.ribbon * 9 + i * 0.7) * Math.min(i, 6) * 0.5 * k + i * 0.9 * k).toFixed(1)}`;
                el.setAttribute('d', d);
            });
            // Streaks of the air going by.
            const streaks = [fx.particles({ color: '#ffffff', width: 1.4, opacity: 0.8 }), fx.particles({ color: CYAN, width: 1.6, opacity: 0.8 }), fx.particles({ color: PINK, width: 1.6, opacity: 0.8 })];
            c.onLeave(() => streaks.forEach(system => system.close()));
            c.onLeave(c.clock.onFrame(dt => {
                for (const system of streaks) if (fx.random() < 0.012 * dt * ride.speed) system.emit({ x: mid + half, y: floor - fx.range(4, 128) * k, vx: -fx.range(520, 980) * k * ride.speed, vy: 0, life: 0.7, trail: 0.07 });
            }));
        }

        // Onto the saddle: the bike draws itself in, the rider sits, hands to the bars, feet to the pegs.
        await c.all(c.animate(frame.state, { draw: 1 }, 520, easeOut), ...wheels.map(turning => c.animate(turning.state, { draw: 1 }, 520, easeOut)));
        const hold = (lean, ms) => c.all(
            c.tween({ tilt: lean, crouch: 2 }, ms, easeInOut),
            c.hands({ left: { x: 21, y: -2 }, right: { x: 23, y: 0 } }, ms, easeInOut),
            c.feet({ left: { x: 4, y: 13 }, right: { x: 7, y: 13 } }, ms, easeInOut),
        );
        await c.all(c.tween({ seat: 1, gazeX: 0.8 }, 360, easeInOut), hold(14, 360));

        for (let lap = 0; ; lap++) {
            // Cruising: the bike hums, the rider rocks with it.
            for (let hum = 0; hum < 4; hum++) { await c.tween({ crouch: 3.5, tilt: 15 }, 280, easeInOut); await c.tween({ crouch: 1.5, tilt: 13 }, 280, easeInOut); }
            // A look at you, and a wave.
            await c.all(c.tween({ gazeX: 0, tilt: 8 }, 260, easeInOut), c.hands({ left: null }, 200));
            await c.tween({ wave: 1 }, 220);
            await c.wait(760);
            await c.tween({ wave: 0 }, 220);
            await moves.blink(c);
            await c.all(c.tween({ gazeX: 0.9 }, 200), hold(14, 240));
            // Full throttle: down on the tank, everything goes by faster.
            await c.all(hold(26, 300), c.animate(ride, { speed: 2.3 }, 500, easeIn));
            for (let hum = 0; hum < 5; hum++) { await c.tween({ crouch: 5 }, 150, easeInOut); await c.tween({ crouch: 3 }, 150, easeInOut); }
            // A jump, the bike and its rider in one piece, and a landing in sparks.
            await c.all(c.animate(air, { up: 46 }, 420, easeOut), c.tween({ tilt: 6, stretch: lap % 2 ? 0.7 : 0 }, 420, easeOut));
            await c.all(c.animate(air, { up: 0 }, 380, easeIn), c.tween({ tilt: 20, stretch: 0 }, 380, easeIn));
            if (fx) { const under = [c.figure.points.centre[0], c.figure.points.ground]; effects.shockwave(fx, under, { k, size: 54, flat: 0.22, color: CYAN }); effects.burst(fx, [under[0] - 30 * k, under[1]], { k, count: 12, speed: 230, color: PINK, arc: [Math.PI, Math.PI * 1.5] }); effects.burst(fx, [under[0] + 32 * k, under[1]], { k, count: 8, speed: 200, color: CYAN, arc: [Math.PI, Math.PI * 1.6] }); }
            await c.tween({ squash: 0.25, crouch: 7 }, 110, easeOut);
            await c.all(c.tween({ squash: 0 }, 300, easeOut), hold(14, 300), c.animate(ride, { speed: 1 }, 900, easeOut));
        }
    },
};
