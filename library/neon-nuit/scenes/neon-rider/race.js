// Made for the neon rider: a race without end, followed from behind. A
// motorway runs away to a point on the horizon under a striped sun; its
// lines, its lamps and the grid on either side come at you and go by; two
// riders weave between the lanes, one pulling ahead, then the other. Each
// rider plays this animation (`data.part`: 'first' or 'second'); the first
// also draws the night they ride through. It goes on until it is replaced.
//
// How far away something is, is one number: `far`, 1 at the bottom of the
// picture and growing towards the horizon. Its place on the page, its size
// and how fast it comes all follow from it (divided by `far`), which is what
// makes the road look like a road.

const CYAN = '#36e0c2', MAGENTA = '#ff4fb0', AMBER = '#ffc246', VIOLET = '#8b6bff', WHITE = '#e8ecff';
const f = n => n.toFixed(1);

export const raceNeonRider = {
    character: 'neon-rider',
    room: { left: 200, right: 200, up: 190 },

    async play(c, ctx) {
        const s = c.state, k = c.figure.k, ground = s.y, home = s.x, size = s.scale, fx = ctx?.api?.fx ?? null;
        const first = (ctx?.data?.part ?? 'first') === 'first';
        // The picture: where the road meets the horizon, and how wide it is at the bottom.
        const mid = c.figure.points.centre[0] - (ctx?.data?.at ?? 0) * k, floor = c.figure.points.ground + 62 * k, sky = floor - 200 * k, road = 190 * k, half = 330 * k;
        /** A place on the road as a point of the page: `lane` from -1 (left edge) to 1, `far` from 1 (here) up. */
        const spot = (lane, far) => [mid + lane * road / far, sky + (floor - sky) / far];
        const clock = { t: first ? 0 : 3.7, run: 0 };
        c.onLeave(() => { s.y = ground; s.x = home; s.scale = size; s.tilt = 0; s.rev = 0; });
        s.hue = first ? 0 : 1;

        // ── The rider: its lane and its distance drift in slow waves, never the same two laps running. ──
        let lane = first ? -0.45 : 0.45;
        c.onLeave(c.clock.onFrame(dt => {
            clock.t += dt / 1000;
            const t = clock.t;
            const far = 1.62 + (first ? 1 : -1) * 0.3 * Math.sin(t * 0.37) + 0.08 * Math.sin(t * 1.1 + (first ? 0 : 2));
            // (Each keeps to its half of the road: they pass each other, they never ride through each other.)
            const wanted = (first ? -0.46 : 0.46) + 0.27 * Math.sin(t * 0.53 + (first ? 0 : 1.7)) + 0.1 * Math.sin(t * 1.31);
            const before = lane;
            lane += (wanted - lane) * Math.min(1, dt / 260);
            const [x, y] = spot(lane, far);
            s.x = home + (x - (mid + (ctx?.data?.at ?? 0) * k));
            s.y = ground - (floor - 62 * k - y);
            s.scale = size * 2.2 / far;
            // It leans into the lane it is going to.
            s.tilt = Math.max(-22, Math.min(22, (lane - before) / Math.max(dt, 1) * 9000));
            s.rev = 0.6 + 0.4 * Math.sin(t * 0.37 + (first ? 1.2 : -1.2));
        }));

        // ── The night, drawn by the first rider only. ──
        if (fx && first) {
            const forever = (attrs, update) => c.onLeave(fx.shape({ life: 1e12, attrs, update }).stop);
            const still = (attrs, d) => forever(attrs, el => { if (!el.getAttribute('d')) el.setAttribute('d', d()); });
            const glow = (colour, width, d, moving) => { for (const [w, opacity] of [[width * 3.4, 0.2], [width, 1]]) (moving ? forever : still)({ stroke: colour, 'stroke-width': w * k, opacity }, d); };
            // The sun where the road ends: a disc cut into bands, wider apart towards the top.
            still({ stroke: AMBER, 'stroke-width': 2.2 * k, opacity: 0.9 }, () => {
                const r = 74 * k, cy = sky - 6 * k;
                let d = `M${f(mid - r)} ${f(cy)}A${f(r)} ${f(r)} 0 0 1 ${f(mid + r)} ${f(cy)}`;
                for (const up of [0, 9, 20, 33, 48]) { const y = cy - up * k, w = Math.sqrt(Math.max(0, r * r - (cy - y) * (cy - y))); d += `M${f(mid - w)} ${f(y)}H${f(mid + w)}`; }
                return d;
            });
            // Mountains on the horizon, either side of it, and the horizon itself.
            still({ stroke: VIOLET, 'stroke-width': 1.8 * k, opacity: 0.85 }, () => {
                let d = '';
                for (const side of [-1, 1]) { let x = mid + side * 80 * k; d += `M${f(x)} ${f(sky)}`; for (const [dx, up] of [[30, 34], [26, 12], [34, 52], [30, 20], [38, 40], [30, 8], [32, 26]]) { x += side * dx * k; d += `L${f(x)} ${f(sky - up * k)}`; } d += `L${f(mid + side * half)} ${f(sky)}`; }
                return d;
            });
            glow(MAGENTA, 1.6, () => `M${f(mid - half)} ${f(sky)}H${f(mid + half)}`);
            // The grid of the plain: lines running to the horizon, either side of the road.
            still({ stroke: MAGENTA, 'stroke-width': 1 * k, opacity: 0.4 }, () => {
                let d = '';
                for (const lane of [-9, -7, -5.2, -3.6, -2.3, 2.3, 3.6, 5.2, 7, 9]) { const [x, y] = spot(lane, 1); const cut = Math.min(1, half / Math.abs(x - mid)); d += `M${f(mid)} ${f(sky)}L${f(mid + (x - mid) * cut)} ${f(sky + (y - sky) * cut)}`; }
                return d;
            });
            // Everything that comes at you: the cross lines of the grid, the dashes between the lanes, the lamps.
            forever({ stroke: MAGENTA, 'stroke-width': 1 * k, opacity: 0.4 }, (el, p, dt) => {
                clock.run = (clock.run + dt / 1000 * 1.5) % 1;
                let d = '';
                for (let i = 0; i < 16; i++) { const far = 1 + (i + 1 - clock.run) * 0.55, y = sky + (floor - sky) / far, edge = road / far; d += `M${f(mid - half)} ${f(y)}H${f(mid - edge)}M${f(mid + edge)} ${f(y)}H${f(mid + half)}`; }
                el.setAttribute('d', d);
            });
            glow(CYAN, 1.5, () => `M${f(spot(-1, 1)[0])} ${f(floor)}L${f(mid)} ${f(sky)}L${f(spot(1, 1)[0])} ${f(floor)}`);
            forever({ stroke: WHITE, 'stroke-width': 1.4 * k, opacity: 0.85 }, el => {
                let d = '';
                for (const line of [-1 / 3, 1 / 3]) for (let i = 0; i < 16; i++) {
                    const from = 1 + (i + 1 - clock.run) * 0.55, to = from + 0.2, [x1, y1] = spot(line, from), [x2, y2] = spot(line, to);
                    d += `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
                }
                el.setAttribute('d', d);
            });
            forever({ stroke: AMBER, 'stroke-width': 1.6 * k, opacity: 0.9 }, el => {
                let d = '';
                for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
                    const far = 1 + (i + 1 - (clock.run * 0.5 + (Math.floor(clock.t * 0.75) % 2) * 0.5) % 1) * 1.1, [x, y] = spot(side * 1.18, far), tall = 92 * k / far;
                    d += `M${f(x)} ${f(y)}V${f(y - tall)}H${f(x - side * 26 * k / far)}`;
                }
                el.setAttribute('d', d);
            });
            // The air going by: streaks that leave the point the road goes to.
            const air = [fx.particles({ color: WHITE, width: 1.2, opacity: 0.7 }), fx.particles({ color: CYAN, width: 1.4, opacity: 0.7 })];
            c.onLeave(() => air.forEach(system => system.close()));
            c.onLeave(c.clock.onFrame(dt => {
                for (const system of air) if (fx.random() < 0.01 * dt) { const a = fx.range(-0.15, Math.PI + 0.15), v = fx.range(260, 560) * k; system.emit({ x: mid + Math.cos(a) * 30 * k, y: sky - Math.sin(a) * 14 * k, vx: Math.cos(a) * v, vy: -Math.sin(a) * v * 0.55 - 20 * k, life: 0.8, trail: 0.09 }); }
            }));
        }
        // Each rider leaves a ribbon of its colour on the road, running back towards you.
        if (fx) for (const [width, opacity] of [[6, 0.2], [1.8, 0.9]]) c.onLeave(fx.shape({ life: 1e12, attrs: { stroke: first ? CYAN : MAGENTA, 'stroke-width': width * k, opacity }, update(el) {
            const x = c.figure.points.centre[0], y = c.figure.points.ground, grow = (floor - sky) / Math.max(1, y - sky);
            el.setAttribute('d', `M${f(x)} ${f(y)}L${f(mid + (x - mid) * grow)} ${f(floor)}`);
        } }).stop);

        // The race itself is in the frame loop above: this only holds the stage for as long as it is left to.
        for (;;) await c.wait(1000);
    },
};
