// A runner and its machine, seen from behind and a little above: one body,
// not a rider on a bike. A single outline runs from the crown of the helmet
// down the shoulders, out along two swept wings, in at the waist and down the
// shroud of the wheel to a point: the back of the runner is the tail of the
// machine. Inside it, three lines of light flow the same way: a spine from
// the helmet to the wheel, and a rib on either side that follows the outline.
// The body is dark and shaded, lit along its edges by its own light; it
// throws a pool of that light on the floor. What is its own:
// - `hue` (0 or 1): its colour, cyan or orange, so that two of them can race;
// - `rev` (0 to 1): the engine; the lines of light hum harder with it;
// - `boost` (0 to 1): the flare behind the wheel, and the wings spreading;
// - `lane`, `far`: where it rides in the circuit (../circuit.js): across
//   the floor (0 in the middle, 1 at the foot of a wall, more to ride up
//   the wall, 8 on the ceiling, 16 all the way round) and how far ahead (1 at the picture's edge; 2.1 when nothing
//   is said, which is where it stands). It goes there by itself, smaller the
//   further, upright towards the middle of the tunnel, leaning into its
//   turns; and it trails its light back along the floor to you: a beam
//   that widens as it comes, sparks running down it, and, at speed, the
//   blurred ghosts of where it has just been.

import { kit } from '../kit.js';
import { TURN, WIDE, REST, spot } from '../circuit.js';

export const RUNNERS = ['#3df0ff', '#ff8a3c'];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(1);
let serial = 0;

/** The one outline of runner and machine; `spread` opens the wings. */
const outline = spread => {
    const tip = 27 + spread, lift = 5 * spread / 14;
    const half = way => `C ${way * 6} -49 ${way * 10} -44 ${way * 9} -38 C ${way * 8.5} -34 ${way * 7} -32 ${way * 9} -30 C ${way * 15} -28 ${way * 18} -22 ${way * 20} -15 C ${way * 22} -9 ${f(way * (tip - 3))} ${f(-7 - lift)} ${f(way * tip)} ${f(-3 - lift)} C ${f(way * (tip - 6))} 3 ${way * 15} 5 ${way * 12} 6 C ${way * 9} 8 ${way * 7.5} 12 ${way * 7.5} 18 L ${way * 7} 32 C ${way * 7} 38 ${way * 3} 41 0 41`;
    // (Down the right side, then the left one drawn the same way and closed.)
    return `M 0 -49 ${half(1)} M 0 -49 ${half(-1)}`;
};
const ribs = spread => [-1, 1].map(way => `M ${way * 6} -29 C ${way * 13} -24 ${way * 15} -14 ${f(way * (14 + spread * 0.4))} -6 C ${way * 12} 0 ${way * 6} 4 ${way * 4.5} 14`).join(' ');

