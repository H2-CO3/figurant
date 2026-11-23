// Made for the neon rider: a race without end down a circuit of light,
// followed from behind. The circuit is a tunnel with eight sides, drawn in
// lines: frames that rush at you, edges that run to a point, panels on the
// walls, pulses along the edges, a core burning at the far end. It bends,
// left and right, and twists as it goes. Two runners weave along its floor
// and up its walls, each trailing a beam of its colour; when they brush each
// other or scrape a wall, sparks; now and then the whole thing kicks forward.
// Each runner plays this animation (`data.part`: 'first' or 'second'); the
// first also draws the circuit. It goes on until it is replaced.
//
// One number says how far away anything is: `far`, 1 at the picture's edge
// and growing towards the far end. Where it is on the page, how big and how
// fast, all follow from it (divided by `far`): that is what makes a tunnel.
// A place across the tunnel is `lane`: 0 in the middle of the floor, 1 where
// the floor meets a wall, more to ride up the wall.

import { effects } from 'figurant';
import { RUNNERS } from '../../characters/neon-rider.js';

// The circuit keeps to its own colours: none of them is a runner's.
const WHITE = '#e8ecff', DEEP = '#3b3fd8', VIOLET = '#b45cff', ROSE = '#ff3fa4';
const SIDES = 8, TURN = Math.PI * 2 / SIDES;
const f = n => n.toFixed(1);
/** What the two runners know of each other, and of the circuit they share, for as long as it is drawn. */
const circuits = new WeakMap();

