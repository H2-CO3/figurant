// A sailing boat, in line and gold. It has no face and no limbs: it does not
// walk, it sails. It rides its own water (three ink ripples that run under
// the hull), rolls gently by itself and heels under the wind. Its pennant is
// its one solid gold and does the looking: it streams towards what the boat
// looks at and is thrown back by every move.
//
// What is its own:
//   its sails belly with the wind and with every move, luff (shiver) when it
//       is startled, and go slack for the time of a blink;
//   `wind` 0 -> 1 fills the sails and heels the boat;
//   `furl` 0 -> 1 lowers the mainsail down to its boom;
//   `swell` 0 -> 1 raises the sea: more waves, wider and taller, around the
//       boat, which heaves and pitches on them.
// It says how it moves on its water in `heave` (units, down) and `roll`
// (degrees), for whoever stands on its deck.
// Somebody may stand on its deck: the deck is 12 units above the middle of
// the hull, between the mast and the stern.

import { kit, INK, FINE, THREAD, DETAIL } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

/** The keel, the deck and the mast, in the boat's own units (the bow to the right). */
const KEEL = 30, DECK = 12, MAST = 14, TOP = -84, BOOM = 2;
/** The water under the keel. */
const DRAFT = 5;

const head = {
    create({ stage, layer, line }) {
        // The water is not the boat's body: it stays level while the boat rolls.
        const group = stage.el('g', layer);
        const k = kit(stage, group, line);

        // Behind the mast: the mainsail and its boom. Ahead of it: the jib.
        const main = k.gold(group, '', THREAD);
        const seam = k.ink(group, '', FINE);
        const jib = k.gold(group, '', THREAD);
        const boom = k.ink(group, '', DETAIL);
        k.ink(group, `M ${MAST} ${DECK} L ${MAST} ${TOP}`, DETAIL);
        k.ink(group, `M ${MAST} ${TOP + 6} L 60 ${DECK - 1}`, FINE);            // the forestay
        // The hull: a gold contour, one plank line, a rudder.
        k.ink(group, `M -50 ${DECK + 4} L -55 ${KEEL + 2}`, DETAIL);
        k.gold(group, `M -54 ${DECK} L 62 ${DECK} Q 50 ${KEEL} 26 ${KEEL} L -34 ${KEEL} Q -50 ${KEEL} -54 ${DECK} Z`);
        k.ink(group, `M -47 ${DECK + 7} Q 0 ${DECK + 10} 51 ${DECK + 7}`, FINE);
        k.dot(group, MAST, DECK, 2.6); k.dot(group, 60, DECK - 1, 2); k.dot(group, -50, DECK + 4, 2);
        const pennant = k.solid(group, '');
        // Drawn last, over the keel: the boat sits in it.
        const water = stage.el('g', layer);
        const ripples = Array.from({ length: 12 }, (_, i) => stage.el('path', water, { fill: 'none', stroke: INK, 'stroke-width': line * (i % 2 ? FINE : DETAIL), 'stroke-linecap': 'round' }));
        k.dot(group, MAST, TOP, 2);

        const frame = { hips: [[-8, KEEL], [8, KEEL]], shoulders: [[-20, DECK], [20, DECK]], hipY: KEEL, top: [MAST, TOP - 6], soft: 0.2 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, wind: 0.35, furl: 0, swell: 0.25, heave: 0, roll: 0 },
            frame: () => frame,
            draw({ state: s, P, matrix, k: scale, drag, ground }) {
                const t = s.clock / 1000;
                const wind = clamp(s.wind, 0, 1), luff = clamp(s.wide, 0, 1), slack = 1 - clamp(s.lid, 0, 1);
                // It rolls by itself, heels with the wind, and is tipped back by a start.
                const swell = clamp(s.swell, 0, 1);
                const roll = (1.6 + swell * 3.4) * Math.sin(t * 1.5) + wind * 1.5 - clamp(drag[0], -8, 8) * 0.25;
                const heave = (0.9 + swell * 4.1) * Math.sin(t * 1.5 + 1);
                s.roll = roll; s.heave = heave;
                const m = matrix.map(n => n.toFixed(4)).join(' ');
                group.setAttribute('transform', `matrix(${m}) rotate(${f(roll)} 0 ${KEEL}) translate(0 ${f(heave)})`);

                // How full the sails are: the wind, the move, less when it blinks; a shiver when it luffs.
                const shiver = luff * 3.5 * Math.sin(t * 31);
                const belly = clamp((6 + wind * 12 - drag[0] * 0.9) * (1 - 0.8 * slack) * (1 - 0.6 * luff) + shiver, -6, 22);
                const up = 1 - clamp(s.furl, 0, 1);
                // Mainsail: luff along the mast, foot along the boom, a leech that bellies aft.
                const peak = BOOM + (TOP + 8 - BOOM) * Math.max(up, 0.08), aft = -46;
                const midX = (MAST - 3 + aft) / 2 - belly * up, midY = (peak + BOOM) / 2 - 4 * up;
                main.setAttribute('d', `M ${MAST - 3} ${f(peak)} Q ${f(midX)} ${f(midY)} ${aft} ${BOOM} L ${MAST - 3} ${BOOM} Z`);
                seam.setAttribute('d', up > 0.5 ? `M ${MAST - 3} ${f((peak + BOOM) / 2)} L ${f((midX + (MAST - 3 + aft) / 2) / 2 - 6)} ${f((peak + BOOM) / 2 + 12)}` : '');
                boom.setAttribute('d', `M ${MAST} ${BOOM} L ${aft - 3} ${BOOM}`);
                // Jib: from the masthead to the bow, its leech bellying aft too.
                jib.setAttribute('d', `M ${MAST + 3} ${TOP + 14} L 56 ${DECK - 5} L ${MAST + 5} ${DECK - 5} Q ${f(MAST + 5 - belly * 0.6)} ${f((TOP + DECK) / 2)} ${MAST + 3} ${TOP + 14} Z`);

                // The pennant looks: towards the gaze, thrown back by a move, never still.
                const gx = clamp(s.gazeX, -1, 1);
                const way = clamp((Math.abs(gx) > 0.08 ? gx : -0.6) * 22 - drag[0] * 2.2, -24, 24);
                const flick = 2.2 * Math.sin(t * 7) + shiver, lift = -clamp(s.gazeY, -1, 1) * 6;
                pennant.setAttribute('d', `M ${MAST} ${TOP - 1} Q ${f(MAST + way * 0.5)} ${f(TOP - 5 + flick + lift * 0.5)} ${f(MAST + way)} ${f(TOP + 3 - flick + lift)} Q ${f(MAST + way * 0.5)} ${f(TOP + 4 + flick + lift * 0.5)} ${MAST} ${TOP + 7} Z`);

                // The water: level, at the floor, running back as the boat goes.
                const [cx] = P(0, 0);
                water.setAttribute('transform', `translate(${f(cx)} ${f(ground)}) scale(${f(scale)})`);
                // Waves stay where they are on the sea while the boat goes through them, and drift astern.
                const span = 75 + swell * 235, gap = (span * 2) / ripples.length, here = (s.x || 0) / scale;
                ripples.forEach((path, i) => {
                    const far = i % 2;
                    const run = (((i * gap + (far ? gap * 0.4 : 0) - t * (9 + wind * 10) * (far ? 0.6 : 1) - here) % (span * 2)) + span * 2) % (span * 2) - span;
                    const edge = clamp(1.25 - 1.25 * Math.abs(run) / span, 0, 1);
                    const w = 10 + swell * 9 + (i % 3) * 3, tall = (3.5 + swell * 6.5) * (far ? 0.7 : 1);
                    const y = -1.5 - far * (3 + swell * 5) + (far ? 0 : 1.2 * swell * Math.sin(t * 1.5 + i));
                    path.setAttribute('d', `M ${f(run - w)} ${f(y)} q ${f(w / 2)} ${f(-tall)} ${w} 0 q ${f(w / 2)} ${f(tall)} ${w} 0`);
                    path.setAttribute('opacity', f(edge * (far ? 0.55 : 1)));
                });
            },
        };
    },
};

export const boat = {
    name: 'boat',
    style: 'trait-et-or',
    line: 2.2,
    limbs: 'none',
    arms: 'none',
    sits: false,
    head,
    // No legs to speak of: the keel rides just above the floor, and a "step" is a short glide.
    proportions: { thigh: 4, shin: 4, reach: DRAFT, stride: 6, lift: 0, upper: 4, fore: 4 },
};
