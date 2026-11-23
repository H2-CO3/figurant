// A runner on a light machine, seen from behind and a little above: the one
// you follow down a circuit. Low and wide, all angles: a blade of a wheel,
// two fins, a plated back lying on the tank, a helmet tucked between the
// shoulders with a band of light across it. Runner and machine are one thing:
// every line of both is in the one colour, the spine running into the wheel. It has no legs or arms of the body's: it is drawn whole, and
// stands on its wheel. What is its own:
// - `hue` (0 or 1): its colour, cyan or orange, so that two of them can race;
// - `rev` (0 to 1): the engine; the whole sign hums harder with it;
// - `boost` (0 to 1): the flare behind the wheel, and the fins opening;
// - leaning (`tilt`) is how it takes the wall: the engine's number.

import { kit } from '../kit.js';

export const RUNNERS = ['#3df0ff', '#ff8a3c'];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        // Runner and machine are one thing, in one colour: drawn whole, once in each.
        const whole = RUNNERS.map(colour => {
            const part = stage.el('g', group);
            // The plates of the wheel, the tail, the armour, the helmet, the arms and knees, the bars.
            k.tube(part, 'M -6 14 L -6 36 L -3 40 M 6 14 L 6 36 L 3 40', colour, 1.5);
            k.tube(part, 'M -19 6 L -9 -2 L 9 -2 L 19 6 L 9 10 L -9 10 Z', colour, 1.7);
            k.tube(part, 'M -11 -4 L -14 -21 L -7 -30 L 7 -30 L 14 -21 L 11 -4 Z', colour, 1.8);
            k.tube(part, 'M -7 -31 L -9 -40 L -5 -47 L 5 -47 L 9 -40 L 7 -31 Z', colour, 1.8);
            k.tube(part, 'M -14 -21 L -24 -13 L -21 -4 M 14 -21 L 24 -13 L 21 -4 M -11 -4 L -19 6 M 11 -4 L 19 6', colour, 1.6);
            k.tube(part, 'M -27 -4 L -17 -5 M 27 -4 L 17 -5', colour, 1.6);
            // What burns brightest: the blade of the wheel, the band on the helmet, the strips on the back that run into the tail.
            const core = stage.el('g', part);
            k.tube(core, 'M 0 12 L 0 40', colour, 3.6);
            k.tube(core, 'M -7 -39 L 7 -39', colour, 2.4);
            k.tube(core, 'M -6 -24 L -3 -2 M 6 -24 L 3 -2 M 0 -30 L 0 12', colour, 1.5);
            return { part, core };
        });
        const flares = RUNNERS.map(colour => k.tube(group, 'M -4 40 L 0 58 L 4 40', colour, 1.8));
        const fins = RUNNERS.map(colour => [k.tube(group, '', colour, 1.6), k.tube(group, '', colour, 1.6)]);
        // (Hips at the foot of the wheel: with legs of no length, that is where it stands.)
        const frame = { hips: [[-3, 40], [3, 40]], shoulders: [[-14, -21], [14, -21]], hipY: 40, top: [0, -47], soft: 0.08 };
        return {
            state: { hue: 0, rev: 0, boost: 0 },
            frame: () => frame,
            draw({ state: s, matrix }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                const mine = s.hue >= 0.5 ? 1 : 0, boost = clamp(s.boost, 0, 1);
                const hum = 0.88 + 0.12 * Math.sin(s.clock * (0.03 + 0.05 * clamp(s.rev, 0, 1)));
                whole.forEach(({ part, core }, i) => { part.setAttribute('display', i === mine ? '' : 'none'); core.setAttribute('opacity', hum.toFixed(2)); });
                flares.forEach((flare, i) => {
                    flare.setAttribute('display', i === mine && boost > 0.02 ? '' : 'none');
                    k.redraw(flare, `M -4 40 L 0 ${(46 + 34 * boost * (0.8 + 0.2 * Math.sin(s.clock * 0.09))).toFixed(1)} L 4 40`);
                });
                // The fins: folded along the tail, opening wide under boost.
                const open = 6 + 12 * boost;
                fins.forEach((pair, i) => {
                    pair.forEach((fin, side) => {
                        const way = side ? 1 : -1;
                        fin.setAttribute('display', i === mine ? '' : 'none');
                        k.redraw(fin, `M ${way * 19} 6 L ${(way * (24 + open)).toFixed(1)} ${(1 - open * 0.5).toFixed(1)} L ${(way * (21 + open * 0.6)).toFixed(1)} 13`);
                    });
                });
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
