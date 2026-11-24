// The circuit, as somebody of a scene: a tunnel of light with eight sides,
// seen from inside at speed. Frames rush at you, edges run to a point,
// panels go by on the walls, pulses run along the edges, a core burns at the
// far end, and the air itself is drawn out into lines. It has no face and no
// limbs. Its numbers:
//   `speed` (1 when nothing is said)  how fast it all comes;
//   `boost` 0 -> 1   the kick: faster still, the core flares, the lines of
//                    the air lengthen, and what is near blurs;
//   `bend` -1 -> 1   its far end swings to one side, and it twists.
// Runners ride its floor (characters/neon-rider.js): they are told lanes and
// distances, and both read the same tunnel (../circuit.js). Its place: the
// middle of the floor, where a runner at rest stands.

import { SIDES, TURN, centre, wall, corner } from '../circuit.js';

// The circuit keeps to its own colours: none of them is a runner's.
const WHITE = '#e8ecff', DEEP = '#3b3fd8', VIOLET = '#b45cff', ROSE = '#ff3fa4';
const FACES = ['#0b0e24', '#0c0f2a', '#101433', '#0d1130', '#090b1d', '#07091a', '#090b1d', '#0b0e24'];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(1);
let serial = 0;

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer), uid = `circuit${(serial++).toString(36)}`;
        const defs = stage.el('defs', group);
        const glow = stage.el('radialGradient', defs, { id: `${uid}-core` });
        for (const [offset, tint, opacity] of [[0, '#ffffff', 0.95], [0.1, '#e9d6ff', 0.6], [0.32, VIOLET, 0.3], [0.7, DEEP, 0.1], [1, DEEP, 0]]) stage.el('stop', glow, { offset, 'stop-color': tint, 'stop-opacity': opacity });
        const sheen = stage.el('linearGradient', defs, { id: `${uid}-floor`, x1: 0, y1: 0, x2: 0, y2: 1 });
        for (const [offset, tint, opacity] of [[0, '#d9c2ff', 0.6], [0.3, VIOLET, 0.22], [1, DEEP, 0.04]]) stage.el('stop', sheen, { offset, 'stop-color': tint, 'stop-opacity': opacity });
        // What is near goes by too fast to be seen sharp: a blur that grows with the speed.
        const haze = stage.el('feGaussianBlur', stage.el('filter', defs, { id: `${uid}-rush`, x: '-20%', y: '-20%', width: '140%', height: '140%' }), { stdDeviation: 0 });
        const line = (attrs, into = group) => stage.el('path', into, { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs });

        // The walls themselves: eight faces, each its own dark, so that the tunnel is a volume and not a drawing of one.
        const faces = FACES.map(tint => stage.el('path', group, { fill: tint, stroke: 'none' }));
        const floor = stage.el('path', group, { fill: `url(#${uid}-floor)`, stroke: 'none' });
        const light = stage.el('circle', group, { fill: `url(#${uid}-core)`, stroke: 'none' });
        const edges = line({ stroke: DEEP, 'stroke-width': 1.1, opacity: 0.6 }), kerbs = line({ stroke: WHITE, 'stroke-width': 1.5, opacity: 0.9 });
        // The frames: far ones sharp, near ones in the blur. One in four burns.
        const far = { dim: line({ stroke: DEEP, 'stroke-width': 1.3, opacity: 0.75 }), halo: line({ stroke: VIOLET, 'stroke-width': 4.6, opacity: 0.22 }), lit: line({ stroke: VIOLET, 'stroke-width': 1.7 }) };
        const rush = stage.el('g', group, { filter: `url(#${uid}-rush)` });
        const near = { dim: line({ stroke: DEEP, 'stroke-width': 2.2, opacity: 0.8 }, rush), halo: line({ stroke: VIOLET, 'stroke-width': 9, opacity: 0.25 }, rush), lit: line({ stroke: VIOLET, 'stroke-width': 3 }, rush) };
        const panels = line({ stroke: ROSE, 'stroke-width': 1.2, opacity: 0.7 });
        const dashes = line({ stroke: WHITE, 'stroke-width': 1.3, opacity: 0.55 });
        const pulses = line({ stroke: WHITE, 'stroke-width': 2.4, opacity: 0.95 });
        const rays = line({ stroke: WHITE, 'stroke-width': 1.6 });
        // The air, drawn out into lines along the walls: three tints, and under boost a soft double of them.
        const air = [[WHITE, 1.1, 0.7], [VIOLET, 1.4, 0.65], [ROSE, 1.4, 0.6]].map(([stroke, width, opacity]) => line({ stroke, 'stroke-width': width, opacity }));
        const smear = line({ stroke: WHITE, 'stroke-width': 5, opacity: 0 }, rush);
        const STREAKS = Array.from({ length: 54 }, (unused, i) => ({ angle: (i * 0.618 % 1) * Math.PI * 2, pace: 0.55 + (i * 0.37 % 1) * 0.8, phase: i * 0.271 % 1, tint: i % 3, inset: 0.55 + (i * 0.83 % 1) * 0.42 }));

        const frame = { hips: [[-2, -2], [2, -2]], shoulders: [[-40, -60], [40, -60]], hipY: -2, top: [0, -160], soft: 0 };
        let run = 0;
        return {
            state: { speed: 1, boost: 0, bend: 0 },
            frame: () => frame,
            draw({ state: s, matrix, dt }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const t = s.clock / 1000, boost = clamp(s.boost, 0, 1), bend = clamp(s.bend, -1.2, 1.2), pace = Math.max(0, s.speed) * (5 + 4 * boost);
                run = (run + (dt || 0) / 1000 * 1.9 * pace) % 20;
                haze.setAttribute('stdDeviation', f(0.5 + 0.35 * pace * (0.4 + boost)));
                const at = (side, far) => corner(side, far, bend);
                /** How far the frame of that number is, right now: they come at you and start again at the far end. */
                const farOf = i => 0.5 + ((i - run) % 20 + 20) % 20 * 0.43;

                faces.forEach((face, side) => {
                    let d = '';
                    for (let step = 0; step < 13; step++) {
                        const a = 0.38 + step * step * 0.064, b = 0.38 + (step + 1) * (step + 1) * 0.064;
                        const p = [at(side, a), at(side + 1, a), at(side + 1, b), at(side, b)];
                        d += `M${f(p[0][0])} ${f(p[0][1])}L${f(p[1][0])} ${f(p[1][1])}L${f(p[2][0])} ${f(p[2][1])}L${f(p[3][0])} ${f(p[3][1])}Z`;
                    }
                    face.setAttribute('d', d);
                });
                // The floor shines where the light of the far end reaches it.
                let d = '';
                for (let step = 0; step <= 12; step++) { const [x, y] = at(2, 11 - step * step * 0.0737); d += `${step ? 'L' : 'M'}${f(x)} ${f(y)}`; }
                for (let step = 12; step >= 0; step--) { const [x, y] = at(1, 11 - step * step * 0.0737); d += `L${f(x)} ${f(y)}`; }
                floor.setAttribute('d', d + 'Z');
                // (The far end, where the last frames are.)
                const [cx, cy] = centre(9.5, bend);
                light.setAttribute('cx', f(cx)); light.setAttribute('cy', f(cy)); light.setAttribute('r', f(150 + 130 * boost + 8 * Math.sin(t * 9)));

                // The eight edges, running to the far end along the bend; the two of the floor are brighter.
                const along = { false: '', true: '' };
                for (let side = 0; side < SIDES; side++) for (let step = 0; step <= 14; step++) { const [x, y] = at(side, 0.38 + step * step * 0.058); along[side === 1 || side === 2] += `${step ? 'L' : 'M'}${f(x)} ${f(y)}`; }
                edges.setAttribute('d', along.false); kerbs.setAttribute('d', along.true);

                // The frames.
                const ring = { far: { dim: '', lit: '' }, near: { dim: '', lit: '' } };
                let boards = '', marks = '';
                for (let i = 0; i < 20; i++) {
                    const away = farOf(i), where = away < 1.5 ? 'near' : 'far', kind = i % 4 === 0 ? 'lit' : 'dim';
                    for (let side = 0; side <= SIDES; side++) { const [x, y] = at(side, away); ring[where][kind] += `${side ? 'L' : 'M'}${f(x)} ${f(y)}`; }
                    // The dashes of the floor, between the two lanes.
                    const [x1, y1] = wall(Math.PI / 2, away, bend), [x2, y2] = wall(Math.PI / 2, away + 0.16, bend);
                    marks += `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
                    // Panels on the walls, between two frames: the same ones every time a frame comes round, like a circuit board going by.
                    const side = (i * 5 + 3) % SIDES;
                    if (away > 6 || side === 1 || i % 3 === 0) continue;
                    const inset = (from, to, part) => [from[0] + (to[0] - from[0]) * part, from[1] + (to[1] - from[1]) * part];
                    const a = at(side, away), b = at(side + 1, away), a2 = at(side, away + 0.2), b2 = at(side + 1, away + 0.2);
                    const p = [inset(a, b, 0.2), inset(b, a, 0.2), inset(b2, a2, 0.2), inset(a2, b2, 0.2)];
                    boards += `M${f(p[0][0])} ${f(p[0][1])}L${f(p[1][0])} ${f(p[1][1])}L${f(p[2][0])} ${f(p[2][1])}L${f(p[3][0])} ${f(p[3][1])}Z`;
                    if (i % 2) { const m1 = inset(p[0], p[1], 0.5), m2 = inset(p[3], p[2], 0.5); boards += `M${f(m1[0])} ${f(m1[1])}L${f(m2[0])} ${f(m2[1])}`; }
                }
                far.dim.setAttribute('d', ring.far.dim); far.halo.setAttribute('d', ring.far.lit); far.lit.setAttribute('d', ring.far.lit);
                near.dim.setAttribute('d', ring.near.dim); near.halo.setAttribute('d', ring.near.lit); near.lit.setAttribute('d', ring.near.lit);
                panels.setAttribute('d', boards); dashes.setAttribute('d', marks);

                // Pulses along the edges, faster than the frames: signals on their way to you.
                d = '';
                for (let side = 0; side < SIDES; side++) for (let n = 0; n < 2; n++) {
                    const away = 9 - ((t * (1.5 + side * 0.13) * pace + side * 1.7 + n * 4.1) % 8.3);
                    const [x1, y1] = at(side, away), [x2, y2] = at(side, away + 0.1 + 0.03 * away);
                    d += `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
                }
                pulses.setAttribute('d', d);

                // The core: rays that turn, brighter under boost.
                const r = 7 + 11 * boost + 2 * Math.sin(t * 11);
                d = '';
                for (let ray = 0; ray < 10; ray++) { const a = ray * Math.PI / 5 + t * 0.6, long = r * (ray % 2 ? 1 : 2.1); d += `M${f(cx + Math.cos(a) * r * 0.3)} ${f(cy + Math.sin(a) * r * 0.3)}L${f(cx + Math.cos(a) * long)} ${f(cy + Math.sin(a) * long)}`; }
                rays.setAttribute('d', d); rays.setAttribute('opacity', f(0.6 + 0.4 * boost));

                // The air: each line leaves the far end and comes out at you, inside the tunnel, longer the nearer and the faster.
                const drawn = ['', '', ''];
                let soft = '';
                for (const streak of STREAKS) {
                    const part = (t * streak.pace * pace * 0.16 + streak.phase) % 1, away = 0.6 + 9 * Math.pow(1 - part, 2.4), long = away * (0.05 + 0.03 * pace * (0.5 + boost));
                    const p = wall(streak.angle, away / streak.inset, bend), q = wall(streak.angle, (away + long) / streak.inset, bend);
                    const piece = `M${f(p[0])} ${f(p[1])}L${f(q[0])} ${f(q[1])}`;
                    drawn[streak.tint] += piece;
                    if (away < 2.4) soft += piece;
                }
                air.forEach((path, i) => path.setAttribute('d', drawn[i]));
                smear.setAttribute('d', soft); smear.setAttribute('opacity', f(0.1 + 0.3 * boost));
            },
        };
    },
};

export const neonCircuit = {
    name: 'neon-circuit',
    style: 'neon-nuit',
    line: 2.2,
    limbs: 'none',
    arms: 'none',
    sits: false,
    head,
    proportions: { thigh: 4, shin: 4, reach: 2, stride: 6, lift: 0, upper: 4, fore: 4 },
};
