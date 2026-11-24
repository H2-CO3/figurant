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
//       boat, which heaves and pitches on them;
//   `sunk` 0 -> 1 fills it with water: it goes down, to the masthead.
// It says how it moves on its water in `heave` (units, down) and `roll`
// (degrees), for whoever stands on its deck.
// Somebody may stand in it: the deck is 12 units above the middle of the
// hull, between the mast and the stern. Its hull is drawn over them, its rig
// behind them (when they come after it in a scene's cast).

import { kit, INK, FINE, THREAD, DETAIL } from '../kit.js';

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const f = n => n.toFixed(2);

/** The keel, the deck and the mast, in the boat's own units (the bow to the right). */
const KEEL = 30, DECK = 12, MAST = 14, TOP = -84, BOOM = 2;
/** The water under the keel. */
const DRAFT = 5;

/** How far down it goes when it founders (`sunk` 1): the masthead under the water. */
const SINK = 122;
let boats = 0;

const head = {
    create({ stage, layer, line }) {
        // In two parts, so that somebody can stand in it: the rig stays in the
        // boat's own layer, behind whoever comes after it in a scene; the hull
        // and the water go over everybody (moved there the first time it is drawn).
        // Each part can be cut at the waterline: what founders is not seen under it.
        const clipId = `boat-waterline-${++boats}`;
        const sea = stage.el('rect', stage.el('clipPath', layer, { id: clipId, clipPathUnits: 'userSpaceOnUse' }), { x: -100000, y: -100000, width: 200000, height: 100000 });
        const aloft = stage.el('g', layer);
        const rig = stage.el('g', aloft);
        const front = stage.el('g', layer, { 'data-fig-layer': 'boat-hull' });
        const afloat = stage.el('g', front);
        const group = stage.el('g', afloat);
        const k = kit(stage, group, line), r = kit(stage, rig, line);

        // Behind the mast: the mainsail and its boom. Ahead of it: the jib.
        const main = r.gold(rig, '', THREAD);
        const seam = r.ink(rig, '', FINE);
        const jib = r.gold(rig, '', THREAD);
        const boom = r.ink(rig, '', DETAIL);
        r.ink(rig, `M ${MAST} ${DECK} L ${MAST} ${TOP}`, DETAIL * 1.3);
        r.ink(rig, `M ${MAST} ${TOP + 6} L 70 ${DECK - 7}`, FINE);              // the forestay, to the bowsprit
        r.ink(rig, `M ${MAST} ${TOP + 6} L -52 ${DECK - 2}`, FINE);             // the backstay
        const pennant = r.solid(rig, '');
        r.dot(rig, MAST, TOP, 2);
        // The hull: a gold contour with a sheer (low amidships, the bow raised), a
        // wale and two planks, a bowsprit, a rudder and its tiller.
        k.ink(group, `M 58 ${DECK - 4} L 72 ${DECK - 8}`, DETAIL * 1.2);
        k.ink(group, `M -53 ${DECK + 2} L -58 ${KEEL + 3} M -54 ${DECK - 1} L -44 ${DECK - 7}`, DETAIL);
        k.gold(group, `M -56 ${DECK - 2} Q 2 ${DECK + 5} 64 ${DECK - 6} Q 55 ${KEEL - 2} 28 ${KEEL} L -34 ${KEEL} Q -50 ${KEEL - 1} -56 ${DECK - 2} Z`);
        k.ink(group, `M -53 ${DECK + 3} Q 2 ${DECK + 10} 60 ${DECK - 1}`, DETAIL);
        k.ink(group, `M -49 ${DECK + 9} Q 2 ${DECK + 15} 55 ${DECK + 5} M -43 ${DECK + 14} Q 2 ${DECK + 19} 47 ${DECK + 11}`, FINE);
        k.dot(group, 64, DECK - 6, 2.2); k.dot(group, -56, DECK - 2, 2.2);
        // Drawn last, over the keel: the boat sits in it.
        const water = stage.el('g', front);
        const ripples = Array.from({ length: 12 }, (_, i) => stage.el('path', water, { fill: 'none', stroke: INK, 'stroke-width': line * (i % 2 ? FINE : DETAIL), 'stroke-linecap': 'round' }));
        let placed = false;

        const frame = { hips: [[-8, KEEL], [8, KEEL]], shoulders: [[-20, DECK], [20, DECK]], hipY: KEEL, top: [MAST, TOP - 6], soft: 0.2 };
        return {
            state: { gazeX: 0, gazeY: 0, lid: 1, wide: 0, squint: 0, wind: 0.35, furl: 0, swell: 0.25, sunk: 0, heave: 0, roll: 0 },
            frame: () => frame,
            destroy() { front.remove(); },
            draw({ state: s, P, matrix, k: scale, drag, ground }) {
                // The hull goes over everybody, once the scene has made them all.
                if (!placed) { placed = true; const page = layer.parentNode?.parentNode; if (page?.appendChild) page.appendChild(front); }
                const t = s.clock / 1000;
                const wind = clamp(s.wind, 0, 1), luff = clamp(s.wide, 0, 1), slack = 1 - clamp(s.lid, 0, 1);
                // It rolls by itself, heels with the wind, and is tipped back by a start.
                // Full of water, it rolls less, and goes down.
                const swell = clamp(s.swell, 0, 1), sunk = clamp(s.sunk, 0, 1);
                const roll = ((1.6 + swell * 3.4) * Math.sin(t * 1.5) + wind * 1.5 - clamp(drag[0], -8, 8) * 0.25) * (1 - 0.75 * sunk);
                const heave = (0.9 + swell * 4.1) * Math.sin(t * 1.5 + 1) * (1 - 0.75 * sunk) + sunk * SINK;
                s.roll = roll; s.heave = heave;
                // Foundering: what is under the waterline is cut away.
                sea.setAttribute('height', f(100000 + ground - 3 * scale));
                for (const part of [aloft, afloat]) part.setAttribute('clip-path', sunk > 0 ? `url(#${clipId})` : 'none');
                const m = matrix.map(n => n.toFixed(4)).join(' ');
                for (const part of [group, rig]) part.setAttribute('transform', `matrix(${m}) rotate(${f(roll)} 0 ${KEEL}) translate(0 ${f(heave)})`);

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