export const raceNeonRider = {
    character: 'neon-rider',
    room: { left: 200, right: 200, up: 190 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, ground = s.y, home = s.x, size = s.scale, fx = ctx?.api?.fx ?? null;
        const first = (ctx?.data?.part ?? 'first') === 'first', at = (ctx?.data?.at ?? 0) * k;
        const colour = RUNNERS[first ? 0 : 1];
        // The picture: its middle, where the floor is nearest, how wide and tall the tunnel is there.
        const mid = c.figure.points.centre[0] - at, low = c.figure.points.ground + 56 * k, wide = 400 * k, tall = 196 * k;
        const shared = (fx && circuits.get(fx)) || { t: 0, run: 0, speed: 1, boost: 0, bend: 0, shake: [0, 0], runners: {} };
        if (fx) circuits.set(fx, shared);
        c.onLeave(() => { s.y = ground; s.x = home; s.scale = size; s.tilt = 0; s.rev = 0; s.boost = 0; if (first && fx) circuits.delete(fx); });
        s.hue = first ? 0 : 1;

        // The middle of the tunnel at a distance: it bends away as it goes, and the picture shakes with the boost.
        /** How far along the bend a distance is: nothing at the picture's edge, all of it at the far end, and a little the other way in front of the edge. */
        const along = far => (far >= 1 ? 1 - 1 / far : far - 1);
        const centre = far => {
            const away = along(far), open = 1 + 0.1 * shared.boost;
            return [mid + shared.shake[0] + shared.bend * 150 * k * away * Math.abs(away), low - tall * 0.924 * open / far - 150 * k * away + shared.shake[1] + Math.sin(shared.t * 0.31) * 26 * k * away * Math.abs(away)];
        };
        /** How much the tunnel has turned on itself by that distance. */
        const twist = far => shared.bend * 0.5 * along(far);
        /** A point of the wall: `angle` round the tunnel (a quarter turn is the middle of the floor), at a distance. */
        const wall = (angle, far) => { const [x, y] = centre(far), open = 1 + 0.1 * shared.boost, a = angle + twist(far); return [x + Math.cos(a) * wide * open / far, y + Math.sin(a) * tall * open / far]; };
        const angleOf = lane => Math.PI / 2 - lane * TURN / 2;

        // ── The runner: across the floor in slow waves, up a wall now and then, ahead and behind in turn. ──
        const me = shared.runners[first ? 'first' : 'second'] = { lane: first ? -0.5 : 0.5, far: 1.6 };
        const mark = first ? 0 : 1.9;
        c.onLeave(c.clock.onFrame(dt => {
            const t = shared.t + mark;
            const climb = Math.pow(Math.max(0, Math.sin(t * 0.45 + (first ? 0 : 2.6))), 6) * 1.9;
            const wanted = (first ? -1 : 1) * (0.5 + climb) + 0.36 * Math.sin(t * 1.25) + 0.14 * Math.sin(t * 3.1);
            const before = me.lane;
            me.lane += (wanted - me.lane) * Math.min(1, dt / 150);
            me.far = 1.55 + (first ? 1 : -1) * 0.3 * Math.sin(shared.t * 0.8) + 0.07 * Math.sin(t * 2.3) - 0.12 * shared.boost;
            const [x, y] = wall(angleOf(me.lane), me.far);
            s.x = home + (x - mid - at);
            s.y = ground - (low - 56 * k - y);
            s.scale = size * 2.1 / me.far;
            // Upright is towards the middle of the tunnel; and it leans into where it is going.
            s.tilt = -(me.lane * TURN / 2 - twist(me.far)) * 180 / Math.PI * 0.9 + Math.max(-16, Math.min(16, (me.lane - before) / Math.max(dt, 1) * 6000));
            s.rev = 0.5 + 0.5 * shared.boost;
            s.boost = shared.boost;
            // Scraping a wall's foot, or the other runner: sparks.
            if (fx && fx.random() < dt * 0.02) {
                const rival = shared.runners[first ? 'second' : 'first'];
                const brushing = rival && Math.abs(rival.lane - me.lane) < 0.42 && Math.abs(rival.far - me.far) < 0.2;
                if (brushing || Math.abs(Math.abs(me.lane) - 1) < 0.12) effects.burst(fx, [c.figure.points.centre[0], c.figure.points.ground], { k: k * s.scale / size, count: brushing ? 7 : 4, speed: 200, color: brushing ? WHITE : colour, arc: [Math.PI, Math.PI * 2] });
            }
        }));

        // ── The circuit, drawn by the first runner only. ──
        if (fx && first) {
            const forever = (attrs, update) => c.onLeave(fx.shape({ life: 1e12, attrs, update }).stop);
            const corner = (i, far) => wall((i + 0.5) * TURN, far);
            const frames = Array.from({ length: 20 }, (unused, i) => i);
            // Time, speed, the bend of the tunnel, and the kick: every eight seconds or so, everything lurches forward.
            c.onLeave(c.clock.onFrame(dt => {
                shared.t += dt / 1000;
                const beat = (shared.t % 6.2) / 6.2, kick = beat > 0.62 && beat < 0.9 ? Math.sin((beat - 0.62) / 0.28 * Math.PI) : 0;
                shared.boost += (kick - shared.boost) * Math.min(1, dt / 160);
                shared.speed = 3.4 + 2.6 * shared.boost;
                shared.run = (shared.run + dt / 1000 * 1.9 * shared.speed) % 20;
                shared.bend = Math.sin(shared.t * 0.62) * 0.85 + Math.sin(shared.t * 1.57) * 0.35;
                shared.shake = [fx.range(-1, 1) * 3.2 * k * shared.boost, fx.range(-1, 1) * 2.4 * k * shared.boost];
            }));
            /** How far the frame of that number is, right now: they come at you and start again at the far end. */
            const farOf = i => 1 + ((i - shared.run) % 20 + 20) % 20 * 0.42 - 0.3;
            // The frames of the tunnel: one in four burns, the others are dim.
            for (const [every, attrs] of [[false, { stroke: DEEP, 'stroke-width': 1.3 * k, opacity: 0.75 }], [true, { stroke: VIOLET, 'stroke-width': 4.6 * k, opacity: 0.22 }], [true, { stroke: VIOLET, 'stroke-width': 1.7 * k }]]) forever(attrs, el => {
                let d = '';
                for (const i of frames) {
                    const far = farOf(i);
                    if (far < 0.72 || (i % 4 === 0) !== every) continue;
                    for (let side = 0; side <= SIDES; side++) { const [x, y] = corner(side, far); d += `${side ? 'L' : 'M'}${f(x)} ${f(y)}`; }
                }
                el.setAttribute('d', d);
            });
            // The eight edges, running to the far end along the bend; the two of the floor are brighter.
            for (const [floorOnly, attrs] of [[false, { stroke: DEEP, 'stroke-width': 1.1 * k, opacity: 0.6 }], [true, { stroke: WHITE, 'stroke-width': 1.5 * k, opacity: 0.9 }]]) forever(attrs, el => {
                let d = '';
                for (let side = 0; side < SIDES; side++) {
                    if ((side === 1 || side === 2) !== floorOnly) continue;
                    for (let step = 0; step <= 14; step++) { const [x, y] = corner(side, 0.72 + step * step * 0.055); d += `${step ? 'L' : 'M'}${f(x)} ${f(y)}`; }
                }
                el.setAttribute('d', d);
            });
            // Panels on the walls, between two frames: the same ones every time a frame comes round, like a circuit board going by.
            forever({ stroke: ROSE, 'stroke-width': 1.2 * k, opacity: 0.7 }, el => {
                let d = '';
                for (const i of frames) {
                    const far = farOf(i), side = (i * 5 + 3) % SIDES;
                    if (far < 0.8 || far > 6 || side === 1 || i % 3 === 0) continue;
                    const inset = (corner, other, part) => [corner[0] + (other[0] - corner[0]) * part, corner[1] + (other[1] - corner[1]) * part];
                    const a = corner(side, far), b = corner(side + 1, far), a2 = corner(side, far + 0.2), b2 = corner(side + 1, far + 0.2);
                    const p = [inset(a, b, 0.2), inset(b, a, 0.2), inset(b2, a2, 0.2), inset(a2, b2, 0.2)];
                    d += `M${f(p[0][0])} ${f(p[0][1])}L${f(p[1][0])} ${f(p[1][1])}L${f(p[2][0])} ${f(p[2][1])}L${f(p[3][0])} ${f(p[3][1])}Z`;
                    if (i % 2) { const m1 = inset(p[0], p[1], 0.5), m2 = inset(p[3], p[2], 0.5); d += `M${f(m1[0])} ${f(m1[1])}L${f(m2[0])} ${f(m2[1])}`; }
                }
                el.setAttribute('d', d);
            });
            // Pulses along the edges, faster than the frames: signals on their way to you.
            forever({ stroke: WHITE, 'stroke-width': 2.4 * k, opacity: 0.95 }, el => {
                let d = '';
                for (let side = 0; side < SIDES; side++) for (let n = 0; n < 2; n++) {
                    const far = 9 - ((shared.t * (1.5 + side * 0.13) * shared.speed + side * 1.7 + n * 4.1) % 8.2);
                    if (far < 0.8) continue;
                    const [x1, y1] = corner(side, far), [x2, y2] = corner(side, far + 0.1 + 0.02 * far);
                    d += `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
                }
                el.setAttribute('d', d);
            });
            // The dashes of the floor, between the two lanes.
            forever({ stroke: WHITE, 'stroke-width': 1.3 * k, opacity: 0.55 }, el => {
                let d = '';
                for (const i of frames) { const far = farOf(i); if (far < 0.8) continue; const [x1, y1] = wall(Math.PI / 2, far), [x2, y2] = wall(Math.PI / 2, far + 0.16); d += `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`; }
                el.setAttribute('d', d);
            });
            // The far end: a core that burns, brighter under boost.
            forever({ stroke: WHITE, 'stroke-width': 1.6 * k }, el => {
                const [x, y] = centre(30), r = (7 + 9 * shared.boost + 2 * Math.sin(shared.t * 11)) * k;
                let d = '';
                for (let ray = 0; ray < 10; ray++) { const a = ray * Math.PI / 5 + shared.t * 0.6, long = r * (ray % 2 ? 1 : 2.1); d += `M${f(x + Math.cos(a) * r * 0.3)} ${f(y + Math.sin(a) * r * 0.3)}L${f(x + Math.cos(a) * long)} ${f(y + Math.sin(a) * long)}`; }
                el.setAttribute('d', d); el.setAttribute('opacity', f(0.6 + 0.4 * shared.boost));
            });
            // The air: streaks leaving the far end, thicker and longer under boost; a ring thrown out when the kick comes.
            const air = [fx.particles({ color: WHITE, width: 1.2, opacity: 0.75 }), fx.particles({ color: VIOLET, width: 1.5, opacity: 0.7 }), fx.particles({ color: ROSE, width: 1.5, opacity: 0.7 })];
            c.onLeave(() => air.forEach(system => system.close()));
            let kicked = false;
            c.onLeave(c.clock.onFrame(dt => {
                const [x, y] = centre(30);
                for (const system of air) if (fx.random() < 0.009 * dt * shared.speed) { const a = fx.range(0, Math.PI * 2), v = fx.range(200, 460) * k * shared.speed; system.emit({ x: x + Math.cos(a) * 26 * k, y: y + Math.sin(a) * 16 * k, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, life: 0.75, trail: 0.06 + 0.07 * shared.boost }); }
                if (shared.boost > 0.5 && !kicked) { kicked = true; effects.shockwave(fx, [x, y], { k, size: 260, life: 520, color: WHITE, width: 3, flat: 0.6 }); }
                if (shared.boost < 0.1) kicked = false;
            }));
        }
        // Each runner trails a beam of its colour, along the floor and the wall, back to you.
        if (fx) for (const [width, opacity] of [[11, 0.16], [5, 0.4], [1.8, 1]]) c.onLeave(fx.shape({ life: 1e12, attrs: { stroke: colour, 'stroke-width': width * k, opacity, 'stroke-linejoin': 'round' }, update(el) {
            let d = '';
            for (let step = 0; step <= 8; step++) { const far = me.far - (me.far - 0.7) * step / 8, [x, y] = wall(angleOf(me.lane), far); d += `${step ? 'L' : 'M'}${f(x)} ${f(y)}`; }
            el.setAttribute('d', d); el.setAttribute('stroke-width', f(width * k * (1 + 0.5 * shared.boost)));
        } }).stop);

        // The race itself is in the frame loops above: this only holds the stage for as long as it is left to.
        for (;;) await c.wait(1000);
    },
};
