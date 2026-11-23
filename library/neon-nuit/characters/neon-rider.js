// A rider on a motorbike, in neon, seen from behind: the one you follow down
// a road at night. A stick figure in white tubes (a helmet, a spine, arms out
// to the bars, knees wide), on a bike in one colour: the bars, the tank, the
// tail light, the tyre you see edge-on. It has no legs or arms of the body's:
// it is drawn whole, and stands on its tyre. What is its own:
// - `hue` (0 or 1): the colour of its bike, cyan or magenta, so that two of
//   them can race;
// - `rev` (0 to 1): the engine; the tail light burns and the whole sign hums
//   harder with it;
// - leaning (`tilt`) is how it changes lane: the engine's number, nothing more.

import { kit, CYAN, MAGENTA } from '../kit.js';

const WHITE = '#e8ecff', RED = '#ff3b5c';

const head = {
    create({ stage, layer }) {
        const group = stage.el('g', layer);
        const k = kit(stage);
        const bikes = [CYAN, MAGENTA].map(colour => {
            const bike = stage.el('g', group);
            // The tyre, edge-on; the tail and the tank; the bars and their two mirrors.
            k.tube(bike, 'M -5 14 Q -5 9 0 9 Q 5 9 5 14 L 5 35 Q 5 40 0 40 Q -5 40 -5 35 Z', colour, 2.2);
            k.tube(bike, 'M -11 8 L -8 -6 L 8 -6 L 11 8 Z', colour, 2);
            k.tube(bike, 'M -24 -17 L -8 -14 M 8 -14 L 24 -17 M -24 -17 L -27 -23 M 24 -17 L 27 -23', colour, 1.8);
            return bike;
        });
        const light = k.tube(group, 'M -8 10 L 8 10', RED, 2.6);
        // The rider: knees wide round the tank, a spine, shoulders, arms to the bars, a helmet.
        const rider = stage.el('g', group);
        k.tube(rider, 'M -4 -4 L -15 9 L -10 24 M 4 -4 L 15 9 L 10 24', WHITE, 2);
        k.tube(rider, 'M 0 -4 L 0 -31 M -12 -29 L 12 -29 M -12 -29 L -23 -17 M 12 -29 L 23 -17', WHITE, 2.2);
        k.tube(rider, 'M -8.5 -42 a 8.5 8.5 0 1 0 17 0 a 8.5 8.5 0 1 0 -17 0', WHITE, 2.2);
        // (Hips at the foot of the tyre: with legs of no length, that is where it stands.)
        const frame = { hips: [[-3, 40], [3, 40]], shoulders: [[-12, -29], [12, -29]], hipY: 40, top: [0, -51], soft: 0.1 };
        return {
            state: { hue: 0, rev: 0 },
            frame: () => frame,
            draw({ state: s, matrix }) {
                group.setAttribute('transform', `matrix(${matrix.map(n => n.toFixed(4)).join(' ')})`);
                bikes.forEach((bike, i) => bike.setAttribute('display', (s.hue >= 0.5 ? 1 : 0) === i ? '' : 'none'));
                const hum = 0.9 + 0.1 * Math.sin(s.clock * (0.02 + 0.03 * s.rev));
                group.setAttribute('opacity', hum.toFixed(2));
                light.setAttribute('opacity', (0.45 + 0.55 * Math.min(1, Math.max(0, s.rev))).toFixed(2));
            },
        };
    },
};

export const neonRider = {
    name: 'neon-rider',
    style: 'neon-nuit',
    line: 2.2,
    limbs: WHITE,
    arms: 'none',
    head,
    // No legs to speak of: it stands on its tyre.
    // (Legs so short that they hide behind the tyre, with enough slack in them to keep their feet on the floor while it breathes.)
    proportions: { thigh: 2.4, shin: 2.4, reach: 1.2, foot: 0.3, stride: 0.6, lift: 0.2 },
};