const head = {
    create({ stage, layer }) {
        // Behind it, in the circuit's own space: what it trails. Over that, itself, where it rides.
        const wake = stage.el('g', layer), group = stage.el('g', layer);
        const k = kit(stage);
        const defs = stage.el('defs', group), uid = `runner${(serial++).toString(36)}`;
        stage.el('feGaussianBlur', stage.el('filter', defs, { id: `${uid}-blur`, x: '-40%', y: '-40%', width: '180%', height: '180%' }), { stdDeviation: '1.2 4' });
        const trails = RUNNERS.map(colour => ({
            beams: [[0.09, colour], [0.24, colour], [0.95, '#ffffff']].map(([opacity, fill]) => stage.el('path', wake, { fill, stroke: 'none', opacity })),
            sparks: stage.el('path', wake, { fill: 'none', stroke: colour, 'stroke-width': 1.4, 'stroke-linecap': 'round' }),
            ghosts: [0.3, 0.17, 0.08].map(opacity => stage.el('path', wake, { fill: 'none', stroke: colour, 'stroke-width': 2.4, 'stroke-linejoin': 'round', opacity, filter: `url(#${uid}-blur)` })),
        }));
        let before = null, lean = 0;
        const whole = RUNNERS.map((colour, i) => {
            const part = stage.el('g', group);
            // Its light on the floor: a pool under the wheel, wider than it is.
            const pool = stage.el('radialGradient', defs, { id: `${uid}-pool${i}` });
            stage.el('stop', pool, { offset: 0, 'stop-color': colour, 'stop-opacity': 0.55 }); stage.el('stop', pool, { offset: 0.45, 'stop-color': colour, 'stop-opacity': 0.16 }); stage.el('stop', pool, { offset: 1, 'stop-color': colour, 'stop-opacity': 0 });
            stage.el('ellipse', part, { cx: 0, cy: 41, rx: 46, ry: 11, fill: `url(#${uid}-pool${i})`, stroke: 'none' });
            // The body: dark, lighter down its middle where its own spine lights it, darkest at the wings.
            const shade = stage.el('linearGradient', defs, { id: `${uid}-shade${i}`, x1: 0, y1: 0, x2: 1, y2: 0 });
            for (const [offset, tint, opacity] of [[0, '#05070f', 1], [0.34, '#0e1430', 1], [0.5, colour, 0.34], [0.66, '#0e1430', 1], [1, '#05070f', 1]]) stage.el('stop', shade, { offset, 'stop-color': tint, 'stop-opacity': opacity });
            const fill = stage.el('path', part, { d: '', fill: '#0a0e22', stroke: 'none' });
            const sheen = stage.el('path', part, { d: '', fill: `url(#${uid}-shade${i})`, stroke: 'none' });
            const edge = k.tube(part, '', colour, 1.9);
            const flow = k.tube(part, '', colour, 1.3);
            // What burns brightest, and is one line: the band of the helmet, the spine, the blade of the wheel.
            const core = stage.el('g', part);
            k.tube(core, 'M -7.5 -40 Q 0 -43 7.5 -40', colour, 2.4);
            k.tube(core, 'M 0 -31 C 1.5 -18 -1.5 -6 0 6 L 0 40', colour, 3);
            const flare = k.tube(part, '', colour, 1.8);
            return { part, fill, sheen, edge, flow, core, flare };
        });
        // (Hips at the foot of the wheel: with legs of no length, that is where it stands.)
        const frame = { hips: [[-3, 41], [3, 41]], shoulders: [[-18, -22], [18, -22]], hipY: 41, top: [0, -49], soft: 0.08 };
        let drawn = -1;
        return {
            state: { hue: 0, rev: 0, boost: 0, lane: 0, far: REST },
            frame: () => frame,
            draw({ state: s, matrix, dt }) {
                const m = matrix.map(n => n.toFixed(4)).join(' ');
                const lane = s.lane, far = clamp(s.far, 0.9, 2.3), size = REST / far, [x, y] = spot(lane, far);
                // Upright is towards the middle of the tunnel; and it leans into where it is going.
                const turning = before === null || !dt ? 0 : clamp((lane - before) / dt * 5200, -18, 18);
                lean += (turning - lean) * Math.min(1, (dt || 0) / 120); before = lane;
                const upright = -lane * TURN / 2 * 180 / Math.PI + lean;
                group.setAttribute('transform', `matrix(${m}) translate(${f(x)} ${f(y)}) translate(0 41) rotate(${f(upright)}) scale(${size.toFixed(3)}) translate(0 -41)`);
                wake.setAttribute('transform', `matrix(${m}) translate(0 41)`);
                const mine = s.hue >= 0.5 ? 1 : 0, boost = clamp(s.boost, 0, 1), spread = Math.round(14 * boost);
                const hum = 0.86 + 0.14 * Math.sin(s.clock * (0.03 + 0.05 * clamp(s.rev, 0, 1)));
                // The beam: a ribbon on the floor from the wheel back to you, as wide as the distance makes it; three of them, the last white-hot.
                trails.forEach(({ beams, sparks, ghosts }, i) => {
                    for (const part of [...beams, sparks, ...ghosts]) part.setAttribute('display', i === mine ? '' : 'none');
                    if (i !== mine) return;
                    // (Half a width, told as it would be at the picture's edge, is the same share of a lane at any distance: the tunnel does the rest.)
                    const NEAR = 0.42, ribbon = half => {
                        const share = half * (1 + 0.6 * boost) / (WIDE * TURN / 2);
                        let there = '', back = '';
                        for (let step = 0; step <= 10; step++) {
                            const away = far - (far - NEAR) * step / 10, part = share * (0.45 + 0.55 * step / 10);
                            const a = spot(lane - part, away), b = spot(lane + part, away);
                            there += `${step ? 'L' : 'M'}${f(a[0])} ${f(a[1])}`; back = `L${f(b[0])} ${f(b[1])}` + back;
                        }
                        return there + back + 'Z';
                    };
                    [16, 7, 1.6].forEach((half, n) => beams[n].setAttribute('d', ribbon(half)));
                    // Sparks thrown back by the wheel: each runs down the beam and out of the picture, faster under boost.
                    let d = '';
                    for (let n = 0; n < 9; n++) {
                        const part = (s.clock / 1000 * (1.6 + 1.6 * boost) * (0.7 + (n * 0.37 % 1) * 0.6) + n * 0.273) % 1, away = far - (far - NEAR) * part, side = ((n * 0.618 % 1) - 0.5) * 0.16 * (0.4 + part);
                        const p = spot(lane + side, away), q = spot(lane + side * 1.15, away - (0.03 + 0.05 * boost) * away);
                        d += `M${f(p[0])} ${f(p[1] - (1 - part) * 3)}L${f(q[0])} ${f(q[1])}`;
                    }
                    sparks.setAttribute('d', d); sparks.setAttribute('opacity', (0.55 + 0.4 * boost).toFixed(2));
                    // Its ghosts: where it was an instant ago (nearer to you, so larger), blurred along the way it goes.
                    const shape = outline(Math.round(14 * boost));
                    ghosts.forEach((ghost, n) => {
                        const away = far - (0.07 + 0.09 * boost) * (n + 1), [gx, gy] = spot(lane, away);
                        ghost.setAttribute('d', shape);
                        ghost.setAttribute('transform', `translate(${f(gx)} ${f(gy)}) rotate(${f(upright)}) scale(${(REST / away).toFixed(3)}) translate(0 -41)`);
                        ghost.setAttribute('opacity', ((0.12 + 0.3 * boost) / (n + 1)).toFixed(2));
                    });
                });
                whole.forEach(({ part, fill, sheen, edge, flow, core, flare }, i) => {
                    part.setAttribute('display', i === mine ? '' : 'none');
                    if (i !== mine) return;
                    if (drawn !== spread * 2 + mine) {
                        const d = outline(spread);
                        fill.setAttribute('d', d); sheen.setAttribute('d', d);
                        k.redraw(edge, d); k.redraw(flow, ribs(spread));
                    }
                    core.setAttribute('opacity', hum.toFixed(2));
                    flow.setAttribute('opacity', (0.55 + 0.45 * hum).toFixed(2));
                    flare.setAttribute('display', boost > 0.02 ? '' : 'none');
                    k.redraw(flare, `M -4.5 38 Q 0 ${f(48 + 38 * boost * (0.8 + 0.2 * Math.sin(s.clock * 0.09)))} 4.5 38`);
                });
                drawn = spread * 2 + mine;
            },
        };
    },
};

export const neonRider = {
    name: 'neon-rider',
    style: 'neon-nuit',
    line: 2.2,
    limbs: RUNNERS[0],
    arms: 'none',
    head,
    // (Legs so short that they hide behind the wheel, with enough slack in them to keep their feet on the floor while it breathes.)
    proportions: { thigh: 2.4, shin: 2.4, reach: 1.2, foot: 0.3, stride: 0.6, lift: 0.2 },
};
